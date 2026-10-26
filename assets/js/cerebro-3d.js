// Cerebro 3D animado (three.js) del Gimnasio del Cerebro.
// Se monta sobre el primer elemento con [data-c3d]:
//   data-c3d="pantalla"   → ocupa toda la ventana (animacion-3d/index.html)
//   data-c3d="incrustado" → vive dentro de una sección de la página (fases.html)
// Requiere un importmap que resuelva "three" y "three/addons/".
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// ---------- Contenido de las fases (tomado de fases.html) ----------
const FASES = [
  { nombre: "Fase Sensorial", ancla: "fase-sensorial", edad: "0–2 años", color: "#57A6B5", densidad: 0.18,
    foco: "Vínculo y exploración sensorial",
    texto: "El foco es el vínculo cuidador–bebé: atención compartida, co-regulación y las primeras bases de atención y lenguaje." },
  { nombre: "Fase Lúdica", ancla: "fase-ludica", edad: "3–5 años", color: "#FDD835", densidad: 0.34,
    foco: "Juego simbólico y autocontrol emergente",
    texto: "El juego guiado es el vehículo: autocontrol naciente, lenguaje expresivo y primeras formas de regulación emocional, disfrazadas de historia o misión." },
  { nombre: "Fase Lógica", ancla: "fase-logica", edad: "6–10 años", color: "#7CB342", densidad: 0.52,
    foco: "Pensamiento concreto y memoria de trabajo",
    texto: "Trabajo explícito con memoria de trabajo, atención sostenida y lectoescritura cognitiva, dentro de una situación concreta que hay que resolver." },
  { nombre: "Fase Crítica", ancla: "fase-critica", edad: "11–15 años", color: "#F57C00", densidad: 0.7,
    foco: "Pensamiento abstracto e identidad",
    texto: "Retos abstractos conectados con el mundo real: metacognición, toma de decisiones e identidad." },
  { nombre: "Fase Experta", ancla: "fase-experta", edad: "18–50 años", color: "#3D8BD9", densidad: 0.86,
    foco: "Inglés como vehículo, funciones ejecutivas como músculo",
    texto: "Memoria de trabajo, atención y flexibilidad se entrenan usando el inglés como vehículo. Cuerpo primero en cada sesión." },
  { nombre: "Adulto Vital", ancla: "adulto-vital", edad: "65+ años", color: "#E8A0BF", densidad: 1.0,
    foco: "Proteger y mantener",
    texto: "Las fases anteriores entrenan funciones que todavía maduran. Adulto Vital protege y mantiene funciones que ya existen." }
];

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const tactil = window.matchMedia("(pointer: coarse)").matches;

const raiz = document.querySelector("[data-c3d]");
const incrustado = raiz.dataset.c3d === "incrustado";
const $ = (s) => raiz.querySelector(s);
// Capa opcional con Oki (solo en fases.html): usa los SVG oficiales tal cual, sin modificarlos.
const okiCapa = $("[data-c3d-oki]");

// ---------- Renderizador ----------
const canvas = $("[data-c3d-canvas]");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  $("[data-c3d-sin-webgl]")?.removeAttribute("hidden");
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(4.3, 1.1, 2.4);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 9;
controls.autoRotate = !reducirMovimiento;
controls.autoRotateSpeed = 0.6;
if (incrustado) {
  // Dentro de la página la rueda y el dedo deben seguir haciendo scroll:
  // sin zoom, y en pantallas táctiles el cerebro solo gira solo (tocarlo lanza una onda).
  controls.enableZoom = false;
  if (tactil) {
    controls.enabled = false;
    canvas.style.touchAction = "pan-y";
  }
}

const cerebro = new THREE.Group();
scene.add(cerebro);

