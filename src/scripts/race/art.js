// The pixel art's own geometry, for the map, the scenes and the placing alike: an act's mask (every cell he and his
// props take in any frame), the plan of a scene's sky (where each weather's glyphs lie clear of him) and the
// lowest sky every weather of a scene plays in, his face (the cells his eyes reach), a sport's picture, and the
// HD drawings of a big screen. Ported from the draft (design/assets/v2ac/race.js). Pure: no DOM; the caches are
// WeakMaps keyed by the drawings themselves.
import { G_CLOUD, G_LOW, G_MOON, G_OVER, G_PUFF, G_SUN, HD_MIN, SKY } from './consts.js';

export function hdOn(u) { return u >= HD_MIN; }

/* a 2x drawing that is exactly twice the 1x one, else none */
export function hdRows(R, w, h) { return Array.isArray(R) && R.length === 2 * h && R.every(function (r) { return typeof r === 'string' && r.length === 2 * w; }) ? R : null; }

/* fill HD cells (i, j) .. (i + w, j + h) of a drawing whose 1x origin is the device pixel (X, Y), at u device px a 1x cell */
export function half(c, X, Y, u, i, j, w, h) {
  var x0 = X + Math.floor(i * u / 2), y0 = Y + Math.floor(j * u / 2);
  c.fillRect(x0, y0, X + Math.floor((i + (w || 1)) * u / 2) - x0, Y + Math.floor((j + (h || 1)) * u / 2) - y0);
}

/* the weather keeps CLEAR cells of paper from him and his props in every frame of the act (2026-10-07: a sun on the
   runner's head read as a ball or a halo): each glyph goes where it lies whole that far from them, the sun along the
   sky's top from its right-hand corner, the clouds from their own; the rain stops that far over them and the wind
   passes them by. A scene's sky is as tall as that needs (SKY rows at least), its act at the middle of its venue's
   room, or at its left or right where that keeps the sky lower */
export var CLEAR = 3, SKY_MAX = 14, MASKS = new WeakMap(), PLANS = new WeakMap();

export function maskOf(A) {
  var M = MASKS.get(A);
  if (M) return M;
  var keys = Object.keys(A.frames), w = 0, h = 0, seen = {}, cells = [];
  keys.forEach(function (k) {
    var f = A.frames[k];
    h = Math.max(h, f.length); w = Math.max(w, f[0].length);
    f.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (r[i] !== '.' && !seen[j * 999 + i]) { seen[j * 999 + i] = 1; cells.push(i, j); } });
  });
  M = { w: w, h: h, cells: cells };
  MASKS.set(A, M);
  return M;
}

/* the glyphs of one weather, at one stage, in a scene's box (RW wide; the act at ox, its top S rows down), or null
   where one of them finds no place */
