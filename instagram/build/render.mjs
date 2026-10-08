import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1200,height:1200} });
await p.goto('file://' + process.cwd() + '/frames.html'); await p.waitForLoadState('networkidle');
for (const id of ['perfil','hl-cca','hl-familias','hl-retos','hl-ciencia','hl-logros','hl-contacto'])
  await p.locator('#'+id).screenshot({ path: `../${id}.png` });
await b.close();
