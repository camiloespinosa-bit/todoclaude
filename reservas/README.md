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
- **Horario:** lunes 8–1; martes y jueves 8–12 y 1–4; miércoles 8–12 y 1–7; viernes 8–12;
  sábado 8–12 y 1–5. Domingo cerrado. Se cambia en la tabla `horario` de Supabase.
- **Google Calendar (opción B):** un evento por grupo con todos sus estudiantes invitados y un
  solo enlace de Meet si es virtual. Cada clase de prueba es su propio evento. Los estudiantes
  no ven los correos de los demás.

## Cómo está armado

| Archivo | Qué hace |
|---|---|
| `reservas/index.html`, `reservas.css`, `reservas.js` | La página. Sin `config.js` lleno funciona como prototipo con datos de ejemplo. |
| `reservas/config.js` | Dirección del proyecto de Supabase y su llave pública. |
| `supabase/migrations/001_reservas_clases.sql` | Tablas y reglas. Las reglas viven en la base de datos: nadie se las puede saltar desde el navegador. |
| `supabase/functions/reservar/index.ts` | Función del servidor: guarda la reserva y crea o actualiza el evento en Google Calendar con el enlace de Meet. |

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

## Pendientes

- Panel del docente para ver y cancelar reservas (como el de Adriana en Wag and Wash).
- Bloquear horas que ya tienes ocupadas en tu Google Calendar personal.
- Recordatorios por WhatsApp.
- Hoy cualquiera puede reservar una clase normal sin verificar que sea estudiante (decisión
  tomada: todos pagan plan mensual). Si aparecen reservas falsas, se puede agregar verificación.
