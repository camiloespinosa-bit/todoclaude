// Renderiza cada HTML de identidad-marca/html a PDF (y PNG de vista previa con --png).
// Usa las fuentes locales de assets/fonts porque Adobe Fonts no siempre es accesible sin red.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FONTS = path.join(ROOT, '..', 'assets', 'fonts');
const weights = [[400, 'normal', 'poppins-400'], [400, 'italic', 'poppins-400i'], [600, 'normal', 'poppins-600'],
  [700, 'normal', 'poppins-700'], [800, 'normal', 'poppins-800'], [900, 'normal', 'poppins-900']];
const fontCss = weights.map(([w, st, f]) =>
  `@font-face{font-family:"poppins";font-weight:${w};font-style:${st};src:url(data:font/woff;base64,${fs.readFileSync(path.join(FONTS, f + '.woff')).toString('base64')}) format("woff");}`).join('');

(async () => {
  const png = process.argv.includes('--png');
  const browser = await chromium.launch();
  const out = path.join(ROOT, 'pdf');
  fs.mkdirSync(out, { recursive: true });
  for (const file of fs.readdirSync(path.join(ROOT, 'html')).filter(f => f.endsWith('.html'))) {
    let html = fs.readFileSync(path.join(ROOT, 'html', file), 'utf8')
      .replace(/<link rel="stylesheet" href="https:\/\/use\.typekit\.net[^>]*>/, `<style>${fontCss}</style>`);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const name = file.replace('.html', '');
    await page.pdf({ path: path.join(out, name + '.pdf'), preferCSSPageSize: true, printBackground: true });
    if (png) {
      const slides = await page.$$('.slide');
      for (let i = 0; i < slides.length; i++) {
        await slides[i].screenshot({ path: path.join(process.env.PREVIEW_DIR || out, `${name}-${i + 1}.png`) });
      }
    }
    await page.close();
    console.log(name);
  }
  await browser.close();
})();