// ---------- Utilidades ----------
// Generador pseudoaleatorio con semilla, para que la forma sea la misma en cada visita.
let semilla = 20261018;
const rand = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0;
  return semilla / 4294967296;
};
const dirAleatoria = () => {
  const u = rand() * 2 - 1, t = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(t), u, s * Math.sin(t));
};
// Pliegues (circunvoluciones) aproximados con ondas superpuestas; devuelve un valor entre -1 y 1.
const pliegue = (p) =>
  (Math.sin(11 * p.x + 7 * p.y + 3) * Math.cos(9 * p.z - 5 * p.y) +
   0.6 * Math.sin(17 * p.y + 13 * p.z + 1.7 * Math.sin(6 * p.x)) +
   0.4 * Math.cos(23 * p.z - 19 * p.x)) / 2;
const gauss = (x, c, w) => Math.exp(-((x - c) * (x - c)) / (w * w));

// Punto sobre (o dentro de) un hemisferio (+1 derecho, -1 izquierdo). Devuelve null si se descarta.
function puntoHemisferio(lado, escalaInterna = 1, conSurcos = true) {
  const d = dirAleatoria();
  // La cara medial no se dibuja: así queda visible la cisura entre hemisferios.
  if (d.x * lado < -0.72) return null;
  const p = new THREE.Vector3(d.x * 0.44, d.y * 0.6, d.z * 0.96);
  // Polo frontal y occipital un poco más estrechos
  p.x *= 1 - 0.18 * Math.max(0, Math.abs(d.z) - 0.6);
  // Base más plana, excepto el lóbulo temporal, que cuelga hacia afuera y adelante
  if (p.y < -0.12) {
    const temporal = gauss(p.z, 0.15, 0.45) * Math.max(0, d.x * lado);
    p.y = -0.12 + (p.y + 0.12) * (0.35 + 0.75 * temporal);
  }
  const f = pliegue(p);
  if (conSurcos && rand() > 0.3 + 0.7 * THREE.MathUtils.smoothstep(f, -0.3, 0.5)) return null;
  p.multiplyScalar((1 + 0.035 * f) * escalaInterna);
  p.x += lado * 0.4;
  p.y += 0.12;
  return p;
}

function puntoCerebelo() {
  const d = dirAleatoria();
  const p = new THREE.Vector3(d.x * 0.62, d.y * 0.2, d.z * 0.32);
  // Láminas horizontales características del cerebelo
  if (rand() > 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.y * 70 + p.z * 10))) return null;
  p.y -= 0.32;
  p.z -= 0.62;
  return p;
}

function puntoTronco() {
  const t = rand(), a = rand() * Math.PI * 2, r = 0.1 - t * 0.02;
  return new THREE.Vector3(Math.cos(a) * r, -0.22 - t * 0.6, Math.sin(a) * r - 0.3 - t * 0.12);
}

// Repite el muestreo hasta reunir n puntos válidos.
function muestrear(n, fn) {
  const out = [];
  while (out.length < n) { const p = fn(); if (p) out.push(p); }
  return out;
}

// ---------- Shader común: onda de activación ----------
const uniformes = {
  uTiempo: { value: 0 },
  uColor: { value: new THREE.Color(FASES[0].color) },
  uOrigen: { value: new THREE.Vector3(0, 0.6, 1) },
  uInicioOnda: { value: -10 },
  uDensidad: { value: FASES[0].densidad },
  uPixel: { value: renderer.getPixelRatio() }
};

const glslOnda = /* glsl */ `
  uniform float uTiempo;
  uniform vec3 uColor;
  uniform vec3 uOrigen;
  uniform float uInicioOnda;
  float onda(vec3 p) {
    float t = uTiempo - uInicioOnda;
    float frente = t * 1.6;
    float d = distance(p, uOrigen);
    float banda = exp(-pow((d - frente) * 4.0, 2.0));
    return banda * smoothstep(3.2, 0.0, t);
  }
`;

// ---------- Superficie del cerebro (nube de puntos) ----------
const posSuperficie = [], semSuperficie = [];
const agregar = (pts) => pts.forEach((p) => { posSuperficie.push(p.x, p.y, p.z); semSuperficie.push(rand()); });
agregar(muestrear(7500, () => puntoHemisferio(1)));
agregar(muestrear(7500, () => puntoHemisferio(-1)));
agregar(muestrear(2400, puntoCerebelo));
agregar(muestrear(350, puntoTronco));

