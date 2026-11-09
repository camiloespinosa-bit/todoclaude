// Headless check of the GAME edition (Bloque 4 complete): plays all 4 worlds and every challenge.
// Usage: node test/verify.mjs [outDir]
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = playwright;

const here = dirname(fileURLToPath(import.meta.url));
const FILE = join(here, '..', 'S24_TimeTravelStage.html');
const OUT = process.argv[2] || join(here, 'shots');
mkdirSync(OUT, { recursive: true });
const URL0 = pathToFileURL(FILE).href;

const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function openPage(query = '') {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) external.push(u); });
  await page.goto(URL0 + query);
  await page.waitForFunction(() => window.__TTS && window.__TTS.S);
  await wait(1500);
  return { ctx, page, errors, external };
}
const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__TTS.S, (k, v) => (k === 'Q' ? undefined : v))));
const Qs = (page) => page.evaluate(() => window.__TTS.quest());
const pos = (page) => page.evaluate(() => ({ x: window.__TTS.AV.pos.x, y: window.__TTS.AV.pos.y, z: window.__TTS.AV.pos.z }));
const tpTo = (page, p) => page.evaluate((p) => window.__TTS.teleport(p.x, p.z, p.y || 0), p);
const answer = (page) => page.evaluate(() => window.__TTS.answer());
const wrong = (page) => page.evaluate(() => window.__TTS.wrong());
const waitQuest = (page, type, ms = 12000) => page.waitForFunction((t) => { const q = window.__TTS.quest(); return q && q.type === t && q.started && !q.done; }, type, { timeout: ms }).then(() => true, () => false);
const waitMode = (page, mode, ms = 20000) => page.waitForFunction((m) => window.__TTS.S.mode === m, mode, { timeout: ms }).then(() => true, () => false);
const waitReady = (page, ms = 6000) => page.waitForFunction(() => { const q = window.__TTS.quest(); return q && (q.ready || q.done); }, null, { timeout: ms }).then(() => true, () => false);

async function solveRounds(page, type, { wrongFirst = false, shot = null } = {}) {
  await waitQuest(page, type);
  const q0 = await Qs(page);
  for (let i = 0; i < q0.max; i++) {
    await waitReady(page);
    if (wrongFirst && i === 0) {
      const w = await wrong(page);
      if (w) {
        await tpTo(page, w);
        await wait(500);
        if (shot) await page.screenshot({ path: join(OUT, shot.replace('.png', '_wrong.png')) });
        await wait(900);
        await waitReady(page);
      }
    }
    if (shot && i === 0) await page.screenshot({ path: join(OUT, shot) });
    const a = await answer(page);
    await tpTo(page, a);
    await wait(type === 'ladder' ? 500 : 2400);
  }
  return page.waitForFunction((t) => { const q = window.__TTS.quest(); return !q || q.type !== t || q.done; }, type, { timeout: 8000 }).then(() => true, () => false);
}
async function collect3(page, shot) {
  await waitQuest(page, 'collect');
  for (let i = 0; i < 3; i++) {
    const a = await answer(page);
    await tpTo(page, a);
    await wait(700);
    if (shot && i === 0) await page.screenshot({ path: join(OUT, shot) });
  }
  return page.waitForFunction(() => window.__TTS.quest().type !== 'collect', null, { timeout: 8000 }).then(() => true, () => false);
}
async function talk(page, stars, shot) {
  await waitQuest(page, 'talk');
  await tpTo(page, await answer(page));
  const ok = await waitMode(page, 'talk', 5000);
  await wait(1400);
  await page.keyboard.press(String(stars));
  await wait(700);
  if (shot) await page.screenshot({ path: join(OUT, shot) });
  await page.keyboard.press('Enter');
  await wait(800);
  return ok;
}
async function portal(page, shot) {
  await waitQuest(page, 'portal');
  await wait(600);
  if (shot) await page.screenshot({ path: join(OUT, shot) });
  await tpTo(page, await answer(page));
  return waitMode(page, 'warp', 5000);
}

