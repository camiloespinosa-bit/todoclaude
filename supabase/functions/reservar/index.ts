// Función del servidor (Supabase Edge Function).
// - Sin "accion": recibe la reserva desde la página, la guarda con las reglas de la base de
//   datos y la sincroniza con Google Calendar.
// - Con "accion" (agenda, cancelar, sincronizar, cerrados, cerrar, abrir, aviso): las usa el panel del docente.
// - Con accion "recordatorios": la llama cada 15 minutos la tarea programada de Supabase
//   (pg_cron) para enviar los recordatorios de WhatsApp. Exigen la
//   sesión iniciada de un usuario que esté en la tabla `docentes`.
//
// Secretos que hay que configurar en Supabase (Edge Functions > Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID (opcional, por defecto "primary": el calendario principal)
// Para WhatsApp (opcional: sin estos secretos no se envía nada):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (número de envío, +57...),
//   TWILIO_PLANTILLA_CONFIRMACION, TWILIO_PLANTILLA_DIA_ANTES, TWILIO_PLANTILLA_HORA_ANTES
//   (los ContentSid "HX..." de las plantillas aprobadas) y RECORDATORIOS_CLAVE (la misma
//   clave guardada en Vault para la tarea programada).
// SUPABASE_URL y la llave secreta los pone Supabase automáticamente.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Proyectos nuevos: SUPABASE_SECRET_KEYS (JSON con la llave "default").
// Proyectos con llaves antiguas: SUPABASE_SERVICE_ROLE_KEY.
const SERVICE_KEY: string = (() => {
  const nuevas = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (nuevas) {
    try {
      const llave = JSON.parse(nuevas).default;
      if (llave) return llave;
    } catch { /* se usa la antigua */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
})();
const CALENDARIO = Deno.env.get("GOOGLE_CALENDAR_ID") ?? "primary";
const ZONA = "America/Bogota";
const SEDE = "Rionegro, Antioquia";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Asistente = { nombre: string; correo: string; personas: number; programa: string | null };
type Sesion = {
  id: string;
  fecha: string;
  inicio: number;
  clase: "grupo" | "prueba";
  modalidad: "presencial" | "virtual";
  enlace_meet: string | null;
  asistentes: Asistente[];
};

function responder(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });
}

async function rpc(funcion: string, parametros: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(parametros),
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error(datos?.message ?? `Error ${r.status} en ${funcion}`);
  return datos;
}

async function tokenDeGoogle(): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN")!,
      grant_type: "refresh_token",
    }),
  });
  const datos = await r.json();
  if (!r.ok) throw new Error(`Google no entregó el token: ${datos.error ?? r.status}`);
  return datos.access_token;
}

function fechaHora(fecha: string, minutos: number) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return { dateTime: `${fecha}T${h}:${m}:00`, timeZone: ZONA };
}

// Arma el evento a partir de la base de datos (que es la fuente de verdad): así, aunque
// dos personas reserven al mismo tiempo, la lista de invitados queda completa.
function armarEvento(s: Sesion) {
  const minutos = s.clase === "grupo" ? 60 : 30;
  const personas = s.asistentes.reduce((n, a) => n + a.personas, 0);
  const modalidad = s.modalidad === "virtual" ? "virtual" : "presencial";
  const titulo = s.clase === "grupo"
    ? `Grupo ${modalidad} (${personas}/5) — Gimnasio del Cerebro`
    : `Clase de prueba ${modalidad} — ${s.asistentes[0]?.nombre ?? ""}`;
  const descripcion = s.clase === "grupo"
    ? "Clase en grupo de El Gimnasio del Cerebro."
    : `Clase de prueba gratuita de El Gimnasio del Cerebro (30 minutos). Personas: ${personas}.`;
  return {
    summary: titulo,
    description: descripcion,
    location: s.modalidad === "presencial" ? SEDE : undefined,
    start: fechaHora(s.fecha, s.inicio),
    end: fechaHora(s.fecha, s.inicio + minutos),
    attendees: s.asistentes.map((a) => ({ email: a.correo, displayName: a.nombre })),
    // Los estudiantes de un grupo no ven los correos de los demás.
    guestsCanSeeOtherGuests: false,
    guestsCanInviteOthers: false,
  };
}

