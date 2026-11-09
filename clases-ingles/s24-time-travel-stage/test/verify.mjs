// Headless check of the GAME edition: plays all 3 worlds, tests keys, CSV, network, console.
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
const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__TTS.S)));
const pos = (page) => page.evaluate(() => ({ x: window.__TTS.AV.pos.x, y: window.__TTS.AV.pos.y, z: window.__TTS.AV.pos.z }));
const tp = (page, x, z, y = 0) => page.evaluate(([x, z, y]) => window.__TTS.teleport(x, z, y), [x, z, y]);
const waitMode = (page, mode, ms = 20000) => page.waitForFunction((m) => window.__TTS.S.mode === m, mode, { timeout: ms }).then(() => true, () => false);

async function collectThree(page) {
  const picks = await page.evaluate(() => window.__TTS.world().pickups.map((p) => ({ x: p.x, z: p.z, top: p.top })));
  for (const p of picks.slice(0, 3)) { await tp(page, p.x, p.z, p.top); await wait(500); }
  await wait(1300);
}
async function wordStones(page, { wrongFirst = false, shot = null } = {}) {
  const C = await page.evaluate(() => ({ X: window.__TTS.PAD_X, Z: window.__TTS.PAD_Z, ws: window.__TTS.WORD_START }));
  for (let q = 0; q < 3; q++) {
    await wait(300);
    const ok = await page.evaluate(() => window.__TTS.correctPad());
    if (wrongFirst && q === 0) {
      await tp(page, C.X[(ok + 1) % 3], C.Z, 0.3);
      await wait(400);
      if (shot) await page.screenshot({ path: join(OUT, shot.replace('.png', '_wrong.png')) });
      await wait(900);
    }
    if (shot && q === 0) { await tp(page, C.ws.x, C.ws.z); await wait(600); await page.screenshot({ path: join(OUT, shot) }); }
    await tp(page, C.X[ok], C.Z, 0.3);
    await wait(2300);
  }
}
async function goStage(page) {
  const st = await page.evaluate(() => window.__TTS.STAGE);
  await tp(page, st.x, st.z, st.top);
  return waitMode(page, 'talk', 5000);
}
async function goPortal(page) {
  const p = await page.evaluate(() => window.__TTS.PORTAL);
  await tp(page, p.x, p.z + 1, 0.4);
  return waitMode(page, 'warp', 5000);
}

