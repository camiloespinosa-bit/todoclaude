// Panel del docente — El Gimnasio del Cerebro.
// Inicio de sesión con Supabase Auth; la agenda y las cancelaciones pasan por la función
// del servidor `reservar`, que confirma que el usuario es docente.
// Los datos de los estudiantes vienen de un formulario público: se pintan siempre como
// texto (textContent), nunca como HTML.

const CONFIG = window.CONFIG_RESERVAS ?? {};
const ZONA = "America/Bogota";
const DIAS_A_MOSTRAR = 14;
const CLAVE_SESION = "panel-docente-sesion";

// ---------- Utilidades ----------
function hoyEnBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
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

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function enlaceWhatsApp(telefono) {
  const digitos = String(telefono).replace(/\D/g, "");
  return `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}`;
}

// ---------- Sesión (Supabase Auth) ----------
function leerSesion() {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { return null; }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_SESION);
  } catch { /* sin almacenamiento: la sesión dura mientras la página esté abierta */ }
  sesionActual = sesion;
}

let sesionActual = leerSesion();

async function pedirToken(tipo, cuerpo) {
  const r = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=${tipo}`, {
    method: "POST",
    headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error(datos?.error_description ?? datos?.msg ?? "No se pudo iniciar sesión");
  return { access_token: datos.access_token, refresh_token: datos.refresh_token, correo: datos.user?.email ?? "" };
}

async function renovarSesion() {
  if (!sesionActual?.refresh_token) return false;
  try {
    guardarSesion(await pedirToken("refresh_token", { refresh_token: sesionActual.refresh_token }));
    return true;
  } catch {
    return false;
  }
}

// Llama a la función del servidor con la sesión del docente. Si la sesión venció, la
// renueva una vez; si no se puede, vuelve a pedir el inicio de sesión.
async function llamarPanel(cuerpo, reintento = true) {
  const r = await fetch(`${CONFIG.supabaseUrl}/functions/v1/reservar`, {
    method: "POST",
    headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${sesionActual?.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (r.status === 401) {
    if (reintento && (await renovarSesion())) return llamarPanel(cuerpo, false);
    guardarSesion(null);
    mostrarEntrar("Tu sesión terminó o tu usuario no tiene acceso al panel. Entra de nuevo.");
    throw new Error("NO_AUTORIZADO");
  }
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error(datos?.error ?? `HTTP_${r.status}`);
  return datos;
}

// ---------- Pantallas ----------
const seccionEntrar = document.getElementById("entrar");
const seccionAgenda = document.getElementById("agenda");
const btnSalir = document.getElementById("btn-salir");
const mensajeEntrar = document.getElementById("mensaje-entrar");
const mensajePanel = document.getElementById("mensaje-panel");
const contDias = document.getElementById("dias-panel");
const contSesiones = document.getElementById("sesiones");
const tituloDia = document.getElementById("titulo-dia");
const resumen = document.getElementById("resumen");
const irAFecha = document.getElementById("ir-a-fecha");

let desde = hoyEnBogota();
let fechaElegida = desde;
let sesiones = [];

function mostrarEntrar(mensaje = "") {
  seccionAgenda.hidden = true;
  btnSalir.hidden = true;
  seccionEntrar.hidden = false;
  mensajeEntrar.textContent = mensaje;
}

function mostrarAgenda() {
  seccionEntrar.hidden = true;
  seccionAgenda.hidden = false;
  btnSalir.hidden = false;
  cargarAgenda();
}

document.getElementById("form-entrar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  mensajeEntrar.textContent = "Entrando…";
  try {
    guardarSesion(await pedirToken("password", { email: datos.correo, password: datos.clave }));
    e.target.reset();
    mensajeEntrar.textContent = "";
    mostrarAgenda();
  } catch {
    mensajeEntrar.textContent = "Correo o contraseña incorrectos.";
  }
});

btnSalir.addEventListener("click", () => {
  guardarSesion(null);
  mostrarEntrar();
});

irAFecha.addEventListener("change", () => {
  if (!irAFecha.value) return;
  desde = irAFecha.value;
  fechaElegida = irAFecha.value;
  cargarAgenda();
});

// ---------- Agenda ----------
async function cargarAgenda() {
  mensajePanel.textContent = "Cargando…";
  try {
    const r = await llamarPanel({ accion: "agenda", desde, hasta: sumarDias(desde, DIAS_A_MOSTRAR - 1) });
    sesiones = r.sesiones ?? [];
    mensajePanel.textContent = "";
    pintarDias();
    pintarDia();
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") mensajePanel.textContent = "No pudimos cargar la agenda. Revisa tu conexión e intenta de nuevo.";
  }
}

function personasDelDia(fecha) {
  return sesiones.filter((s) => s.fecha === fecha).reduce((n, s) => n + s.ocupados, 0);
}

function pintarDias() {
  contDias.replaceChildren();
  const hoy = hoyEnBogota();
  for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
    const fecha = sumarDias(desde, i);
    const btn = crear("button", "dia");
    btn.type = "button";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(fecha === fechaElegida));
    btn.append(
      crear("span", "dia-semana", fecha === hoy ? "Hoy" : formatear(fecha, { weekday: "short" })),
      crear("span", "dia-num", formatear(fecha, { day: "numeric" })),
      crear("span", "dia-mes", formatear(fecha, { month: "short" })),
    );
    const total = personasDelDia(fecha);
    if (total) btn.append(crear("span", "dia-total", String(total)));
    btn.setAttribute("aria-label", `${formatear(fecha, { weekday: "long", day: "numeric", month: "long" })}: ${total} personas`);
    btn.addEventListener("click", () => {
      fechaElegida = fecha;
      pintarDias();
      pintarDia();
    });
    contDias.append(btn);
  }
}

function etiquetaSesion(s) {
  if (s.clase === "prueba") return `Prueba ${s.modalidad}`;
  return `Grupo ${s.modalidad}`;
}

function pintarDia() {
  const delDia = sesiones.filter((s) => s.fecha === fechaElegida);
  tituloDia.textContent = formatear(fechaElegida, { weekday: "long", day: "numeric", month: "long" });
  const personas = delDia.reduce((n, s) => n + s.ocupados, 0);
  resumen.textContent = delDia.length
    ? `${delDia.length} ${delDia.length === 1 ? "clase" : "clases"} · ${personas} ${personas === 1 ? "persona" : "personas"}`
    : "";
  contSesiones.replaceChildren();
  if (!delDia.length) {
    contSesiones.append(crear("p", "horas__vacio", "No hay reservas este día."));
    return;
  }
  for (const s of delDia) contSesiones.append(tarjetaSesion(s));
}

function tarjetaSesion(s) {
  const minutos = s.clase === "grupo" ? 60 : 30;
  const tarjeta = crear("article", `paso panel-sesion panel-sesion--${s.clase === "prueba" ? "prueba" : s.modalidad}`);

  const cabeza = crear("div", "panel-sesion__cabeza");
  cabeza.append(crear("h3", "", `${textoHora(s.inicio)} – ${textoHora(s.inicio + minutos)}`));
  cabeza.append(crear("span", "etiqueta-sesion", etiquetaSesion(s)));
  cabeza.append(crear("span", "panel-sesion__cupo", s.clase === "grupo" ? `${s.ocupados}/5 estudiantes` : `${s.ocupados} ${s.ocupados === 1 ? "persona" : "personas"}`));
  tarjeta.append(cabeza);

  const acciones = crear("div", "panel-sesion__acciones");
  if (s.enlace_meet) {
    const meet = crear("a", "boton boton--primario boton--chico", "Abrir Meet");
    meet.href = s.enlace_meet;
    meet.target = "_blank";
    meet.rel = "noopener";
    acciones.append(meet);
  }
  if (!s.en_calendario) {
    acciones.append(crear("span", "panel-alerta", "No está en tu Google Calendar"));
    const reenviar = crear("button", "boton boton--fantasma boton--chico", "Reenviar al calendario");
    reenviar.type = "button";
    reenviar.addEventListener("click", () => ejecutar(reenviar, { accion: "sincronizar", sesion: s.id }, "Enviada a tu Google Calendar."));
    acciones.append(reenviar);
  }
  if (acciones.childElementCount) tarjeta.append(acciones);

  const lista = crear("ul", "panel-asistentes");
  for (const a of s.asistentes ?? []) lista.append(filaAsistente(s, a));
  tarjeta.append(lista);
  return tarjeta;
}

function filaAsistente(s, a) {
  const fila = crear("li", "panel-asistente");
  const datos = crear("div", "panel-asistente__datos");
  const nombre = crear("strong", "", a.nombre);
  datos.append(nombre);
  if (a.tipo === "bloque") datos.append(crear("span", "etiqueta-sesion etiqueta-sesion--bloque", "Bloque 2 h"));
  const detalle = [a.programa, s.clase === "prueba" ? `${a.personas} ${a.personas === 1 ? "persona" : "personas"}` : null, a.acepta_whatsapp ? null : "No aceptó WhatsApp"]
    .filter(Boolean).join(" · ");
  if (detalle) datos.append(crear("span", "panel-asistente__detalle", detalle));
  fila.append(datos);

  const contacto = crear("div", "panel-asistente__contacto");
  const wa = crear("a", "", "WhatsApp");
  wa.href = enlaceWhatsApp(a.telefono);
  wa.target = "_blank";
  wa.rel = "noopener";
  const correo = crear("a", "", a.correo);
  correo.href = `mailto:${a.correo}`;
  const cancelar = crear("button", "panel-cancelar", "Cancelar");
  cancelar.type = "button";
  cancelar.addEventListener("click", () => {
    const aviso = a.tipo === "bloque"
      ? `¿Cancelar el bloque de 2 horas de ${a.nombre}? Se cancelan las dos horas y Google le avisará por correo.`
      : `¿Cancelar la reserva de ${a.nombre}? Google le avisará por correo.`;
    if (confirm(aviso)) ejecutar(cancelar, { accion: "cancelar", reserva: a.id }, "Reserva cancelada.");
  });
  contacto.append(wa, correo, cancelar);
  fila.append(contacto);
  return fila;
}

const MENSAJES_ERROR = {
  RESERVA_YA_CANCELADA: "Esa reserva ya estaba cancelada.",
  RESERVA_NO_EXISTE: "No encontramos esa reserva.",
};

async function ejecutar(boton, cuerpo, exito) {
  boton.disabled = true;
  mensajePanel.textContent = "Un momento…";
  try {
    const r = await llamarPanel(cuerpo);
    const texto = r.calendario === false
      ? `${exito} Pero Google Calendar no respondió: revisa los Logs de la función o usa "Reenviar al calendario".`
      : exito;
    await cargarAgenda();
    mensajePanel.textContent = texto;
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") mensajePanel.textContent = MENSAJES_ERROR[error.message] ?? "No se pudo completar. Intenta de nuevo.";
    boton.disabled = false;
  }
}

// Al volver a la pestaña, la agenda se actualiza sola.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !seccionAgenda.hidden) cargarAgenda();
});

if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) mostrarEntrar("Falta configurar la conexión en config.js.");
else if (sesionActual?.access_token) mostrarAgenda();
else mostrarEntrar();
