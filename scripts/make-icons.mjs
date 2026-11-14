#!/usr/bin/env node
// The Dida icon set (H78, part 2b; the tile retired 2026-11-14), drawn from
// the mark's own paths: public/dida-logo-light.svg, the ink mark. Run it
// again whenever the mark changes:  node scripts/make-icons.mjs
//
// No dark tile anywhere (Yoonji, 2026-11-14). The mark is transparent where
// the platform shows it on its own ground — the browser tab, ink on light and
// white on dark — and on white where a platform needs an opaque square: the
// app icons, the push icon, the link preview. The _docs originals stay as
// exported.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

// The mark's two pages, back then front, in its own 236 × 284 box.
const source = readFileSync(join(PUBLIC, 'dida-logo-light.svg'), 'utf8');
const [back, front] = [...source.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (!back || !front) throw new Error('dida-logo-light.svg: expected two paths');
const MARK_W = 236;
const MARK_H = 284;

/** On light grounds: the front page in ink, the back an opaque light grey. */
export const INK_MARK = { back: '#D0D0D4', front: '#161622' };
/** On dark grounds: the front white, the back the grey the dark export's 20% white made (#48484F). */
export const WHITE_MARK = { back: '#48484F', front: '#FFFFFF' };

// The export sits the mark 7.5/441 above centre: its optical centre, since
// the front page hangs lower and carries the weight. Kept on every square.
const LIFT = 7.5 / 441;
// The mark's height on an app icon (review, 2026-11-13): about 58%.
const ICON_MARK = 0.58;
// In the tab, with no tile to frame it, the mark fills the canvas (about 90%).
const TAB_MARK = 0.9;

/** The mark in a square of `size`, `height` its share of it, optically centred. */
function markIn(size, height, colors, { lift = true, classes = false } = {}) {
  const scale = (size * height) / MARK_H;
  const x = (size - MARK_W * scale) / 2;
  const y = (size - MARK_H * scale) / 2 - (lift ? size * LIFT : 0);
  const cls = (name) => (classes ? ` class="${name}"` : '');
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    `<path${cls('b')} d="${back}" fill="${colors.back}"/>` +
    `<path${cls('f')} d="${front}" fill="${colors.front}"/></g>`
  );
}

const svg = (size, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;

/** An app icon: the ink mark on white, rounded where the platform shows the file as it is. */
function onWhite(size, { rounded, height = ICON_MARK }) {
  const rx = rounded ? Math.round(size * (98 / 441)) : 0;
  return svg(
    size,
    `<rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF"/>` +
      markIn(size, height, INK_MARK),
  );
}

async function png(source, file) {
  const out = join(PUBLIC, file);
  await sharp(Buffer.from(source)).png().toFile(out);
  return out;
}

/** An .ico of PNG entries (Vista+), which every browser reads. */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = [];
  let offset = 6 + 16 * entries.length;
  for (const { size, data } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

const made = [];
// App icons: white, the ink mark at 58%; maskable keeps the middle 80% safe.
made.push(await png(onWhite(180, { rounded: false }), 'dida-apple-touch-icon.png'));
made.push(await png(onWhite(192, { rounded: true }), 'dida-icon-192.png'));
made.push(await png(onWhite(512, { rounded: true }), 'dida-icon-512.png'));
made.push(
  await png(
    onWhite(512, { rounded: false, height: ICON_MARK * 0.8 }),
    'dida-icon-maskable-512.png',
  ),
);
// Android's status-bar badge is drawn from alpha alone: a white silhouette
// on transparent, the back page fainter so the two pages part (unchanged).
made.push(
  await png(
    svg(96, markIn(96, 0.8, { back: 'rgba(255,255,255,0.45)', front: '#FFFFFF' })),
    'dida-badge-96.png',
  ),
);

// The tab: transparent, the ink mark, at about 90%, centred (no tile to lift
// it in). 16 and 32px drawn at 8x and reduced, for the .ico and as PNGs.
const tab = (size, colors) => svg(size, markIn(size, TAB_MARK, colors, { lift: false }));
const small = await Promise.all(
  [16, 32].map(async (size) => ({
    size,
    data: await sharp(Buffer.from(tab(size * 8, INK_MARK)))
      .resize(size, size)
      .png()
      .toBuffer(),
  })),
);
for (const { size, data } of small) {
  writeFileSync(join(PUBLIC, `dida-favicon-${size}.png`), data);
  made.push(join(PUBLIC, `dida-favicon-${size}.png`));
}
writeFileSync(join(PUBLIC, 'favicon.ico'), ico(small));
made.push(join(PUBLIC, 'favicon.ico'));
// The vector favicon: the ink mark, and under a dark browser theme the
// white mark with a lighter back page (#6E6E76, favicon only, 2026-11-14):
// #48484F all but vanished on a dark tab (#35363A) at 16px.
const TAB_DARK_BACK = '#6E6E76';
writeFileSync(
  join(PUBLIC, 'dida-favicon.svg'),
  svg(
    64,
    `<style>@media (prefers-color-scheme: dark){.f{fill:${WHITE_MARK.front}}.b{fill:${TAB_DARK_BACK}}}</style>` +
      markIn(64, TAB_MARK, INK_MARK, { lift: false, classes: true }),
  ),
);
made.push(join(PUBLIC, 'dida-favicon.svg'));

// The link preview: 1200 × 630, the ink mark and the name on white.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const MARK_PX = 200;
await page.setContent(`<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=block">
<style>
  html,body{margin:0;width:1200px;height:630px;background:#FFFFFF;}
  body{display:flex;align-items:center;justify-content:center;gap:64px;font-family:Poppins,sans-serif;color:#161621;letter-spacing:-0.05em}
  h1{margin:0;font-size:88px;font-weight:600;line-height:1}
  p{margin:20px 0 0;font-size:34px;font-weight:400;color:#5C5C66;letter-spacing:-0.03em}
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${(MARK_PX * MARK_W) / MARK_H}" height="${MARK_PX}" viewBox="0 0 ${MARK_W} ${MARK_H}"><path d="${back}" fill="${INK_MARK.back}"/><path d="${front}" fill="${INK_MARK.front}"/></svg>
<div><h1>Dida Diary</h1><p>A digital diary you decorate.</p></div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => document.fonts.check('600 88px Poppins')))) {
  throw new Error('Poppins did not load; the preview would be set in a fallback face');
}
await page.screenshot({ path: join(PUBLIC, 'dida-og-image.png') });
await browser.close();

console.log(made.concat(join(PUBLIC, 'dida-og-image.png')).join('\n'));
