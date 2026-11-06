// Builds ONE self-contained HTML file: three.js bundle + Poppins font inlined.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, 'S24_TimeTravelStage.html');

const res = await build({
  entryPoints: [join(here, 'src/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  legalComments: 'eof',
  write: false,
});
let js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const fontDir = join(here, 'node_modules/@fontsource/poppins/files');
const faces = [400, 600, 700, 800]
  .map((w) => {
    const b64 = readFileSync(join(fontDir, `poppins-latin-${w}-normal.woff2`)).toString('base64');
    return `@font-face{font-family:'Poppins';font-style:normal;font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  })
  .join('\n');

const html = readFileSync(join(here, 'src/template.html'), 'utf8')
  .replace('/*FONTS*/', () => '/* Poppins (SIL Open Font License 1.1) embedded */\n' + faces)
  .replace('/*BUNDLE*/', () => js);
writeFileSync(OUT, html);
console.log(`Wrote ${OUT} (${(statSync(OUT).size / 1024).toFixed(0)} KB)`);
