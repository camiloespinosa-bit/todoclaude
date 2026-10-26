// Reservas — El Gimnasio del Cerebro (prototipo sin backend).
// Los horarios y los cupos ocupados son de ejemplo. Cuando se conecte la base de datos,
// `agendaDelDia` se reemplaza por la consulta real y `reservar` por la función que guarda.

// ---------- Configuración (ajustar con el horario real) ----------
const TIPOS = {
  prueba: { nombre: "Clase de prueba gratis", minutos: 30 },
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
function horasDisponibles(fecha, tipo, modalidad) {
  const franjas = HORARIO[diaSemana(fecha)] ?? [];
  const { grupos, pruebas } = agendaDelDia(fecha);
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
  const falta = !estado.tipo || !estado.modalidad ? "Primero elige el tipo de clase y la modalidad."
    : !estado.fecha ? "Elige un día para ver las horas libres." : null;
  if (falta) {
    contHoras.innerHTML = `<p class="horas__vacio">${falta}</p>`;
    return;
  }
  const opciones = horasDisponibles(estado.fecha, estado.tipo, estado.modalidad);
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
  document.getElementById("listo-titulo").textContent = estado.tipo === "prueba" ? "¡Tu clase de prueba gratis quedó reservada!" : "¡Tu clase quedó reservada!";
  document.getElementById("listo-detalle").textContent = `${seleccion.textContent.replace(/\.$/, "")}. ${datos.nombre.trim()}, te escribiremos al WhatsApp ${datos.telefono}.`;
  document.getElementById("btn-calendario").href = enlaceCalendario(datos);
  form.hidden = true;
  seccionListo.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btn-otra").addEventListener("click", () => location.reload());

pintarDias();
pintarHoras();
