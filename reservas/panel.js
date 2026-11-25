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
let bloqueos = []; // horas bloqueadas en los días que muestra la agenda
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
    bloqueos = r.bloqueos ?? [];
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
    } else if (bloqueos.some((b) => b.fecha === fecha)) {
      btn.classList.add("dia--bloqueo");
      btn.append(crear("span", "dia-cerrado", "Bloqueo"));
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
  for (const b of bloqueos.filter((x) => x.fecha === fechaElegida)) contSesiones.append(avisoBloqueo(b));
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
  if (enSerie(a)) datos.append(crear("span", "etiqueta-sesion etiqueta-sesion--bloque", `Serie de ${a.serie.length}`));
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
  const mover = crear("button", "panel-mover-btn", "Mover");
  mover.type = "button";
  mover.addEventListener("click", () => {
    const abierto = fila.querySelector(".panel-mover");
    if (abierto) abierto.remove();
    else fila.append(formMover(s, a));
  });
  contacto.append(wa, correo, mover, cancelar);
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
  const manana = sumarDias(hoy, 1);
  const tipo = s.fecha <= manana ? "recordatorio" : "confirmacion";
  // Una serie (varias clases reservadas juntas) se confirma con un solo mensaje, en su
  // primera clase de pasado mañana en adelante.
  if (tipo === "confirmacion" && enSerie(a)) {
    const primera = a.serie.find((c) => c.fecha > manana);
    if (!primera || primera.fecha !== s.fecha || primera.inicio !== s.inicio) return null;
  }
  const enviado = tipo === "recordatorio" ? a.whatsapp_recordatorio_en : a.whatsapp_confirmacion_en;
  return { tipo, enviado, hoy: s.fecha === hoy };
}

const enSerie = (a) => (a.serie?.length ?? 0) > 1;

