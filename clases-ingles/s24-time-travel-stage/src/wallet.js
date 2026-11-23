// Each kid's crystal wallet: crystals, things bought and "My Look".
// The class database (Supabase function saga_wallet) is the real copy; the device keeps a copy
// and a queue of changes, so the game never waits and works without internet.
import { DB } from './db.js';

const lsGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch (e) {
    /* private mode */
  }
};

export function makeWallet(player, online) {
  const key = `ccaWallet:${player}`;
  let saved = null;
  try {
    saved = JSON.parse(lsGet(key) || 'null');
  } catch (e) {
    saved = null;
  }
  const w = {
    player,
    crystals: saved ? saved.crystals : 0,
    owned: saved ? saved.owned || [] : [],
    look: saved ? saved.look || null : null,
    queue: saved ? saved.queue || [] : [],
    listeners: [],
  };
  const keep = () => lsSet(key, JSON.stringify({ crystals: w.crystals, owned: w.owned, look: w.look, queue: w.queue }));
  const changed = () => w.listeners.forEach((f) => f(w));
  const apply = (d) => {
    if (!d || typeof d.crystals !== 'number') return;
    w.crystals = d.crystals;
    w.owned = Array.isArray(d.owned) ? d.owned : [];
    if (d.look) w.look = d.look;
  };
  let running = null;
  async function syncNow() {
    if (!online()) return;
    // send what is waiting, in order; a change the database refuses is dropped
    while (w.queue.length) {
      const op = w.queue[0];
      const r = await DB.wallet(player, op);
      if (!r.ok && (r.status === 0 || r.status >= 500 || r.status === 404)) return; // try again later
      w.queue.shift();
      if (r.ok) apply(r.data);
      keep();
    }
    const r = await DB.wallet(player, { op: 'get' });
    if (r.ok) {
      apply(r.data);
      keep();
      changed();
    }
  }
  w.sync = () => {
    if (!running) running = syncNow().finally(() => (running = null));
    return running;
  };
  w.onChange = (f) => w.listeners.push(f);
  w.earn = (n) => {
    n = Math.max(0, Math.round(n));
    if (!n) return;
    w.crystals += n;
    const last = w.queue[w.queue.length - 1];
    if (last && last.op === 'earn' && last.amount + n <= 200) last.amount += n;
    else w.queue.push({ op: 'earn', amount: n });
    keep();
    changed();
    w.sync();
  };
  w.has = (id) => w.owned.includes(id);
  w.buy = (id, price) => {
    if (w.has(id)) return true;
    if (w.crystals < price) return false;
    w.crystals -= price;
    w.owned.push(id);
    w.queue.push({ op: 'buy', item: id, price });
    keep();
    changed();
    w.sync();
    return true;
  };
  w.setLook = (look) => {
    w.look = look;
    w.queue = w.queue.filter((o) => o.op !== 'look');
    w.queue.push({ op: 'look', look });
    keep();
    w.sync();
  };
  return w;
}
