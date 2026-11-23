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
// ---------- parent report ----------
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const isTalk = (w) => /Talk stars/i.test(w.challenge || '');
const isCrys = (w) => /crystals/i.test(w.challenge || '');
function buildReport(kid, fromMs) {
  const mine = runs.filter((x) => x.player === kid && new Date(x.updated_at).getTime() >= fromMs);
  const done = mine.filter((x) => x.status === 'finished' && Array.isArray(x.rows));
  const rows = done.flatMap((x) => x.rows.map((w) => ({ ...w, game: gameOf(x.game).name, when: x.updated_at })));
  const ch = rows.filter((w) => !isTalk(w) && !isCrys(w) && +w.max > 0);
  const talk = rows.filter(isTalk);
  const crys = rows.filter(isCrys).reduce((a, w) => a + (+w.score || 0), 0);
  const score = ch.reduce((a, w) => a + (+w.score || 0), 0), max = ch.reduce((a, w) => a + (+w.max || 0), 0);
  const stars = talk.reduce((a, w) => a + (+w.score || 0), 0);
  // per challenge: best result and how many times
  const by = new Map();
  for (const w of ch) {
    const k = `${w.game}|${w.world}|${w.challenge}`;
    const o = by.get(k) || { game: w.game, world: w.world, challenge: w.challenge, times: 0, best: 0, max: +w.max, sum: 0, sumMax: 0 };
    o.times++;
    o.best = Math.max(o.best, +w.score || 0);
    o.sum += +w.score || 0;
    o.sumMax += +w.max || 0;
    by.set(k, o);
  }
  const list = [...by.values()];
  const ranked = list.slice().sort((a, b) => pct(b.sum, b.sumMax) - pct(a.sum, a.sumMax));
  const best = ranked.filter((o) => pct(o.sum, o.sumMax) >= 80).slice(0, 4);
  const practice = ranked.slice().reverse().filter((o) => pct(o.sum, o.sumMax) < 80).slice(0, 4);
  // the questions the kid chose and said out loud ("Ana: Do you like horses?")
  const qs = new Map();
  for (const w of rows) for (const part of String(w.details || '').split(';')) {
    const m = /^\s*([A-Z][a-z]+):\s*(.+\?)\s*$/.exec(part);
    if (m) qs.set(m[2], (qs.get(m[2]) || 0) + 1);
  }
  const dates = mine.map((x) => new Date(x.updated_at).getTime());
  const name = PLAYERS[kid] || `Jugador ${kid + 1}`;
  const fmt = (t) => new Date(t).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const period = dates.length ? `${fmt(Math.min(...dates))} a ${fmt(Math.max(...dates))}` : 'Sin partidas en este periodo';
  const commentKey = `ccaComment:${kid}`;
  const row = (o) => `<tr><td>${esc(o.game)}</td><td>${esc(o.world)}</td><td>${esc(o.challenge)}</td><td class="n">${o.best}/${o.max}</td><td>${o.times}</td><td><div class="bar"><i style="width:${pct(o.sum, o.sumMax)}%"></i></div></td></tr>`;
  const item = (o) => `<li><b>${esc(o.challenge)}</b> <span style="color:var(--muted)">(${esc(o.world)}, ${pct(o.sum, o.sumMax)}%)</span></li>`;
  return `
    <header><div class="brand">Gimnasio del Cerebro · Inglés</div><h1>Informe de ${esc(name)}</h1><div class="period">${esc(period)}</div></header>
    <div class="kpis">
      <div class="kpi"><b>${done.length}</b><span>${done.length === 1 ? 'partida terminada' : 'partidas terminadas'}${mine.length > done.length ? ` (+${mine.length - done.length} sin terminar)` : ''}</span></div>
      <div class="kpi"><b>${pct(score, max)}%</b><span>aciertos en los retos (${score}/${max})</span></div>
      <div class="kpi"><b>${stars}/${talk.length * 3}</b><span>estrellas hablando en el escenario</span></div>
      <div class="kpi"><b>${qs.size}</b><span>preguntas distintas que hizo en inglés</span></div>
      <div class="kpi"><b>${crys}</b><span>cristales del tiempo</span></div>
    </div>
    <div class="two">
      <div><h3>Lo que mejor le salió</h3>${best.length ? `<ul>${best.map(item).join('')}</ul>` : '<p class="fine">Todavía no hay suficientes datos.</p>'}</div>
      <div><h3>Para seguir practicando</h3>${practice.length ? `<ul>${practice.map(item).join('')}</ul>` : '<p class="fine">Todos los retos por encima del 80%.</p>'}</div>
    </div>
    <h3>Preguntas que hizo en inglés</h3>
    ${qs.size ? `<ul class="qs">${[...qs.keys()].map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : '<p class="fine">No hay preguntas registradas.</p>'}
    <h3>Retos jugados</h3>
    ${list.length ? `<table><thead><tr><th>Juego</th><th>Mundo</th><th>Reto</th><th>Mejor</th><th>Veces</th><th>Aciertos</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table>` : '<p class="fine">No hay partidas terminadas en este periodo.</p>'}
    <h3>Comentario del profe</h3>
    <div class="comment" id="rp-comment" contenteditable="true">${esc(ls.get(commentKey) || '')}</div>
    <p class="fine">Este informe muestra lo que ${esc(name)} hizo dentro de los juegos: retos, aciertos, preguntas y estrellas que dio el profe al escucharle hablar. La pronunciación y la fluidez las valora el profe en clase.</p>`;
}
$('rp-go').addEventListener('click', async () => {
  if (!runs.length) await loadHistory();
  const kid = +$('rp-kid').value;
  const from = $('rp-from').value ? new Date($('rp-from').value + 'T00:00').getTime() : 0;
  $('rp-body').innerHTML = buildReport(kid, from);
  $('report').hidden = false;
  window.scrollTo(0, 0);
  const c = $('rp-comment');
  c.addEventListener('input', () => ls.set(`ccaComment:${kid}`, c.innerText));
});
$('rp-close').addEventListener('click', () => ($('report').hidden = true));
$('rp-print').addEventListener('click', () => window.print());
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
