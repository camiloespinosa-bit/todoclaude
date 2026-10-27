// Reservas — El Gimnasio del Cerebro.
// Con los datos de Supabase en config.js la página lee la agenda real y guarda las reservas
// (que llegan a Google Calendar). Sin esos datos funciona como prototipo con datos de ejemplo.

const CONFIG = window.CONFIG_RESERVAS ?? {};
const CONECTADO = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);

// ---------- Configuración (ajustar con el horario real) ----------
const TIPOS = {
  prueba: { nombre: "Clase de prueba gratis", minutos: 30 },
  clase: { nombre: "Clase", minutos: 60 },
  bloque: { nombre: "Bloque", minutos: 120 },
};

// Franjas de atención por día de la semana (0 = domingo), solo para el modo prototipo:
// conectada, la página usa el horario guardado en la base de datos. Minutos desde medianoche.
// Lunes 6–1 y 7–8 p.m.; martes y jueves 6–12, 1–4 y 7–8 p.m.; miércoles 6–12 y 1–8 p.m.;
// viernes 6–12; sábado 8–12 y 1–5.
const HORARIO = {
  1: [[360, 780], [1140, 1200]],
  2: [[360, 720], [780, 960], [1140, 1200]],
  3: [[360, 720], [780, 1200]],
  4: [[360, 720], [780, 960], [1140, 1200]],
  5: [[360, 720]],
  6: [[480, 720], [780, 1020]],
};

const CUPO_MAXIMO = 5; // estudiantes al mismo tiempo
// Versión de privacidad.html que acepta quien reserva. Cambiarla cuando se publique una nueva.
const POLITICA_VERSION = "2026-10-v2";
const DIAS_A_MOSTRAR = 21;
const ZONA = "America/Bogota";

// ---------- Utilidades de fecha (todo en hora de Bogotá) ----------
function hoyEnBogota() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date())
    .reduce((acc, x) => ({ ...acc, [x.type]: x.value }), {});
  return { fecha: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function diaSemana(fecha) {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

function formatear(fecha, opciones) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", ...opciones }).format(new Date(`${fecha}T12:00:00Z`));
}

function textoHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const sufijo = h < 12 ? "a.m." : h === 12 && m === 0 ? "m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

// ---------- Agenda de ejemplo ----------
// Como hay un solo docente, las clases son grupos que empiezan en punto (8:00, 9:00...):
// todos los que reservan esa hora entran al mismo grupo. El primero que reserva define si
// el grupo es presencial o virtual. Las clases de prueba son 1 a 1, de 30 minutos, y solo
// van en horas sin grupo. Datos de ejemplo, fijos para la misma fecha.
function agendaDelDia(fecha) {
  const grupos = new Map(); // hora en punto -> { modalidad, inscritos }
  const pruebas = new Set(); // inicio de cada clase de prueba ya reservada
  let semilla = [...fecha].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  for (let h = 480; h < 1200; h += 60) {
    semilla = (semilla * 1103515245 + 12345) >>> 0;
    const dado = semilla % 20;
    if (dado < 6) grupos.set(h, { modalidad: dado % 2 ? "virtual" : "presencial", inscritos: 1 + ((semilla >>> 8) % 5) });
    else if (dado < 8) pruebas.add(h + (dado % 2) * 30);
  }
  return { grupos, pruebas };
}

const NOMBRE_MODALIDAD = { presencial: "presencial", virtual: "virtual" };

// Devuelve las horas de inicio para el tipo y la modalidad elegidos.
// Cada opción: { minutos, disponible, detalle }.
function horasDisponibles(fecha, tipo, modalidad, { grupos, pruebas }) {
  const franjas = franjasDe(fecha);
  const ahora = hoyEnBogota();
  const minutosClase = TIPOS[tipo].minutos;
  const opciones = [];

  for (const [inicio, fin] of franjas) {
    const paso = tipo === "prueba" ? 30 : 60;
    for (let m = inicio; m + minutosClase <= fin; m += paso) {
      if (fecha === ahora.fecha && m <= ahora.minutos) continue;

      if (tipo === "prueba") {
        const hora = m - (m % 60);
        if (!grupos.has(hora) && !pruebas.has(m)) opciones.push({ minutos: m, disponible: true, detalle: "Disponible" });
        continue;
      }

      let quedan = CUPO_MAXIMO;
      let hayGrupo = false;
      let bloqueo = null;
      for (let h = m; h < m + minutosClase; h += 60) {
        if (pruebas.has(h) || pruebas.has(h + 30)) { bloqueo = "oculta"; break; }
        const g = grupos.get(h);
        if (!g) continue;
        hayGrupo = true;
        if (g.modalidad !== modalidad) { bloqueo = `Grupo ${NOMBRE_MODALIDAD[g.modalidad]}`; break; }
        if (g.inscritos >= CUPO_MAXIMO) { bloqueo = "Lleno"; break; }
        quedan = Math.min(quedan, CUPO_MAXIMO - g.inscritos);
      }
      if (bloqueo === "oculta") continue;
      if (bloqueo) { opciones.push({ minutos: m, disponible: false, detalle: bloqueo }); continue; }
      const cupos = quedan === 1 ? "queda 1 cupo" : `quedan ${quedan} cupos`;
      opciones.push({ minutos: m, disponible: true, detalle: hayGrupo ? `Grupo ${NOMBRE_MODALIDAD[modalidad]}, ${cupos}` : `Grupo nuevo, ${cupos}` });
    }
  }
  return opciones;
}

// ---------- Datos reales (Supabase) ----------
let franjasPorFecha = new Map(); // fecha -> [[inicio, fin], ...]

async function llamar(ruta, cuerpo) {
  const cabeceras = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };
  // Las llaves antiguas (JWT, empiezan por "eyJ") también van en Authorization.
  if (CONFIG.supabaseAnonKey.startsWith("eyJ")) cabeceras.Authorization = `Bearer ${CONFIG.supabaseAnonKey}`;
  const r = await fetch(`${CONFIG.supabaseUrl}${ruta}`, { method: "POST", headers: cabeceras, body: JSON.stringify(cuerpo) });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error(datos?.error ?? datos?.message ?? `HTTP_${r.status}`);
  return datos;
}

