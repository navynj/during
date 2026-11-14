#!/usr/bin/env node
// The Dida icon set (H78, part 2b), drawn from the mark's own paths:
// public/dida-logo-light.svg. Run it again whenever the mark changes:
//   node scripts/make-icons.mjs
//
// Tile = app icon (Yoonji, 2026-11-14). The dark tile (_docs/dida-full-logo.svg:
// the white mark on #161622, at 58%) is the app icon — apple-touch, PWA,
// maskable, the push icon — and the link preview's centrepiece. Everywhere
// else the mark is transparent: the browser tab draws the ink mark, the
// white mark under a dark browser theme. The _docs originals stay as exported.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
/** On the tile: the white mark as exported, its back page white at 20%. */
const TILE_MARK = { back: 'rgba(255,255,255,0.2)', front: '#FFFFFF' };
const TILE = '#161622';

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

/**
 * The dark tile: the app icon. Rounded where the platform shows the file as
 * it is (PWA "any"), square where it cuts its own shape (apple-touch,
 * maskable); in a maskable icon the mark is 58% of the middle 80% the
 * launcher keeps, so it lands the size it does on a tile.
 */
function tile(size, { rounded, height = ICON_MARK }) {
  const rx = rounded ? Math.round(size * (98 / 441)) : 0;
  return svg(
    size,
    `<rect width="${size}" height="${size}" rx="${rx}" fill="${TILE}"/>` +
      markIn(size, height, TILE_MARK),
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
// App icons and the push icon (the 192): the dark tile, the mark at 58%.
made.push(await png(tile(180, { rounded: false }), 'dida-apple-touch-icon.png'));
made.push(await png(tile(192, { rounded: true }), 'dida-icon-192.png'));
made.push(await png(tile(512, { rounded: true }), 'dida-icon-512.png'));
made.push(
  await png(tile(512, { rounded: false, height: ICON_MARK * 0.8 }), 'dida-icon-maskable-512.png'),
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
// The vector favicon: the ink mark, the white mark under a dark browser theme.
writeFileSync(
  join(PUBLIC, 'dida-favicon.svg'),
  svg(
    64,
    `<style>@media (prefers-color-scheme: dark){.f{fill:${WHITE_MARK.front}}.b{fill:${WHITE_MARK.back}}}</style>` +
      markIn(64, TAB_MARK, INK_MARK, { lift: false, classes: true }),
  ),
);
made.push(join(PUBLIC, 'dida-favicon.svg'));

// The link preview: 1200 × 630, the dark tile centred on white.
const OG_TILE = 300;
made.push(
  await png(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
      `<rect width="1200" height="630" fill="#FFFFFF"/>` +
      `<g transform="translate(${(1200 - OG_TILE) / 2} ${(630 - OG_TILE) / 2})">` +
      tile(OG_TILE, { rounded: true })
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '') +
      `</g></svg>`,
    'dida-og-image.png',
  ),
);

console.log(made.join('\n'));
