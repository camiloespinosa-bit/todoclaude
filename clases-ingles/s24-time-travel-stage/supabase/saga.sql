-- Juegos de inglés (Time Travel Saga): base de datos de partidas.
-- Pegar completo en Supabase > SQL Editor > Run. Se puede correr varias veces sin problema.
--
-- Seguridad:
--  * Las tablas quedan cerradas (RLS sin políticas): la llave pública no puede leerlas ni escribirlas.
--  * La página solo puede llamar 3 funciones:
--      saga_save    -> guarda el avance o el resultado de una partida
--      saga_resume  -> devuelve la última partida sin terminar de un niño en una clase (para "Continue")
--      saga_history -> el historial completo, solo con el token del profe (sale de la clave del profe)
--  * No se guardan nombres: el jugador es un número (0 = Jerónimo, 1 = Luciana).

create table if not exists public.saga_runs (
  run_id      text primary key,
  room        text not null,
  game        text not null,
  player      smallint not null,
  status      text not null default 'playing',   -- playing | finished | restarted
  state       jsonb,                              -- avance guardado (para continuar)
  rows        jsonb,                              -- resultados por reto al terminar
  started_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists saga_runs_room_idx on public.saga_runs (room, game, player, updated_at desc);
alter table public.saga_runs enable row level security;

create table if not exists public.saga_config (k text primary key, v text not null);
alter table public.saga_config enable row level security;
-- SHA-256 del token del profe (el token se deriva de la clave con PBKDF2, 250.000 vueltas)
insert into public.saga_config (k, v) values ('teacher_token_sha256', '27636e092d3ac7cf89eeb70e4ce5fc47e4669c34bb8c1b0669520a456ec3a805')
  on conflict (k) do update set v = excluded.v;

revoke all on public.saga_runs from anon, authenticated;
revoke all on public.saga_config from anon, authenticated;

create or replace function public.saga_save(
  p_run text, p_room text, p_game text, p_player int,
  p_state jsonb default null, p_status text default 'playing', p_rows jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_run is null or length(p_run) > 40 or length(p_room) not between 4 and 6 or length(p_game) > 12
     or p_player not between 0 and 9 or p_status not in ('playing', 'finished', 'restarted')
     or coalesce(pg_column_size(p_state), 0) > 300000 or coalesce(pg_column_size(p_rows), 0) > 300000 then
    raise exception 'saga_save: bad input';
  end if;
  insert into saga_runs (run_id, room, game, player, status, state, rows)
  values (p_run, upper(p_room), p_game, p_player, p_status, p_state, p_rows)
  on conflict (run_id) do update set
    status = case when saga_runs.status = 'finished' then 'finished' else excluded.status end,
    state = case when excluded.status = 'playing' then coalesce(excluded.state, saga_runs.state) else null end,
    rows = coalesce(excluded.rows, saga_runs.rows),
    updated_at = now()
  where saga_runs.room = excluded.room and saga_runs.game = excluded.game and saga_runs.player = excluded.player;
end $$;

create or replace function public.saga_resume(p_room text, p_game text, p_player int)
returns jsonb language sql stable security definer set search_path = public as $$
  select state from saga_runs
  where room = upper(p_room) and game = p_game and player = p_player
    and status = 'playing' and state is not null and updated_at > now() - interval '30 days'
  order by updated_at desc limit 1
$$;

drop function if exists public.saga_history(text, int);
create or replace function public.saga_history(p_token text, p_days int default 365)
returns table (run_id text, room text, game text, player smallint, status text, rows jsonb,
               place text, started_at timestamptz, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_token is null or encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
       is distinct from (select v from saga_config where k = 'teacher_token_sha256') then
    raise exception 'saga_history: not allowed';
  end if;
  return query
    select r.run_id, r.room, r.game, r.player, r.status, r.rows,
           r.state->>'where', r.started_at, r.updated_at
    from saga_runs r
    where r.updated_at > now() - make_interval(days => greatest(1, least(p_days, 3650)))
    order by r.updated_at desc
    limit 3000;
end $$;

revoke all on function public.saga_save(text, text, text, int, jsonb, text, jsonb) from public;
revoke all on function public.saga_resume(text, text, int) from public;
revoke all on function public.saga_history(text, int) from public;
grant execute on function public.saga_save(text, text, text, int, jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.saga_resume(text, text, int) to anon, authenticated;
grant execute on function public.saga_history(text, int) to anon, authenticated;

-- ---------- Cofre de cristales ("My Look") ----------
-- Un cofre por niño, compartido por todos los juegos: cristales, cosas compradas y su look.
create table if not exists public.saga_players (
  player     smallint primary key,
  crystals   int not null default 0,
  owned      jsonb not null default '[]'::jsonb,
  look       jsonb,
  updated_at timestamptz not null default now()
);
alter table public.saga_players enable row level security;
revoke all on public.saga_players from anon, authenticated;
-- regalo de la primera clase (23 nov 2026): los cristales que recogieron ese día
insert into public.saga_players (player, crystals) values (0, 45), (1, 44) on conflict (player) do nothing;

create or replace function public.saga_wallet(
  p_player int, p_op text default 'get', p_amount int default 0,
  p_item text default null, p_price int default 0, p_look jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w saga_players;
begin
  if p_player not between 0 and 9 then raise exception 'saga_wallet: bad player'; end if;
  insert into saga_players (player) values (p_player) on conflict (player) do nothing;
  select * into w from saga_players where player = p_player for update;
  if p_op = 'earn' then
    if p_amount not between 0 and 200 then raise exception 'saga_wallet: bad amount'; end if;
    update saga_players set crystals = crystals + p_amount, updated_at = now() where player = p_player;
  elsif p_op = 'buy' then
    if p_item is null or length(p_item) > 40 or p_price not between 0 and 500 then raise exception 'saga_wallet: bad item'; end if;
    if not (w.owned ? p_item) then
      if w.crystals < p_price then raise exception 'saga_wallet: not enough crystals'; end if;
      update saga_players set crystals = crystals - p_price, owned = owned || to_jsonb(p_item), updated_at = now()
        where player = p_player;
    end if;
  elsif p_op = 'look' then
    if p_look is null or pg_column_size(p_look) > 4000 then raise exception 'saga_wallet: bad look'; end if;
    update saga_players set look = p_look, updated_at = now() where player = p_player;
  elsif p_op <> 'get' then
    raise exception 'saga_wallet: bad op';
  end if;
  select * into w from saga_players where player = p_player;
  return jsonb_build_object('crystals', w.crystals, 'owned', w.owned, 'look', w.look);
end $$;
revoke all on function public.saga_wallet(int, text, int, text, int, jsonb) from public;
grant execute on function public.saga_wallet(int, text, int, text, int, jsonb) to anon, authenticated;
