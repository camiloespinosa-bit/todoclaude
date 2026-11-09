// The Time Travel Stage · GAME edition (CCA S24 "Show Bloque 4")
// The child walks a Time Traveler through 3 worlds (Past, Present, Future).
// In each world: find 3 things -> Word Stones (grammar) -> talk on the stage (1 min) -> time portal.
import * as THREE from 'three';
import { OBJECTS, makeObject, mat, mesh, at, rod } from './objects.js';

const $ = (id) => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Config ----------
const params = new URLSearchParams(location.search);
const TALK_SECONDS = clamp(parseInt(params.get('t'), 10) || 60, 3, 600);
const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>';

const PLAYERS = [
  { name: 'Jerónimo', suit: '#145389', scarf: '#FDD835', hair: '#3B2A20', long: false },
  { name: 'Luciana', suit: '#F57C00', scarf: '#57A6B5', hair: '#5A3A22', long: true },
];

const WORLDS = [
  {
    key: 'past', short: 'Past', name: 'YESTERDAY LAND', tense: 'This is the PAST.',
    color: '#F57C00', light: '#FFCC80', ground: '#E8A15A', ground2: '#D98A3E', path: '#F6D2A2', rock: '#7A4A2A', rock2: '#5B3820',
    skyTop: '#F4A259', skyBottom: '#FDEBD3', fog: '#F9DDBF', hemi: ['#FFF3E0', '#B07A4E', 1.9], sun: ['#FFE0B2', 2.4],
    objects: ['bike', 'ball', 'dog', 'plane', 'rain', 'book'],
    frames: ['<b>Yesterday</b>, I ...', '<b>Last year</b>, I <b>went</b> to ...'],
    questions: [
      { s: 'Yesterday, I ___ soccer.', a: ['played', 'play', 'playing'] },
      { s: 'Last year, I ___ to the beach.', a: ['went', 'go', 'going'] },
      { s: 'Yesterday, I ___ my bike.', a: ['rode', 'ride', 'riding'] },
      { s: 'Last week, I ___ a big pizza.', a: ['ate', 'eat', 'eating'] },
      { s: 'Last year, I ___ a dog.', a: ['had', 'have', 'having'] },
      { s: 'Yesterday, I ___ very happy.', a: ['was', 'am', 'be'] },
    ],
    music: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
  },
  {
    key: 'present', short: 'Present', name: 'TODAY TOWN', tense: 'This is the PRESENT.',
    color: '#57A6B5', light: '#B2E0E8', ground: '#7CC08A', ground2: '#5FA56E', path: '#E6EEF2', rock: '#2C5F7C', rock2: '#1D3F54',
    skyTop: '#62B6CB', skyBottom: '#EAF6F8', fog: '#DDEFF3', hemi: ['#FFFFFF', '#6E9A7A', 2.0], sun: ['#FFFFFF', 2.3],
    objects: ['guitar', 'skates', 'robot', 'book', 'ball', 'house'],
    frames: ['<b>Now</b>, I <b>am</b> ...', 'I <b>can</b> ...'],
    questions: [
      { s: 'Now, I ___ happy.', a: ['am', 'was', 'be'] },
      { s: 'I ___ swim.', a: ['can', 'am', 'went'] },
      { s: 'I ___ play the guitar.', a: ['can', 'did', 'am'] },
      { s: 'Now, I ___ in my English class.', a: ['am', 'was', 'can'] },
      { s: 'My dog ___ run fast.', a: ['can', 'is', 'was'] },
      { s: 'Now, I ___ learning English.', a: ['am', 'was', 'can'] },
    ],
    music: [392.0, 440.0, 493.9, 587.3, 659.3, 784.0],
  },
  {
    key: 'future', short: 'Future', name: 'TOMORROW CITY', tense: 'This is the FUTURE.',
    color: '#7CB342', light: '#C5E1A5', ground: '#3E6B7E', ground2: '#2F5566', path: '#7FD3C4', rock: '#1D3F54', rock2: '#122A38',
    skyTop: '#10273A', skyBottom: '#2E6F78', fog: '#24525E', hemi: ['#B3E5FC', '#1D3F54', 1.5], sun: ['#C8F7FF', 1.6],
    objects: ['doctor', 'plane', 'trophy', 'house', 'robot', 'guitar'],
    frames: ["<b>Someday</b>, I'm <b>going to</b> ...", "<b>I'd like to</b> ... <b>because</b> ..."],
    questions: [
      { s: "Someday, I'm going ___ be a doctor.", a: ['to', 'at', 'on'] },
      { s: "Someday, I'm ___ to travel to Japan.", a: ['going', 'go', 'went'] },
      { s: "I'd like ___ fly a plane.", a: ['to', 'at', 'on'] },
      { s: "I'd like to be a vet ___ I love dogs.", a: ['because', 'or', 'the'] },
      { s: "Next year, I'm going to ___ a new sport.", a: ['learn', 'learned', 'learning'] },
      { s: "Someday, I'm going to ___ a big house.", a: ['have', 'had', 'having'] },
    ],
    music: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0],
  },
];

const QUESTS = ['Find 3 things', 'Word Stones', 'Talk on the stage', 'Go into the portal'];
const HINTS = ['Walk to the shining things!', 'Go to the Word Stones!', 'Go to the stage and talk!', 'The portal is open! Go in!'];

