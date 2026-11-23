// Teacher admin page: log in with the teacher key, create class codes for any game,
// copy or send the kids' link, and open the live view of a class.
import { openTeacher, signPass, checkPass, cleanKey, teacherToken } from './pass.js';
import { DB } from './db.js';
import { joinRoom, newRoomCode, PUBLIC_BROKERS, SAGA_SUPABASE } from './net.js';

const GAMES = [
  { id: 'b1', file: 'me-town.html', name: 'Me Town', sub: 'Bloque 1 · Me and My World' },
  { id: 'b4', file: 'time-travel.html', name: 'The Time Travel Stage', sub: 'Bloque 4 · The World is Mine' },
];
const DAYS = [
  { d: 1, label: '1 día' },
  { d: 7, label: '1 semana' },
  { d: 30, label: '1 mes' },
  { d: 90, label: '3 meses' },
];
const PLAYERS = ['Jerónimo', 'Luciana'];
const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ls = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (e) {
      /* private window: works until the tab closes */
    }
  },
};
let signer = null;
let token = null;
let runs = [];
let codes = [];
try {
  codes = JSON.parse(ls.get('ccaCodes') || '[]');
} catch (e) {
  codes = [];
}
const saveCodes = () => ls.set('ccaCodes', JSON.stringify(codes));
const gameOf = (id) => GAMES.find((g) => g.id === id) || GAMES[0];
const fileUrl = (file) => new URL(file, location.href).href.split('?')[0];
const kidLink = (c) => `${fileUrl(gameOf(c.game).file)}?room=${c.code}&pase=${c.pase}`;
const liveLink = (c) => `${fileUrl(gameOf(c.game).file)}?room=${c.code}&panel=1`;
const fmtDate = (ms) => new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

function show(view) {
  $('login').hidden = view !== 'login';
  $('panel').hidden = view !== 'panel';
  $('logout').hidden = view !== 'panel';
}

async function login(key, remember) {
  $('lg-msg').textContent = 'Comprobando...';
  $('lg-msg').className = 'msg';
  if (!(window.crypto && crypto.subtle)) {
    $('lg-msg').textContent = 'Abre esta página con https:// para poder entrar.';
    $('lg-msg').className = 'msg bad';
    return false;
  }
  signer = await openTeacher(key);
  if (!signer) {
    $('lg-msg').textContent = 'Esa clave no es correcta.';
    $('lg-msg').className = 'msg bad';
    return false;
  }
  if (remember) ls.set('ccaProfe', cleanKey(key));
  $('lg-msg').textContent = '';
  show('panel');
  renderCodes();
  token = await teacherToken(key);
  loadHistory();
  return true;
}

