// Fig: el sistema límbico como un banco de alarma.
// Construir: node build.mjs  (y node build.mjs --light)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 640;
const HEIGHT = 420;

// ---------- mundo ----------
const PLATE = { x: -162, y: -78, w: 324, d: 146, r: 9 };
const PLATE_H = 12;
const FOOT_H = 5;

// Tálamo (derecha): recibe el estímulo y lo reparte a las dos vías
const THAL = { x: 118, y: -62, w: 32, d: 104, r: 4 };
const THAL_H = 30;
const TOKEN = [134, -6];

// Vía rápida (riel trasero, corto) → amígdala
const FAST_Y = -45;
const FAST_RAIL = [32, 116];
const FAST_CAR = { w: 22, d: 18 };
const FAST_REST = 90; // x del borde -x del carro en reposo
const FAST_HIT = 31; // x del borde -x cuando empuja el botón a fondo

// Amígdala: caja con botón en la cara +x y émbolo que sube por arriba
const AMY = { x: 6, y: -60, w: 24, d: 30, r: 3 };
const AMY_H = 40;
const PLUNGER = [18, -45];
const BUTTON_OUT = 4;
const BUTTON_IN = 1;

// Yugo (émbolo + brazo + tapa del fuelle). Sube "lift" unidades.
const Z0 = 48; // fondo del brazo en reposo
const ARM_T = 4;
const LIFT_MAX = 24;

// Fuelle = hipotálamo (eje de estrés)
const BELLOWS = [-22, -45];
const BELLOWS_R = 12;
const BELLOWS_BASE = 6;
const PLEATS = 8;

// Dial de pulso
const DIAL = [-50, -45];
const DIAL_R = 11;
const DIAL_Z = 88;
const DIAL_H = 8;
const DIAL_TOP = DIAL_Z + DIAL_H;
const STAND = [-76, -45];

// Vía lenta (riel delantero, largo) → hipocampo → corteza prefrontal
const SLOW_Y = 19;
const SLOW_RAIL = [-120, 116];
const SLOW_CAR = { w: 26, d: 22 };
const SLOW_REST = 88;
const SLOW_END = -119;

// Hipocampo: tambor de memoria sobre un pórtico
const GANTRY_X = 40;
const GANTRY_Z = 44;
const DRUM_R = 11;
const DRUM_Z = GANTRY_Z + 6;
const DRUM_H = 16;

// Corteza prefrontal: torre a la izquierda con varilla de mando y cuña
const PFC = { x: -152, y: -58, w: 30, d: 98, r: 4 };
const PFC_H = 30;
const COLUMN = { x: -152, y: -72, w: 30, d: 16, r: 3 };
const COLUMN_H = 98;
const ROD_Y = -64;
const ROD_Z = 82; // fondo de la varilla
const ROD_T = 6;
const ROD_D = 6;
const TIP0 = 14; // x de la punta en reposo
const WEDGE_L = 30;
const WEDGE_H = 24;
const BRAKE_MAX = 34;
const ROLLER = [18, ROD_Y];
const ROLLER_R = 3;

// ---------- modelo (puro, compartido con la página) ----------
const MODEL = `
const HR_REST = 70, HR_ALARM = 116;
const heartOf = (lift) => HR_REST + (HR_ALARM - HR_REST) * lift / ${LIFT_MAX};
// altura de la parte de abajo de la cuña sobre el rodillo (x = ${ROLLER[0]})
const wedgeLimit = (advance) => {
  const tip = ${TIP0} + advance;
  if (${ROLLER[0]} > tip + ${ROLLER_R}) return Infinity;
  const under = ${ROD_Z} - Math.max(0, tip - ${ROLLER[0]}) * ${WEDGE_H} / ${WEDGE_L};
  return under - (${Z0} + ${ARM_T} + ${2 * ROLLER_R}); // lift máximo permitido
};
`;
// eslint-disable-next-line no-new-func
const heartOf = new Function(MODEL + "return heartOf;")();

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [COLUMN.x, COLUMN.y, COLUMN_H + 2], [DIAL[0], DIAL[1] - DIAL_R, DIAL_TOP + 4], [THAL.x + THAL.w, THAL.y, THAL_H]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const screws = (plan, inset, z, r = 1.8) => {
  const pts = k.corners(plan, inset);
  return L(pts.map(([x, y]) => k.ring(x, y, r, z, P, 14)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: 0.45 });
};
const labelPlate = (plan, z) => {
  let out = S(k.slabOf(plan, z, 0.6, P, 2), { tone: "lo", crease: "none" });
  for (let i = 0; i < 3; i++) {
    const y = plan.y + 2 + i * ((plan.d - 4) / 2);
    out += L(k.lineOnTop([plan.x + 2.5, y], [plan.x + plan.w - 2.5 - i * 3, y], z + 0.6, P), { tone: "faint", free: true });
  }
  return out;
};
const frameY = (x, y, z) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const frameX = (x, y, z) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);

// ---------- piezas ----------
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  out.push(screws(PLATE, 11, 0, 2.2));
  // regla delantera: escala de tiempo
  const strip = { x: -120, y: PLATE.y + PLATE.d - 14, w: 236, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  return out.join("");
}

