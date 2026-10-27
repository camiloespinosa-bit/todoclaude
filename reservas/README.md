# Reservas de clases: El Gimnasio del Cerebro

Página para que los estudiantes reserven su clase: `reservas/index.html`.
Sigue la misma idea de Wag and Wash (Supabase), sin cobro al reservar porque los
estudiantes tienen planes mensuales pagados por anticipado.

## Reglas

- **Un solo docente.** Las clases son grupos de 1 hora que empiezan en punto (8:00, 9:00...).
  Todos los que reservan esa hora entran al mismo grupo, **hasta 5 estudiantes**.
- **Presencial o virtual, nunca las dos a la vez.** El primero que reserva una hora define el
  tipo de grupo; los demás solo pueden unirse a ese mismo tipo.
- **Bloque de 2 horas:** son dos grupos seguidos; el estudiante queda en los dos.
- **Clase de prueba:** gratis, 30 minutos, para una familia o grupo de hasta 5 personas.
  Solo cabe en horas sin grupo, y mientras exista, esa hora queda bloqueada para clases.
- **Horario:** lunes 6–1 y 7–8 p.m.; martes y jueves 6–12, 1–4 y 7–8 p.m.; miércoles 6–12 y
  1–8 p.m.; viernes 6–12; sábado 8–12 y 1–5. Domingo cerrado. Se cambia en la tabla `horario`
  de Supabase (ver `supabase/migrations/006_horario_6am.sql`).
- **Google Calendar (opción B):** un evento por grupo con todos sus estudiantes invitados y un
  solo enlace de Meet si es virtual. Cada clase de prueba es su propio evento. Los estudiantes
  no ven los correos de los demás.

## Cómo está armado

| Archivo | Qué hace |
|---|---|
| `reservas/index.html`, `reservas.css`, `reservas.js` | La página. Sin `config.js` lleno funciona como prototipo con datos de ejemplo. |
| `reservas/config.js` | Dirección del proyecto de Supabase y su llave pública. |
| `supabase/migrations/001_reservas_clases.sql` | Tablas y reglas. Las reglas viven en la base de datos: nadie se las puede saltar desde el navegador. |
| `supabase/functions/reservar/index.ts` | Función del servidor: guarda la reserva y crea o actualiza el evento en Google Calendar con el enlace de Meet. También atiende el panel del docente (agenda, cancelar, reenviar al calendario). |
| `reservas/panel.html`, `panel.css`, `panel.js` | Panel del docente: ver las reservas por día, cancelar y reenviar al calendario. |
| `supabase/migrations/002_panel_docente.sql` | Quién puede entrar al panel (tabla `docentes`) y las funciones de agenda y cancelación. |

Las reglas se probaron con 23 casos en una base de datos Postgres local, y el flujo completo
(página → servidor → base de datos → calendario) con un Google Calendar simulado.
**Falta probarlo con tu cuenta real de Google.**

## Puesta en marcha (una sola vez)

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto **nuevo** (no uses el de
   Wag and Wash). Región sugerida: São Paulo (la más cercana a Colombia).
2. Abre **SQL Editor**, pega todo `supabase/migrations/001_reservas_clases.sql` y dale **Run**.
3. Carga los festivos del año en la misma pantalla (verifica las fechas en el calendario
   oficial de festivos de Colombia):

   ```sql
   insert into dias_cerrados (fecha, motivo) values
     ('2026-11-02', 'Festivo: Todos los Santos'),
     ('2026-12-08', 'Festivo: Inmaculada Concepción');
   ```

   La misma tabla sirve para bloquear días de vacaciones o imprevistos.

### 2. Autorizar tu Google Calendar

Esto le da permiso a la función del servidor para crear eventos en tu calendario.

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) con la cuenta de Google
   de tu calendario y crea un proyecto (por ejemplo "Gimnasio del Cerebro Reservas").