function textoAviso(s, a, aviso) {
  const nombre = String(a.nombre).trim().split(/\s+/)[0];
  if (aviso.tipo === "confirmacion" && enSerie(a)) {
    const hoy = hoyEnBogota();
    const fechas = a.serie.filter((c) => c.fecha >= hoy).map((c) => `${fechaLarga(c.fecha)} a las ${textoHora(c.inicio)}`);
    const donde = s.modalidad === "presencial" ? "en nuestra sede de Rionegro" : "por Google Meet (cada invitación de tu calendario tiene su enlace)";
    const clases = a.tipo === "bloque" ? "tus bloques de 2 horas" : "tus clases";
    return `Hola ${nombre}, confirmamos ${clases} en El Gimnasio del Cerebro, ${donde}:\n${fechas.map((f) => `- ${f}`).join("\n")}\nSi necesitas cambiar alguna, respóndenos por aquí.`;
  }
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
  const mismo = (x) => (x.bloque_id ?? x.id) === clave || (tipo === "confirmacion" && a.serie_id && x.serie_id === a.serie_id);
  for (const s of sesiones) {
    for (const x of s.asistentes ?? []) if (mismo(x)) x[campo] = ahora;
  }
  pintarDia();
  pintarPendientes();
  try {
    await llamarPanel({ accion: "aviso", reserva: a.id, tipo });
  } catch (error) {
    if (error.message === "NO_AUTORIZADO") return;
    for (const s of sesiones) {
      for (const x of s.asistentes ?? []) if (mismo(x)) x[campo] = null;
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

// ---------- Mover la reserva de un estudiante ----------
// Muestra las horas libres del día elegido con las mismas reglas de la página de reservas
// (horasDisponibles en reservas.js); el servidor las vuelve a revisar al mover.

async function llamarPublico(funcion, cuerpo) {
  const r = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`HTTP_${r.status}`);
  return r.json();
}

function faseDe(programa) {
  const fases = [
    ["Fase 0 a 2 años", "f0_2"], ["Fase 3 a 5 años", "f3_5"], ["Fase 6 a 10 años", "f6_10"],
    ["Fase 11 a 15 años", "f11_15"], ["Fase Experta", "experta"], ["Adulto Vital", "vital"],
    ["Programa infantil", "infantil"],
  ];
  return fases.find(([inicio]) => String(programa ?? "").startsWith(inicio))?.[1] ?? null;
}

const MINUTOS_TIPO = { prueba: 30, clase: 60, bloque: 120 };

async function horasParaMover(fecha, tipo, modalidad, fase) {
  const [franjas, ocupadas] = await Promise.all([
    llamarPublico("dias_abiertos", { p_desde: fecha, p_hasta: fecha }),
    llamarPublico("agenda_publica", { p_fecha: fecha }),
  ]);
  const grupos = new Map(ocupadas.filter((f) => f.clase === "grupo").map((f) => [f.inicio, f]));
  const pruebas = new Set(ocupadas.filter((f) => f.clase === "prueba").map((f) => f.inicio));
  const minutos = MINUTOS_TIPO[tipo];
  const paso = tipo === "prueba" ? 30 : 60;
  const ahora = fecha === hoyEnBogota() ? minutosAhoraEnBogota() : -1;
  const opciones = [];
  for (const { inicio, fin } of franjas) {
    for (let m = Math.ceil(inicio / paso) * paso; m + minutos <= fin; m += paso) {
      if (m <= ahora) continue;
      // Como en la página: presencial, con 24 horas de anticipación (la base de datos también lo revisa).
      const manana = sumarDias(hoyEnBogota(), 1);
      if (modalidad === "presencial" && (fecha < manana || (fecha === manana && m < minutosAhoraEnBogota()))) {
        opciones.push({ minutos: m, disponible: false, detalle: "menos de 24 h" });
        continue;
      }
      if (tipo === "prueba") {
        const libre = !grupos.has(m - (m % 60)) && !pruebas.has(m);
        opciones.push({ minutos: m, disponible: libre, detalle: libre ? "libre" : "ocupada" });
        continue;
      }
      let detalle = null;
      let hayGrupo = false;
      for (let h = m; h < m + minutos; h += 60) {
        if (pruebas.has(h) || pruebas.has(h + 30)) { detalle = "clase de prueba"; break; }
        const g = grupos.get(h);
        if (!g) continue;
        hayGrupo = true;
        if (g.modalidad !== modalidad) { detalle = `grupo ${g.modalidad}`; break; }
        if (g.fase !== fase) { detalle = "grupo de otra fase"; break; }
        if (g.ocupados >= 5) { detalle = "lleno"; break; }
      }
      opciones.push({ minutos: m, disponible: !detalle, detalle: detalle ?? (hayGrupo ? "se une al grupo" : "grupo nuevo") });
    }
  }
  return opciones;
}

function formMover(s, a) {
  const desdeSesion = primeraHora(s, a);
  const caja = crear("div", "panel-mover");
  caja.append(crear("p", "panel-mover__titulo", `Mover ${a.tipo === "bloque" ? "el bloque" : "la clase"} de ${a.nombre} (${fechaLarga(desdeSesion.fecha)}, ${textoHora(desdeSesion.inicio)}) a:`));

  const campos = crear("div", "panel-mover__campos");
  const etFecha = crear("label", "", "Fecha");
  const fecha = document.createElement("input");
  fecha.type = "date";
  fecha.min = hoyEnBogota();
  etFecha.append(fecha);
  const etHora = crear("label", "", "Hora");
  const hora = document.createElement("select");
  hora.disabled = true;
  hora.add(new Option("Elige la fecha", ""));
  etHora.append(hora);
  campos.append(etFecha, etHora);
  caja.append(campos);

  // Clases siguientes de la serie que son el mismo día de la semana y a la misma hora.
  const diaSemana = (f) => new Date(`${f}T12:00:00Z`).getUTCDay();
  const siguientes = (a.serie ?? []).filter((c) => c.fecha > desdeSesion.fecha
    && diaSemana(c.fecha) === diaSemana(desdeSesion.fecha) && c.inicio === desdeSesion.inicio).length;
  let alcance = null;
  if (siguientes) {
    alcance = crear("div", "panel-mover__alcance");
    alcance.append(crear("p", "", "Tiene clases fijas. ¿Qué quieres mover?"));
    for (const [valor, texto] of [["una", "Solo esta clase"], ["siguientes", siguientes === 1 ? "Esta y la siguiente del mismo día y hora" : `Esta y las ${siguientes} siguientes del mismo día y hora`]]) {
      const et = crear("label", "");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `alcance-${a.id}`;
      radio.value = valor;
      radio.checked = valor === "una";
      et.append(radio, ` ${texto}`);
      alcance.append(et);
    }
    caja.append(alcance);
  }

  const mensaje = crear("p", "panel-mensaje");
  const botones = crear("div", "panel-mover__botones");
  const confirmar = crear("button", "boton boton--primario boton--chico", "Mover");
  confirmar.type = "button";
  const cerrar = crear("button", "boton boton--fantasma boton--chico", "Cerrar");
  cerrar.type = "button";
  cerrar.addEventListener("click", () => caja.remove());
  botones.append(confirmar, cerrar);
  caja.append(botones, mensaje);

  let consultaHoras = 0; // si cambian la fecha rápido, solo cuenta la última respuesta
  fecha.addEventListener("change", async () => {
    const mia = ++consultaHoras;
    hora.replaceChildren(new Option("Buscando horas…", ""));
    hora.disabled = true;
    if (!fecha.value) return;
    try {
      const opciones = await horasParaMover(fecha.value, a.tipo, s.modalidad, faseDe(a.programa));
      if (mia !== consultaHoras) return;
      hora.replaceChildren(new Option(opciones.some((o) => o.disponible) ? "Elige la hora" : "No hay horas libres ese día", ""));
      for (const o of opciones) {
        const op = new Option(`${textoHora(o.minutos)} · ${o.detalle}`, String(o.minutos));
        op.disabled = !o.disponible;
        hora.add(op);
      }
      hora.disabled = false;
    } catch {
      if (mia === consultaHoras) hora.replaceChildren(new Option("No pudimos cargar las horas", ""));
    }
  });

  confirmar.addEventListener("click", async () => {
    if (!fecha.value || !hora.value) {
      mensaje.textContent = "Elige la fecha y la hora.";
      return;
    }
    const todas = alcance?.querySelector("input:checked")?.value === "siguientes";
    const destino = `${fechaLarga(fecha.value)}, ${textoHora(Number(hora.value))}`;
    const pregunta = todas
      ? `¿Mover ${siguientes + 1} clases de ${a.nombre} al mismo día de la semana y hora que el ${destino}? Google le avisará por correo.`
      : `¿Mover la clase de ${a.nombre} al ${destino}? Google le avisará por correo.`;
    if (!confirm(pregunta)) return;
    confirmar.disabled = true;
    mensaje.textContent = "Moviendo…";
    try {
      const r = await llamarPanel({ accion: "mover", reserva: a.id, fecha: fecha.value, inicio: Number(hora.value), siguientes: todas });
      await refrescar();
      mostrarMovida(s, a, r);
    } catch (error) {
      if (error.message === "NO_AUTORIZADO") return;
      mensaje.textContent = MENSAJES_ERROR[error.message] ?? "No se pudo mover. Intenta de nuevo.";
      confirmar.disabled = false;
    }
  });
  return caja;
}

// Después de mover: qué pasó y un botón para avisarle al estudiante por WhatsApp.
function mostrarMovida(s, a, r) {
  const hechas = (r.resultados ?? []).filter((x) => x.ok);
  const fallidas = (r.resultados ?? []).filter((x) => !x.ok);
  let texto = hechas.length === 1 ? "Clase movida." : `${hechas.length} clases movidas.`;
  if (fallidas.length) {
    texto += ` No se pudieron mover: ${fallidas.map((f) => `${fechaLarga(f.fecha)} ${textoHora(f.inicio)} (${(MENSAJES_ERROR[f.error] ?? "no se pudo").replace(/\.$/, "").toLowerCase()})`).join("; ")}.`;
  }
  if (r.calendario === false) texto += ' Google Calendar no respondió: revisa los Logs o usa "Reenviar al calendario".';
  mensajePanel.textContent = texto;
  if (!a.acepta_whatsapp || !hechas.length) return;

  const nombre = String(a.nombre).trim().split(/\s+/)[0];
  const donde = s.modalidad === "presencial" ? "en nuestra sede de Rionegro" : "por Google Meet (el enlace está en la invitación de tu calendario)";
  const cambios = hechas.map((x) => `${fechaLarga(x.desde.fecha)} a las ${textoHora(x.desde.inicio)} → ${fechaLarga(x.fecha)} a las ${textoHora(x.inicio)}`);
  const mensaje = cambios.length === 1
    ? `Hola ${nombre}, tu clase en El Gimnasio del Cerebro del ${cambios[0].replace(" → ", " quedó movida para el ")}, ${donde}. Si tienes alguna duda, respóndenos por aquí.`
    : `Hola ${nombre}, movimos tus clases en El Gimnasio del Cerebro, ${donde}:\n${cambios.map((c) => `- ${c}`).join("\n")}\nSi tienes alguna duda, respóndenos por aquí.`;
  const avisar = crear("a", "boton boton--whatsapp boton--chico panel-avisar-movida", `Avisar a ${nombre} por WhatsApp`);
  avisar.href = enlaceWhatsApp(a.telefono, mensaje);
  avisar.target = "_blank";
  avisar.rel = "noopener";
  mensajePanel.append(" ", avisar);
}

const MENSAJES_ERROR = {
  RESERVA_YA_CANCELADA: "Esa reserva ya estaba cancelada.",
  RESERVA_NO_EXISTE: "No encontramos esa reserva.",
  RANGO_INVALIDO: "Revisa las fechas u horas: la final no puede ser antes de la inicial, y el rango de días es de máximo 2 meses.",
  MOTIVO_INVALIDO: "Escribe un motivo (entre 2 y 100 letras).",
  FECHA_PASADA: "No se pueden cerrar días que ya pasaron.",
  SIN_DIAS_DE_ATENCION: "En esas fechas no hay días de atención (por ejemplo, solo domingos).",
  DIA_NO_CERRADO: "Ese día ya estaba abierto.",
  BLOQUEO_NO_EXISTE: "Esas horas ya estaban desbloqueadas.",
  MISMO_HORARIO: "Ya está en ese día y hora.",
  OTRA_FASE: "Esa hora ya tiene un grupo de otra fase.",
  OTRA_MODALIDAD: "Esa hora ya tiene un grupo de la otra modalidad.",
  SIN_CUPO: "Ese grupo está lleno.",
  HORA_OCUPADA: "Esa hora está ocupada por una clase de prueba.",
  FUERA_DE_HORARIO: "Ese día está cerrado o la hora está fuera del horario.",
  HORA_PASADA: "Esa hora ya pasó.",
  ANTICIPACION_24H: "Las clases presenciales se mueven con 24 horas de anticipación.",
  YA_RESERVADO: "Ya tiene otra reserva en esa hora.",
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

const textoRango = (b) => `${textoHora(b.inicio)} a ${textoHora(b.fin)}`;

function avisoBloqueo(b) {
  const aviso = crear("div", "panel-aviso-cerrado");
  aviso.append(crear("strong", "", `Bloqueado de ${textoRango(b)}: `), crear("span", "", b.motivo));
  const abrir = crear("button", "boton boton--fantasma boton--chico", "Desbloquear");
  abrir.type = "button";
  abrir.addEventListener("click", () => ejecutar(abrir, { accion: "abrir", bloqueo: b.id }, "Horas desbloqueadas."));
  aviso.append(abrir);
  return aviso;
}

async function cargarCerrados() {
  const hoy = hoyEnBogota();
  try {
    const r = await llamarPanel({ accion: "cerrados", desde: hoy, hasta: sumarDias(hoy, 400) });
    listaCerrados.replaceChildren();
    // Días completos y horas bloqueadas, en orden de fecha.
    const lista = [...(r.cerrados ?? []), ...(r.bloqueos ?? [])]
      .sort((x, y) => x.fecha.localeCompare(y.fecha) || (x.inicio ?? -1) - (y.inicio ?? -1));
    if (!lista.length) {
      listaCerrados.append(crear("li", "horas__vacio", "No hay días ni horas cerrados."));
      return;
    }
    for (const c of lista) {
      const fila = crear("li", "panel-cerrado");
      const texto = crear("div", "");
      const cuando = formatear(c.fecha, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      texto.append(crear("strong", "", cuando), crear("span", "", c.id ? `, ${textoRango(c)} · ${c.motivo}` : ` · ${c.motivo}`));
      const abrir = crear("button", "panel-cancelar", "Abrir");
      abrir.type = "button";
      abrir.addEventListener("click", () => ejecutar(abrir, c.id ? { accion: "abrir", bloqueo: c.id } : { accion: "abrir", fecha: c.fecha },
        c.id ? "Horas desbloqueadas." : "Día abierto otra vez."));
      fila.append(texto, abrir);
      listaCerrados.append(fila);
    }
  } catch (error) {
    if (error.message !== "NO_AUTORIZADO") listaCerrados.replaceChildren(crear("li", "horas__vacio", "No pudimos cargar los cierres."));
  }
}

async function refrescar() {
  await Promise.all([cargarAgenda(), cargarCerrados()]);
}

// "Todo el día" (uno o varios días) o "Solo unas horas" (de un día).
const opcionesHora = [];
for (let m = 300; m <= 1260; m += 30) opcionesHora.push(m);
for (const [nombre, elegida] of [["inicio", 480], ["fin", 720]]) {
  const lista = formCerrar.elements[nombre];
  for (const m of opcionesHora) lista.add(new Option(textoHora(m), String(m), m === elegida, m === elegida));
}

const soloHoras = () => formCerrar.elements.alcance.value === "horas";

function pintarAlcance() {
  const horas = soloHoras();
  for (const el of formCerrar.querySelectorAll("[data-solo-horas]")) el.hidden = !horas;
  for (const el of formCerrar.querySelectorAll("[data-solo-dias]")) el.hidden = horas;
  formCerrar.querySelector("[data-texto-desde]").textContent = horas ? "Día" : "Desde";
  formCerrar.querySelector('button[type="submit"]').textContent = horas ? "Bloquear horas" : "Cerrar";
}
for (const radio of formCerrar.elements.alcance) radio.addEventListener("change", pintarAlcance);

formCerrar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formCerrar));
  const horas = soloHoras();
  const inicio = Number(datos.inicio), fin = Number(datos.fin);
  if (horas && fin <= inicio) {
    mensajeCerrar.textContent = "La hora final tiene que ser después de la inicial.";
    return;
  }
  const cuerpo = horas
    ? { accion: "cerrar", desde: datos.desde, inicio, fin, motivo: datos.motivo.trim() }
    : { accion: "cerrar", desde: datos.desde, hasta: datos.hasta || datos.desde, motivo: datos.motivo.trim() };
  const boton = formCerrar.querySelector('button[type="submit"]');
  boton.disabled = true;
  mensajeCerrar.textContent = "Un momento…";
  try {
    let r = await llamarPanel(cuerpo);
    if (!r.cerrado && r.reservas_activas) {
      const n = r.reservas_activas;
      const donde = horas ? "esas horas" : "esas fechas";
      const accion = horas ? "¿Bloquear las horas" : "¿Cerrar los días";
      const seguir = confirm(`En ${donde} hay ${n} ${n === 1 ? "reserva" : "reservas"}. ${accion} y cancelar${n === 1 ? "la" : "las"}? Google les avisará por correo.`);
      if (!seguir) {
        mensajeCerrar.textContent = horas ? "No se bloqueó nada." : "No se cerró ningún día.";
        return;
      }
      r = await llamarPanel({ ...cuerpo, cancelar: true });
    }
    let texto = horas
      ? `Se bloqueó el ${fechaLarga(datos.desde)} de ${textoRango({ inicio, fin })}.`.replace("..", ".")
      : `${r.dias === 1 ? "Se cerró 1 día" : `Se cerraron ${r.dias} días`}.`;
    if (r.canceladas) texto += ` ${r.canceladas === 1 ? "Se canceló 1 reserva" : `Se cancelaron ${r.canceladas} reservas`}.`;
    if (r.calendario === false) texto += ' Pero Google Calendar no respondió: revisa los Logs de la función.';
    formCerrar.reset();
    pintarAlcance();
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
