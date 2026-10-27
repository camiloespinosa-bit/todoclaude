-- El Gimnasio del Cerebro: prueba de la autorización de datos en cada reserva.
-- La Ley 1581 de 2012 exige poder demostrar la autorización del titular. Cada reserva guarda
-- la versión de la política de privacidad que la persona aceptó (la fecha y hora ya quedan
-- en `creada_en`).
--
-- Orden para aplicarlo sin cortar las reservas:
--   1. Ejecutar este archivo en el SQL Editor (la función acepta el dato nuevo, pero aún no
--      lo exige, para que la versión anterior de la función del servidor siga funcionando).
--   2. Publicar la página nueva (envía la versión de la política).
--   3. Desplegar la función del servidor nueva (rechaza reservas sin autorización).

alter table public.reservas
  add column politica_version text check (politica_version is null or char_length(politica_version) <= 20);

-- Misma función que en 001, con el parámetro nuevo al final.
drop function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean);

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
  p_politica        text default null
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
begin
  v_duracion := case p_tipo when 'prueba' then 30 when 'clase' then 60 when 'bloque' then 120 end;
  if v_duracion is null then
    raise exception 'TIPO_INVALIDO';
  end if;
  if p_modalidad is null or p_modalidad not in ('presencial', 'virtual') then
    raise exception 'MODALIDAD_INVALIDA';
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
  -- o abran grupos de distinta modalidad a la misma hora.
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

    insert into reservas (sesion_id, tipo, nombre, telefono, correo, programa, personas, acepta_whatsapp, politica_version)
    values (v_sesion.id, 'prueba', btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
            nullif(btrim(p_programa), ''), p_personas, coalesce(p_acepta_whatsapp, false), p_politica);

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
      elsif ocupados(v_sesion.id) >= 5 then
        raise exception 'SIN_CUPO';
      elsif exists (
        select 1 from reservas r
        where r.sesion_id = v_sesion.id and r.estado = 'activa' and r.correo = lower(btrim(p_correo))
      ) then
        raise exception 'YA_RESERVADO';
      end if;

      insert into reservas (sesion_id, tipo, bloque_id, nombre, telefono, correo, programa, acepta_whatsapp, politica_version)
      values (v_sesion.id, p_tipo, v_bloque, btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
              nullif(btrim(p_programa), ''), coalesce(p_acepta_whatsapp, false), p_politica);

      v_sesiones := array_append(v_sesiones, v_sesion.id);
    end loop;
  end if;

  return json_build_object('sesiones', v_sesiones);
end;
$$;

revoke execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean, text) from public, anon, authenticated;
grant execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean, text) to service_role;

-- El panel muestra qué versión aceptó cada persona.
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
        'politica_version', r.politica_version
      ) order by r.creada_en)
      from reservas r where r.sesion_id = s.id and r.estado = 'activa'
    )
  ) order by s.fecha, s.inicio), '[]'::json)
  from sesiones s
  where s.fecha between p_desde and least(p_hasta, p_desde + 62)
    and ocupados(s.id) > 0;
$$;
