-- Solo si YA ejecutaste supabase/migrations/005_whatsapp.sql antes del 27 de octubre de 2026.
-- Actualiza la regla del recordatorio de 1 hora antes: no se envía para clases antes de las
-- 7:00 a.m. (las de 6:00 a.m. solo reciben el recordatorio de la noche anterior).
-- Si todavía no has ejecutado el 005, no corras esto: el 005 actual ya trae la regla.

create or replace function public.whatsapp_pendientes()
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
