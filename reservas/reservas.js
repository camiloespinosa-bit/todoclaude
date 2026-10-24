// Reservas — El Gimnasio del Cerebro (prototipo sin backend).
// Los horarios y los cupos ocupados son de ejemplo. Cuando se conecte la base de datos,
// `cuposOcupados` se reemplaza por la consulta real y `reservar` por la función que guarda.

// ---------- Configuración (ajustar con el horario real) ----------
const TIPOS = {
  prueba: { nombre: "Clase de prueba", minutos: 30 },
  clase: { nombre: "Clase", minutos: 60 },
  bloque: { nombre: "Bloque", minutos: 120 },
};

// Franjas de atención por día de la semana (0 = domingo). Minutos desde medianoche.
// Lunes 8–1; martes y jueves 8–12 y 1–4; miércoles 8–12 y 1–7; viernes 8–12; sábado 8–12 y 1–5.
const HORARIO = {
  1: [[480, 780]],
  2: [[480, 720], [780, 960]],
  3: [[480, 720], [780, 1140]],
  4: [[480, 720], [780, 960]],
  5: [[480, 720]],
  6: [[480, 720], [780, 1020]],
};

const CUPO_MAXIMO = 5; // estudiantes al mismo tiempo
const PASO_MINUTOS = 30; // cada cuánto puede empezar una clase
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

// ---------- Disponibilidad de ejemplo ----------
// Cuántos estudiantes hay ya en cada tramo de 30 min. De ejemplo: fijo para la misma fecha.
function cuposOcupados(fecha) {
  const ocupados = new Map();
  let semilla = [...fecha].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  for (let m = 480; m < 1200; m += PASO_MINUTOS) {
    semilla = (semilla * 1103515245 + 12345) >>> 0;
    ocupados.set(m, semilla % 7 === 0 ? CUPO_MAXIMO : (semilla >>> 8) % 4);
  }
  return ocupados;
}

// Devuelve las horas de inicio donde cabe la clase completa, con los cupos que quedan.
function horasDisponibles(fecha, minutosClase) {
  const franjas = HORARIO[diaSemana(fecha)] ?? [];
  const ocupados = cuposOcupados(fecha);
  const ahora = hoyEnBogota();
  const libres = [];
  for (const [inicio, fin] of franjas) {
    for (let m = inicio; m + minutosClase <= fin; m += PASO_MINUTOS) {
      if (fecha === ahora.fecha && m <= ahora.minutos) continue;
      let quedan = CUPO_MAXIMO;
      for (let t = m; t < m + minutosClase; t += PASO_MINUTOS) quedan = Math.min(quedan, CUPO_MAXIMO - (ocupados.get(t) ?? 0));
      if (quedan > 0) libres.push({ minutos: m, quedan });
    }
  }
  return libres;
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
    if (grupo.dataset.grupo === "tipo") pintarHoras();
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
    btn.disabled = !HORARIO[diaSemana(fecha)];
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

function pintarHoras() {
  estado.hora = null;
  contHoras.replaceChildren();
  if (!estado.fecha || !estado.tipo) {
    contHoras.innerHTML = `<p class="horas__vacio">${!estado.tipo ? "Primero elige el tipo de clase." : "Elige un día para ver las horas libres."}</p>`;
    return;
  }
  const libres = horasDisponibles(estado.fecha, TIPOS[estado.tipo].minutos);
  if (!libres.length) {
    contHoras.innerHTML = `<p class="horas__vacio">No quedan horas libres ese día para esta duración. Prueba otro día.</p>`;
    return;
  }
  for (const { minutos: m, quedan } of libres) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hora";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.innerHTML = `${textoHora(m)}<small>${quedan === 1 ? "Queda 1 cupo" : `Quedan ${quedan} cupos`}</small>`;
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  mensaje.textContent = "";
  if (!estado.tipo || !estado.modalidad || !estado.fecha || estado.hora === null) {
    mensaje.textContent = "Te falta elegir tipo de clase, modalidad, día u hora.";
    return;
  }
  if (!form.checkValidity()) {
    mensaje.textContent = "Revisa tus datos: nombre, WhatsApp, correo y programa son obligatorios.";
    form.reportValidity();
    return;
  }
  const datos = Object.fromEntries(new FormData(form));
  document.getElementById("listo-detalle").textContent = `${seleccion.textContent.replace(/\.$/, "")}. ${datos.nombre.trim()}, te escribiremos al WhatsApp ${datos.telefono}.`;
  document.getElementById("btn-calendario").href = enlaceCalendario(datos);
  form.hidden = true;
  seccionListo.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btn-otra").addEventListener("click", () => location.reload());

pintarDias();
pintarHoras();
