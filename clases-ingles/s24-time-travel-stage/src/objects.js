// Low-poly gallery objects built only from simple primitives.
import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(
      key,
      new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, metalness: 0, ...opts })
    );
  }
  return matCache.get(key);
}

export function mesh(geo, color, opts) {
  return new THREE.Mesh(geo, mat(color, opts));
}

export function at(m, x, y, z) {
  m.position.set(x, y, z);
  return m;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

export function rod(a, b, r, color, seg = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), color);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

const C = {
  turq: '#57A6B5',
  dark: '#2C5F7C',
  deep: '#1D3F54',
  blue: '#145389',
  green: '#7CB342',
  orange: '#F57C00',
  yellow: '#FDD835',
  white: '#F7FAFC',
  red: '#E53935',
  brown: '#A0683A',
  brownDark: '#6B4423',
};

function bike() {
  const g = new THREE.Group();
  const wheel = new THREE.TorusGeometry(0.5, 0.08, 6, 16);
  g.add(at(mesh(wheel, C.deep), -0.8, 0.5, 0), at(mesh(wheel, C.deep), 0.8, 0.5, 0));
  const hub = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 6);
  const h1 = at(mesh(hub, C.yellow), -0.8, 0.5, 0);
  const h2 = at(mesh(hub, C.yellow), 0.8, 0.5, 0);
  h1.rotation.x = h2.rotation.x = Math.PI / 2;
  g.add(h1, h2);
  const rear = V(-0.8, 0.5, 0), front = V(0.8, 0.5, 0), pedal = V(-0.1, 0.5, 0);
  const seatTop = V(-0.35, 1.25, 0), head = V(0.55, 1.25, 0);
  const fr = C.orange;
  g.add(
    rod(rear, pedal, 0.05, fr), rod(pedal, seatTop, 0.05, fr), rod(seatTop, head, 0.05, fr),
    rod(pedal, head, 0.05, fr), rod(rear, seatTop, 0.045, fr), rod(head, front, 0.05, fr)
  );
  g.add(at(mesh(new THREE.BoxGeometry(0.42, 0.09, 0.2), C.deep), -0.38, 1.34, 0));
  g.add(rod(head, V(0.5, 1.55, 0), 0.04, C.deep), rod(V(0.5, 1.55, -0.32), V(0.5, 1.55, 0.32), 0.045, C.deep));
  g.add(at(mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), C.deep), -0.1, 0.5, 0.15));
  return g;
}

function guitar() {
  const g = new THREE.Group();
  const lower = mesh(new THREE.SphereGeometry(0.6, 10, 8), C.orange);
  lower.scale.set(1, 1, 0.35);
  const upper = at(mesh(new THREE.SphereGeometry(0.45, 10, 8), C.orange), 0, 0.72, 0);
  upper.scale.set(1, 1, 0.35);
  const hole = at(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 10), C.deep), 0, 0.32, 0.2);
  hole.rotation.x = Math.PI / 2;
  const neck = at(mesh(new THREE.BoxGeometry(0.16, 1.3, 0.1), C.brownDark), 0, 1.5, 0.05);
  const headB = at(mesh(new THREE.BoxGeometry(0.28, 0.34, 0.1), C.deep), 0, 2.25, 0.05);
  const bridge = at(mesh(new THREE.BoxGeometry(0.36, 0.07, 0.06), C.deep), 0, -0.18, 0.22);
  g.add(lower, upper, hole, neck, headB, bridge);
  for (let i = -1; i <= 1; i += 2) {
    g.add(at(mesh(new THREE.SphereGeometry(0.05, 6, 4), C.yellow), i * 0.18, 2.3, 0.05));
  }
  g.rotation.z = -0.4;
  return g;
}

