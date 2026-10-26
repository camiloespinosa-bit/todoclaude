-- El Gimnasio del Cerebro: reservas de clases.
-- Reglas (ver reservas/README.md):
--   * Un solo docente. Las clases son grupos de 1 hora que empiezan en punto; todos los
--     que reservan esa hora entran al mismo grupo, hasta 5 estudiantes.
--   * El primero que reserva una hora define si el grupo es presencial o virtual.
--   * Un bloque son 2 horas seguidas: una reserva en cada uno de los dos grupos.
--   * La clase de prueba es gratis, dura 30 minutos, es para una familia o grupo de
--     hasta 5 personas, y solo cabe en horas sin grupo. Mientras haya una prueba, esa
--     hora queda bloqueada para clases.
-- Las horas se guardan como minutos desde medianoche, hora de Colombia (480 = 8:00 a.m.).

-- ---------- Tablas ----------

-- Horario de atención por día (1 = lunes ... 7 = domingo). Un día puede tener varias franjas.
create table public.horario (
  dia_semana smallint not null check (dia_semana between 1 and 7),
  inicio     smallint not null check (inicio between 0 and 1440 and inicio % 30 = 0),
  fin        smallint not null check (fin between 0 and 1440 and fin % 30 = 0),
  primary key (dia_semana, inicio),
  check (inicio < fin)
);

insert into public.horario (dia_semana, inicio, fin) values
  (1, 480, 780),                  -- lunes 8 a.m. a 1 p.m.
  (2, 480, 720), (2, 780, 960),   -- martes 8–12 y 1–4
  (3, 480, 720), (3, 780, 1140),  -- miércoles 8–12 y 1–7
  (4, 480, 720), (4, 780, 960),   -- jueves 8–12 y 1–4
  (5, 480, 720),                  -- viernes 8–12
  (6, 480, 720), (6, 780, 1020);  -- sábado 8–12 y 1–5

-- Festivos de Colombia (varios cambian cada año, se cargan por año) y días que el
-- docente bloquea (vacaciones, imprevistos). Ese día no se puede reservar.
create table public.dias_cerrados (
  fecha  date primary key,
  motivo text not null
);

-- Una sesión es lo que el docente dicta: un grupo de 1 hora o una clase de prueba de 30 min.
-- Corresponde a un evento en Google Calendar.
create table public.sesiones (
  id              uuid primary key default gen_random_uuid(),
  fecha           date not null,
  inicio          smallint not null,
  clase           text not null check (clase in ('grupo', 'prueba')),
  modalidad       text not null check (modalidad in ('presencial', 'virtual')),
  google_event_id text,
  enlace_meet     text,
  creada_en       timestamptz not null default now(),
  check ((clase = 'grupo' and inicio % 60 = 0) or (clase = 'prueba' and inicio % 30 = 0))
);

create index sesiones_fecha_idx on public.sesiones (fecha, inicio);

