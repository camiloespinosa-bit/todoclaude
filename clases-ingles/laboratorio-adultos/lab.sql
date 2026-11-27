-- English Lab (adultos): registro de clase por estudiante y por estructura.
-- Pegar completo en Supabase > SQL Editor > Run. Se puede correr varias veces sin problema.
-- Va en el mismo proyecto que saga.sql y usa el mismo token del profe (tabla saga_config).
-- Si saga.sql todavía no se ha corrido, este archivo crea saga_config con el mismo hash.
--
-- Seguridad:
--  * La tabla queda cerrada (RLS sin políticas): la llave pública no puede leerla ni escribirla.
--  * Las 3 funciones piden el token del profe (sale de la clave del profe): sin él no se lee ni se escribe nada.
--  * No se guardan nombres: la estudiante es un código corto (PA = Paula, LU = Luisa).

create table if not exists public.saga_config (k text primary key, v text not null);
alter table public.saga_config enable row level security;
insert into public.saga_config (k, v) values ('teacher_token_sha256', '311384dadec2f57f2cd3f752a1cdc2b7ec16ca4db1334ae8ec86cd9a4cf37250')
  on conflict (k) do update set v = excluded.v;
revoke all on public.saga_config from anon, authenticated;

create table if not exists public.lab_events (
  id          text primary key,              -- lo genera la página (permite reintentar sin duplicar)
  student     text not null,                 -- código corto: PA, LU...
  session     date not null,                 -- día de la clase
  kind        text not null,                 -- round | note
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists lab_events_student_idx on public.lab_events (student, session);
alter table public.lab_events enable row level security;
revoke all on public.lab_events from anon, authenticated;

create or replace function public.lab_ok(p_token text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_token is not null and encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
         = (select v from saga_config where k = 'teacher_token_sha256')
$$;
revoke all on function public.lab_ok(text) from public, anon, authenticated;

create or replace function public.lab_add(
  p_token text, p_id text, p_student text, p_session date, p_kind text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not lab_ok(p_token) then raise exception 'lab_add: not allowed'; end if;
  if p_id is null or length(p_id) > 40 or p_student !~ '^[A-Z0-9]{2,6}$'
     or p_kind not in ('round', 'note') or p_data is null or pg_column_size(p_data) > 20000 then
    raise exception 'lab_add: bad input';
  end if;
  insert into lab_events (id, student, session, kind, data)
  values (p_id, p_student, p_session, p_kind, p_data)
  on conflict (id) do nothing;
end $$;

create or replace function public.lab_list(p_token text, p_student text)
returns table (id text, student text, session date, kind text, data jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not lab_ok(p_token) then raise exception 'lab_list: not allowed'; end if;
  return query
    select e.id, e.student, e.session, e.kind, e.data, e.created_at
    from lab_events e where e.student = p_student
    order by e.session, e.created_at
    limit 20000;
end $$;

create or replace function public.lab_del(p_token text, p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not lab_ok(p_token) then raise exception 'lab_del: not allowed'; end if;
  delete from lab_events where id = p_id;
end $$;

revoke all on function public.lab_add(text, text, text, date, text, jsonb) from public;
revoke all on function public.lab_list(text, text) from public;
revoke all on function public.lab_del(text, text) from public;
grant execute on function public.lab_add(text, text, text, date, text, jsonb) to anon, authenticated;
grant execute on function public.lab_list(text, text) to anon, authenticated;
grant execute on function public.lab_del(text, text) to anon, authenticated;

-- ---------- Vista de progreso de la estudiante (progreso.html) ----------
-- Cada estudiante tiene un enlace secreto: progreso.html#PA.<llave>. Aquí solo se guarda la huella SHA-256
-- de esa llave. El profe crea o cambia el enlace (el anterior deja de funcionar); la estudiante solo puede
-- leer sus propios registros, nunca escribir ni ver los de otra.
create table if not exists public.lab_views (
  student     text primary key,
  key_sha256  text not null,
  updated_at  timestamptz not null default now()
);
alter table public.lab_views enable row level security;
revoke all on public.lab_views from anon, authenticated;

create or replace function public.lab_set_view(p_token text, p_student text, p_key_sha256 text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not lab_ok(p_token) then raise exception 'lab_set_view: not allowed'; end if;
  if p_student !~ '^[A-Z0-9]{2,6}$' or p_key_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'lab_set_view: bad input'; end if;
  insert into lab_views (student, key_sha256) values (p_student, p_key_sha256)
  on conflict (student) do update set key_sha256 = excluded.key_sha256, updated_at = now();
end $$;

create or replace function public.lab_view(p_student text, p_key text)
returns table (session date, kind text, data jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_key is null or length(p_key) < 16 or not exists (
       select 1 from lab_views v where v.student = p_student
         and v.key_sha256 = encode(sha256(convert_to(p_key, 'UTF8')), 'hex')) then
    raise exception 'lab_view: not allowed';
  end if;
  return query
    select e.session, e.kind, e.data from lab_events e
    where e.student = p_student order by e.session, e.created_at limit 20000;
end $$;

revoke all on function public.lab_set_view(text, text, text) from public;
revoke all on function public.lab_view(text, text) from public;
grant execute on function public.lab_set_view(text, text, text) to anon, authenticated;
grant execute on function public.lab_view(text, text) to anon, authenticated;