function ball() {
  let geo = new THREE.IcosahedronGeometry(0.9, 1);
  if (geo.index) geo = geo.toNonIndexed();
  const base = new THREE.IcosahedronGeometry(1, 0).attributes.position;
  const dirs = [];
  for (let i = 0; i < base.count; i++) dirs.push(V(base.getX(i), base.getY(i), base.getZ(i)).normalize());
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const white = new THREE.Color(C.white), dark = new THREE.Color(C.deep);
  const cen = new THREE.Vector3();
  for (let f = 0; f < pos.count; f += 3) {
    cen.set(0, 0, 0);
    for (let k = 0; k < 3; k++) cen.add(V(pos.getX(f + k), pos.getY(f + k), pos.getZ(f + k)));
    cen.normalize();
    const isPatch = dirs.some((d) => d.dot(cen) > 0.93);
    const c = isPatch ? dark : white;
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.7 })
  );
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function robot() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(1, 1, 0.7), C.turq), 0, 1.1, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.78, 0.62, 0.62), C.turq), 0, 1.95, 0));
  const eye = new THREE.SphereGeometry(0.09, 8, 6);
  g.add(at(mesh(eye, C.yellow, { emissive: '#7a6a00' }), -0.17, 2.02, 0.31), at(mesh(eye, C.yellow, { emissive: '#7a6a00' }), 0.17, 2.02, 0.31));
  g.add(at(mesh(new THREE.BoxGeometry(0.36, 0.06, 0.03), C.deep), 0, 1.8, 0.32));
  g.add(rod(V(0, 2.25, 0), V(0, 2.55, 0), 0.03, C.deep), at(mesh(new THREE.SphereGeometry(0.09, 8, 6), C.orange), 0, 2.6, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.32, 0.03), C.yellow), 0, 1.2, 0.36));
  for (const s of [-1, 1]) {
    g.add(rod(V(s * 0.5, 1.45, 0), V(s * 0.78, 0.85, 0), 0.09, C.dark));
    g.add(at(mesh(new THREE.SphereGeometry(0.13, 8, 6), C.deep), s * 0.8, 0.8, 0));
    g.add(at(mesh(new THREE.BoxGeometry(0.26, 0.6, 0.32), C.dark), s * 0.25, 0.3, 0));
  }
  return g;
}

function house() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(1.4, 1, 1.2), C.white), 0, 0.5, 0));
  const roof = at(mesh(new THREE.ConeGeometry(1.15, 0.8, 4), C.orange), 0, 1.4, 0);
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  g.add(at(mesh(new THREE.BoxGeometry(0.3, 0.52, 0.05), C.dark), 0, 0.26, 0.61));
  const win = new THREE.BoxGeometry(0.26, 0.26, 0.05);
  g.add(at(mesh(win, C.yellow), -0.44, 0.6, 0.61), at(mesh(win, C.yellow), 0.44, 0.6, 0.61));
  g.add(at(mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), C.deep), 0.38, 1.55, 0));
  return g;
}

function book() {
  const g = new THREE.Group();
  const cover = new THREE.BoxGeometry(1.3, 0.1, 1.0);
  g.add(at(mesh(cover, C.blue), 0, 0, 0));
  g.add(at(mesh(new THREE.BoxGeometry(1.22, 0.32, 0.92), C.white), 0.03, 0.21, 0));
  g.add(at(mesh(cover, C.blue), 0, 0.42, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.1, 0.52, 1.0), C.blue), -0.63, 0.21, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.7, 0.02, 0.18), C.yellow), 0.05, 0.48, -0.15));
  g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.1), C.yellow), 0.05, 0.48, 0.12));
  g.rotation.set(0.5, -0.4, 0.15);
  return g;
}

function plane() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.26, 0.18, 2, 8), C.white);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const nose = at(mesh(new THREE.SphereGeometry(0.26, 8, 6), C.white), 1, 0, 0);
  nose.scale.set(1.3, 1, 1);
  g.add(nose);
  g.add(at(mesh(new THREE.BoxGeometry(0.6, 0.06, 2.4), C.blue), 0.1, -0.05, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.32, 0.05, 0.9), C.blue), -0.85, 0.05, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.4, 0.5, 0.06), C.orange), -0.85, 0.32, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.05, 0.8, 0.12), C.deep), 1.32, 0, 0));
  const win = new THREE.BoxGeometry(0.12, 0.1, 0.04);
  for (let i = 0; i < 4; i++) g.add(at(mesh(win, C.turq), 0.55 - i * 0.28, 0.1, 0.24));
  g.rotation.set(0.15, -0.5, 0.12);
  return g;
}

function dog() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(1.1, 0.5, 0.5), C.brown), 0, 0.72, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.46, 0.46), C.brown), 0.65, 1.08, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), '#C98E5A'), 0.96, 0.98, 0));
  g.add(at(mesh(new THREE.SphereGeometry(0.07, 6, 4), C.deep), 1.1, 1.04, 0));
  const ear = new THREE.BoxGeometry(0.12, 0.28, 0.08);
  for (const s of [-1, 1]) {
    const e = at(mesh(ear, C.brownDark), 0.58, 1.3, s * 0.2);
    e.rotation.x = s * 0.35;
    g.add(e);
    g.add(at(mesh(new THREE.SphereGeometry(0.05, 6, 4), C.deep), 0.9, 1.16, s * 0.13));
  }
  const leg = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
  for (const x of [-0.4, 0.4]) for (const z of [-0.17, 0.17]) g.add(at(mesh(leg, C.brownDark), x, 0.25, z));
  g.add(rod(V(-0.55, 0.85, 0), V(-0.82, 1.18, 0), 0.05, C.brownDark));
  g.add(at(mesh(new THREE.BoxGeometry(0.08, 0.1, 0.48), C.red), 0.4, 0.98, 0));
  g.rotation.y = -0.5;
  return g;
}

