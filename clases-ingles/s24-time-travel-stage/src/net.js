// Live link between the kids' devices and the teacher's view, with no accounts.
// Uses MQTT 3.1.1 over secure WebSocket on two free public brokers at once
// (messages are de-duplicated), plus AES-GCM encryption keyed by the class code,
// so the brokers only ever see random topic ids and unreadable bytes.
// No names travel: players are "p0" / "p1"; the page maps them to names.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const PUBLIC_BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];

// ---------- crypto helpers ----------
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function makeKey(room) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`cca-saga-key|${room}`));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + data.length);
  out.set(iv, 0);
  out.set(data, 12);
  return out;
}
async function open(key, bytes) {
  const iv = bytes.slice(0, 12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, bytes.slice(12));
  return JSON.parse(dec.decode(plain));
}

// ---------- minimal MQTT 3.1.1 client (QoS 0) ----------
function varLen(n) {
  const out = [];
  do {
    let b = n % 128;
    n = Math.floor(n / 128);
    if (n > 0) b |= 0x80;
    out.push(b);
  } while (n > 0);
  return out;
}
function str(s) {
  const b = enc.encode(s);
  return [b.length >> 8, b.length & 255, ...b];
}
function packet(type, body) {
  const head = [type, ...varLen(body.length)];
  const out = new Uint8Array(head.length + body.length);
  out.set(head, 0);
  out.set(body, head.length);
  return out;
}

