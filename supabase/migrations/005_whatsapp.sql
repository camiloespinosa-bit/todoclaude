-- El Gimnasio del Cerebro: mensajes de WhatsApp (confirmación y recordatorios).
-- Solo para reservas con acepta_whatsapp. Los envía la función del servidor con Twilio;
-- estas funciones dicen a quién escribir y registran lo enviado para no repetir.
--
-- Reglas:
--   * Confirmación: apenas se reserva.
--   * Recordatorio del día antes: desde las 6:00 p.m. del día anterior a la clase, solo si
--     se reservó antes de esa hora (si no, la confirmación hace las veces de recordatorio).
--   * Recordatorio 1 hora antes: entre 70 y 10 minutos antes de empezar, solo si se reservó
--     con al menos 2 horas de anticipación y la clase empieza a las 7:00 a.m. o después
--     (para no escribir de madrugada: las de 6:00 a.m. solo reciben el de la noche anterior).
--   * Un bloque de 2 horas recibe un solo mensaje, con la hora de inicio del bloque.

alter table public.reservas
  add column whatsapp_confirmacion_en timestamptz,
  add column whatsapp_dia_antes_en    timestamptz,
  add column whatsapp_hora_antes_en   timestamptz;

create function public.whatsapp_pendientes()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with ahora as (
    select ahora_bogota() as t, (ahora_bogota())::date as hoy
  ),
  base as (
    -- Una fila por reserva: en un bloque, la de la primera hora.
    select distinct on (coalesce(r.bloque_id, r.id))
      coalesce(r.bloque_id, r.id) as clave, r.tipo, r.nombre, r.telefono,
      r.creada_en at time zone 'America/Bogota' as creada_local,
      r.whatsapp_dia_antes_en, r.whatsapp_hora_antes_en,
      s.fecha, s.inicio, s.clase, s.modalidad, s.enlace_meet,
      s.fecha + make_interval(mins => s.inicio) as empieza
    from reservas r
    join sesiones s on s.id = r.sesion_id
    cross join ahora
    where r.estado = 'activa' and r.acepta_whatsapp
      and s.fecha between ahora.hoy and ahora.hoy + 1
    order by coalesce(r.bloque_id, r.id), s.fecha, s.inicio
  ),
  con_ids as (
    select b.*, (select array_agg(r2.id) from reservas r2
                 where coalesce(r2.bloque_id, r2.id) = b.clave and r2.estado = 'activa') as ids
    from base b
  )
  select json_build_object(
    'dia_antes', coalesce((
      select json_agg(json_build_object('ids', c.ids, 'tipo', c.tipo, 'nombre', c.nombre,
        'telefono', c.telefono, 'fecha', c.fecha, 'inicio', c.inicio, 'clase', c.clase,
        'modalidad', c.modalidad, 'enlace_meet', c.enlace_meet))
      from con_ids c, ahora a
      where c.fecha = a.hoy + 1
        and a.t >= a.hoy + time '18:00'
        and c.creada_local < a.hoy + time '18:00'
        and c.whatsapp_dia_antes_en is null
    ), '[]'::json),
    'hora_antes', coalesce((
      select json_agg(json_build_object('ids', c.ids, 'tipo', c.tipo, 'nombre', c.nombre,
        'telefono', c.telefono, 'fecha', c.fecha, 'inicio', c.inicio, 'clase', c.clase,
        'modalidad', c.modalidad, 'enlace_meet', c.enlace_meet))
      from con_ids c, ahora a
      where c.empieza between a.t + interval '10 minutes' and a.t + interval '70 minutes'
        and c.inicio >= 420
        and c.creada_local <= c.empieza - interval '2 hours'
        and c.whatsapp_hora_antes_en is null
    ), '[]'::json)
  );
$$;

-- Registra un mensaje enviado (en un bloque, en sus dos filas).
create function public.marcar_whatsapp(p_ids uuid[], p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tipo = 'confirmacion' then
    update reservas set whatsapp_confirmacion_en = now() where id = any(p_ids);
  elsif p_tipo = 'dia_antes' then
    update reservas set whatsapp_dia_antes_en = now() where id = any(p_ids);
  elsif p_tipo = 'hora_antes' then
    update reservas set whatsapp_hora_antes_en = now() where id = any(p_ids);
  else
    raise exception 'TIPO_INVALIDO';
  end if;
end;
$$;

-- Ids de las reservas que acaba de hacer una persona (para marcar su confirmación).
create function public.reservas_recientes(p_sesiones uuid[], p_correo text)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select array_agg(id) from reservas
  where sesion_id = any(p_sesiones) and correo = lower(btrim(p_correo)) and estado = 'activa';
$$;

revoke execute on function public.whatsapp_pendientes() from public, anon, authenticated;
revoke execute on function public.marcar_whatsapp(uuid[], text) from public, anon, authenticated;
revoke execute on function public.reservas_recientes(uuid[], text) from public, anon, authenticated;
grant execute on function public.whatsapp_pendientes() to service_role;
grant execute on function public.marcar_whatsapp(uuid[], text) to service_role;
grant execute on function public.reservas_recientes(uuid[], text) to service_role;
