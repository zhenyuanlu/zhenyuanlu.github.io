// Colour for the race engine's drawings: a stage's colours graded as v7b graded them (dusk warms, night cools), a
// drawing's colour on today's paper, and the small conversions. Ported from the draft (design/assets/v2ac/race.js).
// Pure: no DOM.
import { DUSKC, MOONC, NIGHT_INK, PAPER } from './consts.js';

/* ---------- colour ---------- */
export function rgb(s) {
  s = String(s || '').trim();
  if (s[0] === '#') {
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
  }
  var m = /rgba?\(([^)]*)\)/.exec(s);
  if (m) { var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0] || 0, p[1] || 0, p[2] || 0]; }
  return [128, 128, 128];
}

export function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }

export function over(a, b, t) { return [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t, b[2] + (a[2] - b[2]) * t]; }

export function luma(c) { return (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255; }

export function graded(c, sg) {
  var L = luma(c);
  if (sg === 'dusk') { if (L < 0.29) return c; var d = over(DUSKC, c, 0.22); return L > 0.86 ? over(PAPER.dusk, d, 0.5) : d; }
  if (sg === 'night') { if (L < 0.2) return over(NIGHT_INK, c, 0.55); var n = over(MOONC, c, 0.26); return L > 0.7 ? over(PAPER.night, n, 0.45) : n; }
  return c;
}

/* a drawing's colour on today's paper (between two stages the paper is in between, and so is the colour) */
export function tintC(hex, sg, paper) {
  var c = graded(rgb(hex), sg);
  if (sg !== 'night') { var ref = PAPER[sg] || PAPER.day; c = c.map(function (v, i) { return Math.min(v * Math.min(1, paper[i] / ref[i]), paper[i]); }); }
  return c;
}

export function tint(hex, sg, paper) { return css(tintC(hex, sg, paper)); }