// ================= Run A: full trip with Jerónimo =================
{
  const { ctx, page, errors, external } = await openPage();
  await page.screenshot({ path: join(OUT, '01_title.png') });
  check('Title screen visible', await page.isVisible('#L-title'));
  await page.keyboard.press('1');
  await wait(600);
  check('Key 1 -> briefing for Jerónimo', (await S(page)).mode === 'brief' && (await page.textContent('#b-hi')).includes('Jerónimo'));
  await page.screenshot({ path: join(OUT, '02_brief.png') });
  await page.keyboard.press('Enter');
  await wait(1200);
  let s = await S(page);
  check('Enter starts the trip in YESTERDAY LAND', s.mode === 'play' && s.wi === 0 && s.quest === 0);
  await page.screenshot({ path: join(OUT, '03_arrival_past.png') });
  await wait(2500);

  // real keyboard movement + jump
  const p0 = await pos(page);
  await page.keyboard.down('ArrowUp'); await wait(900); await page.keyboard.up('ArrowUp');
  const p1 = await pos(page);
  check('Arrow Up walks the traveler forward', p1.z < p0.z - 1, `z ${p0.z.toFixed(1)} -> ${p1.z.toFixed(1)}`);
  await page.keyboard.down('ArrowLeft'); await wait(1200); await page.keyboard.up('ArrowLeft');
  const p2 = await pos(page);
  check('Arrow Left walks left', p2.x < p1.x - 0.5);
  await page.keyboard.press('Space');
  await wait(180);
  const p3 = await pos(page);
  check('Space jumps', p3.y > 0.4, `y=${p3.y.toFixed(2)}`);
  await wait(800);
  await page.screenshot({ path: join(OUT, '04_explore_past.png') });

  // walk into a pickup with the keyboard (teleport next to it, then press arrow)
  const pk = await page.evaluate(() => window.__TTS.world().pickups.find((p) => p.top === 0));
  await tp(page, pk.x, pk.z + 4);
  await wait(200);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(() => window.__TTS.S.collected[0].length === 1, null, { timeout: 6000 }).catch(() => {});
  await page.keyboard.up('ArrowUp');
  await wait(300);
  s = await S(page);
  check('Walking into a shining thing collects it', s.collected[0].length === 1, s.collected[0].join());
  await page.screenshot({ path: join(OUT, '05_collect.png') });
  // the rest
  const rest = await page.evaluate(() => window.__TTS.world().pickups.filter((p) => !p.taken).map((p) => ({ x: p.x, z: p.z, top: p.top })));
  for (const p of rest.slice(0, 2)) { await tp(page, p.x, p.z, p.top); await wait(500); }
  await wait(1300);
  s = await S(page);
  check('3 things -> Word Stones challenge', s.collected[0].length === 3 && s.quest === 1);

  await wordStones(page, { wrongFirst: true, shot: '06_wordstones.png' });
  s = await S(page);
  check('Word Stones: wrong answer allowed, 3 answered, first-try score = 2', s.quest === 2 && s.words[0] === 2, `words=${s.words[0]}`);

  check('Stepping on the stage starts the talk', await goStage(page));
  await wait(1500);
  await page.keyboard.press('2');
  await wait(600);
  s = await S(page);
  check('Teacher key 2 gives 2 stars', s.stars[0] === 2);
  await page.screenshot({ path: join(OUT, '07_talk_past.png') });
  await page.keyboard.press('p');
  const t1 = (await S(page)).talkLeft;
  await wait(1200);
  s = await S(page);
  check('P pauses the talk timer', s.paused && Math.abs(s.talkLeft - t1) < 0.01);
  await page.screenshot({ path: join(OUT, '08_paused.png') });
  await page.keyboard.press('p');
  await wait(900);
  check('P resumes', (await S(page)).talkLeft < t1 - 0.3);
  await page.keyboard.press('r');
  await wait(100);
  check('R restarts the talk timer', (await S(page)).talkLeft > 59.5);
  await page.keyboard.press('3');
  await page.keyboard.press(' '); // kid's space must NOT end the talk
  await wait(300);
  check('Space does not end the talk', (await S(page)).mode === 'talk');
  await page.keyboard.press('Enter');
  await wait(1200);
  s = await S(page);
  check('Enter ends the talk -> portal quest', s.mode === 'play' && s.quest === 3 && s.stars[0] === 3);
  await page.screenshot({ path: join(OUT, '09_portal_open.png') });

  check('Portal starts the time warp', await goPortal(page));
  await wait(1500);
  await page.screenshot({ path: join(OUT, '10_warp.png') });
  await wait(2600);
  s = await S(page);
  check('Arrive in TODAY TOWN', s.mode === 'play' && s.wi === 1);
  await wait(800);
  await page.screenshot({ path: join(OUT, '11_arrival_present.png') });
  await wait(2200);

  // World 2
  await collectThree(page);
  await page.screenshot({ path: join(OUT, '12_present_after_collect.png') });
  await wordStones(page, { shot: '13_wordstones_present.png' });
  await goStage(page);
  await wait(1200);
  await page.keyboard.press('1');
  await wait(500);
  await page.screenshot({ path: join(OUT, '14_talk_present.png') });
  await page.keyboard.press('Enter');
  await wait(900);
  await goPortal(page);
  await waitMode(page, 'play', 8000);
  s = await S(page);
  check('Arrive in TOMORROW CITY', s.wi === 2);
  await wait(3000);
  await page.screenshot({ path: join(OUT, '15_future.png') });

  // World 3 using teacher skip (K) for all four challenges
  await page.keyboard.press('k');
  await wait(1500);
  check('K skips Find 3 things', (await S(page)).quest === 1);
  await page.keyboard.press('k');
  await wait(500);
  check('K skips Word Stones', (await S(page)).quest === 2);
  await page.keyboard.press('k');
  await wait(1200);
  check('K starts the talk', (await S(page)).mode === 'talk');
  await page.keyboard.press('2');
  await wait(600);
  await page.screenshot({ path: join(OUT, '16_talk_future.png') });
  await page.keyboard.press('Enter');
  await wait(900);
  await page.keyboard.press('k');
  check('Last portal -> finale', await waitMode(page, 'finale', 8000));
  await wait(2500);
  s = await S(page);
  check('Finale totals', s.stars.join() === '3,1,2' && s.words[0] === 2 && s.words[1] === 3, `stars=${s.stars} words=${s.words}`);
  await page.screenshot({ path: join(OUT, '17_finale.png') });

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv')]);
  const csvPath = join(OUT, dl.suggestedFilename());
  await dl.saveAs(csvPath);
  const csv = readFileSync(csvPath, 'utf8');
  console.log('CSV:', dl.suggestedFilename());
  console.log(csv);
  check('CSV: header + 9 rows for Jerónimo', /player,world,challenge,score,max,details,date/.test(csv) && (csv.match(/^Jerónimo,/gm) || []).length === 9);
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('d')]);
  check('Key D downloads CSV', !!dl2.suggestedFilename());
  await page.keyboard.press('n');
  await wait(800);
  check('N -> back to title', (await S(page)).mode === 'title');
  check('No console errors/warnings (run A)', errors.length === 0, errors.slice(0, 5).join(' | '));
  check('No external requests (run A)', external.length === 0, external.join(' '));
  await ctx.close();
}

// ================= Run B: Luciana, talk timer runs out by itself =================
{
  const { ctx, page, errors, external } = await openPage('?t=4');
  await page.click('.player[data-p="1"]');
  await wait(500);
  await page.keyboard.press('Enter');
  await wait(3500);
  await page.screenshot({ path: join(OUT, '18_luciana.png') });
  await collectThree(page);
  await wordStones(page);
  await goStage(page);
  await wait(6500);
  const s = await S(page);
  check('Talk ends by itself when time is up', s.mode === 'play' && s.quest === 3);
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
