// Headless check of Bloque 1 · Me Town. Plays all worlds offline, then checks the
// online mode (two kids + teacher dashboard) with an in-memory fake of the `db` capability.
// Usage: node test/verify_b1.mjs [outDir]
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = playwright;
const here = dirname(fileURLToPath(import.meta.url));
const FILE = join(here, '..', 'Bloque1_MeTown.html');
const OUT = process.argv[2] || join(here, 'shots_b1');
mkdirSync(OUT, { recursive: true });
const URL0 = pathToFileURL(FILE).href;
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

// ---- fake `db` shared by all pages through the Node side ----
const store = new Map();
async function installFakeDb(page) {
  await page.exposeFunction('__dbSet', (path, data) => { store.set(path, JSON.parse(data)); });
  await page.exposeFunction('__dbGet', (path) => JSON.stringify(store.has(path) ? store.get(path) : null));
  await page.exposeFunction('__dbList', (coll) => JSON.stringify([...store.entries()].filter(([k]) => k.startsWith(coll + '/') && k.slice(coll.length + 1).indexOf('/') < 0).map(([k, v]) => ({ id: k.slice(coll.length + 1), v }))));
  await page.addInitScript(() => {
    const snapDoc = (id, v) => ({ id, exists: v !== null, data: () => v || undefined, metadata: { fromCache: false, hasPendingWrites: false } });
    const docRef = (path) => ({
      id: path.split('/').pop(), path,
      async get() { return snapDoc(path.split('/').pop(), JSON.parse(await window.__dbGet(path))); },
      async set(d) { await window.__dbSet(path, JSON.stringify(d)); },
      async update(d) { const cur = JSON.parse(await window.__dbGet(path)) || {}; await window.__dbSet(path, JSON.stringify({ ...cur, ...d })); },
      async delete() {},
      onSnapshot(next) {
        let last = '__none__', live = true;
        const tick = async () => { if (!live) return; const raw = await window.__dbGet(path); if (raw !== last) { last = raw; next(snapDoc(path.split('/').pop(), JSON.parse(raw))); } setTimeout(tick, 250); };
        tick();
        return () => { live = false; };
      },
    });
    const collRef = (path) => {
      const q = {
        path,
        doc: (id) => docRef(`${path}/${id || Math.random().toString(36).slice(2)}`),
        async add(d) { const r = docRef(`${path}/${Math.random().toString(36).slice(2)}`); await r.set(d); return r; },
        orderBy() { return q; }, where() { return q; }, limit() { return q; },
        async get() { const l = JSON.parse(await window.__dbList(path)); const docs = l.map((x) => snapDoc(x.id, x.v)); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; },
        onSnapshot(next) {
          let last = '', live = true;
          const tick = async () => { if (!live) return; const raw = await window.__dbList(path); if (raw !== last) { last = raw; const docs = JSON.parse(raw).map((x) => snapDoc(x.id, x.v)); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }); } setTimeout(tick, 300); };
          tick();
          return () => { live = false; };
        },
      };
      return q;
    };
    const db = { doc: docRef, collection: collRef };
    const user = { can: async () => true, isOwner: async () => true, id: async () => 'u1' };
    window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? user : null) };
  });
}

async function openPage(query = '', online = false, base = URL0, viewport = { width: 1920, height: 1080 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u) && !u.startsWith('http://127.0.0.1:18080/')) external.push(u); });
  if (online) await installFakeDb(page);
  page.setDefaultTimeout(120000);
  await page.goto(base + query);
  const t0 = Date.now();
  await page.waitForFunction(() => window.__TTS && window.__TTS.S, null, { timeout: 120000 });
  if (Date.now() - t0 > 8000) console.log('slow page load', Date.now() - t0, query.slice(0, 30));
  await wait(1500);
  return { ctx, page, errors, external };
}
const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__TTS.S, (k, v) => (k === 'Q' ? undefined : v))));
const Qs = (page) => page.evaluate(() => window.__TTS.quest());
const tpTo = (page, p) => page.evaluate((p) => window.__TTS.teleport(p.x, p.z, p.y || 0), p);
const answer = (page) => page.evaluate(() => window.__TTS.answer());
const wrong = (page) => page.evaluate(() => window.__TTS.wrong());