function doctorHat() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.66, 0.62, 0.55, 12), C.white), 0, 0.33, 0));
  const top = at(mesh(new THREE.SphereGeometry(0.68, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), C.white), 0, 0.6, 0);
  top.scale.y = 0.5;
  g.add(top);
  g.add(at(mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.14, 12), C.turq), 0, 0.07, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.36, 0.11, 0.05), C.red), 0, 0.36, 0.66));
  g.add(at(mesh(new THREE.BoxGeometry(0.11, 0.36, 0.05), C.red), 0, 0.36, 0.66));
  g.rotation.x = 0.25;
  return g;
}

function skates() {
  const g = new THREE.Group();
  const one = (z) => {
    const s = new THREE.Group();
    s.add(at(mesh(new THREE.BoxGeometry(0.42, 0.62, 0.36), C.green), -0.2, 0.56, 0));
    s.add(at(mesh(new THREE.BoxGeometry(0.85, 0.26, 0.36), C.green), 0.12, 0.33, 0));
    s.add(at(mesh(new THREE.BoxGeometry(0.44, 0.08, 0.38), C.white), -0.2, 0.9, 0));
    s.add(at(mesh(new THREE.BoxGeometry(0.95, 0.07, 0.28), C.deep), 0.1, 0.17, 0));
    const wheel = new THREE.CylinderGeometry(0.11, 0.11, 0.1, 8);
    for (const x of [-0.27, -0.03, 0.22, 0.45]) {
      const w = at(mesh(wheel, C.yellow), x, 0.07, 0);
      w.rotation.x = Math.PI / 2;
      s.add(w);
    }
    for (let i = 0; i < 3; i++) s.add(at(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), C.white), 0.02 + i * 0.12, 0.47, 0));
    s.position.z = z;
    return s;
  };
  g.add(one(-0.32));
  const b = one(0.32);
  b.position.x = 0.3;
  g.add(b);
  g.rotation.y = -0.6;
  return g;
}

function trophy() {
  const g = new THREE.Group();
  const gold = { roughness: 0.45, metalness: 0.35 };
  g.add(at(mesh(new THREE.CylinderGeometry(0.58, 0.3, 0.85, 10), C.yellow, gold), 0, 1.4, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.42, 8), C.yellow, gold), 0, 0.8, 0));
  g.add(at(mesh(new THREE.SphereGeometry(0.14, 8, 6), C.yellow, gold), 0, 0.98, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.85, 0.32, 0.85), C.blue), 0, 0.16, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.14, 10), C.yellow, gold), 0, 0.39, 0));
  for (const s of [-1, 1]) {
    const h = at(mesh(new THREE.TorusGeometry(0.24, 0.06, 6, 10, Math.PI), C.yellow, gold), s * 0.55, 1.45, 0);
    h.rotation.z = -s * Math.PI / 2;
    g.add(h);
  }
  return g;
}

function rainCloud() {
  const g = new THREE.Group();
  const puff = [[0, 1.6, 0, 0.55], [-0.55, 1.45, 0.05, 0.42], [0.55, 1.45, 0, 0.45], [-0.25, 1.85, -0.05, 0.4], [0.3, 1.82, 0.05, 0.38], [0, 1.45, 0.3, 0.4]];
  for (const [x, y, z, r] of puff) g.add(at(mesh(new THREE.IcosahedronGeometry(r, 1), '#A9BCC8'), x, y, z));
  const drops = [];
  const dropGeo = new THREE.ConeGeometry(0.06, 0.22, 6);
  for (let i = 0; i < 7; i++) {
    const d = mesh(dropGeo, C.blue);
    d.rotation.x = Math.PI;
    d.userData.x = (i / 6 - 0.5) * 1.2;
    d.userData.z = ((i * 37) % 7) / 7 * 0.5 - 0.25;
    d.userData.phase = (i * 0.37) % 1;
    drops.push(d);
    g.add(d);
  }
  const update = (t) => {
    for (const d of drops) {
      const p = (t * 0.9 + d.userData.phase) % 1;
      d.position.set(d.userData.x, 1.15 - p * 1.1, d.userData.z);
      d.scale.setScalar(p > 0.85 ? (1 - p) / 0.15 : 1);
    }
  };
  update(0);
  g.userData.update = update;
  return g;
}

