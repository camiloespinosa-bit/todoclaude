-- El Gimnasio del Cerebro: reservar varias clases de una vez (varios días y repetir 4 semanas).
-- La página manda la lista de clases; la función del servidor reserva una por una con
-- `reservar` (las reglas son las mismas) y todas comparten un serie_id. Así el panel manda
-- una sola confirmación por WhatsApp con todas las fechas.
--
-- Orden: 1) ejecutar este archivo, 2) desplegar la función `reservar` nueva, 3) publicar la
-- página (merge).

alter table public.reservas add column if not exists serie_id uuid;

-- Misma función que en 010, con el parámetro p_serie al final.
drop function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean, text);

create function public.reservar(
  p_tipo            text,
  p_modalidad       text,
  p_fecha           date,
  p_inicio          smallint,
  p_nombre          text,
  p_telefono        text,
  p_correo          text,
  p_programa        text,
  p_personas        smallint,
  p_acepta_whatsapp boolean,
  p_politica        text default null,
  p_serie           uuid default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duracion smallint;
  v_hora     smallint;
  v_sesion   sesiones;
  v_bloque   uuid;
  v_sesiones uuid[] := '{}';
  v_fase     text := fase_de_programa(btrim(p_programa));
begin
  v_duracion := case p_tipo when 'prueba' then 30 when 'clase' then 60 when 'bloque' then 120 end;
  if v_duracion is null then
    raise exception 'TIPO_INVALIDO';
  end if;
  if p_modalidad is null or p_modalidad not in ('presencial', 'virtual') then
    raise exception 'MODALIDAD_INVALIDA';
  end if;
  if v_fase is null then
    raise exception 'PROGRAMA_INVALIDO';
  end if;
  if p_inicio is null or p_inicio % (case when p_tipo = 'prueba' then 30 else 60 end) <> 0 then
    raise exception 'HORA_INVALIDA';
  end if;
  if p_tipo <> 'prueba' and coalesce(p_personas, 1) <> 1 then
    raise exception 'PERSONAS_INVALIDAS';
  end if;
  if p_tipo = 'prueba' and (p_personas is null or p_personas not between 1 and 5) then
    raise exception 'PERSONAS_INVALIDAS';
  end if;
  if p_fecha is null or p_fecha > (ahora_bogota())::date + 60 then
    raise exception 'FECHA_INVALIDA';
  end if;
  if exists (select 1 from dias_cerrados c where c.fecha = p_fecha)
     or not exists (
       select 1 from horario h
       where h.dia_semana = extract(isodow from p_fecha)
         and p_inicio >= h.inicio and p_inicio + v_duracion <= h.fin
     ) then
    raise exception 'FUERA_DE_HORARIO';
  end if;
  if p_fecha + make_interval(mins => p_inicio) <= ahora_bogota() then
    raise exception 'HORA_PASADA';
  end if;

  -- Un solo cambio a la vez por día: evita que dos personas tomen el último cupo
  -- o abran grupos de distinta modalidad o fase a la misma hora.
  perform pg_advisory_xact_lock(hashtext('agenda:' || p_fecha));

  if p_tipo = 'prueba' then
    v_hora := p_inicio - p_inicio % 60;
    if (sesion_activa(p_fecha, v_hora, 'grupo')).id is not null
       or (sesion_activa(p_fecha, p_inicio, 'prueba')).id is not null then
      raise exception 'HORA_OCUPADA';
    end if;

    insert into sesiones (fecha, inicio, clase, modalidad)
    values (p_fecha, p_inicio, 'prueba', p_modalidad)
    returning * into v_sesion;

    insert into reservas (sesion_id, tipo, nombre, telefono, correo, programa, personas, acepta_whatsapp, politica_version, serie_id)
    values (v_sesion.id, 'prueba', btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
            btrim(p_programa), p_personas, coalesce(p_acepta_whatsapp, false), p_politica, p_serie);

    v_sesiones := array_append(v_sesiones, v_sesion.id);
  else
    if p_tipo = 'bloque' then
      v_bloque := gen_random_uuid();
    end if;

    for v_hora in select generate_series(p_inicio, p_inicio + v_duracion - 60, 60) loop
      if (sesion_activa(p_fecha, v_hora, 'prueba')).id is not null
         or (sesion_activa(p_fecha, (v_hora + 30)::smallint, 'prueba')).id is not null then
        raise exception 'HORA_OCUPADA';
      end if;

      v_sesion := sesion_activa(p_fecha, v_hora, 'grupo');
      if v_sesion.id is null then
        insert into sesiones (fecha, inicio, clase, modalidad)
        values (p_fecha, v_hora, 'grupo', p_modalidad)
        returning * into v_sesion;
      elsif v_sesion.modalidad <> p_modalidad then
        raise exception 'OTRA_MODALIDAD';
      elsif fase_de_sesion(v_sesion.id) is distinct from v_fase then
        raise exception 'OTRA_FASE';
      elsif ocupados(v_sesion.id) >= 5 then
        raise exception 'SIN_CUPO';
      elsif exists (
        select 1 from reservas r
        where r.sesion_id = v_sesion.id and r.estado = 'activa' and r.correo = lower(btrim(p_correo))
      ) then
        raise exception 'YA_RESERVADO';
      end if;

      insert into reservas (sesion_id, tipo, bloque_id, nombre, telefono, correo, programa, acepta_whatsapp, politica_version, serie_id)
      values (v_sesion.id, p_tipo, v_bloque, btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
              btrim(p_programa), coalesce(p_acepta_whatsapp, false), p_politica, p_serie);

      v_sesiones := array_append(v_sesiones, v_sesion.id);
    end loop;
  end if;

  return json_build_object('sesiones', v_sesiones);
end;
$$;

revoke execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean, text, uuid) to service_role;