// Plays until the finale; returns list of quest types seen. Screenshots the first time each type appears.
async function playAll(page, { shots = true, stars = 2 } = {}) {
  const seen = new Set();
  const order = [];
  for (let guard = 0; guard < 1000; guard++) {
    const s = await S(page);
    if (s.mode === 'finale') break;
    if (s.mode === 'warp' || s.mode === 'title' || s.mode === 'brief') { await wait(500); continue; }
    if (s.mode === 'talk') {
      await wait(800);
      if (shots && !seen.has('talk-on')) { seen.add('talk-on'); await page.keyboard.press(String(stars)); await wait(600); await page.screenshot({ path: join(OUT, `w${s.wi}_talk.png`) }); }
      await page.keyboard.press('Enter');
      await wait(900);
      continue;
    }
    const q = await Qs(page);
    if (!q || !q.started || q.done) { await wait(300); continue; }
    const key = `${s.wi}:${s.q}`;
    if (!order.includes(key)) order.push(key);
    const first = !seen.has(key);
    if (first) {
      seen.add(key);
      await wait(400);
      if (shots) await page.screenshot({ path: join(OUT, `w${s.wi}_q${s.q}_${q.type}.png`) });
      if (['stones', 'zones'].includes(q.type) && q.ready) {
        const w = await wrong(page);
        if (w) { await tpTo(page, w); await wait(600); if (shots) await page.screenshot({ path: join(OUT, `w${s.wi}_q${s.q}_${q.type}_wrong.png`) }); await wait(900); continue; }
      }
    }
    if (q.type === 'interview' && q.phase === 'choose') {
      await wait(500);
      if (shots && !seen.has(key + 'choose')) { seen.add(key + 'choose'); await page.screenshot({ path: join(OUT, `w${s.wi}_q${s.q}_${q.type}_choose.png`) }); }
      await page.keyboard.press('1');
      await wait(500);
      continue;
    }
    if (['say', 'ask', 'listen', 'answer'].includes(q.phase)) {
      await wait(600);
      if (shots && !seen.has(key + 'say')) { seen.add(key + 'say'); await page.screenshot({ path: join(OUT, `w${s.wi}_q${s.q}_${q.type}_say.png`) }); }
      await page.keyboard.press('Enter');
      await wait(700);
      continue;
    }
    if (!q.ready && ['stones', 'zones', 'stations', 'interview', 'opinion', 'actions'].includes(q.type)) { await wait(300); continue; }
    const a = await answer(page);
    if (!a) { await wait(300); continue; }
    await tpTo(page, a);
    await wait(q.type === 'ladder' ? 450 : 900);
  }
  return order;
}

// ================= Run A: offline, Jerónimo =================
{
  const { ctx, page, errors, external } = await openPage();
  await page.screenshot({ path: join(OUT, '00_title.png') });
  check('Title visible', await page.isVisible('#L-title'));
  await page.keyboard.press('1');
  await wait(500);
  await page.screenshot({ path: join(OUT, '01_brief.png') });
  await page.keyboard.press('Enter');
  await wait(3500);
  const order = await playAll(page);
  const s = await S(page);
  check('Played all 3 worlds to the finale', s.mode === 'finale', `quests=${order.join(' ')}`);
  check('15 challenges visited', order.length === 15, `${order.length}`);
  await wait(2500);
  await page.screenshot({ path: join(OUT, '99_finale.png') });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv')]);
  const csvPath = join(OUT, dl.suggestedFilename());
  await dl.saveAs(csvPath);
  const csv = readFileSync(csvPath, 'utf8');
  console.log(csv);
  check('CSV rows for all challenges', (csv.match(/^Jerónimo,/gm) || []).length >= 15);
  check('CSV records the questions the kid chose', /\?/.test(csv.split('\n').filter((l) => /friends|neighbors/i.test(l)).join(' ')), csv.split('\n').filter((l) => /friends/i.test(l)).join(' | ').slice(0, 200));
  check('Report stones used met friends', /Report Stones|He Wakes Up/.test(csv));
  check('No console errors (offline)', errors.length === 0, errors.slice(0, 5).join(' | '));
  {
    const small = await openPage('', false, URL0, { width: 1277, height: 580 });
    await small.page.keyboard.press('1'); await small.page.keyboard.press('Enter');
    await wait(4500);
    await small.page.screenshot({ path: join(OUT, 'small_window_play.png') });
    const box = await small.page.evaluate(() => {
      const r = document.getElementById('h-task').getBoundingClientRect();
      return { top: r.top, h: innerHeight };
    });
    check('Small window: task card leaves the upper part free for the hero', box.top > box.h * 0.4, JSON.stringify(box));
    await small.ctx.close();
  }
  check('No external requests (offline)', external.length === 0, external.join(' '));
  await ctx.close();
}

