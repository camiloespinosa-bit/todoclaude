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

async function openPage(query = '', online = false) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) external.push(u); });
  if (online) await installFakeDb(page);
  await page.goto(URL0 + query);
  await page.waitForFunction(() => window.__TTS && window.__TTS.S);
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
  for (let guard = 0; guard < 400; guard++) {
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
    if (q.phase === 'say' || q.phase === 'ask') {
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
  check('Report stones used met friends', /Report Stones|He Wakes Up/.test(csv));
  check('No console errors (offline)', errors.length === 0, errors.slice(0, 5).join(' | '));
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

  const teacher = await openPage('?x=1' + B);
  check('Class code field and teacher button visible', await teacher.page.isVisible('#room-in') && await teacher.page.isVisible('#btn-teacher'));
  await teacher.page.keyboard.press('t');
  await wait(800);
  await teacher.page.click('#td-new');
  await wait(1500);
  const code = (await teacher.page.textContent('#td-code')).trim();
  const link = (await teacher.page.textContent('#td-link')).trim();
  check('Teacher creates a 4-letter class code + kids link', /^[A-Z2-9]{4}$/.test(code) && link.includes('room=' + code), `${code} ${link.slice(-30)}`);
  await teacher.page.screenshot({ path: join(OUT, 'web_teacher_code.png') });

  const kid1 = await openPage(`?room=${code}&t=5` + B);
  const kid2 = await openPage(`?room=${code}&t=5` + B);
  await wait(1500);
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
  let gave = false;
  for (let guard = 0; guard < 400; guard++) {
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
    if (q.phase === 'say' || q.phase === 'ask') { await kid1.page.keyboard.press('Enter'); await wait(600); continue; }
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
  const spy = await openPage('?x=2' + B);
  await spy.page.keyboard.press('t');
  await wait(500);
  await spy.page.click('#td-new');
  await wait(2500);
  const spyTxt = await spy.page.textContent('#td-cards');
  check('Another class code sees nothing', !(/en vivo/.test(spyTxt)));
  await spy.ctx.close();

  wss.close();
  broker.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
