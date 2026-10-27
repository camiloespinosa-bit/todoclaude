-- El Gimnasio del Cerebro: borrado automático de datos de reservas vencidos.
-- La política de privacidad (v2) promete conservar los datos de cada reserva "hasta 24 meses
-- después de tu última reserva o clase". Esta función borra a cada persona (por su correo)
-- cuya última reserva o clase fue hace más de 24 meses, con todas sus reservas, también las
-- canceladas. Después borra los grupos viejos que quedaron vacíos.
--
-- Antes de ejecutar este archivo: Database > Extensions > activar "pg_cron".

create function public.borrar_datos_vencidos()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite   date := ((ahora_bogota())::date - interval '24 months')::date;
  v_personas integer;
  v_reservas integer;
  v_sesiones integer;
begin
  with ultima as (
    select lower(r.correo) as correo,
           greatest(max((r.creada_en at time zone 'America/Bogota')::date), max(s.fecha)) as fecha
    from reservas r join sesiones s on s.id = r.sesion_id
    group by lower(r.correo)
  ),
  vencidas as (select correo from ultima where fecha < v_limite),
  borradas as (
    delete from reservas r using vencidas v
    where lower(r.correo) = v.correo
    returning lower(r.correo) as correo
  )
  select count(distinct correo), count(*) into v_personas, v_reservas from borradas;

  delete from sesiones s
  where s.fecha < v_limite
    and not exists (select 1 from reservas r where r.sesion_id = s.id);
  get diagnostics v_sesiones = row_count;

  return json_build_object('limite', v_limite, 'personas', v_personas,
                           'reservas', v_reservas, 'sesiones', v_sesiones);
end;
$$;

revoke execute on function public.borrar_datos_vencidos() from public, anon, authenticated;
grant execute on function public.borrar_datos_vencidos() to service_role;

-- Todos los días a las 3:15 a.m. de Colombia (8:15 en hora UTC, que es la que usa pg_cron).
select cron.schedule('borrar-datos-vencidos', '15 8 * * *', 'select public.borrar_datos_vencidos()');
