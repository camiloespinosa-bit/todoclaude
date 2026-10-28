-- El Gimnasio del Cerebro: cada grupo es de una sola fase.
-- Fases: 0 a 2 años, 3 a 5, 6 a 10, 11 a 15, Fase Experta (16 en adelante y adultos) y
-- Adulto Vital (65+). El primero que reserva una hora define la fase del grupo; los demás
-- solo pueden unirse si son de la misma fase (igual que con presencial o virtual).
--
-- Las reservas hechas antes con "Programa infantil (0 a 15 años)" no dicen la edad: esos
-- grupos quedan como "infantil" y nadie más se puede unir a ellos desde la página.
--
-- Orden: 1) ejecutar este archivo, 2) publicar la página (merge). No hay que desplegar la
-- función del servidor.

-- Fase de un programa, tal como lo envía la página.
create function public.fase_de_programa(p_programa text)
returns text
language sql
immutable
as $$
  select case
    when p_programa like 'Fase 0 a 2 años%'   then 'f0_2'
    when p_programa like 'Fase 3 a 5 años%'   then 'f3_5'
    when p_programa like 'Fase 6 a 10 años%'  then 'f6_10'
    when p_programa like 'Fase 11 a 15 años%' then 'f11_15'
    when p_programa like 'Fase Experta%'      then 'experta'
    when p_programa like 'Adulto Vital%'      then 'vital'
    when p_programa like 'Programa infantil%' then 'infantil'
  end;
$$;

-- Fase de un grupo: la de la primera reserva activa.
create function public.fase_de_sesion(p_sesion uuid)
returns text
language sql
stable
set search_path = public
as $$
  select fase_de_programa(r.programa)
  from reservas r
  where r.sesion_id = p_sesion and r.estado = 'activa'
  order by r.creada_en
  limit 1;
$$;

-- La página necesita la fase de cada grupo para mostrar qué horas están libres.
-- Sigue sin datos personales.
drop function public.agenda_publica(date);
create function public.agenda_publica(p_fecha date)
returns table (inicio smallint, clase text, modalidad text, ocupados integer, fase text)
language sql
stable
security definer
set search_path = public
as $$
  select s.inicio, s.clase, s.modalidad, ocupados(s.id), fase_de_sesion(s.id)
  from sesiones s
  where s.fecha = p_fecha and ocupados(s.id) > 0
  order by s.inicio;
$$;
revoke execute on function public.agenda_publica(date) from public;
grant execute on function public.agenda_publica(date) to anon, authenticated;

-- Misma función que en 003, con la regla de la fase.
create or replace function public.reservar(
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

    insert into reservas (sesion_id, tipo, nombre, telefono, correo, programa, personas, acepta_whatsapp, politica_version)
    values (v_sesion.id, 'prueba', btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
            btrim(p_programa), p_personas, coalesce(p_acepta_whatsapp, false), p_politica);

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

      insert into reservas (sesion_id, tipo, bloque_id, nombre, telefono, correo, programa, acepta_whatsapp, politica_version)
      values (v_sesion.id, p_tipo, v_bloque, btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
              btrim(p_programa), coalesce(p_acepta_whatsapp, false), p_politica);

      v_sesiones := array_append(v_sesiones, v_sesion.id);
    end loop;
  end if;

  return json_build_object('sesiones', v_sesiones);
end;
$$;