function franjasDe(fecha) {
  return CONECTADO ? franjasPorFecha.get(fecha) ?? [] : HORARIO[diaSemana(fecha)] ?? [];
}

async function cargarFranjas(desde, hasta) {
  const filas = await llamar("/rest/v1/rpc/dias_abiertos", { p_desde: desde, p_hasta: hasta });
  franjasPorFecha = new Map();
  for (const { fecha, inicio, fin } of filas) {
    if (!franjasPorFecha.has(fecha)) franjasPorFecha.set(fecha, []);
    franjasPorFecha.get(fecha).push([inicio, fin]);
  }
}

async function cargarAgenda(fecha) {
  if (!CONECTADO) return agendaDelDia(fecha);
  const filas = await llamar("/rest/v1/rpc/agenda_publica", { p_fecha: fecha });
  const grupos = new Map();
  const pruebas = new Set();
  for (const f of filas) {
    if (f.clase === "grupo") grupos.set(f.inicio, { modalidad: f.modalidad, inscritos: f.ocupados });
    else pruebas.add(f.inicio);
  }
  return { grupos, pruebas };
}

// ---------- Pantalla de inicio ----------
// Se muestra una vez por visita. Con movimiento reducido se quita de inmediato.
(function pantallaInicio() {
  const inicio = document.querySelector("[data-inicio]");
  if (!inicio) return;
  let yaVista = false;
  try { yaVista = sessionStorage.getItem("inicio-visto") === "1"; } catch {}
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (yaVista || reducir) { inicio.remove(); return; }
  try { sessionStorage.setItem("inicio-visto", "1"); } catch {}
  setTimeout(() => {
    inicio.setAttribute("data-saliendo", "");
    inicio.addEventListener("transitionend", () => inicio.remove(), { once: true });
  }, 1800);
})();

// ---------- Formulario ----------
const form = document.getElementById("form-reserva");
const contDias = document.getElementById("dias");
const contHoras = document.getElementById("horas");
const seleccion = document.getElementById("seleccion");
const mensaje = document.getElementById("mensaje");
const seccionListo = document.getElementById("listo");
const btnReservar = document.getElementById("btn-reservar");
const campoPersonas = document.querySelector("[data-solo-prueba]");

const estado = { tipo: null, modalidad: null, fecha: null, hora: null };

function marcar(contenedor, elegido) {
  for (const b of contenedor.querySelectorAll("button")) b.setAttribute("aria-checked", String(b === elegido));
}

