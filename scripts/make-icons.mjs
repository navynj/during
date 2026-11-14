#!/usr/bin/env node
// The Dida icon set (H78, part 2b), drawn from the mark itself:
// public/dida-logo-only.svg, a copy of _docs/dida-logo-only.svg. Run it again
// whenever the mark changes:  node scripts/make-icons.mjs
//
// Tiles are the dark tile (_docs/dida-full-logo.svg): the mark on #161622.
// Rounded where the platform shows the file as it is (favicon, PWA "any",
// push), square where the platform cuts its own shape (apple-touch, maskable).
// The link preview is the dark tile and the full name on the light ground,
// set in Poppins by a browser, so it is the app's own type.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const TILE = '#161622';
// The light ground of the link preview; Part 3's background token.
const GROUND = '#FAFAF8';

// The mark's two pages, back then front, in its own 236 × 284 box.
const source = readFileSync(join(PUBLIC, 'dida-logo-only.svg'), 'utf8');
const [back, front] = [...source.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
if (!back || !front) throw new Error('dida-logo-only.svg: expected two paths');
const MARK_W = 236;
const MARK_H = 284;

// The export sits the mark 7.5/441 above centre: its optical centre, since
// the front page hangs lower and carries the weight. Kept at every size.
const LIFT = 7.5 / 441;
// The mark's height in a tile (review, 2026-11-13): about 58%, the export's
// padding read by eye; its 284/441 (64%) looked too big at app-icon sizes.
const TILE_MARK = 0.58;

/** The mark in a square of `size`, `height` its share of it, optically centred. */
function markIn(size, height, { backFill, backOpacity, frontFill }) {
  const scale = (size * height) / MARK_H;
  const x = (size - MARK_W * scale) / 2;
  const y = (size - MARK_H * scale) / 2 - size * LIFT;
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
    `<path d="${back}" fill="${backFill}" opacity="${backOpacity}"/>` +
    `<path d="${front}" fill="${frontFill}"/></g>`
  );
}

const WHITE_MARK = { backFill: '#ffffff', backOpacity: 0.2, frontFill: '#ffffff' };

/**
 * The dark tile. `height` is the mark's share: TILE_MARK; larger at favicon
 * sizes so 16px still reads; in a maskable icon TILE_MARK of the middle 80%
 * the launcher keeps, so it lands the size it does on a tile.
 */
function tile(size, { rounded, height = TILE_MARK }) {
  const rx = rounded ? Math.round(size * (98 / 441)) : 0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" rx="${rx}" fill="${TILE}"/>` +
    markIn(size, height, WHITE_MARK) +
    `</svg>`
  );
}

async function png(svg, file) {
  const out = join(PUBLIC, file);
  await sharp(Buffer.from(svg)).png().toFile(out);
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

const SMALL = 0.78; // the mark's height at 16 and 32px

const made = [];
made.push(await png(tile(180, { rounded: false }), 'dida-apple-touch-icon.png'));
made.push(await png(tile(192, { rounded: true }), 'dida-icon-192.png'));
made.push(await png(tile(512, { rounded: true }), 'dida-icon-512.png'));
made.push(
  await png(tile(512, { rounded: false, height: TILE_MARK * 0.8 }), 'dida-icon-maskable-512.png'),
);
// Android's status-bar badge is drawn from alpha alone: the white mark, no tile.
made.push(
  await png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${markIn(96, 0.8, {
      ...WHITE_MARK,
      backOpacity: 0.45,
    })}</svg>`,
    'dida-badge-96.png',
  ),
);
const small = await Promise.all(
  [16, 32].map(async (size) => ({
    size,
    data: await sharp(Buffer.from(tile(size * 8, { rounded: true, height: SMALL })))
      .resize(size, size)
      .png()
      .toBuffer(),
  })),
);
writeFileSync(join(PUBLIC, 'favicon.ico'), ico(small));
made.push(join(PUBLIC, 'favicon.ico'));
// The vector favicon: the same small-size tile, for browsers that take SVG.
writeFileSync(join(PUBLIC, 'dida-favicon.svg'), tile(64, { rounded: true, height: SMALL }));
made.push(join(PUBLIC, 'dida-favicon.svg'));

// The link preview: 1200 × 630, the tile and the name on the light ground.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=block">
<style>
  html,body{margin:0;width:1200px;height:630px;background:${GROUND};}
  body{display:flex;align-items:center;justify-content:center;gap:56px;font-family:Poppins,sans-serif;color:#161621;letter-spacing:-0.05em}
  h1{margin:0;font-size:88px;font-weight:600;line-height:1}
  p{margin:20px 0 0;font-size:34px;font-weight:400;color:#5C5C66;letter-spacing:-0.03em}
</style></head><body>
${tile(260, { rounded: true })}
<div><h1>Dida Diary</h1><p>A digital diary you decorate.</p></div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
if (!(await page.evaluate(() => document.fonts.check('600 88px Poppins')))) {
  throw new Error('Poppins did not load; the preview would be set in a fallback face');
}
await page.screenshot({ path: join(PUBLIC, 'dida-og-image.png') });
await browser.close();
made.push(join(PUBLIC, 'dida-og-image.png'));

for (const file of made) console.log(file.replace(`${ROOT}/`, ''));
