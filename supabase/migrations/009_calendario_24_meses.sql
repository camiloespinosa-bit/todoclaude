-- El Gimnasio del Cerebro: borrar de Google Calendar los eventos de clases de hace más de
-- 24 meses (tienen nombres y correos de los estudiantes).
-- Una tarea diaria (supabase/setup/limpieza_calendario.sql) llama a la función del servidor,
-- que borra los eventos sin avisar a los invitados y los quita de la sesión. Después, la
-- tarea de 008 borra esas sesiones de la base de datos.
-- Requiere 008.

create function public.fecha_limite_datos()
returns date
language sql
stable
as $$
  select ((ahora_bogota())::date - interval '24 months')::date;
$$;

-- Sesiones viejas que todavía tienen evento en Google Calendar (de a 100 por vez).
create function public.eventos_vencidos()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(id), '[]'::json)
  from (
    select id from sesiones
    where fecha < fecha_limite_datos() and google_event_id is not null
    order by fecha
    limit 100
  ) t;
$$;

-- Igual que en 008, pero sin borrar sesiones que todavía tienen evento en el calendario:
-- primero se borra el evento y al día siguiente la sesión.
create or replace function public.borrar_datos_vencidos()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limite   date := fecha_limite_datos();
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
    and s.google_event_id is null
    and not exists (select 1 from reservas r where r.sesion_id = s.id);
  get diagnostics v_sesiones = row_count;

  return json_build_object('limite', v_limite, 'personas', v_personas,
                           'reservas', v_reservas, 'sesiones', v_sesiones);
end;
$$;

revoke execute on function public.eventos_vencidos() from public, anon, authenticated;
grant execute on function public.eventos_vencidos() to service_role;