function actualizarResumen() {
  const partes = [];
  if (estado.tipo) partes.push(`${TIPOS[estado.tipo].nombre} (${TIPOS[estado.tipo].minutos} min)`);
  if (estado.modalidad) partes.push(estado.modalidad === "virtual" ? "Virtual" : "Presencial");
  if (estado.fecha) partes.push(formatear(estado.fecha, { weekday: "long", day: "numeric", month: "long" }));
  if (estado.hora !== null) partes.push(textoHora(estado.hora));
  seleccion.textContent = partes.length ? partes.join(" · ") : "Elige tipo de clase, modalidad, día y hora.";
}

for (const grupo of document.querySelectorAll("[data-grupo]")) {
  grupo.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    estado[grupo.dataset.grupo] = boton.dataset.valor;
    marcar(grupo, boton);
    campoPersonas.hidden = estado.tipo !== "prueba";
    pintarHoras();
    actualizarResumen();
  });
}

function pintarDias() {
  const { fecha: hoy } = hoyEnBogota();
  for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
    const fecha = sumarDias(hoy, i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dia";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.setAttribute("aria-label", formatear(fecha, { weekday: "long", day: "numeric", month: "long" }));
    btn.disabled = !franjasDe(fecha).length;
    btn.innerHTML = `
      <span class="dia-semana">${i === 0 ? "Hoy" : formatear(fecha, { weekday: "short" })}</span>
      <span class="dia-num">${formatear(fecha, { day: "numeric" })}</span>
      <span class="dia-mes">${formatear(fecha, { month: "short" })}</span>`;
    btn.addEventListener("click", () => {
      estado.fecha = fecha;
      marcar(contDias, btn);
      pintarHoras();
      actualizarResumen();
    });
    contDias.append(btn);
  }
}

let consulta = 0; // evita pintar una respuesta vieja si cambian de día rápido

async function pintarHoras() {
  estado.hora = null;
  const mia = ++consulta;
  contHoras.replaceChildren();
  const falta = !estado.tipo || !estado.modalidad ? "Primero elige el tipo de clase y la modalidad."
    : !estado.fecha ? "Elige un día para ver las horas libres." : null;
  if (falta) {
    contHoras.innerHTML = `<p class="horas__vacio">${falta}</p>`;
    return;
  }
  contHoras.innerHTML = `<p class="horas__vacio">Buscando horas libres…</p>`;
  let agenda;
  try {
    agenda = await cargarAgenda(estado.fecha);
  } catch {
    if (mia === consulta) contHoras.innerHTML = `<p class="horas__vacio">No pudimos cargar las horas. Revisa tu conexión e intenta de nuevo.</p>`;
    return;
  }
  if (mia !== consulta) return;
  contHoras.replaceChildren();
  const opciones = horasDisponibles(estado.fecha, estado.tipo, estado.modalidad, agenda);
  if (!opciones.some((o) => o.disponible)) {
    contHoras.innerHTML = `<p class="horas__vacio">No quedan horas libres ese día para esta opción. Prueba otro día.</p>`;
    return;
  }
  for (const { minutos: m, disponible, detalle } of opciones) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hora";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.disabled = !disponible;
    btn.innerHTML = `${textoHora(m)}<small>${detalle}</small>`;
    btn.addEventListener("click", () => {
      estado.hora = m;
      marcar(contHoras, btn);
      actualizarResumen();
    });
    contHoras.append(btn);
  }
}

