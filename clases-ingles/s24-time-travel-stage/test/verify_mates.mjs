// Two kids in the same world see each other (online with a class code), and the wave arrives.
// Usage: PROFE_KEY=... node test/verify_mates.mjs <outdir>   (uses a local MQTT broker and web server)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import http from 'node:http';
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }
const OUT = process.argv[2] || join(here, 'shots_mates');
mkdirSync(OUT, { recursive: true });
const KEY = process.env.PROFE_KEY || '';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, info = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${info}`); };

const mod = require('aedes');
const broker = (mod.Aedes && mod.Aedes.createBroker ? await mod.Aedes.createBroker() : (mod.default || mod)());
const { WebSocketServer, createWebSocketStream } = require('ws');
const wss = new WebSocketServer({ port: 18885 });
wss.on('connection', (ws) => broker.handle(createWebSocketStream(ws)));
const html = readFileSync(join(here, '..', 'Bloque3_MyStories.html'));
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); });
await new Promise((r) => srv.listen(18086, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:18086/my-stories.html';
const B = '&broker=' + encodeURIComponent('ws://127.0.0.1:18885') + '&nodb=1';

const b = await playwright.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
const open = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 650 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(120000);
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL0 + q);
  await p.waitForFunction(() => window.__TTS && window.__TTS.S);
  await wait(1500);
  return p;
};
const teacher = await open('?profe=' + KEY + B);
await teacher.keyboard.press('t');
await wait(800);
await teacher.click('#td-new');
await wait(1500);
const code = (await teacher.textContent('#td-code')).trim();
const jero = await open(`?room=${code}` + B);
const luci = await open(`?room=${code}` + B);
await wait(2500);
for (const [p, k] of [[jero, '1'], [luci, '2']]) {
  await p.keyboard.press(k);
  await wait(800);
  await p.keyboard.press('Enter');
}
await wait(6000);
const sees = (p) => p.evaluate(() => document.body.classList.contains('hasmate'));
console.log('jero', JSON.stringify(await jero.evaluate(() => [window.__TTS.net(), window.__TTS.mates()])));
console.log('luci', JSON.stringify(await luci.evaluate(() => [window.__TTS.net(), window.__TTS.mates()])));
check('Jero sees Luciana in the same world', await sees(jero));
check('Luciana sees Jero in the same world', await sees(luci));
// Luciana walks: Jero sees her move
await luci.evaluate(() => window.__TTS.teleport(-10, 15, 0));
await wait(3000);
await jero.evaluate(() => window.__TTS.teleport(-6, 22, 0));
await wait(2500);
await jero.screenshot({ path: join(OUT, 'jero_sees_luciana.png') });
check('Wave button shows when someone is there', await jero.isVisible('#btn-wave'));
await luci.click('#btn-wave');
await wait(1500);
const fb = await jero.evaluate(() => document.body.innerText.includes('Luciana: Hi!'));
check('Jero gets Luciana\'s wave', fb);
await jero.screenshot({ path: join(OUT, 'jero_gets_wave.png') });
// Luciana goes to another world: Jero stops seeing her
await luci.keyboard.press('k');
await wait(800);
for (let i = 0; i < 40; i++) {
  const st = await luci.evaluate(() => ({ wi: window.__TTS.S.wi, t: window.__TTS.S.Q && window.__TTS.S.Q.def.type, mode: window.__TTS.S.mode }));
  if (st.wi === 1) break;
  if (st.mode === 'play' && st.t === 'portal') {
    const a = await luci.evaluate(() => window.__TTS.answer());
    if (a) await luci.evaluate((a) => window.__TTS.teleport(a.x, a.z, a.y), a);
  } else if (st.mode === 'play') await luci.keyboard.press('k');
  await wait(900);
}
await wait(4000);
check('Different worlds: they do not see each other', !(await sees(jero)));
check('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`${pass}/${pass + fail} checks passed`);
await b.close();
srv.close();
wss.close();
broker.close();
process.exit(fail ? 1 : 0);
