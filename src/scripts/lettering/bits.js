// The site's pixel lettering, its pure part (no DOM: the server uses it too, components/PixelWord.astro).
// A hand-drawn lowercase alphabet (letters.json, the draft's #letters block, style "pixel": 2-cell stems on an
// x-height of 10 cells, 18 rows in all; its door set, 23 rows, for the home's door words and an article's way
// back). A word is a grid of cells: { w, h, bits } (bits[y * w + x] is 1 where there is ink).
import LET from './letters.json' with { type: 'json' };

/**
 * @typedef {{ asc: number, x: number, desc: number, track: number, space: number, glyphs: Record<string, string> }} LetterStyle
 * @typedef {{ w: number, h: number, bits: Uint8Array, S: LetterStyle, list: { x: number, R: string[] }[], fit: boolean }} WordBits
 */

/** the name's and the titles' alphabet */
/** @type {LetterStyle & { doors: LetterStyle[] }} */
export const PIXEL = LET.pixel;
/** the home's door words' own set (23 cells tall; a post's way back used it until 2026-10-21) */
/** @type {LetterStyle} */
export const DOOR_SET = LET.pixel.doors[0];
/** the rows of a set: the height of every word in cells */
/** @param {LetterStyle} [style] */
export function rowsOf(style = PIXEL) { return style.asc + style.x + style.desc; }

/** a word's cells (the draft's wordBits): letters `track` cells apart, a space `space` cells */
/** @param {string} text @param {LetterStyle} [style] @returns {WordBits} */
export function wordBits(text, style = PIXEL) {
  const S = style;
  const rows = S.asc + S.x + S.desc;
  let x = 0;
  const list = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') { x += S.space; continue; }
    const g = S.glyphs[ch] || S.glyphs[ch.toLowerCase()];
    if (!g) continue;
    const R = g.split(' ');
    if (list.length && text[i - 1] !== ' ') x += S.track;
    list.push({ x, R });
    x += R[0].length;
  }
  const w = Math.max(1, x);
  const bits = new Uint8Array(w * rows);
  list.forEach((L) => L.R.forEach((row, y) => { for (let k = 0; k < row.length; k++) if (row[k] === '#') bits[y * w + L.x + k] = 1; }));
  return { w, h: rows, bits, S, list, fit: S === PIXEL && S.asc >= 2 && S.desc >= 2 && S.x >= 8 && !(S.x % 2) };
}

/** a drawing given as rows of '#' (ink) and '.' (paper) */
export function bitsFromRows(rows) {
  const h = rows.length;
  let w = 0;
  rows.forEach((r) => { w = Math.max(w, r.length); });
  const bits = new Uint8Array(w * h);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#' || r[x] === 'x') bits[y * w + x] = 1; });
  return { w, h, bits };
}

/** figures as a word for the fitting: each a glyph (its rows), track cells apart; no band is theirs */
export function figureBits(glyphs, track) {
  let x = 0, h = 0;
  const list = [];
  glyphs.forEach((R) => {
    if (!R || !R.length) return;
    if (list.length) x += track;
    list.push({ x, R });
    x += R[0].length; h = Math.max(h, R.length);
  });
  const bits = new Uint8Array(Math.max(1, x) * Math.max(1, h));
  list.forEach((L) => L.R.forEach((row, y) => { for (let k = 0; k < row.length; k++) if (row.charAt(k) === '#') bits[y * x + L.x + k] = 1; }));
  return { w: Math.max(1, x), h: Math.max(1, h), bits, S: { own: () => false, track }, list, fit: true };
}

/** the word as one SVG path in cell units: each row's runs of ink, a rectangle each */
/** @param {{ w: number, h: number, bits: Uint8Array }} B */
export function wordPath(B) {
  let d = '';
  for (let y = 0; y < B.h; y++) {
    for (let x = 0; x < B.w; x++) {
      if (!B.bits[y * B.w + x]) continue;
      let e = x;
      while (e + 1 < B.w && B.bits[y * B.w + e + 1]) e++;
      d += `M${x} ${y}h${e - x + 1}v1h-${e - x + 1}z`;
      x = e;
    }
  }
  return d;
}