// Enlace "Agregar a Google Calendar" con la plantilla pública de eventos de Google.
function enlaceCalendario(datos) {
  const tipo = TIPOS[estado.tipo];
  const aTexto = (min) => `${estado.fecha.replaceAll("-", "")}T${String(Math.floor(min / 60)).padStart(2, "0")}${String(min % 60).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${tipo.nombre} — El Gimnasio del Cerebro`,
    dates: `${aTexto(estado.hora)}/${aTexto(estado.hora + tipo.minutos)}`,
    ctz: ZONA,
    details: `${datos.programa}. Modalidad: ${estado.modalidad}.`,
    location: estado.modalidad === "presencial" ? "Rionegro, Antioquia" : "Google Meet",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const ERRORES = {
  HORA_OCUPADA: "Esa hora se acaba de ocupar. Elige otra.",
  OTRA_MODALIDAD: "Esa hora ya tiene un grupo de la otra modalidad. Elige otra hora.",
  SIN_CUPO: "Ese grupo se acaba de llenar. Elige otra hora.",
  YA_RESERVADO: "Ya tienes una reserva en esa hora con este correo.",
  HORA_PASADA: "Esa hora ya pasó. Elige otra.",
  FUERA_DE_HORARIO: "Esa hora está fuera del horario de atención.",
  PERSONAS_INVALIDAS: "Revisa el número de personas (de 1 a 5).",
  AUTORIZACION_REQUERIDA: "Para reservar debes autorizar el tratamiento de tus datos.",
};
const ERRORES_DE_AGENDA = ["HORA_OCUPADA", "OTRA_MODALIDAD", "SIN_CUPO", "HORA_PASADA", "FUERA_DE_HORARIO"];

async function guardarReserva(datos) {
  if (!CONECTADO) return { ok: true, calendario: false, prototipo: true };
  return llamar("/functions/v1/reservar", {
    tipo: estado.tipo,
    modalidad: estado.modalidad,
    fecha: estado.fecha,
    inicio: estado.hora,
    nombre: datos.nombre,
    telefono: datos.telefono,
    correo: datos.correo,
    programa: datos.programa,
    personas: estado.tipo === "prueba" ? Number(datos.personas) : 1,
    acepta_whatsapp: datos.whatsapp === "on",
    politica_version: datos.autoriza_datos === "on" ? POLITICA_VERSION : "",
    sitio_web: datos.sitio_web,
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.textContent = "";
  if (!estado.tipo || !estado.modalidad || !estado.fecha || estado.hora === null) {
    mensaje.textContent = "Te falta elegir tipo de clase, modalidad, día u hora.";
    return;
  }
  if (!form.checkValidity()) {
    mensaje.textContent = "Revisa tus datos: nombre, WhatsApp, correo, programa y la autorización de datos son obligatorios.";
    form.reportValidity();
    return;
  }
  const datos = Object.fromEntries(new FormData(form));
  btnReservar.disabled = true;
  btnReservar.textContent = "Reservando…";
  let resultado;
  try {
    resultado = await guardarReserva(datos);
  } catch (error) {
    mensaje.textContent = ERRORES[error.message] ?? "No pudimos guardar la reserva. Intenta de nuevo o escríbenos por WhatsApp.";
    if (ERRORES_DE_AGENDA.includes(error.message)) pintarHoras();
    return;
  } finally {
    btnReservar.disabled = false;
    btnReservar.textContent = "Reservar";
  }

  const virtual = estado.modalidad === "virtual";
  document.getElementById("listo-titulo").textContent = estado.tipo === "prueba" ? "¡Tu clase de prueba gratis quedó reservada!" : "¡Tu clase quedó reservada!";
  document.getElementById("listo-detalle").textContent = `${seleccion.textContent.replace(/\.$/, "")}. ${datos.nombre.trim()}, te escribiremos al WhatsApp ${datos.telefono}.`;
  const nota = document.getElementById("listo-nota");
  const meet = document.getElementById("btn-meet");
  const calendario = document.getElementById("btn-calendario");
  if (resultado.calendario) {
    nota.textContent = `Te enviamos la invitación de Google Calendar a ${datos.correo}.${virtual ? " Ahí está el enlace de Google Meet." : ""}`;
    calendario.hidden = true;
  } else {
    nota.textContent = resultado.prototipo ? "" : "Tu cupo quedó guardado. La invitación de calendario te llegará en un rato.";
    calendario.href = enlaceCalendario(datos);
  }
  if (resultado.meet) {
    meet.href = resultado.meet;
    meet.hidden = false;
  }
  form.hidden = true;
  seccionListo.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btn-otra").addEventListener("click", () => location.reload());

(async function iniciar() {
  if (CONECTADO) {
    document.querySelector(".aviso-prototipo")?.remove();
    const { fecha: hoy } = hoyEnBogota();
    try {
      await cargarFranjas(hoy, sumarDias(hoy, DIAS_A_MOSTRAR));
    } catch {
      mensaje.textContent = "No pudimos cargar el horario. Recarga la página o escríbenos por WhatsApp.";
    }
  }
  pintarDias();
  pintarHoras();
})();
