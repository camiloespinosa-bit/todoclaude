// The Time Travel Stage · GAME edition, Bloque 4 complete (CCA S24 "Show Bloque 4")
// The child walks a Time Traveler through 4 worlds. Same mechanics everywhere:
// walk, jump, step on the answer, talk on the stage, go into the portal.
import * as THREE from 'three';
import { OBJECTS, makeObject, mat, mesh, at, rod } from './objects.js';
import { ACTIONS, EVERY_RIGHT, LADDER_VERBS, TODAY_TOMORROW, CAN_Q, ADVICE_Q, DREAMS, OPINIONS, PAST_Q, MIX_Q } from './content.js';

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

const PLAYERS = [
  { name: 'Jerónimo', suit: '#145389', scarf: '#FDD835', hair: '#3B2A20', long: false },
  { name: 'Luciana', suit: '#F57C00', scarf: '#57A6B5', hair: '#5A3A22', long: true },
];

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

// ---------- Worlds ----------
const WORLDS = [
  {
    key: 'past', short: 'Past', name: 'YESTERDAY LAND', tense: 'This is the PAST.',
    color: '#F57C00', light: '#FFCC80', ground: '#E8A15A', ground2: '#D98A3E', path: '#F6D2A2', rock: '#7A4A2A', rock2: '#5B3820',
    skyTop: '#F4A259', skyBottom: '#FDEBD3', fog: '#F9DDBF', hemi: ['#FFF3E0', '#B07A4E', 1.9], sun: ['#FFE0B2', 2.4],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    frames: ['<b>Yesterday</b>, I ...', '<b>Last year</b>, I <b>went</b> to ...'],
    quests: [
      { type: 'collect', name: 'Find 3 things', short: 'Things', items: ['bike', 'ball', 'dog', 'plane', 'rain', 'book'] },
      { type: 'stones', name: 'Word Stones', short: 'Words', title: 'Word Stones', bank: PAST_Q, count: 3 },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'present', short: 'Present', name: 'TODAY TOWN', tense: 'This is the PRESENT.',
    color: '#57A6B5', light: '#B2E0E8', ground: '#7CC08A', ground2: '#5FA56E', path: '#E6EEF2', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#62B6CB', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
    frames: ['<b>Right now</b>, I <b>am</b> ...<b>ing</b>', '<b>Every day</b>, I ...', 'I <b>can</b> ...', 'I <b>think</b> ... <b>because</b> ...'],
    quests: [
      { type: 'actions', name: 'What are they doing?', short: 'Actions' },
      { type: 'zones', name: 'Every day or right now?', short: 'Every day / Right now', labels: ['EVERY DAY', 'RIGHT NOW'], subs: ['always · usually · every day', 'now · right now · Look!'], bank: EVERY_RIGHT, count: 4 },
      { type: 'stones', name: 'Can Stones', short: 'Can', title: 'Can Stones', bank: CAN_Q, count: 3 },
      { type: 'opinion', name: 'Opinion Corner', short: 'Opinions', count: 2 },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'future', short: 'Future', name: 'TOMORROW CITY', tense: 'This is the FUTURE.',
    color: '#7CB342', light: '#C5E1A5', ground: '#3E6B7E', ground2: '#2F5566', path: '#7FD3C4', rock: '#1D3F54', rock2: '#122A38',
    skyTop: '#10273A', skyBottom: '#2E6F78', fog: '#24525E', hemi: ['#B3E5FC', '#1D3F54', 1.5], sun: ['#C8F7FF', 1.6],
    music: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0],
    frames: ["<b>Someday</b>, I'm <b>going to</b> ...", "<b>I'd like to</b> ... <b>because</b> ...", '<b>Next year</b>, I <b>am going to</b> ...', 'If you are tired, you <b>should</b> ...'],
    quests: [
      { type: 'collect', name: 'Pick 3 dreams', short: 'Dreams', dreams: true },
      { type: 'ladder', name: 'Prediction Track', short: 'Prediction Track' },
      { type: 'zones', name: 'Today or tomorrow?', short: 'Today / Tomorrow', labels: ['TODAY', 'TOMORROW'], subs: ['I play · I am playing', 'I am going to play'], bank: TODAY_TOMORROW, count: 3 },
      { type: 'stones', name: 'Advice Clinic', short: 'Advice', title: 'Advice Clinic', bank: ADVICE_Q, count: 3, advice: true },
      { type: 'talk', name: 'Talk on the stage' },
      { type: 'portal', name: 'Go into the portal' },
    ],
  },
  {
    key: 'arena', short: 'Ultimate', name: 'ULTIMATE CHALLENGE', tense: 'Everything together!',
    color: '#FDD835', light: '#FFF59D', ground: '#E9C46A', ground2: '#D9AE4C', path: '#FFF3C4', rock: '#145389', rock2: '#0E3A63',
    skyTop: '#145389', skyBottom: '#F9C784', fog: '#E9CFA0', hemi: ['#FFF8E1', '#145389', 1.9], sun: ['#FFF3C4', 2.3],
    music: [329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
    frames: [],
    quests: [
      { type: 'stones', name: 'Ultimate Stones', short: 'Mixed review', title: 'Ultimate Stones', bank: MIX_Q, count: 5 },
      { type: 'portal', name: 'Go to the Time Master stage', final: true },
    ],
  },
];
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
if (!webglAvailable()) showNoGL();
else {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    showNoGL();
  }
}
if (renderer) {
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
    nightStars.visible = w.key === 'future' || w.key === 'finale';
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
  function makeAvatar(p) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const skin = p.skin || '#E9B48A';
    const leg = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.95, 0);
      g.add(at(mesh(new THREE.BoxGeometry(0.28, 0.9, 0.3), p.pants || '#1D3F54'), 0, -0.45, 0));
      g.add(at(mesh(new THREE.BoxGeometry(0.32, 0.18, 0.46), '#F7FAFC'), 0, -0.86, 0.06));
      body.add(g);
      return g;
    };
    const legL = leg(-0.2), legR = leg(0.2);
    body.add(at(mesh(new THREE.BoxGeometry(0.82, 0.88, 0.52), p.suit), 0, 1.4, 0));
    body.add(at(mesh(new THREE.BoxGeometry(0.86, 0.14, 0.56), '#1D3F54'), 0, 1.02, 0));
    if (p.hero) {
      const buckle = at(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), '#FDD835'), 0, 1.02, 0.29);
      buckle.rotation.x = Math.PI / 2;
      body.add(buckle);
      body.add(at(mesh(new THREE.BoxGeometry(0.62, 0.66, 0.3), '#2C5F7C'), 0, 1.45, -0.4));
      const clockFace = at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), '#FDD835', { emissive: '#B08800', emissiveIntensity: 0.6 }), 0, 1.5, -0.57);
      clockFace.rotation.x = Math.PI / 2;
      body.add(clockFace);
    }
    const arm = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 1.78, 0);
      g.add(at(mesh(new THREE.BoxGeometry(0.22, 0.74, 0.24), p.suit), 0, -0.36, 0));
      g.add(at(mesh(new THREE.SphereGeometry(0.14, 8, 6), skin), 0, -0.8, 0));
      body.add(g);
      return g;
    };
    const armL = arm(-0.53), armR = arm(0.53);
    const scarf = at(mesh(new THREE.TorusGeometry(0.3, 0.11, 6, 14), p.scarf), 0, 1.86, 0);
    scarf.rotation.x = Math.PI / 2;
    body.add(scarf);
    const tail = new THREE.Group();
    tail.position.set(0.18, 1.86, -0.28);
    if (p.hero) tail.add(at(mesh(new THREE.BoxGeometry(0.2, 0.08, 0.6), p.scarf), 0, 0, -0.3));
    body.add(tail);
    const head = new THREE.Group();
    head.position.y = 2.35;
    body.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.48, 14, 10), skin));
    const hair = mesh(new THREE.SphereGeometry(0.51, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), p.hair);
    hair.rotation.x = -0.3;
    hair.position.set(0, 0.05, -0.03);
    head.add(hair);
    if (p.long) {
      head.add(at(mesh(new THREE.BoxGeometry(0.86, 0.75, 0.26), p.hair), 0, -0.3, -0.33));
      head.add(at(mesh(new THREE.SphereGeometry(0.2, 8, 6), p.hair), 0, 0.15, -0.6));
      head.add(at(mesh(new THREE.SphereGeometry(0.1, 8, 6), '#E53935'), 0, 0.3, -0.52));
    }
    const eye = new THREE.SphereGeometry(0.075, 8, 6);
    head.add(at(mesh(eye, '#1D3F54'), -0.17, 0.04, 0.43), at(mesh(eye, '#1D3F54'), 0.17, 0.04, 0.43));
    const cheek = new THREE.SphereGeometry(0.07, 6, 4);
    head.add(at(mesh(cheek, '#F48FB1'), -0.29, -0.1, 0.36), at(mesh(cheek, '#F48FB1'), 0.29, -0.1, 0.36));
    const smile = at(mesh(new THREE.TorusGeometry(0.11, 0.025, 4, 10, Math.PI), '#1D3F54'), 0, -0.12, 0.45);
    smile.rotation.z = Math.PI;
    head.add(smile);
    if (p.hero) {
      for (const s of [-1, 1]) {
        const gg = at(mesh(new THREE.TorusGeometry(0.11, 0.04, 6, 12), '#57A6B5'), s * 0.15, 0.3, 0.42);
        gg.rotation.x = -0.3;
        head.add(gg);
      }
      head.add(at(mesh(new THREE.BoxGeometry(0.98, 0.06, 0.1), '#1D3F54'), 0, 0.3, 0.3));
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
    results: [[], [], [], []],
    stars: [0, 0, 0, 0],
    clues: [[], [], [], []],
    crystals: [0, 0, 0, 0],
    crystalsMax: [0, 0, 0, 0],
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
    const landmark = w.key === 'past' ? hourglass() : w.key === 'present' ? clockTower() : w.key === 'future' ? rocket() : bigTrophy();
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
    if (w.key === 'past') {
      const wm = windmill();
      wm.position.set(33, 0, 20);
      g.add(wm);
      B.colliders.push({ x: 33, z: 20, r: 2.2 });
      B.updaters.push((t) => (wm.userData.blades.rotation.z = t * 0.8));
    }
    if (w.key === 'present') {
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
    if (w.key === 'future') {
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
    if (w.key === 'arena') {
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
      const pad = at(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16), w.key === 'arena' ? '#E91E63' : w.color), 0, 0.3, 0);
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
    for (const q of w.quests) {
      if (q.type === 'collect') buildCollect(B, q);
      if (q.type === 'actions') buildActions(B);
      if (q.type === 'stones') buildPads(B, q);
      if (q.type === 'zones') B.zones = buildTwoAreas(B, ZONES, q.labels, q.subs);
      if (q.type === 'opinion') B.opin = buildTwoAreas(B, OPIN, ['', ''], ['', '']);
      if (q.type === 'ladder') buildLadder(B);
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
    const pcol = { past: '#E65100', present: '#FFFFFF', future: '#B2FF59', arena: '#FDD835' }[w.key];
    g.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ color: pcol, size: w.key === 'past' ? 0.35 : 0.22, transparent: true, opacity: 0.85, depthWrite: false })));
    B.updaters.push((t, dt) => {
      const a = pgeo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = a.getY(i);
        if (w.key === 'past') {
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

  const inkOf = (w) => (w.key === 'arena' ? '#145389' : w.color);

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

  function buildPads(B, q) {
    const w = B.def;
    PADS.xs.forEach((x, k) => {
      const pad = at(mesh(new THREE.BoxGeometry(PADS.half * 2, 0.3, PADS.half * 2), '#E3EAF0'), x, 0.15, PADS.z);
      B.group.add(pad);
      B.group.add(at(new THREE.Mesh(new THREE.BoxGeometry(PADS.half * 2 + 0.4, 0.12, PADS.half * 2 + 0.4), glow(w.light, 0.5)), x, 0.06, PADS.z));
      const word = textSprite('', { bg: '#1D3F54', font: 120, w: 1024, h: 220, scale: q.advice ? 0.68 : 0.8 });
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
    if (q.advice) {
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
    return { L, areas };
  }

  function buildLadder(B) {
    const w = B.def;
    const verbs = shuffle(LADDER_VERBS).slice(0, LADDER.xs.length);
    const x0 = LADDER.xs[0] - LADDER.half, x1 = LADDER.xs[LADDER.xs.length - 1] + LADDER.half;
    for (const dz of [-LADDER.half - 0.15, LADDER.half + 0.15]) B.group.add(at(mesh(new THREE.BoxGeometry(x1 - x0, 0.2, 0.25), '#FDD835'), (x0 + x1) / 2, 0.1, LADDER.z + dz));
    LADDER.xs.forEach((x, k) => {
      const tile = at(mesh(new THREE.BoxGeometry(LADDER.half * 2 - 0.3, 0.2, LADDER.half * 2), '#E3EAF0'), x, 0.1, LADDER.z);
      B.group.add(tile);
      const sp = textSprite(verbs[k], { bg: '#1D3F54', font: 120, w: 768, h: 220, scale: 0.55 });
      sp.position.set(x, 2.4, LADDER.z);
      B.group.add(sp);
      B.ladder.push({ x, verb: verbs[k], tile, sp, done: false });
      B.platforms.push({ rect: true, x, z: LADDER.z, hw: LADDER.half - 0.15, hd: LADDER.half, top: 0.2 });
    });
    const sign = textSprite('PREDICTION TRACK', { bg: inkOf(w), scale: 0.8 });
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
    if (w.key === 'future') {
      g.add(at(mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.4 * h, 6), '#455A64'), 0, 0.7 * h, 0));
      const cr = at(mesh(new THREE.OctahedronGeometry(1.1 * h, 0), n % 2 ? '#64FFDA' : '#B2FF59', { emissive: n % 2 ? '#00897B' : '#558B2F', emissiveIntensity: 0.7 }), 0, 2.4 * h, 0);
      cr.scale.y = 1.5;
      g.add(cr);
      return g;
    }
    if (w.key === 'arena') {
      g.add(rod(V(0, 0, 0), V(0, 5, 0), 0.1, '#1D3F54'));
      g.add(at(mesh(new THREE.BoxGeometry(1.6, 1, 0.06), ['#F57C00', '#57A6B5', '#7CB342', '#E91E63'][n % 4]), 0.8, 4.4, 0));
      return g;
    }
    const leaf = w.key === 'past' ? ['#E65100', '#F9A825', '#C62828'][n % 3] : ['#43A047', '#2E7D32', '#7CB342'][n % 3];
    g.add(at(mesh(new THREE.CylinderGeometry(0.22 * h, 0.32 * h, 1.3 * h, 6), '#7B4A26'), 0, 0.65 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.3 * h, 2 * h, 7), leaf), 0, 2.1 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(0.95 * h, 1.6 * h, 7), leaf), 0, 3.0 * h, 0));
    return g;
  }

  function building(w, n) {
    const g = new THREE.Group();
    if (w.key === 'future') {
      const h = 7 + (n % 3) * 3;
      g.add(at(mesh(new THREE.BoxGeometry(3.4, h, 3.4), '#CFD8DC'), 0, h / 2, 0));
      for (let y = 1.2; y < h - 0.5; y += 1.3) g.add(at(mesh(new THREE.BoxGeometry(3.5, 0.35, 3.5), '#4DD0E1', { emissive: '#00ACC1', emissiveIntensity: 0.9 }), 0, y, 0));
      g.add(at(mesh(new THREE.ConeGeometry(0.4, 2, 6), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.5 }), 0, h + 1, 0));
      return g;
    }
    if (w.key === 'arena') {
      g.add(at(mesh(new THREE.CylinderGeometry(0.9, 1.1, 6, 10), '#FFF8E1'), 0, 3, 0));
      g.add(at(mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.5, 10), '#145389'), 0, 6.2, 0));
      g.add(at(mesh(new THREE.ConeGeometry(0.6, 1.2, 8), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.7 }), 0, 7.0, 0));
      return g;
    }
    const wall = w.key === 'past' ? ['#F3E0C0', '#E7CBA0'][n % 2] : ['#FFFFFF', '#FFE082', '#B3E5FC'][n % 3];
    const roof = w.key === 'past' ? '#8D4E2A' : ['#E53935', '#145389', '#F57C00'][n % 3];
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

  function setAvatar(p) {
    while (avatarHolder.children.length) avatarHolder.remove(avatarHolder.children[0]);
    AV.model = makeAvatar({ ...PLAYERS[p], hero: true });
    avatarHolder.add(AV.model.root, AV.model.blob);
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
    finale.visible = false;
    loadWorld(1);
    avatarHolder.visible = false;
    arrow.visible = false;
    W.beacon.visible = false;
    showLayer('title');
    stopMusic();
  }
  for (const b of document.querySelectorAll('.player')) b.addEventListener('click', () => choosePlayer(+b.dataset.p));
  function choosePlayer(p) {
    S.player = p;
    sfx.click();
    S.mode = 'brief';
    $('b-hi').textContent = `Hi, ${PLAYERS[p].name}!`;
    showLayer('brief');
  }
  function startTrip() {
    S.results = [[], [], [], []];
    S.stars = [0, 0, 0, 0];
    S.clues = [[], [], [], []];
    S.crystals = [0, 0, 0, 0];
    S.crystalsMax = [0, 0, 0, 0];
    setAvatar(S.player);
    enterWorld(0);
  }

  function enterWorld(wi) {
    S.wi = wi;
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
    startQuest(0, 2600);
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
    }
    task(null);
    const next = S.q + 1;
    if (next < WORLDS[S.wi].quests.length) startQuest(next, 700);
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

    // ---- Stones: Word / Can / Advice / Ultimate ----
    stones: {
      start(Q) {
        Q.list = shuffle(Q.def.bank).slice(0, Q.def.count).map((x) => ({ ...x, opts: shuffle(x.a) }));
        Q.max = Q.list.length;
        this.load(Q);
      },
      load(Q) {
        const it = Q.list[Q.idx];
        W.pads.forEach((p, k) => {
          p.answer = it.opts[k];
          p.word.userData.draw(p.answer, '#1D3F54');
          p.mesh.material = mat(WORLDS[S.wi].light);
        });
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
          }, 2000);
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
        Q.list = shuffle([...a.slice(0, half), ...b.slice(0, Q.def.count - half)]);
        Q.max = Q.list.length;
        this.load(Q);
      },
      load(Q) {
        const it = Q.list[Q.idx];
        task(`${Q.def.name} ${Q.idx + 1} / ${Q.max} · Run to the right zone!`, `"${esc(it.s)}"`, optsHTML(Q.def.labels).replace(/<b>[AB]<\/b>/g, ''));
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
        Q.ready = false;
        Q.attempts++;
        if (k === it.z) {
          if (Q.attempts === 1) Q.score++;
          sfx.good();
          ar.flash = 1.2;
          burst(ar.c.clone().add(V(0, 1.5, 0)), ['#FDD835', '#FFFFFF', ar.col], 30, { speed: 7, up: 9, geo: starGeo, size: 0.3 });
          feedback(`Yes! ${Q.def.labels[k]}!`, true);
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
        task(`Prediction Track ${Q.idx + 1} / ${Q.max} · Say it, then step on the yellow box!`, `I am going to <u>${esc(t.verb)}</u>!`);
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
          feedback(`I am going to ${t.verb}!`, true);
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
        Q.list = shuffle(OPINIONS).slice(0, Q.def.count);
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
        task(`Opinion Corner ${Q.idx + 1} / ${Q.max} · There is no wrong answer!`, `${esc(it.a)} or ${esc(it.b)}? Stand on your favorite!`);
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
            task(`Opinion Corner · Say it out loud! <span class="say" id="h-say">${SAY_SECONDS}</span>`, `I think <u>${esc(choice.toLowerCase())}</u> are better because ...`);
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
    S.mode = 'play';
    showLayer('play');
    arrow.visible = true;
    burst(V(STAGE.x, 3, STAGE.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 40, { speed: 8, up: 10, geo: starGeo, size: 0.3 });
    feedback('Well done!', true);
    startMusic(WORLDS[S.wi].music);
    completeQuest();
  }
  function giveStars(n) {
    if (S.mode !== 'talk') return;
    S.stars[S.wi] = n;
    renderStars(true);
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
    $('w-to').textContent = to ? to.name : 'THE TIME MASTER STAGE';
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
    S.stars[w] = S.stars[w] === n ? n - 1 : n;
    box.querySelectorAll('.fs').forEach((el) => el.classList.toggle('on', +el.dataset.n <= S.stars[w]));
    if (talkRows[w]) talkRows[w].score = S.stars[w];
    $('f-stars').textContent = S.stars.reduce((a, b) => a + b, 0);
    sfx.stars(Math.max(1, S.stars[w]));
  });
  const pad2 = (n) => String(n).padStart(2, '0');
  const stamp = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  function toFinale() {
    S.mode = 'finale';
    if (W) W.group.visible = false;
    applyAtmosphere({ key: 'finale', skyTop: '#0E2233', skyBottom: '#2C5F7C', fog: '#1D3F54', hemi: ['#E1F5FE', '#1D3F54', 1.9], sun: ['#FFFFFF', 2.2] });
    while (finale.children.length) finale.remove(finale.children[0]);
    finale.visible = true;
    finale.add(at(mesh(new THREE.CylinderGeometry(3, 3.4, 1.2, 16), '#FDD835', { metalness: 0.3, roughness: 0.5 }), 0, -0.6, 0));
    finale.add(at(mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.6, 16), '#145389'), 0, -1.5, 0));
    WORLDS.slice(0, 3).forEach((w, i) => {
      const mini = new THREE.Group();
      mini.add(mesh(new THREE.CylinderGeometry(3, 2.8, 0.8, 12), w.color));
      const c = at(mesh(new THREE.ConeGeometry(2.8, 4, 12), w.rock), 0, -2.4, 0);
      c.rotation.x = Math.PI;
      mini.add(c);
      mini.position.set(-14 + i * 14, 6 + (i % 2) * 2, -22);
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
    $('f-title').textContent = `You are a Time Master, ${name}!`;
    $('f-stars').textContent = S.stars.reduce((a, b) => a + b, 0);
    $('f-pts').textContent = `${pts}/${ptsMax}`;
    $('f-crys').textContent = `${crys}/${crysMax}`;
    $('f-saved').textContent = '';
    $('f-rows').innerHTML = WORLDS.map((w, i) => {
      const hasTalk = w.quests.some((q) => q.type === 'talk');
      const stars = hasTalk ? `<span class="st edit" data-w="${i}">${[1, 2, 3].map((n) => `<span class="fs${n <= S.stars[i] ? ' on' : ''}" data-n="${n}">★</span>`).join('')}</span>` : '<span class="st"></span>';
      const chips = S.results[i].map((r) => `<span class="rc">${esc(r.short)} <b>${r.score}/${r.max}</b></span>`).join('');
      return `<div class="wrow"><span class="nm" style="background:${w.color};${w.key === 'arena' ? 'color:#145389' : ''}">${w.short}</span>${stars}<span class="chips">${chips}</span></div>`;
    }).join('');
    const when = stamp(new Date());
    WORLDS.forEach((w, i) => {
      for (const r of S.results[i]) S.rows.push({ player: name, world: w.short, challenge: r.name, score: r.score, max: r.max, details: r.details, date: when });
      if (w.quests.some((q) => q.type === 'talk')) {
        const row = { player: name, world: w.short, challenge: 'Talk stars', score: S.stars[i], max: 3, details: S.clues[i].map((c) => c.label).join('; '), date: when };
        S.rows.push(row);
        talkRows[i] = row;
      }
      S.rows.push({ player: name, world: w.short, challenge: 'Time crystals (bonus)', score: S.crystals[i], max: S.crystalsMax[i], details: '', date: when });
    });
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
    const head = ['player', 'world', 'challenge', 'score', 'max', 'details', 'date'];
    const lines = [head.join(',')];
    for (const r of S.rows) lines.push(head.map((h) => csvCell(r[h])).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `S24_TimeTravel_results_${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    $('f-saved').textContent = 'Saved! Check your Downloads folder.';
    sfx.click();
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
    if ((k === 'p' || k === 'P') && (S.mode === 'play' || S.mode === 'talk')) {
      S.paused = !S.paused;
      $('O-pause').classList.toggle('on', S.paused);
      keys.clear();
      return;
    }
    if (S.paused) return;
    switch (S.mode) {
      case 'title':
        if (k === '1') choosePlayer(0);
        else if (k === '2') choosePlayer(1);
        break;
      case 'brief':
        if ((k === 'Enter' || k === ' ') && !e.repeat) startTrip();
        else if (k === 'Escape' || k === 'Backspace') toTitle();
        break;
      case 'play':
        if (MOVE[e.code]) keys.add(MOVE[e.code]);
        if (k === ' ') AV.jumpBuf = 0.15;
        if ((k === 'k' || k === 'K') && !e.repeat) skip();
        if (k === 'Enter' && !e.repeat && S.Q && S.Q.def.type === 'opinion') HANDLERS.opinion.next(S.Q);
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
    if (S.mode === 'play') {
      ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      iz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
      const gp = gamepadInput();
      ix += gp.x;
      iz += gp.z;
    }
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
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
  function updateCamera(dt, t) {
    let wantP, wantT, k = 1 - Math.exp(-dt * 3.5);
    const wide = Math.max(1, 16 / 9 / camera.aspect);
    if (S.mode === 'title' || S.mode === 'brief') {
      const a = t * 0.06;
      wantP = V(Math.sin(a) * 64 * wide, 34, Math.cos(a) * 64 * wide);
      wantT = V(0, 0, 0);
      k = 1;
    } else if (S.mode === 'play') {
      wantP = AV.pos.clone().add(V(0, 8.5, 13.5 * wide));
      wantT = AV.pos.clone().add(V(0, 1.5, -2.5));
      wantP.y = Math.max(wantP.y, 8.5);
    } else if (S.mode === 'talk') {
      wantP = V(STAGE.x + Math.sin(t * 0.15) * 1.5, STAGE.top + 3.0, STAGE.z + 10.5 * wide);
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
    if (S.mode === 'play' || S.mode === 'talk' || S.mode === 'finale') updateAvatar(dt);
    if (S.mode !== 'title' && S.mode !== 'brief') animateAvatar(dt, t);

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
      for (const two of [W.zones, W.opin]) {
        if (!two) continue;
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
    S, AV, TALK_SECONDS,
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
      if (T === 'ladder') return { x: W.ladder[Q.idx].x, z: LADDER.z, y: 0.2 };
      if (T === 'actions') {
        const t = Q.targets[Q.idx];
        const p = t.M.root.getWorldPosition(new THREE.Vector3());
        return { x: p.x, z: p.z + (t.action === 'swimming' ? 3.8 : 1.6), y: 0, action: t.action };
      }
      if (T === 'collect') {
        const pk = W.pickups.find((p) => !p.taken);
        return { x: pk.x, z: pk.z, y: pk.top };
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
  requestAnimationFrame(loop);
}
