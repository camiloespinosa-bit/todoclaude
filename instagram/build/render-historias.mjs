import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1100,height:2000} });
await p.goto('file://' + process.cwd() + '/historias.html'); await p.waitForLoadState('networkidle');
await p.evaluate(() => document.fonts.ready);
const ids = ['st-cca','st-familias','st-retos','st-ciencia','st-logros','st-contacto'];
for (const [i,id] of ids.entries())
  await p.locator('#'+id).screenshot({ path: `../historias/${i+1}-${id.slice(3)}.png` });
await b.close();
