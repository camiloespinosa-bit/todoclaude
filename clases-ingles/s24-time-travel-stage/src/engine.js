// CCA Time Travel Saga · reusable 3D game engine (one game per block, content in src/games/*.js)
// The child walks a Time Traveler through 4 worlds. Same mechanics everywhere:
// walk, jump, step on the answer, talk on the stage, go into the portal.
import * as THREE from 'three';
import { OBJECTS, makeObject, mat, mesh, at, rod } from './objects.js';
import { ACTIONS, LADDER_VERBS, DREAMS, OPINIONS } from './content.js';
import { joinRoom, newRoomCode, PUBLIC_BROKERS, SAGA_SUPABASE } from './net.js';
import { openTeacher, signPass, checkPass } from './pass.js';
import { DB } from './db.js';
import { makeWallet } from './wallet.js';
import { SLOTS, ITEMS, SKINS, PAID_COLORS, GOLD, defaultLook, colorName } from './looks.js';

const $ = (id) => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- Config ----------
const params = new URLSearchParams(location.search);
const TALK_SECONDS = clamp(parseInt(params.get('t'), 10) || 60, 3, 600);
const SAY_SECONDS = 10;
const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>';

const DEFAULT_PLAYERS = [
  { name: 'Jerónimo', suit: '#145389', scarf: '#FDD835', hair: '#3B2A20', long: false },
  { name: 'Luciana', suit: '#F57C00', scarf: '#57A6B5', hair: '#5A3A22', long: true },
];
let GAME = null;
// On the website nobody plays without a class code opened by the teacher.
// The teacher view needs the teacher key (?profe=KEY, remembered on that device); the key is
// checked by opening the sealed signing key (src/pass.js), it is not stored in the page.
// Kids' links carry a pass signed by the teacher (?room=CODE&pase=...), valid until its date.
const WEB = /^https?:$/.test(location.protocol);
let WORLDS = [];
let PLAYERS = DEFAULT_PLAYERS;

// ---------- Map (same layout in every world) ----------
const ISLAND_R = 39.5;
const SPAWN = V(0, 0, 31);
const LANDMARK = V(0, 0, -6);
const STAGE = { x: 23, z: -4, r: 3.6, top: 0.5 };
const PORTAL = { x: 0, z: -34 };
const PADS = { start: V(-22, 0, 0), xs: [-30, -22.5, -15], z: -9.5, half: 2.4 };
const ZONES = { start: V(-16, 0, -15), a: V(-24, 0, -24), b: V(-7.5, 0, -25), r: 4.3 };
const OPIN = { start: V(16, 0, -15), a: V(8.5, 0, -25), b: V(23, 0, -24), r: 4.3 };
const LADDER = { z: -14.5, xs: [7, 10.4, 13.8, 17.2, 20.6, 24], half: 1.4 };
const COLLECT_SPOTS = [
  { x: -14, z: 22, top: 0 },
  { x: 14, z: 22, top: 1.2, r: 2.4 },
  { x: -27, z: 10, top: 1.2, r: 2.4 },
  { x: 27, z: 10, top: 0 },
  { x: -8, z: 9, top: 2.4, r: 2.2, step: { x: -8, z: 12.6, top: 1.2, r: 1.8 } },
  { x: 9, z: 10, top: 0 },
  { x: -20, z: 30, top: 0 },
  { x: 20, z: 29, top: 1.2, r: 2.2 },
];
const ACTION_SPOTS = [V(-15, 0, 21), V(15, 0, 21), V(-26, 0, 9), V(26, 0, 9), V(-7, 0, 10), V(8, 0, 10)];
const TRAMPOLINES = [V(-31, 0, 19), V(31, 0, -9), V(-5, 0, 24)];

const PRON = (npc) => (npc.she ? 'She' : 'He');

// ---------- WebGL ----------
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
function showNoGL() {
  $('nogl').classList.add('on');
  $('ui').style.display = 'none';
}
let renderer = null;
export function runGame(cfg) {
  GAME = cfg;
  PLAYERS = cfg.players || DEFAULT_PLAYERS;
  WORLDS = cfg.worlds.map((w) => ({ theme: w.key, ...w }));
  document.title = cfg.title || document.title;
  const setText = (id, v) => { const el = $(id); if (el && v != null) el.innerHTML = v; };
  setText('t-brand', cfg.brand);
  setText('t-h1', cfg.h1);
  setText('t-ask', cfg.ask);
  setText('b-sub', cfg.briefLine);
  setText('b-worlds', WORLDS.map((w) => `<span style="background:${w.color};${w.theme === 'arena' ? 'color:var(--blue)' : ''}">${w.short.toUpperCase()}</span>`).join(''));
  if (!webglAvailable()) return showNoGL();
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return showNoGL();
  }
  const ready = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('800 100px Poppins'), document.fonts.load('700 40px Poppins')])
    : Promise.resolve();
  ready.then(start, start);
}

