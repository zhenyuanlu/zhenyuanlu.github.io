// Draws the site's icons and its social card from the pixel lettering, into public/ (run again after changing
// the lettering: node scripts/make-icons.mjs). Everything is whole cells on the day's paper, in its ink:
//   favicon.svg, favicon.ico (32 x 32), apple-touch-icon.png (180), icon-192.png, icon-512.png,
//   icon-maskable-512.png (the letters inside the maskable safe zone), social-card.png (1200 x 630: the name, its
//   "phd" in grey, and the line the home's road leaves from, ending in its point). A post's own card is made at
//   build time from its cover (src/pages/og/[slug].png.ts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { wordBits, wordPath } from '../src/scripts/lettering/bits.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const PAPER = '#fcfcfa', INK = '#1b1b1b', GREY = '#666666', LINE = '#6b6b6b', NIGHT = '#131418', NIGHT_INK = '#e8e6e1';

/** the rows a word's ink actually uses (top, bottom) */
function inkRows(B) {
  let top = B.h, bot = -1;
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (B.bits[y * B.w + x]) { top = Math.min(top, y); bot = Math.max(bot, y); }
  return [top, bot];
}
/** a square icon: "zl" in cells, centred; `fill` the share of the side the letters may take */
function iconSvg(size, fill, opts = {}) {
  const B = wordBits('zl');
  const [top, bot] = inkRows(B);
  const rows = bot - top + 1;
  const cell = Math.max(1, Math.floor((size * fill) / Math.max(rows, B.w)));
  const w = B.w * cell, h = rows * cell;
  const x = Math.round((size - w) / 2), y = Math.round((size - h) / 2) - top * cell;
  const dark = opts.dark ? `<style>@media (prefers-color-scheme: dark) { rect { fill: ${NIGHT} } path { fill: ${NIGHT_INK} } }</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${dark}` +
    `<rect width="${size}" height="${size}" fill="${PAPER}"/>` +
    `<path transform="translate(${x} ${y}) scale(${cell})" fill="${INK}" d="${wordPath(B)}"/></svg>`;
}
async function png(svg, file) {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  if (file) fs.writeFileSync(path.join(OUT, file), buf);
  return buf;
}
/** an .ico holding one PNG */
function ico(pngBuf, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(size >= 256 ? 0 : size, 6); head.writeUInt8(size >= 256 ? 0 : size, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(pngBuf.length, 14); head.writeUInt32LE(22, 18);
  return Buffer.concat([head, pngBuf]);
}

fs.writeFileSync(path.join(OUT, 'favicon.svg'), iconSvg(32, 0.82, { dark: true }));
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(await png(iconSvg(32, 0.82)), 32));
await png(iconSvg(180, 0.6), 'apple-touch-icon.png');
await png(iconSvg(192, 0.6), 'icon-192.png');
await png(iconSvg(512, 0.6), 'icon-512.png');
await png(iconSvg(512, 0.46), 'icon-maskable-512.png');

// the social card: the name as the home sets it, its "phd" in grey, the road's first line and its point
{
  const W = 1200, H = 630;
  const name = wordBits('zhenyuan lu'), phd = wordBits('phd');
  const cell = 8, small = 4;
  const x = 96, y = 176;
  const nameW = name.w * cell;
  const baseY = y + (name.S.asc + name.S.x) * cell;          // the baseline
  const px = x + nameW + 20, py = baseY - (phd.S.asc + phd.S.x) * small;
  const lineY = baseY + 132;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<path transform="translate(${x} ${y}) scale(${cell})" fill="${INK}" d="${wordPath(name)}"/>` +
    `<path transform="translate(${px} ${py}) scale(${small})" fill="${GREY}" d="${wordPath(phd)}"/>` +
    `<rect x="${x}" y="${lineY}" width="${W - 2 * x}" height="2" fill="${LINE}"/>` +
    `<circle cx="${W - x}" cy="${lineY + 1}" r="7" fill="${INK}" shape-rendering="geometricPrecision"/>` +
    `</svg>`;
  await png(svg, 'social-card.png');
}
console.log('icons and the social card written to public/');
