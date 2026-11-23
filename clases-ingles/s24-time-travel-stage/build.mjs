// Builds self-contained HTML files: three.js bundle + Poppins font inlined. No network needed.
//   S24_TimeTravelStage.html     -> GAME edition (src/game.js + src/game.html)
//   S24_TimeTravelStage_v1.html  -> first, simpler "stage" edition (src/main.js + src/template.html)
import { build } from 'esbuild';
import { readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fontDir = join(here, 'node_modules/@fontsource/poppins/files');
const faces = [400, 600, 700, 800]
  .map((w) => {
    const b64 = readFileSync(join(fontDir, `poppins-latin-${w}-normal.woff2`)).toString('base64');
    return `@font-face{font-family:'Poppins';font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  })
  .join('\n');

const targets = [
  { entry: 'src/games/b4.js', template: 'src/game.html', out: 'S24_TimeTravelStage.html', title: 'The Time Travel Stage', site: 'time-travel.html' },
  { entry: 'src/games/b1.js', template: 'src/game.html', out: 'Bloque1_MeTown.html', title: 'Me Town', site: 'me-town.html' },
  { entry: 'src/main.js', template: 'src/template.html', out: 'S24_TimeTravelStage_v1.html' },
];

for (const t of targets) {
  const res = await build({
    entryPoints: [join(here, t.entry)],
    bundle: true,
    format: 'iife',
    minify: true,
    target: ['es2020'],
    legalComments: 'eof',
    write: false,
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const html = readFileSync(join(here, t.template), 'utf8')
    .replace('/*FONTS*/', () => '/* Poppins (SIL Open Font License 1.1) embedded */\n' + faces)
    .replace('/*BUNDLE*/', () => js)
    .replace(/<title>[^<]*<\/title>/, (m) => (t.title ? `<title>${t.title}</title>` : m));
  const out = join(here, t.out);
  writeFileSync(out, html);
  // short public path on gimnasiodelcerebro.co/juegos/
  if (t.site) {
    const siteDir = join(here, '..', '..', 'juegos');
    mkdirSync(siteDir, { recursive: true });
    writeFileSync(join(siteDir, t.site), html);
  }
  // claude.ai artifact version: the platform adds its own <html>/<head>/<body> skeleton.
  const art = html
    .replace(/^<!doctype html>\s*/i, '')
    .replace(/<html[^>]*>|<\/html>|<head>|<\/head>|<body>|<\/body>/gi, '')
    .replace(/<meta charset="utf-8">\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '');
  mkdirSync(join(here, 'artifact'), { recursive: true });
  writeFileSync(join(here, 'artifact', t.out), art.trimStart());
  console.log(`Wrote ${t.out} (${(statSync(out).size / 1024).toFixed(0)} KB)`);
}