class MqttWs {
  constructor(url, onMessage, onState) {
    this.url = url;
    this.onMessage = onMessage;
    this.onState = onState;
    this.subs = new Set();
    this.buf = new Uint8Array(0);
    this.connected = false;
    this.closed = false;
    this.pid = 1;
    this.connect();
  }
  connect() {
    if (this.closed) return;
    let ws;
    try {
      ws = new WebSocket(this.url, 'mqtt');
    } catch (e) {
      return this.retry();
    }
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      const id = 'cca' + Math.random().toString(36).slice(2, 12);
      const body = [...str('MQTT'), 4, 0x02, 0, 60, ...str(id)];
      ws.send(packet(0x10, body));
    };
    ws.onmessage = (ev) => this.feed(new Uint8Array(ev.data));
    ws.onclose = () => {
      this.setConnected(false);
      this.retry();
    };
    ws.onerror = () => {};
  }
  retry() {
    clearInterval(this.ping);
    if (this.closed) return;
    clearTimeout(this.rt);
    this.rt = setTimeout(() => this.connect(), 3000);
  }
  setConnected(v) {
    if (this.connected === v) return;
    this.connected = v;
    this.onState();
  }
  feed(chunk) {
    const b = new Uint8Array(this.buf.length + chunk.length);
    b.set(this.buf, 0);
    b.set(chunk, this.buf.length);
    this.buf = b;
    for (;;) {
      if (this.buf.length < 2) return;
      let mult = 1, len = 0, i = 1, byte;
      do {
        if (i >= this.buf.length) return;
        byte = this.buf[i++];
        len += (byte & 127) * mult;
        mult *= 128;
      } while (byte & 128);
      if (this.buf.length < i + len) return;
      const type = this.buf[0], body = this.buf.slice(i, i + len);
      this.buf = this.buf.slice(i + len);
      this.handle(type, body);
    }
  }
  handle(type, body) {
    const kind = type >> 4;
    if (kind === 2) {
      // CONNACK
      if (body[1] !== 0) return;
      this.setConnected(true);
      for (const t of this.subs) this.sendSub(t);
      clearInterval(this.ping);
      this.ping = setInterval(() => this.send(new Uint8Array([0xc0, 0x00])), 30000);
    } else if (kind === 3) {
      // PUBLISH
      const qos = (type >> 1) & 3;
      const tl = (body[0] << 8) | body[1];
      const topic = dec.decode(body.slice(2, 2 + tl));
      const start = 2 + tl + (qos > 0 ? 2 : 0);
      this.onMessage(topic, body.slice(start));
    }
  }
  send(bytes) {
    if (this.ws && this.ws.readyState === 1) {
      try {
        this.ws.send(bytes);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  sendSub(topic) {
    const id = this.pid++ & 0xffff || 1;
    this.send(packet(0x82, [id >> 8, id & 255, ...str(topic), 0]));
  }
  subscribe(topic) {
    this.subs.add(topic);
    if (this.connected) this.sendSub(topic);
  }
  publish(topic, payload, retain) {
    const body = new Uint8Array([...str(topic), ...payload]);
    return this.send(packet(0x30 | (retain ? 1 : 0), body));
  }
  close() {
    this.closed = true;
    clearInterval(this.ping);
    clearTimeout(this.rt);
    try {
      this.ws && this.ws.close();
    } catch (e) {
      /* already closed */
    }
  }
}

// ---------- Supabase Realtime broadcast (Phoenix protocol, port 443) ----------
// A second kind of channel on the standard HTTPS port, for networks that block MQTT ports.
// Broadcast keeps nothing: the kids re-send their state every few seconds.
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
class SupaBroadcast {
  constructor(cfg, channel, onMessage, onState) {
    this.cfg = cfg;
    this.topic = `realtime:${channel}`;
    this.onMessage = onMessage;
    this.onState = onState;
    this.connected = false;
    this.closed = false;
    this.ref = 1;
    this.connect();
  }
  connect() {
    if (this.closed) return;
    const host = this.cfg.url.replace(/^http/, 'ws').replace(/\/$/, '');
    let ws;
    try {
      ws = new WebSocket(`${host}/realtime/v1/websocket?apikey=${encodeURIComponent(this.cfg.key)}&vsn=1.0.0`);
    } catch (e) {
      return this.retry();
    }
    this.ws = ws;
    ws.onopen = () => {
      this.joinRef = String(this.ref++);
      this.raw({ topic: this.topic, event: 'phx_join', join_ref: this.joinRef, ref: this.joinRef,
        payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false } } });
      clearInterval(this.hb);
      this.hb = setInterval(() => this.raw({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(this.ref++) }), 25000);
    };
    ws.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m.event === 'phx_reply' && m.ref === this.joinRef) this.setConnected(m.payload && m.payload.status === 'ok');
      else if (m.event === 'broadcast' && m.payload && m.payload.payload) {
        const p = m.payload.payload;
        if (p.t && p.b) this.onMessage(p.t, unb64(p.b));
      } else if (m.event === 'phx_error' || m.event === 'phx_close') this.setConnected(false);
    };
    ws.onclose = () => {
      this.setConnected(false);
      this.retry();
    };
    ws.onerror = () => {};
  }
  raw(obj) {
    if (this.ws && this.ws.readyState === 1) {
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  retry() {
    clearInterval(this.hb);
    if (this.closed) return;
    clearTimeout(this.rt);
    this.rt = setTimeout(() => this.connect(), 4000);
  }
  setConnected(v) {
    if (this.connected === v) return;
    this.connected = v;
    this.onState();
  }
  subscribe() {}
  publish(topic, payload) {
    if (!this.connected) return false;
    return this.raw({ topic: this.topic, event: 'broadcast', join_ref: this.joinRef, ref: String(this.ref++),
      payload: { type: 'broadcast', event: 'm', payload: { t: topic, b: b64(payload) } } });
  }
  close() {
    this.closed = true;
    clearInterval(this.hb);
    clearTimeout(this.rt);
    try {
      this.ws && this.ws.close();
    } catch (e) {
      /* already closed */
    }
  }
}

const match = (pattern, key) => {
  const a = pattern.split('/'), b = key.split('/');
  return a.length === b.length && a.every((p, i) => p === '+' || p === b[i]);
};

// ---------- room transport: publish(key, obj, retain) / sub(pattern, cb) ----------
export async function joinRoom(room, gameId, brokers = PUBLIC_BROKERS, onStatus = () => {}, supabase = null) {
  const roomId = (await sha256Hex(`cca-saga-topic|${room}`)).slice(0, 20);
  const prefix = `ccasaga/${roomId}/${gameId}/`;
  const key = await makeKey(room);
  const handlers = [];
  const seen = new Map();
  const status = () => onStatus(clients.filter((c) => c.connected).length, clients.length);
  const onMessage = async (topic, bytes) => {
    if (!topic.startsWith(prefix) || !bytes.length) return;
    let msg;
    try {
      msg = await open(key, bytes);
    } catch (e) {
      return; // not ours or corrupted
    }
    if (!msg || !msg._mid) return;
    if (seen.has(msg._mid)) return; // same message from the second broker
    seen.set(msg._mid, Date.now());
    if (seen.size > 500) for (const [k, t] of seen) if (Date.now() - t > 120000) seen.delete(k);
    const k = topic.slice(prefix.length);
    for (const h of handlers) if (match(h.pattern, k)) h.cb(k, msg.d);
  };
  const clients = brokers.map((u) => new MqttWs(u, onMessage, status));
  if (supabase && supabase.url && supabase.key) clients.push(new SupaBroadcast(supabase, `ccasaga-${roomId}`, onMessage, status));
  status();
  return {
    room,
    async publish(k, obj, retain = false) {
      const payload = await seal(key, { _mid: Math.random().toString(36).slice(2) + Date.now().toString(36), d: obj });
      let sent = 0;
      for (const c of clients) if (c.publish(prefix + k, payload, retain)) sent++;
      return sent;
    },
    sub(pattern, cb) {
      const h = { pattern, cb };
      handlers.push(h);
      for (const c of clients) c.subscribe(prefix + pattern);
      return () => {
        const i = handlers.indexOf(h);
        if (i >= 0) handlers.splice(i, 1);
      };
    },
    connected: () => clients.filter((c) => c.connected).length,
    close() {
      clients.forEach((c) => c.close());
    },
  };
}

// A short class code that is easy to read aloud and type (no 0/O, 1/I/L).
export function newRoomCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(4));
  return [...r].map((x) => A[x % A.length]).join('');
}
