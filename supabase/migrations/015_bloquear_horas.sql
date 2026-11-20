-- El Gimnasio del Cerebro: bloquear solo unas horas de un día (desplazamientos, citas...).
-- Los días completos se siguen cerrando con dias_cerrados (004). Las horas bloqueadas no se
-- muestran en la página de reservas ni en el panel, y `reservar` no deja reservar en ellas.
-- Si ya hay reservas en esas horas, el panel pregunta antes de cancelarlas.
--
-- Orden: 1) ejecutar este archivo, 2) desplegar la función `reservar` nueva, 3) publicar la
-- página (merge).

create table public.bloqueos (
  id        uuid primary key default gen_random_uuid(),
  fecha     date not null,
  inicio    smallint not null,
  fin       smallint not null,
  motivo    text not null check (char_length(btrim(motivo)) between 2 and 100),
  creado_en timestamptz not null default now(),
  check (inicio >= 0 and fin <= 1440 and inicio < fin and inicio % 30 = 0 and fin % 30 = 0)
);
create index bloqueos_fecha_idx on public.bloqueos (fecha);
alter table public.bloqueos enable row level security;

-- Igual que en 001, pero sin las horas bloqueadas: cada franja se parte en medias horas,
-- se quitan las bloqueadas y las que quedan seguidas se vuelven a juntar.
create or replace function public.dias_abiertos(p_desde date, p_hasta date)
returns table (fecha date, inicio smallint, fin smallint)
language sql
stable
security definer
set search_path = public
as $$
  with franjas as (
    select d::date as fecha, h.inicio, h.fin
    from generate_series(p_desde, least(p_hasta, p_desde + 62), interval '1 day') as d
    join horario h on h.dia_semana = extract(isodow from d)
    where not exists (select 1 from dias_cerrados c where c.fecha = d::date)
  ),
  medias as (
    select f.fecha, m as inicio
    from franjas f, generate_series(f.inicio::int, f.fin::int - 30, 30) as m
    where not exists (
      select 1 from bloqueos b where b.fecha = f.fecha and b.inicio < m + 30 and b.fin > m
    )
  ),
  islas as (
    select fecha, inicio, inicio - 30 * row_number() over (partition by fecha order by inicio) as isla
    from medias
  )
  select fecha, min(inicio)::smallint, (max(inicio) + 30)::smallint
  from islas
  group by fecha, isla
  order by 1, 2;
$$;

-- Misma función que en 012, sin dejar reservar en horas bloqueadas.
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

-- Horas bloqueadas entre dos fechas (hasta 400 días), para el panel.
create function public.bloqueos_entre(p_desde date, p_hasta date)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object('id', id, 'fecha', fecha, 'inicio', inicio, 'fin', fin, 'motivo', motivo)
                           order by fecha, inicio), '[]'::json)
  from bloqueos
  where fecha between p_desde and least(p_hasta, p_desde + 400);
$$;

-- Bloquea unas horas de un día. Si hay reservas activas en esas horas no bloquea nada y
-- devuelve cuántas hay, salvo que p_cancelar sea verdadero: entonces las cancela (en un
-- bloque de 2 horas, las dos) y devuelve las sesiones afectadas, para Google Calendar.
create function public.cerrar_horas(p_fecha date, p_inicio smallint, p_fin smallint, p_motivo text, p_cancelar boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claves   uuid[];
  v_activas  integer;
  v_sesiones uuid[];
  v_id       uuid;
begin
  if p_fecha is null or p_inicio is null or p_fin is null or p_inicio >= p_fin
     or p_inicio < 0 or p_fin > 1440 or p_inicio % 30 <> 0 or p_fin % 30 <> 0 then
    raise exception 'RANGO_INVALIDO';
  end if;
  if p_motivo is null or char_length(btrim(p_motivo)) not between 2 and 100 then
    raise exception 'MOTIVO_INVALIDO';
  end if;
  if p_fecha < (ahora_bogota())::date then
    raise exception 'FECHA_PASADA';
  end if;

  -- Mismo bloqueo por día que usa `reservar`: nadie reserva mientras se bloquea.
  perform pg_advisory_xact_lock(hashtext('agenda:' || p_fecha));

  -- Reservas cuyas clases se cruzan con esas horas (un bloque de 2 horas cuenta una vez).
  select array_agg(distinct coalesce(r.bloque_id, r.id)) into v_claves
  from reservas r join sesiones s on s.id = r.sesion_id
  where r.estado = 'activa' and s.fecha = p_fecha
    and s.inicio < p_fin
    and s.inicio + (case when s.clase = 'grupo' then 60 else 30 end) > p_inicio;
  v_activas := coalesce(array_length(v_claves, 1), 0);

  if v_activas > 0 and not coalesce(p_cancelar, false) then
    return json_build_object('cerrado', false, 'reservas_activas', v_activas);
  end if;

  with canceladas as (
    update reservas r
    set estado = 'cancelada'
    where r.estado = 'activa' and coalesce(r.bloque_id, r.id) = any (v_claves)
    returning r.sesion_id
  )
  select array_agg(distinct sesion_id) into v_sesiones from canceladas;

  insert into bloqueos (fecha, inicio, fin, motivo)
  values (p_fecha, p_inicio, p_fin, btrim(p_motivo))
  returning id into v_id;

  return json_build_object('cerrado', true, 'id', v_id, 'canceladas', v_activas,
                           'sesiones', coalesce(v_sesiones, '{}'));
end;
$$;

-- Quita un bloqueo de horas.
create function public.abrir_horas(p_bloqueo uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from bloqueos where id = p_bloqueo;
  if not found then
    raise exception 'BLOQUEO_NO_EXISTE';
  end if;
end;
$$;

revoke execute on function public.bloqueos_entre(date, date) from public, anon, authenticated;
revoke execute on function public.cerrar_horas(date, smallint, smallint, text, boolean) from public, anon, authenticated;
revoke execute on function public.abrir_horas(uuid) from public, anon, authenticated;
grant execute on function public.bloqueos_entre(date, date) to service_role;
grant execute on function public.cerrar_horas(date, smallint, smallint, text, boolean) to service_role;
grant execute on function public.abrir_horas(uuid) to service_role;
