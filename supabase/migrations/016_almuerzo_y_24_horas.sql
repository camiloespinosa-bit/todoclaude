-- El Gimnasio del Cerebro: hora de almuerzo y anticipación de las clases presenciales.
--   1. De 12:00 m. a 2:00 p.m. no hay clases, de lunes a sábado.
--   2. Las clases presenciales (clase, bloque y clase de prueba) se reservan con al menos 24
--      horas de anticipación; las virtuales no. Aplica también al mover una clase desde el
--      panel, porque mover usa `reservar`.
-- Las reservas que ya existen de 12 a 2 no se cancelan: se revisan con la consulta del final.
--
-- Orden: 1) ejecutar este archivo, 2) publicar la página (merge). No hay que desplegar la
-- función del servidor.

delete from public.horario;
insert into public.horario (dia_semana, inicio, fin) values
  (1, 360, 720), (1, 840, 1200),                  -- lunes: 6–12 y 2–8 p.m.
  (2, 360, 720), (2, 840, 960), (2, 1140, 1200),  -- martes: 6–12, 2–4 y 7–8 p.m.
  (3, 360, 720), (3, 840, 1200),                  -- miércoles: 6–12 y 2–8 p.m.
  (4, 360, 720), (4, 840, 960), (4, 1140, 1200),  -- jueves: 6–12, 2–4 y 7–8 p.m.
  (5, 360, 720), (5, 840, 930), (5, 990, 1200),   -- viernes: 6–12, 2–3:30 y 4:30–8 p.m.
  (6, 480, 720), (6, 840, 1020);                  -- sábado: 8–12 y 2–5 p.m.

-- Misma función que en 015, con la regla de 24 horas para las clases presenciales.
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
     )
     or exists (
       select 1 from bloqueos b
       where b.fecha = p_fecha and b.inicio < p_inicio + v_duracion and b.fin > p_inicio
     ) then
    raise exception 'FUERA_DE_HORARIO';
  end if;
  if p_fecha + make_interval(mins => p_inicio) <= ahora_bogota() then
    raise exception 'HORA_PASADA';
  end if;
  -- Las clases presenciales se reservan con 24 horas de anticipación (las virtuales no).
  if p_modalidad = 'presencial' and p_fecha + make_interval(mins => p_inicio) < ahora_bogota() + interval '24 hours' then
    raise exception 'ANTICIPACION_24H';
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

-- Reservas activas desde hoy que quedaron entre 12 m. y 2 p.m. (para moverlas o cancelarlas
-- desde el panel).
select s.fecha, s.inicio / 60 as hora, s.modalidad, r.nombre
from reservas r join sesiones s on s.id = r.sesion_id
where r.estado = 'activa' and s.fecha >= (ahora_bogota())::date
  and s.inicio < 840 and s.inicio + (case when s.clase = 'grupo' then 60 else 30 end) > 720
order by s.fecha, s.inicio;