function railPair(yc, [x0, x1]) {
  const out = [];
  for (const y of [yc - 9, yc + 5]) {
    out.push(S(k.slabOf({ x: x0, y, w: x1 - x0, d: 4, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    const n = Math.max(2, Math.round((x1 - x0) / 40));
    out.push(D(Array.from({ length: n + 1 }, (_, i) => at([x0 + 5 + ((x1 - x0 - 10) * i) / n, y + 2, 3])), { size: 0.4 }));
  }
  out.push(L(k.lineOnTop([x0, yc - 2], [x1, yc - 2], 0, P), { tone: "faint" }));
  return out.join("");
}

function stopBlock(x, yc) {
  return S(k.slabOf({ x, y: yc - 11, w: 4, d: 22, r: 1 }, 0, 6, P, 3, 0.4), { tone: "mid" }) + D([at([x + 2, yc - 7, 6]), at([x + 2, yc + 7, 6])], { size: 0.4 });
}

function thalamus() {
  const out = [];
  out.push(S(k.slabOf({ ...k.insetPlan(THAL, -2), r: 5 }, 0, 4, P, 6, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(THAL, 4, THAL_H - 4, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(THAL, 4), THAL_H, P), { tone: "lo" }));
  out.push(screws(THAL, 7, THAL_H));
  // ranuras de salida de cada vía
  for (const yc of [FAST_Y, SLOW_Y]) {
    out.push(L(k.planOutline({ x: THAL.x + 4, y: yc - 6, w: 12, d: 10, r: 1.5 }, THAL_H, P, 3), { tone: "faint" }));
  }
  // asiento y ficha del estímulo
  out.push(S(k.cylinder(TOKEN[0], TOKEN[1], 9, THAL_H, 1.4, P, 40, 0.4), { tone: "mid" }));
  out.push(L(k.ring(TOKEN[0], TOKEN[1], 7.4, THAL_H + 1.4, P, 40), { tone: "lo" }));
  // perilla moleteada
  const knob = [THAL.x + 24, THAL.y + 88];
  out.push(S(k.cylinder(knob[0], knob[1], 4.5, THAL_H, 4, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 4.5, THAL_H, THAL_H + 4, 30, P), { tone: "lo" }));
  out.push(L(k.lineOnTop(knob, [knob[0] - 4.5, knob[1]], THAL_H + 4, P), { tone: "hi" }));
  out.push(labelPlate({ x: THAL.x + 9, y: THAL.y + 30, w: 16, d: 10, r: 1 }, THAL_H));
  return out.join("");
}

function token() {
  const out = [];
  out.push(S(k.cylinder(TOKEN[0], TOKEN[1], 6, THAL_H + 1.4, 3, P, 32, 0.5), { tone: "hi" }));
  out.push(L(k.ring(TOKEN[0], TOKEN[1], 3.2, THAL_H + 4.4, P, 24), { tone: "faint" }));
  return out.join("");
}

function carriage(plan, z, h, withHead) {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), z, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(plan, z, h, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([plan.x, plan.y + 4], [plan.x + plan.w, plan.y + 4], z + h, P), { tone: "faint" }));
  out.push(L(k.lineOnTop([plan.x, plan.y + plan.d - 4], [plan.x + plan.w, plan.y + plan.d - 4], z + h, P), { tone: "faint" }));
  out.push(D([at([plan.x + 3, plan.y + 2, z + h]), at([plan.x + plan.w - 3, plan.y + 2, z + h]), at([plan.x + 3, plan.y + plan.d - 2, z + h]), at([plan.x + plan.w - 3, plan.y + plan.d - 2, z + h])], { size: 0.4, tone: "lo" }));
  // tope de goma al frente (-x)
  out.push(S(k.slabOf({ x: plan.x - 2, y: plan.y + plan.d / 2 - 4, w: 2.4, d: 8, r: 1 }, z + 1, h - 2, P, 2), { tone: "lo", crease: "none" }));
  const top = z + h;
  if (withHead) {
    // cabezal lector: la señal que "lee" el contexto
    const head = { x: plan.x + 6, y: plan.y + 6, w: plan.w - 12, d: plan.d - 12, r: 2 };
    out.push(S(k.slabOf(head, top, 5, P, 3, 0.5), { tone: "hi", crease: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(head, 1.6), top + 5, P, 3), { tone: "faint" }));
    out.push(S(k.cylinder(head.x + head.w / 2, head.y + head.d / 2, 2, top + 5, 3, P, 16), { tone: "mid" }));
  } else {
    const head = { x: plan.x + 5, y: plan.y + 4, w: plan.w - 10, d: plan.d - 8, r: 2 };
    out.push(S(k.slabOf(head, top, 4, P, 3, 0.5), { tone: "hi", crease: "lo" }));
    out.push(L(k.lineOnTop([head.x + 2, head.y + head.d / 2], [head.x + head.w - 2, head.y + head.d / 2], top + 4, P), { tone: "faint" }));
  }
  // tirador moleteado detrás (+x)
  const hx = plan.x + plan.w + 3;
  const hy = plan.y + plan.d / 2;
  out.push(S(k.slabOf({ x: plan.x + plan.w - 1, y: hy - 1.5, w: 3, d: 3, r: 0.8 }, z + 1, 3, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(hx + 0.6, hy, 2.6, z, 5, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(hx + 0.6, hy, 2.6, z, z + 5, 16, P), { tone: "lo" }));
  return out.join("");
}

function amygdalaBox() {
  const out = [];
  out.push(S(k.slabOf(k.insetPlan(AMY, -2), 0, 4, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(AMY, 4, AMY_H - 4, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(AMY, 22, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(AMY, 3), AMY_H, P, 3), { tone: "lo" }));
  out.push(screws(AMY, 4, AMY_H, 1.4));
  // prensaestopa del émbolo
  out.push(S(k.cylinder(PLUNGER[0], PLUNGER[1], 5.5, AMY_H, 2.4, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.ring(PLUNGER[0], PLUNGER[1], 4, AMY_H + 2.4, P, 24), { tone: "lo" }));
  // guía del botón en la cara +x
  const g = G.disc(0, 1.2, 5, frameX(AMY.x + AMY.w, PLUNGER[1], 11), P);
  out.push(S(g, { tone: "mid" }));
  return out.join("");
}

const buttonAt = (out) => S(G.disc(0, out, 3.2, frameX(AMY.x + AMY.w + 1.2, PLUNGER[1], 11), P, { steps: 28 }), { tone: "hi", crease: "lo" });

function bellowsBase() {
  const [x, y] = BELLOWS;
  return S(k.cylinder(x, y, BELLOWS_R + 3, 0, 2, P, 48, 0.4), { tone: "lo" }) + S(k.cylinder(x, y, BELLOWS_R + 1, 2, BELLOWS_BASE - 2, P, 48, 0.4), { tone: "mid" }) + D(byDepth([[x - 13, y], [x + 13, y], [x, y - 13], [x, y + 13]]).map(([a, b]) => at([a, b, 2])), { size: 0.45 });
}

// pliegues: se reconstruyen en la página
const pleatsAt = (lift) => {
  const [x, y] = BELLOWS;
  const z0 = BELLOWS_BASE;
  const z1 = Z0 - ARM_T + lift;
  const gap = (z1 - z0) / PLEATS;
  let out = "";
  for (let i = 0; i < PLEATS; i++) {
    const r = i % 2 === 0 ? BELLOWS_R - 2.5 : BELLOWS_R;
    out += S(k.cylinder(x, y, r, z0 + i * gap, gap, P, 44), { tone: i % 2 ? "hi" : "mid", crease: "none" });
  }
  return out;
};

const plungerAt = (lift) => S(k.cylinder(PLUNGER[0], PLUNGER[1], 2.6, AMY_H + 2.4, Z0 - AMY_H - 2.4 + lift, P, 20), { tone: "hi", crease: "none" });

function yokeBack() {
  // lengüeta, horquilla y rodillo: lo que toca la cuña
  const out = [];
  out.push(S(k.slabOf({ x: ROLLER[0] - 3, y: ROD_Y - 2, w: 6, d: PLUNGER[1] - ROD_Y, r: 1 }, Z0, ARM_T, P, 3, 0.4), { tone: "mid" }));
  for (const dy of [-2.6, 2.6]) out.push(S(k.slabOf({ x: ROLLER[0] - 2, y: ROD_Y + dy - 0.6, w: 4, d: 1.2, r: 0.3 }, Z0 + ARM_T, ROLLER_R + 0.5, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(G.disc(-2, 2, ROLLER_R, frameY(ROLLER[0], ROD_Y, Z0 + ARM_T + ROLLER_R), P, { steps: 28 }), { tone: "hi", crease: "lo" }));
  return out.join("");
}

function yoke() {
  // dibujado en reposo, se mueve con translateAlong(0,0,lift)
  const out = [];
  const [bx, by] = BELLOWS;
  // tapa del fuelle
  out.push(S(k.cylinder(bx, by, BELLOWS_R + 1, Z0 - ARM_T, ARM_T, P, 44, 0.4), { tone: "mid" }));
  // brazo
  out.push(S(k.slabOf({ x: bx - 4, y: by - 3, w: PLUNGER[0] - bx + 4, d: 6, r: 2 }, Z0, ARM_T, P, 4, 0.5), { tone: "mid" }));
  out.push(D([at([bx, by, Z0 + ARM_T]), at([bx + 18, by, Z0 + ARM_T])], { size: 0.45 }));
  // lengüeta para el dial
  out.push(S(k.slabOf({ x: DIAL[0] - 3, y: by - 3, w: bx - 4 - DIAL[0] + 4, d: 6, r: 2 }, Z0, ARM_T, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(DIAL[0], DIAL[1], 2.6, Z0 + ARM_T, 0.8, P, 18), { tone: "lo" }));
  // capuchón de la amígdala: la pieza a mirar
  out.push(S(k.cylinder(PLUNGER[0], PLUNGER[1], 6, Z0, ARM_T + 3, P, 36, 0.6), { tone: "hi", lit: true }));
  out.push(L(k.ring(PLUNGER[0], PLUNGER[1], 3.4, Z0 + ARM_T + 3, P, 24), { tone: "lo" }));
  return out.join("");
}

function dialStand() {
  const out = [];
  const [x, y] = STAND;
  out.push(S(k.slabOf({ x: x - 9, y: y - 6, w: 18, d: 12, r: 2 }, 0, 5, P, 3, 0.6), { tone: "mid" }));
  out.push(D([at([x - 6, y - 3, 5]), at([x + 6, y + 3, 5])], { size: 0.45 }));
  out.push(S(k.cylinder(x, y, 2.6, 5, DIAL_Z + 6 - 5, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([30, 60].map((z) => k.sideArc(x, y, 2.6, z, P, 12)).join(""), { tone: "faint" }));
  out.push(S(k.slabOf({ x: x - 5, y: y - 5, w: 10, d: 10, r: 2 }, DIAL_Z - 2, 10, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 3.2, DIAL_Z + 8, 2, P, 20), { tone: "mid" }));
  // brazo hacia el dial
  out.push(S(k.slabOf({ x: x + 5, y: y - 2.5, w: DIAL[0] - DIAL_R + 2 - x - 5, d: 5, r: 1 }, DIAL_Z + 1, 4, P, 3, 0.4), { tone: "mid" }));
  // tornillo de apriete
  out.push(S(k.cylinder(x, y + 7, 2.2, DIAL_Z, 6, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(x, y + 7, 2.2, DIAL_Z, DIAL_Z + 6, 14, P), { tone: "lo" }));
  return out.join("");
}

const dialPlungerAt = (lift) => {
  const z = Z0 + ARM_T + 0.8 + lift;
  return S(k.cylinder(DIAL[0], DIAL[1], 1.2, z, DIAL_Z - 6 - z, P, 14), { tone: "hi", crease: "none" });
};

function dial() {
  const out = [];
  const [x, y] = DIAL;
  out.push(S(k.cylinder(x, y, 2.6, DIAL_Z - 6, 6, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 2.8, DIAL_TOP, 70, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(x, y, DIAL_R, DIAL_TOP - 2.8, P, 40), { tone: "faint" }));
  out.push(L(k.ring(x, y, DIAL_R - 2, DIAL_TOP, P, 56), { tone: "lo" }));
  // escala 0–200 lpm: 40 marcas de 5, mayor cada 25
  const t = k.radialTicks(x, y, DIAL_R - 2.6, 40, 5, DIAL_TOP, [1, 2.2], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // banda de reposo 60–100 lpm
  const ring = [];
  for (let i = 0; i <= 16; i++) {
    const a = ((60 + (40 * i) / 16) / 200) * Math.PI * 2;
    ring.push([x + Math.sin(a) * (DIAL_R - 5.6), y - Math.cos(a) * (DIAL_R - 5.6)]);
  }
  out.push(L(k.onTop(ring, DIAL_TOP, P), { tone: "green" }));
  out.push(L(k.ring(x, y, 1.2, DIAL_TOP, P, 12), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 5.4], DIAL_TOP, P, "x"), "lpm", { size: 2, tone: "lo", anchor: "middle" }));
  return out.join("");
}

const needleAt = (bpm) => {
  const a = (bpm / 200) * Math.PI * 2;
  const [x, y] = DIAL;
  return k.lineOnTop([x - Math.sin(a) * 2.6, y + Math.cos(a) * 2.6], [x + Math.sin(a) * (DIAL_R - 3.4), y - Math.cos(a) * (DIAL_R - 3.4)], DIAL_TOP + 0.2, P);
};

function gantryPost(y) {
  const out = [];
  out.push(S(k.slabOf({ x: GANTRY_X - 5, y: y - 5, w: 10, d: 10, r: 1.5 }, 0, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(GANTRY_X, y, 2.8, 3, GANTRY_Z - 3, P, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(GANTRY_X, y, 2.8, 20, P, 12), { tone: "faint" }));
  out.push(D([at([GANTRY_X - 3.4, y - 3.4, 3]), at([GANTRY_X + 3.4, y + 3.4, 3])], { size: 0.4 }));
  return out.join("");
}

function gantryTop() {
  const out = [];
  const beam = { x: GANTRY_X - 6, y: SLOW_Y - 22, w: 12, d: 44, r: 2 };
  out.push(S(k.slabOf(beam, GANTRY_Z, 6, P, 3, 0.6), { tone: "mid" }));
  out.push(D([at([GANTRY_X, beam.y + 4, GANTRY_Z + 6]), at([GANTRY_X, beam.y + beam.d - 4, GANTRY_Z + 6])], { size: 0.45 }));
  // ventana del lector bajo la viga
  out.push(L(k.planOutline({ x: GANTRY_X - 3, y: SLOW_Y - 12, w: 6, d: 6, r: 1 }, GANTRY_Z + 6, P, 2), { tone: "faint" }));
  // tambor de memoria
  out.push(S(k.cylinder(GANTRY_X, SLOW_Y + 6, DRUM_R + 1.5, DRUM_Z, 1.4, P, 48), { tone: "lo" }));
  out.push(S(k.cylinder(GANTRY_X, SLOW_Y + 6, DRUM_R, DRUM_Z + 1.4, DRUM_H, P, 56, 0.6), { tone: "mid", crease: "lo", inner: L([4, 8, 12].map((dz) => k.sideArc(GANTRY_X, SLOW_Y + 6, DRUM_R, DRUM_Z + 1.4 + dz, P, 40)).join(""), { tone: "faint" }) }));
  out.push(L(k.ring(GANTRY_X, SLOW_Y + 6, DRUM_R - 2, DRUM_Z + 1.4 + DRUM_H, P, 48), { tone: "lo" }));
  // índice fijo
  const ix = GANTRY_X;
  const iy = SLOW_Y + 6 - DRUM_R - 3;
  out.push(S(k.slabOf({ x: ix - 1.5, y: iy - 1, w: 3, d: 4, r: 0.6 }, DRUM_Z, DRUM_H + 3.4, P, 2), { tone: "mid" }));
  return out.join("");
}

const DRUM_TOP = DRUM_Z + 1.4 + DRUM_H;
const drumMarksAt = (turn) => {
  const [x, y] = [GANTRY_X, SLOW_Y + 6];
  const from = turn * Math.PI * 2;
  const t = k.radialTicks(x, y, DRUM_R - 2.6, 24, 6, DRUM_TOP, [1.2, 2.6], P, from);
  return { minor: t.minor, major: t.major };
};

function pfcTower() {
  const out = [];
  out.push(S(k.slabOf(k.insetPlan(PFC, -2), 0, 4, P, 6, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(PFC, 4, PFC_H - 4, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PFC, 4), PFC_H, P), { tone: "lo" }));
  out.push(screws(PFC, 7, PFC_H));
  // amortiguador donde llega el carro lento
  out.push(S(G.disc(0, 3, 4, frameX(PFC.x + PFC.w, SLOW_Y - 2, 7), P), { tone: "mid" }));
  // lámpara de veredicto
  out.push(S(k.cylinder(PFC.x + 15, SLOW_Y, 6, PFC_H, 1.6, P, 36), { tone: "lo" }));
  out.push(labelPlate({ x: PFC.x + 7, y: PFC.y + 68, w: 16, d: 10, r: 1 }, PFC_H));
  // columna trasera de la varilla de mando
  out.push(S(k.slabOf(COLUMN, 0, COLUMN_H, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(COLUMN, 50, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(COLUMN, 3), COLUMN_H, P, 3), { tone: "lo" }));
  out.push(D([at([COLUMN.x + 5, COLUMN.y + 8, COLUMN_H]), at([COLUMN.x + 25, COLUMN.y + 8, COLUMN_H])], { size: 0.45 }));
  // casquillo de salida de la varilla
  out.push(S(k.slabOf({ x: COLUMN.x + COLUMN.w, y: ROD_Y - 6, w: 3, d: 12, r: 1 }, ROD_Z - 4, ROD_T + 8, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

const lampAt = (on) => S(k.cylinder(PFC.x + 15, SLOW_Y, 4.4, PFC_H + 1.6, 1.6 + on * 1.6, P, 32, 0.5), { tone: on > 0.5 ? "hi" : "lo", crease: "lo" });

function rodPost(x) {
  const out = [];
  out.push(S(k.slabOf({ x: x - 5, y: ROD_Y - 5, w: 10, d: 10, r: 1.5 }, 0, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(x, ROD_Y, 2.6, 3, ROD_Z - 3 - 2, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: x - 4, y: ROD_Y - 5, w: 8, d: 10, r: 1 }, ROD_Z - 2, 2, P, 2), { tone: "mid" }));
  for (const dy of [-4.4, 4.4]) out.push(S(k.slabOf({ x: x - 4, y: ROD_Y + dy - 0.6, w: 8, d: 1.2, r: 0.3 }, ROD_Z, 3, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

const rodBodyAt = (advance) => {
  const x0 = COLUMN.x + COLUMN.w + 3;
  const x1 = TIP0 + advance - WEDGE_L;
  return S(k.slabOf({ x: x0, y: ROD_Y - ROD_D / 2, w: x1 - x0, d: ROD_D, r: 0.8 }, ROD_Z, ROD_T, P, 2, 0.4), { tone: "mid" });
};

function wedge() {
  // cuña en reposo: base en x = TIP0 - L, punta en TIP0; parte inferior baja hacia -x
  const F = frameY(0, ROD_Y - ROD_D / 2, 0);
  const poly = [
    [TIP0 - WEDGE_L, ROD_Z + ROD_T],
    [TIP0 - WEDGE_L, ROD_Z - WEDGE_H],
    [TIP0, ROD_Z],
    [TIP0, ROD_Z + ROD_T],
  ];
  const out = [S(G.prismOf(F, poly, 0, ROD_D, P), { tone: "hi", crease: "lo" })];
  out.push(D([at([TIP0 - WEDGE_L + 4, ROD_Y + ROD_D / 2, ROD_Z]), at([TIP0 - WEDGE_L + 4, ROD_Y + ROD_D / 2, ROD_Z - 14])], { size: 0.45 }));
  return out.join("");
}

// ---------- figura ----------
const fastPlan = { x: FAST_REST, y: FAST_Y - FAST_CAR.d / 2, w: FAST_CAR.w, d: FAST_CAR.d, r: 2 };
const slowPlan = { x: SLOW_REST, y: SLOW_Y - SLOW_CAR.d / 2, w: SLOW_CAR.w, d: SLOW_CAR.d, r: 2 };
const fastSvg = carriage({ ...fastPlan, x: 0 }, 3, 5, false);
const slowSvg = carriage({ ...slowPlan, x: 0 }, 3, 6, true);
const marks0 = drumMarksAt(0);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Un banco de alarma que representa el sistema límbico. A la derecha, el tálamo recibe un estímulo y lanza dos carros. El carro de la vía rápida recorre un riel corto y pulsa la caja de la amígdala, cuyo émbolo sube un brazo que infla un fuelle, el hipotálamo, y hace subir la aguja de un dial de pulso. El carro de la vía lenta recorre un riel largo, pasa bajo el tambor del hipocampo, que consulta el contexto, y llega a la torre de la corteza prefrontal. Si el contexto es seguro, la torre empuja una varilla con una cuña que baja el émbolo y la alarma se calma.",
  body: [
    plate(),
    railPair(FAST_Y, FAST_RAIL),
    railPair(SLOW_Y, SLOW_RAIL),
    stopBlock(FAST_RAIL[0] - 4, FAST_Y),
    pfcTower(),
    `<g data-part="lamp">${lampAt(0)}</g>`,
    rodPost(-100),
    rodPost(-60),
    `<g data-part="rod">${rodBodyAt(0)}</g>`,
    `<g data-slot="wa"><g data-part="wedge">${wedge()}</g></g>`,
    bellowsBase(),
    `<g data-part="pleats">${pleatsAt(0)}</g>`,
    amygdalaBox(),
    `<g data-part="button">${buttonAt(BUTTON_OUT)}</g>`,
    `<g data-part="plunger">${plungerAt(0)}</g>`,
    `<g data-part="yokeback">${yokeBack()}</g>`,
    `<g data-slot="wb"></g>`,
    `<g data-part="yoke">${yoke()}</g>`,
    `<g data-part="dialplunger">${dialPlungerAt(0)}</g>`,
    dialStand(),
    dial(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(70)}" style="stroke-width:1"/>`,
    `<g data-part="fast" transform="${k.translateAlong(P, [FAST_REST, 0, 0])}">${fastSvg}</g>`,
    `<g data-slot="s0"></g>`,
    gantryPost(SLOW_Y - 18),
    `<g data-slot="s1"></g>`,
    gantryPost(SLOW_Y + 18),
    gantryTop(),
    `<g data-part="drum"><path class="iso-line" data-tone="lo" data-m="minor" d="${marks0.minor}"/><path class="iso-line" data-tone="hi" data-m="major" d="${marks0.major}"/></g>`,
    `<g data-slot="s2"><g data-part="slow" transform="${k.translateAlong(P, [SLOW_REST, 0, 0])}">${slowSvg}</g></g>`,
    thalamus(),
    `<g data-part="token">${token()}</g>`,
  ],
});

const fns = [pleatsAt, plungerAt, dialPlungerAt, needleAt, rodBodyAt, buttonAt, lampAt, drumMarksAt]
  .map((f) => `const ${f.name} = ${f.toString()};`)
  .join("\n");

const live = `
const P = ${JSON.stringify(P)};
const k = { cylinder, solidSvg, lineSvg, slabOf, lineOnTop, radialTicks, translateAlong, depthOf };
const S = (paths, style) => solidSvg(paths, style);
const G = { disc: (s0, s1, r, F, P, o) => null };
const BELLOWS = ${JSON.stringify(BELLOWS)}, BELLOWS_R = ${BELLOWS_R}, BELLOWS_BASE = ${BELLOWS_BASE}, PLEATS = ${PLEATS};
const Z0 = ${Z0}, ARM_T = ${ARM_T}, AMY_H = ${AMY_H}, PLUNGER = ${JSON.stringify(PLUNGER)};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_R = ${DIAL_R}, DIAL_Z = ${DIAL_Z}, DIAL_TOP = ${DIAL_TOP};
const COLUMN = ${JSON.stringify(COLUMN)}, ROD_Y = ${ROD_Y}, ROD_Z = ${ROD_Z}, ROD_T = ${ROD_T}, ROD_D = ${ROD_D}, TIP0 = ${TIP0}, WEDGE_L = ${WEDGE_L};
const PFC = ${JSON.stringify(PFC)}, PFC_H = ${PFC_H}, SLOW_Y = ${SLOW_Y}, GANTRY_X = ${GANTRY_X}, DRUM_R = ${DRUM_R}, DRUM_TOP = ${DRUM_TOP};
${MODEL}
${fns}
const BUTTON_FRAMES = ${JSON.stringify(Array.from({ length: 13 }, (_, i) => buttonAt(BUTTON_IN + ((BUTTON_OUT - BUTTON_IN) * i) / 12)))};
const LAMP_FRAMES = ${JSON.stringify([lampAt(0), lampAt(1)])};
const FAST_REST = ${FAST_REST}, FAST_HIT = ${FAST_HIT}, SLOW_REST = ${SLOW_REST}, SLOW_END = ${SLOW_END};
const BUTTON_OUT = ${BUTTON_OUT}, BUTTON_IN = ${BUTTON_IN}, LIFT_MAX = ${LIFT_MAX}, BRAKE_MAX = ${BRAKE_MAX};
const AMY_FACE = ${AMY.x + AMY.w};

const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const parts = { pleats: $("pleats"), plunger: $("plunger"), yoke: $("yoke"), yokeback: $("yokeback"), dialp: $("dialplunger"), needle: $("needle"), rod: $("rod"), wedge: $("wedge"), button: $("button"), lamp: $("lamp"), fast: $("fast"), slow: $("slow"), drum: $("drum"), token: $("token") };
const slots = ["s0", "s1", "s2"].map((s) => svg.querySelector('[data-slot="' + s + '"]'));
const wslots = ["wa", "wb"].map((s) => svg.querySelector('[data-slot="' + s + '"]'));
const readout = document.querySelector("[data-readout]");
const choice = document.querySelectorAll("[data-stim]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

// Guion de un ciclo (segundos). El tiempo está muy ralentizado: en el cerebro
// todo ocurre en fracciones de segundo; aquí importa el orden, no la duración.
const T = { launch: 0.4, fastArrive: 1.0, slowArrive: 4.2, reset: 8.2, cycle: 9.6 };
const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerp = (a, b, u) => a + (b - a) * u;

let stim = "palo"; // "palo" = falsa alarma (contexto seguro) · "serpiente" = peligro real
let clock = 0, last = 0, frame = 0, visible = false, idle = true, idleTimer = 0, tourRound = 0;
const S8 = { lift: 0, rate: 0, brake: 0, drum: 0 };

function targets(t) {
  const fastU = ease((t - T.launch) / (T.fastArrive - T.launch));
  const slowU = ease((t - T.launch) / (T.slowArrive - T.launch));
  const back = ease((t - T.reset) / (T.cycle - T.reset - 0.3));
  const fastX = lerp(lerp(FAST_REST, FAST_HIT, fastU), FAST_REST, back);
  const slowX = lerp(lerp(SLOW_REST, SLOW_END, slowU), SLOW_REST, back);
  const safe = stim === "palo";
  const brakeOn = safe && t > T.slowArrive && t < T.reset + 0.6;
  // el hipocampo gira cuando el cabezal pasa bajo el tambor
  const under = ease((GANTRY_X + 20 - (slowX + 13)) / 40);
  const drumTo = t < T.reset ? under * (safe ? 0.25 : 0.75) : (1 - back) * (safe ? 0.25 : 0.75);
  return { fastX, slowX, brake: brakeOn ? BRAKE_MAX : 0, drum: drumTo };
}

function phaseText(t, bpm) {
  const n = Math.round(bpm) + " lpm";
  if (t < T.launch) return "Tálamo: llega un estímulo · " + n;
  if (t < T.fastArrive) return "Vía rápida hacia la amígdala · " + n;
  if (t < T.slowArrive - 1.4) return "Amígdala: alarma, el hipotálamo bombea · " + n;
  if (t < T.slowArrive) return "Hipocampo: ¿dónde y cuándo vi esto? · " + n;
  if (t < T.reset) return (stim === "palo" ? "Prefrontal: era un palo, frena · " : "Prefrontal: es una serpiente, sigue · ") + n;
  return "Vuelta al reposo · " + n;
}

function slotFor(slowX) {
  const c = slowX + 13;
  if (c < GANTRY_X - 16) return 0;
  if (c < GANTRY_X + 14) return 1;
  return 2;
}

function draw(t, st) {
  const lift = S8.lift;
  parts.pleats.innerHTML = pleatsAt(lift);
  parts.plunger.innerHTML = plungerAt(lift);
  parts.yoke.setAttribute("transform", translateAlong(P, [0, 0, lift]));
  parts.yokeback.setAttribute("transform", translateAlong(P, [0, 0, lift]));
  const wslot = S8.brake > 2 ? wslots[1] : wslots[0];
  if (parts.wedge.parentNode !== wslot) wslot.appendChild(parts.wedge);
  parts.dialp.innerHTML = dialPlungerAt(lift);
  const bpm = heartOf(lift);
  parts.needle.setAttribute("d", needleAt(bpm));
  parts.rod.innerHTML = rodBodyAt(S8.brake);
  parts.wedge.setAttribute("transform", translateAlong(P, [S8.brake, 0, 0]));
  parts.fast.setAttribute("transform", translateAlong(P, [st.fastX, 0, 0]));
  parts.slow.setAttribute("transform", translateAlong(P, [st.slowX, 0, 0]));
  const tip = Math.max(BUTTON_IN, Math.min(BUTTON_OUT, st.fastX - AMY_FACE - 1.2));
  parts.button.innerHTML = BUTTON_FRAMES[Math.round(((tip - BUTTON_IN) / (BUTTON_OUT - BUTTON_IN)) * 12)];
  parts.lamp.innerHTML = LAMP_FRAMES[S8.brake > BRAKE_MAX * 0.5 ? 1 : 0];
  const m = drumMarksAt(S8.drum);
  parts.drum.querySelector('[data-m="minor"]').setAttribute("d", m.minor);
  parts.drum.querySelector('[data-m="major"]').setAttribute("d", m.major);
  const slot = slots[slotFor(st.slowX)];
  if (parts.slow.parentNode !== slot) slot.appendChild(parts.slow);
  parts.token.style.opacity = t > T.launch && t < T.reset ? "0.35" : "1";
  const text = phaseText(t, bpm);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}

function step(dt, calm) {
  clock += dt;
  if (clock > T.cycle) {
    clock = 0;
    if (idle) { tourRound++; setStim(tourRound % 2 ? "serpiente" : "palo"); }
  }
  const st = targets(clock);
  const pressed = st.fastX - AMY_FACE - 1.2 < BUTTON_OUT - 1.5;
  const want = Math.min(pressed ? LIFT_MAX : 0, Math.max(0, wedgeLimit(S8.brake)));
  if (calm) { S8.lift = want; S8.rate = 0; S8.brake = st.brake; S8.drum = st.drum; }
  else {
    // el fuelle sube rápido (descarga) y baja despacio (las hormonas tardan en irse)
    const stiff = want > S8.lift ? 160 : 14, drag = want > S8.lift ? 18 : 7.5;
    for (let i = 0; i < 4; i++) { S8.rate += ((want - S8.lift) * stiff - S8.rate * drag) * dt / 4; S8.lift += S8.rate * dt / 4; }
    S8.lift = Math.min(S8.lift, Math.max(0, wedgeLimit(S8.brake)));
    S8.lift = Math.max(0, S8.lift);
    S8.brake += (st.brake - S8.brake) * (1 - Math.exp(-dt / 0.35));
    S8.drum += (st.drum - S8.drum) * (1 - Math.exp(-dt / 0.25));
  }
  draw(clock, st);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  step(dt, false);
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
function setStim(next) {
  stim = next;
  choice.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.stim === stim)));
}
function choose(next) {
  idle = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { idle = true; }, 12000);
  if (next !== stim || clock > T.slowArrive) { setStim(next); clock = 0; }
  if (still.matches) showStill();
  run();
}
function showStill() {
  // movimiento reducido: un solo cuadro con el resultado de la vía lenta
  clock = T.slowArrive + 1.8;
  const st = targets(clock);
  S8.brake = st.brake; S8.drum = st.drum;
  S8.lift = Math.min(LIFT_MAX, Math.max(0, wedgeLimit(S8.brake)));
  draw(clock, st);
}
choice.forEach((b) => b.addEventListener("click", () => choose(b.dataset.stim)));
stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); choose("palo"); }
  if (e.key === "ArrowRight") { e.preventDefault(); choose("serpiente"); }
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); choose(stim); clock = 0; }
});
stage.addEventListener("pointerdown", (e) => {
  const box = svg.getBoundingClientRect();
  choose((e.clientX - box.left) / box.width < 0.5 ? "palo" : "serpiente");
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
setStim("palo");
if (still.matches) showStill(); else draw(0, targets(0));
`;

const CSS = `
.ls-pick{display:flex;gap:8px;justify-content:center;margin:10px 0 2px;flex-wrap:wrap}
.ls-pick button{font:inherit;font-size:13px;padding:6px 14px;border-radius:999px;border:1px solid var(--anatomy-lo,#666);background:transparent;color:inherit;cursor:pointer}
.ls-pick button[aria-pressed="true"]{border-color:var(--anatomy-hi,#ddd);background:color-mix(in srgb,var(--anatomy-hi,#ddd) 14%,transparent)}
.ls-pick button:focus-visible{outline:2px solid var(--anatomy-hi,#ddd);outline-offset:2px}
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Sistema límbico",
  hint: "Elige el estímulo · flechas ← →",
  readout: "Tálamo: llega un estímulo · 70 lpm",
  keys: [
    { mark: "lit", label: "Amígdala: dispara la alarma antes de saber qué es" },
    { mark: "raised", label: "Tálamo (derecha): reparte la señal por dos vías" },
    { mark: "raised", label: "Fuelle = hipotálamo: pulso, adrenalina, cortisol" },
    { mark: "raised", label: "Tambor = hipocampo: memoria y contexto" },
    { mark: "edge", label: "Torre y cuña = corteza prefrontal: frena la alarma" },
  ],
  caption:
    "Ante algo con forma de serpiente, el tálamo envía la señal por dos caminos. La vía corta llega antes a la amígdala, que activa el hipotálamo: sube el pulso y se liberan adrenalina y cortisol. La vía larga pasa por la corteza y el hipocampo, que compara con la memoria y el contexto; si era solo un palo, la corteza prefrontal frena a la amígdala y el cuerpo vuelve a la calma, más despacio de lo que se alarmó. Modelo didáctico: el tiempo está muy ralentizado y las cifras de pulso son ilustrativas. «Sistema límbico» es una etiqueta clásica y debatida: estas estructuras trabajan en redes, no como un módulo aislado de las emociones.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Sistema límbico. Flecha izquierda: un palo, falsa alarma. Flecha derecha: una serpiente, peligro real.">${svg}</div><div class="ls-pick" role="group" aria-label="Estímulo"><button type="button" data-stim="palo" aria-pressed="true">Es un palo</button><button type="button" data-stim="serpiente" aria-pressed="false">Es una serpiente</button></div>`,
});

const name = theme === "light" ? "sistema-limbico-light.html" : "sistema-limbico.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Sistema límbico", theme, body: `<style>${CSS}</style>` + body, script: kitScript() + live }));
console.log("wrote", name, "· pulso reposo", heartOf(0).toFixed(0), "alarma", heartOf(LIFT_MAX).toFixed(0));
