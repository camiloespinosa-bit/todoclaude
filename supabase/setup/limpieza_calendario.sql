-- El Gimnasio del Cerebro: tarea diaria que borra de Google Calendar los eventos de clases de
-- hace más de 24 meses.
-- Ejecutar UNA SOLA VEZ en el SQL Editor, después de 009 y de desplegar la función `reservar`.
-- Antes: activar la extensión pg_net (Database > Extensions). pg_cron ya está activa.

-- 1. Dirección del proyecto y una clave aleatoria, guardadas en la bóveda (Vault).
--    La clave solo sirve para que la tarea programada llame a la función; no da acceso a
--    la base de datos. Si ya existen, no se crean otra vez.
select vault.create_secret('https://xpqjejiezbxaxsdodkyb.supabase.co', 'project_url')
where not exists (select 1 from vault.secrets where name = 'project_url');
select vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'clave_tareas')
where not exists (select 1 from vault.secrets where name = 'clave_tareas');

-- 2. Todos los días a las 3:00 a.m. de Colombia (8:00 en hora UTC), 15 minutos antes del
--    borrado de la base de datos.
select cron.schedule(
  'limpiar-calendario',
  '0 8 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/reservar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-clave-tareas', (select decrypted_secret from vault.decrypted_secrets where name = 'clave_tareas')
    ),
    body := '{"accion": "limpiar_calendario"}'::jsonb
  );
  $$
);

-- 3. Ver la clave para copiarla al secreto TAREAS_CLAVE de Edge Functions.
select decrypted_secret as copia_esto_en_TAREAS_CLAVE
from vault.decrypted_secrets where name = 'clave_tareas';

-- Para pausarla:   select cron.unschedule('limpiar-calendario');
