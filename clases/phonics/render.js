// Renderiza cada HTML de esta carpeta a pdf/<nombre>.pdf (A4).
// Uso: node clases/phonics/render.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const dir = __dirname;
  fs.mkdirSync(path.join(dir, 'pdf'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.html')).sort()) {
    await page.goto('file://' + path.join(dir, f), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(dir, 'pdf', f.replace(/\.html$/, '.pdf'));
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('ok', path.relative(process.cwd(), out));
  }
  await browser.close();
})();