function rocketToy() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 10), C.white), 0, 1.0, 0));
  g.add(at(mesh(new THREE.ConeGeometry(0.4, 0.7, 10), C.orange), 0, 2.1, 0));
  const win = at(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12), C.turq), 0, 1.25, 0.38);
  win.rotation.x = Math.PI / 2;
  g.add(win);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = at(mesh(new THREE.BoxGeometry(0.08, 0.55, 0.4), C.blue), Math.sin(a) * 0.42, 0.45, Math.cos(a) * 0.42);
    fin.rotation.y = a;
    g.add(fin);
  }
  const flame = at(mesh(new THREE.ConeGeometry(0.25, 0.5, 8), C.yellow, { emissive: '#F57C00', emissiveIntensity: 0.6 }), 0, 0.05, 0);
  flame.rotation.x = Math.PI;
  g.add(flame);
  g.rotation.z = -0.3;
  return g;
}

function chefHat() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12), C.white), 0, 0.25, 0));
  for (const [x, z] of [[0, 0], [-0.35, 0.1], [0.35, 0.1], [0, -0.3], [0, 0.35]]) {
    g.add(at(mesh(new THREE.SphereGeometry(0.42, 10, 8), C.white), x, 0.8, z));
  }
  g.add(at(mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.1, 12), C.red), 0, 0.1, 0));
  return g;
}

function palette() {
  const g = new THREE.Group();
  const board = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 14), '#E8C99A');
  board.scale.set(1.2, 1, 0.9);
  g.add(board);
  const cols = [C.red, C.yellow, C.blue, C.green, C.orange];
  cols.forEach((c, i) => {
    const a = (i / cols.length) * Math.PI * 1.4 + 0.3;
    g.add(at(mesh(new THREE.SphereGeometry(0.15, 8, 6), c), Math.cos(a) * 0.65, 0.08, Math.sin(a) * 0.5));
  });
  const brush = rod(new THREE.Vector3(-0.2, 0.1, -0.2), new THREE.Vector3(0.9, 0.5, 0.6), 0.04, C.brown);
  g.add(brush, at(mesh(new THREE.ConeGeometry(0.07, 0.2, 6), C.blue), 0.95, 0.53, 0.63));
  g.rotation.x = 0.9;
  return g;
}

function microphone() {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.SphereGeometry(0.38, 12, 10), '#B0BEC5', { metalness: 0.3, roughness: 0.4 }), 0, 1.5, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), C.deep), 0, 1.2, 0));
  g.add(at(mesh(new THREE.CylinderGeometry(0.16, 0.1, 1.2, 10), C.deep), 0, 0.6, 0));
  g.rotation.z = -0.35;
  return g;
}

export const OBJECTS = [
  { id: 'bike', name: 'Bike', make: bike },
  { id: 'guitar', name: 'Guitar', make: guitar },
  { id: 'ball', name: 'Ball', make: ball },
  { id: 'robot', name: 'Robot', make: robot },
  { id: 'house', name: 'House', make: house },
  { id: 'book', name: 'Book', make: book },
  { id: 'plane', name: 'Plane', make: plane },
  { id: 'dog', name: 'Dog', make: dog },
  { id: 'doctor', name: 'Doctor hat', make: doctorHat },
  { id: 'skates', name: 'Skates', make: skates },
  { id: 'trophy', name: 'Trophy', make: trophy },
  { id: 'rain', name: 'Rain cloud', make: rainCloud },
  { id: 'rocket', name: 'Rocket', make: rocketToy },
  { id: 'chef', name: 'Chef hat', make: chefHat },
  { id: 'palette', name: 'Paints', make: palette },
  { id: 'mic', name: 'Microphone', make: microphone },
];

// Returns a group centered at the origin whose largest side equals `size`.
export function makeObject(id, size = 2) {
  const def = OBJECTS.find((o) => o.id === id);
  const inner = def.make();
  const wrap = new THREE.Group();
  wrap.add(inner);
  const box = new THREE.Box3().setFromObject(wrap);
  const dim = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const k = size / Math.max(dim.x, dim.y, dim.z);
  inner.position.sub(center);
  const out = new THREE.Group();
  wrap.scale.setScalar(k);
  out.add(wrap);
  out.userData.update = inner.userData.update || null;
  out.userData.id = id;
  return out;
}
