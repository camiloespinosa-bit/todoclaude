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

function enlaceWhatsApp(telefono, texto) {
  const digitos = String(telefono).replace(/\D/g, "");
  const enlace = `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}`;
  return texto ? `${enlace}?text=${encodeURIComponent(texto)}` : enlace;
}

function minutosAhoraEnBogota() {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const valor = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return valor("hour") * 60 + valor("minute");
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
let cerrados = new Map(); // fecha -> motivo, en los días que muestra la agenda
const contPendientes = document.getElementById("avisos-pendientes");

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
  refrescar();
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
    cerrados = new Map((r.cerrados ?? []).map((c) => [c.fecha, c.motivo]));
    mensajePanel.textContent = "";
    pintarDias();
    pintarDia();
    pintarPendientes();
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
    if (cerrados.has(fecha)) {
      btn.classList.add("dia--cerrado");
      btn.append(crear("span", "dia-cerrado", "Cerrado"));
    }
    btn.setAttribute("aria-label", `${formatear(fecha, { weekday: "long", day: "numeric", month: "long" })}: ${cerrados.has(fecha) ? "cerrado" : `${total} personas`}`);
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
  if (cerrados.has(fechaElegida)) contSesiones.append(avisoCerrado(fechaElegida));
  if (!delDia.length) {
    if (!cerrados.has(fechaElegida)) contSesiones.append(crear("p", "horas__vacio", "No hay reservas este día."));
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
  const aviso = botonAviso(s, a);
  if (aviso) fila.append(aviso);
  return fila;
}

// ---------- Confirmaciones y recordatorios por WhatsApp ----------
// Se envían desde el WhatsApp del docente: el botón abre el chat con el mensaje ya escrito
// y el panel registra a quién se le envió. Clases de hoy y mañana: recordatorio.
// Clases de pasado mañana en adelante: confirmación.

const NOMBRE_CLASE = { prueba: "tu clase de prueba", clase: "tu clase", bloque: "tu bloque de 2 horas" };

function fechaLarga(fecha) {
  // Sin la coma que agrega Intl ("miércoles, 4 de noviembre").
  return formatear(fecha, { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
}

function lugar(modalidad, meet) {
  if (modalidad === "presencial") return "en nuestra sede de Rionegro";
  return meet ? `por Google Meet: ${meet}` : "por Google Meet (el enlace está en la invitación de tu calendario)";
}

// Un bloque de 2 horas aparece en dos grupos: el aviso va en la primera hora.
function primeraHora(s, a) {
  if (!a.bloque_id) return s;
  return sesiones
    .filter((o) => o.fecha === s.fecha && (o.asistentes ?? []).some((x) => x.bloque_id === a.bloque_id))
    .reduce((primera, o) => (o.inicio < primera.inicio ? o : primera), s);
}

// Qué aviso le toca a esta persona, o null si ninguno.
function avisoDe(s, a) {
  if (!a.acepta_whatsapp || primeraHora(s, a) !== s) return null;
  const hoy = hoyEnBogota();
  if (s.fecha < hoy || (s.fecha === hoy && s.inicio <= minutosAhoraEnBogota())) return null;
  const tipo = s.fecha <= sumarDias(hoy, 1) ? "recordatorio" : "confirmacion";
  const enviado = tipo === "recordatorio" ? a.whatsapp_recordatorio_en : a.whatsapp_confirmacion_en;
  return { tipo, enviado, hoy: s.fecha === hoy };
}

function textoAviso(s, a, aviso) {
  const nombre = String(a.nombre).trim().split(/\s+/)[0];
  const clase = NOMBRE_CLASE[a.tipo];
  const hora = textoHora(s.inicio);
  const donde = lugar(s.modalidad, s.enlace_meet);
  if (aviso.tipo === "confirmacion") {
    return `Hola ${nombre}, confirmamos ${clase} en El Gimnasio del Cerebro el ${fechaLarga(s.fecha)} a las ${hora}, ${donde}. Si necesitas cambiar la reserva, respóndenos por aquí.`;
  }
  if (aviso.hoy) {
    return `Hola ${nombre}, te recordamos que hoy tienes ${clase} en El Gimnasio del Cerebro a las ${hora}, ${donde}. ¡Te esperamos!`;
  }
  return `Hola ${nombre}, te recordamos que mañana tienes ${clase} en El Gimnasio del Cerebro a las ${hora}, ${donde}. Si no puedes asistir, avísanos por aquí.`;
}

function horaCorta(marca) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(marca));
}

function botonAviso(s, a) {
  const aviso = avisoDe(s, a);
  if (!aviso) return null;
  const caja = crear("div", "panel-aviso");
  const enlace = crear("a", aviso.enviado ? "panel-aviso__otra" : "boton boton--whatsapp boton--chico");
  enlace.href = enlaceWhatsApp(a.telefono, textoAviso(s, a, aviso));
  enlace.target = "_blank";
  enlace.rel = "noopener";
  if (aviso.enviado) {
    caja.append(crear("span", "panel-aviso__hecho", `✓ ${aviso.tipo === "recordatorio" ? "Recordado" : "Confirmado"} (${horaCorta(aviso.enviado)})`));
    enlace.textContent = "Enviar otra vez";
  } else {
    enlace.textContent = aviso.tipo === "recordatorio" ? "Recordar por WhatsApp" : "Confirmar por WhatsApp";
    // El enlace abre WhatsApp por sí solo; aquí solo se registra el envío.
    enlace.addEventListener("click", () => marcarAviso(a, aviso.tipo));
  }
  caja.append(enlace);
  return caja;
}

async function marcarAviso(a, tipo) {
  const ahora = new Date().toISOString();
  const campo = tipo === "recordatorio" ? "whatsapp_recordatorio_en" : "whatsapp_confirmacion_en";
  const clave = a.bloque_id ?? a.id;
  for (const s of sesiones) {
    for (const x of s.asistentes ?? []) if ((x.bloque_id ?? x.id) === clave) x[campo] = ahora;
  }
  pintarDia();
  pintarPendientes();
  try {
    await llamarPanel({ accion: "aviso", reserva: a.id, tipo });
  } catch (error) {
    if (error.message === "NO_AUTORIZADO") return;
    for (const s of sesiones) {
      for (const x of s.asistentes ?? []) if ((x.bloque_id ?? x.id) === clave) x[campo] = null;
    }
    pintarDia();
    pintarPendientes();
    mensajePanel.textContent = "WhatsApp se abrió, pero no pudimos guardar que ya enviaste el mensaje. Revisa tu conexión.";
  }
}

// Resumen arriba de la agenda: cuántos avisos faltan y en qué días.
function pintarPendientes() {
  const porDia = new Map();
  for (const s of sesiones) {
    for (const a of s.asistentes ?? []) {
      const aviso = avisoDe(s, a);
      if (!aviso || aviso.enviado) continue;
      const actual = porDia.get(s.fecha) ?? { tipo: aviso.tipo, n: 0 };
      actual.n++;
      porDia.set(s.fecha, actual);
    }
  }
  contPendientes.replaceChildren();
  contPendientes.hidden = porDia.size === 0;
  if (!porDia.size) return;
  contPendientes.append(crear("span", "panel-pendientes__titulo", "WhatsApp pendientes:"));
  const hoy = hoyEnBogota();
  for (const [fecha, { tipo, n }] of [...porDia].sort(([x], [y]) => x.localeCompare(y))) {
    const dia = fecha === hoy ? "Hoy" : fecha === sumarDias(hoy, 1) ? "Mañana" : formatear(fecha, { weekday: "short", day: "numeric" });
    const que = tipo === "recordatorio" ? (n === 1 ? "recordatorio" : "recordatorios") : (n === 1 ? "confirmación" : "confirmaciones");
    const chip = crear("button", "panel-pendiente", `${dia}: ${n} ${que}`);
    chip.type = "button";
    chip.addEventListener("click", () => {
      fechaElegida = fecha;
      pintarDias();
      pintarDia();
      tituloDia.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    contPendientes.append(chip);
  }
}

const MENSAJES_ERROR = {
  RESERVA_YA_CANCELADA: "Esa reserva ya estaba cancelada.",
  RESERVA_NO_EXISTE: "No encontramos esa reserva.",
  RANGO_INVALIDO: "Revisa las fechas: la final no puede ser antes de la inicial, y el rango es de máximo 2 meses.",
  MOTIVO_INVALIDO: "Escribe un motivo (entre 2 y 100 letras).",
  FECHA_PASADA: "No se pueden cerrar días que ya pasaron.",
  SIN_DIAS_DE_ATENCION: "En esas fechas no hay días de atención (por ejemplo, solo domingos).",
  DIA_NO_CERRADO: "Ese día ya estaba abierto.",
};

async function ejecutar(boton, cuerpo, exito) {
  boton.disabled = true;
  mensajePanel.textContent = "Un momento…";
  try {
    const r = await llamarPanel(cuerpo);
    const texto = r.calendario === false
      ? `${exito} Pero Google Calendar no respondió: revisa los Logs de la función o usa "Reenviar al calendario".`
      : exito;
    await refrescar();
    mensajePanel.textContent = texto;
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") mensajePanel.textContent = MENSAJES_ERROR[error.message] ?? "No se pudo completar. Intenta de nuevo.";
    boton.disabled = false;
  }
}

// ---------- Días cerrados ----------
const formCerrar = document.getElementById("form-cerrar");
const listaCerrados = document.getElementById("lista-cerrados");
const mensajeCerrar = document.getElementById("mensaje-cerrar");

function avisoCerrado(fecha) {
  const aviso = crear("div", "panel-aviso-cerrado");
  aviso.append(crear("strong", "", "Día cerrado: "), crear("span", "", cerrados.get(fecha)));
  const abrir = crear("button", "boton boton--fantasma boton--chico", "Abrir este día");
  abrir.type = "button";
  abrir.addEventListener("click", () => ejecutar(abrir, { accion: "abrir", fecha }, "Día abierto otra vez."));
  aviso.append(abrir);
  return aviso;
}

async function cargarCerrados() {
  const hoy = hoyEnBogota();
  try {
    const r = await llamarPanel({ accion: "cerrados", desde: hoy, hasta: sumarDias(hoy, 400) });
    listaCerrados.replaceChildren();
    if (!r.cerrados?.length) {
      listaCerrados.append(crear("li", "horas__vacio", "No hay días cerrados."));
      return;
    }
    for (const c of r.cerrados) {
      const fila = crear("li", "panel-cerrado");
      const texto = crear("div", "");
      texto.append(crear("strong", "", formatear(c.fecha, { weekday: "short", day: "numeric", month: "short", year: "numeric" })), crear("span", "", ` · ${c.motivo}`));
      const abrir = crear("button", "panel-cancelar", "Abrir");
      abrir.type = "button";
      abrir.addEventListener("click", () => ejecutar(abrir, { accion: "abrir", fecha: c.fecha }, "Día abierto otra vez."));
      fila.append(texto, abrir);
      listaCerrados.append(fila);
    }
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") listaCerrados.replaceChildren(crear("li", "horas__vacio", "No pudimos cargar los días cerrados."));
  }
}

async function refrescar() {
  await Promise.all([cargarAgenda(), cargarCerrados()]);
}

formCerrar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formCerrar));
  const cuerpo = { accion: "cerrar", desde: datos.desde, hasta: datos.hasta || datos.desde, motivo: datos.motivo.trim() };
  const boton = formCerrar.querySelector("button");
  boton.disabled = true;
  mensajeCerrar.textContent = "Un momento…";
  try {
    let r = await llamarPanel(cuerpo);
    if (!r.cerrado && r.reservas_activas) {
      const n = r.reservas_activas;
      const seguir = confirm(`En esas fechas hay ${n} ${n === 1 ? "reserva" : "reservas"}. ¿Cerrar los días y cancelar${n === 1 ? "la" : "las"}? Google les avisará por correo.`);
      if (!seguir) {
        mensajeCerrar.textContent = "No se cerró ningún día.";
        return;
      }
      r = await llamarPanel({ ...cuerpo, cancelar: true });
    }
    let texto = `${r.dias === 1 ? "Se cerró 1 día" : `Se cerraron ${r.dias} días`}.`;
    if (r.canceladas) texto += ` ${r.canceladas === 1 ? "Se canceló 1 reserva" : `Se cancelaron ${r.canceladas} reservas`}.`;
    if (r.calendario === false) texto += ' Pero Google Calendar no respondió: revisa los Logs de la función.';
    formCerrar.reset();
    await refrescar();
    mensajeCerrar.textContent = texto;
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") mensajeCerrar.textContent = MENSAJES_ERROR[error.message] ?? "No se pudo completar. Intenta de nuevo.";
  } finally {
    boton.disabled = false;
  }
});

// Al volver a la pestaña, la agenda se actualiza sola.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !seccionAgenda.hidden) refrescar();
});

if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) mostrarEntrar("Falta configurar la conexión en config.js.");
else if (sesionActual?.access_token) mostrarAgenda();
else mostrarEntrar();
