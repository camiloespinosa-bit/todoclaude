import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1100,height:1500} });
await p.goto('file://' + process.cwd() + '/posts.html'); await p.waitForLoadState('networkidle');
await p.evaluate(() => document.fonts.ready);
const names = {p1:'1-hola-soy-oki', p2:'2-tu-hijo-se-distrae', p3:'3-reto-stroop'};
for (const id of await p.$$eval('section', s => s.map(x => x.id))) {
  const [post, n] = id.split('-'); const dir = `../posts/${names[post]}`; mkdirSync(dir, {recursive:true});
  await p.locator('#'+id).screenshot({ path: `${dir}/${n}.png` });
}
await b.close();
