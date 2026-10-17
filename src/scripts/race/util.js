// Small pure helpers the race engine's modules share: boxes in cells (hit, pad, gapE, unite), lines of whole
// cells (bres, trace), a polygon test, a hash for the terrain's stipple, dates as day numbers, words (ord, low,
// cap, slug, esc). Ported from the draft (design/assets/v2ac/race.js and inner.js's esc). Pure: no DOM.
import { DAY, MED_RANK } from './consts.js';

export function byMedal(a, b) { return (MED_RANK[a] || 9) - (MED_RANK[b] || 9); }

/* ---------- whole cells: Bresenham, and a line with its L-corners taken out (one cell wide, 8-connected) ---------- */
export function bres(x0, y0, x1, y1, out) {
  var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (;;) {
    out.push([x0, y0]);
    if (x0 === x1 && y0 === y1) return;
    var e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function trace(pts) {
  var raw = [], res = [];
  if (pts.length === 1) raw.push(pts[0].slice());
  for (var i = 1; i < pts.length; i++) { var seg = []; bres(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], seg); if (raw.length) seg.shift(); raw = raw.concat(seg); }
  raw.forEach(function (c) {
    var n = res.length, b = res[n - 1];
    if (b && b[0] === c[0] && b[1] === c[1]) return;
    if (n >= 2) {
      var a = res[n - 2];
      if (Math.abs(a[0] - c[0]) === 1 && Math.abs(a[1] - c[1]) === 1 && (b[0] === a[0] || b[1] === a[1]) && (b[0] === c[0] || b[1] === c[1])) res.pop();
    }
    res.push(c);
  });
  return res;
}

export function inPoly(x, y, P) {
  var c = false;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
    if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c;
  }
  return c;
}

export function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

export function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function dayOfYear(d) { return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12) - new Date(d.getFullYear(), 0, 1, 12)) / DAY); }

export function daysIn(y) { return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365; }

export function polyLen(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }

export function hit(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }

export function pad(b, m) { return { x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m }; }

/* the gap between two boxes, in cells (0 when they touch or overlap) */
export function gapE(a, b) { var dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1); return Math.sqrt(dx * dx + dy * dy); }

export function unite(a, b) { return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }; }

/* text for HTML (the draft's V1K.esc) */
export { esc } from '../esc.js';   /* (the site's one, scripts/esc.js) */

export function low(s) { return String(s).toLowerCase(); }

export function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

/* the address names what is pinned: a race by its id (#/race/<id>); a venue of several sports by its name, one of
   its sports by the sport's after it (#/race/boston, #/race/boston/run; a season gone by first: #/race/2025/boston);
   with none, the season's (replaced, so Back is not cluttered) */
export function slug(s) { return low(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