// ---------- Layout (same map in every world) ----------
const SPAWN = V(0, 0, 24);
const PICK_SPOTS = [
  { x: -12, z: 16, top: 0 },
  { x: 12, z: 16, top: 1.2, r: 2.4 },
  { x: -21, z: 5, top: 1.2, r: 2.4 },
  { x: 21, z: 5, top: 0 },
  { x: -7, z: 3, top: 2.4, r: 2.2, step: { x: -7, z: 6.6, top: 1.2, r: 1.8 } },
  { x: 8, z: 4, top: 0 },
];
const WORD_START = V(-16, 0, -5);
const PAD_Z = -14.5;
const PAD_X = [-23, -16, -9];
const PAD_HALF = 2.3;
const STAGE = { x: 16, z: -10, r: 3.6, top: 0.5 };
const PORTAL = { x: 0, z: -27 };
const ISLAND_R = 32.5;

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
  scene.fog = new THREE.Fog('#FFFFFF', 55, 150);

  // night stars (future world + warp + finale)
  const nightStars = (() => {
    const n = 900, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 500;
      const s = Math.sqrt(1 - u * u);
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
    nightStars.visible = w.key === 'future';
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
      if (!t) {
        tex.needsUpdate = true;
        return;
      }
      ctx.font = `800 ${font}px Poppins, "Segoe UI", Arial, sans-serif`;
      let fs = font;
      while (ctx.measureText(t).width > w - 110 && fs > 30) {
        fs -= 6;
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
    pick: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.14)),
    good: () => { tone(659, 0, 0.15, 'triangle', 0.18); tone(988, 0.13, 0.3, 'triangle', 0.18); },
    bad: () => tone(220, 0, 0.3, 'sawtooth', 0.06, 150),
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
        const f = music.scale[PATTERN[music.step % 16]];
        tone(f, music.next - now, 0.45, 'triangle', 0.035);
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

  // ---------- Avatar ----------
  function makeAvatar(p) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const skin = '#E9B48A';
    const leg = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.95, 0);
      g.add(at(mesh(new THREE.BoxGeometry(0.28, 0.9, 0.3), '#1D3F54'), 0, -0.45, 0));
      g.add(at(mesh(new THREE.BoxGeometry(0.32, 0.18, 0.46), '#F7FAFC'), 0, -0.86, 0.06));
      body.add(g);
      return g;
    };
    const legL = leg(-0.2), legR = leg(0.2);
    body.add(at(mesh(new THREE.BoxGeometry(0.82, 0.88, 0.52), p.suit), 0, 1.4, 0));
    body.add(at(mesh(new THREE.BoxGeometry(0.86, 0.14, 0.56), '#1D3F54'), 0, 1.02, 0));
    const buckle = at(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), '#FDD835'), 0, 1.02, 0.29);
    buckle.rotation.x = Math.PI / 2;
    body.add(buckle);
    // time backpack
    body.add(at(mesh(new THREE.BoxGeometry(0.62, 0.66, 0.3), '#2C5F7C'), 0, 1.45, -0.4));
    const clockFace = at(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), '#FDD835', { emissive: '#B08800', emissiveIntensity: 0.6 }), 0, 1.5, -0.57);
    clockFace.rotation.x = Math.PI / 2;
    body.add(clockFace);
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
    tail.add(at(mesh(new THREE.BoxGeometry(0.2, 0.08, 0.6), p.scarf), 0, 0, -0.3));
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
    // goggles on forehead
    for (const s of [-1, 1]) {
      const gg = at(mesh(new THREE.TorusGeometry(0.11, 0.04, 6, 12), '#57A6B5'), s * 0.15, 0.3, 0.42);
      gg.rotation.x = -0.3;
      head.add(gg);
    }
    head.add(at(mesh(new THREE.BoxGeometry(0.98, 0.06, 0.1), '#1D3F54'), 0, 0.3, 0.3));
    // ground shadow blob
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2;
    root.userData.blob = blob;
    return { root, body, legL, legR, armL, armR, tail, head, blob };
  }

  // ---------- State ----------
  const S = {
    mode: 'title', // title | brief | play | talk | warp | finale
    player: 0,
    wi: 0,
    quest: 0,
    collected: [[], [], []],
    words: [0, 0, 0], // first-try correct
    wordIdx: 0,
    wordAttempts: 0,
    wordReady: false,
    wordSkipped: [false, false, false],
    stars: [0, 0, 0],
    talkLeft: TALK_SECONDS,
    talkRunning: false,
    paused: false,
    rows: [],
    questions: [],
  };
  const AV = { pos: V(), vel: V(), onGround: true, coyote: 0, jumpBuf: 0, yaw: Math.PI, phase: 0, land: 0, model: null, locked: false };
  const keys = new Set();
  let W = null; // current world build
  let worldIndexBuilt = -1;

  // ---------- World builder ----------
  function buildWorld(wi) {
    const w = WORLDS[wi];
    const g = new THREE.Group();
    const B = { def: w, group: g, colliders: [], platforms: [], pickups: [], pads: [], updaters: [], beaconTarget: V() };

    // island body
    const top = at(mesh(new THREE.CylinderGeometry(34, 33, 2, 28), w.ground), 0, -1, 0);
    g.add(top);
    const under = at(mesh(new THREE.ConeGeometry(33, 22, 28), w.rock), 0, -13, 0);
    under.rotation.x = Math.PI;
    g.add(under);
    const under2 = at(mesh(new THREE.ConeGeometry(18, 16, 12), w.rock2), 3, -24, 2);
    under2.rotation.x = Math.PI;
    g.add(under2);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const r = at(mesh(new THREE.DodecahedronGeometry(1 + (k % 3) * 0.6, 0), w.rock), Math.cos(a) * (36 + (k % 4) * 3), -6 - (k % 5) * 2.5, Math.sin(a) * (36 + (k % 4) * 3));
      r.userData.spin = 0.2 + (k % 3) * 0.15;
      g.add(r);
    }
    // grass patches & paths
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4, rr = 8 + (k * 5.3) % 20;
      const patch = at(mesh(new THREE.CylinderGeometry(2.5 + (k % 3), 2.5 + (k % 3), 0.06, 8), w.ground2), Math.cos(a) * rr, 0.02, Math.sin(a) * rr);
      g.add(patch);
    }
    const pathTo = (a, b, wd = 3) => {
      const d = new THREE.Vector3().subVectors(b, a);
      const p = at(mesh(new THREE.BoxGeometry(wd, 0.06, d.length()), w.path), (a.x + b.x) / 2, 0.04, (a.z + b.z) / 2);
      p.rotation.y = Math.atan2(d.x, d.z);
      g.add(p);
    };
    pathTo(SPAWN, V(0, 0, 0));
    pathTo(V(0, 0, 0), V(PORTAL.x, 0, PORTAL.z + 3));
    pathTo(V(0, 0, 0), WORD_START);
    pathTo(V(0, 0, 0), V(STAGE.x, 0, STAGE.z));
    // edge stones
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      const st = at(mesh(new THREE.DodecahedronGeometry(0.7 + (k % 3) * 0.25, 0), w.rock), Math.cos(a) * 33.3, 0.3, Math.sin(a) * 33.3);
      g.add(st);
    }

    // landmark in the middle
    const center = V(0, 0, -3);
    const landmark = w.key === 'past' ? hourglass() : w.key === 'present' ? clockTower() : rocket();
    landmark.position.copy(center);
    g.add(landmark);
    B.colliders.push({ x: center.x, z: center.z, r: 2.6 });

    // themed decor ring
    const keyPts = [SPAWN, WORD_START, V(STAGE.x, 0, STAGE.z), V(STAGE.x, 0, STAGE.z - 7), V(STAGE.x - 6, 0, STAGE.z - 8), V(STAGE.x + 6, 0, STAGE.z - 8), V(STAGE.x + 9, 0, STAGE.z - 2), V(PORTAL.x, 0, PORTAL.z), center, ...PICK_SPOTS.map((p) => V(p.x, 0, p.z)), ...PAD_X.map((x) => V(x, 0, PAD_Z))];
    const free = (x, z, d) => keyPts.every((p) => Math.hypot(p.x - x, p.z - z) > d);
    let n = 0;
    for (let ring = 0; ring < 2; ring++) {
      const R = ring === 0 ? 28 : 19;
      const count = ring === 0 ? 22 : 12;
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + ring * 0.3;
        const x = Math.cos(a) * R, z = Math.sin(a) * R;
        if (!free(x, z, ring === 0 ? 6.5 : 6)) continue;
        if (Math.abs(x) < 5 && z > 8) continue; // keep the spawn path open
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
      wm.position.set(26, 0, 14);
      g.add(wm);
      B.colliders.push({ x: 26, z: 14, r: 2.2 });
      B.updaters.push((t) => (wm.userData.blades.rotation.z = t * 0.8));
    }
    if (w.key === 'present') {
      const f = fountain();
      f.position.set(-24, 0, 16);
      g.add(f);
      B.colliders.push({ x: -24, z: 16, r: 2.6 });
    }
    if (w.key === 'future') {
      for (let k = 0; k < 3; k++) {
        const car = hoverCar(['#FDD835', '#F57C00', '#57A6B5'][k]);
        g.add(car);
        const R = 40 + k * 6, sp = 0.25 + k * 0.08, h = 10 + k * 4;
        B.updaters.push((t) => {
          const a = t * sp + k * 2;
          car.position.set(Math.cos(a) * R, h, Math.sin(a) * R);
          car.rotation.y = -a;
        });
      }
    }
    if (landmark.userData.update) B.updaters.push(landmark.userData.update);

    // pickups
    const ids = shuffle(w.objects);
    PICK_SPOTS.forEach((sp, k) => {
      if (sp.top > 0) {
        addPlatform(B, sp.x, sp.z, sp.r, sp.top, w);
        if (sp.step) addPlatform(B, sp.step.x, sp.step.z, sp.step.r, sp.step.top, w);
      }
      const pk = new THREE.Group();
      pk.position.set(sp.x, sp.top, sp.z);
      const obj = makeObject(ids[k], 1.7);
      obj.position.y = 1.7;
      pk.add(obj);
      const bubble = at(new THREE.Mesh(new THREE.SphereGeometry(1.35, 16, 12), glow(w.light, 0.18)), 0, 1.7, 0);
      pk.add(bubble);
      const beam = at(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 16, 10, 1, true), glow('#FFF59D', 0.16)), 0, 8, 0);
      pk.add(beam);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 6, 24), glow('#FDD835', 0.8));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      pk.add(ring);
      const label = textSprite(objName(ids[k]), { bg: w.color, font: 120, scale: 0.55 });
      label.position.y = 3.5;
      pk.add(label);
      g.add(pk);
      B.pickups.push({ id: ids[k], group: pk, obj, ring, x: sp.x, z: sp.z, top: sp.top, taken: false, phase: k });
    });

    // word stones
    PAD_X.forEach((x, k) => {
      const pad = at(mesh(new THREE.BoxGeometry(PAD_HALF * 2, 0.3, PAD_HALF * 2), '#E3EAF0'), x, 0.15, PAD_Z);
      g.add(pad);
      const rim = at(new THREE.Mesh(new THREE.BoxGeometry(PAD_HALF * 2 + 0.4, 0.12, PAD_HALF * 2 + 0.4), glow(w.light, 0.5)), x, 0.06, PAD_Z);
      g.add(rim);
      const word = textSprite('', { bg: '#1D3F54', font: 130, w: 768, h: 240, scale: 0.9 });
      word.position.set(x, 3.4, PAD_Z);
      g.add(word);
      const letter = textSprite(['A', 'B', 'C'][k], { bg: w.color, font: 120, w: 256, h: 220, scale: 0.45 });
      letter.position.set(x, 1.4, PAD_Z + PAD_HALF);
      g.add(letter);
      B.pads.push({ x, z: PAD_Z, mesh: pad, word, letter, flash: 0, flashColor: null, shake: 0, answer: '' });
      B.platforms.push({ rect: true, x, z: PAD_Z, hw: PAD_HALF, hd: PAD_HALF, top: 0.3 });
    });
    const startRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 6, 28), glow('#FFFFFF', 0.9));
    startRing.rotation.x = Math.PI / 2;
    startRing.position.set(WORD_START.x, 0.1, WORD_START.z);
    g.add(startRing);
    const wsSign = textSprite('WORD STONES', { bg: w.color, scale: 0.8 });
    wsSign.position.set(-16, 7.4, PAD_Z - 2);
    g.add(wsSign);

    // stage
    const stage = at(mesh(new THREE.CylinderGeometry(STAGE.r, STAGE.r + 0.3, STAGE.top, 20), '#1D3F54'), STAGE.x, STAGE.top / 2, STAGE.z);
    g.add(stage);
    const stageRing = new THREE.Mesh(new THREE.TorusGeometry(STAGE.r - 0.3, 0.12, 6, 32), glow(w.color, 0.9));
    stageRing.rotation.x = Math.PI / 2;
    stageRing.position.set(STAGE.x, STAGE.top + 0.05, STAGE.z);
    g.add(stageRing);
    B.platforms.push({ x: STAGE.x, z: STAGE.z, r: STAGE.r, top: STAGE.top });
    const micG = new THREE.Group();
    micG.position.set(STAGE.x, STAGE.top, STAGE.z - 2.4);
    micG.add(rod(V(0, 0, 0), V(0, 1.7, 0), 0.05, '#2C5F7C'), at(mesh(new THREE.SphereGeometry(0.2, 10, 8), '#B0BEC5'), 0, 1.85, 0), at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 10), '#2C5F7C'), 0, 0.03, 0));
    g.add(micG);
    for (const s of [-1, 1]) {
      const pole = rod(V(STAGE.x + s * 4.4, 0, STAGE.z - 1.5), V(STAGE.x + s * 4.4, 6, STAGE.z - 1.5), 0.12, '#1D3F54');
      g.add(pole);
      B.colliders.push({ x: STAGE.x + s * 4.4, z: STAGE.z - 1.5, r: 0.4 });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6, 16, 1, true), glow('#FFF59D', 0.12));
      cone.position.set(STAGE.x + s * 2.2, 3, STAGE.z - 0.8);
      cone.rotation.z = -s * 0.35;
      g.add(cone);
    }
    const stageSign = textSprite('STAGE', { bg: w.color, scale: 0.8 });
    stageSign.position.set(STAGE.x, 7.4, STAGE.z - 1.5);
    g.add(stageSign);
    B.stageRing = stageRing;

    // portal
    const pg = new THREE.Group();
    pg.position.set(PORTAL.x, 0, PORTAL.z);
    pg.add(at(mesh(new THREE.CylinderGeometry(4.6, 5, 0.4, 20), '#1D3F54'), 0, 0.2, 0));
    const ringMat = new THREE.MeshStandardMaterial({ color: '#90A4AE', flatShading: true, emissive: '#000000' });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.5, 10, 36), ringMat);
    ring.position.y = 4.2;
    pg.add(ring);
    const swirlU = { t: { value: 0 }, c1: { value: new THREE.Color(w.color) }, c2: { value: new THREE.Color('#FFFFFF') }, on: { value: 0 } };
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
    const pSign = textSprite('TIME PORTAL', { bg: '#1D3F54', scale: 0.8 });
    pSign.position.y = 9.4;
    pg.add(pSign);
    g.add(pg);
    B.platforms.push({ x: PORTAL.x, z: PORTAL.z, r: 4.6, top: 0.4 });
    B.portal = { group: pg, ring, ringMat, swirl, swirlU, active: false };

    // beacon + guide arrow
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 40, 12, 1, true), glow('#FDD835', 0.14));
    beacon.position.y = 20;
    g.add(beacon);
    B.beacon = beacon;

    // ambient particles
    const N = 260, pp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) pp.set([Math.random() * 70 - 35, Math.random() * 18, Math.random() * 70 - 35], i * 3);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pcol = w.key === 'past' ? '#E65100' : w.key === 'present' ? '#FFFFFF' : '#B2FF59';
    const amb = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: pcol, size: w.key === 'past' ? 0.35 : 0.22, transparent: true, opacity: 0.85, depthWrite: false }));
    g.add(amb);
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

    return B;
  }

  function addPlatform(B, x, z, r, top, w) {
    const p = at(mesh(new THREE.CylinderGeometry(r, r * 1.08, top, 10), w.ground2), x, top / 2, z);
    B.group.add(p);
    const edge = at(mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.12, 10), w.light), x, top + 0.02, z);
    B.group.add(edge);
    B.platforms.push({ x, z, r, top });
  }

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
      for (let y = 1.2; y < h - 0.5; y += 1.3) {
        g.add(at(mesh(new THREE.BoxGeometry(3.5, 0.35, 3.5), '#4DD0E1', { emissive: '#00ACC1', emissiveIntensity: 0.9 }), 0, y, 0));
      }
      g.add(at(mesh(new THREE.ConeGeometry(0.4, 2, 6), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.5 }), 0, h + 1, 0));
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
    const s = 1.8, wood = '#7B4A26';
    g.add(at(mesh(new THREE.CylinderGeometry(1.8, 2, 0.5, 10), wood), 0, 0.25, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 10), wood), 0, 5.8, 0));
    const glass = { transparent: true, opacity: 0.45, roughness: 0.1 };
    const lower = at(mesh(new THREE.ConeGeometry(1.5, 2.6, 10), '#E1F5FE', glass), 0, 1.8, 0);
    lower.rotation.x = Math.PI;
    g.add(lower, at(mesh(new THREE.ConeGeometry(1.5, 2.6, 10), '#E1F5FE', glass), 0, 4.3, 0));
    const sand = at(mesh(new THREE.ConeGeometry(1.1, 1.1, 10), '#FDD835'), 0, 1.0, 0);
    g.add(sand);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(rod(V(Math.cos(a) * 1.55, 0.5, Math.sin(a) * 1.55), V(Math.cos(a) * 1.55, 5.6, Math.sin(a) * 1.55), 0.12, wood));
    }
    const stream = at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), '#FDD835'), 0, 2.4, 0);
    g.add(stream);
    g.userData.update = (t) => (g.rotation.y = Math.sin(t * 0.3) * 0.3);
    g.scale.setScalar(s / 1.8);
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
      const f = new THREE.Group();
      f.rotation.y = (side * Math.PI) / 2;
      const face = at(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 20), '#FDD835'), 0, 5.4, 1.52);
      face.rotation.x = Math.PI / 2;
      f.add(face);
      const h1 = new THREE.Group();
      h1.position.set(0, 5.4, 1.62);
      h1.add(at(mesh(new THREE.BoxGeometry(0.12, 0.9, 0.06), '#1D3F54'), 0, 0.4, 0));
      const h2 = new THREE.Group();
      h2.position.set(0, 5.4, 1.64);
      h2.add(at(mesh(new THREE.BoxGeometry(0.14, 0.6, 0.06), '#1D3F54'), 0, 0.27, 0));
      f.add(h1, h2);
      hands.push([h1, h2]);
      g.add(f);
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

  function windmill() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(1.2, 1.8, 6, 8), '#F3E0C0'), 0, 3, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.6, 1.8, 8), '#8D4E2A'), 0, 6.9, 0));
    const blades = new THREE.Group();
    blades.position.set(0, 5.6, 1.5);
    for (let k = 0; k < 4; k++) {
      const b = at(mesh(new THREE.BoxGeometry(0.5, 3.4, 0.08), '#FFF3E0'), 0, 1.8, 0);
      const holder = new THREE.Group();
      holder.rotation.z = (k * Math.PI) / 2;
      holder.add(b);
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
    g.add(at(mesh(new THREE.BoxGeometry(2.4, 0.6, 1.2), color), 0, 0, 0));
    g.add(at(mesh(new THREE.SphereGeometry(0.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#4DD0E1', { transparent: true, opacity: 0.8 }), 0, 0.3, 0));
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.2, 0.3, 10), glow('#64FFDA', 0.5)), 0, -0.45, 0));
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
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.8), m);
    arrow.add(head, shaft);
  }
  scene.add(arrow);

  function loadWorld(wi) {
    if (W) {
      scene.remove(W.group);
      W.group.traverse((o) => o.geometry && o.geometry !== starGeo && o.geometry !== partGeo && o.geometry.dispose());
    }
    W = buildWorld(wi);
    worldIndexBuilt = wi;
    scene.add(W.group);
    applyAtmosphere(WORLDS[wi]);
    document.documentElement.style.setProperty('--world', WORLDS[wi].color);
  }

  function setAvatar(p) {
    while (avatarHolder.children.length) avatarHolder.remove(avatarHolder.children[0]);
    AV.model = makeAvatar(PLAYERS[p]);
    avatarHolder.add(AV.model.root, AV.model.blob);
  }

  function placeAvatar(pos, yaw = Math.PI) {
    AV.pos.copy(pos);
    AV.vel.set(0, 0, 0);
    AV.yaw = yaw;
    AV.onGround = true;
  }

  // ---------- Layers ----------
  function showLayer(name) {
    for (const el of document.querySelectorAll('.layer')) el.classList.toggle('on', el.id === 'L-' + name);
  }

  // ---------- Title ----------
  function toTitle() {
    S.mode = 'title';
    S.paused = false;
    $('O-pause').classList.remove('on');
    loadWorld(0);
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

  // ---------- Start trip ----------
  function startTrip() {
    S.collected = [[], [], []];
    S.words = [0, 0, 0];
    S.wordSkipped = [false, false, false];
    S.stars = [0, 0, 0];
    setAvatar(S.player);
    enterWorld(0);
  }

  function enterWorld(wi) {
    S.wi = wi;
    loadWorld(wi);
    S.mode = 'play';
    S.quest = 0;
    S.wordIdx = 0;
    S.wordAttempts = 0;
    S.wordReady = false;
    S.questions = shuffle(WORLDS[wi].questions).slice(0, 3).map((q) => ({ ...q, opts: shuffle(q.a) }));
    avatarHolder.visible = true;
    arrow.visible = true;
    W.beacon.visible = true;
    placeAvatar(SPAWN.clone());
    camRig.pos.copy(AV.pos).add(CAM_OFF);
    camRig.target.copy(AV.pos);
    $('h-world').textContent = WORLDS[wi].name;
    $('t-world').textContent = WORLDS[wi].name;
    showLayer('play');
    renderQuests();
    renderPack();
    renderPads();
    $('h-sentence').classList.remove('on');
    const arr = $('h-arrival');
    $('h-aw').textContent = `Welcome to ${WORLDS[wi].name}!`;
    $('h-at').textContent = WORLDS[wi].tense;
    arr.classList.remove('on');
    void arr.offsetWidth;
    arr.classList.add('on');
    setTimeout(() => S.mode === 'play' && S.wi === wi && showHint(HINTS[0]), 3000);
    startMusic(WORLDS[wi].music);
  }

  $('h-arrival').addEventListener('animationend', (e) => {
    if (e.animationName === 'arrive') $('h-arrival').classList.remove('on');
  });

  function showHint(text) {
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

  function renderQuests() {
    const el = $('h-quests');
    el.innerHTML = QUESTS.map((q, i) => {
      const st = i < S.quest ? 'done' : i === S.quest ? 'now' : '';
      let cnt = '';
      if (i === 0 && S.quest === 0) cnt = `${S.collected[S.wi].length}/3`;
      if (i === 1 && S.quest === 1) cnt = `${S.wordIdx}/3`;
      return `<div class="q ${st}"><span class="dot">${i < S.quest ? '✓' : i + 1}</span>${q}${cnt ? `<span class="cnt">${cnt}</span>` : ''}</div>`;
    }).join('');
  }

  function renderPack() {
    const slots = document.querySelectorAll('.pack .slot');
    const c = S.collected[S.wi];
    slots.forEach((s, k) => {
      const id = c[k];
      const had = s.dataset.id || '';
      if ((id || '') === had) return;
      s.dataset.id = id || '';
      s.className = 'slot' + (id ? ' full' : '');
      s.innerHTML = id ? (thumbs[id] ? `<img alt="${objName(id)}" src="${thumbs[id]}">` : objName(id)) : '';
    });
  }

  function setQuest(q) {
    S.quest = q;
    renderQuests();
    if (q === 1) {
      renderPads();
      $('h-sentence').classList.add('on');
      renderSentence();
      showHint(HINTS[1]);
      setTimeout(() => S.quest === 1 && $('h-hint').classList.remove('on'), 2500);
      S.wordReady = true;
    } else {
      $('h-sentence').classList.remove('on');
      if (q < 4) showHint(HINTS[q]);
    }
    if (q === 3) openPortal();
  }

  // ----- Quest 1: pickups -----
  function collect(pk) {
    pk.taken = true;
    S.collected[S.wi].push(pk.id);
    sfx.pick();
    burst(V(pk.x, pk.top + 1.7, pk.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 22, { speed: 5, up: 7 });
    feedback(`${objName(pk.id)}!`, true);
    pk.flyT = 0;
    renderPack();
    renderQuests();
    if (S.collected[S.wi].length >= 3) {
      for (const o of W.pickups) {
        if (!o.taken) {
          o.taken = true;
          o.vanish = 0;
          burst(V(o.x, o.top + 1.7, o.z), ['#FFFFFF'], 8, { speed: 3, up: 3 });
        }
      }
      setTimeout(() => S.mode === 'play' && setQuest(1), 900);
    }
  }

  // ----- Quest 2: word stones -----
  function renderPads() {
    const active = S.quest === 1 && S.wordIdx < 3;
    const q = S.questions[S.wordIdx];
    W.pads.forEach((p, k) => {
      p.answer = active ? q.opts[k] : '';
      p.word.userData.draw(p.answer, '#1D3F54');
      p.mesh.material = mat(active ? WORLDS[S.wi].light : '#E3EAF0');
    });
  }
  function renderSentence() {
    const q = S.questions[S.wordIdx];
    if (!q) return;
    $('h-snum').textContent = `${S.wordIdx + 1} / 3`;
    $('h-s').innerHTML = q.s.replace('___', '<u>&nbsp;?&nbsp;</u>');
  }
  function stepOnPad(k) {
    const q = S.questions[S.wordIdx];
    const pad = W.pads[k];
    S.wordReady = false;
    S.wordAttempts++;
    if (pad.answer === q.a[0]) {
      if (S.wordAttempts === 1) S.words[S.wi]++;
      sfx.good();
      pad.flash = 1.4;
      pad.flashColor = '#7CB342';
      burst(V(pad.x, 1, pad.z), ['#FDD835', '#7CB342', '#FFFFFF'], 26, { speed: 6, up: 9, geo: starGeo, size: 0.3 });
      feedback('Yes!', true);
      $('h-s').innerHTML = q.s.replace('___', `<u>${q.a[0]}</u>`);
      setTimeout(() => {
        if (S.mode !== 'play' || S.quest !== 1) return;
        S.wordIdx++;
        S.wordAttempts = 0;
        if (S.wordIdx >= 3) {
          renderPads();
          setQuest(2);
        } else {
          placeAvatar(WORD_START.clone());
          renderPads();
          renderSentence();
          renderQuests();
          S.wordReady = true;
        }
      }, 1800);
    } else {
      sfx.bad();
      pad.flash = 0.9;
      pad.flashColor = '#E53935';
      pad.shake = 0.6;
      feedback('Try again!', false);
      AV.vel.y = 6;
      setTimeout(() => {
        if (S.mode !== 'play' || S.quest !== 1) return;
        placeAvatar(WORD_START.clone());
        S.wordReady = true;
      }, 900);
    }
  }

  // ----- Quest 3: talk -----
  const talkGroup = new THREE.Group();
  scene.add(talkGroup);
  const starsEl = $('t-stars');
  starsEl.innerHTML = STAR_SVG.repeat(3);
  function renderStars(anim) {
    starsEl.querySelectorAll('svg').forEach((s, k) => {
      s.classList.remove('on');
      if (k < S.stars[S.wi]) {
        if (anim) void s.getBoundingClientRect();
        s.classList.add('on');
      }
    });
  }
  function fmt(t) {
    const s = Math.ceil(t);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function renderTimer() {
    $('t-timer').textContent = fmt(S.talkLeft);
    $('t-timer').classList.toggle('low', S.talkLeft <= 10);
    $('t-bar').style.transform = `scaleX(${S.talkLeft / TALK_SECONDS})`;
  }
  function startTalk() {
    S.mode = 'talk';
    S.talkLeft = TALK_SECONDS;
    S.talkRunning = true;
    S.stars[S.wi] = 0;
    placeAvatar(V(STAGE.x, STAGE.top, STAGE.z), 0);
    $('t-f1').innerHTML = WORLDS[S.wi].frames[0];
    $('t-f2').innerHTML = WORLDS[S.wi].frames[1];
    renderStars(false);
    renderTimer();
    showLayer('talk');
    arrow.visible = false;
    while (talkGroup.children.length) talkGroup.remove(talkGroup.children[0]);
    S.collected[S.wi].forEach((id, k) => {
      const o = makeObject(id, 1.5);
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
    S.mode = 'play';
    showLayer('play');
    arrow.visible = true;
    burst(V(STAGE.x, 3, STAGE.z), ['#FDD835', '#FFFFFF', WORLDS[S.wi].color], 40, { speed: 8, up: 10, geo: starGeo, size: 0.3 });
    feedback('Well done!', true);
    startMusic(WORLDS[S.wi].music);
    setQuest(3);
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

  // ----- Quest 4: portal & warp -----
  function openPortal() {
    const P = W.portal;
    P.active = true;
    P.ringMat.color.set(WORLDS[S.wi].color);
    P.ringMat.emissive.set(WORLDS[S.wi].color);
    P.ringMat.emissiveIntensity = 0.6;
    sfx.portal();
    burst(V(PORTAL.x, 4.2, PORTAL.z), ['#FFFFFF', WORLDS[S.wi].color, '#FDD835'], 40, { speed: 7, up: 6 });
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
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.25, fog: false }));
    g.add(pts);
    g.position.set(0, 500, 0);
    g.visible = false;
    scene.add(g);
    return { g, tU, geo, t: 0, dur: 3.6, next: 0 };
  })();

  function startWarp() {
    S.mode = 'warp';
    const nextWi = S.wi + 1;
    warp.next = nextWi;
    warp.t = 0;
    const to = nextWi < 3 ? WORLDS[nextWi] : null;
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
    scene.fog.near = 55;
    scene.fog.far = 150;
    if (warp.next < 3) enterWorld(warp.next);
    else toFinale();
  }

  // ----- Finale -----
  const finale = new THREE.Group();
  finale.visible = false;
  scene.add(finale);
  function toFinale() {
    S.mode = 'finale';
    if (W) W.group.visible = false;
    applyAtmosphere({ skyTop: '#0E2233', skyBottom: '#2C5F7C', fog: '#1D3F54', hemi: ['#E1F5FE', '#1D3F54', 1.9], sun: ['#FFFFFF', 2.2], key: 'future' });
    while (finale.children.length) finale.remove(finale.children[0]);
    finale.visible = true;
    const pod = at(mesh(new THREE.CylinderGeometry(3, 3.4, 1.2, 16), '#FDD835', { metalness: 0.3, roughness: 0.5 }), 0, -0.6, 0);
    finale.add(pod);
    finale.add(at(mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.6, 16), '#145389'), 0, -1.5, 0));
    WORLDS.forEach((w, i) => {
      const mini = new THREE.Group();
      mini.add(at(mesh(new THREE.CylinderGeometry(3, 2.8, 0.8, 12), w.color), 0, 0, 0));
      const c = at(mesh(new THREE.ConeGeometry(2.8, 4, 12), w.rock), 0, -2.4, 0);
      c.rotation.x = Math.PI;
      mini.add(c);
      mini.position.set(-14 + i * 14, 6 + (i % 2) * 2, -22);
      mini.userData.phase = i;
      finale.add(mini);
      const lab = textSprite(w.short.toUpperCase(), { bg: w.color, scale: 0.7 });
      lab.position.set(0, 3, 0);
      mini.add(lab);
    });
    const all = S.collected.flat();
    all.forEach((id, k) => {
      const o = makeObject(id, 1.3);
      o.userData.orbit = { a: (k / Math.max(1, all.length)) * Math.PI * 2, r: 4.2 + (k % 2) * 0.8, y: 1.2 + (k % 3) * 0.9 };
      finale.add(o);
    });
    placeAvatar(V(0, 0, 0), 0);
    avatarHolder.visible = true;
    arrow.visible = false;
    sfx.fanfare();

    const name = PLAYERS[S.player].name;
    $('f-title').textContent = `You are a Time Master, ${name}!`;
    $('f-stars').textContent = S.stars.reduce((a, b) => a + b, 0);
    $('f-words').textContent = S.words.reduce((a, b) => a + b, 0);
    $('f-saved').textContent = '';
    $('f-rows').innerHTML = WORLDS.map((w, i) => {
      const imgs = S.collected[i].map((id) => (thumbs[id] ? `<img alt="${objName(id)}" src="${thumbs[id]}">` : objName(id))).join('');
      return `<div class="wrow"><span class="nm" style="background:${w.color}">${w.short}</span><span class="st">${'★'.repeat(S.stars[i])}<span style="color:#CFD8DC">${'★'.repeat(3 - S.stars[i])}</span></span><span class="ws">✓${S.words[i]}</span><span class="th">${imgs}</span></div>`;
    }).join('');
    const when = stamp(new Date());
    WORLDS.forEach((w, i) => {
      S.rows.push({ player: name, world: w.short, challenge: 'Find 3 things', score: S.collected[i].length, max: 3, details: S.collected[i].map(objName).join('; '), date: when });
      S.rows.push({ player: name, world: w.short, challenge: 'Word stones (first try)', score: S.words[i], max: 3, details: S.wordSkipped[i] ? 'skipped by teacher' : '', date: when });
      S.rows.push({ player: name, world: w.short, challenge: 'Talk stars', score: S.stars[i], max: 3, details: '', date: when });
    });
    showLayer('final');
    camRig.pos.set(5.5, 3.4, 13);
    camRig.target.set(5.5, 1.8, 0);
    fireworkT = 0;
  }
  let fireworkT = 0;

  function pad2(n) {
    return String(n).padStart(2, '0');
  }
  function stamp(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function csvCell(v) {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
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
  $('btn-next').addEventListener('click', () => nextPlayer());
  function nextPlayer() {
    finale.visible = false;
    toTitle();
  }

  // ----- Teacher skip -----
  function skip() {
    if (S.mode === 'talk') return endTalk();
    if (S.mode !== 'play') return;
    if (S.quest === 0) {
      for (const pk of W.pickups) if (!pk.taken && S.collected[S.wi].length < 3) collect(pk);
    } else if (S.quest === 1) {
      S.wordSkipped[S.wi] = true;
      S.wordIdx = 3;
      renderPads();
      setQuest(2);
    } else if (S.quest === 2) {
      startTalk();
    } else if (S.quest === 3) {
      startWarp();
    }
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
        break;
      case 'talk':
        if (e.repeat) return;
        if (k === '1' || k === '2' || k === '3' || k === '0') giveStars(+k);
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
        else if (k === 'n' || k === 'N') nextPlayer();
        break;
    }
  });

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
  const SPEED = 8.5, JUMP_V = 10.2, GRAV = 26;
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
    if (S.mode === 'play' && !AV.locked) {
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
  }

  function animateAvatar(dt, t) {
    const M = AV.model;
    if (!M) return;
    const sp = Math.hypot(AV.vel.x, AV.vel.z);
    if (sp > 0.6) {
      const target = Math.atan2(AV.vel.x, AV.vel.z);
      let d = target - AV.yaw;
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
      legA = Math.sin(t * 10) * 0.2;
      M.armL.rotation.set(Math.PI, 0, 0.2);
      M.armR.rotation.set(Math.PI, 0, -0.2);
      M.legL.rotation.x = legA;
      M.legR.rotation.x = -legA;
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
    const gh = W ? groundAt(AV.pos.x, AV.pos.z, AV.pos.y) : 0;
    M.blob.position.set(AV.pos.x, gh + 0.03, AV.pos.z);
    const hgt = AV.pos.y - gh;
    M.blob.scale.setScalar(Math.max(0.4, 1 - hgt * 0.15));
  }

  // ---------- Camera ----------
  const CAM_OFF = V(0, 8.5, 13.5);
  const camRig = { pos: V(0, 30, 70), target: V(0, 0, 0) };
  function updateCamera(dt, t) {
    let wantP, wantT, k = 1 - Math.exp(-dt * 3.5);
    const wide = Math.max(1, 16 / 9 / camera.aspect);
    if (S.mode === 'title' || S.mode === 'brief') {
      const a = t * 0.06;
      wantP = V(Math.sin(a) * 58 * wide, 30, Math.cos(a) * 58 * wide);
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
    } else if (S.mode === 'finale') {
      wantP = V(5.6 * wide + Math.sin(t * 0.3) * 0.8, 3.6, 13 * wide);
      wantT = V(5.6 * wide, 2.0, 0);
    }
    camRig.pos.lerp(wantP, k);
    camRig.target.lerp(wantT, k);
    camera.position.copy(camRig.pos);
    camera.lookAt(camRig.target);
  }

  // ---------- Loop ----------
  function update(dt, t, realDt) {
    if (W) for (const u of W.updaters) u(t, dt);
    if (W) for (const g of W.group.children) if (g.userData.spin) g.rotation.y += dt * g.userData.spin;

    if (S.mode === 'play' || S.mode === 'talk' || S.mode === 'warp' || S.mode === 'finale') {
      if (S.mode !== 'warp') updateAvatar(dt);
      animateAvatar(dt, t);
    }

    if (W && (S.mode === 'play' || S.mode === 'title' || S.mode === 'brief')) {
      // pickups
      for (const pk of W.pickups) {
        if (pk.vanish !== undefined) {
          pk.vanish += dt;
          pk.group.scale.setScalar(Math.max(0.001, 1 - pk.vanish * 3));
          if (pk.vanish > 0.4) pk.group.visible = false;
          continue;
        }
        if (pk.taken) {
          // fly into the backpack
          pk.flyT += dt * 2.2;
          const tgt = AV.pos.clone().add(V(0, 1.6, 0));
          pk.group.position.lerp(tgt, Math.min(1, pk.flyT));
          pk.group.scale.setScalar(Math.max(0.001, 1 - pk.flyT));
          if (pk.flyT >= 1) pk.group.visible = false;
          continue;
        }
        pk.obj.position.y = 1.7 + Math.sin(t * 2 + pk.phase) * 0.25;
        pk.obj.rotation.y += dt * 1.2;
        pk.ring.scale.setScalar(1 + Math.sin(t * 3 + pk.phase) * 0.12);
        if (S.mode === 'play' && S.quest === 0) {
          const d = Math.hypot(AV.pos.x - pk.x, AV.pos.z - pk.z);
          if (d < 1.9 && Math.abs(AV.pos.y - pk.top) < 2.2) collect(pk);
        }
      }
      // pads
      for (const [k, p] of W.pads.entries()) {
        if (p.flash > 0) {
          p.flash -= dt;
          p.mesh.material = mat(p.flash > 0 ? p.flashColor : S.quest === 1 && S.wordIdx < 3 ? WORLDS[S.wi].light : '#E3EAF0');
        }
        if (p.shake > 0) p.shake -= dt;
        p.mesh.position.x = p.x + (p.shake > 0 ? Math.sin(t * 60) * 0.15 : 0);
        p.word.position.y = 3.4 + Math.sin(t * 2 + k) * 0.15;
        if (S.mode === 'play' && S.quest === 1 && S.wordReady && AV.onGround) {
          if (Math.abs(AV.pos.x - p.x) < PAD_HALF && Math.abs(AV.pos.z - p.z) < PAD_HALF) stepOnPad(k);
        }
      }
      // stage
      W.stageRing.material.opacity = S.quest === 2 ? 0.6 + Math.sin(t * 5) * 0.35 : 0.4;
      if (S.mode === 'play' && S.quest === 2 && Math.hypot(AV.pos.x - STAGE.x, AV.pos.z - STAGE.z) < STAGE.r - 0.6) startTalk();
      // portal
      const P = W.portal;
      P.swirlU.t.value = t;
      P.swirlU.on.value = lerp(P.swirlU.on.value, P.active ? 1 : 0, dt * 2);
      P.ring.rotation.z = P.active ? t * 0.8 : 0;
      if (S.mode === 'play' && S.quest === 3 && P.active && Math.hypot(AV.pos.x - PORTAL.x, AV.pos.z - PORTAL.z) < 2.6) startWarp();
      // guide
      const goal = goalPos();
      if (goal && S.mode === 'play') {
        W.beacon.visible = true;
        W.beacon.position.set(goal.x, 20, goal.z);
        W.beacon.material.opacity = 0.12 + Math.sin(t * 4) * 0.05;
        const dx = goal.x - AV.pos.x, dz = goal.z - AV.pos.z, dist = Math.hypot(dx, dz);
        arrow.visible = dist > 4;
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
          const o = c.userData.orbit;
          const a = o.a + t * 0.5;
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

  function goalPos() {
    if (S.quest === 0) {
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
    }
    if (S.quest === 1) return WORD_START;
    if (S.quest === 2) return V(STAGE.x, 0, STAGE.z);
    if (S.quest === 3) return V(PORTAL.x, 0, PORTAL.z);
    return null;
  }

  function onResize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function loop() {
    const fullDt = Math.min(clock.getDelta(), 0.5); // real time (talk timer)
    const rawDt = Math.min(fullDt, 0.05); // capped (physics)
    const t = clock.elapsedTime;
    const dt = S.paused ? 0 : rawDt;
    update(dt, t, S.paused ? 0 : fullDt);
    updateCamera(rawDt, t);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // Test / debug hooks (harmless in class).
  window.__TTS = {
    S, AV, TALK_SECONDS,
    world: () => W,
    teleport: (x, z, y = 0) => placeAvatar(V(x, y, z), AV.yaw),
    correctPad: () => (S.questions[S.wordIdx] ? W.pads.findIndex((p) => p.answer === S.questions[S.wordIdx].a[0]) : -1),
    PAD_X, PAD_Z, STAGE, PORTAL, WORD_START,
    perf: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
  };

  toTitle();
  requestAnimationFrame(loop);
}