const geoSuperficie = new THREE.BufferGeometry();
geoSuperficie.setAttribute("position", new THREE.Float32BufferAttribute(posSuperficie, 3));
geoSuperficie.setAttribute("aSemilla", new THREE.Float32BufferAttribute(semSuperficie, 1));

const matSuperficie = new THREE.ShaderMaterial({
  uniforms: uniformes,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aSemilla;
    uniform float uPixel;
    varying float vBrillo;
    varying float vOnda;
    ${glslOnda}
    void main() {
      vOnda = onda(position);
      float titileo = 0.55 + 0.45 * sin(uTiempo * (0.6 + aSemilla * 1.4) + aSemilla * 40.0);
      vBrillo = 0.35 + 0.25 * titileo;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (1.6 + aSemilla * 1.6 + vOnda * 3.0) * uPixel * (4.5 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying float vBrillo;
    varying float vOnda;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      vec3 base = vec3(0.55, 0.75, 0.88);
      vec3 c = mix(base, uColor, 0.35 + vOnda * 0.65);
      gl_FragColor = vec4(c * (vBrillo + vOnda * 0.9), a * (0.5 + vOnda * 0.5));
    }
  `
});
cerebro.add(new THREE.Points(geoSuperficie, matSuperficie));

// ---------- Red neuronal interna ----------
const nodos = muestrear(260, () => puntoHemisferio(rand() < 0.5 ? 1 : -1, 0.35 + rand() * 0.55, false));
// Cada nodo se conecta con sus vecinos más cercanos; "nivel" decide en qué fase aparece la conexión.
const aristas = [];
const yaUnidos = new Set();
nodos.forEach((p, i) => {
  const vecinos = nodos
    .map((q, j) => ({ j, d: p.distanceTo(q) }))
    .filter((v) => v.j !== i && v.d < 0.6)
    .sort((a, b) => a.d - b.d)
    .slice(0, 5);
  vecinos.forEach(({ j }) => {
    const clave = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (yaUnidos.has(clave)) return;
    yaUnidos.add(clave);
    aristas.push({ a: i, b: j, nivel: rand() });
  });
});

const posLineas = [], nivelLineas = [];
aristas.forEach(({ a, b, nivel }) => {
  posLineas.push(...nodos[a].toArray(), ...nodos[b].toArray());
  nivelLineas.push(nivel, nivel);
});
const geoLineas = new THREE.BufferGeometry();
geoLineas.setAttribute("position", new THREE.Float32BufferAttribute(posLineas, 3));
geoLineas.setAttribute("aNivel", new THREE.Float32BufferAttribute(nivelLineas, 1));

// La densidad visible se anima suavemente con uDensidadVisible.
uniformes.uDensidadVisible = { value: FASES[0].densidad };
const matLineas = new THREE.ShaderMaterial({
  uniforms: uniformes,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aNivel;
    uniform float uDensidadVisible;
    varying float vVisible;
    varying float vOnda;
    ${glslOnda}
    void main() {
      vVisible = 1.0 - smoothstep(uDensidadVisible - 0.08, uDensidadVisible, aNivel);
      vOnda = onda(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying float vVisible;
    varying float vOnda;
    void main() {
      gl_FragColor = vec4(uColor * (0.5 + vOnda * 2.0), vVisible * (0.16 + vOnda * 0.6));
    }
  `
});
cerebro.add(new THREE.LineSegments(geoLineas, matLineas));

// Nodos (somas) más brillantes
const geoNodos = new THREE.BufferGeometry().setFromPoints(nodos);
geoNodos.setAttribute("aSemilla", new THREE.Float32BufferAttribute(nodos.map(() => rand()), 1));
const matNodos = new THREE.ShaderMaterial({
  uniforms: uniformes,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aSemilla;
    uniform float uPixel;
    varying float vOnda;
    ${glslOnda}
    void main() {
      vOnda = onda(position);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (5.0 + aSemilla * 3.0 + vOnda * 8.0) * uPixel * (4.5 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying float vOnda;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.05, d);
      gl_FragColor = vec4(uColor * (0.9 + vOnda * 0.9), a * 0.85);
    }
  `
});
cerebro.add(new THREE.Points(geoNodos, matNodos));

// ---------- Impulsos que viajan por las conexiones ----------
const MAX_IMPULSOS = 160;
const impulsos = [];
const posImpulsos = new Float32Array(MAX_IMPULSOS * 3);
const geoImpulsos = new THREE.BufferGeometry();
geoImpulsos.setAttribute("position", new THREE.BufferAttribute(posImpulsos, 3));
const matImpulsos = new THREE.PointsMaterial({
  size: 0.06, color: new THREE.Color(FASES[0].color), transparent: true, opacity: 0.95,
  blending: THREE.AdditiveBlending, depthWrite: false, map: texturaBrillo()
});
cerebro.add(new THREE.Points(geoImpulsos, matImpulsos));

function texturaBrillo() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function nuevoImpulso(densidad) {
  const visibles = aristas.filter((e) => e.nivel < densidad);
  const e = visibles[Math.floor(rand() * visibles.length)];
  if (!e) return null;
  const invertir = rand() < 0.5;
  return { de: invertir ? e.b : e.a, a: invertir ? e.a : e.b, t: 0, vel: 0.5 + rand() * 0.9 };
}

// ---------- Postprocesado (resplandor) ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.45, 0.08);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function ajustarTamano() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  // El tamaño de los puntos se ajusta a la altura del lienzo para que la densidad de luz se vea igual en cualquier pantalla.
  uniformes.uPixel.value = renderer.getPixelRatio() * Math.min(1.2, Math.max(0.45, h / 900));
  // En pantallas angostas alejamos la cámara para que el cerebro quepa completo.
  const angosto = incrustado ? w / h < 1.05 : w < 720;
  camera.fov = angosto ? 66 : incrustado ? 36 : 42;
  // Con Oki en escena corremos el cerebro hacia la izquierda (y hacia arriba en pantallas angostas) para dejarle espacio.
  if (okiCapa) camera.setViewOffset(w, h, w * (angosto ? 0.08 : 0.13), angosto ? h * 0.1 : 0, w, h);
  camera.updateProjectionMatrix();
  cerebro.position.y = !incrustado && angosto ? 0.45 : 0;
}
new ResizeObserver(ajustarTamano).observe(canvas);
ajustarTamano();

// ---------- Interfaz ----------
const contenedorFases = $("[data-c3d-fases]");
let faseActual = 0;
let colorObjetivo = new THREE.Color(FASES[0].color);
let densidadObjetivo = FASES[0].densidad;

FASES.forEach((f, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "fase-btn";
  b.style.setProperty("--c", f.color);
  b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
  b.innerHTML = `<span class="fase-btn__punto" aria-hidden="true"></span>${f.nombre.replace("Fase ", "")}`;
  b.addEventListener("click", () => { seleccionarFase(i); reiniciarRecorrido(); });
  contenedorFases.appendChild(b);
});

function pintarTexto(f) {
  $("[data-c3d-nombre]").textContent = f.nombre;
  $("[data-c3d-edad]").textContent = f.edad;
  $("[data-c3d-foco]").textContent = f.foco;
  $("[data-c3d-texto]").textContent = f.texto;
  raiz.style.setProperty("--acento", f.color);
  const enlace = $("[data-c3d-enlace]");
  if (enlace) {
    enlace.href = `#${f.ancla}`;
    enlace.textContent = `Ver ${f.nombre} en detalle ↓`;
  }
}
pintarTexto(FASES[0]);

function seleccionarFase(i) {
  if (i === faseActual && uniformes.uInicioOnda.value > 0) { lanzarOnda(); return; }
  faseActual = i;
  const f = FASES[i];
  contenedorFases.querySelectorAll(".fase-btn").forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
  const contenido = $("[data-c3d-contenido]");
  contenido.classList.add("saliendo");
  setTimeout(() => { pintarTexto(f); contenido.classList.remove("saliendo"); }, 200);
  colorObjetivo = new THREE.Color(f.color);
  densidadObjetivo = f.densidad;
  lanzarOnda();
  if (i === FASES.length - 1) oki?.momento("celebrando", 2600);
  else oki?.momento("senalando", 2800);
}

function lanzarOnda() {
  const n = nodos[Math.floor(rand() * nodos.length)];
  uniformes.uOrigen.value.copy(n);
  uniformes.uInicioOnda.value = uniformes.uTiempo.value;
}

// Recorrido automático por las fases mientras nadie interactúa.
let temporizadorRecorrido;
function reiniciarRecorrido() {
  clearInterval(temporizadorRecorrido);
  if (reducirMovimiento || pausado) return;
  temporizadorRecorrido = setInterval(() => {
    if (visible) seleccionarFase((faseActual + 1) % FASES.length);
  }, 6500);
}

let pausado = false;
const botonPausa = $("[data-c3d-pausa]");
botonPausa.addEventListener("click", () => {
  pausado = !pausado;
  botonPausa.textContent = pausado ? "Reanudar" : "Pausar";
  botonPausa.setAttribute("aria-pressed", String(pausado));
  controls.autoRotate = !pausado && !reducirMovimiento;
  okiCapa?.classList.toggle("en-pausa", pausado);
  if (pausado) oki?.fijar("leyendo"); else oki?.momento("saludo", 1800);
  reiniciarRecorrido();
});

// Al tocar el cerebro se lanza una onda desde el nodo más cercano al rayo.
const raycaster = new THREE.Raycaster();
let inicioToque = null;
canvas.addEventListener("pointerdown", (e) => { inicioToque = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener("pointerup", (e) => {
  if (!inicioToque || Math.hypot(e.clientX - inicioToque.x, e.clientY - inicioToque.y) > 6) return;
  const r = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const rayoLocal = raycaster.ray.clone().applyMatrix4(new THREE.Matrix4().copy(cerebro.matrixWorld).invert());
  let mejor = null, mejorD = 0.35;
  nodos.forEach((n) => { const d = rayoLocal.distanceToPoint(n); if (d < mejorD) { mejorD = d; mejor = n; } });
  if (mejor) {
    uniformes.uOrigen.value.copy(mejor);
    uniformes.uInicioOnda.value = uniformes.uTiempo.value;
    if (!pausado) oki?.momento("sorpresa", 1600);
  }
});

// ---------- Oki ----------
// Oki reacciona con sus 8 poses oficiales (assets/img/oki/). Nunca se dibuja ni se deforma:
// solo se cambia de archivo con un fundido, y la capa flota y se mueve un poco con el puntero.
const oki = okiCapa ? crearOki(okiCapa) : null;

function crearOki(capa) {
  const ARCHIVOS = {
    saludo: "oki-base-saludo", senalando: "oki-senalando", pensando: "oki-pensando",
    sorpresa: "oki-sorpresa", celebrando: "oki-celebrando", ejercitando: "oki-ejercitando", leyendo: "oki-leyendo"
  };
  const url = (pose) => new URL(`../img/oki/${ARCHIVOS[pose]}.svg`, import.meta.url).href;
  const imagenes = [...capa.querySelectorAll("img")];
  let activa = 0, poseActual = null, pedido = 0, temporizador;

  // Pose de reposo: en Adulto Vital Oki se queda haciendo ejercicio; en las demás fases, pensando.
  const reposo = () => (faseActual === FASES.length - 1 ? "ejercitando" : "pensando");

  async function mostrar(pose) {
    if (pose === poseActual) return;
    poseActual = pose;
    const id = ++pedido;
    const siguiente = imagenes[1 - activa];
    siguiente.src = url(pose);
    try { await siguiente.decode(); } catch (e) { /* si falla la decodificación, igual se muestra al cargar */ }
    if (id !== pedido) return; // llegó otra pose mientras esta cargaba
    siguiente.classList.add("visible");
    imagenes[activa].classList.remove("visible");
    activa = 1 - activa;
  }

  function fijar(pose) {
    clearTimeout(temporizador);
    mostrar(pose);
  }

  // Muestra una pose un momento y luego vuelve a la de reposo.
  function momento(pose, ms) {
    clearTimeout(temporizador);
    mostrar(pose);
    temporizador = setTimeout(() => { if (!pausado) mostrar(reposo()); }, ms);
  }

  // Precarga las poses para que los cambios sean instantáneos.
  Object.keys(ARCHIVOS).forEach((pose) => { const img = new Image(); img.src = url(pose); });

  // Leve paralaje con el puntero (solo con ratón).
  if (!tactil && !reducirMovimiento) {
    raiz.addEventListener("pointermove", (e) => {
      const r = raiz.getBoundingClientRect();
      capa.style.setProperty("--ox", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      capa.style.setProperty("--oy", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    raiz.addEventListener("pointerleave", () => { capa.style.setProperty("--ox", 0); capa.style.setProperty("--oy", 0); });
  }

  return { fijar, momento };
}

// ---------- Bucle de animación ----------
const reloj = new THREE.Clock();
let tiempo = 0;
// Solo dibujamos mientras el lienzo está en pantalla, para no gastar batería ni GPU.
let visible = true;
let cuadro = 0;
new IntersectionObserver(([entrada]) => {
  visible = entrada.isIntersecting;
  if (visible && !cuadro) { reloj.getDelta(); cuadro = requestAnimationFrame(animar); }
}).observe(canvas);

function animar() {
  cuadro = 0;
  if (!visible) return;
  const dt = Math.min(reloj.getDelta(), 0.05);
  if (!pausado) tiempo += dt;
  uniformes.uTiempo.value = tiempo;

  // Transiciones suaves de color y densidad
  uniformes.uColor.value.lerp(colorObjetivo, 1 - Math.pow(0.02, dt));
  matImpulsos.color.copy(uniformes.uColor.value);
  uniformes.uDensidadVisible.value += (densidadObjetivo - uniformes.uDensidadVisible.value) * (1 - Math.pow(0.05, dt));

  // "Respiración" sutil del cerebro
  if (!reducirMovimiento) cerebro.scale.setScalar(1 + Math.sin(tiempo * 1.2) * 0.008);

  // Impulsos: más fases, más tráfico
  if (!pausado) {
    const objetivo = Math.floor(30 + uniformes.uDensidadVisible.value * (MAX_IMPULSOS - 30));
    while (impulsos.length < objetivo) { const p = nuevoImpulso(uniformes.uDensidadVisible.value); if (!p) break; impulsos.push(p); }
    for (let i = impulsos.length - 1; i >= 0; i--) {
      const p = impulsos[i];
      p.t += dt * p.vel * (reducirMovimiento ? 0.3 : 1);
      if (p.t >= 1) {
        // Al llegar, sigue por otra conexión del nodo destino (si la hay) o desaparece.
        const salidas = aristas.filter((e) => e.nivel < uniformes.uDensidadVisible.value && (e.a === p.a || e.b === p.a));
        if (salidas.length && rand() < 0.7 && impulsos.length <= objetivo) {
          const e = salidas[Math.floor(rand() * salidas.length)];
          const sig = e.a === p.a ? e.b : e.a;
          p.de = p.a; p.a = sig; p.t = 0;
        } else {
          impulsos.splice(i, 1);
        }
      }
    }
  }
  const v = new THREE.Vector3();
  for (let i = 0; i < MAX_IMPULSOS; i++) {
    const p = impulsos[i];
    if (p) v.lerpVectors(nodos[p.de], nodos[p.a], p.t); else v.set(0, -999, 0);
    v.toArray(posImpulsos, i * 3);
  }
  geoImpulsos.attributes.position.needsUpdate = true;

  controls.update();
  composer.render();
  cuadro = requestAnimationFrame(animar);
}

lanzarOnda();
oki?.momento("saludo", 2600);
reiniciarRecorrido();
cuadro = requestAnimationFrame(animar);
  