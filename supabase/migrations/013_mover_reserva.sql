-- El Gimnasio del Cerebro: mover la reserva de un estudiante a otro día u hora desde el panel.
-- Mover es cancelar la reserva y volver a reservar con los mismos datos, en un solo paso: si
-- la nueva hora no cumple las reglas (lleno, otra fase, otra modalidad, cerrado...), no
-- cambia nada. En un bloque de 2 horas se mueven las dos horas. La reserva nueva conserva
-- la serie.
-- Requiere 012. Solo lo ejecuta el servidor, después de confirmar que quien llama es docente.

create function public.mover_reserva(p_reserva uuid, p_fecha date, p_inicio smallint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva   reservas;
  v_modalidad text;
  v_primera   sesiones;
  v_anteriores uuid[];
  v_nueva     json;
begin
  select * into v_reserva from reservas where id = p_reserva;
  if v_reserva.id is null then
    raise exception 'RESERVA_NO_EXISTE';
  end if;
  if v_reserva.estado <> 'activa' then
    raise exception 'RESERVA_YA_CANCELADA';
  end if;

  -- Primera hora de la reserva (en un bloque, la más temprana).
  select s.* into v_primera
  from reservas r join sesiones s on s.id = r.sesion_id
  where r.estado = 'activa' and coalesce(r.bloque_id, r.id) = coalesce(v_reserva.bloque_id, v_reserva.id)
  order by s.fecha, s.inicio
  limit 1;
  v_modalidad := v_primera.modalidad;
  if v_primera.fecha = p_fecha and v_primera.inicio = p_inicio then
    raise exception 'MISMO_HORARIO';
  end if;

  with canceladas as (
    update reservas
    set estado = 'cancelada'
    where estado = 'activa' and coalesce(bloque_id, id) = coalesce(v_reserva.bloque_id, v_reserva.id)
    returning sesion_id
  )
  select array_agg(distinct sesion_id) into v_anteriores from canceladas;

  v_nueva := reservar(v_reserva.tipo, v_modalidad, p_fecha, p_inicio, v_reserva.nombre,
                      v_reserva.telefono, v_reserva.correo, v_reserva.programa, v_reserva.personas,
                      v_reserva.acepta_whatsapp, v_reserva.politica_version, v_reserva.serie_id);

  return json_build_object(
    'desde', json_build_object('fecha', v_primera.fecha, 'inicio', v_primera.inicio),
    'sesiones', (select array_agg(distinct x) from unnest(v_anteriores || array(select json_array_elements_text(v_nueva -> 'sesiones')::uuid)) x)
  );
end;
$$;

-- Esta reserva y las siguientes de su serie que son el mismo día de la semana y a la misma
-- hora (por ejemplo, todos los martes 3 p.m. desde esta fecha). Una por reserva (en un
-- bloque, la primera hora).
create function public.serie_siguientes(p_reserva uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with esta as (
    select r.serie_id, s.fecha, s.inicio
    from reservas r join sesiones s on s.id = r.sesion_id
    where r.id = p_reserva and r.estado = 'activa'
  ),
  primeras as (
    select distinct on (coalesce(r.bloque_id, r.id)) r.id, s.fecha, s.inicio
    from reservas r join sesiones s on s.id = r.sesion_id, esta
    where r.estado = 'activa'
      and (r.id = p_reserva or (esta.serie_id is not null and r.serie_id = esta.serie_id))
    order by coalesce(r.bloque_id, r.id), s.fecha, s.inicio
  )
  select coalesce(json_agg(json_build_object('id', p.id, 'fecha', p.fecha, 'inicio', p.inicio) order by p.fecha), '[]'::json)
  from primeras p, esta
  where p.fecha >= esta.fecha
    and extract(isodow from p.fecha) = extract(isodow from esta.fecha)
    and p.inicio = esta.inicio;
$$;

revoke execute on function public.mover_reserva(uuid, date, smallint) from public, anon, authenticated;
revoke execute on function public.serie_siguientes(uuid) from public, anon, authenticated;
grant execute on function public.mover_reserva(uuid, date, smallint) to service_role;
grant execute on function public.serie_siguientes(uuid) to service_role;
