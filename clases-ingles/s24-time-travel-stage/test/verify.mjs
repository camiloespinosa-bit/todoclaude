// Headless check of S24_TimeTravelStage.html: walks all screens, tests keys, CSV, network.
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
  const errors = [];
  const external = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) external.push(u); });
  await page.goto(URL0 + query);
  await page.waitForFunction(() => window.__TTS && window.__TTS.S);
  await wait(1500);
  return { ctx, page, errors, external };
}
const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__TTS.S)));

// ---------------- Run A: full manual flow ----------------
{
  const { ctx, page, errors, external } = await openPage();
  await page.screenshot({ path: join(OUT, '1_welcome.png') });
  check('Welcome screen visible', await page.isVisible('#scr-welcome'));

  await page.keyboard.press('1');
  await wait(2800);
  let s = await S(page);
  check('Key 1 picks Jerónimo and opens Build', s.screen === 'build' && s.player === 0);

  // Past island by keyboard: Enter, Right+Enter, Down+Enter -> focus jumps to Done
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await wait(1200);
  s = await S(page);
  check('Arrows + Enter pick 3 objects', s.picks[0].join() === 'bike,guitar,dog' && s.focus === 12, s.picks[0].join());
  await page.screenshot({ path: join(OUT, '2_build_past.png') });
  await page.keyboard.press('Enter');
  await wait(2300);

  // Present island by mouse
  for (const i of [3, 5, 9]) await page.click(`#b-grid .card[data-idx="${i}"]`);
  await page.click('#b-grid .card[data-idx="5"]'); // unpick book
  await page.click('#b-grid .card[data-idx="2"]'); // pick ball
  await wait(1200);
  s = await S(page);
  check('Mouse click picks / unpicks', s.picks[1].join() === 'robot,skates,ball', s.picks[1].join());
  await page.screenshot({ path: join(OUT, '3_build_present.png') });
  await page.click('#b-grid .next');
  await wait(2300);

  // Future island by keyboard
  for (const k of ['ArrowDown', 'Enter', 'ArrowRight', 'ArrowRight', 'Enter', 'ArrowRight', 'ArrowRight', 'Enter']) await page.keyboard.press(k);
  await wait(1200);
  s = await S(page);
  check('Future picks', s.picks[2].length === 3, s.picks[2].join());
  await page.screenshot({ path: join(OUT, '4_build_future.png') });
  await page.keyboard.press('Enter');
  await wait(2900);
  s = await S(page);
  check('Ready screen', s.screen === 'ready');
  await page.screenshot({ path: join(OUT, '5_ready.png') });

  await page.keyboard.press('Space');
  await wait(3200);
  s = await S(page);
  check('Space starts the show on Past Island, timer running', s.screen === 'show' && s.showIsland === 0 && s.running && s.timeLeft < 60);

  await page.keyboard.press('2');
  await wait(500);
  s = await S(page);
  check('Key 2 gives 2 stars to Past', s.stars[0] === 2);
  await page.screenshot({ path: join(OUT, '6_show_past_stars.png') });

  await page.keyboard.press('p');
  const t1 = (await S(page)).timeLeft;
  await wait(1500);
  s = await S(page);
  check('P pauses the timer', s.paused && Math.abs(s.timeLeft - t1) < 0.01, `${t1.toFixed(2)} -> ${s.timeLeft.toFixed(2)}`);
  await page.screenshot({ path: join(OUT, '7_show_paused.png') });
  await page.keyboard.press('p');
  await wait(1200);
  s = await S(page);
  check('P resumes the timer', !s.paused && s.timeLeft < t1 - 0.5);

  await page.keyboard.press('r');
  await wait(100);
  s = await S(page);
  check('R restarts the island (timer + stars)', s.timeLeft > 59.5 && s.stars[0] === 0, s.timeLeft.toFixed(2));
  await page.keyboard.press('3');
  await wait(300);

  await page.keyboard.press('Space');
  await wait(3600);
  s = await S(page);
  check('Space moves to Present Island', s.showIsland === 1 && s.running);
  await page.keyboard.press('1');
  await wait(900);
  await page.screenshot({ path: join(OUT, '8_show_present.png') });

  await page.keyboard.press('Space');
  await wait(3600);
  s = await S(page);
  check('Space moves to Future Island', s.showIsland === 2);
  await page.keyboard.press('2');
  await wait(1200);
  await page.screenshot({ path: join(OUT, '9_show_future.png') });

  await page.keyboard.press('Space');
  await wait(4200);
  s = await S(page);
  check('Results screen after Future', s.screen === 'results' && s.stars.join() === '3,1,2', s.stars.join());
  await page.screenshot({ path: join(OUT, '10_results.png') });

  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv')]);
  const csvPath = join(OUT, dl.suggestedFilename());
  await dl.saveAs(csvPath);
  const csv = readFileSync(csvPath, 'utf8');
  console.log('CSV file:', dl.suggestedFilename());
  console.log(csv);
  check('CSV has header + 3 rows with Jerónimo', /player,island,stars,date/.test(csv) && (csv.match(/Jerónimo,(Past|Present|Future),\d,/g) || []).length === 3);

  const [dl2] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('d')]);
  check('Key D also downloads CSV', !!dl2.suggestedFilename());

  await page.keyboard.press('n');
  await wait(800);
  s = await S(page);
  check('Next player returns to Welcome and clears picks', s.screen === 'welcome' && s.picks.every((p) => p.length === 0));

  check('No console errors/warnings (run A)', errors.length === 0, errors.join(' | '));
  check('No external network requests (run A)', external.length === 0, external.join(' '));
  await ctx.close();
}

// ---------------- Run B: auto-advance with short timer ----------------
{
  const { ctx, page, errors, external } = await openPage('?t=4');
  await page.click('.player[data-p="1"]');
  await wait(2700);
  for (let isl = 0; isl < 3; isl++) {
    for (const i of [0, 1, 2]) await page.click(`#b-grid .card[data-idx="${i + isl * 3}"]`);
    await page.click('#b-grid .next');
    await wait(isl < 2 ? 2100 : 2700);
  }
  await page.keyboard.press('Space');
  // flights (2.6 + 3 + 3) + 3 x 4 s timer + results flight, no keys pressed
  await page.waitForFunction(() => window.__TTS.S.screen === 'results', null, { timeout: 40000 }).catch(() => {});
  const s = await S(page);
  check('Timer end advances islands automatically (Luciana)', s.screen === 'results' && s.player === 1);
  await wait(3500);
  await page.screenshot({ path: join(OUT, '11_results_luciana_auto.png') });
  check('No console errors/warnings (run B)', errors.length === 0, errors.join(' | '));
  check('No external network requests (run B)', external.length === 0, external.join(' '));
  await ctx.close();
}

// ---------------- Run C: no WebGL fallback ----------------
{
  const b2 = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const ctx = await b2.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(URL0);
  await wait(800);
  check('No-WebGL message shown', await page.isVisible('#nogl'));
  await page.screenshot({ path: join(OUT, '12_no_webgl.png') });
  await b2.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