-- Confirmar una reserva de una serie confirma toda la serie (un solo mensaje).
create or replace function public.marcar_aviso(p_reserva uuid, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clave uuid;
  v_serie uuid;
begin
  if p_tipo not in ('confirmacion', 'recordatorio') then
    raise exception 'TIPO_INVALIDO';
  end if;

  select coalesce(bloque_id, id), serie_id into v_clave, v_serie
  from reservas where id = p_reserva and estado = 'activa' and acepta_whatsapp;
  if v_clave is null then
    raise exception 'RESERVA_NO_EXISTE';
  end if;

  update reservas
  set whatsapp_confirmacion_en = case when p_tipo = 'confirmacion' then now() else whatsapp_confirmacion_en end,
      whatsapp_recordatorio_en = case when p_tipo = 'recordatorio' then now() else whatsapp_recordatorio_en end
  where estado = 'activa'
    and (coalesce(bloque_id, id) = v_clave
         or (p_tipo = 'confirmacion' and v_serie is not null and serie_id = v_serie));
end;
$$;

-- La agenda del panel incluye la serie de cada reserva: sus fechas activas (en un bloque,
-- solo la primera hora), para armar el mensaje de confirmación.
create or replace function public.panel_agenda(p_desde date, p_hasta date)
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
        'personas', r.personas, 'acepta_whatsapp', r.acepta_whatsapp, 'creada_en', r.creada_en,
        'politica_version', r.politica_version,
        'whatsapp_confirmacion_en', r.whatsapp_confirmacion_en,
        'whatsapp_recordatorio_en', r.whatsapp_recordatorio_en,
        'serie_id', r.serie_id,
        'serie', case when r.serie_id is null then null else (
          select json_agg(json_build_object('fecha', x.fecha, 'inicio', x.inicio) order by x.fecha, x.inicio)
          from (
            select distinct on (coalesce(r2.bloque_id, r2.id)) s2.fecha, s2.inicio
            from reservas r2 join sesiones s2 on s2.id = r2.sesion_id
            where r2.serie_id = r.serie_id and r2.estado = 'activa'
            order by coalesce(r2.bloque_id, r2.id), s2.fecha, s2.inicio
          ) x
        ) end
      ) order by r.creada_en)
      from reservas r where r.sesion_id = s.id and r.estado = 'activa'
    )
  ) order by s.fecha, s.inicio), '[]'::json)
  from sesiones s
  where s.fecha between p_desde and least(p_hasta, p_desde + 62)
    and ocupados(s.id) > 0;
$$;