export function skyPlan(A, RW, ox, S, wx, st) {
  var M = maskOf(A), m0 = PLANS.get(A), key = [RW, ox, S, wx, st].join(':');
  if (!m0) { m0 = {}; PLANS.set(A, m0); }
  if (key in m0) return m0[key];
  var H = S + M.h, bad = new Uint8Array(RW * H), taken = new Uint8Array(RW * H), out = [], i, x, y;
  for (i = 0; i < M.cells.length; i += 2) {
    var cx = ox + M.cells[i], cy = S + M.cells[i + 1];
    for (y = Math.max(0, cy - CLEAR); y <= Math.min(H - 1, cy + CLEAR); y++) for (x = Math.max(0, cx - CLEAR); x <= Math.min(RW - 1, cx + CLEAR); x++) bad[y * RW + x] = 1;
  }
  function fits(G, gx, gy) {
    for (var j = 0; j < G.length; j++) for (var k = 0; k < G[j].length; k++) {
      var ch = G[j][k], X = gx + k, Y = gy + j;
      if (ch !== '#' && ch !== 'u') continue;
      if (X < 0 || Y < 0 || X >= RW || Y >= H || bad[Y * RW + X] || taken[Y * RW + X]) return false;
    }
    return true;
  }
  function put(G, gx, gy, col) {
    out.push({ G: G, x: gx, y: gy, col: col });
    for (var j = 0; j < G.length; j++) for (var k = 0; k < G[j].length; k++) if (G[j][k] === '#' || G[j][k] === 'u') taken[(gy + j) * RW + gx + k] = 1;
  }
  function find(G, xs, gy, col) { for (var n = 0; n < xs.length; n++) if (fits(G, xs[n], gy)) { put(G, xs[n], gy, col); return xs[n]; } return null; }
  function span(a, b) { var r = [], v; if (a <= b) for (v = a; v <= b; v++) r.push(v); else for (v = a; v >= b; v--) r.push(v); return r; }
  var sunG = st === 'night' ? G_MOON : st === 'dusk' ? G_LOW : G_SUN, sy = st === 'dusk' ? 2 : 0, gw = sunG[0].length, ok = true, sx;
  if (wx === 'sun' || wx === 'sun-cloud') {
    sx = find(sunG, span(RW - gw - 1, 0).concat([RW - gw]), sy, 'sun');
    ok = sx != null;
    if (ok && wx === 'sun-cloud') ok = find(G_PUFF, span(sx - 4, 0).concat(span(sx + gw + 1, RW - 4)), 2, 'cloud') != null;
  }
  if (wx === 'cloud') ok = find(G_CLOUD, span(1, RW - 7), 1, 'cloud') != null && find(G_PUFF, span(RW - 6, 0), 0, 'cloud') != null;
  if (wx === 'rain') {
    var cl = find(G_CLOUD, span(2, RW - 7), 0, 'cloud');
    ok = cl != null && find(G_PUFF, span(RW - 7, 0), 1, 'cloud') != null;
    /* (and room for the rain to be seen: three of its columns falling five cells at least before their clearance) */
    if (ok) ok = [cl + 1, cl + 3, cl + 5, RW - 6, RW - 4].filter(function (dx) {
      if (dx < 1 || dx > RW - 2) return false;
      for (var yy = 4; yy < H; yy++) if (bad[yy * RW + dx]) return yy - 4 >= 5;
      return true;
    }).length >= 3;
  }
  if (wx === 'overcast-wind') {
    var bar = G_OVER.map(function (r) { return r.slice(0, RW); }), row = new Array(RW + 1).join('#'), wind = [row, row];
    ok = fits(bar, 0, 0) && fits(wind, 0, 3);
    if (ok) put(bar, 0, 0, 'cloud');
  }
  var res = ok ? { glyphs: out, bad: bad, RW: RW, H: H } : null;
  m0[key] = res;
  return res;
}

/* a scene's sky in its venue's room (RW wide): the lowest that every weather of its races plays in, at every stage,
   the act at the room's middle or else at a side; { S, ox } */
export function skyFit(A, RW, wxs) {
  var M = maskOf(A), mid = Math.floor((RW - M.w) / 2), oxs = [mid].concat([0, RW - M.w].filter(function (v) { return v !== mid && v >= 0; }));
  for (var S = SKY; S <= SKY_MAX; S++) {
    for (var k = 0; k < oxs.length; k++) {
      var ok = wxs.every(function (wx) { return ['day', 'dusk', 'night'].every(function (st) { return !!skyPlan(A, RW, oxs[k], S, wx, st); }); });
      if (ok) return { S: S, ox: oxs[k] };
    }
  }
  return { S: SKY_MAX, ox: mid };
}

/* his face: the empty cells his eyes reach without leaving the drawing (none if they reach its edge) */
export var FACES = new WeakMap();

export function faceOf(rows) {
  var F = FACES.get(rows);
  if (F) return F;
  var h = rows.length, w = rows[0].length, todo = [], seen = {}, leak = false;
  F = {};
  for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (rows[j][i] === 'e') todo.push(j * w + i);
  while (todo.length) {
    var k = todo.pop(), x = k % w, y = (k - x) / w;
    if (seen[k]) continue;
    seen[k] = 1;
    if (rows[y][x] === '.') F[k] = 1;
    for (var d = 0; d < 4; d++) {
      var X = x + [1, -1, 0, 0][d], Y = y + [0, 0, 1, -1][d];
      if (X < 0 || Y < 0 || X >= w || Y >= h) { leak = true; continue; }
      if (rows[Y][X] === '.' && !seen[Y * w + X]) todo.push(Y * w + X);
    }
  }
  if (leak) F = {};
  FACES.set(rows, F);
  return F;
}

/* (a picture's letters: k in the picture's grey or ink; its accent letter in its colour while in hand; a letter of
   iconRest a lighter grey at rest (that mix of the ink: the run's tape), the pictures' grey while inked) */
export function picOf(A) {
  var rows = A.icon && A.icon.length ? A.icon : null, w;
  if (rows) { w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0); return { rows: rows, w: w, h: rows.length, pal: A.iconPalette || {}, rest: A.iconRest || {}, hd: hdRows(A.iconHD, w, rows.length) }; }
  var f = A.frames[A.still] || A.frames[Object.keys(A.frames)[0]];
  return { rows: f, w: f[0].length, h: f.length, pal: {}, rest: {} };
}
