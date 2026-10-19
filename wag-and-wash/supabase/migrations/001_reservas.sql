-- Wag & Wash: tabla de reservas y reglas de disponibilidad.
-- Reglas (ver Plan.md): lunes a sábado, baños de 1 hora que empiezan
-- entre 8 a.m. y 5 p.m., sin baños a las 12 m. (almuerzo), sin festivos,
-- 2 baños al mismo tiempo, valor $50.000.

create table public.reservas (
  id               uuid primary key default gen_random_uuid(),
  creada_en        timestamptz not null default now(),
  cliente_nombre   text not null check (char_length(btrim(cliente_nombre)) between 2 and 100),
  cliente_telefono text not null check (cliente_telefono ~ '^\+?[0-9]{10,13}$'),
  perro_nombre     text not null check (char_length(btrim(perro_nombre)) between 1 and 60),
  perro_raza       text check (perro_raza is null or char_length(perro_raza) <= 60),
  fecha            date not null,
  hora             smallint not null check (hora between 8 and 17 and hora <> 12),
  valor            integer not null default 50000,
  -- pendiente_pago: el cupo se aparta 15 minutos mientras el cliente paga.
  -- pago_reportado: el cliente dice que ya pagó; el cupo queda apartado hasta que Adriana revise.
  -- pagada / cancelada: las marca Adriana.
  estado           text not null default 'pendiente_pago'
                   check (estado in ('pendiente_pago', 'pago_reportado', 'pagada', 'cancelada')),
  expira_en        timestamptz,
  acepta_whatsapp  boolean not null default false
);

create index reservas_fecha_hora_idx on public.reservas (fecha, hora);

-- Festivos de Colombia. Varios cambian de fecha cada año, así que se cargan por año.
create table public.festivos (
  fecha  date primary key,
  nombre text not null
);

-- Nadie puede leer ni escribir las tablas directamente desde el navegador:
-- los clientes solo usan las funciones de abajo. El dashboard de Adriana
-- tendrá sus propias políticas cuando se agregue el inicio de sesión.
alter table public.reservas enable row level security;
alter table public.festivos enable row level security;

-- Una reserva ocupa cupo si está pagada, reportada o pendiente sin vencer.
create function public.reserva_activa(r public.reservas)
returns boolean
language sql
stable
set search_path = public
as $$
  select r.estado in ('pagada', 'pago_reportado')
      or (r.estado = 'pendiente_pago' and r.expira_en > now());
$$;

-- Devuelve las horas del día con los cupos libres (0, 1 o 2).
-- Si el día está cerrado (domingo o festivo) no devuelve filas.
create function public.horas_disponibles(p_fecha date)
returns table (hora smallint, cupos_libres integer)
language sql
stable
security definer
set search_path = public
as $$
  select g.h::smallint,
         (2 - count(r.id) filter (where public.reserva_activa(r)))::integer
  from generate_series(8, 17) as g(h)
  left join public.reservas r on r.fecha = p_fecha and r.hora = g.h
  where g.h <> 12
    and extract(isodow from p_fecha) <> 7
    and not exists (select 1 from public.festivos f where f.fecha = p_fecha)
    and (p_fecha + make_time(g.h, 0, 0)) > (now() at time zone 'America/Bogota')
  group by g.h
  order by g.h;
$$;

-- Crea la reserva si hay cupo. El bloqueo evita que dos personas
-- tomen el último cupo de la misma hora al mismo tiempo.
create function public.crear_reserva(
  p_cliente_nombre   text,
  p_cliente_telefono text,
  p_perro_nombre     text,
  p_perro_raza       text,
  p_fecha            date,
  p_hora             smallint,
  p_acepta_whatsapp  boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ocupados integer;
  v_id       uuid;
  v_expira   timestamptz;
begin
  if p_hora is null or p_hora < 8 or p_hora > 17 or p_hora = 12 then
    raise exception 'HORA_INVALIDA';
  end if;
  if extract(isodow from p_fecha) = 7
     or exists (select 1 from festivos where fecha = p_fecha) then
    raise exception 'DIA_CERRADO';
  end if;
  if (p_fecha + make_time(p_hora, 0, 0)) <= (now() at time zone 'America/Bogota') then
    raise exception 'HORA_PASADA';
  end if;

  perform pg_advisory_xact_lock(hashtext('reserva:' || p_fecha || ':' || p_hora));

  select count(*) into v_ocupados
  from reservas r
  where r.fecha = p_fecha and r.hora = p_hora and reserva_activa(r);

  if v_ocupados >= 2 then
    raise exception 'SIN_CUPO';
  end if;

  insert into reservas (cliente_nombre, cliente_telefono, perro_nombre, perro_raza,
                        fecha, hora, acepta_whatsapp, expira_en)
  values (btrim(p_cliente_nombre), p_cliente_telefono, btrim(p_perro_nombre),
          nullif(btrim(p_perro_raza), ''), p_fecha, p_hora,
          coalesce(p_acepta_whatsapp, false), now() + interval '15 minutes')
  returning id, expira_en into v_id, v_expira;

  return json_build_object('id', v_id, 'expira_en', v_expira);
end;
$$;

-- El cliente avisa que ya pagó. El cupo queda apartado hasta que Adriana revise.
create function public.reportar_pago(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update reservas
  set estado = 'pago_reportado', expira_en = null
  where id = p_id and estado = 'pendiente_pago' and expira_en > now();

  if not found then
    raise exception 'RESERVA_VENCIDA';
  end if;
end;
$$;

revoke execute on function public.horas_disponibles(date) from public;
revoke execute on function public.crear_reserva(text, text, text, text, date, smallint, boolean) from public;
revoke execute on function public.reportar_pago(uuid) from public;
grant execute on function public.horas_disponibles(date) to anon, authenticated;
grant execute on function public.crear_reserva(text, text, text, text, date, smallint, boolean) to anon, authenticated;
grant execute on function public.reportar_pago(uuid) to anon, authenticated;
