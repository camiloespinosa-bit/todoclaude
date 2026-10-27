-- El Gimnasio del Cerebro: tarea programada de recordatorios por WhatsApp.
-- Ejecutar UNA SOLA VEZ en el SQL Editor, cuando las plantillas de Twilio estén aprobadas y
-- los secretos de Twilio ya estén en Edge Functions > Secrets.
-- Antes: activar las extensiones pg_cron y pg_net (Database > Extensions).

-- 1. Dirección del proyecto y una clave aleatoria, guardadas en la bóveda (Vault).
--    La clave solo sirve para que la tarea programada llame a la función de recordatorios;
--    no da acceso a la base de datos.
select vault.create_secret('https://xpqjejiezbxaxsdodkyb.supabase.co', 'project_url');
select vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'clave_recordatorios');

-- 2. Cada 15 minutos, pedirle a la función que envíe los recordatorios pendientes.
select cron.schedule(
  'recordatorios-whatsapp',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/reservar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-clave-recordatorios', (select decrypted_secret from vault.decrypted_secrets where name = 'clave_recordatorios')
    ),
    body := '{"accion": "recordatorios"}'::jsonb
  );
  $$
);

-- 3. Ver la clave para copiarla al secreto RECORDATORIOS_CLAVE de Edge Functions.
select decrypted_secret as copia_esto_en_RECORDATORIOS_CLAVE
from vault.decrypted_secrets where name = 'clave_recordatorios';

-- Para pausar los recordatorios:   select cron.unschedule('recordatorios-whatsapp');