// ================= Run B: online on the web · class code over a real MQTT broker =================
{
  const mod = require('aedes');
  const broker = mod.createBroker ? await mod.createBroker() : typeof mod === 'function' ? mod() : new mod.Aedes();
  const { WebSocketServer, createWebSocketStream } = require('ws');
  const wss = new WebSocketServer({ port: 18883 });
  wss.on('connection', (ws) => broker.handle(createWebSocketStream(ws)));
  const B = '&broker=' + encodeURIComponent('ws://127.0.0.1:18883');
  const http = require('node:http');
  const html = readFileSync(FILE);
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
  await new Promise((r) => srv.listen(18080, '127.0.0.1', r));
  const WEBURL = 'http://127.0.0.1:18080/me-town.html';
  const KEY = process.env.PROFE_KEY || '';

  // a visitor with no code cannot play and sees no teacher button
  const visitor = await openPage('?x=0' + B, false, WEBURL);
  check('Website: without a code the players are hidden', !(await visitor.page.isVisible('.players')) && await visitor.page.isVisible('#gate'));
  check('Website: no teacher button for visitors', !(await visitor.page.isVisible('#btn-teacher')));
  await visitor.page.keyboard.press('1');
  await wait(600);
  check('Website: key 1 does nothing while locked', (await S(visitor.page)).mode === 'title');
  await visitor.page.screenshot({ path: join(OUT, 'web_locked.png') });
  await visitor.page.fill('#room-in', 'ZZZZ');
  await visitor.page.click('#room-go');
  await wait(10500);
  check('Website: a code that is not open stays locked', !(await visitor.page.isVisible('.players')), await visitor.page.textContent('#room-st'));
  await visitor.ctx.close();

  const teacher = await openPage('?profe=' + KEY + B, false, WEBURL);
  check('Class code field and teacher button visible', await teacher.page.isVisible('#room-in') && await teacher.page.isVisible('#btn-teacher'));
  await teacher.page.keyboard.press('t');
  await wait(800);
  await teacher.page.click('#td-new');
  await wait(1500);
  const code = (await teacher.page.textContent('#td-code')).trim();
  const link = (await teacher.page.textContent('#td-link')).trim();
  check('Teacher creates a 4-letter class code + kids link', /^[A-Z2-9]{4}$/.test(code) && link.includes('room=' + code), `${code} ${link.slice(-30)}`);
  await teacher.page.screenshot({ path: join(OUT, 'web_teacher_code.png') });

  const kid1 = await openPage(`?room=${code}&t=5` + B, false, WEBURL);
  const kid2 = await openPage(`?room=${code}&t=5` + B, false, WEBURL);
  await wait(2500);
  check('Website: the open class code unlocks the kids', await kid1.page.isVisible('.players') && await kid2.page.isVisible('.players'));
  check('Website: kids do not get the teacher button', !(await kid1.page.isVisible('#btn-teacher')));
  check('Kid page joins the class from the link', /online/.test(await kid1.page.textContent('#room-st')), await kid1.page.textContent('#room-st'));
  await kid1.page.screenshot({ path: join(OUT, 'web_kid_title.png') });
  await kid1.page.keyboard.press('1'); await kid1.page.keyboard.press('Enter');
  await kid2.page.keyboard.press('2'); await kid2.page.keyboard.press('Enter');
  await wait(4500);
  for (let i = 0; i < 3; i++) { const a = await answer(kid1.page); if (a) await tpTo(kid1.page, a); await wait(900); await kid1.page.keyboard.press('Enter'); await wait(700); }
  await wait(2000);
  await teacher.page.screenshot({ path: join(OUT, 'web_teacher_live.png') });
  const txt = await teacher.page.textContent('#td-cards');
  check('Dashboard shows both kids live', (txt.match(/en vivo/g) || []).length === 2, txt.slice(0, 160).replace(/\s+/g, ' '));
  check('Dashboard shows events', /Presentation Stations/.test(txt));

  const q0 = await Qs(kid2.page);
  await teacher.page.click('button[data-p="1"][data-c="skip"]');
  await wait(1800);
  const q1 = await Qs(kid2.page);
  check('Remote "skip" reaches Luciana', q0 && q1 && (q1.type !== q0.type || q1.done), `${q0 && q0.type} -> ${q1 && q1.type}`);
  teacher.page.once('dialog', (d) => d.accept());
  await teacher.page.click('button[data-p="1"][data-c="restart"]');
  await wait(2500);
  check('Remote "restart" sends Luciana back to the menu', (await S(kid2.page)).mode === 'title');
  await wait(1500);
  check('Restart clears Luciana\'s card in the teacher view', /sin conectar/.test(await teacher.page.textContent('#td-cards')));
  let gave = false;
  for (let guard = 0; guard < 1000; guard++) {
    const s = await S(kid1.page);
    if (s.mode === 'finale') break;
    if (s.mode === 'talk' && !gave) {
      await teacher.page.click('button[data-p="0"][data-c="stars"][data-n="3"]');
      await wait(1500);
      gave = (await S(kid1.page)).stars[s.wi] === 3;
      await teacher.page.click('button[data-p="0"][data-c="endTalk"]');
      await wait(1500);
      continue;
    }
    if (s.mode !== 'play') { await wait(400); continue; }
    const q = await Qs(kid1.page);
    if (!q || !q.started || q.done) { await wait(300); continue; }
    if (q.type === 'interview' && q.phase === 'choose') { await kid1.page.keyboard.press('1'); await wait(500); continue; }
    if (['say', 'ask', 'listen', 'answer'].includes(q.phase)) { await kid1.page.keyboard.press('Enter'); await wait(600); continue; }
    if (!q.ready && ['stones', 'zones', 'stations', 'interview', 'opinion'].includes(q.type)) { await wait(300); continue; }
    const a = await answer(kid1.page);
    if (a) await tpTo(kid1.page, a);
    await wait(q.type === 'ladder' ? 450 : 900);
  }
  check('Remote stars from the teacher reach the stage', gave);
  check('Kid finished online', (await S(kid1.page)).mode === 'finale');
  await wait(2500);
  await teacher.page.screenshot({ path: join(OUT, 'web_teacher_after.png') });
  const [dl] = await Promise.all([teacher.page.waitForEvent('download'), teacher.page.click('#td-csv')]);
  const csv = readFileSync(await dl.path(), 'utf8');
  check('Teacher downloads CSV of finished games (names restored)', (csv.match(/^Jerónimo,/gm) || []).length >= 15 && /Talk stars,3,3/.test(csv));

  // teacher reloads the page: the class code is remembered and the live state comes back (retained)
  await teacher.page.reload();
  await teacher.page.waitForFunction(() => window.__TTS && window.__TTS.S);
  await wait(1200);
  await teacher.page.keyboard.press('t');
  await wait(2500);
  const again = await teacher.page.textContent('#td-cards');
  check('After reload the teacher sees the class again', (await teacher.page.textContent('#td-code')).trim() === code && /Terminó/.test(again));

  // no names on the wire: inspect what the broker stored
  let leaked = false;
  await new Promise((res) => {
    broker.persistence.createRetainedStream('#').on('data', (p) => { if (/Jer|Luc/.test(Buffer.from(p.payload).toString('latin1'))) leaked = true; }).on('end', res);
  });
  check('No names or readable text reach the broker', !leaked);

  for (const [n, x] of [['teacher', teacher], ['kid1', kid1], ['kid2', kid2]]) check(`No console errors (${n})`, x.errors.length === 0, x.errors.slice(0, 4).join(' | '));
  const ext = [teacher, kid1, kid2].flatMap((x) => x.external).filter((u) => !u.startsWith('ws://127.0.0.1'));
  check('Only the class broker is contacted', ext.length === 0, ext.join(' '));
  await teacher.ctx.close(); await kid1.ctx.close(); await kid2.ctx.close();
  // a wrong code must not see anything
  const spy = await openPage('?profe=' + KEY + B, false, WEBURL);
  await spy.page.keyboard.press('t');
  await wait(500);
  await spy.page.click('#td-new');
  await wait(2500);
  const spyTxt = await spy.page.textContent('#td-cards');
  check('Another class code sees nothing', !(/en vivo/.test(spyTxt)));
  await spy.ctx.close();

  wss.close();
  broker.close();
  srv.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