2. **APIs y servicios > Biblioteca:** busca **Google Calendar API** y dale **Habilitar**.
3. **Pantalla de consentimiento de OAuth:** tipo **Externo**, nombre de la app, tu correo.
   En permisos (scopes) agrega `https://www.googleapis.com/auth/calendar.events`.
4. **Importante:** cuando termines, en la misma pantalla dale **Publicar app** para pasarla
   a **En producción**. Si se queda en "Prueba", Google vence la autorización cada 7 días y
   las reservas dejan de llegar al calendario (lo dice la documentación oficial de Google).
   Como la app solo la usas tú, Google te mostrará un aviso de "app no verificada" al
   autorizar; puedes continuar con "Configuración avanzada". Verifica esto en tu pantalla:
   las opciones de Google cambian con el tiempo.
5. **Credenciales > Crear credenciales > ID de cliente de OAuth**, tipo **Aplicación web**.
   En "URI de redireccionamiento autorizados" pega `https://developers.google.com/oauthplayground`.
   Guarda el **ID de cliente** y el **Secreto del cliente**.
6. Abre [OAuth Playground](https://developers.google.com/oauthplayground):
   - Engranaje (arriba a la derecha) > marca **Use your own OAuth credentials** y pega el ID y el secreto.
   - En el cuadro de la izquierda escribe `https://www.googleapis.com/auth/calendar.events` y dale **Authorize APIs**.
   - Entra con tu cuenta y acepta.
   - Dale **Exchange authorization code for tokens** y copia el **Refresh token**.

Estos tres datos (ID, secreto y refresh token) son **privados**: no los pegues en el código ni
en el chat, solo en Supabase (paso 3).

### 3. Subir la función del servidor

1. En Supabase: **Edge Functions > Deploy a new function > Via Editor**.
2. Nombre: `reservar`. Pega el contenido de `supabase/functions/reservar/index.ts` y despliega.
3. En los detalles de la función, **desactiva "Verify JWT"** (la página es pública; las
   reglas las revisa la base de datos).
4. **Edge Functions > Secrets:** agrega
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_CALENDAR_ID` (opcional; si no lo pones usa tu calendario principal)

### 4. Conectar la página

En Supabase, **Project Settings > API**, copia la **Project URL** y la llave **publishable**
(o **anon**) y pégalas en `reservas/config.js`. **Nunca** la llave secreta.

### 5. Probar

Haz una reserva de prueba con tu propio correo y revisa que:
- aparezca el evento en tu Google Calendar,
- te llegue la invitación al correo,
- si es virtual, el evento tenga enlace de Meet.

Si la reserva se guarda pero el evento no aparece, revisa **Edge Functions > reservar > Logs**.

## Panel del docente

Dirección: **gimnasiodelcerebro.co/reservas/panel.html** (no aparece en buscadores).

- Muestra 14 días; cada día lleva el número de personas con reserva. Con "Ir a la fecha" se salta a cualquier día.
- Por cada clase: hora, tipo de grupo, cupo, enlace de Meet y la lista de asistentes con WhatsApp, correo y programa.
- **Cancelar** una reserva: Google le avisa al estudiante y actualiza el evento. Si el grupo queda vacío, el evento se borra. Si la reserva es un bloque de 2 horas, se cancelan las dos horas. La hora queda libre otra vez en la página de reservas.
- **Reenviar al calendario:** aparece si una reserva no alcanzó a llegar a Google Calendar (por ejemplo, si Google falló en ese momento).

### Activarlo (una sola vez)

1. **SQL Editor:** pega y ejecuta `supabase/migrations/002_panel_docente.sql`.
2. **Authentication > Users > Add user > Create new user:** tu correo y una contraseña segura. Marca **Auto Confirm User**.
3. **SQL Editor:** dale acceso al panel (cambia el correo):

   ```sql
   insert into docentes (user_id)
   select id from auth.users where email = 'tu-correo@ejemplo.com';
   ```
4. **Edge Functions > reservar > Code:** reemplaza todo el código por el nuevo `supabase/functions/reservar/index.ts` y dale **Deploy**. Revisa que **Verify JWT** siga apagado.
5. Entra a gimnasiodelcerebro.co/reservas/panel.html con ese correo y contraseña.

### Cerrar días (vacaciones, imprevistos, festivos)

En la sección **Cerrar días** del panel: fecha inicial, fecha final opcional (máximo 2 meses) y motivo. Los domingos se saltan. Si hay reservas en esas fechas, el panel pregunta antes de cancelarlas (Google les avisa a los estudiantes). La lista **Próximos días cerrados** permite abrir cualquier día otra vez. Los días cerrados se ven en gris en la página de reservas y en el panel aparecen marcados como "Cerrado".

Requiere `supabase/migrations/004_dias_cerrados_panel.sql`. Orden para aplicarlo: 1) ejecutar 004 en el SQL Editor, 2) desplegar la función `reservar` nueva, 3) publicar la página (merge).

Seguridad: el panel solo muestra datos si el usuario inició sesión **y** está en la tabla `docentes`. El servidor lo revisa en cada acción; los datos de los estudiantes nunca se leen directamente desde el navegador.

## Prueba de la autorización de datos

Cada reserva guarda la versión de la política de privacidad que la persona aceptó (`reservas.politica_version`; la fecha y hora quedan en `creada_en`). La versión vigente está en `POLITICA_VERSION` (al inicio de `reservas/reservas.js`) y debe coincidir con la que muestra `privacidad.html`. Si se publica una nueva versión de la política, hay que cambiar las dos.

Para aplicar `supabase/migrations/003_autorizacion_datos.sql` sin cortar las reservas, en este orden:
1. Ejecutar 003 en el SQL Editor.
2. Publicar la página (merge en GitHub).
3. Desplegar la función `reservar` nueva (desde ese momento rechaza reservas sin autorización).

## WhatsApp: confirmación y recordatorios

Con Twilio, solo para quienes marcaron la casilla de WhatsApp al reservar:

- **Confirmación:** apenas se reserva.
- **Día antes:** desde las 6:00 p.m. del día anterior (solo si se reservó antes de esa hora).
- **1 hora antes:** entre 70 y 10 minutos antes de la clase (solo si se reservó con 2 horas o más de anticipación y la clase es a las 7:00 a.m. o después).
- Un bloque de 2 horas recibe un solo mensaje. Ningún mensaje se repite; si Twilio falla, se reintenta en la siguiente ejecución mientras siga a tiempo, y el error queda en los Logs.

Sin los secretos de Twilio la función no envía nada, así que se puede desplegar antes de tener las plantillas aprobadas.

Puesta en marcha:
1. SQL Editor: ejecutar `supabase/migrations/005_whatsapp.sql`.
2. Desplegar la función `reservar` nueva.
3. Twilio: crear y enviar a aprobación las 3 plantillas de `reservas/PLANTILLAS_WHATSAPP.md`.
4. Con las plantillas aprobadas, en Edge Functions > Secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (el número de envío, con +57), `TWILIO_PLANTILLA_CONFIRMACION`, `TWILIO_PLANTILLA_DIA_ANTES`, `TWILIO_PLANTILLA_HORA_ANTES`.
5. Activar las extensiones `pg_cron` y `pg_net`, ejecutar `supabase/setup/recordatorios_whatsapp.sql` y copiar la clave que muestra al secreto `RECORDATORIOS_CLAVE`.

## Pendientes

- Borrar automáticamente los datos de reservas con más de 24 meses sin actividad, como promete la política de privacidad v2.
- Bloquear horas que ya tienes ocupadas en tu Google Calendar personal.
- Hoy cualquiera puede reservar una clase normal sin verificar que sea estudiante (decisión
  tomada: todos pagan plan mensual). Si aparecen reservas falsas, se puede agregar verificación.