// ================= Run A: full trip with Jerónimo =================
{
  const { ctx, page, errors, external } = await openPage();
  await page.screenshot({ path: join(OUT, '01_title.png') });
  check('Title screen visible', await page.isVisible('#L-title'));
  await page.keyboard.press('1');
  await wait(600);
  await page.screenshot({ path: join(OUT, '02_brief.png') });
  await page.keyboard.press('Enter');
  await wait(1200);
  let s = await S(page);
  check('Trip starts in YESTERDAY LAND', s.mode === 'play' && s.wi === 0);
  await page.screenshot({ path: join(OUT, '03_arrival_past.png') });
  await waitQuest(page, 'collect');

  // real controls
  const p0 = await pos(page);
  await page.keyboard.down('ArrowUp'); await wait(1200); await page.keyboard.up('ArrowUp');
  const p1 = await pos(page);
  check('Arrow Up walks forward', p1.z < p0.z - 1, `${p0.z.toFixed(1)} -> ${p1.z.toFixed(1)}`);
  await page.keyboard.press('Space');
  let jy = 0;
  for (let i = 0; i < 10; i++) { await wait(80); jy = Math.max(jy, (await pos(page)).y); }
  check('Space jumps', jy > 0.4, `max y=${jy.toFixed(2)}`);
  await wait(800);
  // trampoline
  const tr = await page.evaluate(() => window.__TTS.tramp());
  await tpTo(page, { x: tr.x, z: tr.z, y: 0.35 });
  let py = 0;
  for (let i = 0; i < 15; i++) { await wait(100); py = Math.max(py, (await pos(page)).y); }
  check('Trampoline launches high', py > 2.5, `y=${py.toFixed(2)}`);
  await wait(400);
  await page.screenshot({ path: join(OUT, '04_trampoline.png') });
  await wait(1500);
  s = await S(page);
  check('Time crystal above trampoline collected', s.crystals[0] >= 1, `crystals=${s.crystals[0]}`);

  check('Past: find 3 things', await collect3(page, '05_collect_past.png'));
  check('Past: Word Stones (with a wrong try)', await solveRounds(page, 'stones', { wrongFirst: true, shot: '06_wordstones.png' }));
  // talk with teacher keys
  await waitQuest(page, 'talk');
  await tpTo(page, await answer(page));
  check('Stage starts the talk', await waitMode(page, 'talk', 5000));
  await wait(1200);
  await page.keyboard.press('Numpad1');
  await wait(400);
  check('Numpad 1 gives 1 star', (await S(page)).stars[0] === 1);
  await page.click('#t-stars svg:nth-child(3)');
  await wait(400);
  check('Clicking the 3rd star gives 3 stars', (await S(page)).stars[0] === 3);
  await page.keyboard.press('2');
  await wait(500);
  check('Key 2 gives 2 stars', (await S(page)).stars[0] === 2);
  await page.keyboard.press('p');
  const t1 = (await S(page)).talkLeft;
  await wait(1200);
  check('P pauses', Math.abs((await S(page)).talkLeft - t1) < 0.01);
  await page.screenshot({ path: join(OUT, '07_paused.png') });
  await page.keyboard.press('p');
  await wait(1200);
  check('P resumes (real-time timer)', (await S(page)).talkLeft < t1 - 0.6);
  await page.keyboard.press('r');
  await wait(100);
  check('R restarts the timer', (await S(page)).talkLeft > 59);
  await page.keyboard.press('3');
  await page.keyboard.press(' ');
  await wait(400);
  check('Space does not end the talk', (await S(page)).mode === 'talk');
  await page.screenshot({ path: join(OUT, '08_talk_past.png') });
  await page.keyboard.press('Enter');
  await wait(800);
  check('Past: portal -> warp', await portal(page, '09_portal_past.png'));
  await wait(1400);
  await page.screenshot({ path: join(OUT, '10_warp.png') });
  check('Arrive in TODAY TOWN', await waitMode(page, 'play', 8000) && (await S(page)).wi === 1);
  await wait(700);
  await page.screenshot({ path: join(OUT, '11_arrival_present.png') });

  // Today Town
  await waitQuest(page, 'actions');
  await wait(400);
  await page.screenshot({ path: join(OUT, '12_actions.png') });
  check('Present: What are they doing? (with a wrong try)', await solveRounds(page, 'actions', { wrongFirst: true, shot: '12b_actions_near.png' }));
  check('Present: Every day / Right now zones', await solveRounds(page, 'zones', { wrongFirst: true, shot: '13_zones.png' }));
  check('Present: Can Stones', await solveRounds(page, 'stones', { shot: '14_can.png' }));
  await waitQuest(page, 'opinion');
  await waitReady(page);
  await page.screenshot({ path: join(OUT, '15_opinion.png') });
  await tpTo(page, await answer(page));
  await wait(900);
  await page.screenshot({ path: join(OUT, '15b_opinion_say.png') });
  let q = await Qs(page);
  check('Opinion: standing on a side asks to say it', q.phase === 'say');
  await page.keyboard.press('Enter');
  await wait(600);
  await waitReady(page);
  await tpTo(page, await answer(page));
  await wait(900);
  await page.keyboard.press('Enter');
  await wait(900);
  check('Present: Opinion Corner done', (await Qs(page)).type !== 'opinion' || (await Qs(page)).done);
  check('Present: talk', await talk(page, 1, '16_talk_present.png'));
  check('Present: portal', await portal(page));
  check('Arrive in TOMORROW CITY', await waitMode(page, 'play', 8000) && (await S(page)).wi === 2);
  await wait(3000);
  await page.screenshot({ path: join(OUT, '17_future.png') });

  // Tomorrow City
  check('Future: pick 3 dreams', await collect3(page, '18_dreams.png'));
  check('Future: Prediction Track', await solveRounds(page, 'ladder', { shot: '19_ladder.png' }));
  check('Future: Today / Tomorrow', await solveRounds(page, 'zones', { shot: '20_today_tomorrow.png' }));
  check('Future: Advice Clinic', await solveRounds(page, 'stones', { wrongFirst: true, shot: '21_advice.png' }));
  check('Future: talk', await talk(page, 2, '22_talk_future.png'));
  check('Future: portal', await portal(page));
  check('Arrive in ULTIMATE CHALLENGE', await waitMode(page, 'play', 8000) && (await S(page)).wi === 3);
  await wait(3000);
  await page.screenshot({ path: join(OUT, '23_arena.png') });
  check('Arena: Ultimate Stones (5)', await solveRounds(page, 'stones', { shot: '24_ultimate.png' }));
  check('Arena: golden portal -> finale', await portal(page, '25_golden_portal.png'));
  check('Finale reached', await waitMode(page, 'finale', 10000));
  await wait(2800);
  s = await S(page);
  check('Finale totals', s.stars.slice(0, 3).join() === '3,1,2', `stars=${s.stars}`);
  await page.screenshot({ path: join(OUT, '26_finale.png') });

  await page.click('.wrow .st.edit[data-w="1"] .fs[data-n="3"]');
  await wait(400);
  s = await S(page);
  check('Finale: clicking stars edits them', s.stars[1] === 3 && (await page.textContent('#f-stars')) === '8', `stars=${s.stars}`);
  await page.screenshot({ path: join(OUT, '26b_finale_edit.png') });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv')]);
  const csvPath = join(OUT, dl.suggestedFilename());
  await dl.saveAs(csvPath);
  const csv = readFileSync(csvPath, 'utf8');
  console.log(csv);
  const n = (csv.match(/^Jerónimo,/gm) || []).length;
  check('CSV has all challenges (≥ 18 rows)', n >= 18, `rows=${n}`);
  check('CSV has the edited talk stars (Present = 3)', /Jerónimo,Present,Talk stars,3,3/.test(csv));
  await page.keyboard.press('n');
  await wait(800);
  check('N -> title', (await S(page)).mode === 'title');
  check('No console errors/warnings (run A)', errors.length === 0, errors.slice(0, 5).join(' | '));
  check('No external requests (run A)', external.length === 0, external.join(' '));
  await ctx.close();
}

