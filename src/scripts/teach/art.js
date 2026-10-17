// teach's pixel pictures, the pure part (the draft v2ac's teach.js, unchanged in what it draws; no DOM, so the server
// draws the same cells for a reader without script, pages/teach.astro, and the browser paints them,
// scripts/teach/index.js): a course's tally, a book a term, and the open books' covers, 20 x 28 cells.
// Every picture is grey line art at rest; in hand it comes into its colour cell by cell in a scattered order.

/** a season's first and last day (months 0-based) for "running today", and its order inside a year */
export const SEASON = { Spring: [0, 10, 3, 30, 0], Summer: [4, 1, 7, 20, 1], Fall: [8, 1, 11, 20, 2] };
/** each course's colour (muted, beside the home's palette; never red), and the spare ones for a course not listed */
export const HUE = { IE6600: '#5286c4', IE7945: '#cf9447', IE7275: '#9183b6', IE5976: '#6c9f5c' };
export const SPARE = ['#5e9b95', '#b8846a'];
/** a book of a tally: 3 cells wide, a cell between books, 9 tall (every term the same), cells of 2px; the dissolve
    takes DUR ms each way; a pointer must rest INTENT ms on a row to take it */
export const BW = 3, GAP = 1, TALL = 9, CELL = 2, DUR = 360, INTENT = 50;

export function parseSem(s) { const m = /^(Spring|Summer|Fall)\s+(\d{4})$/.exec(s || ''); return m ? { season: m[1], year: +m[2] } : null; }
export function running(sem, t) {
  if (!sem || !t) return false;
  const S = SEASON[sem.season], a = new Date(sem.year, S[0], S[1]), b = new Date(sem.year, S[2], S[3], 23);
  return t >= a && t <= b;
}
/** a course's tally size in cells */
export function tallySize(n) { return [n * BW + (n - 1) * GAP, TALL]; }

function rgbOf(s) {
  s = String(s || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16));
  m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(s);
  return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}
function css(c) { return 'rgb(' + c.map(Math.round).join(',') + ')'; }
function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
/** a colour for the stage: dusk a touch warmer, night moonlit and lifted off the dark paper */
export function graded(h, stage) {
  const c = rgbOf(h);
  if (stage === 'dusk') return css(mix(c, [226, 150, 84], 0.1));
  if (stage === 'night') return css(mix(mix(c, [86, 104, 168], 0.14), [232, 230, 225], 0.1));
  return css(c);
}
/** a lit edge: the colour drawn toward the ink */
export function rim(hue, T, stage) { return css(mix(rgbOf(graded(hue, stage)), rgbOf(T.ink), stage === 'night' ? 0.25 : 0.45)); }
/** a seeded random (as the home's), so a course dissolves in the same scattered order every time */
function rng(a) {
  return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function seedOf(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; }
/** each book's cells in a scattered order: a cell lights once the course's share in colour passes its rank. Every
    book's ranks are spread evenly over (0, 1) (its own shuffle, offset by its own fraction of a step), so all the
    books fill together, never more than a cell apart, and none in step with another */
export function ranks(code, n) {
  const R = rng(seedOf(code)), N = BW * TALL, out = [];
  for (let k = 0; k < n; k++) {
    const a = [], r = new Float32Array(N), u = R();
    for (let i = 0; i < N; i++) a.push(i);
    for (let m = N - 1; m > 0; m--) { const q = Math.floor(R() * (m + 1)), x = a[m]; a[m] = a[q]; a[q] = x; }
    a.forEach((cell, pos) => { r[cell] = (pos + u) / N; });
    out.push(r);
  }
  return out;
}
/** a tally: put(x, y, colour) for each cell; p the share in colour (0 at rest), red[k] for a term running today */
export function drawTally(put, T, stage, n, hueOf, rank, p, red) {
  const hue = graded(hueOf, stage), edge = rim(hueOf, T, stage);
  for (let k = 0; k < n; k++) {
    const x0 = k * (BW + GAP), R = rank[k];
    for (let y = 0; y < TALL; y++) {
      const band = y === 0 || y === TALL - 1 || y === 2;   // the outline, and a label band near the top
      for (let j = 0; j < BW; j++) {
        const on = R[y * BW + j] < p;
        if (red[k]) put(x0 + j, y, T.red);   // the term running today: red through, so it reads
        else if (band || j !== 1) put(x0 + j, y, on ? edge : T.grey);
        else if (on) put(x0 + j, y, hue);
      }
    }
  }
}

/* ---------- a cover: '#' a line (grey, then ink), an upper-case letter a mark or a part's edge (grey, then the
   colour the palette gives that letter; with none given, its part's colour toward the ink), a lower-case letter a
   fill (nothing, then its colour). It comes into colour as a tally does: every drawn cell has its place in one
   scattered order (seeded by the book's title, spread evenly over (0, 1)) ---------- */
function Thing(rows, pal, seed) {
  const h = rows.length, cells = [], drawn = [];
  let w = 0;
  rows.forEach((r) => { w = Math.max(w, r.length); });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = rows[y][x] || '.'; cells.push(c); if (c !== '.') drawn.push(cells.length - 1); }
  const R = rng(seedOf(seed || 'cover')), rank = new Float32Array(cells.length), u = R();
  for (let m = drawn.length - 1; m > 0; m--) { const q = Math.floor(R() * (m + 1)), t = drawn[m]; drawn[m] = drawn[q]; drawn[q] = t; }
  drawn.forEach((cell, pos) => { rank[cell] = (pos + u) / drawn.length; });
  return { w, h, cells, pal, rank };
}
export function drawThing(Th, p, put, T, stage) {
  for (let i = 0; i < Th.cells.length; i++) {
    const ch = Th.cells[i], x = i % Th.w, y = (i - x) / Th.w;
    if (ch === '.') continue;
    const on = Th.rank[i] < p;
    if (ch === '#') put(x, y, on ? T.ink : T.grey);
    else if (ch !== ch.toLowerCase()) put(x, y, on ? (Th.pal[ch] ? graded(Th.pal[ch], stage) : rim(Th.pal[ch.toLowerCase()], T, stage)) : T.grey);
    else if (on) put(x, y, graded(Th.pal[ch], stage));
  }
}

