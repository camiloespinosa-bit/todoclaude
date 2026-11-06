// The Time Travel Stage · CCA S24 "Show Bloque 4"
import * as THREE from 'three';
import { OBJECTS, makeObject, mat, mesh, at, rod } from './objects.js';

const $ = (id) => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

// ---------- Config ----------
const params = new URLSearchParams(location.search);
const ISLAND_SECONDS = clamp(parseInt(params.get('t'), 10) || 60, 3, 600);
const PLAYERS = ['Jerónimo', 'Luciana'];
const ISLANDS = [
  {
    key: 'past', name: 'PAST ISLAND', short: 'Past', color: '#F57C00', light: '#FFB24D',
    instr: 'Pick 3 things from your past.',
    frames: ['<b>Yesterday</b>, I ...', '<b>Last year</b>, I <b>went</b> to ...'],
    pos: V(-19, 0, 1),
  },
  {
    key: 'present', name: 'PRESENT ISLAND', short: 'Present', color: '#57A6B5', light: '#8FD0DB',
    instr: 'Pick 3 things from today.',
    frames: ['<b>Now</b>, I <b>am</b> ...', 'I <b>can</b> ...'],
    pos: V(0, 1.5, -3),
  },
  {
    key: 'future', name: 'FUTURE ISLAND', short: 'Future', color: '#7CB342', light: '#AED581',
    instr: 'Pick 3 things for your future.',
    frames: ["<b>Someday</b>, I'm <b>going to</b> ...", "<b>I'd like to</b> ... <b>because</b> ..."],
    pos: V(19, 3, 1),
  },
];
const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>';

// ---------- WebGL check ----------
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

let renderer;
if (!webglAvailable()) {
  showNoGL();
} else {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    renderer = null;
    showNoGL();
  }
}

if (renderer) {
  const ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 112px Poppins'), document.fonts.load('600 32px Poppins')]) : Promise.resolve();
  ready.then(start, start);
}