// ---------- history (class database) ----------
const STATUS = { finished: 'Terminó', playing: 'Sin terminar', restarted: 'Reiniciada' };
const noteOf = (room) => (codes.find((c) => c.code === room) || {}).note || '';
const fmtWhen = (t) => new Date(t).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
async function loadHistory() {
  if (!token) return;
  $('hi-msg').textContent = 'Cargando...';
  $('hi-msg').className = 'msg';
  const r = await DB.history(token);
  if (!r.ok) {
    runs = [];
    $('hi-list').innerHTML = '';
    $('hi-msg').className = 'msg bad';
    $('hi-msg').textContent = r.status === 404 || r.status === 400
      ? 'La base de datos todavía no está activada (falta correr supabase/saga.sql en Supabase).'
      : r.status === 0 ? 'No hay conexión con la base de datos. Revisa internet y pulsa Actualizar.' : `La base de datos respondió con un error (${r.status}).`;
    return;
  }
  runs = r.data || [];
  $('hi-msg').textContent = runs.length ? `${runs.length} partidas guardadas.` : 'Todavía no hay partidas guardadas.';
  $('hi-list').innerHTML = runs.map((x) => {
    const g = gameOf(x.game);
    const rows = Array.isArray(x.rows) ? x.rows : [];
    const pts = rows.filter((w) => !/crystals|Talk stars/i.test(w.challenge || '')).reduce((a, w) => [a[0] + (+w.score || 0), a[1] + (+w.max || 0)], [0, 0]);
    const stars = rows.filter((w) => /Talk stars/i.test(w.challenge || '')).reduce((a, w) => a + (+w.score || 0), 0);
    const note = noteOf(x.room);
    const sum = x.status === 'finished' ? `${pts[0]}/${pts[1]} retos · ${stars} ★` : x.place ? `Iba en: ${esc(x.place)}` : '';
    return `<div class="run">
      <div><b>${esc(PLAYERS[x.player] || `Jugador ${x.player + 1}`)}</b> · ${esc(g.name)}<div class="meta">${fmtWhen(x.updated_at)} · código ${esc(x.room)}${note ? ` (${esc(note)})` : ''}${sum ? ` · ${sum}` : ''}</div></div>
      <span class="st ${esc(x.status)}">${STATUS[x.status] || esc(x.status)}</span>
      ${rows.length ? `<details><summary>Ver retos</summary><table>${rows.map((w) => `<tr><td>${esc(w.world || '')}</td><td>${esc(w.challenge || '')}${w.details ? `<div class="meta">${esc(w.details)}</div>` : ''}</td><td class="n">${esc(w.score)}/${esc(w.max)}</td></tr>`).join('')}</table></details>` : ''}
    </div>`;
  }).join('');
}
function historyCSV() {
  const head = ['fecha', 'juego', 'codigo', 'para', 'jugador', 'estado', 'mundo', 'reto', 'puntaje', 'maximo', 'detalles'];
  const cell = (v) => {
    const t = String(v ?? '');
    return /[",;\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [head.join(',')];
  for (const x of runs) {
    const base = [new Date(x.updated_at).toISOString().slice(0, 16).replace('T', ' '), gameOf(x.game).name, x.room, noteOf(x.room), PLAYERS[x.player] || x.player, STATUS[x.status] || x.status];
    const rows = Array.isArray(x.rows) && x.rows.length ? x.rows : [{ world: '', challenge: x.place || '', score: '', max: '', details: '' }];
    for (const w of rows) lines.push([...base, w.world, w.challenge, w.score, w.max, w.details].map(cell).join(','));
  }
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Juegos_historial_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
$('hi-reload').addEventListener('click', loadHistory);
$('hi-csv').addEventListener('click', () => (runs.length ? historyCSV() : loadHistory()));

// keep a copy of "this class is open until ..." on the live channel, so a kid who types the
// 4 letters by hand (without the link) can also get in
async function announce(c) {
  try {
    const brokers = params.get('broker') ? [params.get('broker')] : PUBLIC_BROKERS;
    const tx = await joinRoom(c.code, c.game, brokers, () => {}, params.get('broker') ? null : SAGA_SUPABASE);
    const send = () => tx.publish('open', { t: Date.now(), exp: c.exp }, true);
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (tx.connected()) {
        await send();
        await new Promise((r) => setTimeout(r, 800));
        break;
      }
    }
    tx.close();
  } catch (e) {
    /* the signed link works anyway */
  }
}

async function create() {
  const game = $('cr-game').value;
  const days = parseInt($('cr-days').value, 10) || 7;
  const note = $('cr-note').value.trim().slice(0, 60);
  const code = newRoomCode();
  const exp = Date.now() + days * 864e5;
  const pase = await signPass(signer, code, exp);
  const c = { game, code, pase, exp: Math.ceil(exp / 60000) * 60000, note, created: Date.now() };
  codes.unshift(c);
  codes = codes.slice(0, 60);
  saveCodes();
  renderCodes(c.code);
  $('cr-note').value = '';
  announce(c);
}

function card(c, fresh) {
  const g = gameOf(c.game);
  const alive = c.exp > Date.now();
  const link = kidLink(c);
  const wa = `https://wa.me/?text=${encodeURIComponent(`¡A jugar inglés! ${g.name}: ${link}`)}`;
  return `<article class="code${alive ? '' : ' old'}${fresh ? ' fresh' : ''}" data-code="${c.code}">
    <div class="ch">
      <div><b class="cc">${c.code}</b><span class="cg">${esc(g.name)}</span>${c.note ? `<span class="cn">${esc(c.note)}</span>` : ''}</div>
      <span class="cv">${alive ? `Vale hasta ${fmtDate(c.exp)}` : 'Vencido'}</span>
    </div>
    ${alive ? `<div class="cl">${esc(link)}</div>
    <div class="cb">
      <button class="btn main" data-act="copy">Copiar enlace</button>
      <a class="btn" href="${wa}" target="_blank" rel="noopener">Enviar por WhatsApp</a>
      <a class="btn" href="${liveLink(c)}" target="_blank" rel="noopener">Ver en vivo</a>
      <button class="btn ghost" data-act="del">Quitar</button>
    </div>` : `<div class="cb"><button class="btn ghost" data-act="del">Quitar de la lista</button></div>`}
  </article>`;
}

function renderCodes(fresh) {
  $('list').innerHTML = codes.length
    ? codes.map((c) => card(c, c.code === fresh)).join('')
    : '<p class="empty">Todavía no has creado códigos.</p>';
}

$('list').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const code = b.closest('.code').dataset.code;
  const c = codes.find((x) => x.code === code);
  if (!c) return;
  if (b.dataset.act === 'copy') {
    try {
      await navigator.clipboard.writeText(kidLink(c));
      b.textContent = '¡Copiado!';
    } catch (err) {
      const r = document.createRange();
      r.selectNodeContents(b.closest('.code').querySelector('.cl'));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      b.textContent = 'Selecciona y copia';
    }
    setTimeout(() => (b.textContent = 'Copiar enlace'), 1600);
  } else if (b.dataset.act === 'del') {
    codes = codes.filter((x) => x !== c);
    saveCodes();
    renderCodes();
  }
});

$('cr-game').innerHTML = GAMES.map((g) => `<option value="${g.id}">${esc(g.name)} · ${esc(g.sub)}</option>`).join('');
$('cr-days').innerHTML = DAYS.map((d) => `<option value="${d.d}"${d.d === 7 ? ' selected' : ''}>${d.label}</option>`).join('');
$('games').innerHTML = GAMES.map((g) => `<a class="game" href="${g.file}" target="_blank" rel="noopener">${esc(g.name)}<span>${esc(g.sub)}</span></a>`).join('');
$('lg-form').addEventListener('submit', (e) => {
  e.preventDefault();
  login($('lg-key').value, $('lg-rem').checked);
});
$('cr-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (signer) create();
});
$('logout').addEventListener('click', () => {
  ls.set('ccaProfe', null);
  signer = null;
  token = null;
  runs = [];
  $('lg-key').value = '';
  show('login');
});

(async () => {
  const saved = params.get('profe') || ls.get('ccaProfe');
  if (saved && (await login(saved, true))) return;
  $('lg-msg').textContent = '';
  show('login');
})();

// for tests
window.__ADMIN = { checkPass, codes: () => codes };