create table public.reservas (
  id              uuid primary key default gen_random_uuid(),
  creada_en       timestamptz not null default now(),
  sesion_id       uuid not null references public.sesiones (id),
  tipo            text not null check (tipo in ('prueba', 'clase', 'bloque')),
  -- Las dos horas de un bloque comparten este id.
  bloque_id       uuid,
  nombre          text not null check (char_length(btrim(nombre)) between 2 and 100),
  telefono        text not null check (telefono ~ '^\+?[0-9]{10,13}$'),
  correo          text not null check (char_length(correo) <= 200 and correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  programa        text check (programa is null or char_length(programa) <= 100),
  personas        smallint not null default 1 check (personas between 1 and 5),
  acepta_whatsapp boolean not null default false,
  estado          text not null default 'activa' check (estado in ('activa', 'cancelada'))
);

create index reservas_sesion_idx on public.reservas (sesion_id) where estado = 'activa';

-- Nadie lee ni escribe las tablas directamente desde el navegador: solo por las funciones.
alter table public.horario enable row level security;
alter table public.dias_cerrados enable row level security;
alter table public.sesiones enable row level security;
alter table public.reservas enable row level security;

-- ---------- Funciones auxiliares ----------

create function public.ahora_bogota()
returns timestamp
language sql
stable
as $$
  select now() at time zone 'America/Bogota';
$$;

-- Personas con reserva activa en una sesión.
create function public.ocupados(p_sesion uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(personas), 0)::integer
  from reservas
  where sesion_id = p_sesion and estado = 'activa';
$$;

-- La sesión activa (con al menos una reserva activa) de esa fecha, hora y clase, si hay.
create function public.sesion_activa(p_fecha date, p_inicio smallint, p_clase text)
returns public.sesiones
language sql
stable
set search_path = public
as $$
  select s.*
  from sesiones s
  where s.fecha = p_fecha and s.inicio = p_inicio and s.clase = p_clase
    and ocupados(s.id) > 0
  order by s.creada_en
  limit 1;
$$;

-- ---------- Funciones públicas (las usa la página) ----------

-- Días abiertos y sus franjas entre dos fechas. Excluye festivos y días bloqueados.
create function public.dias_abiertos(p_desde date, p_hasta date)
returns table (fecha date, inicio smallint, fin smallint)
language sql
stable
security definer
set search_path = public
as $$
  select d::date, h.inicio, h.fin
  from generate_series(p_desde, least(p_hasta, p_desde + 62), interval '1 day') as d
  join horario h on h.dia_semana = extract(isodow from d)
  where not exists (select 1 from dias_cerrados c where c.fecha = d::date)
  order by 1, 2;
$$;

-- Lo que ya está ocupado ese día, sin datos personales.
create function public.agenda_publica(p_fecha date)
returns table (inicio smallint, clase text, modalidad text, ocupados integer)
language sql
stable
security definer
set search_path = public
as $$
  select s.inicio, s.clase, s.modalidad, ocupados(s.id)
  from sesiones s
  where s.fecha = p_fecha and ocupados(s.id) > 0
  order by s.inicio;
$$;

-- ---------- Reservar (solo desde la función del servidor, no desde el navegador) ----------

-- Crea la reserva si cumple las reglas. Devuelve los ids de las sesiones tocadas,
-- para que el servidor las sincronice con Google Calendar.
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
  p_acepta_whatsapp boolean
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

    insert into reservas (sesion_id, tipo, nombre, telefono, correo, programa, personas, acepta_whatsapp)
    values (v_sesion.id, 'prueba', btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
            nullif(btrim(p_programa), ''), p_personas, coalesce(p_acepta_whatsapp, false));

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

      insert into reservas (sesion_id, tipo, bloque_id, nombre, telefono, correo, programa, acepta_whatsapp)
      values (v_sesion.id, p_tipo, v_bloque, btrim(p_nombre), p_telefono, lower(btrim(p_correo)),
              nullif(btrim(p_programa), ''), coalesce(p_acepta_whatsapp, false));

      v_sesiones := array_append(v_sesiones, v_sesion.id);
    end loop;
  end if;

  return json_build_object('sesiones', v_sesiones);
end;
$$;

-- El servidor guarda el evento de Google Calendar y el enlace de Meet de cada sesión.
create function public.guardar_evento(p_sesion uuid, p_evento text, p_meet text)
returns void
language sql
security definer
set search_path = public
as $$
  update sesiones set google_event_id = p_evento, enlace_meet = coalesce(p_meet, enlace_meet)
  where id = p_sesion;
$$;

-- Lo que el servidor necesita para armar el evento: la sesión y sus asistentes activos.
create function public.detalle_sesion(p_sesion uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', s.id, 'fecha', s.fecha, 'inicio', s.inicio, 'clase', s.clase,
    'modalidad', s.modalidad, 'enlace_meet', s.enlace_meet,
    'asistentes', coalesce((
      select json_agg(json_build_object('nombre', r.nombre, 'correo', r.correo,
                                        'personas', r.personas, 'programa', r.programa)
                      order by r.creada_en)
      from reservas r where r.sesion_id = s.id and r.estado = 'activa'
    ), '[]'::json)
  )
  from sesiones s where s.id = p_sesion;
$$;

-- ---------- Permisos ----------

revoke execute on function public.ahora_bogota() from public, anon, authenticated;
revoke execute on function public.ocupados(uuid) from public, anon, authenticated;
revoke execute on function public.sesion_activa(date, smallint, text) from public, anon, authenticated;
revoke execute on function public.dias_abiertos(date, date) from public;
revoke execute on function public.agenda_publica(date) from public;
revoke execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean) from public, anon, authenticated;
revoke execute on function public.guardar_evento(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.detalle_sesion(uuid) from public, anon, authenticated;
grant execute on function public.dias_abiertos(date, date) to anon, authenticated;
grant execute on function public.agenda_publica(date) to anon, authenticated;
grant execute on function public.reservar(text, text, date, smallint, text, text, text, text, smallint, boolean) to service_role;
grant execute on function public.guardar_evento(uuid, text, text) to service_role;
grant execute on function public.detalle_sesion(uuid) to service_role;