async function sincronizarSesion(id: string, token: string): Promise<string | null> {
  const sesion: Sesion = await rpc("detalle_sesion", { p_sesion: id });
  // El id del evento es el de la sesión sin guiones (solo 0-9 y a-f, válido para Google).
  const idEvento = sesion.id.replaceAll("-", "");
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDARIO)}/events`;
  const cabeceras = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Sin asistentes (todos cancelaron): se borra el evento y Google avisa a los invitados.
  if (sesion.asistentes.length === 0) {
    const borrar = await fetch(`${base}/${idEvento}?sendUpdates=all`, { method: "DELETE", headers: cabeceras });
    // 404 o 410: el evento no existía o ya estaba borrado.
    if (!borrar.ok && borrar.status !== 404 && borrar.status !== 410) {
      const error = await borrar.json().catch(() => null);
      throw new Error(`Google no borró el evento: ${error?.error?.message ?? borrar.status}`);
    }
    await rpc("quitar_evento", { p_sesion: sesion.id });
    return null;
  }

  const evento = armarEvento(sesion);

  const crear = await fetch(`${base}?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    headers: cabeceras,
    body: JSON.stringify({
      id: idEvento,
      ...evento,
      ...(sesion.modalidad === "virtual"
        ? { conferenceData: { createRequest: { requestId: sesion.id, conferenceSolutionKey: { type: "hangoutsMeet" } } } }
        : {}),
    }),
  });

  let resultado;
  if (crear.status === 409) {
    // El evento ya existe (alguien más ya reservó en este grupo): se actualizan los invitados.
    const actualizar = await fetch(`${base}/${idEvento}?sendUpdates=all`, {
      method: "PATCH",
      headers: cabeceras,
      body: JSON.stringify({ summary: evento.summary, description: evento.description, attendees: evento.attendees }),
    });
    resultado = await actualizar.json();
    if (!actualizar.ok) throw new Error(`Google no actualizó el evento: ${resultado.error?.message ?? actualizar.status}`);
  } else {
    resultado = await crear.json();
    if (!crear.ok) throw new Error(`Google no creó el evento: ${resultado.error?.message ?? crear.status}`);
  }

  const meet: string | null = resultado.hangoutLink ?? sesion.enlace_meet ?? null;
  await rpc("guardar_evento", { p_sesion: sesion.id, p_evento: idEvento, p_meet: meet });
  return meet;
}

// ---------- WhatsApp (Twilio) ----------
type TipoWhatsApp = "confirmacion" | "dia_antes" | "hora_antes";

const PLANTILLAS: Record<TipoWhatsApp, string | undefined> = {
  confirmacion: Deno.env.get("TWILIO_PLANTILLA_CONFIRMACION"),
  dia_antes: Deno.env.get("TWILIO_PLANTILLA_DIA_ANTES"),
  hora_antes: Deno.env.get("TWILIO_PLANTILLA_HORA_ANTES"),
};

function whatsappListo(tipo: TipoWhatsApp) {
  return Boolean(Deno.env.get("TWILIO_ACCOUNT_SID") && Deno.env.get("TWILIO_AUTH_TOKEN") && Deno.env.get("TWILIO_WHATSAPP_FROM") && PLANTILLAS[tipo]);
}

// Números de Colombia de 10 dígitos reciben el +57.
function enE164(telefono: string) {
  const digitos = String(telefono).replace(/\D/g, "");
  return `+${digitos.length === 10 ? `57${digitos}` : digitos}`;
}

async function enviarWhatsApp(tipo: TipoWhatsApp, telefono: string, variables: string[]) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const cuerpo = new URLSearchParams({
    From: `whatsapp:${enE164(Deno.env.get("TWILIO_WHATSAPP_FROM")!)}`,
    To: `whatsapp:${enE164(telefono)}`,
    ContentSid: PLANTILLAS[tipo]!,
    ContentVariables: JSON.stringify(Object.fromEntries(variables.map((v, i) => [String(i + 1), v]))),
  });
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${sid}:${Deno.env.get("TWILIO_AUTH_TOKEN")}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: cuerpo,
  });
  if (!r.ok) {
    const error = await r.json().catch(() => null);
    throw new Error(`Twilio no envió el WhatsApp (${tipo}): ${error?.code ?? r.status} ${error?.message ?? ""}`);
  }
}

