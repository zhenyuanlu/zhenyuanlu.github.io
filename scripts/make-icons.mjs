// Draws the site's icons and its social card into public/ (run again after changing the lettering or the home's
// sentence: node scripts/make-icons.mjs). The icons are whole cells of the pixel lettering on the day's paper, in its
// ink: favicon.svg, favicon.ico (32 x 32), apple-touch-icon.png (180), icon-192.png, icon-512.png,
// icon-maskable-512.png (the letters inside the maskable safe zone). social-card.png (1200 x 630) is the home's corner
// (the owner's pick, 2026-10-17): the name in cells, its "phd" in grey; under it the sentence in two lines of Figtree,
// the second ending in the home's point; and the road leaving from the point, as on the home, turning down at the
// margin and out by the card's foot. The sentence is set by sharp's own Pango from the fontsource file, so nothing
// else is needed; its two lines must be content/site.yaml's sentence (the script stops when they are not). A post's
// own card is made at build time from its cover (src/pages/og/[slug].png.ts).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import YAML from 'yaml';
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
/** a WOFF (1.0) font as a plain TTF, for Pango, which reads no WOFF: each table inflated by node's own zlib and
 * written back into an sfnt in the WOFF's (sorted) order, on four-byte bounds, with its own checksum */
function woffToTtf(w) {
  if (w.readUInt32BE(0) !== 0x774f4646) throw new Error('not a WOFF 1.0 font');
  const n = w.readUInt16BE(12), head = Buffer.alloc(12 + 16 * n), parts = [head];
  let sel = 0;
  while (2 << sel <= n) sel++;                               // the sfnt's binary-search fields
  head.writeUInt32BE(w.readUInt32BE(4), 0); head.writeUInt16BE(n, 4);
  head.writeUInt16BE(16 << sel, 6); head.writeUInt16BE(sel, 8); head.writeUInt16BE(16 * n - (16 << sel), 10);
  let at = head.length;
  for (let i = 0; i < n; i++) {
    const e = 44 + 20 * i, off = w.readUInt32BE(e + 4), len = w.readUInt32BE(e + 8), orig = w.readUInt32BE(e + 12);
    const data = len < orig ? zlib.inflateSync(w.subarray(off, off + len)) : w.subarray(off, off + len);
    if (data.length !== orig) throw new Error('a WOFF table did not come out at its own length');
    head.writeUInt32BE(w.readUInt32BE(e), 12 + 16 * i); head.writeUInt32BE(w.readUInt32BE(e + 16), 16 + 16 * i);
    head.writeUInt32BE(at, 20 + 16 * i); head.writeUInt32BE(orig, 24 + 16 * i);
    parts.push(data, Buffer.alloc(-orig & 3));
    at += orig + (-orig & 3);
  }
  return Buffer.concat(parts);
}
/** a line of Figtree at `size` px in the ink, by sharp's own Pango (its 400, whose family the fontsource file calls
 * "Figtree Light"). The picture comes cut to its ink, so an unseen bar after the words (Figtree's "|", from -220 to
 * 790 of its 1000, outreaches every letter) gives each line the same top, and an "x" on the same bar tells how far
 * under that top the baseline is. Returns the picture (raw RGBA), that depth and the width of the words' own ink */
async function figtreeLine(words, size, fontfile) {
  const set = (markup) => sharp({ text: { text: `${markup}<span alpha="1">|</span>`, font: `Figtree Light,Figtree ${size}`, fontfile, dpi: 72, rgba: true } })
    .raw().toBuffer({ resolveWithObject: true });
  const inked = ({ data, info }, f) => { for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3]) f(x, y); };
  let base = 0, ink = 0;
  inked(await set('x'), (x, y) => { base = Math.max(base, y + 1); });
  const line = await set(`<span foreground="${INK}">${words.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`);
  inked(line, (x) => { ink = Math.max(ink, x + 1); });
  return { input: line.data, raw: { width: line.info.width, height: line.info.height, channels: 4 }, base, ink };
}

fs.writeFileSync(path.join(OUT, 'favicon.svg'), iconSvg(32, 0.82, { dark: true }));
fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(await png(iconSvg(32, 0.82)), 32));
await png(iconSvg(180, 0.6), 'apple-touch-icon.png');
await png(iconSvg(192, 0.6), 'icon-192.png');
await png(iconSvg(512, 0.6), 'icon-512.png');
await png(iconSvg(512, 0.46), 'icon-maskable-512.png');

// the social card: the home's corner (above)
{
  const W = 1200, H = 630;
  const name = wordBits('zhenyuan lu'), phd = wordBits('phd');
  const cell = 8, small = 4;
  const x = 96, y = 176;
  const nameW = name.w * cell;
  const baseY = y + (name.S.asc + name.S.x) * cell;          // the baseline
  const px = x + nameW + 20, py = baseY - (phd.S.asc + phd.S.x) * small;
  // the sentence as the home breaks it (its balanced wrap: after "and"), 48px on the home's 1.5, the first line's
  // baseline 92px under the name's, each line's first ink on the name's edge
  const LINES = ['Deep learning scientist at Seurat and', 'AI/ML adjunct faculty at Northeastern.'];
  const sentence = String(YAML.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.yaml'), 'utf8')).site.sentence).trim();
  if (LINES.join(' ') !== sentence) throw new Error(`the card's two lines are not content/site.yaml's sentence; set them again here (LINES):\n  ${sentence}`);
  const size = 48, b1 = baseY + 92, b2 = b1 + size * 1.5;
  const ttf = path.join(os.tmpdir(), `zl-figtree-${process.pid}.ttf`);
  fs.writeFileSync(ttf, woffToTtf(fs.readFileSync(fileURLToPath(import.meta.resolve('@fontsource/figtree/files/figtree-latin-400-normal.woff')))));
  let l1, l2;
  try { l1 = await figtreeLine(LINES[0], size, ttf); l2 = await figtreeLine(LINES[1], size, ttf); } finally { fs.rmSync(ttf, { force: true }); }
  // the point, as the home's: .5em after the period's own advance (Figtree's period keeps 49 of its 1000 after its
  // ink), on the x-height's middle; the road from it to the margin, the home's turn (36, its handles 22), then down
  const cx = Math.round(x + l2.ink + size * (0.049 + 0.5) + 7), cy = Math.round(b2 - size / 4);
  const xr = W - x, r = 36, k = 22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">` +
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>` +
    `<path transform="translate(${x} ${y}) scale(${cell})" fill="${INK}" d="${wordPath(name)}"/>` +
    `<path transform="translate(${px} ${py}) scale(${small})" fill="${GREY}" d="${wordPath(phd)}"/>` +
    `<path d="M${cx} ${cy} H${xr - r} C${xr - r + k} ${cy} ${xr} ${cy + r - k} ${xr} ${cy + r} V${H + 4}" fill="none" stroke="${LINE}" stroke-width="2" shape-rendering="geometricPrecision"/>` +
    `<circle cx="${cx}" cy="${cy}" r="7" fill="${INK}" shape-rendering="geometricPrecision"/>` +
    `</svg>`;
  const card = await sharp(await png(svg)).composite([
    { input: l1.input, raw: l1.raw, left: x, top: b1 - l1.base },
    { input: l2.input, raw: l2.raw, left: x, top: b2 - l2.base },
  ]).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(OUT, 'social-card.png'), card);
}
console.log('icons and the social card written to public/');
