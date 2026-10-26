-- El Gimnasio del Cerebro: panel del docente.
-- El docente inicia sesión con Supabase Auth. Todo lo del panel pasa por la función
-- del servidor `reservar`, que confirma que quien llama está en la tabla `docentes`
-- antes de usar estas funciones (solo las puede ejecutar el servidor).

-- Usuarios de Supabase Auth que pueden entrar al panel.
create table public.docentes (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.docentes enable row level security;

create function public.es_docente(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from docentes where user_id = p_user);
$$;

-- Sesiones con reservas activas entre dos fechas, con sus asistentes.
create function public.panel_agenda(p_desde date, p_hasta date)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'id', s.id, 'fecha', s.fecha, 'inicio', s.inicio, 'clase', s.clase,
    'modalidad', s.modalidad, 'enlace_meet', s.enlace_meet,
    'en_calendario', s.google_event_id is not null,
    'ocupados', ocupados(s.id),
    'asistentes', (
      select json_agg(json_build_object(
        'id', r.id, 'tipo', r.tipo, 'bloque_id', r.bloque_id, 'nombre', r.nombre,
        'telefono', r.telefono, 'correo', r.correo, 'programa', r.programa,
        'personas', r.personas, 'acepta_whatsapp', r.acepta_whatsapp, 'creada_en', r.creada_en
      ) order by r.creada_en)
      from reservas r where r.sesion_id = s.id and r.estado = 'activa'
    )
  ) order by s.fecha, s.inicio), '[]'::json)
  from sesiones s
  where s.fecha between p_desde and least(p_hasta, p_desde + 62)
    and ocupados(s.id) > 0;
$$;

-- Cancela una reserva. Si es parte de un bloque, cancela las dos horas.
-- Devuelve las sesiones afectadas para actualizar Google Calendar.
create function public.cancelar_reserva(p_reserva uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva  reservas;
  v_sesiones uuid[];
begin
  select * into v_reserva from reservas where id = p_reserva;
  if v_reserva.id is null then
    raise exception 'RESERVA_NO_EXISTE';
  end if;
  if v_reserva.estado <> 'activa' then
    raise exception 'RESERVA_YA_CANCELADA';
  end if;

  with canceladas as (
    update reservas
    set estado = 'cancelada'
    where estado = 'activa'
      and (id = p_reserva or (v_reserva.bloque_id is not null and bloque_id = v_reserva.bloque_id))
    returning sesion_id
  )
  select array_agg(distinct sesion_id) into v_sesiones from canceladas;

  return json_build_object('sesiones', v_sesiones);
end;
$$;

-- Cuando una sesión se queda sin asistentes y se borra su evento de Google Calendar.
create function public.quitar_evento(p_sesion uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update sesiones set google_event_id = null, enlace_meet = null where id = p_sesion;
$$;

revoke execute on function public.es_docente(uuid) from public, anon, authenticated;
revoke execute on function public.panel_agenda(date, date) from public, anon, authenticated;
revoke execute on function public.cancelar_reserva(uuid) from public, anon, authenticated;
revoke execute on function public.quitar_evento(uuid) from public, anon, authenticated;
grant execute on function public.es_docente(uuid) to service_role;
grant execute on function public.panel_agenda(date, date) to service_role;
grant execute on function public.cancelar_reserva(uuid) to service_role;
grant execute on function public.quitar_evento(uuid) to service_role;