function textoHora(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const sufijo = h < 12 ? "a.m." : h === 12 && m === 0 ? "m." : "p.m.";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

function fechaLarga(fecha: string) {
  // Sin la coma que agrega Intl ("miércoles, 4 de noviembre"), que suena rara dentro de una frase.
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })
    .format(new Date(`${fecha}T12:00:00Z`)).replace(",", "");
}

const NOMBRE_CLASE: Record<string, string> = { prueba: "clase de prueba gratis", clase: "clase de 1 hora", bloque: "bloque de 2 horas" };

function lugar(modalidad: string, meet: string | null) {
  if (modalidad === "presencial") return "en nuestra sede de Rionegro";
  return meet ? `por Google Meet: ${meet}` : "por Google Meet (el enlace está en la invitación de tu calendario)";
}

async function confirmarPorWhatsApp(datos: Record<string, unknown>, sesiones: string[], meet: string | null) {
  if (!datos.acepta_whatsapp || !whatsappListo("confirmacion")) return;
  try {
    await enviarWhatsApp("confirmacion", String(datos.telefono), [
      String(datos.nombre).trim(),
      NOMBRE_CLASE[String(datos.tipo)],
      fechaLarga(String(datos.fecha)),
      textoHora(Number(datos.inicio)),
      lugar(String(datos.modalidad), meet),
    ]);
    const ids = await rpc("reservas_recientes", { p_sesiones: sesiones, p_correo: datos.correo });
    if (ids?.length) await rpc("marcar_whatsapp", { p_ids: ids, p_tipo: "confirmacion" });
  } catch (e) {
    // El WhatsApp es un extra: si falla, la reserva y el calendario ya quedaron bien.
    console.error(e);
  }
}

type Pendiente = { ids: string[]; tipo: string; nombre: string; telefono: string; fecha: string; inicio: number; modalidad: string; enlace_meet: string | null };

async function recordatorios(req: Request) {
  const clave = Deno.env.get("RECORDATORIOS_CLAVE");
  if (!clave || clave.length < 20 || req.headers.get("x-clave-recordatorios") !== clave) {
    return responder({ error: "NO_AUTORIZADO" }, 401);
  }
  const pendientes: Record<"dia_antes" | "hora_antes", Pendiente[]> = await rpc("whatsapp_pendientes", {});
  const resultado = { dia_antes: 0, hora_antes: 0, errores: 0 };
  for (const tipo of ["dia_antes", "hora_antes"] as const) {
    if (!whatsappListo(tipo)) continue;
    for (const p of pendientes[tipo]) {
      const variables = tipo === "dia_antes"
        ? [p.nombre, NOMBRE_CLASE[p.tipo], textoHora(p.inicio), lugar(p.modalidad, p.enlace_meet)]
        : [p.nombre, textoHora(p.inicio), lugar(p.modalidad, p.enlace_meet)];
      try {
        await enviarWhatsApp(tipo, p.telefono, variables);
        await rpc("marcar_whatsapp", { p_ids: p.ids, p_tipo: tipo });
        resultado[tipo]++;
      } catch (e) {
        // No se marca: se reintenta en la siguiente ejecución mientras siga a tiempo.
        console.error(e);
        resultado.errores++;
      }
    }
  }
  return responder(resultado);
}

function codigoDeError(e: unknown) {
  // Las reglas de la base de datos devuelven códigos como SIN_CUPO u OTRA_MODALIDAD.
  const mensaje = (e as Error).message;
  if (/^[A-Z_]+$/.test(mensaje)) return mensaje;
  console.error(e);
  return "ERROR";
}

// Confirma que quien llama inició sesión en Supabase Auth y es docente.
async function esDocente(req: Request): Promise<boolean> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) return false;
  const usuario = await r.json();
  return usuario?.id ? (await rpc("es_docente", { p_user: usuario.id })) === true : false;
}

async function sincronizarVarias(sesiones: string[]) {
  const token = await tokenDeGoogle();
  let meet: string | null = null;
  // En un bloque cada hora es su propio grupo; se devuelve el enlace de la primera hora.
  for (const id of sesiones) meet ??= await sincronizarSesion(id, token);
  return meet;
}

