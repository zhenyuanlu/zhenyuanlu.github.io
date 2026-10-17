// The home's pure helpers (the draft's home script, design/home/v2ac-article.html, each with its own comment):
// numbers, seeded randomness, easing, pixel writes, the beads' discs, the line's samples. No DOM, no state.

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* the colour keys of a drawing's rows: a cell's letter is its index in the palette */
export var KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/* the line art's strength (m1b's .72) */
export var LINE_A = Math.round(.72 * 255);

export function rng(a) {
  return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function shuffle(a, seed) {
  var R = rng(seed);
  for (var m = a.length - 1; m > 0; m--) { var q = Math.floor(R() * (m + 1)), t = a[m]; a[m] = a[q]; a[q] = t; }
  return a;
}

export function put(D, k, c, a) { var i = k * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = a; }

export function r(n) { return Math.round(n * 10) / 10; }

export function r3(n) { return Math.round(n * 1000) / 1000; }

/* the grid-fitting's own rounding (lettering/hint.js; a half goes down) */
export function hintRound(v) { return Math.max(1, Math.round(v - 1e-6)); }

/* the room the doors need between them: 12px from one block's grey line to the next block's word (gm), and how a
   shortage is taken. gs: the gaps (station to station) as wished; each step gives way in turn, down to its floor */
export function giveWay(gs, floors, over, idx) {
  while (over > .01) {
    var on = idx.filter(function (i) { return gs[i] > floors[i] + .01; });
    if (!on.length) break;
    var step = Math.min(over / on.length, Math.min.apply(null, on.map(function (i) { return gs[i] - floors[i]; })));
    on.forEach(function (i) { gs[i] -= step; });
    over -= step * on.length;
  }
  return Math.max(0, over);
}

/* a lettering's cell in device px: its cell on the plain page (c, the page's px) times the page's ratio (q), whole
   or not; never under one device pixel. fitted(s): s where a word at s is fitted (s not whole), else 0 */
export function letterCell(c, q) { return Math.max(1, c * q); }

export function fitted(s) { return s > 1 && Math.abs(s - Math.round(s)) > 1e-6 ? s : 0; }

export function edgesOf(a) { var o = [0]; a.forEach(function (v) { o.push(o[o.length - 1] + v); }); return o; }

/* the bead: a disc of m x m cells (m odd) round its middle cell. The red dot is one too, of 5; of 4 (the same disc
   round the middle of four cells: 4 x 4 less its corners) where the line's cells give no odd disc near its size */
export function beadOf(m) {
  var c = (m - 1) / 2, R2 = (c + .5) * (c + .5) - .01, cells = [];
  for (var j = 0; j < m; j++) for (var i = 0; i < m; i++) if ((i - c) * (i - c) + (j - c) * (j - c) <= R2) cells.push({ i: i, j: j });
  return { m: m, cells: cells };
}

/* sizes: the word's canvas in whole cells of DW device pixels (doorsPick); the bead's cells the line's width, m of
   them across (7 at 1x, 2x and 3x; more, of one device pixel, at 125% to 175%, so it stays ~7px); the red dot the
   same, 5 across (~5px). On a desktop's page: the odd number of the line's cells nearest 7 and 5 of the page's px at
   every scale (doorsSize) */
export function cellOf(t) { var lo = Math.max(1, Math.floor(t)), hi = Math.max(1, Math.ceil(t)); return hi / t < t / lo ? hi : lo; }

/* onto the device grid by their own place (left, top), not by a transform: the browser puts a box on whole pixels
   before it applies a transform, so a translate measured from the unsnapped box moves the cells off them again (half
   a pixel at 1x, a dropped or doubled row of cells at 125% and 150%). At 2x and 3x the place is a whole CSS pixel
   (a whole device pixel too), as a browser that rounds there in CSS pixels still lands it */
export function gridOf(dpr) { return Math.abs(dpr - Math.round(dpr)) < 1e-6 ? 1 : dpr; }

/* the line's x at height y, read off its samples (between lo and hi: the slant, not the runs above and below it) */
export function xAt(pts, y, lo, hi) {
  for (var i = 0; i + 1 < pts.length; i++) {
    var a = pts[i], b = pts[i + 1];
    if (a[1] <= lo || b[1] <= lo || a[1] >= hi || b[1] >= hi || a[1] === b[1]) continue;
    if ((a[1] - y) * (b[1] - y) <= 0) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
  }
  return NaN;
}

export function minX(pts, y0, y1, lo, hi) {
  var m = Infinity, v;
  for (var y = y0; y < y1; y += 1) { v = xAt(pts, y, lo, hi); if (!isNaN(v)) m = Math.min(m, v); }
  v = xAt(pts, y1, lo, hi); if (!isNaN(v)) m = Math.min(m, v);
  return m;
}

export function easeOut(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }

export function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

/* a fixed pseudo-random rank for each cell round his feet: the order one drawing gives way to the next */
export function hrank(X, Y) { var h = Math.imul((X + 64) * 73856093 ^ (Y + 64) * 19349663, 0x5bd1e995); h ^= h >>> 15; return ((h >>> 0) % 1000) / 1000; }
