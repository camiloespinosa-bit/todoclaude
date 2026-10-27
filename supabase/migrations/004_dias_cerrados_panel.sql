-- El Gimnasio del Cerebro: cerrar y abrir días desde el panel del docente
-- (vacaciones, imprevistos, festivos). Solo las ejecuta el servidor, después de confirmar
-- que quien llama es docente.

-- Días cerrados entre dos fechas (hasta 400 días), para el panel.
create function public.dias_cerrados_entre(p_desde date, p_hasta date)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object('fecha', fecha, 'motivo', motivo) order by fecha), '[]'::json)
  from dias_cerrados
  where fecha between p_desde and least(p_hasta, p_desde + 400);
$$;

-- Cierra los días de atención entre dos fechas (hasta 62 días). Los días sin horario
-- (domingos) se saltan. Si hay reservas activas en esas fechas no cierra nada y devuelve
-- cuántas hay, salvo que p_cancelar sea verdadero: entonces las cancela y devuelve las
-- sesiones afectadas, para borrar sus eventos de Google Calendar.
create function public.cerrar_dias(p_desde date, p_hasta date, p_motivo text, p_cancelar boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia      date;
  v_activas  integer;
  v_sesiones uuid[];
  v_dias     integer;
begin
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 62 then
    raise exception 'RANGO_INVALIDO';
  end if;
  if p_motivo is null or char_length(btrim(p_motivo)) not between 2 and 100 then
    raise exception 'MOTIVO_INVALIDO';
  end if;
  if p_desde < (ahora_bogota())::date then
    raise exception 'FECHA_PASADA';
  end if;

  -- Mismo bloqueo por día que usa `reservar`: nadie reserva mientras se cierra.
  for v_dia in select generate_series(p_desde, p_hasta, interval '1 day')::date loop
    perform pg_advisory_xact_lock(hashtext('agenda:' || v_dia));
  end loop;

  select count(*) into v_dias
  from generate_series(p_desde, p_hasta, interval '1 day') d
  where exists (select 1 from horario h where h.dia_semana = extract(isodow from d));
  if v_dias = 0 then
    raise exception 'SIN_DIAS_DE_ATENCION';
  end if;

  -- Un bloque de 2 horas son dos filas pero una sola reserva para la persona.
  select count(distinct coalesce(r.bloque_id, r.id)) into v_activas
  from reservas r join sesiones s on s.id = r.sesion_id
  where s.fecha between p_desde and p_hasta and r.estado = 'activa';

  if v_activas > 0 and not coalesce(p_cancelar, false) then
    return json_build_object('cerrado', false, 'reservas_activas', v_activas);
  end if;

  with canceladas as (
    update reservas r
    set estado = 'cancelada'
    from sesiones s
    where s.id = r.sesion_id and s.fecha between p_desde and p_hasta and r.estado = 'activa'
    returning r.sesion_id
  )
  select array_agg(distinct sesion_id) into v_sesiones from canceladas;

  insert into dias_cerrados (fecha, motivo)
  select d::date, btrim(p_motivo)
  from generate_series(p_desde, p_hasta, interval '1 day') d
  where exists (select 1 from horario h where h.dia_semana = extract(isodow from d))
  on conflict (fecha) do update set motivo = excluded.motivo;

  return json_build_object('cerrado', true, 'dias', v_dias, 'canceladas', v_activas,
                           'sesiones', coalesce(v_sesiones, '{}'));
end;
$$;

-- Vuelve a abrir un día cerrado.
create function public.abrir_dia(p_fecha date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from dias_cerrados where fecha = p_fecha;
  if not found then
    raise exception 'DIA_NO_CERRADO';
  end if;
end;
$$;

revoke execute on function public.dias_cerrados_entre(date, date) from public, anon, authenticated;
revoke execute on function public.cerrar_dias(date, date, text, boolean) from public, anon, authenticated;
revoke execute on function public.abrir_dia(date) from public, anon, authenticated;
grant execute on function public.dias_cerrados_entre(date, date) to service_role;
grant execute on function public.cerrar_dias(date, date, text, boolean) to service_role;
grant execute on function public.abrir_dia(date) to service_role;