// ================= Run B: Luciana, teacher K skips everything; talk timer ends alone =================
{
  const { ctx, page, errors, external } = await openPage('?t=4');
  await page.click('.player[data-p="1"]');
  await wait(400);
  await page.keyboard.press('Enter');
  await waitQuest(page, 'collect');
  await page.screenshot({ path: join(OUT, '27_luciana.png') });
  let guard = 0;
  while ((await S(page)).mode !== 'finale' && guard++ < 120) {
    const s = await S(page);
    const q = await Qs(page);
    if (s.mode === 'play' && q && q.type === 'talk' && q.started && !q.done && s.wi === 0) {
      await tpTo(page, await answer(page));
      await waitMode(page, 'talk', 4000);
      await wait(5500); // timer t=4 ends by itself
      check('Talk ends by itself when time is up', (await S(page)).mode === 'play');
      continue;
    }
    if (s.mode === 'play') await page.keyboard.press('k');
    await wait(1300);
  }
  const sb = await S(page);
  check('K skips through all 4 worlds to the finale', sb.mode === 'finale', `mode=${sb.mode} wi=${sb.wi} q=${JSON.stringify(await Qs(page))}`);
  check('No console errors/warnings (run B)', errors.length === 0, errors.slice(0, 5).join(' | '));
  check('No external requests (run B)', external.length === 0);
  await ctx.close();
}

// ================= Run C: no WebGL =================
{
  const b2 = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const page = await (await b2.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  await page.goto(URL0);
  await wait(800);
  check('No-WebGL message shown', await page.isVisible('#nogl'));
  await b2.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