async function reservar(datos: Record<string, unknown>) {
  // Campo trampa: las personas no lo ven; si viene lleno, es un robot.
  if (datos.sitio_web) return responder({ ok: true, calendario: false });
  // Prueba de la autorización de datos (Ley 1581): la página envía la versión de la
  // política que la persona aceptó. Sin ella no se guarda la reserva.
  if (typeof datos.politica_version !== "string" || !datos.politica_version) {
    return responder({ error: "AUTORIZACION_REQUERIDA" }, 409);
  }

  let sesiones: string[];
  try {
    const r = await rpc("reservar", {
      p_tipo: datos.tipo,
      p_modalidad: datos.modalidad,
      p_fecha: datos.fecha,
      p_inicio: datos.inicio,
      p_nombre: datos.nombre,
      p_telefono: String(datos.telefono ?? "").replace(/[\s-]/g, ""),
      p_correo: datos.correo,
      p_programa: datos.programa,
      p_personas: datos.personas ?? 1,
      p_acepta_whatsapp: Boolean(datos.acepta_whatsapp),
      p_politica: datos.politica_version.slice(0, 20),
    });
    sesiones = r.sesiones;
  } catch (e) {
    const codigo = codigoDeError(e);
    return responder({ error: codigo }, codigo === "ERROR" ? 500 : 409);
  }

  // La reserva ya quedó guardada. Si Google falla, no se pierde: se informa y el docente
  // la puede reenviar al calendario desde su panel.
  let meet: string | null = null;
  let calendario = true;
  try {
    meet = await sincronizarVarias(sesiones);
  } catch (e) {
    console.error(e);
    calendario = false;
  }
  await confirmarPorWhatsApp(datos, sesiones, meet);
  return responder({ ok: true, calendario, meet });
}

async function panel(req: Request, datos: Record<string, unknown>) {
  if (!(await esDocente(req))) return responder({ error: "NO_AUTORIZADO" }, 401);

  try {
    if (datos.accion === "agenda") {
      const [sesiones, cerrados] = await Promise.all([
        rpc("panel_agenda", { p_desde: datos.desde, p_hasta: datos.hasta }),
        rpc("dias_cerrados_entre", { p_desde: datos.desde, p_hasta: datos.hasta }),
      ]);
      return responder({ sesiones, cerrados });
    }
    if (datos.accion === "cerrados") {
      return responder({ cerrados: await rpc("dias_cerrados_entre", { p_desde: datos.desde, p_hasta: datos.hasta }) });
    }
    if (datos.accion === "cerrar") {
      const r = await rpc("cerrar_dias", {
        p_desde: datos.desde,
        p_hasta: datos.hasta,
        p_motivo: datos.motivo,
        p_cancelar: Boolean(datos.cancelar),
      });
      // Sin cerrar: hay reservas y el docente aún no confirmó cancelarlas.
      if (!r.cerrado || !r.sesiones?.length) return responder({ ...r, calendario: true });
      try {
        await sincronizarVarias(r.sesiones);
        return responder({ ...r, calendario: true });
      } catch (e) {
        console.error(e);
        return responder({ ...r, calendario: false });
      }
    }
    if (datos.accion === "abrir") {
      await rpc("abrir_dia", { p_fecha: datos.fecha });
      return responder({ ok: true });
    }
    if (datos.accion === "cancelar") {
      const { sesiones } = await rpc("cancelar_reserva", { p_reserva: datos.reserva });
      try {
        await sincronizarVarias(sesiones ?? []);
        return responder({ ok: true, calendario: true });
      } catch (e) {
        console.error(e);
        return responder({ ok: true, calendario: false });
      }
    }
    if (datos.accion === "sincronizar") {
      const meet = await sincronizarVarias([String(datos.sesion)]);
      return responder({ ok: true, calendario: true, meet });
    }
    if (datos.accion === "aviso") {
      await rpc("marcar_aviso", { p_reserva: datos.reserva, p_tipo: datos.tipo });
      return responder({ ok: true });
    }
  } catch (e) {
    const codigo = codigoDeError(e);
    return responder({ error: codigo }, codigo === "ERROR" ? 500 : 409);
  }
  return responder({ error: "ACCION_INVALIDA" }, 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "METODO_INVALIDO" }, 405);

  let datos;
  try {
    datos = await req.json();
  } catch {
    return responder({ error: "DATOS_INVALIDOS" }, 400);
  }

  if (datos.accion === "recordatorios") return recordatorios(req);
  return datos.accion ? panel(req, datos) : reservar(datos);
});