function start() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = false;

  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1200);

  // ---------- Sky + lights ----------
  const skyU = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vP = w.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.1, 0.6, h)), 1.0);\n#include <colorspace_fragment>\n}',
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);
  const hemi = new THREE.HemisphereLight('#FFFFFF', '#888888', 2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.2);
  sun.position.set(25, 40, 30);
  scene.add(sun);
  scene.fog = new THREE.Fog('#FFFFFF', 60, 170);

  const nightStars = (() => {
    const n = 900, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 500, s = Math.sqrt(1 - u * u);
      p.set([r * s * Math.cos(th), Math.abs(r * u) * 0.9 + 20, r * s * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFFFFF', size: 2.2, sizeAttenuation: false, fog: false }));
    pts.visible = false;
    return pts;
  })();
  scene.add(nightStars);

  function applyAtmosphere(w) {
    skyU.top.value.set(w.skyTop);
    skyU.bottom.value.set(w.skyBottom);
    scene.fog.color.set(w.fog);
    hemi.color.set(w.hemi[0]);
    hemi.groundColor.set(w.hemi[1]);
    hemi.intensity = w.hemi[2];
    sun.color.set(w.sun[0]);
    sun.intensity = w.sun[1];
    nightStars.visible = w.theme === 'future' || w.theme === 'finale';
  }

  // ---------- Shared helpers ----------
  const glow = (color, opacity = 0.35) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });

  function textSprite(text, { bg = '#1D3F54', fg = '#FFFFFF', w = 1024, h = 220, font = 112, scale = 1 } = {}) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.userData.draw = (t, bgc = bg, fgc = fg) => {
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      if (t) {
        let fs = font;
        ctx.font = `800 ${fs}px Poppins, "Segoe UI", Arial, sans-serif`;
        while (ctx.measureText(t).width > w - 110 && fs > 30) {
          fs -= 4;
          ctx.font = `800 ${fs}px Poppins, "Segoe UI", Arial, sans-serif`;
        }
        const tw = Math.min(w - 20, ctx.measureText(t).width + 100);
        ctx.fillStyle = bgc;
        ctx.beginPath();
        const x0 = (w - tw) / 2, rr = (h - 40) / 2;
        if (ctx.roundRect) ctx.roundRect(x0, 20, tw, h - 40, rr);
        else ctx.rect(x0, 20, tw, h - 40);
        ctx.fill();
        ctx.fillStyle = fgc;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t, w / 2, h / 2 + fs * 0.04);
      }
      tex.needsUpdate = true;
    };
    sp.userData.draw(text);
    sp.scale.set((w / h) * 2 * scale, 2 * scale, 1);
    return sp;
  }

  // ---------- Particles ----------
  const parts = [];
  const partGeo = new THREE.OctahedronGeometry(0.22, 0);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45, a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 1 });
  starGeo.center();
  const starMat = new THREE.MeshStandardMaterial({ color: '#FDD835', emissive: '#C79100', emissiveIntensity: 0.5, flatShading: true, roughness: 0.4 });
  const partMats = {};
  function burst(pos, colors, n = 18, opts = {}) {
    const { speed = 6, up = 6, life = 1.2, geo = partGeo, size = 1, gravity = 14, parent = scene } = opts;
    for (let k = 0; k < n; k++) {
      const c = colors[k % colors.length];
      const m = geo === starGeo ? starMat : (partMats[c] ||= new THREE.MeshBasicMaterial({ color: c }));
      const p = new THREE.Mesh(geo, m);
      p.position.copy(pos);
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      p.userData = { vel: V(Math.cos(a) * s, up * (0.6 + Math.random() * 0.8), Math.sin(a) * s), life: 0, max: life * (0.7 + Math.random() * 0.5), size: size * (0.7 + Math.random() * 0.6), gravity };
      p.scale.setScalar(p.userData.size);
      parent.add(p);
      parts.push(p);
    }
  }
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], u = p.userData;
      u.life += dt;
      u.vel.y -= u.gravity * dt;
      p.position.addScaledVector(u.vel, dt);
      p.rotation.x += dt * 5;
      p.rotation.y += dt * 4;
      const k = u.life / u.max;
      p.scale.setScalar(u.size * (k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1));
      if (u.life >= u.max) {
        p.parent && p.parent.remove(p);
        parts.splice(i, 1);
      }
    }
  }

  // ---------- Audio ----------
  let actx = null;
  let muted = false;
  function ac() {
    try {
      if (!actx) {
        const A = window.AudioContext || window.webkitAudioContext;
        if (!A) return null;
        actx = new A();
      }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) {
      return null;
    }
  }
  function tone(freq, when, dur, type = 'sine', vol = 0.18, slideTo = 0) {
    if (muted) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + Math.max(0, when);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  function whoosh(dur = 2.8) {
    if (muted) return;
    const a = ac();
    if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf;
    f.type = 'bandpass';
    f.Q.value = 2;
    const t0 = a.currentTime;
    f.frequency.setValueAtTime(200, t0);
    f.frequency.exponentialRampToValueAtTime(2400, t0 + dur * 0.7);
    f.frequency.exponentialRampToValueAtTime(400, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }
  const sfx = {
    click: () => tone(620, 0, 0.08, 'triangle', 0.12),
    jump: () => tone(380, 0, 0.16, 'square', 0.05, 760),
    boing: () => tone(160, 0, 0.45, 'sine', 0.25, 700),
    gem: () => { tone(1318, 0, 0.12, 'triangle', 0.1); tone(1760, 0.07, 0.18, 'triangle', 0.1); },
    pick: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.14)),
    good: () => { tone(659, 0, 0.15, 'triangle', 0.18); tone(988, 0.13, 0.3, 'triangle', 0.18); },
    bad: () => tone(220, 0, 0.3, 'sawtooth', 0.06, 150),
    step: (i) => tone(392 * Math.pow(1.122, i), 0, 0.2, 'triangle', 0.15),
    portal: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.35, 'sine', 0.12)),
    end: () => { tone(880, 0, 0.22, 'sine', 0.25); tone(660, 0.25, 0.35, 'sine', 0.25); },
    stars: (n) => { for (let k = 0; k < n; k++) tone(784 * Math.pow(1.26, k), k * 0.12, 0.25, 'triangle', 0.16); },
    fanfare: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i * 0.14, 0.3, 'triangle', 0.15)),
  };
  const music = { timer: null, next: 0, step: 0, scale: null };
  const PATTERN = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 3, 2, 1, 2];
  function startMusic(scale) {
    stopMusic();
    music.scale = scale;
    if (muted || !scale) return;
    const a = ac();
    if (!a) return;
    music.next = a.currentTime + 0.15;
    music.timer = setInterval(() => {
      const now = a.currentTime;
      while (music.next < now + 0.35) {
        tone(music.scale[PATTERN[music.step % 16]], music.next - now, 0.45, 'triangle', 0.035);
        if (music.step % 4 === 0) tone(music.scale[0] / 2, music.next - now, 0.9, 'sine', 0.05);
        music.step++;
        music.next += 0.3;
      }
    }, 100);
  }
  function stopMusic() {
    if (music.timer) clearInterval(music.timer);
    music.timer = null;
  }

  // ---------- Thumbnails ----------
  const thumbs = {};
  (function makeThumbs() {
    let tr;
    try {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 192;
      tr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
      tr.setPixelRatio(1);
      tr.setSize(192, 192, false);
      tr.setClearColor(0x000000, 0);
      const ts = new THREE.Scene();
      ts.add(new THREE.HemisphereLight('#FFFFFF', '#8FA9BA', 2.2));
      const d = new THREE.DirectionalLight('#FFFFFF', 2.2);
      d.position.set(3, 5, 6);
      ts.add(d);
      const tc = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      tc.position.set(0.9, 1.0, 5.2);
      tc.lookAt(0, 0, 0);
      for (const o of OBJECTS) {
        const obj = makeObject(o.id, 2.3);
        ts.add(obj);
        tr.render(ts, tc);
        thumbs[o.id] = cv.toDataURL('image/png');
        ts.remove(obj);
      }
    } catch (e) {
      /* HUD falls back to names */
    } finally {
      if (tr) {
        tr.dispose();
        tr.forceContextLoss();
      }
    }
  })();
  const objName = (id) => OBJECTS.find((o) => o.id === id).name;
  const thumbImg = (id, alt) => (id && thumbs[id] ? `<img alt="${esc(alt || objName(id))}" src="${thumbs[id]}">` : '');

  // ---------- Characters ----------
  // A traveler or an NPC. Old looks ({suit, hair, long, hero}) still work; "My Look" adds
  // hairStyle, shirt, shoes, print, hat, glasses, back, ears, and wear[] (clothes put on in a challenge).
  function makeAvatar(p) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const skin = p.skin || '#E9B48A';
    const shirt = p.shirt || p.suit;
    const hairStyle = p.hairStyle || (p.long ? 'long' : 'short');
    const glasses = p.glasses || (p.hero ? 'goggles' : 'none');
    const back = p.back || (p.hero ? 'clockpack' : 'none');
    const wear = new Set(p.wear || []);
    const coat = wear.has('raincoat') ? '#FDD835' : wear.has('jacket') ? '#3949AB' : null;
    const leg = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.95, 0);
      g.add(at(mesh(new THREE.BoxGeometry(0.28, 0.9, 0.3), p.pants || '#1D3F54'), 0, -0.45, 0));
      if (wear.has('boots')) g.add(at(mesh(new THREE.BoxGeometry(0.34, 0.42, 0.36), '#795548'), 0, -0.7, 0.02));
      g.add(at(mesh(new THREE.BoxGeometry(0.32, 0.18, 0.46), wear.has('boots') ? '#5D4037' : p.shoes || '#F7FAFC'), 0, -0.86, 0.06));
      body.add(g);
      return g;
    };
    const legL = leg(-0.2), legR = leg(0.2);
    body.add(at(mesh(new THREE.BoxGeometry(0.82, 0.88, 0.52), shirt), 0, 1.4, 0));
    if (coat) {
      body.add(at(mesh(new THREE.BoxGeometry(0.9, 0.94, 0.6), coat), 0, 1.38, 0));
      body.add(at(mesh(new THREE.BoxGeometry(0.06, 0.8, 0.02), '#ECEFF1'), 0, 1.38, 0.31));
    }
    body.add(at(mesh(new THREE.BoxGeometry(0.86, 0.14, 0.56), '#1D3F54'), 0, 1.02, 0));
    if (p.hero) {
      const buckle = at(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), '#FDD835'), 0, 1.02, 0.29);
      buckle.rotation.x = Math.PI / 2;
      body.add(buckle);
    }
    // T-shirt picture
    if (!coat && p.print && p.print !== 'none') {
      const sh = new THREE.Shape();
      if (p.print === 'star') {
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 0.09 : 0.2, a2 = (i / 10) * Math.PI * 2 + Math.PI / 2;
          i ? sh.lineTo(Math.cos(a2) * r, Math.sin(a2) * r) : sh.moveTo(Math.cos(a2) * r, Math.sin(a2) * r);
        }
      } else if (p.print === 'heart') {
        sh.moveTo(0, -0.17);
        sh.bezierCurveTo(-0.3, 0.02, -0.12, 0.24, 0, 0.09);
        sh.bezierCurveTo(0.12, 0.24, 0.3, 0.02, 0, -0.17);
      } else {
        [[0.05, 0.22], [-0.1, 0.0], [0.0, 0.0], [-0.06, -0.22], [0.11, 0.04], [0.01, 0.04], [0.09, 0.22]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
      }
      const pic = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(p.print === 'heart' ? '#EC407A' : '#FDD835'));
      pic.position.set(0, 1.48, 0.265);
      body.add(pic);
    }
    // on the back
    if (back === 'clockpack') {
      body.add(at(mesh(new THREE.BoxGeometry(0.62, 0.66, 0.3), '#2C5F7C'), 0, 1.45, -0.4));
      const clockFace = at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), '#FDD835', { emissive: '#B08800', emissiveIntensity: 0.6 }), 0, 1.5, -0.57);
      clockFace.rotation.x = Math.PI / 2;
      body.add(clockFace);
    } else if (back === 'backpack') {
      body.add(at(mesh(new THREE.BoxGeometry(0.64, 0.72, 0.3), '#43A047'), 0, 1.42, -0.41));
      body.add(at(mesh(new THREE.BoxGeometry(0.44, 0.3, 0.1), '#2E7D32'), 0, 1.3, -0.6));
    } else if (back === 'cape') {
      const cape = at(mesh(new THREE.BoxGeometry(0.92, 1.25, 0.05), '#C62828'), 0, 1.2, -0.33);
      cape.rotation.x = 0.12;
      body.add(cape);
    }
    const arm = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 1.78, 0);
      g.add(at(mesh(new THREE.BoxGeometry(0.22, 0.74, 0.24), coat || shirt), 0, -0.36, 0));
      g.add(at(mesh(new THREE.SphereGeometry(0.14, 8, 6), skin), 0, -0.8, 0));
      body.add(g);
      return g;
    };
    const armL = arm(-0.53), armR = arm(0.53);
    const scarfColor = wear.has('scarf') ? '#E53935' : p.scarf;
    if (scarfColor && scarfColor !== 'none') {
      const scarf = at(mesh(new THREE.TorusGeometry(0.3, wear.has('scarf') ? 0.15 : 0.11, 6, 14), scarfColor), 0, 1.86, 0);
      scarf.rotation.x = Math.PI / 2;
      body.add(scarf);
    }
    const tail = new THREE.Group();
    tail.position.set(0.18, 1.86, -0.28);
    if (p.hero && scarfColor && scarfColor !== 'none') tail.add(at(mesh(new THREE.BoxGeometry(0.2, 0.08, 0.6), scarfColor), 0, 0, -0.3));
    body.add(tail);
    const head = new THREE.Group();
    head.position.y = 2.35;
    body.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.48, 14, 10), skin));
    const hat = wear.has('cap') ? 'cap' : p.hat || 'none';
    // hair (a hat hides the top)
    if (hairStyle !== 'none') {
      const hair = mesh(new THREE.SphereGeometry(0.51, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), p.hair);
      hair.rotation.x = -0.3;
      hair.position.set(0, 0.05, -0.03);
      head.add(hair);
      if (hairStyle === 'long') {
        head.add(at(mesh(new THREE.BoxGeometry(0.86, 0.75, 0.26), p.hair), 0, -0.3, -0.33));
        head.add(at(mesh(new THREE.SphereGeometry(0.2, 8, 6), p.hair), 0, 0.15, -0.6));
        head.add(at(mesh(new THREE.SphereGeometry(0.1, 8, 6), '#E53935'), 0, 0.3, -0.52));
      } else if (hairStyle === 'spiky' && hat === 'none') {
        for (let i = 0; i < 7; i++) {
          const a2 = (i / 7) * Math.PI * 2;
          const c = at(mesh(new THREE.ConeGeometry(0.12, 0.34, 6), p.hair), Math.cos(a2) * 0.26, 0.48, Math.sin(a2) * 0.26 - 0.05);
          c.rotation.set(Math.sin(a2) * 0.5, 0, -Math.cos(a2) * 0.5);
          head.add(c);
        }
        head.add(at(mesh(new THREE.ConeGeometry(0.13, 0.4, 6), p.hair), 0, 0.6, -0.05));
      } else if (hairStyle === 'curly') {
        for (let i = 0; i < 12; i++) {
          const a2 = (i / 12) * Math.PI * 2;
          head.add(at(mesh(new THREE.SphereGeometry(0.15, 8, 6), p.hair), Math.cos(a2) * 0.45, 0.12 + (i % 2) * 0.12, Math.sin(a2) * 0.42 - 0.08));
        }
        if (hat === 'none') head.add(at(mesh(new THREE.SphereGeometry(0.3, 10, 8), p.hair), 0, 0.42, -0.05));
      }
    }
    const eye = new THREE.SphereGeometry(0.075, 8, 6);
    head.add(at(mesh(eye, '#1D3F54'), -0.17, 0.04, 0.43), at(mesh(eye, '#1D3F54'), 0.17, 0.04, 0.43));
    const cheek = new THREE.SphereGeometry(0.07, 6, 4);
    head.add(at(mesh(cheek, '#F48FB1'), -0.29, -0.1, 0.36), at(mesh(cheek, '#F48FB1'), 0.29, -0.1, 0.36));
    const smile = at(mesh(new THREE.TorusGeometry(0.11, 0.025, 4, 10, Math.PI), '#1D3F54'), 0, -0.12, 0.45);
    smile.rotation.z = Math.PI;
    head.add(smile);
    // glasses
    const shades = wear.has('sunglasses') ? 'sunglasses' : glasses;
    if (shades === 'goggles') {
      for (const s of [-1, 1]) {
        const gg = at(mesh(new THREE.TorusGeometry(0.11, 0.04, 6, 12), '#57A6B5'), s * 0.15, 0.3, 0.42);
        gg.rotation.x = -0.3;
        head.add(gg);
      }
      head.add(at(mesh(new THREE.BoxGeometry(0.98, 0.06, 0.1), '#1D3F54'), 0, 0.3, 0.3));
    } else if (shades === 'sunglasses') {
      for (const s of [-1, 1]) head.add(at(mesh(new THREE.BoxGeometry(0.26, 0.15, 0.05), '#111111'), s * 0.17, 0.05, 0.47));
      head.add(at(mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), '#111111'), 0, 0.08, 0.48));
    } else if (shades === 'round') {
      for (const s of [-1, 1]) head.add(at(mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 14), '#3E2723'), s * 0.17, 0.04, 0.47));
      head.add(at(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), '#3E2723'), 0, 0.06, 0.48));
    }
    // hats
    if (hat === 'cap') {
      head.add(at(mesh(new THREE.SphereGeometry(0.53, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), '#E53935'), 0, 0.06, 0));
      head.add(at(mesh(new THREE.BoxGeometry(0.56, 0.05, 0.42), '#C62828'), 0, 0.1, 0.55));
    } else if (hat === 'beanie') {
      head.add(at(mesh(new THREE.SphereGeometry(0.54, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), '#7E57C2'), 0, 0.05, 0));
      const band = at(mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 18), '#5E35B1'), 0, 0.08, 0);
      band.rotation.x = Math.PI / 2;
      head.add(band, at(mesh(new THREE.SphereGeometry(0.14, 8, 6), '#FFFFFF'), 0, 0.62, 0));
    } else if (hat === 'sunhat') {
      head.add(at(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.05, 20), '#E8C770'), 0, 0.3, 0));
      head.add(at(mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.36, 16), '#E8C770'), 0, 0.48, 0));
      head.add(at(mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.08, 16), '#E53935'), 0, 0.36, 0));
    } else if (hat === 'crown') {
      const gold = { emissive: '#8D6E00', emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.35 };
      head.add(at(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 16, 1, true), '#FDD835', gold), 0, 0.55, 0));
      for (let i = 0; i < 6; i++) {
        const a2 = (i / 6) * Math.PI * 2;
        head.add(at(mesh(new THREE.ConeGeometry(0.07, 0.2, 5), '#FDD835', gold), Math.cos(a2) * 0.34, 0.75, Math.sin(a2) * 0.34));
      }
      head.add(at(mesh(new THREE.SphereGeometry(0.06, 8, 6), '#E53935'), 0, 0.56, 0.37));
    }
    // ears
    if (p.ears === 'headphones') {
      const arc = at(mesh(new THREE.TorusGeometry(0.53, 0.05, 6, 18, Math.PI), '#263238'), 0, 0.05, 0);
      head.add(arc);
      for (const s of [-1, 1]) {
        const cup = at(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12), '#57A6B5'), s * 0.52, 0.02, 0);
        cup.rotation.z = Math.PI / 2;
        head.add(cup);
      }
    }
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    return { root, body, legL, legR, armL, armR, tail, head, blob };
  }

  const NPC_LOOKS = [
    { suit: '#E53935', scarf: '#FFFFFF', hair: '#212121', long: true, skin: '#C68B59', pants: '#2C5F7C' },
    { suit: '#8E24AA', scarf: '#FDD835', hair: '#6D4C41', long: false, skin: '#F1C27D', pants: '#1D3F54' },
    { suit: '#00897B', scarf: '#F57C00', hair: '#FBC02D', long: true, skin: '#FFDBAC', pants: '#455A64' },
    { suit: '#F9A825', scarf: '#1D3F54', hair: '#3E2723', long: false, skin: '#8D5524', pants: '#37474F' },
    { suit: '#1E88E5', scarf: '#E53935', hair: '#4E342E', long: true, skin: '#E0AC69', pants: '#263238' },
    { suit: '#43A047', scarf: '#FFFFFF', hair: '#212121', long: false, skin: '#C68B59', pants: '#1D3F54' },
  ];

  // Builds an NPC doing one S13 action, with its props and animation.
  function makeNPC(action, spot, look, idx) {
    const M = makeAvatar(look);
    const g = new THREE.Group();
    g.position.copy(spot);
    const npc = { action, she: !!look.long, M, group: g, spot: spot.clone(), cool: 0, phase: idx * 1.3 };
    g.add(M.root);
    M.blob.position.set(0, 0.03, 0);
    g.add(M.blob);
    const face = Math.atan2(SPAWN.x - spot.x, SPAWN.z - spot.z);
    M.root.rotation.y = face;
    const hand = (arm, obj) => {
      obj.position.set(0, -0.92, 0.12);
      arm.add(obj);
    };
    let f = () => {};
    const up = Math.PI;
    switch (action) {
      case 'running':
        f = (t) => {
          const a = t * 1.7 + npc.phase;
          M.root.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4);
          M.root.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
          const s = Math.sin(t * 11);
          M.legL.rotation.x = s * 0.9;
          M.legR.rotation.x = -s * 0.9;
          M.armL.rotation.x = -s * 0.9;
          M.armR.rotation.x = s * 0.9;
          M.blob.position.set(M.root.position.x, 0.03, M.root.position.z);
        };
        break;
      case 'waving':
        f = (t) => {
          const fast = npc.talking ? 2.2 : 1;
          M.armR.rotation.set(up - 0.4, 0, 0.5 + Math.sin(t * 6 * fast + npc.phase) * 0.45);
          M.armL.rotation.set(0, 0, -0.08);
          M.head.rotation.z = Math.sin(t * 2 + npc.phase) * 0.12;
          M.body.position.y = npc.talking ? Math.abs(Math.sin(t * 5)) * 0.15 : 0;
        };
        break;
      case 'jumping':
        f = (t) => {
          const j = Math.abs(Math.sin(t * 3.4 + npc.phase));
          M.root.position.y = j * 1.4;
          M.armL.rotation.set(up - 0.3, 0, -0.3);
          M.armR.rotation.set(up - 0.3, 0, 0.3);
          M.legL.rotation.x = M.legR.rotation.x = j > 0.2 ? 0.35 : 0;
        };
        break;
      case 'eating': {
        const apple = mesh(new THREE.SphereGeometry(0.2, 10, 8), '#E53935');
        apple.add(at(mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), '#5D4037'), 0, 0.22, 0));
        hand(M.armR, apple);
        f = (t) => {
          M.armR.rotation.x = -2.1 + Math.max(0, Math.sin(t * 3 + npc.phase)) * 0.5;
          M.head.rotation.x = Math.sin(t * 6) * 0.06;
        };
        break;
      }
      case 'drinking': {
        const cup = mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.36, 10), '#57A6B5');
        cup.add(at(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 10), '#FFFFFF'), 0, 0.17, 0));
        hand(M.armR, cup);
        f = (t) => {
          M.armR.rotation.x = -2.5 + Math.sin(t * 1.5 + npc.phase) * 0.15;
          M.head.rotation.x = -0.25;
        };
        break;
      }
      case 'dancing':
        f = (t) => {
          M.root.rotation.y = face + Math.sin(t * 2) * 1.2;
          M.armL.rotation.set(up + Math.sin(t * 6) * 0.6, 0, -0.4);
          M.armR.rotation.set(up - Math.sin(t * 6) * 0.6, 0, 0.4);
          M.body.position.y = Math.abs(Math.sin(t * 6)) * 0.25;
          M.legL.rotation.x = Math.sin(t * 6) * 0.4;
          M.legR.rotation.x = -Math.sin(t * 6) * 0.4;
        };
        break;
      case 'singing': {
        const mic = makeObject('mic', 0.55);
        mic.rotation.x = -1.2;
        hand(M.armR, mic);
        const notes = [];
        for (let k = 0; k < 3; k++) {
          const n = new THREE.Group();
          n.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), '#1D3F54'));
          n.add(at(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), '#1D3F54'), 0.13, 0.25, 0));
          g.add(n);
          notes.push(n);
        }
        f = (t) => {
          M.armR.rotation.x = -1.75;
          M.head.rotation.z = Math.sin(t * 2.5) * 0.2;
          M.armL.rotation.set(-0.6, 0, -0.6 - Math.sin(t * 2.5) * 0.3);
          notes.forEach((n, k) => {
            const p = (t * 0.5 + k / 3) % 1;
            n.position.set(Math.sin(p * 6 + k) * 0.8, 2.8 + p * 2.2, 0.3);
            n.scale.setScalar(p < 0.85 ? 1 : (1 - p) / 0.15);
          });
        };
        break;
      }
      case 'sleeping': {
        const bed = new THREE.Group();
        bed.add(at(mesh(new THREE.BoxGeometry(1.5, 0.6, 3.2), '#8D6E63'), 0, 0.3, -1.1));
        bed.add(at(mesh(new THREE.BoxGeometry(1.4, 0.18, 3.0), '#FFFFFF'), 0, 0.69, -1.1));
        bed.add(at(mesh(new THREE.BoxGeometry(1.0, 0.25, 0.6), '#B3E5FC'), 0, 0.85, -2.3));
        bed.add(at(mesh(new THREE.BoxGeometry(1.45, 0.12, 1.8), look.suit), 0, 0.82, -0.3));
        g.add(bed);
        M.root.rotation.set(-Math.PI / 2, 0, 0);
        M.root.position.set(0, 0.95, 0.5);
        M.blob.visible = false;
        const z = textSprite('Zzz', { bg: 'rgba(29,63,84,0.85)', w: 512, h: 220, font: 120, scale: 0.45 });
        z.userData.noFade = true;
        g.add(z);
        f = (t) => {
          const p = (t * 0.35 + npc.phase) % 1;
          z.position.set(0.6 + p * 0.6, 2 + p * 1.6, -1.6);
          z.material.opacity = 1 - p;
          M.body.scale.y = 1 + Math.sin(t * 2) * 0.03;
        };
        break;
      }
      case 'reading': {
        const b = makeObject('book', 0.7);
        b.position.set(0, 1.15, 0.7);
        b.rotation.set(-0.6, 0, 0);
        M.body.add(b);
        f = (t) => {
          M.armL.rotation.set(-1.2, 0, -0.35);
          M.armR.rotation.set(-1.2, 0, 0.35);
          M.head.rotation.x = 0.35 + Math.sin(t * 0.8) * 0.05;
        };
        break;
      }
      case 'writing': {
        const desk = new THREE.Group();
        desk.add(at(mesh(new THREE.BoxGeometry(1.8, 0.12, 1.0), '#8D6E63'), 0, 1.15, 0.95));
        for (const [x, z] of [[-0.8, 0.55], [0.8, 0.55], [-0.8, 1.35], [0.8, 1.35]]) desk.add(at(mesh(new THREE.BoxGeometry(0.1, 1.15, 0.1), '#6D4C41'), x, 0.57, z));
        desk.add(at(mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), '#FFFFFF'), 0.1, 1.22, 0.9));
        M.root.add(desk);
        hand(M.armR, mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), '#FDD835'));
        f = (t) => {
          M.armR.rotation.set(-1.05, 0, 0.1 + Math.sin(t * 9) * 0.12);
          M.armL.rotation.set(-0.9, 0, -0.2);
          M.head.rotation.x = 0.45;
        };
        break;
      }
      case 'swimming': {
        const pool = new THREE.Group();
        pool.add(at(mesh(new THREE.CylinderGeometry(3.3, 3.4, 0.5, 20), '#CFD8DC'), 0, 0.25, 0));
        pool.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 0.06, 24), new THREE.MeshStandardMaterial({ color: '#4FC3F7', transparent: true, opacity: 0.85, roughness: 0.2 })), 0, 0.5, 0));
        g.add(pool);
        M.root.rotation.order = 'YXZ';
        M.blob.visible = false;
        f = (t) => {
          const a = t * 0.8 + npc.phase;
          M.root.position.set(Math.cos(a) * 1.6, 0.35, Math.sin(a) * 1.6);
          M.root.rotation.set(Math.PI / 2, Math.atan2(-Math.sin(a), Math.cos(a)), 0);
          M.armL.rotation.x = t * 6;
          M.armR.rotation.x = t * 6 + Math.PI;
          M.legL.rotation.x = Math.sin(t * 12) * 0.4;
          M.legR.rotation.x = -Math.sin(t * 12) * 0.4;
        };
        break;
      }
      case 'clapping':
        f = (t) => {
          const c = Math.abs(Math.sin(t * 7 + npc.phase));
          M.armL.rotation.set(-1.35, 0, 0.25 + c * 0.35);
          M.armR.rotation.set(-1.35, 0, -0.25 - c * 0.35);
          M.body.position.y = c * 0.06;
        };
        break;
      case 'cooking': {
        const stove = new THREE.Group();
        stove.add(at(mesh(new THREE.BoxGeometry(1.6, 1.1, 1.0), '#ECEFF1'), 0, 0.55, 1.05));
        stove.add(at(mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.15, 12), '#37474F'), 0, 1.2, 1.05));
        stove.add(rod(V(0.45, 1.22, 1.05), V(1.0, 1.25, 1.05), 0.05, '#37474F'));
        const steam = [];
        for (let k = 0; k < 3; k++) {
          const s = mesh(new THREE.SphereGeometry(0.2, 8, 6), '#FFFFFF');
          stove.add(s);
          steam.push(s);
        }
        M.root.add(stove);
        hand(M.armR, mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), '#8D6E63'));
        f = (t) => {
          M.armR.rotation.set(-1.0, 0, Math.sin(t * 4) * 0.3);
          steam.forEach((s, k) => {
            const p = (t * 0.6 + k / 3) % 1;
            s.position.set(Math.sin(p * 5 + k) * 0.2, 1.4 + p * 1.6, 1.05);
            s.scale.setScalar(0.5 + p);
            s.visible = p < 0.9;
          });
        };
        break;
      }
    }
    npc.f = f;
    const label = textSprite(`${npc.she ? 'She' : 'He'} is ${action}.`, { bg: '#1D3F54', scale: 0.62 });
    label.position.set(0, 4.4, 0);
    label.visible = false;
    g.add(label);
    npc.label = label;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(action === 'swimming' ? 3.6 : 2.2, 0.08, 6, 28), glow('#FFFFFF', 0.5));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);
    npc.ring = ring;
    return npc;
  }

  // ---------- State ----------
  const S = {
    mode: 'title', // title | brief | play | talk | warp | finale
    player: 0,
    wi: 0,
    q: 0,
    Q: null,
    results: [],
    stars: [],
    clues: [],
    crystals: [],
    crystalsMax: [],
    met: [],
    events: [],
    talkLeft: TALK_SECONDS,
    talkRunning: false,
    paused: false,
    rows: [],
  };
  const AV = { pos: V(), vel: V(), onGround: true, coyote: 0, jumpBuf: 0, yaw: Math.PI, phase: 0, land: 0, model: null };
  const keys = new Set();
  let W = null;

  // ---------- World builder ----------
  function buildWorld(wi) {
    const w = WORLDS[wi];
    const g = new THREE.Group();
    const types = w.quests.map((q) => q.type);
    const B = { def: w, group: g, colliders: [], platforms: [], pickups: [], pads: [], zones: null, opin: null, ladder: [], npcs: [], crystals: [], tramps: [], updaters: [] };

    // island
    g.add(at(mesh(new THREE.CylinderGeometry(42, 41, 2, 32), w.ground), 0, -1, 0));
    const under = at(mesh(new THREE.ConeGeometry(41, 26, 32), w.rock), 0, -15, 0);
    under.rotation.x = Math.PI;
    g.add(under);
    const under2 = at(mesh(new THREE.ConeGeometry(22, 18, 12), w.rock2), 4, -28, 3);
    under2.rotation.x = Math.PI;
    g.add(under2);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const r = at(mesh(new THREE.DodecahedronGeometry(1 + (k % 3) * 0.7, 0), w.rock), Math.cos(a) * (45 + (k % 4) * 3), -6 - (k % 5) * 2.5, Math.sin(a) * (45 + (k % 4) * 3));
      r.userData.spin = 0.2 + (k % 3) * 0.15;
      g.add(r);
    }
    for (let k = 0; k < 12; k++) {
      const a = k * 2.4, rr = 9 + ((k * 5.3) % 26);
      g.add(at(mesh(new THREE.CylinderGeometry(2.5 + (k % 3), 2.5 + (k % 3), 0.06, 8), w.ground2), Math.cos(a) * rr, 0.02, Math.sin(a) * rr));
    }
    const pathTo = (a, b, wd = 3) => {
      const d = new THREE.Vector3().subVectors(b, a);
      const p = at(mesh(new THREE.BoxGeometry(wd, 0.06, d.length()), w.path), (a.x + b.x) / 2, 0.04, (a.z + b.z) / 2);
      p.rotation.y = Math.atan2(d.x, d.z);
      g.add(p);
    };
    const hub = V(0, 0, 4);
    pathTo(SPAWN, hub);
    pathTo(hub, V(PORTAL.x, 0, PORTAL.z + 4));
    pathTo(hub, PADS.start);
    pathTo(hub, V(STAGE.x, 0, STAGE.z));
    if (types.includes('zones')) pathTo(hub, ZONES.start);
    if (types.includes('opinion')) pathTo(hub, OPIN.start);
    if (types.includes('ladder')) pathTo(hub, V(LADDER.xs[0] - 2, 0, LADDER.z));
    for (let k = 0; k < 44; k++) {
      const a = (k / 44) * Math.PI * 2;
      g.add(at(mesh(new THREE.DodecahedronGeometry(0.7 + (k % 3) * 0.25, 0), w.rock), Math.cos(a) * 41.2, 0.3, Math.sin(a) * 41.2));
    }

    // landmark
    const lm = w.landmark || { past: 'hourglass', present: 'clock', future: 'rocket' }[w.theme] || 'trophy';
    const landmark = LANDMARKS[lm] ? LANDMARKS[lm](w) : bigTrophy();
    landmark.position.copy(LANDMARK);
    g.add(landmark);
    B.colliders.push({ x: LANDMARK.x, z: LANDMARK.z, r: 2.6 });
    if (landmark.userData.update) B.updaters.push(landmark.userData.update);

    // key points that decor must avoid
    const keyPts = [SPAWN, hub, LANDMARK, PADS.start, V(STAGE.x, 0, STAGE.z), V(STAGE.x, 0, STAGE.z - 7), V(STAGE.x - 6, 0, STAGE.z - 8), V(STAGE.x + 7, 0, STAGE.z - 5), V(PORTAL.x, 0, PORTAL.z),
      ...PADS.xs.map((x) => V(x, 0, PADS.z)), V(PADS.xs[1], 0, PADS.z - 5.5), ZONES.start, ZONES.a, ZONES.b, OPIN.start, OPIN.a, OPIN.b, ...LADDER.xs.map((x) => V(x, 0, LADDER.z)),
      ...COLLECT_SPOTS.map((p) => V(p.x, 0, p.z)), ...ACTION_SPOTS, ...TRAMPOLINES];
    const free = (x, z, d) => keyPts.every((p) => Math.hypot(p.x - x, p.z - z) > d);
    let n = 0;
    for (let ring = 0; ring < 2; ring++) {
      const R = ring === 0 ? 36 : 30;
      const count = ring === 0 ? 30 : 22;
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + ring * 0.3;
        const x = Math.cos(a) * R, z = Math.sin(a) * R;
        if (!free(x, z, 6.5)) continue;
        if (Math.abs(x) < 5 && z > 8) continue;
        n++;
        const big = n % 3 === 0 && ring === 0;
        const d = big ? building(w, n) : tree(w, n);
        d.position.set(x, 0, z);
        d.rotation.y = -a + Math.PI / 2;
        g.add(d);
        B.colliders.push({ x, z, r: big ? 2.6 : 1.1 });
      }
    }
    if (w.theme === 'past') {
      const wm = windmill();
      wm.position.set(33, 0, 20);
      g.add(wm);
      B.colliders.push({ x: 33, z: 20, r: 2.2 });
      B.updaters.push((t) => (wm.userData.blades.rotation.z = t * 0.8));
    }
    if (w.theme === 'present') {
      const ft = fountain();
      ft.position.set(-33, 0, -2);
      g.add(ft);
      B.colliders.push({ x: -33, z: -2, r: 2.6 });
      for (let k = 0; k < 6; k++) {
        const b = butterfly(['#F57C00', '#FDD835', '#E91E63'][k % 3]);
        g.add(b);
        const c = V(-20 + k * 8, 2.5, 12 - (k % 2) * 18), ph = k;
        B.updaters.push((t) => {
          b.position.set(c.x + Math.sin(t * 0.7 + ph) * 3, c.y + Math.sin(t * 2 + ph) * 0.6, c.z + Math.cos(t * 0.5 + ph) * 3);
          b.rotation.y = t * 0.7 + ph;
          b.userData.wings(t);
        });
      }
    }
    if (w.theme === 'future') {
      for (let k = 0; k < 4; k++) {
        const car = hoverCar(['#FDD835', '#F57C00', '#57A6B5', '#E91E63'][k]);
        g.add(car);
        const R = 48 + k * 6, sp = 0.22 + k * 0.07, h = 9 + k * 4;
        B.updaters.push((t) => {
          const a = t * sp + k * 2;
          car.position.set(Math.cos(a) * R, h, Math.sin(a) * R);
          car.rotation.y = -a;
        });
      }
    }
    if (w.theme === 'arena') {
      for (let k = 0; k < 4; k++) {
        const bal = balloon(['#F57C00', '#57A6B5', '#7CB342', '#E91E63'][k]);
        g.add(bal);
        const c = V(-24 + k * 16, 12, -8 + (k % 2) * 16);
        B.updaters.push((t) => bal.position.set(c.x, c.y + Math.sin(t + k) * 1.2, c.z));
      }
    }

    // trampolines
    for (const tp of TRAMPOLINES) {
      const tg = new THREE.Group();
      tg.position.copy(tp);
      tg.add(at(mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.25, 16), '#1D3F54'), 0, 0.12, 0));
      const pad = at(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16), w.theme === 'arena' ? '#E91E63' : w.color), 0, 0.3, 0);
      tg.add(pad);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 24), glow('#FFFFFF', 0.7));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.33;
      tg.add(rim);
      g.add(tg);
      B.platforms.push({ x: tp.x, z: tp.z, r: 1.6, top: 0.35 });
      B.tramps.push({ x: tp.x, z: tp.z, pad, squash: 0 });
    }

    // time crystals (bonus)
    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crystalMat = mat('#64FFDA', { emissive: '#00BFA5', emissiveIntensity: 0.8, roughness: 0.3 });
    const cryPos = TRAMPOLINES.map((tp) => V(tp.x, 6.5, tp.z));
    if (types.includes('collect')) cryPos.push(V(-8, 4.4, 9));
    let tries = 0;
    while (cryPos.length < 15 && tries < 500) {
      tries++;
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 28;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!free(x, z, 4.5)) continue;
      if (B.colliders.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + 1.5)) continue;
      if (cryPos.some((p) => Math.hypot(p.x - x, p.z - z) < 6)) continue;
      cryPos.push(V(x, 1.2, z));
    }
    for (const p of cryPos) {
      const c = new THREE.Mesh(crystalGeo, crystalMat);
      c.position.copy(p);
      c.scale.set(1, 1.5, 1);
      g.add(c);
      B.crystals.push({ mesh: c, pos: p.clone(), taken: false });
    }

    // quest stations
    const padQs = w.quests.filter((q) => q.type === 'stones' || q.type === 'stations');
    if (padQs.length) buildPads(B, padQs);
    for (const q of w.quests) {
      if (q.type === 'collect') buildCollect(B, q);
      if (q.type === 'actions') buildActions(B);
      if (q.type === 'interview' && !B.people) buildPeople(B, q);
      if (q.type === 'zones' && !B.zones) B.zones = buildTwoAreas(B, ZONES, q.labels, q.subs);
      if (q.type === 'opinion' && !B.opin) B.opin = buildTwoAreas(B, OPIN, ['', ''], ['', '']);
      if (q.type === 'ladder') buildLadder(B, q);
      if (q.type === 'talk') buildStage(B);
      if (q.type === 'portal') buildPortal(B, q);
    }

    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 40, 12, 1, true), glow('#FDD835', 0.14));
    beacon.position.y = 20;
    g.add(beacon);
    B.beacon = beacon;

    // ambient particles
    const N = 300, pp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pp.set([Math.random() * 84 - 42, Math.random() * 18, Math.random() * 84 - 42], i * 3);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pcol = { past: '#E65100', present: '#FFFFFF', future: '#B2FF59', arena: '#FDD835' }[w.theme] || '#FFFFFF';
    g.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ color: pcol, size: w.theme === 'past' ? 0.35 : 0.22, transparent: true, opacity: 0.85, depthWrite: false })));
    B.updaters.push((t, dt) => {
      const a = pgeo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = a.getY(i);
        if (w.theme === 'past') {
          y -= dt * 1.2;
          a.setX(i, a.getX(i) + Math.sin(t * 1.3 + i) * dt * 0.8);
          if (y < 0) y = 18;
        } else {
          y += dt * 0.5;
          if (y > 18) y = 0;
        }
        a.setY(i, y);
      }
      a.needsUpdate = true;
    });
    B.sprites = [];
    g.traverse((o) => o.isSprite && !o.userData.noFade && B.sprites.push(o));
    return B;
  }

  const inkOf = (w) => (w.theme === 'arena' ? '#145389' : w.color);

  function addPlatform(B, x, z, r, top, w) {
    B.group.add(at(mesh(new THREE.CylinderGeometry(r, r * 1.08, top, 10), w.ground2), x, top / 2, z));
    B.group.add(at(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.12, 10), w.light), x, top + 0.02, z));
    B.platforms.push({ x, z, r, top });
  }

  function buildCollect(B, q) {
    const w = B.def;
    const items = q.dreams
      ? shuffle(DREAMS).slice(0, 8).map((d) => ({ id: d.obj, label: d.label, say: d.say }))
      : shuffle(q.items).map((id) => ({ id, label: objName(id), say: '' }));
    COLLECT_SPOTS.slice(0, items.length).forEach((sp, k) => {
      if (sp.top > 0) {
        addPlatform(B, sp.x, sp.z, sp.r, sp.top, w);
        if (sp.step) addPlatform(B, sp.step.x, sp.step.z, sp.step.r, sp.step.top, w);
      }
      const it = items[k];
      const pk = new THREE.Group();
      pk.position.set(sp.x, sp.top, sp.z);
      const obj = makeObject(it.id, 1.7);
      obj.position.y = 1.7;
      pk.add(obj);
      pk.add(at(new THREE.Mesh(new THREE.SphereGeometry(1.35, 16, 12), glow(w.light, 0.18)), 0, 1.7, 0));
      pk.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 16, 10, 1, true), glow('#FFF59D', 0.16)), 0, 8, 0));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 24), glow('#FDD835', 0.8));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      pk.add(ring);
      const label = textSprite(it.label, { bg: inkOf(w), font: 120, scale: q.dreams ? 0.7 : 0.55 });
      label.position.y = 3.6;
      pk.add(label);
      B.group.add(pk);
      B.pickups.push({ ...it, group: pk, obj, ring, x: sp.x, z: sp.z, top: sp.top, taken: false, phase: k });
    });
  }

  function buildActions(B) {
    const acts = shuffle(ACTIONS).slice(0, ACTION_SPOTS.length);
    const looks = shuffle(NPC_LOOKS);
    acts.forEach((a, k) => {
      const npc = makeNPC(a, ACTION_SPOTS[k], looks[k], k);
      B.group.add(npc.group);
      B.npcs.push(npc);
      B.colliders.push({ x: npc.spot.x, z: npc.spot.z, r: a === 'swimming' ? 3.0 : a === 'running' ? 0.5 : 1.0 });
    });
  }

  function buildPads(B, qs) {
    const w = B.def;
    const q = qs[0];
    PADS.xs.forEach((x, k) => {
      const pad = at(mesh(new THREE.BoxGeometry(PADS.half * 2, 0.3, PADS.half * 2), '#E3EAF0'), x, 0.15, PADS.z);
      B.group.add(pad);
      B.group.add(at(new THREE.Mesh(new THREE.BoxGeometry(PADS.half * 2 + 0.4, 0.12, PADS.half * 2 + 0.4), glow(w.light, 0.5)), x, 0.06, PADS.z));
      const word = textSprite('', { bg: '#1D3F54', font: 120, w: 1024, h: 220, scale: qs.some((x) => x.advice) ? 0.68 : 0.8 });
      word.position.set(x, 3.4, PADS.z);
      B.group.add(word);
      const letter = textSprite(['A', 'B', 'C'][k], { bg: inkOf(w), font: 120, w: 256, h: 220, scale: 0.45 });
      letter.position.set(x, 1.4, PADS.z + PADS.half);
      B.group.add(letter);
      B.pads.push({ x, z: PADS.z, mesh: pad, word, flash: 0, flashColor: null, shake: 0, answer: '' });
      B.platforms.push({ rect: true, x, z: PADS.z, hw: PADS.half, hd: PADS.half, top: 0.3 });
    });
    const startRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 6, 28), glow('#FFFFFF', 0.9));
    startRing.rotation.x = Math.PI / 2;
    startRing.position.set(PADS.start.x, 0.1, PADS.start.z);
    B.group.add(startRing);
    const sign = textSprite(q.title.toUpperCase(), { bg: inkOf(w), scale: 0.8 });
    sign.position.set(PADS.xs[1], 7.6, PADS.z - 2);
    B.group.add(sign);
    B.padSign = sign;
    if (qs.some((x) => x.showcase)) {
      const ped = new THREE.Group();
      ped.position.set(PADS.xs[1], 0, PADS.z - 5.5);
      ped.add(at(mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.2, 12), '#F7FAFC'), 0, 0.6, 0));
      ped.add(at(mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.12, 12), w.color), 0, 1.22, 0));
      const holder = new THREE.Group();
      holder.position.y = 2.6;
      ped.add(holder);
      B.group.add(ped);
      B.colliders.push({ x: PADS.xs[1], z: PADS.z - 5.5, r: 1.7 });
      B.showcase = holder;
    }
    if (qs.some((x) => x.advice)) {
      const bed = new THREE.Group();
      bed.add(at(mesh(new THREE.BoxGeometry(3, 0.7, 1.4), '#FFFFFF'), 0, 0.35, 0));
      bed.add(at(mesh(new THREE.BoxGeometry(0.2, 1.4, 1.4), '#57A6B5'), -1.5, 0.7, 0));
      const patient = makeObject('robot', 2.2);
      patient.position.set(0.2, 1.8, 0);
      bed.add(patient);
      bed.position.set(PADS.xs[1], 0, PADS.z - 5.5);
      B.group.add(bed);
      B.colliders.push({ x: PADS.xs[1], z: PADS.z - 5.5, r: 1.8 });
      const cross = new THREE.Group();
      cross.add(mesh(new THREE.BoxGeometry(1.2, 0.35, 0.1), '#E53935'), mesh(new THREE.BoxGeometry(0.35, 1.2, 0.1), '#E53935'));
      cross.position.set(PADS.xs[1], 5.2, PADS.z - 6.3);
      B.group.add(cross);
      B.patient = patient;
    }
  }

  function buildTwoAreas(B, L, labels, subs) {
    const areas = [L.a, L.b].map((c, k) => {
      const col = k === 0 ? '#57A6B5' : '#F57C00';
      const disc = at(mesh(new THREE.CylinderGeometry(L.r, L.r + 0.2, 0.3, 24), col), c.x, 0.15, c.z);
      B.group.add(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(L.r, 0.14, 6, 32), glow('#FFFFFF', 0.8));
      rim.rotation.x = Math.PI / 2;
      rim.position.set(c.x, 0.33, c.z);
      B.group.add(rim);
      B.platforms.push({ x: c.x, z: c.z, r: L.r, top: 0.3 });
      for (const s of [-1, 1]) {
        B.group.add(rod(V(c.x + s * 2.6, 0, c.z - 2.8), V(c.x + s * 2.6, 5.2, c.z - 2.8), 0.1, '#1D3F54'));
        B.colliders.push({ x: c.x + s * 2.6, z: c.z - 2.8, r: 0.3 });
      }
      const sign = textSprite(labels[k], { bg: col, font: 120, scale: 0.9 });
      sign.position.set(c.x, 6.2, c.z - 2.8);
      B.group.add(sign);
      const sub = textSprite(subs[k], { bg: '#1D3F54', font: 90, scale: 0.55 });
      sub.position.set(c.x, 4.6, c.z - 2.8);
      sub.visible = !!subs[k];
      B.group.add(sub);
      const icon = new THREE.Group();
      icon.position.set(c.x, 2.6, c.z);
      B.group.add(icon);
      return { c, disc, rim, sign, sub, icon, col, flash: 0 };
    });
    const startRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 6, 28), glow('#FFFFFF', 0.9));
    startRing.rotation.x = Math.PI / 2;
    startRing.position.set(L.start.x, 0.1, L.start.z);
    B.group.add(startRing);
    const center = new THREE.Group();
    center.position.set(L.start.x, 2.8, L.start.z - 4.2);
    B.group.add(center);
    return { L, areas, center };
  }

  function buildPeople(B, q) {
    const people = q.people();
    const looksShe = shuffle(NPC_LOOKS.filter((l) => l.long)), looksHe = shuffle(NPC_LOOKS.filter((l) => !l.long));
    B.people = people.map((p, k) => {
      const look = p.she ? looksShe[k % looksShe.length] : looksHe[k % looksHe.length];
      const npc = makeNPC('waving', ACTION_SPOTS[k], look, k);
      npc.person = p;
      npc.label.userData.draw(`Hi! I'm ${p.name}.`, inkOf(B.def));
      npc.label.visible = true;
      B.group.add(npc.group);
      B.colliders.push({ x: npc.spot.x, z: npc.spot.z, r: 1.0 });
      return npc;
    });
  }

  function buildLadder(B, q = {}) {
    const w = B.def;
    const steps = q.steps || shuffle(LADDER_VERBS).slice(0, LADDER.xs.length).map((v) => ({ label: v, say: `I am going to <u>${v}</u>!` }));
    const verbs = steps.map((st) => st.label);
    const x0 = LADDER.xs[0] - LADDER.half, x1 = LADDER.xs[LADDER.xs.length - 1] + LADDER.half;
    for (const dz of [-LADDER.half - 0.15, LADDER.half + 0.15]) B.group.add(at(mesh(new THREE.BoxGeometry(x1 - x0, 0.2, 0.25), '#FDD835'), (x0 + x1) / 2, 0.1, LADDER.z + dz));
    LADDER.xs.forEach((x, k) => {
      const tile = at(mesh(new THREE.BoxGeometry(LADDER.half * 2 - 0.3, 0.2, LADDER.half * 2), '#E3EAF0'), x, 0.1, LADDER.z);
      B.group.add(tile);
      const sp = textSprite(verbs[k], { bg: '#1D3F54', font: 120, w: 768, h: 220, scale: 0.55 });
      sp.position.set(x, 2.4, LADDER.z);
      B.group.add(sp);
      B.ladder.push({ x, verb: verbs[k], say: steps[k].say, tile, sp, done: false });
      B.platforms.push({ rect: true, x, z: LADDER.z, hw: LADDER.half - 0.15, hd: LADDER.half, top: 0.2 });
    });
    const sign = textSprite(q.sign || 'PREDICTION TRACK', { bg: inkOf(w), scale: 0.8 });
    sign.position.set(15.5, 6.2, LADDER.z - 2.5);
    B.group.add(sign);
  }

  function buildStage(B) {
    const w = B.def;
    B.group.add(at(mesh(new THREE.CylinderGeometry(STAGE.r, STAGE.r + 0.3, STAGE.top, 20), '#1D3F54'), STAGE.x, STAGE.top / 2, STAGE.z));
    const stageRing = new THREE.Mesh(new THREE.TorusGeometry(STAGE.r - 0.3, 0.12, 6, 32), glow(w.color, 0.9));
    stageRing.rotation.x = Math.PI / 2;
    stageRing.position.set(STAGE.x, STAGE.top + 0.05, STAGE.z);
    B.group.add(stageRing);
    B.platforms.push({ x: STAGE.x, z: STAGE.z, r: STAGE.r, top: STAGE.top });
    const micG = new THREE.Group();
    micG.position.set(STAGE.x, STAGE.top, STAGE.z - 2.4);
    micG.add(rod(V(0, 0, 0), V(0, 1.7, 0), 0.05, '#2C5F7C'), at(mesh(new THREE.SphereGeometry(0.2, 10, 8), '#B0BEC5'), 0, 1.85, 0), at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 10), '#2C5F7C'), 0, 0.03, 0));
    B.group.add(micG);
    for (const s of [-1, 1]) {
      B.group.add(rod(V(STAGE.x + s * 4.4, 0, STAGE.z - 1.5), V(STAGE.x + s * 4.4, 6, STAGE.z - 1.5), 0.12, '#1D3F54'));
      B.colliders.push({ x: STAGE.x + s * 4.4, z: STAGE.z - 1.5, r: 0.4 });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6, 16, 1, true), glow('#FFF59D', 0.12));
      cone.position.set(STAGE.x + s * 2.2, 3, STAGE.z - 0.8);
      cone.rotation.z = -s * 0.35;
      B.group.add(cone);
    }
    const sign = textSprite('STAGE', { bg: w.color, scale: 0.8 });
    sign.position.set(STAGE.x, 7.4, STAGE.z - 1.5);
    B.group.add(sign);
    B.stageRing = stageRing;
    B.stageSign = sign;
  }

  function buildPortal(B, q) {
    const w = B.def;
    const pg = new THREE.Group();
    pg.position.set(PORTAL.x, 0, PORTAL.z);
    pg.add(at(mesh(new THREE.CylinderGeometry(4.6, 5, 0.4, 20), '#1D3F54'), 0, 0.2, 0));
    const ringMat = new THREE.MeshStandardMaterial({ color: '#90A4AE', flatShading: true, emissive: '#000000' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.5, 10, 36), ringMat);
    ring.position.y = 4.2;
    pg.add(ring);
    const swirlU = { t: { value: 0 }, c1: { value: new THREE.Color(q.final ? '#FDD835' : w.color) }, c2: { value: new THREE.Color('#FFFFFF') }, on: { value: 0 } };
    const swirl = new THREE.Mesh(
      new THREE.CircleGeometry(3.0, 48),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.DoubleSide, depthWrite: false, uniforms: swirlU,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float t; uniform vec3 c1; uniform vec3 c2; uniform float on; varying vec2 vUv; void main(){ vec2 p = vUv*2.0-1.0; float r = length(p); float a = atan(p.y,p.x); float s = sin(a*5.0 + r*14.0 - t*5.0)*0.5+0.5; vec3 col = mix(c1, c2, s*(1.0-r)); float alpha = smoothstep(1.0,0.85,r)*on*(0.75+0.25*s); gl_FragColor = vec4(col, alpha);\n#include <colorspace_fragment>\n}',
      })
    );
    swirl.position.y = 4.2;
    pg.add(swirl);
    for (const s of [-1, 1]) {
      pg.add(at(mesh(new THREE.BoxGeometry(1, 2.2, 1), w.rock), s * 3.6, 1.1, 0));
      B.colliders.push({ x: PORTAL.x + s * 3.6, z: PORTAL.z, r: 0.9 });
    }
    const pSign = textSprite(q.final ? 'TIME MASTER' : 'TIME PORTAL', { bg: '#1D3F54', scale: 0.8 });
    pSign.position.y = 9.4;
    pg.add(pSign);
    B.group.add(pg);
    B.platforms.push({ x: PORTAL.x, z: PORTAL.z, r: 4.6, top: 0.4 });
    B.portal = { group: pg, ring, ringMat, swirl, swirlU, active: false };
  }

  // ---------- Decor ----------
  function tree(w, n) {
    const g = new THREE.Group();
    const h = 0.9 + (n % 4) * 0.15;
    if (w.theme === 'future') {
      g.add(at(mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.4 * h, 6), '#455A64'), 0, 0.7 * h, 0));
      const cr = at(mesh(new THREE.OctahedronGeometry(1.1 * h, 0), n % 2 ? '#64FFDA' : '#B2FF59', { emissive: n % 2 ? '#00897B' : '#558B2F', emissiveIntensity: 0.7 }), 0, 2.4 * h, 0);
      cr.scale.y = 1.5;
      g.add(cr);
      return g;
    }
    if (w.theme === 'arena') {
      g.add(rod(V(0, 0, 0), V(0, 5, 0), 0.1, '#1D3F54'));
      g.add(at(mesh(new THREE.BoxGeometry(1.6, 1, 0.06), ['#F57C00', '#57A6B5', '#7CB342', '#E91E63'][n % 4]), 0.8, 4.4, 0));
      return g;
    }
    const leaf = w.theme === 'past' ? ['#E65100', '#F9A825', '#C62828'][n % 3] : ['#43A047', '#2E7D32', '#7CB342'][n % 3];
    g.add(at(mesh(new THREE.CylinderGeometry(0.22 * h, 0.32 * h, 1.3 * h, 6), '#7B4A26'), 0, 0.65 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.3 * h, 2 * h, 7), leaf), 0, 2.1 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(0.95 * h, 1.6 * h, 7), leaf), 0, 3.0 * h, 0));
    return g;
  }

  function building(w, n) {
    const g = new THREE.Group();
    if (w.theme === 'future') {
      const h = 7 + (n % 3) * 3;
      g.add(at(mesh(new THREE.BoxGeometry(3.4, h, 3.4), '#CFD8DC'), 0, h / 2, 0));
      for (let y = 1.2; y < h - 0.5; y += 1.3) g.add(at(mesh(new THREE.BoxGeometry(3.5, 0.35, 3.5), '#4DD0E1', { emissive: '#00ACC1', emissiveIntensity: 0.9 }), 0, y, 0));
      g.add(at(mesh(new THREE.ConeGeometry(0.4, 2, 6), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.5 }), 0, h + 1, 0));
      return g;
    }
    if (w.theme === 'arena') {
      g.add(at(mesh(new THREE.CylinderGeometry(0.9, 1.1, 6, 10), '#FFF8E1'), 0, 3, 0));
      g.add(at(mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.5, 10), '#145389'), 0, 6.2, 0));
      g.add(at(mesh(new THREE.ConeGeometry(0.6, 1.2, 8), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.7 }), 0, 7.0, 0));
      return g;
    }
    const wall = w.theme === 'past' ? ['#F3E0C0', '#E7CBA0'][n % 2] : ['#FFFFFF', '#FFE082', '#B3E5FC'][n % 3];
    const roof = w.theme === 'past' ? '#8D4E2A' : ['#E53935', '#145389', '#F57C00'][n % 3];
    g.add(at(mesh(new THREE.BoxGeometry(3.6, 3, 3.2), wall), 0, 1.5, 0));
    const r = at(mesh(new THREE.ConeGeometry(3, 2, 4), roof), 0, 4, 0);
    r.rotation.y = Math.PI / 4;
    g.add(r);
    g.add(at(mesh(new THREE.BoxGeometry(0.9, 1.5, 0.1), '#5D4037'), 0, 0.75, 1.62));
    for (const s of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), '#FFF59D'), s * 1.1, 1.9, 1.62));
    return g;
  }

  function hourglass() {
    const g = new THREE.Group();
    const wood = '#7B4A26';
    g.add(at(mesh(new THREE.CylinderGeometry(1.8, 2, 0.5, 10), wood), 0, 0.25, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 10), wood), 0, 5.8, 0));
    const glass = { transparent: true, opacity: 0.45, roughness: 0.1 };
    const lower = at(mesh(new THREE.ConeGeometry(1.5, 2.6, 10), '#E1F5FE', glass), 0, 1.8, 0);
    lower.rotation.x = Math.PI;
    g.add(lower, at(mesh(new THREE.ConeGeometry(1.5, 2.6, 10), '#E1F5FE', glass), 0, 4.3, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.1, 1.1, 10), '#FDD835'), 0, 1.0, 0));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(rod(V(Math.cos(a) * 1.55, 0.5, Math.sin(a) * 1.55), V(Math.cos(a) * 1.55, 5.6, Math.sin(a) * 1.55), 0.12, wood));
    }
    g.add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), '#FDD835'), 0, 2.4, 0));
    g.userData.update = (t) => (g.rotation.y = Math.sin(t * 0.3) * 0.3);
    return g;
  }

  function clockTower() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.BoxGeometry(3, 7, 3), '#F7FAFC'), 0, 3.5, 0));
    const roof = at(mesh(new THREE.ConeGeometry(2.6, 2.4, 4), '#2C5F7C'), 0, 8.2, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const hands = [];
    for (const side of [0, 1, 2, 3]) {
      const fc = new THREE.Group();
      fc.rotation.y = (side * Math.PI) / 2;
      const face = at(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 20), '#FDD835'), 0, 5.4, 1.52);
      face.rotation.x = Math.PI / 2;
      fc.add(face);
      const h1 = new THREE.Group();
      h1.position.set(0, 5.4, 1.62);
      h1.add(at(mesh(new THREE.BoxGeometry(0.12, 0.9, 0.06), '#1D3F54'), 0, 0.4, 0));
      const h2 = new THREE.Group();
      h2.position.set(0, 5.4, 1.64);
      h2.add(at(mesh(new THREE.BoxGeometry(0.14, 0.6, 0.06), '#1D3F54'), 0, 0.27, 0));
      fc.add(h1, h2);
      hands.push([h1, h2]);
      g.add(fc);
    }
    g.add(at(mesh(new THREE.BoxGeometry(1.1, 1.8, 0.1), '#145389'), 0, 0.9, 1.52));
    g.userData.update = () => {
      const d = new Date();
      const m = d.getMinutes() + d.getSeconds() / 60, hr = (d.getHours() % 12) + m / 60;
      for (const [h1, h2] of hands) {
        h1.rotation.z = -(m / 60) * Math.PI * 2;
        h2.rotation.z = -(hr / 12) * Math.PI * 2;
      }
    };
    return g;
  }

  function rocket() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.5, 12), '#455A64'), 0, 0.25, 0));
    const body = new THREE.Group();
    body.add(at(mesh(new THREE.CylinderGeometry(1.2, 1.2, 5, 12), '#F7FAFC'), 0, 3.6, 0));
    body.add(at(mesh(new THREE.ConeGeometry(1.2, 2.2, 12), '#F57C00'), 0, 7.2, 0));
    const win = at(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 14), '#4DD0E1', { emissive: '#00ACC1', emissiveIntensity: 0.8 }), 0, 4.6, 1.15);
    win.rotation.x = Math.PI / 2;
    body.add(win);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fin = at(mesh(new THREE.BoxGeometry(0.2, 1.8, 1.2), '#145389'), Math.sin(a) * 1.3, 1.9, Math.cos(a) * 1.3);
      fin.rotation.y = a;
      body.add(fin);
    }
    const flame = at(mesh(new THREE.ConeGeometry(0.7, 1.6, 10), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.8 }), 0, 0.6, 0);
    flame.rotation.x = Math.PI;
    body.add(flame);
    g.add(body);
    g.userData.update = (t) => {
      body.position.y = 0.4 + Math.sin(t * 1.5) * 0.25;
      flame.scale.y = 1 + Math.sin(t * 14) * 0.2;
    };
    return g;
  }

  function bigTrophy() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.6, 12), '#145389'), 0, 0.3, 0));
    const t = makeObject('trophy', 6.5);
    t.position.y = 3.8;
    g.add(t);
    g.userData.update = (time) => (t.rotation.y = time * 0.4);
    return g;
  }

  const LANDMARKS = {
    hourglass: () => hourglass(),
    clock: () => clockTower(),
    rocket: () => rocket(),
    trophy: () => bigTrophy(),
    hello: (w) => helloSign(w),
    magnifier: (w) => magnifier(w),
    sun: (w) => morningSun(w),
  };

  function helloSign(w) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) g.add(rod(V(s * 2.2, 0, 0), V(s * 2.2, 5.5, 0), 0.18, '#8D5A2B'));
    g.add(at(mesh(new THREE.BoxGeometry(6, 2.6, 0.3), '#FFFFFF'), 0, 5.2, 0));
    g.add(at(mesh(new THREE.BoxGeometry(6.3, 2.9, 0.2), w.color), 0, 5.2, -0.1));
    const txt = textSprite('HELLO!', { bg: w.color, font: 130, scale: 0.9 });
    txt.userData.noFade = true;
    txt.position.set(0, 5.2, 0.4);
    g.add(txt);
    const balloons = [];
    ['#F57C00', '#FDD835', '#7CB342'].forEach((c, k) => {
      const b = new THREE.Group();
      const ball = mesh(new THREE.SphereGeometry(0.55, 12, 10), c);
      ball.scale.y = 1.2;
      b.add(ball, rod(V(0, -0.65, 0), V(0, -2.2, 0), 0.02, '#1D3F54'));
      b.position.set(-3 + k * 0.6, 7.6 + k * 0.3, 0.2);
      g.add(b);
      balloons.push(b);
    });
    g.userData.update = (t) => balloons.forEach((b, k) => (b.rotation.z = Math.sin(t * 1.3 + k) * 0.15));
    return g;
  }

  function magnifier(w) {
    const g = new THREE.Group();
    const lens = new THREE.Group();
    lens.add(mesh(new THREE.TorusGeometry(2, 0.35, 10, 32), w.color));
    lens.add(new THREE.Mesh(new THREE.CircleGeometry(2, 32), new THREE.MeshStandardMaterial({ color: '#B3E5FC', transparent: true, opacity: 0.45, side: THREE.DoubleSide })));
    lens.add(rod(V(0, -2.2, 0), V(0, -4.8, 0), 0.32, '#5D4037'));
    lens.position.y = 5.4;
    g.add(lens);
    g.add(at(mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.5, 12), '#5D4037'), 0, 0.25, 0));
    g.userData.update = (t) => {
      lens.rotation.y = Math.sin(t * 0.5) * 0.6;
      lens.rotation.z = Math.sin(t * 0.7) * 0.08;
    };
    return g;
  }

  function morningSun(w) {
    const g = new THREE.Group();
    g.add(rod(V(0, 0, 0), V(0, 4, 0), 0.25, '#8D5A2B'));
    const sunG = new THREE.Group();
    sunG.position.y = 6;
    sunG.add(mesh(new THREE.SphereGeometry(1.6, 16, 12), '#FDD835', { emissive: '#F9A825', emissiveIntensity: 0.6 }));
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const ray = at(mesh(new THREE.ConeGeometry(0.3, 1.1, 6), '#FFB300', { emissive: '#F57C00', emissiveIntensity: 0.4 }), Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0);
      ray.rotation.z = a - Math.PI / 2;
      sunG.add(ray);
    }
    for (const s of [-1, 1]) sunG.add(at(mesh(new THREE.SphereGeometry(0.18, 8, 6), '#1D3F54'), s * 0.55, 0.3, 1.5));
    const smile = at(mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 12, Math.PI), '#1D3F54'), 0, -0.2, 1.55);
    smile.rotation.z = Math.PI;
    sunG.add(smile);
    g.add(sunG);
    g.userData.update = (t) => {
      sunG.rotation.z = Math.sin(t * 0.6) * 0.15;
      sunG.position.y = 6 + Math.sin(t * 1.2) * 0.2;
    };
    return g;
  }

  function windmill() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(1.2, 1.8, 6, 8), '#F3E0C0'), 0, 3, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.6, 1.8, 8), '#8D4E2A'), 0, 6.9, 0));
    const blades = new THREE.Group();
    blades.position.set(0, 5.6, 1.5);
    for (let k = 0; k < 4; k++) {
      const holder = new THREE.Group();
      holder.rotation.z = (k * Math.PI) / 2;
      holder.add(at(mesh(new THREE.BoxGeometry(0.5, 3.4, 0.08), '#FFF3E0'), 0, 1.8, 0));
      blades.add(holder);
    }
    g.add(blades);
    g.userData.blades = blades;
    return g;
  }

  function fountain() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.8, 14), '#CFD8DC'), 0, 0.4, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 14), '#4FC3F7'), 0, 0.82, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), '#CFD8DC'), 0, 1.6, 0));
    g.add(at(mesh(new THREE.SphereGeometry(0.6, 10, 8), '#4FC3F7', { transparent: true, opacity: 0.8 }), 0, 2.8, 0));
    return g;
  }

  function hoverCar(color) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(2.4, 0.6, 1.2), color));
    g.add(at(mesh(new THREE.SphereGeometry(0.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#4DD0E1', { transparent: true, opacity: 0.8 }), 0, 0.3, 0));
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.2, 0.3, 10), glow('#64FFDA', 0.5)), 0, -0.45, 0));
    return g;
  }

  function butterfly(color) {
    const g = new THREE.Group();
    const wl = new THREE.Group(), wr = new THREE.Group();
    wl.add(at(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), color), -0.27, 0, 0));
    wr.add(at(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), color), 0.27, 0, 0));
    g.add(wl, wr, mesh(new THREE.BoxGeometry(0.08, 0.08, 0.4), '#1D3F54'));
    g.userData.wings = (t) => {
      wl.rotation.z = Math.sin(t * 14) * 0.8;
      wr.rotation.z = -Math.sin(t * 14) * 0.8;
    };
    return g;
  }

  function balloon(color) {
    const g = new THREE.Group();
    const b = mesh(new THREE.SphereGeometry(1.2, 12, 10), color);
    b.scale.y = 1.2;
    g.add(b, rod(V(0, -1.4, 0), V(0, -4, 0), 0.03, '#1D3F54'));
    return g;
  }

  // ---------- World switching ----------
  const avatarHolder = new THREE.Group();
  scene.add(avatarHolder);
  const arrow = new THREE.Group();
  {
    const m = mat('#FDD835', { emissive: '#C79100', emissiveIntensity: 0.6 });
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 4), m);
    head.rotation.x = Math.PI / 2;
    head.position.z = 0.6;
    arrow.add(head, new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.8), m));
  }
  scene.add(arrow);

  function loadWorld(wi) {
    if (W) {
      scene.remove(W.group);
      W.group.traverse((o) => o.geometry && o.geometry !== starGeo && o.geometry !== partGeo && o.geometry.dispose());
    }
    W = buildWorld(wi);
    scene.add(W.group);
    applyAtmosphere(WORLDS[wi]);
    document.documentElement.style.setProperty('--world', WORLDS[wi].color);
    document.documentElement.style.setProperty('--world-ink', inkOf(WORLDS[wi]));
  }

  function lookOf(p) {
    const w = WALLETS[p];
    return { ...defaultLook(PLAYERS[p]), ...((w && w.look) || {}) };
  }
  function setAvatar(p, look = null) {
    while (avatarHolder.children.length) avatarHolder.remove(avatarHolder.children[0]);
    AV.model = makeAvatar({ ...(look || lookOf(p)), hero: true, wear: AV.wear || [] });
    avatarHolder.add(AV.model.root, AV.model.blob);
    AV.model.root.position.copy(AV.pos);
    AV.model.root.rotation.y = AV.yaw;
  }

  // ---------- Crystal wallet (crystals are money: they buy clothes in "My Look") ----------
  const WALLETS = {};
  function walletFor(p) {
    if (!WALLETS[p]) {
      WALLETS[p] = makeWallet(p, () => WEB && NET.unlocked && !params.has('nodb'));
      WALLETS[p].onChange(() => {
        if (S.player !== p) return;
        renderWallet();
        if (S.mode === 'brief') setAvatar(p);
      });
    }
    return WALLETS[p];
  }
  function renderWallet() {
    const w = WALLETS[S.player];
    const n = w ? w.crystals : 0;
    for (const id of ['b-crys', 'lk-crys', 'h-wallet']) if ($(id)) $(id).textContent = n;
  }
  // rewards for using English (and a little for exploring)
  function earn(n, why = '') {
    n = Math.round(n);
    if (n <= 0 || S.mode === 'title' || S.mode === 'brief') return;
    walletFor(S.player).earn(n);
    S.earned = (S.earned || 0) + n;
    const el = $('h-earn');
    if (el) {
      el.textContent = `+${n}`;
      el.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('on');
    }
    if (why) logEvent(`+${n} crystals: ${why}`, true);
  }

  function placeAvatar(pos, yaw = Math.PI) {
    AV.pos.copy(pos);
    AV.vel.set(0, 0, 0);
    AV.yaw = yaw;
    AV.onGround = true;
  }

  // ---------- Layers & HUD helpers ----------
  function showLayer(name) {
    for (const el of document.querySelectorAll('.layer')) el.classList.toggle('on', el.id === 'L-' + name);
  }
  function showHint(text) {
    if ($('h-task').classList.contains('on')) return;
    const h = $('h-hint');
    h.textContent = text;
    h.classList.remove('on');
    void h.offsetWidth;
    h.classList.add('on');
    clearTimeout(showHint.t);
    showHint.t = setTimeout(() => h.classList.remove('on'), 6000);
  }
  function feedback(text, good, el = 'h-feedback') {
    const f = $(el);
    f.textContent = text;
    f.className = 'feedback ' + (good ? 'good' : 'bad');
    void f.offsetWidth;
    f.classList.add('go');
  }
  function task(lab, s, opts = '') {
    const el = $('h-task');
    if (lab === null) {
      el.classList.remove('on');
      return;
    }
    $('h-tlab').innerHTML = lab;
    $('h-ts').innerHTML = s;
    $('h-topts').innerHTML = opts;
    $('h-topts').style.display = opts ? '' : 'none';
    el.classList.add('on');
    $('h-hint').classList.remove('on');
  }
  $('h-topts').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b && S.mode === 'play' && S.Q && !S.Q.done && HANDLERS[S.Q.def.type].pick) HANDLERS[S.Q.def.type].pick(S.Q, +b.dataset.pick);
  });
  $('h-topts').addEventListener('mousedown', (e) => e.preventDefault());
  $('h-arrival').addEventListener('animationend', (e) => {
    if (e.animationName === 'arrive') $('h-arrival').classList.remove('on');
  });

  function renderQuests() {
    const qs = WORLDS[S.wi].quests;
    $('h-quests').innerHTML = qs.map((q, i) => {
      const st = i < S.q ? 'done' : i === S.q ? 'now' : '';
      const cnt = i === S.q && S.Q && S.Q.count && S.Q.max ? `<span class="cnt">${S.Q.count()}</span>` : '';
      return `<div class="q ${st}"><span class="dot">${i < S.q ? '✓' : i + 1}</span>${q.name}${cnt}</div>`;
    }).join('');
  }
  function renderPack() {
    const showSlots = WORLDS[S.wi].quests.some((q) => q.type === 'collect');
    $('h-slots').style.display = showSlots ? '' : 'none';
    const c = S.clues[S.wi].filter((x) => x.obj);
    document.querySelectorAll('#h-slots .slot').forEach((s, k) => {
      const it = c[k];
      const key = it ? it.label : '';
      if ((s.dataset.k || '') === key) return;
      s.dataset.k = key;
      s.className = 'slot' + (it ? ' full' : '');
      s.innerHTML = it ? thumbImg(it.obj, it.label) || esc(it.label) : '';
    });
    $('h-crys').textContent = `${S.crystals[S.wi]}/${S.crystalsMax[S.wi]}`;
  }

  // ---------- Title / briefing ----------
  function toTitle() {
    S.mode = 'title';
    S.paused = false;
    S.Q = null;
    $('O-pause').classList.remove('on');
    $('O-exit').classList.remove('on');
    finale.visible = false;
    loadWorld(GAME.titleWorld || 0);
    avatarHolder.visible = false;
    arrow.visible = false;
    W.beacon.visible = false;
    showLayer('title');
    stopMusic();
  }
  for (const b of document.querySelectorAll('.player')) b.addEventListener('click', () => choosePlayer(+b.dataset.p));
  function choosePlayer(p) {
    if (!NET.unlocked) return;
    S.player = p;
    sfx.click();
    S.mode = 'brief';
    $('b-hi').textContent = `Hi, ${PLAYERS[p].name}!`;
    showLayer('brief');
    showResume(null);
    walletFor(p);
    renderWallet();
    walletFor(p).sync();
    findSave(p).then((sv) => S.mode === 'brief' && S.player === p && showResume(sv));
  }
  // ---------- Saved progress (this device, and the class database when there is one) ----------
  const saveKey = (p) => `ccaSave:${GAME.id}:${p}`;
  function readLocalSave(p) {
    try {
      const sv = JSON.parse(lsGet(saveKey(p)) || 'null');
      return sv && sv.v === 1 && sv.game === GAME.id && Date.now() - sv.savedAt < 30 * 864e5 ? sv : null;
    } catch (e) {
      return null;
    }
  }
  async function findSave(p) {
    let sv = readLocalSave(p);
    if (NET.room && WEB) {
      const remote = await DB.resume(NET.room, GAME.id, p);
      if (remote && remote.v === 1 && remote.game === GAME.id && (!sv || remote.savedAt > sv.savedAt)) sv = remote;
    }
    return sv;
  }
  function showResume(sv) {
    S.save = sv;
    document.body.classList.toggle('has-save', !!sv);
    $('b-resume').classList.toggle('on', !!sv);
    if (!sv) return;
    const w = WORLDS[sv.wi];
    const q = w && w.quests[sv.q];
    $('b-rinfo').innerHTML = `You were in <b>${esc(w ? w.name : '')}</b>${q ? ` · ${esc(q.name)}` : ''}.`;
  }
  function snapshot(q) {
    return {
      v: 1, game: GAME.id, player: S.player, runId: NET.runId, wi: S.wi, q, savedAt: Date.now(),
      where: `${WORLDS[S.wi].name}${WORLDS[S.wi].quests[q] ? ` · ${WORLDS[S.wi].quests[q].name}` : ''}`,
      results: S.results, stars: S.stars, clues: S.clues, crystals: S.crystals, crystalsMax: S.crystalsMax,
      met: S.met, events: S.events.slice(-30), lastTalkWi: S.lastTalkWi,
    };
  }
  function saveProgress(q) {
    if (S.mode === 'title' || S.mode === 'brief') return;
    const sv = snapshot(q);
    lsSet(saveKey(S.player), JSON.stringify(sv));
    if (NET.room && WEB) DB.save({ run: NET.runId, room: NET.room, game: GAME.id, player: S.player, state: sv, status: 'playing' });
  }
  function clearSave(p, status) {
    try {
      localStorage.removeItem(saveKey(p));
    } catch (e) {
      /* private mode */
    }
    if (status && NET.runId && NET.room && WEB) DB.save({ run: NET.runId, room: NET.room, game: GAME.id, player: p, state: null, status });
  }
  $('b-cont').addEventListener('click', () => S.mode === 'brief' && S.save && startTrip(S.save));
  $('b-again').addEventListener('click', () => S.mode === 'brief' && startTrip());
  for (const id of ['b-cont', 'b-again', 'exit-yes', 'exit-no', 'btn-exit']) {
    $(id).tabIndex = -1;
    $(id).addEventListener('mousedown', (e) => e.preventDefault());
  }

  // ---------- My Look (wardrobe + crystal shop) ----------
  const SKIN_NAMES = ['light skin', 'light brown skin', 'brown skin', 'dark brown skin', 'dark skin'];
  const LK = { slot: 'shirt', edit: null, pending: null };
  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      const v = speechSynthesis.getVoices().find((x) => /^en(-|_)US/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {
      /* no voice on this device */
    }
  }
  // all the choices of one slot: { key (to own it), value, name, price, hex? }
  function lookOptions(slot) {
    const S0 = SLOTS.find((x) => x.id === slot);
    if (S0.kind === 'skin') return SKINS.map((hex, i) => ({ key: '', value: hex, name: SKIN_NAMES[i], price: 0, hex }));
    if (S0.kind === 'item') return ITEMS.filter((i) => i.slot === slot).map((i) => ({ key: i.price ? i.id : '', value: i.value, name: i.name, price: i.price }));
    const list = S0.colors.map((c) => ({ key: '', value: c.hex, name: `${c.id} ${S0.noun}`, price: 0, hex: c.hex }));
    const goldPrice = PAID_COLORS[`${slot}:gold`];
    if (goldPrice) list.push({ key: `${slot}:gold`, value: GOLD.hex, name: `gold ${S0.noun}`, price: goldPrice, hex: GOLD.hex });
    if (S0.none) list.unshift({ key: '', value: 'none', name: `no ${S0.noun}`, price: 0, hex: 'transparent' });
    return list;
  }
  const owns = (o) => !o.price || walletFor(S.player).has(o.key);
  function openLook() {
    if (S.mode !== 'brief') return;
    S.mode = 'look';
    LK.edit = lookOf(S.player);
    LK.pending = null;
    AV.wear = [];
    placeAvatar(SPAWN.clone(), 0);
    setAvatar(S.player, LK.edit);
    avatarHolder.visible = true;
    showLayer('look');
    renderWallet();
    renderLook();
    $('lk-say').textContent = 'Choose your look!';
    $('lk-act').innerHTML = '';
    $('lk-msg').textContent = '';
  }
  function renderLook() {
    $('lk-tabs').innerHTML = SLOTS.map((x) => `<button type="button" data-slot="${x.id}" class="${x.id === LK.slot ? 'on' : ''}">${esc(x.label)}</button>`).join('');
    const cur = LK.edit[LK.slot];
    $('lk-items').innerHTML = lookOptions(LK.slot).map((o, i) => `<button type="button" data-i="${i}" class="${o.value === cur ? 'on' : ''}${owns(o) ? '' : ' locked'}">
        ${o.hex ? `<span class="sw" style="background:${o.hex}${o.value === 'none' ? ';border:2px dashed #90A4AE' : ''}"></span>` : ''}
        <span>${esc(o.name)}</span>${o.price ? `<span class="price">${owns(o) ? '✓' : `<span class="gem"></span>${o.price}`}</span>` : ''}
      </button>`).join('');
  }
  function pickLook(i) {
    const o = lookOptions(LK.slot)[i];
    if (!o) return;
    LK.edit[LK.slot] = o.value;
    setAvatar(S.player, LK.edit);
    sfx.click();
    speak(o.name);
    $('lk-say').textContent = o.name;
    $('lk-msg').textContent = '';
    LK.pending = owns(o) ? null : o;
    $('lk-act').innerHTML = `<button type="button" class="speak" id="lk-speak">🔊</button>${LK.pending ? ` <button type="button" id="lk-buy">Buy · ${o.price} 💎</button>` : ''}`;
    renderLook();
  }
  function buyLook() {
    const o = LK.pending;
    if (!o) return;
    const w = walletFor(S.player);
    if (!w.buy(o.key, o.price)) {
      $('lk-msg').textContent = `You need ${o.price - w.crystals} more crystals! Play and speak English to win more.`;
      sfx.bad();
      return;
    }
    sfx.gem();
    burst(AV.pos.clone().add(V(0, 2.5, 0)), ['#64FFDA', '#FDD835', '#FFFFFF'], 30, { speed: 5, up: 7, geo: starGeo, size: 0.3 });
    $('lk-say').textContent = `New: ${o.name}!`;
    LK.pending = null;
    $('lk-act').innerHTML = '';
    renderWallet();
    renderLook();
  }
  function closeLook() {
    if (S.mode !== 'look') return;
    // take off what was only tried on (not bought)
    const saved = lookOf(S.player);
    for (const x of SLOTS) {
      const o = lookOptions(x.id).find((y) => y.value === LK.edit[x.id]);
      if (o && !owns(o)) LK.edit[x.id] = saved[x.id];
    }
    walletFor(S.player).setLook({ ...LK.edit });
    try {
      speechSynthesis.cancel();
    } catch (e) {
      /* no voice */
    }
    S.mode = 'brief';
    avatarHolder.visible = false;
    setAvatar(S.player);
    showLayer('brief');
  }
  $('b-look').addEventListener('click', openLook);
  $('lk-done').addEventListener('click', closeLook);
  $('lk-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b) return;
    LK.slot = b.dataset.slot;
    LK.pending = null;
    $('lk-act').innerHTML = '';
    renderLook();
  });
  $('lk-items').addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) pickLook(+b.dataset.i);
  });
  $('lk-name').addEventListener('click', (e) => {
    if (e.target.id === 'lk-buy') buyLook();
    else if (e.target.id === 'lk-speak') speak($('lk-say').textContent.replace(/^New: |!$/g, ''));
  });
  for (const id of ['b-look', 'lk-done']) {
    $(id).tabIndex = -1;
    $(id).addEventListener('mousedown', (e) => e.preventDefault());
  }

  // ---------- Exit (the kid) ----------
  function askExit(on) {
    if (on && S.mode !== 'play' && S.mode !== 'talk') return;
    $('O-exit').classList.toggle('on', on);
    S.paused = on;
    keys.clear();
  }
  function exitGame(reason, quiet = false) {
    $('O-exit').classList.remove('on');
    if (S.mode === 'play' || S.mode === 'talk' || S.mode === 'warp') logEvent(reason || 'Left the game', false);
    const wasPlayer = NET.role === 'player' && NET.tx;
    toTitle();
    if (quiet) clearTimeout(liveTimer); // the teacher already cleared this card
    else if (wasPlayer) pushLive();
  }
  $('btn-exit').addEventListener('click', () => askExit(true));
  $('exit-no').addEventListener('click', () => askExit(false));
  $('exit-yes').addEventListener('click', () => exitGame());

  function startTrip(resume = null) {
    NET.role = 'player';
    NET.lastSession = null;
    NET.runId = resume && resume.runId ? resume.runId : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    S.lastTalkWi = null;
    // "Start again" over a saved game: that old game is closed in the history
    const old = !resume && S.save;
    if (old) {
      try {
        localStorage.removeItem(saveKey(S.player));
      } catch (e) {
        /* private mode */
      }
      if (old.runId && NET.room && WEB) DB.save({ run: old.runId, room: NET.room, game: GAME.id, player: S.player, state: null, status: 'restarted' });
    }
    showResume(null);
    if (NET.tx) listenCommands();
    const n = WORLDS.length;
    S.results = Array.from({ length: n }, () => []);
    S.stars = Array(n).fill(0);
    S.clues = Array.from({ length: n }, () => []);
    S.crystals = Array(n).fill(0);
    S.crystalsMax = Array(n).fill(0);
    S.met = Array.from({ length: n }, () => []);
    S.events = [];
    S.earned = 0;
    S.starsPaid = [];
    AV.wear = [];
    walletFor(S.player);
    setAvatar(S.player);
    if (resume && WORLDS[resume.wi]) {
      const fit = (a, d) => Array.from({ length: n }, (x, i) => (a && a[i] != null ? a[i] : d()));
      S.results = fit(resume.results, () => []);
      S.stars = fit(resume.stars, () => 0);
      S.clues = fit(resume.clues, () => []);
      S.crystals = fit(resume.crystals, () => 0);
      S.crystalsMax = fit(resume.crystalsMax, () => 0);
      S.met = fit(resume.met, () => []);
      S.events = (resume.events || []).slice(-30);
      S.lastTalkWi = resume.lastTalkWi ?? null;
      S.starsPaid = S.stars.slice(); // those stars were already paid
      S.crystals[resume.wi] = 0; // the crystals of this world come back
      logEvent(`Continued in ${WORLDS[resume.wi].name}`, true);
      enterWorld(resume.wi, Math.min(resume.q || 0, WORLDS[resume.wi].quests.length - 1));
      return;
    }
    enterWorld(0);
  }

  function enterWorld(wi, firstQuest = 0) {
    S.wi = wi;
    if (AV.wear && AV.wear.length) {
      AV.wear = [];
      setAvatar(S.player);
    }
    S.Q = null;
    loadWorld(wi);
    S.crystalsMax[wi] = W.crystals.length;
    S.mode = 'play';
    avatarHolder.visible = true;
    arrow.visible = true;
    placeAvatar(SPAWN.clone());
    camRig.pos.copy(AV.pos).add(V(0, 8.5, 13.5));
    camRig.target.copy(AV.pos);
    $('h-world').textContent = WORLDS[wi].name;
    $('t-world').textContent = WORLDS[wi].name;
    showLayer('play');
    task(null);
    const arr = $('h-arrival');
    $('h-aw').textContent = `Welcome to ${WORLDS[wi].name}!`;
    $('h-at').textContent = WORLDS[wi].tense;
    arr.classList.remove('on');
    void arr.offsetWidth;
    arr.classList.add('on');
    startMusic(WORLDS[wi].music);
    logEvent(`Arrived in ${WORLDS[wi].name}`, true);
    startQuest(firstQuest, 2600);
    saveProgress(firstQuest);
  }

  // ---------- Quest engine ----------
  function startQuest(i, delay = 0) {
    S.q = i;
    const def = WORLDS[S.wi].quests[i];
    const Q = { def, score: 0, max: 0, details: [], idx: 0, attempts: 0, ready: false, phase: '', started: false };
    S.Q = Q;
    const H = HANDLERS[def.type];
    Q.count = H.count ? () => H.count(Q) : null;
    renderQuests();
    renderPack();
    const go = () => {
      if (S.Q !== Q || Q.started) return;
      if (S.mode !== 'play') return setTimeout(go, 300);
      Q.started = true;
      H.start(Q);
      renderQuests();
      schedulePush();
    };
    if (delay) setTimeout(go, delay);
    else go();
  }
  function completeQuest() {
    const Q = S.Q;
    if (!Q || Q.done) return;
    Q.done = true;
    if (Q.def.type !== 'talk' && Q.def.type !== 'portal') {
      S.results[S.wi].push({ name: Q.def.name, short: Q.def.short || Q.def.name, score: Q.score, max: Q.max, details: Q.details.join('; ') });
      if (Q.score > 0 && !Q.details.includes('skipped by teacher')) earn(Q.score * 2, Q.def.name);
    }
    task(null);
    logEvent(`${Q.def.name}${Q.max ? `: ${Q.score}/${Q.max}` : ''} ✔`, true);
    const next = S.q + 1;
    if (next < WORLDS[S.wi].quests.length) {
      startQuest(next, 700);
      saveProgress(next);
    }
  }
  function backToStart(p) {
    placeAvatar(p.clone(), Math.PI);
    burst(p.clone().add(V(0, 1, 0)), ['#FFFFFF'], 8, { speed: 2, up: 3 });
  }
  const optsHTML = (opts) => opts.map((o, k) => `<span class="opt"><b>${'ABC'[k]}</b>${esc(o)}</span>`).join('');

  const HANDLERS = {
    // ---- Find 3 things / Pick 3 dreams ----
    collect: {
      start(Q) {
        Q.max = 3;
        showHint(Q.def.dreams ? 'Walk to your dreams! Pick 3.' : 'Walk to the shining things!');
      },
      count: (Q) => `${Q.score}/3`,
      goal() {
        let best = null, bd = 1e9;
        for (const pk of W.pickups) {
          if (pk.taken) continue;
          const d = Math.hypot(pk.x - AV.pos.x, pk.z - AV.pos.z);
          if (d < bd) {
            bd = d;
            best = V(pk.x, 0, pk.z);
          }
        }
        return best;
      },
      update(Q) {
        for (const pk of W.pickups) {
          if (pk.taken || Q.score >= 3) continue;
          if (Math.hypot(AV.pos.x - pk.x, AV.pos.z - pk.z) < 1.9 && Math.abs(AV.pos.y - pk.top) < 2.2) this.take(Q, pk);
        }
      },
      take(Q, pk) {
        pk.taken = true;
        pk.flyT = 0;
        Q.score++;
        Q.details.push(pk.label);
        S.clues[S.wi].push({ label: pk.label, obj: pk.id });
        sfx.pick();
        burst(V(pk.x, pk.top + 1.7, pk.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 22, { speed: 5, up: 7 });
        if (pk.say) {
          feedback('Say it!', true);
          task(`Dream ${Q.score} / 3 · Say it out loud!`, esc(pk.say));
          clearTimeout(Q.tt);
          Q.tt = setTimeout(() => S.Q === Q && !Q.done && task(null), 3500);
        } else feedback(`${pk.label}!`, true);
        renderPack();
        renderQuests();
        if (Q.score >= 3) {
          for (const o of W.pickups) {
            if (!o.taken) {
              o.taken = true;
              o.vanish = 0;
            }
          }
          setTimeout(() => S.Q === Q && completeQuest(), pk.say ? 3600 : 1000);
        }
      },
      skip(Q) {
        for (const pk of W.pickups) if (!pk.taken && Q.score < 3) this.take(Q, pk);
      },
    },

    // ---- S13: What are they doing? ----
    actions: {
      start(Q) {
        Q.max = 3;
        Q.targets = shuffle(W.npcs).slice(0, 3);
        Q.ready = true;
        this.show(Q);
      },
      show(Q) {
        const t = Q.targets[Q.idx];
        task(`What are they doing? ${Q.idx + 1} / 3 · Look and walk to the right person!`, `Find someone who is <u>${t.action.toUpperCase()}</u>!`);
      },
      count: (Q) => `${Q.idx}/3`,
      goal: () => null,
      update(Q, dt) {
        for (const npc of W.npcs) {
          const p = npc.M.root.getWorldPosition(new THREE.Vector3());
          const near = Math.hypot(AV.pos.x - p.x, AV.pos.z - p.z) < (npc.action === 'swimming' ? 4.4 : 2.9);
          const entered = near && !npc.near;
          npc.near = near;
          if (!entered || !Q.ready) continue;
          const target = Q.targets[Q.idx];
          npc.label.visible = true;
          if (npc === target) {
            Q.ready = false;
            if (Q.attempts === 0) Q.score++;
            Q.details.push(npc.action);
            S.clues[S.wi].push({ label: npc.action });
            sfx.good();
            burst(p.clone().add(V(0, 3, 0)), ['#FDD835', '#FFFFFF', '#57A6B5'], 26, { speed: 6, up: 8, geo: starGeo, size: 0.3 });
            feedback(`Yes! ${PRON(npc)} is ${npc.action}!`, true);
            $('h-ts').innerHTML = `${PRON(npc)} is <u>${npc.action}</u>.`;
            setTimeout(() => {
              if (S.Q !== Q) return;
              Q.idx++;
              Q.attempts = 0;
              renderQuests();
              if (Q.idx >= 3) completeQuest();
              else {
                Q.ready = true;
                this.show(Q);
              }
            }, 1900);
            return;
          }
          if (!Q.targets.slice(0, Q.idx).includes(npc)) {
            Q.attempts++;
            sfx.bad();
            feedback(`No! ${PRON(npc)} is ${npc.action}.`, false);
          }
        }
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        Q.idx = 3;
        completeQuest();
      },
    },

    // ---- S1 Presentation Stations: step on a station, say it out loud ----
    stations: {
      start(Q) {
        Q.items = Q.def.items;
        Q.max = Q.items.length;
        Q.done = false;
        Q.doneK = new Set();
        if (W.padSign) W.padSign.userData.draw(Q.def.title.toUpperCase(), inkOf(WORLDS[S.wi]));
        W.pads.forEach((p, k) => {
          p.answer = Q.items[k] ? Q.items[k].label : '';
          p.word.userData.draw(p.answer, '#1D3F54');
          p.mesh.material = mat(WORLDS[S.wi].light);
        });
        this.show(Q);
      },
      show(Q) {
        Q.phase = '';
        task(`${Q.def.title} ${Q.doneK.size} / ${Q.max} · Step on a station and talk!`, 'Visit all the stations!', optsHTML(Q.items.map((x) => x.label)));
        Q.ready = true;
      },
      count: (Q) => `${Q.doneK.size}/${Q.max}`,
      goal(Q) {
        if (Q.phase === 'say') return null;
        let best = null, bd = 1e9;
        W.pads.forEach((p, k) => {
          if (Q.doneK.has(k) || !Q.items[k]) return;
          const d = Math.hypot(p.x - AV.pos.x, p.z - AV.pos.z);
          if (d < bd) {
            bd = d;
            best = V(p.x, 0, p.z);
          }
        });
        return best;
      },
      update(Q, dt) {
        if (Q.phase === 'say') {
          Q.sayLeft -= dt;
          const el = $('h-say');
          if (el) el.textContent = Math.max(0, Math.ceil(Q.sayLeft));
          if (Q.sayLeft <= 0) this.next(Q);
          return;
        }
        if (!Q.ready || !AV.onGround) return;
        W.pads.forEach((p, k) => {
          if (!Q.ready || Q.doneK.has(k) || !Q.items[k]) return;
          if (Math.abs(AV.pos.x - p.x) < PADS.half && Math.abs(AV.pos.z - p.z) < PADS.half) {
            Q.ready = false;
            Q.phase = 'say';
            Q.cur = k;
            Q.sayLeft = Q.def.seconds || 12;
            sfx.good();
            p.mesh.material = mat('#FDD835');
            burst(V(p.x, 1, p.z), ['#FDD835', '#FFFFFF'], 16, { speed: 4, up: 6 });
            task(`${Q.items[k].label} · Say it out loud! <span class="say" id="h-say">${Math.ceil(Q.sayLeft)}</span>`, Q.items[k].say);
            logEvent(`${Q.def.title}: talking at ${Q.items[k].label}`, true);
          }
        });
      },
      next(Q) {
        if (Q.phase !== 'say') return;
        const k = Q.cur;
        Q.doneK.add(k);
        Q.score = Q.doneK.size;
        Q.details.push(Q.items[k].label);
        W.pads[k].mesh.material = mat('#7CB342');
        feedback('Great!', true);
        renderQuests();
        if (Q.doneK.size >= Q.max) {
          Q.phase = '';
          setTimeout(() => S.Q === Q && completeQuest(), 900);
        } else this.show(Q);
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        completeQuest();
      },
    },

    // ---- S2 / S6 Interview: walk to a person, listen, choose a question, say it out loud ----
    // listen -> choose (1/2/3) -> say it (the teacher hears it) -> the friend answers -> again or next
    interview: {
      start(Q) {
        Q.max = W.people.length;
        Q.phase = '';
        this.show(Q);
      },
      show(Q) {
        const met = W.people.filter((n) => n.met).length;
        Q.chat = false;
        task(`${Q.def.name} ${met} / ${Q.max}`, met ? 'Walk to another friend!' : 'Walk to a new friend and say hello!');
        Q.ready = true;
      },
      count: (Q) => `${W.people.filter((n) => n.met).length}/${Q.max}`,
      goal(Q) {
        if (Q.chat) return null;
        let best = null, bd = 1e9;
        for (const n of W.people) {
          if (n.met) continue;
          const d = Math.hypot(n.spot.x - AV.pos.x, n.spot.z - AV.pos.z);
          if (d < bd) {
            bd = d;
            best = V(n.spot.x, 0, n.spot.z);
          }
        }
        return best;
      },
      // a short phase with its own timer (Enter skips ahead)
      phase(Q, name, secs, lab, s, opts = '') {
        Q.phase = name;
        Q.left = secs;
        task(`${lab}${secs ? ` <span class="say" id="h-say">${Math.ceil(secs)}</span>` : ''}`, s, opts);
      },
      listen(Q) {
        const p = Q.cur.person;
        this.phase(Q, 'listen', Q.def.listen || 7, `${esc(p.name)} says... Listen!`, `<span class="who">${esc(p.name)}:</span> "${esc(p.facts)}"`);
      },
      choose(Q) {
        const p = Q.cur.person;
        if (!p.qs || !p.qs.length || Q.asked >= (Q.def.asks || 2)) return this.done(Q);
        Q.phase = 'choose';
        const opts = Q.left3.map((i, k) => `<button class="opt qbtn" data-pick="${k}"><b>${k + 1}</b>${esc(p.qs[i][0])}</button>`).join('');
        task(`Ask ${esc(p.name)} a question! ${document.body.classList.contains('touch') ? 'Tap one' : 'Press 1, 2 or 3'}`, Q.asked ? 'One more question!' : `What do you want to ask ${esc(p.name)}?`, opts);
      },
      pick(Q, k) {
        if (Q.phase !== 'choose' || k >= Q.left3.length) return;
        const p = Q.cur.person;
        const i = Q.left3.splice(k, 1)[0];
        Q.qa = p.qs[i];
        Q.asked++;
        Q.details.push(`${p.name}: ${Q.qa[0]}`);
        logEvent(`Asked ${p.name}: "${Q.qa[0]}"`, true);
        sfx.click();
        this.phase(Q, 'say', Q.def.sayTime || 6, 'Say it out loud to your teacher!', `<span class="mic">🎤</span> "${esc(Q.qa[0])}"`);
      },
      answer(Q) {
        const p = Q.cur.person;
        sfx.good();
        burst(V(Q.cur.spot.x, 3, Q.cur.spot.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 14, { speed: 4, up: 6 });
        this.phase(Q, 'answer', Q.def.answerTime || 5, `${esc(p.name)} answers:`, `<span class="who">${esc(p.name)}:</span> "${esc(Q.qa[1])}"`);
      },
      done(Q) {
        Q.phase = '';
        Q.chat = false;
        if (Q.cur) Q.cur.talking = false;
        if (W.people.every((n) => n.met)) setTimeout(() => S.Q === Q && completeQuest(), 600);
        else this.show(Q);
      },
      update(Q, dt) {
        if (Q.chat) {
          if (Q.phase === 'choose') return;
          Q.left -= dt;
          const el = $('h-say');
          if (el) el.textContent = Math.max(0, Math.ceil(Q.left));
          if (Q.left <= 0) this.next(Q);
          return;
        }
        if (!Q.ready) return;
        for (const n of W.people) {
          if (n.met) continue;
          if (Math.hypot(AV.pos.x - n.spot.x, AV.pos.z - n.spot.z) < 2.9) {
            n.met = true;
            n.talking = true;
            Q.cur = n;
            Q.ready = false;
            Q.chat = true;
            Q.asked = 0;
            Q.left3 = shuffle((n.person.qs || []).map((x, i) => i));
            Q.score++;
            Q.details.push(n.person.name);
            (S.met[S.wi] ||= []).push(n.person);
            S.clues[S.wi].push({ label: n.person.name });
            sfx.good();
            burst(V(n.spot.x, 3, n.spot.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 20, { speed: 5, up: 7 });
            logEvent(`${Q.def.name}: met ${n.person.name}`, true);
            renderQuests();
            this.listen(Q);
            return;
          }
        }
      },
      // Enter: go on to the next step
      next(Q) {
        if (!Q.chat) return;
        if (Q.phase === 'listen') this.choose(Q);
        else if (Q.phase === 'say') this.answer(Q);
        else if (Q.phase === 'answer') this.choose(Q);
      },
      skip(Q) {
        for (const n of W.people) if (!n.met) {
          n.met = true;
          (S.met[S.wi] ||= []).push(n.person);
        }
        Q.chat = false;
        Q.details.push('skipped by teacher');
        completeQuest();
      },
    },

    // ---- Stones: Word / Can / Advice / Ultimate ----
    stones: {
      start(Q) {
        let bank = typeof Q.def.bank === 'function' ? Q.def.bank(S.met[S.wi] || []) : Q.def.bank;
        bank = (bank || []).filter(Boolean);
        Q.list = shuffle(bank).slice(0, Q.def.count).map((x) => ({ ...x, opts: shuffle(x.a) }));
        Q.max = Q.list.length;
        if (W.padSign) W.padSign.userData.draw(Q.def.title.toUpperCase(), inkOf(WORLDS[S.wi]));
        if (!Q.max) return completeQuest();
        this.load(Q);
      },
      load(Q) {
        const it = Q.list[Q.idx];
        W.pads.forEach((p, k) => {
          p.answer = it.opts[k];
          p.word.userData.draw(p.answer, '#1D3F54');
          p.mesh.material = mat(WORLDS[S.wi].light);
        });
        if (W.showcase) {
          while (W.showcase.children.length) W.showcase.remove(W.showcase.children[0]);
          if (it.obj) W.showcase.add(makeObject(it.obj, 3.2));
        }
        const lab = `${Q.def.title} ${Q.idx + 1} / ${Q.max} · Step on the right answer!`;
        const s = Q.def.advice ? `The patient says: <i>"${esc(it.p)}"</i>` : esc(it.s).replace('___', '<u>&nbsp;?&nbsp;</u>');
        task(lab, s, optsHTML(it.opts));
        Q.ready = true;
      },
      count: (Q) => `${Q.idx}/${Q.max}`,
      goal: () => PADS.start,
      update(Q) {
        if (!Q.ready || !AV.onGround) return;
        W.pads.forEach((p, k) => {
          if (Q.ready && Math.abs(AV.pos.x - p.x) < PADS.half && Math.abs(AV.pos.z - p.z) < PADS.half) this.step(Q, k);
        });
      },
      step(Q, k) {
        const it = Q.list[Q.idx];
        const pad = W.pads[k];
        Q.ready = false;
        Q.attempts++;
        logEvent(`${Q.def.title}: "${it.s || it.p}" → ${pad.answer}`, pad.answer === it.a[0]);
        if (pad.answer === it.a[0]) {
          if (Q.attempts === 1) Q.score++;
          sfx.good();
          pad.flash = 1.4;
          pad.flashColor = '#7CB342';
          burst(V(pad.x, 1, pad.z), ['#FDD835', '#7CB342', '#FFFFFF'], 26, { speed: 6, up: 9, geo: starGeo, size: 0.3 });
          feedback(Q.def.advice ? 'Good advice!' : 'Yes!', true);
          if (Q.def.advice) {
            $('h-ts').innerHTML = `<i>"${esc(it.p)}"</i> → <u>${esc(it.a[0])}</u>`;
            if (W.patient) burst(W.patient.getWorldPosition(new THREE.Vector3()).add(V(0, 1.5, 0)), ['#E91E63', '#FFFFFF'], 14, { speed: 3, up: 5 });
          } else $('h-ts').innerHTML = esc(it.s).replace('___', `<u>${esc(it.a[0])}</u>`);
          if (Q.def.dress && it.wear) {
            // the traveler puts it on, then the kid says it
            AV.wear = [...new Set([...(AV.wear || []), it.wear])];
            setAvatar(S.player);
            const line = `I put on my ${it.a[0]}.`;
            $('h-ts').innerHTML = `<span class="mic">🎤</span> Say it: "${esc(line)}"`;
            Q.details.push(it.a[0]);
          }
          setTimeout(() => {
            if (S.Q !== Q) return;
            Q.idx++;
            Q.attempts = 0;
            renderQuests();
            if (Q.idx >= Q.max) {
              W.pads.forEach((p) => {
                p.word.userData.draw('');
                p.mesh.material = mat('#E3EAF0');
              });
              completeQuest();
            } else {
              backToStart(PADS.start);
              this.load(Q);
            }
          }, Q.def.dress ? 4000 : 2000);
        } else {
          sfx.bad();
          pad.flash = 0.9;
          pad.flashColor = '#E53935';
          pad.shake = 0.6;
          feedback('Try again!', false);
          AV.vel.y = 6;
          setTimeout(() => {
            if (S.Q !== Q) return;
            backToStart(PADS.start);
            Q.ready = true;
          }, 900);
        }
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        W.pads.forEach((p) => p.word.userData.draw(''));
        Q.idx = Q.max;
        completeQuest();
      },
    },

    // ---- S14 Every day / Right now, S15 Today / Tomorrow ----
    zones: {
      start(Q) {
        const bank = Q.def.bank;
        const a = shuffle(bank.filter((x) => x.z === 0)), b = shuffle(bank.filter((x) => x.z === 1));
        const half = Math.ceil(Q.def.count / 2);
        Q.list = shuffle([...a.slice(0, half), ...b.slice(0, Q.def.count - half)]).map((x) => {
          if (!x.labels || Math.random() < 0.5) return x;
          return { ...x, labels: [x.labels[1], x.labels[0]], z: 1 - x.z };
        });
        Q.max = Q.list.length;
        if (!Q.def.perItem) this.signs(Q.def.labels, Q.def.subs);
        this.load(Q);
      },
      signs(labels, subs = ['', '']) {
        W.zones.areas.forEach((ar, k) => {
          ar.sign.userData.draw(labels[k], ar.col);
          ar.sub.userData.draw(subs[k] || '', '#1D3F54');
          ar.sub.visible = !!subs[k];
        });
      },
      load(Q) {
        const it = Q.list[Q.idx];
        const labels = it.labels || Q.def.labels;
        if (it.labels) this.signs(it.labels);
        const C = W.zones.center;
        while (C.children.length) C.remove(C.children[0]);
        if (it.obj) C.add(makeObject(it.obj, 2.4));
        const text = esc(it.s).replace('___', '<u>&nbsp;?&nbsp;</u>');
        task(`${Q.def.name} ${Q.idx + 1} / ${Q.max} · Run to the right zone!`, it.obj ? text : `"${text}"`, optsHTML(labels).replace(/<b>[AB]<\/b>/g, ''));
        Q.ready = true;
      },
      count: (Q) => `${Q.idx}/${Q.max}`,
      goal: () => ZONES.start,
      update(Q) {
        if (!Q.ready || !AV.onGround) return;
        W.zones.areas.forEach((ar, k) => {
          if (Q.ready && Math.hypot(AV.pos.x - ar.c.x, AV.pos.z - ar.c.z) < ZONES.r - 0.6) this.enter(Q, k);
        });
      },
      enter(Q, k) {
        const it = Q.list[Q.idx];
        const ar = W.zones.areas[k];
        const labels = it.labels || Q.def.labels;
        Q.ready = false;
        Q.attempts++;
        logEvent(`${Q.def.name}: "${it.s}" → ${labels[k]}`, k === it.z);
        if (k === it.z) {
          if (Q.attempts === 1) Q.score++;
          sfx.good();
          ar.flash = 1.2;
          burst(ar.c.clone().add(V(0, 1.5, 0)), ['#FDD835', '#FFFFFF', ar.col], 30, { speed: 7, up: 9, geo: starGeo, size: 0.3 });
          feedback(`Yes! ${labels[k]}!`, true);
          setTimeout(() => {
            if (S.Q !== Q) return;
            Q.idx++;
            Q.attempts = 0;
            renderQuests();
            if (Q.idx >= Q.max) completeQuest();
            else {
              backToStart(ZONES.start);
              this.load(Q);
            }
          }, 1700);
        } else {
          sfx.bad();
          feedback('Try again!', false);
          AV.vel.y = 6;
          setTimeout(() => {
            if (S.Q !== Q) return;
            backToStart(ZONES.start);
            Q.ready = true;
          }, 900);
        }
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        Q.idx = Q.max;
        completeQuest();
      },
    },

    // ---- S15 Prediction Track (agility ladder) ----
    ladder: {
      start(Q) {
        Q.max = W.ladder.length;
        this.show(Q);
      },
      show(Q) {
        const t = W.ladder[Q.idx];
        W.ladder.forEach((l, k) => (l.tile.material = mat(l.done ? '#7CB342' : k === Q.idx ? '#FDD835' : '#E3EAF0')));
        task(`${Q.def.name} ${Q.idx + 1} / ${Q.max} · Say it, then step on the yellow box!`, t.say);
      },
      count: (Q) => `${Q.idx}/${Q.max}`,
      goal: (Q) => (W.ladder[Q.idx] ? V(W.ladder[Q.idx].x, 0, LADDER.z) : null),
      update(Q) {
        const t = W.ladder[Q.idx];
        if (!t || !AV.onGround) return;
        if (Math.abs(AV.pos.x - t.x) < LADDER.half && Math.abs(AV.pos.z - LADDER.z) < LADDER.half) {
          t.done = true;
          Q.score++;
          Q.details.push(t.verb);
          sfx.step(Q.idx);
          burst(V(t.x, 0.6, LADDER.z), ['#FDD835', '#7CB342'], 12, { speed: 3, up: 6 });
          feedback(t.say.replace(/<[^>]+>/g, ''), true);
          logEvent(`${Q.def.name}: ${t.say.replace(/<[^>]+>/g, '')}`, true);
          Q.idx++;
          renderQuests();
          if (Q.idx >= Q.max) {
            W.ladder.forEach((l) => (l.tile.material = mat('#7CB342')));
            setTimeout(() => S.Q === Q && completeQuest(), 900);
          } else this.show(Q);
        }
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        Q.idx = Q.max;
        completeQuest();
      },
    },

    // ---- S21 Opinion Corner ----
    opinion: {
      start(Q) {
        Q.list = shuffle(Q.def.pairs || OPINIONS).slice(0, Q.def.count);
        Q.max = Q.list.length;
        this.load(Q);
      },
      load(Q) {
        const it = Q.list[Q.idx];
        const A = W.opin.areas;
        [it.a, it.b].forEach((txt, k) => {
          A[k].sign.userData.draw(txt.toUpperCase(), A[k].col);
          while (A[k].icon.children.length) A[k].icon.remove(A[k].icon.children[0]);
          const id = k === 0 ? it.ia : it.ib;
          if (id) A[k].icon.add(makeObject(id, 1.8));
        });
        Q.phase = 'choose';
        task(`${Q.def.name} ${Q.idx + 1} / ${Q.max} · There is no wrong answer!`, `${esc(it.a)} or ${esc(it.b)}? Stand on your favorite!`);
        Q.ready = true;
      },
      count: (Q) => `${Q.idx}/${Q.max}`,
      goal: (Q) => (Q.phase === 'choose' ? OPIN.start : null),
      update(Q, dt) {
        if (Q.phase === 'say') {
          Q.sayLeft -= dt;
          const el = $('h-say');
          if (el) el.textContent = Math.max(0, Math.ceil(Q.sayLeft));
          if (Q.sayLeft <= 0) this.next(Q);
          return;
        }
        if (!Q.ready || !AV.onGround) return;
        W.opin.areas.forEach((ar, k) => {
          if (!Q.ready) return;
          if (Math.hypot(AV.pos.x - ar.c.x, AV.pos.z - ar.c.z) < OPIN.r - 0.6) {
            const it = Q.list[Q.idx];
            const choice = k === 0 ? it.a : it.b;
            Q.ready = false;
            Q.phase = 'say';
            Q.sayLeft = SAY_SECONDS;
            Q.details.push(`${choice} (${it.a} vs ${it.b})`);
            S.clues[S.wi].push({ label: choice.toLowerCase() });
            sfx.good();
            ar.flash = 1;
            burst(ar.c.clone().add(V(0, 1.5, 0)), ['#FDD835', '#FFFFFF', ar.col], 24, { speed: 6, up: 8 });
            task(`${Q.def.name} · Say it out loud! <span class="say" id="h-say">${SAY_SECONDS}</span>`, (Q.def.frame || 'I think <u>{x}</u> are better because ...').replace('{x}', esc(choice.toLowerCase())));
            logEvent(`${Q.def.name}: chose "${choice}" (${it.a} vs ${it.b})`, true);
          }
        });
      },
      next(Q) {
        if (Q.phase !== 'say') return;
        Q.phase = '';
        Q.score++;
        Q.idx++;
        renderQuests();
        if (Q.idx >= Q.max) completeQuest();
        else {
          backToStart(OPIN.start);
          this.load(Q);
        }
      },
      skip(Q) {
        Q.details.push('skipped by teacher');
        Q.idx = Q.max;
        completeQuest();
      },
    },

    // ---- Talk on the stage ----
    talk: {
      start() {
        showHint('Go to the stage and talk!');
      },
      goal: () => V(STAGE.x, 0, STAGE.z),
      update() {
        if (Math.hypot(AV.pos.x - STAGE.x, AV.pos.z - STAGE.z) < STAGE.r - 0.6) startTalk();
      },
      skip() {
        startTalk();
      },
    },

    // ---- Portal ----
    portal: {
      start(Q) {
        openPortal(Q.def.final);
        showHint(Q.def.final ? 'Go into the golden portal!' : 'The portal is open! Go in!');
      },
      goal: () => V(PORTAL.x, 0, PORTAL.z),
      update() {
        if (W.portal.active && Math.hypot(AV.pos.x - PORTAL.x, AV.pos.z - PORTAL.z) < 2.6) startWarp();
      },
      skip(Q) {
        if (!W.portal.active) openPortal(Q.def.final);
        startWarp();
      },
    },
  };

  // ---------- Event log (shown on the teacher dashboard when online) ----------
  function logEvent(text, ok = true) {
    S.events.push({ t: Date.now(), text, ok, wi: S.wi });
    if (S.events.length > 200) S.events.shift();
    if (NET.onEvent) NET.onEvent();
  }
  const NET = { online: false, role: 'player' };

  // ---------- Online mode ----------
  // Two transports with the same small API (publish / sub):
  //  · on the web (gimnasiodelcerebro.co or any page): a class code + MQTT link (src/net.js)
  //  · inside a claude.ai artifact: the `db` capability
  // Kids' devices publish their live progress; the teacher view reads it live and sends
  // commands (stars, end talk, pause, skip). Without a code, the game plays offline as before.
  const base = () => `games/${GAME.id}`;
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

  function dbTransport(db) {
    return {
      kind: 'db',
      async publish(k, obj) {
        await db.doc(`${base()}/${k}`).set(obj);
        return 1;
      },
      sub(pattern, cb) {
        const parts = pattern.split('/');
        if (parts[parts.length - 1] === '+') {
          const coll = parts.slice(0, -1).join('/');
          return db.collection(`${base()}/${coll}`).onSnapshot((snap) => snap.docs.forEach((d) => cb(`${coll}/${d.id}`, d.data())), () => {});
        }
        return db.doc(`${base()}/${pattern}`).onSnapshot((snap) => snap.exists && cb(pattern, snap.data()), () => {});
      },
      connected: () => 1,
      close() {},
    };
  }

  function updateLock() {
    document.body.classList.toggle('locked', !NET.unlocked);
    document.body.classList.toggle('is-profe', !!NET.isTeacher);
  }
  async function checkTeacherKey(typed) {
    const key = (typed || params.get('profe') || lsGet('ccaProfe') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!key) return false;
    const signer = await openTeacher(key);
    if (signer) {
      NET.signer = signer;
      NET.isTeacher = true;
      NET.unlocked = true;
      lsSet('ccaProfe', key);
    }
    updateLock();
    return !!NET.isTeacher;
  }
  // the class code box also takes the teacher key (longer than a class code)
  async function submitCode(value) {
    const v = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 6) {
      if (await checkTeacherKey(v)) {
        $('room-in').value = '';
        setNetStatus('Teacher', true);
        toTeacher();
      } else setNetStatus('That code is not right.', false);
      return;
    }
    return joinClass(v);
  }
  async function initNet() {
    NET.unlocked = !WEB;
    updateLock();
    await checkTeacherKey();
    // claude.ai artifact? then use its database.
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const db = await window.claude.use('db');
        if (db) {
          NET.tx = dbTransport(db);
          NET.online = true;
          setNetStatus('Online (claude.ai)');
          document.body.classList.add('online');
          return;
        }
      }
    } catch (e) {
      /* fall through to the class-code link */
    }
    let code = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    let pase = params.get('pase') || '';
    if (!code && !NET.isTeacher) {
      // the same device comes back without the link: reuse its last valid pass
      try {
        const last = JSON.parse(lsGet('ccaPass') || 'null');
        if (last && last.room) ({ room: code, pase } = last);
      } catch (e) {
        /* nothing saved */
      }
    }
    if (code && pase && !NET.unlocked && (await checkPass(code, pase))) {
      NET.unlocked = true;
      lsSet('ccaPass', JSON.stringify({ room: code, pase }));
      updateLock();
    }
    $('room-in').value = code;
    if (code) await joinClass(code);
    if (NET.isTeacher && params.get('panel')) toTeacher();
  }

  function setNetStatus(text, ok = true) {
    const el = $('room-st');
    if (el) {
      el.textContent = text;
      el.classList.toggle('ok', ok);
    }
  }

  async function joinClass(code) {
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length < 4) {
      setNetStatus('The code has 4 letters.', false);
      return false;
    }
    if (!(window.crypto && crypto.subtle && window.WebSocket)) {
      setNetStatus('This browser cannot connect.', false);
      return false;
    }
    if (NET.tx && NET.room === code) return true;
    if (NET.tx) NET.tx.close();
    const brokers = params.get('broker') ? [params.get('broker')] : PUBLIC_BROKERS;
    NET.room = code;
    const supa = params.get('broker') ? null : GAME.supabase || SAGA_SUPABASE;
    NET.tx = await joinRoom(code, GAME.id, brokers, (n) => {
      if (!NET.unlocked) setNetStatus(n ? 'Checking the code...' : 'Connecting...', n > 0);
      else setNetStatus(n ? `Class ${code} · online` : `Class ${code} · connecting...`, n > 0);
      if (n && NET.role === 'player' && S.mode !== 'title' && S.mode !== 'brief') schedulePush();
    }, supa);
    // broadcast channels keep nothing: re-send the state every 12 s (and the result after the game)
    clearInterval(NET.beat);
    NET.beat = setInterval(() => {
      if (NET.role !== 'player') return;
      if (S.mode !== 'title' && S.mode !== 'brief') pushLive();
      if (NET.lastSession) NET.tx.publish(`sessions/${NET.runId}`, NET.lastSession, true).catch(() => {});
    }, 12000);
    NET.online = true;
    document.body.classList.add('online');
    $('room-in').value = code;
    lsSet('ccaRoom', code);
    if (NET.role === 'player' && S.mode !== 'title' && S.mode !== 'brief') listenCommands();
    if (NET.role === 'teacher') teacherSubscribe();
    if (NET.isTeacher) {
      // tell the kids' devices this class is open (kept on the brokers, refreshed every 10 s)
      const openMsg = () => NET.tx && NET.tx.publish('open', { t: Date.now() }, true).catch(() => {});
      openMsg();
      clearInterval(NET.openBeat);
      NET.openBeat = setInterval(openMsg, 10000);
    } else if (!NET.unlocked) {
      const tx = NET.tx;
      tx.sub('open', (k, d) => {
        if (NET.tx !== tx || NET.unlocked || !d || (d.exp ? Date.now() > d.exp : Date.now() - d.t > 12 * 3600 * 1000)) return;
        NET.unlocked = true;
        updateLock();
        setNetStatus(`Class ${code} · online`, true);
        if (!navigator.userActivation || navigator.userActivation.hasBeenActive) sfx.good();
      });
      clearTimeout(NET.gateTimer);
      NET.gateTimer = setTimeout(() => {
        if (!NET.unlocked && NET.tx === tx) setNetStatus('This class is not open. Ask your teacher.', false);
      }, 9000);
    }
    return true;
  }
  $('room-in').addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCode($('room-in').value);
      $('room-in').blur();
    }
  });
  $('room-go').addEventListener('click', () => submitCode($('room-in').value));

  let liveTimer = null;
  function schedulePush() {
    if (!NET.tx || NET.role !== 'player' || S.mode === 'title' || S.mode === 'brief') return;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(pushLive, 250);
  }
  NET.onEvent = schedulePush;
  function liveDoc() {
    const w = WORLDS[S.wi] || {};
    return {
      idx: S.player, runId: NET.runId || '',
      mode: S.mode, paused: !!S.paused, wi: S.wi, world: w.name || '',
      quest: S.Q && !S.Q.done ? S.Q.def.name : '', questType: S.Q && !S.Q.done ? S.Q.def.type : '',
      progress: S.Q && !S.Q.done && S.Q.count && S.Q.max ? S.Q.count() : '',
      results: WORLDS.map((ww, i) => ({ world: ww.short, color: ww.color, items: (S.results[i] || []).map((r) => ({ name: r.short, score: r.score, max: r.max })) })),
      stars: S.stars.slice(), talkWorlds: WORLDS.map((ww) => ww.quests.some((q) => q.type === 'talk')),
      crystals: S.crystals.reduce((a, b) => a + b, 0), crystalsMax: S.crystalsMax.reduce((a, b) => a + b, 0),
      events: S.events.slice(-14), updatedAt: Date.now(),
      wallet: WALLETS[S.player] ? WALLETS[S.player].crystals : null, earned: S.earned || 0,
    };
  }
  let pushing = false, pushAgain = false;
  async function pushLive() {
    if (!NET.tx) return;
    if (pushing) {
      pushAgain = true;
      return;
    }
    pushing = true;
    try {
      await NET.tx.publish(`live/p${S.player}`, liveDoc(), true);
    } catch (e) {
      /* keep playing; the next event retries */
    }
    pushing = false;
    if (pushAgain) {
      pushAgain = false;
      schedulePush();
    }
  }
  function listenCommands() {
    if (!NET.tx) return;
    if (NET.unsubCmd) NET.unsubCmd();
    NET.tripStart = Date.now();
    NET.lastSeq = 0;
    NET.unsubCmd = NET.tx.sub(`cmd/p${S.player}`, (k, c) => {
      const seq = c && c.seq ? c.seq : 0;
      if (!c || seq <= NET.lastSeq || seq < NET.tripStart) return; // old commands from before this trip
      NET.lastSeq = seq;
      if (c.type === 'stars') {
        if (S.mode === 'talk') giveStars(c.n);
        else if (S.mode === 'finale' && S.lastTalkWi != null) {
          setFinalStars(S.lastTalkWi, c.n);
          logEvent(`Profe: ${c.n} ★ (${WORLDS[S.lastTalkWi].short})`, true);
        } else if (S.lastTalkWi != null) {
          S.stars[S.lastTalkWi] = c.n;
          payStars(S.lastTalkWi);
          logEvent(`Profe: ${c.n} ★ (${WORLDS[S.lastTalkWi].short})`, true);
        }
      } else if (c.type === 'restart') {
        clearSave(S.player, 'restarted');
        exitGame('The teacher restarted the game', true);
      } else if (c.type === 'endTalk') endTalk();
      else if (c.type === 'skip') skip();
      else if (c.type === 'pause') {
        if (S.mode === 'play' || S.mode === 'talk') {
          S.paused = !S.paused;
          $('O-pause').classList.toggle('on', S.paused);
          keys.clear();
          schedulePush();
        }
      }
    });
  }
  async function saveSession(rows) {
    if (!NET.tx) return;
    // names stay on the devices: rows travel with the player number only
    const anon = rows.map((r) => ({ ...r, player: `p${S.player}` }));
    NET.lastSession = { idx: S.player, runId: NET.runId, date: Date.now(), rows: anon };
    try {
      await NET.tx.publish(`sessions/${NET.runId}`, NET.lastSession, true);
    } catch (e) {
      /* the local CSV still works */
    }
  }

  // ---------- Teacher view ----------
  const T = { docs: {}, sessions: {}, unsubs: [] };
  function teacherSubscribe() {
    T.unsubs.forEach((u) => u && u());
    T.unsubs = [];
    if (!NET.tx) return;
    $('td-status').textContent = 'Esperando a que los niños entren con el código...';
    T.unsubs.push(NET.tx.sub('live/+', (k, d) => {
      T.docs[k.split('/')[1]] = d;
      $('td-status').textContent = 'En vivo';
      renderTeacher();
    }));
    T.unsubs.push(NET.tx.sub('sessions/+', (k, d) => {
      T.sessions[k.split('/')[1]] = d;
    }));
  }
  async function renderRoomPanel() {
    const code = NET.room || '';
    $('td-code').textContent = code || '----';
    let kidUrl = '';
    if (code) {
      kidUrl = `${location.origin}${location.pathname}?room=${code}`;
      // signed pass: the link works for 30 days, even when this page is closed
      if (NET.signer) {
        if (!NET.pass || NET.pass.room !== code) NET.pass = { room: code, pase: await signPass(NET.signer, code, Date.now() + 30 * 864e5) };
        kidUrl += `&pase=${NET.pass.pase}`;
      }
    }
    $('td-link').textContent = kidUrl || 'Crea un código para la clase.';
    $('td-copy').hidden = !kidUrl;
  }
  async function toTeacher() {
    if (!NET.isTeacher) return;
    NET.role = 'teacher';
    S.mode = 'teacher';
    showLayer('teacher');
    stopMusic();
    if (!NET.tx) {
      const saved = (lsGet('ccaRoom') || '').toUpperCase();
      if (saved) await joinClass(saved);
    }
    if (NET.tx) teacherSubscribe();
    else $('td-status').textContent = 'Crea un código de clase para empezar.';
    renderRoomPanel();
    clearInterval(T.tick);
    T.tick = setInterval(renderTeacher, 5000);
    renderTeacher();
  }
  $('td-new').addEventListener('click', async () => {
    T.docs = {};
    T.sessions = {};
    await joinClass(newRoomCode());
    renderRoomPanel();
    renderTeacher();
  });
  $('td-copy').addEventListener('click', async () => {
    const text = $('td-link').textContent;
    try {
      await navigator.clipboard.writeText(text);
      $('td-copy').textContent = 'Copiado';
    } catch (e) {
      const r = document.createRange();
      r.selectNodeContents($('td-link'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      $('td-copy').textContent = 'Selecciona y copia';
    }
    setTimeout(() => ($('td-copy').textContent = 'Copiar enlace'), 1500);
  });
  const MODE_ES = { play: 'Jugando', talk: 'En el escenario', warp: 'Viajando por el portal', finale: 'Terminó', title: 'En el menú', brief: 'En el menú' };
  function renderTeacher() {
    if (S.mode !== 'teacher') return;
    const box = $('td-cards');
    box.innerHTML = PLAYERS.map((P, i) => {
      const d = T.docs[`p${i}`];
      if (!d || d.cleared) return `<div class="tcard"><div class="th"><span class="tav" style="background:${P.suit}">${esc(P.name[0])}</span><b>${esc(P.name)}</b><span class="tst off">sin conectar</span></div><p class="tmuted">Todavía no ha entrado con el código en su dispositivo.</p></div>`;
      const age = (Date.now() - (d.updatedAt || 0)) / 1000;
      const live = age < 120;
      const mode = (d.paused ? 'En pausa · ' : '') + (MODE_ES[d.mode] || d.mode);
      const worlds = (d.results || []).map((r, wi) => {
        const st = d.talkWorlds && d.talkWorlds[wi] ? ` <span class="tstars">${'★'.repeat(d.stars[wi] || 0)}<span class="tdim">${'★'.repeat(3 - (d.stars[wi] || 0))}</span></span>` : '';
        const chips = r.items.map((x) => `<span class="tchip ${x.score === x.max ? 'full' : ''}">${esc(x.name)} <b>${x.score}/${x.max}</b></span>`).join('') || '<span class="tmuted">—</span>';
        return `<div class="tworld ${wi === d.wi && d.mode !== 'finale' ? 'now' : ''}"><span class="twn" style="background:${r.color}">${esc(r.world)}</span>${st}<div class="tchips">${chips}</div></div>`;
      }).join('');
      // on the stage: big, impossible-to-miss star buttons
      const onStage = live && d.mode === 'talk';
      T.prevMode = T.prevMode || {};
      if (onStage && T.prevMode[i] !== 'talk') {
        sfx.good();
        setTimeout(() => sfx.good(), 260);
      }
      T.prevMode[i] = live ? d.mode : '';
      const given = (d.stars || [])[d.wi] || 0;
      const stage = onStage ? `<div class="tstage">
          <div class="tsh">🎤 ¡${esc(P.name)} está en el escenario! Escúchalo y dale estrellas.</div>
          <div class="tsb">${[1, 2, 3].map((n) => `<button data-p="${i}" data-c="stars" data-n="${n}" class="big${n <= given ? ' on' : ''}">${'★'.repeat(n)}</button>`).join('')}<button data-p="${i}" data-c="endTalk" class="big end">Terminar charla</button></div>
        </div>` : '';
      const ev = (d.events || []).slice().reverse().slice(0, 8).map((e) => `<li class="${e.ok ? 'ok' : 'bad'}"><span>${e.ok ? '✓' : '✗'}</span>${esc(e.text)}</li>`).join('');
      return `<div class="tcard${onStage ? ' onstage' : ''}">
        ${stage}
        <div class="th"><span class="tav" style="background:${P.suit}">${esc(P.name[0])}</span><b>${esc(P.name)}</b><span class="tst ${live ? 'on' : 'off'}">${live ? 'en vivo' : 'sin señal'}</span></div>
        <div class="tnow"><b>${esc(mode)}</b>${d.world && d.mode !== 'finale' ? ` · ${esc(d.world)}` : ''}${d.quest ? `<br>Reto: <b>${esc(d.quest)}</b> ${esc(d.progress || '')}` : ''}</div>
        <div class="tbtns">
          <span>Estrellas:</span>
          <button data-p="${i}" data-c="stars" data-n="1">★1</button><button data-p="${i}" data-c="stars" data-n="2">★2</button><button data-p="${i}" data-c="stars" data-n="3">★3</button>
          <button data-p="${i}" data-c="endTalk">Terminar charla</button><button data-p="${i}" data-c="skip">Saltar reto</button><button data-p="${i}" data-c="pause">Pausa</button><button data-p="${i}" data-c="restart" class="warn">Reiniciar</button>
        </div>
        <div class="tworlds">${worlds}</div>
        <div class="tcrys">Cristales recogidos: <b>${d.crystals || 0}/${d.crystalsMax || 0}</b>${d.wallet != null ? ` · Cofre: <b>${d.wallet}</b> 💎 (+${d.earned || 0} en esta partida)` : ''}</div>
        <ul class="tev">${ev || '<li class="tmuted">Sin eventos todavía.</li>'}</ul>
      </div>`;
    }).join('');
  }
  $('td-cards').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-c]');
    if (!b || !NET.tx) return;
    const who = PLAYERS[+b.dataset.p] ? PLAYERS[+b.dataset.p].name : '';
    if (b.dataset.c === 'restart' && !confirm(`¿Reiniciar la partida de ${who}? Vuelve al menú y empieza de cero.`)) return;
    const cmd = { seq: Date.now(), type: b.dataset.c, n: +b.dataset.n || 0 };
    b.disabled = true;
    try {
      const sent = await NET.tx.publish(`cmd/p${b.dataset.p}`, cmd, false);
      if (!sent) throw new Error('offline');
      b.classList.add('sent');
      setTimeout(() => b.classList.remove('sent'), 900);
      if (cmd.type === 'restart') {
        // clear the old card right away (the device may already be closed)
        const blank = { idx: +b.dataset.p, cleared: true, updatedAt: Date.now() };
        T.docs[`p${b.dataset.p}`] = blank;
        NET.tx.publish(`live/p${b.dataset.p}`, blank, true).catch(() => {});
        renderTeacher();
      }
    } catch (err) {
      $('td-status').textContent = 'No se pudo enviar la orden. Revisa la conexión a internet.';
    }
    b.disabled = false;
  });
  $('td-csv').addEventListener('click', () => {
    const rows = [];
    Object.values(T.sessions)
      .sort((a, b) => (a.date || 0) - (b.date || 0))
      .forEach((s) => (s.rows || []).forEach((r) => {
        const m = /^p(\d)$/.exec(r.player || '');
        rows.push({ ...r, player: m && PLAYERS[+m[1]] ? PLAYERS[+m[1]].name : r.player });
      }));
    if (!rows.length) {
      $('td-status').textContent = 'Todavía no hay partidas terminadas en esta clase.';
      return;
    }
    csvDownload(rows);
  });
  $('td-back').addEventListener('click', () => {
    T.unsubs.forEach((u) => u && u());
    T.unsubs = [];
    clearInterval(T.tick);
    NET.role = 'player';
    toTitle();
  });
  $('btn-teacher').addEventListener('click', () => toTeacher());

  // ---------- Talk ----------
  const talkGroup = new THREE.Group();
  scene.add(talkGroup);
  const starsEl = $('t-stars');
  starsEl.innerHTML = STAR_SVG.repeat(3);
  starsEl.querySelectorAll('svg').forEach((svg, k) => {
    svg.addEventListener('click', () => {
      if (S.mode !== 'talk') return;
      giveStars(S.stars[S.wi] === k + 1 ? k : k + 1);
    });
  });
  function renderStars(anim) {
    starsEl.querySelectorAll('svg').forEach((s, k) => {
      s.classList.remove('on');
      if (k < S.stars[S.wi]) {
        if (anim) void s.getBoundingClientRect();
        s.classList.add('on');
      }
    });
  }
  const fmt = (t) => {
    const s = Math.ceil(t);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  function renderTimer() {
    $('t-timer').textContent = fmt(S.talkLeft);
    $('t-timer').classList.toggle('low', S.talkLeft <= 10);
    $('t-bar').style.transform = `scaleX(${S.talkLeft / TALK_SECONDS})`;
  }
  function startTalk() {
    if (S.mode !== 'play') return;
    S.mode = 'talk';
    S.lastTalkWi = S.wi;
    logEvent('On the stage: talking now', true);
    S.talkLeft = TALK_SECONDS;
    S.talkRunning = true;
    S.stars[S.wi] = 0;
    placeAvatar(V(STAGE.x, STAGE.top, STAGE.z), 0);
    $('t-frames').innerHTML = WORLDS[S.wi].frames.map((f) => `<div class="line">${f}</div>`).join('');
    const clues = S.clues[S.wi];
    $('t-clues').innerHTML = clues.length ? '<span class="lab">Your clues:</span>' + clues.map((c) => `<span class="chip">${thumbImg(c.obj, c.label)}${esc(c.label)}</span>`).join('') : '';
    renderStars(false);
    renderTimer();
    showLayer('talk');
    arrow.visible = false;
    task(null);
    if (W.stageSign) W.stageSign.visible = false;
    W.ladder.forEach((l) => (l.sp.visible = false));
    while (talkGroup.children.length) talkGroup.remove(talkGroup.children[0]);
    clues.filter((c) => c.obj).forEach((c, k) => {
      const o = makeObject(c.obj, 1.5);
      o.userData.k = k;
      talkGroup.add(o);
    });
    talkGroup.position.set(STAGE.x, STAGE.top, STAGE.z);
    talkGroup.visible = true;
    sfx.portal();
    stopMusic();
  }
  function endTalk() {
    if (S.mode !== 'talk') return;
    S.talkRunning = false;
    sfx.end();
    talkGroup.visible = false;
    if (W.stageSign) W.stageSign.visible = true;
    W.ladder.forEach((l) => (l.sp.visible = true));
    S.mode = 'play';
    showLayer('play');
    arrow.visible = true;
    burst(V(STAGE.x, 3, STAGE.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 40, { speed: 8, up: 10, geo: starGeo, size: 0.3 });
    feedback('Well done!', true);
    startMusic(WORLDS[S.wi].music);
    completeQuest();
  }
  function payStars(wi) {
    S.starsPaid = S.starsPaid || [];
    const extra = (S.stars[wi] || 0) - (S.starsPaid[wi] || 0);
    if (extra > 0) {
      S.starsPaid[wi] = S.stars[wi];
      earn(extra * 5, `${extra} ★ from the teacher`);
    }
  }
  function giveStars(n) {
    if (S.mode !== 'talk') return;
    S.stars[S.wi] = n;
    payStars(S.wi);
    renderStars(true);
    logEvent(`Talk stars: ${n} ★`, true);
    if (n > 0) {
      sfx.stars(n);
      burst(AV.pos.clone().add(V(0, 3, 0)), ['#FDD835'], 6 + n * 5, { speed: 5, up: 8, geo: starGeo, size: 0.35 });
      feedback(n === 3 ? 'Amazing!' : n === 2 ? 'Great job!' : 'Good try!', true, 't-feedback');
    }
  }

  // ---------- Portal & warp ----------
  function openPortal(final) {
    const P = W.portal;
    P.active = true;
    const c = final ? '#FDD835' : WORLDS[S.wi].color;
    P.ringMat.color.set(c);
    P.ringMat.emissive.set(c);
    P.ringMat.emissiveIntensity = 0.6;
    sfx.portal();
    burst(V(PORTAL.x, 4.2, PORTAL.z), ['#FFFFFF', c, '#FDD835'], 40, { speed: 7, up: 6 });
  }

  const warp = (() => {
    const g = new THREE.Group();
    const tU = { t: { value: 0 }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() } };
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 400, 32, 1, true),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, uniforms: tU, fog: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec2 vUv; void main(){ float s = sin(vUv.y*260.0 + t*30.0 + sin(vUv.x*6.2832*3.0)*2.0)*0.5+0.5; float r = sin(vUv.x*6.2832*6.0 + t*2.0)*0.5+0.5; vec3 col = mix(c1, c2, s*0.7 + r*0.3); gl_FragColor = vec4(col,1.0);\n#include <colorspace_fragment>\n}',
      })
    );
    tube.rotation.x = Math.PI / 2;
    g.add(tube);
    const N = 500, p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 5.5;
      p.set([Math.cos(a) * r, Math.sin(a) * r, -Math.random() * 200], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.25, fog: false })));
    g.position.set(0, 500, 0);
    g.visible = false;
    scene.add(g);
    return { g, tU, geo, t: 0, dur: 3.6, next: 0 };
  })();

  function startWarp() {
    if (S.mode !== 'play') return;
    if (S.Q) S.Q.done = true;
    task(null);
    S.mode = 'warp';
    const nextWi = S.wi + 1;
    warp.next = nextWi;
    warp.t = 0;
    const to = nextWi < WORLDS.length ? WORLDS[nextWi] : null;
    warp.tU.c1.value.set(WORLDS[S.wi].color);
    warp.tU.c2.value.set(to ? to.color : '#FDD835');
    $('w-to').textContent = to ? to.name : (GAME.finaleStage || 'THE TIME MASTER STAGE');
    showLayer('warp');
    W.group.visible = false;
    sky.visible = false;
    scene.fog.near = 1000;
    scene.fog.far = 2000;
    arrow.visible = false;
    warp.g.visible = true;
    placeAvatar(V(0, 499.2, -7));
    stopMusic();
    whoosh(warp.dur);
  }
  function endWarp() {
    warp.g.visible = false;
    sky.visible = true;
    scene.fog.near = 60;
    scene.fog.far = 170;
    earn(10, `${WORLDS[warp.next - 1] ? WORLDS[warp.next - 1].name : 'World'} done`);
    if (warp.next < WORLDS.length) enterWorld(warp.next);
    else toFinale();
  }

  // ---------- Finale ----------
  const finale = new THREE.Group();
  finale.visible = false;
  scene.add(finale);
  let fireworkT = 0;
  const talkRows = [];
  // Teacher can fix the talk stars on the results screen (click a star).
  $('f-rows').addEventListener('click', (e) => {
    const star = e.target.closest('.fs');
    const box = e.target.closest('.st.edit');
    if (!star || !box || S.mode !== 'finale') return;
    const w = +box.dataset.w, n = +star.dataset.n;
    setFinalStars(w, S.stars[w] === n ? n - 1 : n);
  });
  // stars that arrive after the game ended still count (and are saved again)
  function setFinalStars(w, n) {
    S.stars[w] = n;
    const box = document.querySelector(`#f-rows .st.edit[data-w="${w}"]`);
    if (box) box.querySelectorAll('.fs').forEach((el) => el.classList.toggle('on', +el.dataset.n <= n));
    if (talkRows[w]) talkRows[w].score = n;
    $('f-stars').textContent = S.stars.reduce((a, b) => a + b, 0);
    sfx.stars(Math.max(1, n));
    payStars(w);
    $('f-earn').textContent = `+${S.earned || 0}`;
    if (S.finalRows) {
      if (NET.tx) saveSession(S.finalRows);
      if (NET.room && WEB) DB.save({ run: NET.runId, room: NET.room, game: GAME.id, player: S.player, state: null, status: 'finished', rows: S.finalRows.map((r) => ({ ...r, player: `p${S.player}` })) });
    }
  }
  const pad2 = (n) => String(n).padStart(2, '0');
  const stamp = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  function toFinale() {
    S.mode = 'finale';
    if (W) W.group.visible = false;
    applyAtmosphere({ theme: 'finale', skyTop: '#0E2233', skyBottom: '#2C5F7C', fog: '#1D3F54', hemi: ['#E1F5FE', '#1D3F54', 1.9], sun: ['#FFFFFF', 2.2] });
    while (finale.children.length) finale.remove(finale.children[0]);
    finale.visible = true;
    finale.add(at(mesh(new THREE.CylinderGeometry(3, 3.4, 1.2, 16), '#FDD835', { metalness: 0.3, roughness: 0.5 }), 0, -0.6, 0));
    finale.add(at(mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.6, 16), '#145389'), 0, -1.5, 0));
    const minis = WORLDS.filter((w) => w.theme !== 'arena').slice(0, 4);
    minis.forEach((w, i) => {
      const mini = new THREE.Group();
      mini.add(mesh(new THREE.CylinderGeometry(3, 2.8, 0.8, 12), w.color));
      const c = at(mesh(new THREE.ConeGeometry(2.8, 4, 12), w.rock), 0, -2.4, 0);
      c.rotation.x = Math.PI;
      mini.add(c);
      mini.position.set((i - (minis.length - 1) / 2) * 14, 6 + (i % 2) * 2, -22);
      mini.userData.phase = i;
      const lab = textSprite(w.short.toUpperCase(), { bg: w.color, scale: 0.7 });
      lab.position.set(0, 3, 0);
      mini.add(lab);
      finale.add(mini);
    });
    const objs = S.clues.flat().filter((c) => c.obj);
    objs.forEach((c, k) => {
      const o = makeObject(c.obj, 1.3);
      o.userData.orbit = { a: (k / Math.max(1, objs.length)) * Math.PI * 2, r: 4.2 + (k % 2) * 0.8, y: 1.2 + (k % 3) * 0.9 };
      finale.add(o);
    });
    placeAvatar(V(0, 0, 0), 0);
    avatarHolder.visible = true;
    arrow.visible = false;
    sfx.fanfare();

    const name = PLAYERS[S.player].name;
    let pts = 0, ptsMax = 0;
    S.results.flat().forEach((r) => {
      pts += r.score;
      ptsMax += r.max;
    });
    const crys = S.crystals.reduce((a, b) => a + b, 0), crysMax = S.crystalsMax.reduce((a, b) => a + b, 0);
    $('f-title').textContent = (GAME.finaleTitle || 'You are a Time Master, {name}!').replace('{name}', name);
    $('f-stars').textContent = S.stars.reduce((a, b) => a + b, 0);
    $('f-pts').textContent = `${pts}/${ptsMax}`;
    $('f-crys').textContent = `${crys}/${crysMax}`;
    $('f-saved').textContent = '';
    $('f-rows').innerHTML = WORLDS.map((w, i) => {
      const hasTalk = w.quests.some((q) => q.type === 'talk');
      const stars = hasTalk ? `<span class="st edit" data-w="${i}">${[1, 2, 3].map((n) => `<span class="fs${n <= S.stars[i] ? ' on' : ''}" data-n="${n}">★</span>`).join('')}</span>` : '<span class="st"></span>';
      const chips = S.results[i].map((r) => `<span class="rc">${esc(r.short)} <b>${r.score}/${r.max}</b></span>`).join('');
      return `<div class="wrow"><span class="nm" style="background:${w.color};${w.theme === 'arena' ? 'color:#145389' : ''}">${w.short}</span>${stars}<span class="chips">${chips}</span></div>`;
    }).join('');
    const when = stamp(new Date());
    const before = S.rows.length;
    WORLDS.forEach((w, i) => {
      for (const r of S.results[i]) S.rows.push({ player: name, world: w.short, challenge: r.name, score: r.score, max: r.max, details: r.details, date: when });
      if (w.quests.some((q) => q.type === 'talk')) {
        const row = { player: name, world: w.short, challenge: 'Talk stars', score: S.stars[i], max: 3, details: S.clues[i].map((c) => c.label).join('; '), date: when };
        S.rows.push(row);
        talkRows[i] = row;
      }
      S.rows.push({ player: name, world: w.short, challenge: 'Time crystals (bonus)', score: S.crystals[i], max: S.crystalsMax[i], details: '', date: when });
    });
    S.finalRows = S.rows.slice(before);
    $('f-earn').textContent = `+${S.earned || 0}`;
    $('f-wallet').textContent = walletFor(S.player).crystals;
    if (NET.tx) {
      saveSession(S.rows.slice(before));
      logEvent('Finished the game! 🏆', true);
    }
    clearSave(S.player);
    if (NET.room && WEB) DB.save({ run: NET.runId, room: NET.room, game: GAME.id, player: S.player, state: null, status: 'finished', rows: S.rows.slice(before).map((r) => ({ ...r, player: `p${S.player}` })) });
    showLayer('final');
    camRig.pos.set(7.2, 3.4, 13);
    camRig.target.set(7.2, 1.8, 0);
    fireworkT = 0;
  }

  const csvCell = (v) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  function downloadCSV() {
    csvDownload(S.rows);
    $('f-saved').textContent = 'Saved! Check your Downloads folder.';
    sfx.click();
  }
  async function csvDownload(rowsIn) {
    const head = ['player', 'world', 'challenge', 'score', 'max', 'details', 'date'];
    const lines = [head.join(',')];
    for (const r of rowsIn) lines.push(head.map((h) => csvCell(r[h])).join(','));
    if (NET.tx && NET.tx.kind === 'db' && window.claude && window.claude.use) {
      // Inside claude.ai the page cannot download by itself: ask the viewer through `downloads`.
      const dl = await window.claude.use('downloads').catch(() => null);
      if (dl) {
        const d0 = new Date();
        try {
          await dl.save({ filename: `${GAME.csvPrefix || 'TimeTravel'}_results_${d0.getFullYear()}-${pad2(d0.getMonth() + 1)}-${pad2(d0.getDate())}.csv`, data: '\uFEFF' + lines.join('\r\n') + '\r\n' });
        } catch (e) {
          /* viewer declined or saves are off here */
        }
        return;
      }
    }
    const blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${GAME.csvPrefix || 'S24_TimeTravel'}_results_${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }
  $('btn-csv').addEventListener('click', downloadCSV);
  $('btn-next').addEventListener('click', () => toTitle());

  function skip() {
    if (S.mode === 'talk') return endTalk();
    if (S.mode !== 'play' || !S.Q || S.Q.done) return;
    const Q = S.Q;
    const H = HANDLERS[Q.def.type];
    if (!Q.started) {
      Q.started = true;
      H.start(Q);
    }
    H.skip(Q);
  }

  // ---------- Input ----------
  for (const b of document.querySelectorAll('button')) {
    b.tabIndex = -1;
    b.addEventListener('mousedown', (e) => e.preventDefault());
  }
  const MOVE = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keyup', (e) => {
    if (MOVE[e.code]) keys.delete(MOVE[e.code]);
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  });
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = e.key;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter'].includes(k)) e.preventDefault();
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    ac();
    if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.();
      return;
    }
    if (k === 'm' || k === 'M') {
      muted = !muted;
      if (muted) stopMusic();
      else if (S.mode === 'play') startMusic(WORLDS[S.wi].music);
      return;
    }
    if (k === 'h' || k === 'H') {
      $('O-help').classList.toggle('on');
      return;
    }
    if ($('O-exit').classList.contains('on')) {
      if (k === 'Enter' && !e.repeat) exitGame();
      else if (k === 'Escape' && !e.repeat) askExit(false);
      return;
    }
    if (k === 'Escape' && !e.repeat && (S.mode === 'play' || S.mode === 'talk')) {
      askExit(true);
      return;
    }
    if ((k === 'p' || k === 'P') && (S.mode === 'play' || S.mode === 'talk')) {
      S.paused = !S.paused;
      $('O-pause').classList.toggle('on', S.paused);
      keys.clear();
      return;
    }
    if (S.paused) return;
    switch (S.mode) {
      case 'title':
        if (!NET.unlocked) break;
        if (k === '1') choosePlayer(0);
        else if (k === '2') choosePlayer(1);
        else if (k === 't' || k === 'T') toTeacher();
        break;
      case 'look':
        if ((k === 'Enter' || k === 'Escape') && !e.repeat) closeLook();
        break;
      case 'brief':
        if ((k === 'l' || k === 'L') && !e.repeat) openLook();
        else if ((k === 'Enter' || k === ' ') && !e.repeat) startTrip(S.save || null);
        else if ((k === 'n' || k === 'N') && S.save && !e.repeat) startTrip();
        else if (k === 'Escape' || k === 'Backspace') toTitle();
        break;
      case 'play':
        if (MOVE[e.code]) keys.add(MOVE[e.code]);
        if (k === ' ') AV.jumpBuf = 0.15;
        if (e.code === 'KeyC' && !e.repeat) setCam(camIdx + 1);
        if ((k === 'k' || k === 'K') && !e.repeat) skip();
        if (k === 'Enter' && !e.repeat && S.Q && !S.Q.done && HANDLERS[S.Q.def.type].next) HANDLERS[S.Q.def.type].next(S.Q);
        {
          const dk = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
          if (dk && !e.repeat && S.Q && !S.Q.done && HANDLERS[S.Q.def.type].pick) HANDLERS[S.Q.def.type].pick(S.Q, +dk[1] - 1);
        }
        break;
      case 'talk':
        if (e.repeat) return;
        if (starKey(e) !== null) giveStars(starKey(e));
        else if (k === 'Enter' || k === 'k' || k === 'K') endTalk();
        else if (k === 'r' || k === 'R') {
          S.talkLeft = TALK_SECONDS;
          S.talkRunning = true;
          renderTimer();
          sfx.click();
        }
        break;
      case 'finale':
        if (k === 'd' || k === 'D') downloadCSV();
        else if (k === 'n' || k === 'N') toTitle();
        break;
    }
  });

  // Stars: number row or numpad, with or without Num Lock
  function starKey(e) {
    const m = /^(?:Digit|Numpad)([0-3])$/.exec(e.code || '');
    if (m) return +m[1];
    if (['0', '1', '2', '3'].includes(e.key)) return +e.key;
    return null;
  }

  // ---------- Touch controls (joystick, JUMP, OK) ----------
  const TOUCH = { x: 0, z: 0, id: null };
  const isTouch = () => (window.matchMedia && matchMedia('(pointer: coarse)').matches) || params.has('touch');
  if (isTouch()) document.body.classList.add('touch');
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
  {
    const joy = $('joy'), knob = $('joy-k');
    const move = (e) => {
      const r = joy.getBoundingClientRect();
      const R = r.width / 2;
      let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
      const d = Math.hypot(dx, dy);
      if (d > R) {
        dx *= R / d;
        dy *= R / d;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.hypot(dx, dy) / R;
      TOUCH.x = m < 0.18 ? 0 : dx / R;
      TOUCH.z = m < 0.18 ? 0 : dy / R;
    };
    const end = (e) => {
      if (e.pointerId !== TOUCH.id) return;
      TOUCH.id = null;
      TOUCH.x = TOUCH.z = 0;
      knob.style.transform = '';
    };
    joy.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      TOUCH.id = e.pointerId;
      try {
        joy.setPointerCapture(e.pointerId);
      } catch (err) {
        /* old browser */
      }
      move(e);
    });
    joy.addEventListener('pointermove', (e) => e.pointerId === TOUCH.id && move(e));
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    const press = (key, code) => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code }));
    };
    $('tc-jump').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      AV.jumpBuf = 0.15;
    });
    $('tc-ok').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      press('Enter', 'Enter');
    });
    $('b-go').addEventListener('click', () => S.mode === 'brief' && startTrip());
    for (const b of [$('tc-jump'), $('tc-ok'), $('b-go')]) b.tabIndex = -1;
  }
  let lastPlayCls = '';
  function syncTouchClasses() {
    const c = S.mode === 'play' || S.mode === 'talk' ? S.mode : '';
    if (c === lastPlayCls) return;
    lastPlayCls = c;
    document.body.classList.toggle('playing', !!c);
    document.body.classList.toggle('talking', c === 'talk');
    if (!c) {
      TOUCH.x = TOUCH.z = 0;
      TOUCH.id = null;
      $('joy-k').style.transform = '';
    }
  }

  function gamepadInput() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const x = Math.abs(gp.axes[0]) > 0.25 ? gp.axes[0] : 0;
      const z = Math.abs(gp.axes[1]) > 0.25 ? gp.axes[1] : 0;
      const jump = gp.buttons[0] && gp.buttons[0].pressed;
      if (jump && !gamepadInput.prev) AV.jumpBuf = 0.15;
      gamepadInput.prev = jump;
      return { x, z };
    }
    return { x: 0, z: 0 };
  }

  // ---------- Physics ----------
  const SPEED = 8.5, JUMP_V = 10.2, GRAV = 26, BOUNCE_V = 18;
  function groundAt(x, z, y) {
    let h = 0;
    for (const p of W.platforms) {
      const inside = p.rect ? Math.abs(x - p.x) <= p.hw && Math.abs(z - p.z) <= p.hd : Math.hypot(x - p.x, z - p.z) <= p.r;
      if (inside && p.top <= y + 0.55) h = Math.max(h, p.top);
    }
    return h;
  }
  function resolve(x, z, y) {
    for (const c of W.colliders) {
      const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.5;
      if (d < m && d > 0.0001) {
        x = c.x + (dx / d) * m;
        z = c.z + (dz / d) * m;
      }
    }
    for (const p of W.platforms) {
      if (p.rect || p.top <= y + 0.55) continue;
      const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), m = p.r + 0.45;
      if (d < m && d > 0.0001) {
        x = p.x + (dx / d) * m;
        z = p.z + (dz / d) * m;
      }
    }
    const d = Math.hypot(x, z);
    if (d > ISLAND_R) {
      x *= ISLAND_R / d;
      z *= ISLAND_R / d;
    }
    return [x, z];
  }

  function updateAvatar(dt) {
    let ix = 0, iz = 0;
    if (S.mode === 'play' && !(S.Q && S.Q.chat)) {
      ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      iz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      const gp = gamepadInput();
      ix += gp.x + TOUCH.x;
      iz += gp.z + TOUCH.z;
    }
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    {
      // arrows follow the screen, whatever camera is chosen
      const [fx, fz] = CAMS[camIdx].f;
      const mx = -fz * ix - fx * iz, mz = fx * ix - fz * iz;
      ix = mx;
      iz = mz;
    }
    const k = 1 - Math.exp(-dt * 12);
    AV.vel.x = lerp(AV.vel.x, ix * SPEED, k);
    AV.vel.z = lerp(AV.vel.z, iz * SPEED, k);
    AV.coyote = AV.onGround ? 0.12 : AV.coyote - dt;
    AV.jumpBuf -= dt;
    if (S.mode === 'play' && AV.jumpBuf > 0 && AV.coyote > 0) {
      AV.vel.y = JUMP_V;
      AV.onGround = false;
      AV.coyote = 0;
      AV.jumpBuf = 0;
      sfx.jump();
    }
    AV.vel.y -= GRAV * dt;
    if (S.mode === 'finale') {
      AV.vel.set(0, 0, 0);
      AV.pos.y = 0;
      return;
    }
    const [nx, nz] = resolve(AV.pos.x + AV.vel.x * dt, AV.pos.z + AV.vel.z * dt, AV.pos.y);
    AV.pos.x = nx;
    AV.pos.z = nz;
    const gh = groundAt(nx, nz, AV.pos.y);
    AV.pos.y += AV.vel.y * dt;
    if (AV.pos.y <= gh) {
      if (!AV.onGround && AV.vel.y < -7) AV.land = 0.25;
      AV.pos.y = gh;
      AV.vel.y = 0;
      AV.onGround = true;
    } else if (AV.pos.y > gh + 0.05) AV.onGround = false;
    if (S.mode === 'play' && AV.onGround) {
      for (const tp of W.tramps) {
        if (Math.hypot(AV.pos.x - tp.x, AV.pos.z - tp.z) < 1.5) {
          AV.vel.y = BOUNCE_V;
          AV.onGround = false;
          tp.squash = 0.35;
          sfx.boing();
          burst(V(tp.x, 0.6, tp.z), ['#FFFFFF', WORLDS[S.wi].color], 10, { speed: 4, up: 3 });
        }
      }
    }
  }

  function animateAvatar(dt, t) {
    const M = AV.model;
    if (!M) return;
    const sp = Math.hypot(AV.vel.x, AV.vel.z);
    if (sp > 0.6) {
      let d = Math.atan2(AV.vel.x, AV.vel.z) - AV.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      AV.yaw += d * Math.min(1, dt * 12);
    }
    M.root.position.copy(AV.pos);
    M.root.rotation.y = AV.yaw;
    const amt = Math.min(1, sp / SPEED);
    AV.phase += dt * (4 + sp * 1.3);
    let legA = Math.sin(AV.phase) * 0.8 * amt, armA = -legA;
    if (S.mode === 'warp') {
      M.root.rotation.set(-Math.PI / 2 + 0.2, Math.PI, Math.sin(t * 3) * 0.2);
      M.armL.rotation.set(Math.PI, 0, 0.2);
      M.armR.rotation.set(Math.PI, 0, -0.2);
      M.legL.rotation.x = Math.sin(t * 10) * 0.2;
      M.legR.rotation.x = -Math.sin(t * 10) * 0.2;
      M.tail.rotation.x = 0.4 + Math.sin(t * 20) * 0.3;
      M.blob.visible = false;
      return;
    }
    M.root.rotation.x = 0;
    M.root.rotation.z = 0;
    M.blob.visible = true;
    if (!AV.onGround) {
      legA = 0.6;
      armA = -2.4;
    }
    let armZ = 0;
    if (S.mode === 'talk') {
      armA = Math.sin(t * 2.2) * 0.5 - 0.3;
      armZ = 0.25 + Math.sin(t * 1.7) * 0.15;
      legA = 0;
    }
    if (S.mode === 'finale') {
      armA = Math.PI + Math.sin(t * 6) * 0.25;
      armZ = 0.35;
      legA = 0;
      M.body.position.y = Math.abs(Math.sin(t * 4)) * 0.5;
    } else M.body.position.y = 0;
    M.legL.rotation.x = legA;
    M.legR.rotation.x = AV.onGround ? -legA : 0.2;
    M.armL.rotation.set(armA, 0, -armZ);
    M.armR.rotation.set(AV.onGround || S.mode !== 'play' ? -armA : armA, 0, armZ);
    if (S.mode === 'talk') M.armR.rotation.x = -0.3 - Math.sin(t * 2.2 + 1) * 0.6;
    M.tail.rotation.x = 0.2 + Math.sin(t * 6) * 0.15 + amt * 0.5;
    AV.land = Math.max(0, AV.land - dt);
    const sq = AV.land > 0 ? 1 - Math.sin((AV.land / 0.25) * Math.PI) * 0.18 : 1;
    M.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    M.head.rotation.y = S.mode === 'talk' ? Math.sin(t * 0.9) * 0.3 : 0;
    const gh = W && S.mode !== 'finale' ? groundAt(AV.pos.x, AV.pos.z, AV.pos.y) : 0;
    M.blob.position.set(AV.pos.x, gh + 0.03, AV.pos.z);
    M.blob.scale.setScalar(Math.max(0.4, 1 - (AV.pos.y - gh) * 0.15));
  }

  // ---------- Camera ----------
  const camRig = { pos: V(0, 30, 70), target: V(0, 0, 0) };
  // views the player can choose (C key or the camera button); f = the camera's "forward" on the ground
  const CAMS = [
    { id: 'follow', name: 'Normal', f: [0, -1], p: (w) => V(0, 8.5, 13.5 * w), t: V(0, -0.5, 1.0) },
    { id: 'aerial', name: 'Aerial', f: [0, -1], p: (w) => V(0, 22, 5 * w), t: V(0, 0, -0.5) },
    { id: 'side', name: 'Side', f: [-1, 0], p: (w) => V(13 * w, 5, 0), t: V(0, 1.2, 0) },
    { id: 'close', name: 'Close', f: [0, -1], p: () => V(0, 3.6, 7.5), t: V(0, 1.3, -2.5) },
  ];
  let camIdx = Math.max(0, CAMS.findIndex((c) => c.id === lsGet('ccaCam')));
  function setCam(i) {
    camIdx = (i + CAMS.length) % CAMS.length;
    $('cam-name').textContent = CAMS[camIdx].name;
    lsSet('ccaCam', CAMS[camIdx].id);
  }
  setCam(camIdx);
  $('btn-cam').tabIndex = -1;
  $('btn-cam').addEventListener('mousedown', (e) => e.preventDefault());
  $('btn-cam').addEventListener('click', () => {
    setCam(camIdx + 1);
    sfx.click();
  });
  function updateCamera(dt, t) {
    let wantP, wantT, k = 1 - Math.exp(-dt * 3.5);
    const wide = Math.max(1, 16 / 9 / camera.aspect);
    const wideP = Math.min(wide, 1.7); // phones held upright: keep the hero big
    if (S.mode === 'title' || S.mode === 'brief' || S.mode === 'teacher') {
      const a = t * 0.06;
      wantP = V(Math.sin(a) * 64 * wide, 34, Math.cos(a) * 64 * wide);
      wantT = V(0, 0, 0);
      k = 1;
    } else if (S.mode === 'play') {
      const C = CAMS[camIdx];
      wantP = AV.pos.clone().add(C.p(wideP));
      wantT = AV.pos.clone().add(C.t);
      if (C.id === 'follow') wantP.y = Math.max(wantP.y, 8.5);
    } else if (S.mode === 'look') {
      const portrait = camera.aspect < 1;
      const side = portrait ? V(0, 0.2, 0) : V(2.1, 1.5, 0);
      wantT = AV.pos.clone().add(side);
      wantP = AV.pos.clone().add(V(side.x, portrait ? 2.6 : 2.3, portrait ? 10 : 7.2));
    } else if (S.mode === 'talk') {
      wantP = V(STAGE.x + Math.sin(t * 0.15) * 1.5, STAGE.top + 3.0, STAGE.z + 10.5 * wideP);
      wantT = V(STAGE.x, STAGE.top + 2.2, STAGE.z);
    } else if (S.mode === 'warp') {
      wantP = V(Math.sin(t * 2) * 0.6, 500 + Math.cos(t * 1.7) * 0.4, 0);
      wantT = V(0, 499.5, -20);
      k = 1;
    } else {
      wantP = V(7.2 * wide + Math.sin(t * 0.3) * 0.8, 3.6, 13 * wide);
      wantT = V(7.2 * wide, 2.0, 0);
    }
    camRig.pos.lerp(wantP, k);
    camRig.target.lerp(wantT, k);
    camera.position.copy(camRig.pos);
    camera.lookAt(camRig.target);
  }

  // ---------- Loop ----------
  function update(dt, t, realDt) {
    if (W) for (const u of W.updaters) u(t, dt);
    if (W) for (const c of W.group.children) if (c.userData.spin) c.rotation.y += dt * c.userData.spin;
    syncTouchClasses();
    if (S.mode === 'look') AV.yaw = Math.sin(t * 0.7) * 0.7;
    if (S.mode === 'play' || S.mode === 'talk' || S.mode === 'finale') updateAvatar(dt);
    if (S.mode !== 'title' && S.mode !== 'brief' && S.mode !== 'teacher') animateAvatar(dt, t);

    if (W && W.group.visible) {
      for (const pk of W.pickups) {
        if (pk.vanish !== undefined) {
          pk.vanish += dt;
          pk.group.scale.setScalar(Math.max(0.001, 1 - pk.vanish * 3));
          if (pk.vanish > 0.4) pk.group.visible = false;
          continue;
        }
        if (pk.taken) {
          pk.flyT += dt * 2.2;
          pk.group.position.lerp(AV.pos.clone().add(V(0, 1.6, 0)), Math.min(1, pk.flyT));
          pk.group.scale.setScalar(Math.max(0.001, 1 - pk.flyT));
          if (pk.flyT >= 1) pk.group.visible = false;
          continue;
        }
        pk.obj.position.y = 1.7 + Math.sin(t * 2 + pk.phase) * 0.25;
        pk.obj.rotation.y += dt * 1.2;
        if (pk.obj.userData.update) pk.obj.userData.update(t);
        pk.ring.scale.setScalar(1 + Math.sin(t * 3 + pk.phase) * 0.12);
      }
      for (const npc of W.npcs) {
        npc.f(t);
        npc.ring.material.opacity = 0.3 + Math.sin(t * 3 + npc.phase) * 0.2;
      }
      for (const [k, p] of W.pads.entries()) {
        if (p.flash > 0) {
          p.flash -= dt;
          if (p.flash <= 0) p.mesh.material = mat(S.Q && S.Q.def.type === 'stones' && !S.Q.done ? WORLDS[S.wi].light : '#E3EAF0');
          else p.mesh.material = mat(p.flashColor);
        }
        if (p.shake > 0) p.shake -= dt;
        p.mesh.position.x = p.x + (p.shake > 0 ? Math.sin(t * 60) * 0.15 : 0);
        p.word.position.y = 3.4 + Math.sin(t * 2 + k) * 0.15;
      }
      if (W.patient) W.patient.rotation.z = Math.sin(t * 1.5) * 0.08;
      if (W.showcase) {
        W.showcase.rotation.y += dt * 0.8;
        W.showcase.position.y = 3.2 + Math.sin(t * 2) * 0.15;
      }
      if (W.people) for (const npc of W.people) {
        npc.f(t);
        npc.ring.material.opacity = npc.met ? 0.15 : 0.3 + Math.sin(t * 3 + npc.phase) * 0.2;
      }
      for (const two of [W.zones, W.opin]) {
        if (!two) continue;
        if (two.center) {
          two.center.rotation.y += dt * 0.8;
          two.center.position.y = 2.8 + Math.sin(t * 2) * 0.2;
        }
        for (const ar of two.areas) {
          ar.flash = Math.max(0, ar.flash - dt);
          ar.disc.position.y = 0.15 + (ar.flash > 0 ? Math.abs(Math.sin(t * 20)) * 0.25 : 0);
          ar.icon.rotation.y += dt;
          ar.icon.position.y = 2.6 + Math.sin(t * 2) * 0.2;
        }
      }
      for (const tp of W.tramps) {
        tp.squash = Math.max(0, tp.squash - dt);
        tp.pad.scale.y = 1 - Math.sin((tp.squash / 0.35) * Math.PI) * 0.6;
      }
      for (const c of W.crystals) {
        if (c.taken) continue;
        c.mesh.rotation.y += dt * 2;
        c.mesh.position.y = c.pos.y + Math.sin(t * 2.5 + c.pos.x) * 0.2;
        if (S.mode === 'play' && Math.hypot(AV.pos.x - c.pos.x, AV.pos.y + 1 - c.pos.y, AV.pos.z - c.pos.z) < 1.6) {
          c.taken = true;
          c.mesh.visible = false;
          S.crystals[S.wi]++;
          earn(1);
          schedulePush();
          sfx.gem();
          burst(c.pos.clone(), ['#64FFDA', '#FFFFFF'], 10, { speed: 3, up: 4 });
          renderPack();
        }
      }
      if (W.stageRing) W.stageRing.material.opacity = S.Q && S.Q.def.type === 'talk' ? 0.6 + Math.sin(t * 5) * 0.35 : 0.4;
      if (W.portal) {
        const P = W.portal;
        P.swirlU.t.value = t;
        P.swirlU.on.value = lerp(P.swirlU.on.value, P.active ? 1 : 0, dt * 2);
        P.ring.rotation.z = P.active ? t * 0.8 : 0;
      }

      // signs fade when the camera is very close, so they never cover the screen
      const wp = new THREE.Vector3();
      for (const sp of W.sprites) {
        sp.getWorldPosition(wp);
        sp.material.opacity = clamp((wp.distanceTo(camera.position) - 7) / 5, 0, 1);
      }

      const live = S.Q && !S.Q.done && S.Q.started;
      if (S.mode === 'play' && live) {
        const H = HANDLERS[S.Q.def.type];
        if (H.update) H.update.call(H, S.Q, dt);
      }
      const H = live ? HANDLERS[S.Q.def.type] : null;
      const goal = S.mode === 'play' && H && H.goal ? H.goal(S.Q) : null;
      if (goal) {
        W.beacon.visible = true;
        W.beacon.position.set(goal.x, 20, goal.z);
        W.beacon.material.opacity = 0.12 + Math.sin(t * 4) * 0.05;
        const dx = goal.x - AV.pos.x, dz = goal.z - AV.pos.z;
        arrow.visible = Math.hypot(dx, dz) > 4;
        arrow.position.set(AV.pos.x, AV.pos.y + 3.4 + Math.sin(t * 5) * 0.12, AV.pos.z);
        arrow.rotation.y = Math.atan2(dx, dz);
      } else {
        W.beacon.visible = false;
        arrow.visible = false;
      }
    }

    if (S.mode === 'talk') {
      talkGroup.children.forEach((o) => {
        const a = t * 0.6 + (o.userData.k / 3) * Math.PI * 2;
        o.position.set(Math.cos(a) * 3.2, 2.4 + Math.sin(t * 1.5 + o.userData.k) * 0.3, Math.sin(a) * 3.2);
        o.rotation.y += dt;
        if (o.userData.update) o.userData.update(t);
      });
      if (S.talkRunning) {
        S.talkLeft = Math.max(0, S.talkLeft - realDt);
        renderTimer();
        if (S.talkLeft <= 0) endTalk();
      }
    }

    if (S.mode === 'warp') {
      warp.t += dt;
      warp.tU.t.value = warp.t;
      const a = warp.geo.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let z = a.getZ(i) + dt * 120;
        if (z > 5) z -= 200;
        a.setZ(i, z);
      }
      a.needsUpdate = true;
      if (warp.t > 0.6 && Math.random() < dt * 6) burst(V((Math.random() - 0.5) * 6, 500 + (Math.random() - 0.5) * 4, -24), ['#FFFFFF', '#FDD835'], 3, { speed: 2, up: 1, gravity: 0, life: 0.6, size: 0.5 });
      if (warp.t >= warp.dur) endWarp();
    }

    if (S.mode === 'finale') {
      finale.children.forEach((c) => {
        if (c.userData.orbit) {
          const o = c.userData.orbit, a = o.a + t * 0.5;
          c.position.set(Math.cos(a) * o.r, o.y + Math.sin(t * 2 + o.a) * 0.2, Math.sin(a) * o.r);
          c.rotation.y += dt;
        } else if (c.userData.phase !== undefined) c.position.y = 6 + (c.userData.phase % 2) * 2 + Math.sin(t + c.userData.phase) * 0.4;
      });
      fireworkT -= dt;
      if (fireworkT <= 0) {
        fireworkT = 0.9 + Math.random() * 0.7;
        const cols = [['#FDD835', '#FFFFFF'], ['#F57C00', '#FDD835'], ['#57A6B5', '#FFFFFF'], ['#7CB342', '#FDD835']][Math.floor(Math.random() * 4)];
        burst(V(-12 + Math.random() * 20, 9 + Math.random() * 6, -12 - Math.random() * 8), cols, 40, { speed: 9, up: 4, gravity: 4, life: 1.6, size: 0.9 });
        tone(300 + Math.random() * 300, 0, 0.3, 'sine', 0.04, 900);
      }
    }
    updateParts(dt);
  }

  function onResize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function loop() {
    const fullDt = Math.min(clock.getDelta(), 0.5);
    const rawDt = Math.min(fullDt, 0.05);
    const t = clock.elapsedTime;
    update(S.paused ? 0 : rawDt, t, S.paused ? 0 : fullDt);
    updateCamera(rawDt, t);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // Test / debug hooks (harmless in class).
  window.__TTS = {
    S, AV, TALK_SECONDS, GAME: () => GAME,
    WORLDS: WORLDS.map((w) => ({ key: w.key, quests: w.quests.map((q) => q.type) })),
    world: () => W,
    quest: () => (S.Q ? { type: S.Q.def.type, idx: S.Q.idx, max: S.Q.max, score: S.Q.score, done: !!S.Q.done, started: !!S.Q.started, phase: S.Q.phase, ready: S.Q.ready } : null),
    teleport: (x, z, y = 0) => placeAvatar(V(x, y, z), AV.yaw),
    answer: () => {
      const Q = S.Q;
      if (!Q) return null;
      const T = Q.def.type;
      if (T === 'stones') {
        const k = W.pads.findIndex((p) => p.answer === Q.list[Q.idx].a[0]);
        return { x: W.pads[k].x, z: PADS.z, y: 0.3 };
      }
      if (T === 'zones') {
        const c = W.zones.areas[Q.list[Q.idx].z].c;
        return { x: c.x, z: c.z, y: 0.3 };
      }
      if (T === 'opinion') return { x: OPIN.a.x, z: OPIN.a.z, y: 0.3 };
      if (T === 'stations') {
        const k = W.pads.findIndex((p, i) => !Q.doneK.has(i) && Q.items[i]);
        return k < 0 ? null : { x: W.pads[k].x, z: PADS.z, y: 0.3 };
      }
      if (T === 'interview') {
        const n = W.people.find((x) => !x.met);
        return n ? { x: n.spot.x, z: n.spot.z + 1.6, y: 0 } : null;
      }
      if (T === 'ladder') return W.ladder[Q.idx] ? { x: W.ladder[Q.idx].x, z: LADDER.z, y: 0.2 } : null;
      if (T === 'actions') {
        const t = Q.targets[Q.idx];
        const p = t.M.root.getWorldPosition(new THREE.Vector3());
        return { x: p.x, z: p.z + (t.action === 'swimming' ? 3.8 : 1.6), y: 0, action: t.action };
      }
      if (T === 'collect') {
        const pk = W.pickups.find((p) => !p.taken);
        return pk ? { x: pk.x, z: pk.z, y: pk.top } : null;
      }
      if (T === 'talk') return { x: STAGE.x, z: STAGE.z, y: STAGE.top };
      if (T === 'portal') return { x: PORTAL.x, z: PORTAL.z + 1, y: 0.4 };
      return null;
    },
    wrong: () => {
      const Q = S.Q;
      if (Q.def.type === 'stones') {
        const k = W.pads.findIndex((p) => p.answer !== Q.list[Q.idx].a[0]);
        return { x: W.pads[k].x, z: PADS.z, y: 0.3 };
      }
      if (Q.def.type === 'zones') {
        const c = W.zones.areas[1 - Q.list[Q.idx].z].c;
        return { x: c.x, z: c.z, y: 0.3 };
      }
      if (Q.def.type === 'actions') {
        const n = W.npcs.find((x) => !Q.targets.includes(x));
        const p = n.M.root.getWorldPosition(new THREE.Vector3());
        return { x: p.x, z: p.z + (n.action === 'swimming' ? 3.8 : 1.6), y: 0 };
      }
      return null;
    },
    tramp: () => TRAMPOLINES[0],
    perf: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
  };

  toTitle();
  initNet();
  requestAnimationFrame(loop);
}