function start() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#E4EEF3', 70, 190);
  const clock = new THREE.Clock();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  // ---------- Sky ----------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#7FC3D0') }, bottom: { value: new THREE.Color('#F0F4F8') } },
      vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vP = w.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.05, 0.55, h)), 1.0);\n#include <colorspace_fragment>\n}',
    })
  );
  scene.add(sky);

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#8FA9BA', 2.0));
  const sun = new THREE.DirectionalLight('#FFF4E0', 2.2);
  sun.position.set(20, 40, 30);
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#CFE8F0', 0.6);
  fill.position.set(-30, 10, -20);
  scene.add(fill);

  // ---------- Clouds ----------
  const clouds = [];
  const cloudGeo = new THREE.IcosahedronGeometry(1, 1);
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', flatShading: true, roughness: 1, emissive: '#B8CCD6', emissiveIntensity: 0.35 });
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(cloudGeo, cloudMat);
      const s = 1.4 + rnd() * 1.6;
      m.scale.set(s * 1.3, s * 0.8, s);
      m.position.set((k - n / 2) * 2.1, rnd() * 0.8, rnd() * 1.2);
      g.add(m);
    }
    const far = i < 12;
    g.position.set(-90 + rnd() * 180, far ? -10 + rnd() * 30 : -14 + rnd() * 6, far ? -40 - rnd() * 50 : -5 + rnd() * 25);
    g.userData.speed = 0.4 + rnd() * 0.6;
    scene.add(g);
    clouds.push(g);
  }

  // Sparkles
  const sparkGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) sp.set([-70 + rnd() * 140, -15 + rnd() * 40, -50 + rnd() * 70], i * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.25, transparent: true, opacity: 0.8 }));
  scene.add(sparks);

  // ---------- Islands ----------
  function tree(x, z, h = 1) {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(0.18 * h, 0.25 * h, 1 * h, 6), '#8D5A2B'), 0, 0.5 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(1.0 * h, 1.6 * h, 7), '#3F7F2A'), 0, 1.6 * h, 0));
    g.add(at(mesh(new THREE.ConeGeometry(0.75 * h, 1.3 * h, 7), '#4E9A33'), 0, 2.3 * h, 0));
    g.position.set(x, 0.6, z);
    return g;
  }

  function hourglass() {
    const g = new THREE.Group();
    const wood = '#8D5A2B';
    g.add(at(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 8), wood), 0, 0.1, 0));
    g.add(at(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 8), wood), 0, 2.9, 0));
    const glass = { transparent: true, opacity: 0.55, roughness: 0.2 };
    const lower = at(mesh(new THREE.ConeGeometry(0.75, 1.3, 8), '#E1F5FE', glass), 0, 0.85, 0);
    lower.rotation.x = Math.PI;
    const upper = at(mesh(new THREE.ConeGeometry(0.75, 1.3, 8), '#E1F5FE', glass), 0, 2.15, 0);
    g.add(lower, upper);
    g.add(at(mesh(new THREE.ConeGeometry(0.55, 0.5, 8), '#FDD835'), 0, 0.45, 0));
    for (const [x, z] of [[0.75, 0], [-0.75, 0], [0, 0.75], [0, -0.75]]) g.add(rod(V(x, 0.2, z), V(x, 2.8, z), 0.06, wood));
    return g;
  }

  function clockTower() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.BoxGeometry(1.4, 3.2, 1.4), '#F7FAFC'), 0, 1.6, 0));
    const roof = at(mesh(new THREE.ConeGeometry(1.25, 1.2, 4), '#2C5F7C'), 0, 3.8, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const face = at(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16), '#FDD835'), 0, 2.4, 0.72);
    face.rotation.x = Math.PI / 2;
    g.add(face);
    const hand1 = at(mesh(new THREE.BoxGeometry(0.07, 0.42, 0.05), '#1D3F54'), 0, 2.58, 0.8);
    const hand2 = at(mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), '#1D3F54'), 0.13, 2.4, 0.8);
    g.add(hand1, hand2);
    g.userData.hand = hand1;
    g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.8, 0.05), '#145389'), 0, 0.4, 0.71));
    return g;
  }

  function rocket() {
    const g = new THREE.Group();
    g.add(at(mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.6, 10), '#F7FAFC'), 0, 1.9, 0));
    g.add(at(mesh(new THREE.ConeGeometry(0.6, 1.2, 10), '#F57C00'), 0, 3.8, 0));
    const win = at(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12), '#57A6B5'), 0, 2.4, 0.58);
    win.rotation.x = Math.PI / 2;
    g.add(win);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fin = at(mesh(new THREE.BoxGeometry(0.1, 0.9, 0.6), '#145389'), Math.sin(a) * 0.65, 0.95, Math.cos(a) * 0.65);
      fin.rotation.y = a;
      g.add(fin);
    }
    const flame = at(mesh(new THREE.ConeGeometry(0.35, 0.8, 8), '#FDD835', { emissive: '#F57C00', emissiveIntensity: 0.6 }), 0, 0.35, 0);
    flame.rotation.x = Math.PI;
    g.add(flame);
    g.userData.flame = flame;
    return g;
  }

  function labelSprite(text, color) {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = 220;
    const ctx = cv.getContext('2d');
    ctx.font = '800 112px Poppins, "Segoe UI", Arial, sans-serif';
    const w = Math.min(1000, ctx.measureText(text).width + 120);
    const x0 = (1024 - w) / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, 20, w, 180, 90);
    else ctx.rect(x0, 20, w, 180);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 116);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    s.scale.set(9.3, 2, 1);
    return s;
  }

  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.45;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 1 });
  starGeo.center();
  const starMat = new THREE.MeshStandardMaterial({ color: '#FDD835', emissive: '#C79100', emissiveIntensity: 0.45, flatShading: true, roughness: 0.4, metalness: 0.2 });

  const islands = ISLANDS.map((def, idx) => {
    const g = new THREE.Group();
    g.position.copy(def.pos);
    const top = mesh(new THREE.CylinderGeometry(6.2, 5.8, 1.2, 10), def.color);
    g.add(top);
    g.add(at(mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.12, 10), def.light), 0, 0.62, 0));
    const rock = at(mesh(new THREE.ConeGeometry(5.8, 6.5, 10), '#2C5F7C'), 0, -3.85, 0);
    rock.rotation.x = Math.PI;
    g.add(rock);
    const rock2 = at(mesh(new THREE.ConeGeometry(3.4, 4.2, 8), '#1D3F54'), 0.6, -6.6, 0.4);
    rock2.rotation.x = Math.PI;
    g.add(rock2);
    for (let k = 0; k < 3; k++) {
      const r = at(mesh(new THREE.DodecahedronGeometry(0.5 + k * 0.2, 0), '#2C5F7C'), -4 + k * 4, -8 - k, 2 - k);
      r.userData.spin = 0.3 + k * 0.2;
      g.add(r);
    }
    let decor;
    if (def.key === 'past') {
      decor = hourglass();
      g.add(tree(4.0, -1.5, 1.05), tree(-4.6, 0.6, 0.8));
    } else if (def.key === 'present') {
      decor = clockTower();
      g.add(tree(-4.2, -1.2, 1.0), tree(4.6, 0.8, 0.75));
    } else {
      decor = rocket();
      g.add(tree(-4.0, -1.6, 0.95), tree(-4.8, 1.2, 0.7));
    }
    decor.position.set(def.key === 'future' ? 3.6 : def.key === 'present' ? 3.4 : -3.4, 0.6, -2.6);
    g.add(decor);
    const label = labelSprite(def.name, def.color);
    label.position.set(0, 9.2, 0);
    g.add(label);
    const objRoot = new THREE.Group();
    g.add(objRoot);
    const starRow = new THREE.Group();
    starRow.position.set(0, 11.0, 0);
    g.add(starRow);
    scene.add(g);
    return { def, group: g, decor, objRoot, starRow, label, base: def.pos.y, phase: idx * 1.7, objects: [] };
  });

  const SLOT_POS = [V(-3.4, 4.6, 2.2), V(0, 5.2, 2.8), V(3.4, 4.6, 2.2)];
  function setLabels(v) {
    for (const isl of islands) isl.label.visible = isl.starRow.visible = v;
  }

  function setIslandObjects(i, ids) {
    const isl = islands[i];
    const keep = [];
    for (const o of isl.objects) {
      if (ids.includes(o.userData.id)) keep.push(o);
      else isl.objRoot.remove(o);
    }
    isl.objects = ids.map((id) => keep.find((o) => o.userData.id === id) || spawnObject(isl, id));
    isl.objects.forEach((o, k) => o.userData.home.copy(SLOT_POS[k]));
  }

  function spawnObject(isl, id) {
    const o = makeObject(id, 2.5);
    o.userData.home = V(0, 0, 0);
    o.userData.born = clock.elapsedTime;
    o.userData.phase = Math.random() * 6;
    o.scale.setScalar(0.001);
    isl.objRoot.add(o);
    return o;
  }

  function setIslandStars(i, n) {
    const row = islands[i].starRow;
    while (row.children.length) row.remove(row.children[0]);
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(starGeo, starMat);
      s.scale.setScalar(0.8);
      s.position.x = (k - (n - 1) / 2) * 2.0;
      row.add(s);
    }
  }

  // star burst particles
  const bursts = [];
  function starBurst(i, n) {
    const isl = islands[i];
    const count = 6 + n * 4;
    for (let k = 0; k < count; k++) {
      const s = new THREE.Mesh(starGeo, starMat);
      s.scale.setScalar(0.35);
      const p = isl.group.position.clone().add(V(0, 4, 3));
      s.position.copy(p);
      const a = (k / count) * Math.PI * 2;
      s.userData.vel = V(Math.cos(a) * (4 + Math.random() * 3), 6 + Math.random() * 5, Math.sin(a) * 2 + 2);
      s.userData.life = 0;
      scene.add(s);
      bursts.push(s);
    }
  }

  // ---------- Camera rig ----------
  const camState = { pos: V(0, 14, 62), target: V(0, 2, 0) };
  let fly = null;
  let sway = 1;
  camera.position.copy(camState.pos);

  function flyTo(pos, target, dur = 2.4, onDone) {
    fly = { fromP: camState.pos.clone(), fromT: camState.target.clone(), toP: pos.clone(), toT: target.clone(), t: 0, dur, onDone };
  }

  function wide() {
    // keep framing usable on narrower screens
    return Math.max(1, (16 / 9) / camera.aspect);
  }
  const VIEWS = {
    welcome: () => ({ pos: V(0, 9, 54 * wide()), target: V(0, -1, 0) }),
    build: (i) => {
      const p = islands[i].def.pos;
      return { pos: p.clone().add(V(0, 2.5, 25 * wide())), target: p.clone().add(V(0, -0.9, 0)) };
    },
    show: (i) => {
      const p = islands[i].def.pos;
      return { pos: p.clone().add(V(0, 4.2, 20 * wide())), target: p.clone().add(V(0, 3.0, 0)) };
    },
    results: () => ({ pos: V(23, 14, 70 * wide()), target: V(23, 2, 0) }),
  };
  let currentView = () => VIEWS.welcome();
  function goView(viewFn, dur, onDone) {
    currentView = viewFn;
    const v = viewFn();
    flyTo(v.pos, v.target, dur, onDone);
  }

  // ---------- Audio ----------
  let actx = null;
  let muted = false;
  function ac() {
    if (muted) return null;
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
  function tone(freq, when, dur, type = 'sine', vol = 0.18) {
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + when;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  const sfx = {
    click: () => tone(620, 0, 0.08, 'triangle', 0.12),
    undo: () => tone(330, 0, 0.1, 'triangle', 0.1),
    end: () => { tone(880, 0, 0.22, 'sine', 0.25); tone(660, 0.25, 0.35, 'sine', 0.25); },
    stars: (n) => { for (let k = 0; k < n; k++) tone(784 * Math.pow(1.26, k), k * 0.12, 0.25, 'triangle', 0.16); },
    start: () => { tone(523, 0, 0.12); tone(659, 0.12, 0.12); tone(784, 0.24, 0.25); },
  };

  // ---------- Thumbnails ----------
  const thumbs = {};
  (function makeThumbs() {
    let tr;
    try {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      tr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
      tr.setPixelRatio(1);
      tr.setSize(256, 256, false);
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
      // cards will fall back to text only
    } finally {
      if (tr) {
        tr.dispose();
        tr.forceContextLoss();
      }
    }
  })();

  // ---------- App state ----------
  const S = {
    screen: 'welcome',
    player: 0,
    picks: [[], [], []],
    buildIsland: 0,
    focus: 0,
    showIsland: 0,
    timeLeft: ISLAND_SECONDS,
    running: false,
    paused: false,
    flying: false,
    stars: [0, 0, 0],
    rows: [],
    showHint: false,
  };
  window.__TTS = { S, ISLAND_SECONDS };

  function setScreen(name) {
    S.screen = name;
    for (const el of document.querySelectorAll('.screen')) el.classList.toggle('on', el.id === 'scr-' + name);
  }

  function setIslandColor(i) {
    document.documentElement.style.setProperty('--island', ISLANDS[i].color);
  }

  // ----- Welcome -----
  function toWelcome() {
    S.picks = [[], [], []];
    S.stars = [0, 0, 0];
    islands.forEach((_, i) => {
      setIslandObjects(i, []);
      setIslandStars(i, 0);
    });
    setScreen('welcome');
    setLabels(true);
    goView(() => VIEWS.welcome(), 2.6);
    sway = 1;
  }
  for (const b of document.querySelectorAll('.player')) {
    b.addEventListener('click', () => choosePlayer(+b.dataset.p));
  }
  function choosePlayer(p) {
    S.player = p;
    sfx.click();
    startBuild(0);
  }

  // ----- Build -----
  const grid = $('b-grid');
  const cards = OBJECTS.map((o, idx) => {
    const c = document.createElement('button');
    c.className = 'card';
    c.dataset.idx = idx;
    c.innerHTML = (thumbs[o.id] ? `<img alt="" src="${thumbs[o.id]}">` : '<div class="ph"></div>') + `<span>${o.name}</span>`;
    c.addEventListener('click', () => {
      S.focus = idx;
      togglePick(idx);
    });
    grid.appendChild(c);
    return c;
  });
  const nextBtn = document.createElement('button');
  nextBtn.className = 'next';
  nextBtn.innerHTML = '<span class="arrow">➜</span><span>Done</span>';
  nextBtn.addEventListener('click', () => buildNext());
  grid.appendChild(nextBtn);

  function startBuild(i) {
    S.buildIsland = i;
    S.focus = 0;
    setIslandColor(i);
    $('b-pill').textContent = ISLANDS[i].name;
    $('b-instr').textContent = ISLANDS[i].instr;
    setScreen('build');
    setLabels(false);
    goView(() => VIEWS.build(i), i === 0 ? 2.6 : 2.0);
    sway = 0.4;
    renderBuild();
  }

  function renderBuild() {
    const picks = S.picks[S.buildIsland];
    cards.forEach((c, idx) => {
      c.classList.toggle('picked', picks.includes(OBJECTS[idx].id));
      c.classList.toggle('focus', S.focus === idx);
    });
    nextBtn.classList.toggle('ready', picks.length === 3);
    nextBtn.classList.toggle('focus', S.focus === 12);
    $('b-slots').innerHTML = [0, 1, 2].map((k) => `<div class="slot${k < picks.length ? ' full' : ''}">${k < picks.length ? '✓' : ''}</div>`).join('');
  }

  function togglePick(idx) {
    const picks = S.picks[S.buildIsland];
    const id = OBJECTS[idx].id;
    const at = picks.indexOf(id);
    if (at >= 0) {
      picks.splice(at, 1);
      sfx.undo();
    } else if (picks.length < 3) {
      picks.push(id);
      sfx.click();
      if (picks.length === 3) S.focus = 12;
    } else {
      sfx.undo();
    }
    setIslandObjects(S.buildIsland, picks);
    renderBuild();
  }

  function buildNext() {
    if (S.picks[S.buildIsland].length < 3) {
      sfx.undo();
      return;
    }
    sfx.click();
    if (S.buildIsland < 2) startBuild(S.buildIsland + 1);
    else toReady();
  }

  function buildKey(e) {
    const k = e.key;
    let f = S.focus;
    if (k === 'ArrowRight') f = f === 12 ? 12 : f % 6 === 5 ? 12 : f + 1;
    else if (k === 'ArrowLeft') f = f === 12 ? 5 : f % 6 === 0 ? f : f - 1;
    else if (k === 'ArrowDown') f = f < 6 ? f + 6 : f;
    else if (k === 'ArrowUp') f = f >= 6 && f < 12 ? f - 6 : f;
    else if (k === 'Enter' || k === ' ') {
      if (f === 12) buildNext();
      else togglePick(f);
      return;
    } else if (k === 'Backspace') {
      const picks = S.picks[S.buildIsland];
      if (picks.length) {
        picks.pop();
        setIslandObjects(S.buildIsland, picks);
        sfx.undo();
      } else if (S.buildIsland > 0) {
        startBuild(S.buildIsland - 1);
        return;
      }
    } else return;
    S.focus = f;
    renderBuild();
  }

  // ----- Ready -----
  function toReady() {
    $('r-title').textContent = `Ready, ${PLAYERS[S.player]}?`;
    setScreen('ready');
    setLabels(true);
    goView(() => VIEWS.welcome(), 2.6);
    sway = 1;
  }

  // ----- Show -----
  const starsEl = $('s-stars');
  starsEl.innerHTML = STAR_SVG.repeat(3);
  function renderStars(animate) {
    const svgs = starsEl.querySelectorAll('svg');
    svgs.forEach((s, k) => {
      const on = k < S.stars[S.showIsland];
      s.classList.remove('on');
      if (on) {
        if (animate) void s.getBoundingClientRect();
        s.classList.add('on');
      }
    });
  }
  function fmt(t) {
    const s = Math.ceil(t);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function renderTimer() {
    $('s-timer').textContent = fmt(S.timeLeft);
    $('s-timer').classList.toggle('low', S.running && S.timeLeft <= 10);
    $('s-bar').style.transform = `scaleX(${S.timeLeft / ISLAND_SECONDS})`;
  }

  function startShow() {
    sfx.start();
    S.stars = [0, 0, 0];
    islands.forEach((_, i) => setIslandStars(i, 0));
    setScreen('show');
    setLabels(false);
    enterIsland(0);
  }

  function enterIsland(i) {
    S.showIsland = i;
    S.timeLeft = ISLAND_SECONDS;
    S.running = false;
    S.paused = false;
    S.flying = true;
    setIslandColor(i);
    $('s-pill').textContent = ISLANDS[i].name;
    $('s-step').textContent = `Island ${i + 1} of 3`;
    $('s-f1').innerHTML = ISLANDS[i].frames[0];
    $('s-f2').innerHTML = ISLANDS[i].frames[1];
    $('s-pause').classList.remove('on');
    const fl = $('s-flying');
    fl.textContent = `Let's go to ${ISLANDS[i].name}!`;
    fl.classList.add('on');
    renderStars(false);
    renderTimer();
    sway = 0.35;
    goView(() => VIEWS.show(i), i === 0 ? 2.6 : 3.0, () => {
      S.flying = false;
      S.running = true;
      fl.classList.remove('on');
    });
  }

  function nextIsland() {
    if (S.flying) return;
    S.running = false;
    sfx.end();
    if (S.showIsland < 2) enterIsland(S.showIsland + 1);
    else toResults();
  }

  function giveStars(n) {
    if (S.screen !== 'show') return;
    const i = S.showIsland;
    S.stars[i] = n;
    setIslandStars(i, n);
    starBurst(i, n);
    renderStars(true);
    sfx.stars(n);
    const t = $('s-toast');
    t.textContent = n === 3 ? 'Amazing!' : n === 2 ? 'Great job!' : 'Good try!';
    t.classList.remove('go');
    void t.offsetWidth;
    t.classList.add('go');
  }

  function togglePause() {
    if (S.screen !== 'show' || S.flying) return;
    S.paused = !S.paused;
    S.running = !S.paused;
    $('s-pause').classList.toggle('on', S.paused);
  }

  function restartIsland() {
    if (S.screen !== 'show' || S.flying) return;
    S.timeLeft = ISLAND_SECONDS;
    S.paused = false;
    S.running = true;
    S.stars[S.showIsland] = 0;
    setIslandStars(S.showIsland, 0);
    $('s-pause').classList.remove('on');
    renderStars(false);
    renderTimer();
    sfx.undo();
  }

  // ----- Results -----
  function pad(n) {
    return String(n).padStart(2, '0');
  }
  function stamp(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function toResults() {
    S.running = false;
    setScreen('results');
    setLabels(true);
    const name = PLAYERS[S.player];
    const total = S.stars.reduce((a, b) => a + b, 0);
    $('res-title').textContent = `Great show, ${name}!`;
    $('res-total').textContent = total;
    $('res-saved').textContent = '';
    const when = stamp(new Date());
    ISLANDS.forEach((d, i) => S.rows.push({ player: name, island: d.short, stars: S.stars[i], date: when }));
    $('res-bars').innerHTML = ISLANDS.map(
      (d, i) => `<div class="bar"><span>${d.short}</span><div class="track"><div class="fill" style="background:${d.color}" data-w="${(S.stars[i] / 3) * 100}"></div></div><span class="val">${S.stars[i]} ★</span></div>`
    ).join('');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        for (const f of document.querySelectorAll('#res-bars .fill')) f.style.width = Math.max(f.dataset.w, 0) + '%';
      })
    );
    sway = 0.6;
    goView(() => VIEWS.results(), 3.4);
  }

  function csvCell(v) {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function downloadCSV() {
    const lines = [['player', 'island', 'stars', 'date'].join(',')];
    for (const r of S.rows) lines.push([r.player, r.island, r.stars, r.date].map(csvCell).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const d = new Date();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `S24_Show_results_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    $('res-saved').textContent = 'Saved! Check your Downloads folder.';
    sfx.click();
  }
  $('btn-csv').addEventListener('click', downloadCSV);
  $('btn-next').addEventListener('click', () => toWelcome());

  // ---------- Keyboard ----------
  // Buttons never keep focus, so SPACE/ENTER only do what the keyboard handler says.
  for (const b of document.querySelectorAll('button')) {
    b.tabIndex = -1;
    b.addEventListener('mousedown', (e) => e.preventDefault());
  }
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  });
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    if (k === 'Enter') e.preventDefault();
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(k)) e.preventDefault();
    if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.();
      return;
    }
    if (k === 'm' || k === 'M') {
      muted = !muted;
      return;
    }
    switch (S.screen) {
      case 'welcome':
        if (k === '1') choosePlayer(0);
        else if (k === '2') choosePlayer(1);
        break;
      case 'build':
        buildKey(e);
        break;
      case 'ready':
        if (k === ' ' || k === 'Enter') {
          if (!e.repeat) startShow();
        } else if (k === 'Backspace') startBuild(2);
        break;
      case 'show':
        if (e.repeat) return;
        if (k === ' ') nextIsland();
        else if (k === '1' || k === '2' || k === '3') giveStars(+k);
        else if (k === '0') giveStars(0);
        else if (k === 'p' || k === 'P') togglePause();
        else if (k === 'r' || k === 'R') restartIsland();
        else if (k === 'h' || k === 'H') $('s-hint').classList.toggle('on');
        break;
      case 'results':
        if (k === 'd' || k === 'D') downloadCSV();
        else if (k === 'n' || k === 'N' || k === 'Enter') toWelcome();
        break;
    }
  });

  // ---------- Resize ----------
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!fly) {
      const v = currentView();
      camState.pos.copy(v.pos);
      camState.target.copy(v.target);
    }
  }
  window.addEventListener('resize', onResize);

  // ---------- Loop ----------
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;

    // camera
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / fly.dur);
      const e = easeInOut(fly.t);
      camState.pos.lerpVectors(fly.fromP, fly.toP, e);
      camState.pos.y += Math.sin(Math.PI * e) * Math.min(6, fly.fromP.distanceTo(fly.toP) * 0.15);
      camState.target.lerpVectors(fly.fromT, fly.toT, e);
      if (fly.t >= 1) {
        const done = fly.onDone;
        fly = null;
        if (done) done();
      }
    }
    camera.position.copy(camState.pos);
    camera.position.x += Math.sin(t * 0.25) * 1.6 * sway;
    camera.position.y += Math.sin(t * 0.33) * 0.5 * sway;
    camera.lookAt(camState.target);

    // islands
    for (const isl of islands) {
      isl.group.position.y = isl.base + Math.sin(t * 0.6 + isl.phase) * 0.35;
      isl.group.rotation.y = Math.sin(t * 0.2 + isl.phase) * 0.04;
      for (const c of isl.group.children) if (c.userData.spin) c.rotation.y += dt * c.userData.spin;
      if (isl.decor.userData.hand) isl.decor.userData.hand.rotation.z = -t * 0.8;
      if (isl.decor.userData.flame) isl.decor.userData.flame.scale.y = 1 + Math.sin(t * 12) * 0.15;
      for (const o of isl.objects) {
        const age = t - o.userData.born;
        const s = age < 0.6 ? easeOutBack(clamp(age / 0.6, 0, 1)) : 1;
        o.scale.setScalar(Math.max(0.001, s));
        o.position.lerp(V(o.userData.home.x, o.userData.home.y + Math.sin(t * 1.4 + o.userData.phase) * 0.25, o.userData.home.z), age < 0.05 ? 1 : 0.15);
        o.rotation.y = Math.sin(t * 0.7 + o.userData.phase) * 0.5;
        if (o.userData.update) o.userData.update(t);
      }
      isl.starRow.children.forEach((s, k) => {
        s.rotation.y = t * 1.5 + k;
      });
    }

    // star bursts
    for (let i = bursts.length - 1; i >= 0; i--) {
      const s = bursts[i];
      s.userData.life += dt;
      s.userData.vel.y -= 14 * dt;
      s.position.addScaledVector(s.userData.vel, dt);
      s.rotation.z += dt * 6;
      s.rotation.y += dt * 4;
      const l = s.userData.life;
      s.scale.setScalar(0.35 * (l > 1.0 ? Math.max(0, 1 - (l - 1.0) / 0.5) : 1));
      if (l > 1.5) {
        scene.remove(s);
        bursts.splice(i, 1);
      }
    }

    // clouds
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 100) c.position.x = -100;
    }
    sparks.rotation.y = Math.sin(t * 0.05) * 0.2;

    // timer
    if (S.screen === 'show' && S.running && !S.paused) {
      S.timeLeft = Math.max(0, S.timeLeft - dt);
      renderTimer();
      if (S.timeLeft <= 0) nextIsland();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // ---------- Go ----------
  setScreen('welcome');
  goView(() => VIEWS.welcome(), 0.01);
  requestAnimationFrame(loop);
}