/* ---------- the two covers, 20 x 28 cells: v2a's own drawings, cell for cell. At rest grey line pictures; in hand
   each lights up in four flat colours inside the ink outline: a clean cover colour (b), a deeper one of the same
   family for the spine (s), a warm accent for what the book is about and one pale tone beside it ---------- */
function grid(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w + 1).join('.').split('')); return g; }
function rect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i < g[j].length) g[j][i] = c; }
function stamp(g, x, y, R, c) { R.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') g[y + j][x + i] = c; }); }
function line(g, x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) { g[y0][x0] = c; if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function rows(g) { return g.map((r) => r.join('')); }
/** a book's shell: the outline, the spine with a band near each end, a line where the board begins */
function shell(g, spine, board, band) {
  const w = g[0].length, h = g.length;
  rect(g, 0, 0, w, h, '#');
  rect(g, 1, 1, 3, h - 2, spine);
  rect(g, 4, 1, 1, h - 2, '#');
  rect(g, 5, 1, w - 6, h - 2, board);
  rect(g, 1, 4, 3, 1, band); rect(g, 1, h - 5, 3, 1, band);
}
/** Python Notebook from Zero to Advanced: its {z} mark, and a stair from zero to advanced */
function coverPy(seed) {
  const g = grid(20, 28);
  shell(g, 's', 'b', 'A');
  stamp(g, 7, 5, ['.##', '.#.', '.#.', '##.', '.#.', '.#.', '.##'], 'A');
  stamp(g, 10, 6, ['###', '..#', '.#.', '#..', '###'], 'A');
  stamp(g, 14, 5, ['##.', '.#.', '.#.', '.##', '.#.', '.#.', '##.'], 'A');
  for (let k = 0; k < 4; k++) { rect(g, 7 + k * 3, 22 - k * 2, 3, 1, 'L'); rect(g, 7 + k * 3, 23 - k * 2, 3, 2 + k * 2, 'l'); }
  return Thing(rows(g), { s: '#2552a8', b: '#3a7bd5', A: '#ffd447', L: '#ffd447', l: '#a8d0ff' }, seed);
}
/** the R tutorial: a chart drawn and transformed (bars, and the line through them), and an R */
function coverR(seed) {
  const g = grid(20, 28);
  shell(g, 's', 'b', 'M');
  rect(g, 7, 5, 1, 11, 'P'); rect(g, 7, 15, 10, 1, 'P');
  rect(g, 9, 11, 2, 4, 'm'); rect(g, 12, 8, 2, 7, 'm'); rect(g, 15, 10, 2, 5, 'm');
  line(g, 9, 9, 12, 6, 'P'); line(g, 12, 6, 15, 8, 'P'); line(g, 15, 8, 17, 5, 'P');
  stamp(g, 10, 19, ['###.', '#..#', '###.', '#.#.', '#..#'], 'P');
  return Thing(rows(g), { s: '#126a5f', b: '#1f9d8b', M: '#ffc857', m: '#ffc857', P: '#f4fffa' }, seed);
}
/** any later book: a plain cover until it is drawn its own */
function coverPlain(seed) {
  const g = grid(20, 28);
  shell(g, 's', 'b', 'M');
  rect(g, 7, 6, 9, 1, 'M'); rect(g, 7, 8, 6, 1, 'M');
  return Thing(rows(g), { s: '#4a5263', b: '#626b7d', m: '#c9cdd6' }, seed);
}
/** a book's cover by its title: Python's for a title with "Python", R's for one that ends "in R", else a plain one */
export function coverOf(title) {
  const tt = title || '';
  return /python/i.test(tt) ? coverPy(tt) : /\bin R\s*$/.test(tt) ? coverR(tt) : coverPlain(tt);
}

/** the cells drawn at rest (the grey line art), as one SVG path in cell units (the server's picture) */
export function restPath(draw) {
  const on = new Set();
  let w = 0, h = 0;
  draw((x, y) => { on.add(`${x},${y}`); w = Math.max(w, x + 1); h = Math.max(h, y + 1); });
  let d = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!on.has(`${x},${y}`)) continue;
      let e = x;
      while (on.has(`${e + 1},${y}`)) e++;
      d += `M${x} ${y}h${e - x + 1}v1h-${e - x + 1}z`;
      x = e;
    }
  }
  return d;
}
