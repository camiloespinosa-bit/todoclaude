// Class results database (Supabase, same project as /reservas).
// The page only calls three database functions (see supabase/saga.sql); the tables
// themselves are closed to the public key. Every call fails quietly: the game never
// waits for the database and works the same without it.
import { SAGA_SUPABASE } from './net.js';

const params = new URLSearchParams(location.search);
// tests can point the page at a fake server with ?db=http://...
const BASE = (params.get('db') || SAGA_SUPABASE.url).replace(/\/$/, '');
const KEY = SAGA_SUPABASE.key;

async function rpc(fn, args, timeout = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, 'content-type': 'application/json' },
      body: JSON.stringify(args),
      signal: ctl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    return { ok: true, data: text ? JSON.parse(text) : null };
  } catch (e) {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

// saves are queued so they reach the database in order
let chain = Promise.resolve();
export const DB = {
  save({ run, room, game, player, state = null, status = 'playing', rows = null }) {
    chain = chain.then(() => rpc('saga_save', { p_run: run, p_room: room, p_game: game, p_player: player, p_state: state, p_status: status, p_rows: rows }));
    return chain;
  },
  async resume(room, game, player) {
    const r = await rpc('saga_resume', { p_room: room, p_game: game, p_player: player }, 5000);
    return r.ok ? r.data : null;
  },
  // crystals, things bought and look of one kid: op = get | earn | buy | look
  wallet(player, { op, amount = 0, item = null, price = 0, look = null }) {
    return rpc('saga_wallet', { p_player: player, p_op: op, p_amount: amount, p_item: item, p_price: price, p_look: look }, 8000);
  },
  // teacher only: token derived from the teacher key (see teacherToken in pass.js)
  history(token, days = 365) {
    return rpc('saga_history', { p_token: token, p_days: days }, 15000);
  },
};
