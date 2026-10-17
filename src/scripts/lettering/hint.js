// The grid-fitting of the pixel lettering (the draft's inner.js, between its "hint: begin" and "hint: end"
// marks, unchanged): a word drawn at s device px a cell, where s is not whole (125%, 150%, 175% ...), keeps its
// strokes T device px (T the whole number nearest two cells), its corners square and its bands on shared rows;
// the draft's comment over these functions says each rule. Pure: no DOM.
function hintRound(v) { return Math.max(1, Math.round(v - 1e-6)); }
function hintShare(total, n, edge) {
  var out = [], ord = [], base = Math.floor(total / n), extra = total - base * n, i;
  for (i = 0; i < n; i++) { out.push(base); ord.push(i); }
  ord.sort(function (p, q) { var dp = Math.abs(p - (n - 1) / 2), dq = Math.abs(q - (n - 1) / 2); return (edge ? dq - dp : dp - dq) || p - q; });
  for (i = 0; i < extra; i++) out[ord[i]]++;
  return out;
}
function hintMod(s, T) { return Math.min(Math.ceil(T / 2), Math.max(Math.floor(T / 2), hintRound(s))); }
function hintAir(tot, n, m, last) {
  if (n <= 0) return [];
  tot = Math.max(tot, n);
  if (n === 1) return [tot];
  var c = Math.max(1, Math.min(m, tot - (n - 1))), rest = hintShare(tot - c, n - 1);
  return last ? rest.concat([c]) : [c].concat(rest);
}
function hintRows(S, s, T) {
  var a = S.asc, x = S.x, d = S.desc, n1 = (x - 6) / 2, m = hintMod(s, T), H = hintRound((a + x + d) * s), hX = hintRound(x * s), rest = H - hX, hD = Math.floor(rest / 2), hA = rest - hD;
  var air = Math.max(2 * n1, hX - 3 * T), a1 = Math.floor(air / 2), a2 = air - a1;
  return [].concat(
    [m, T - m], hintAir(hA - T, a - 2, m, false),
    [m, T - m], hintAir(a1, n1, m, false),
    [Math.ceil(T / 2), Math.floor(T / 2)], hintAir(a2, n1, m, true), [T - m, m],
    hintAir(hD - T, d - 2, m, true), [T - m, m]);
}
function hintBand(S, r) { var a = S.asc, x = S.x; return r < 2 || (r >= a && r < a + 2) || (r >= a + x / 2 - 1 && r < a + x / 2 + 1) || (r >= a + x - 2 && r < a + x) || r >= a + x + S.desc - 2; }
function hintRuns(R) {
  var out = [];
  R.forEach(function (row, r) {
    for (var c = 0; c < row.length; c++) {
      if (row.charAt(c) !== '#') continue;
      var e = c;
      while (e + 1 < row.length && row.charAt(e + 1) === '#') e++;
      out.push([r, c, e - c + 1]); c = e;
    }
  });
  return out;
}
function hintStems(S, R, runs) {
  var w = R[0].length, votes = {}, kept = [];
  runs.forEach(function (q) {
    if (S.own ? S.own(R, q[0]) : hintBand(S, q[0])) return;
    var c = q[1], n = q[2], p = n === 2 ? c : n === 3 && c === 0 ? 0 : n === 3 && c + 2 === w - 1 ? w - 2 : -1;
    if (p >= 0) votes[p] = (votes[p] || 0) + 1;
  });
  Object.keys(votes).map(Number).filter(function (p) { return votes[p] >= 2; })
    .sort(function (p, q) { return votes[q] - votes[p] || p - q; })
    .forEach(function (p) { if (!kept.some(function (q) { return Math.abs(q - p) < 2; })) kept.push(p); });
  return kept.sort(function (p, q) { return p - q; });
}
function hintCols(S, R, s, T, more, flat) {
  var w = R[0].length, m = hintMod(s, T), W = hintRound(w * s) + (more || 0), runs = hintRuns(R), cw = [], pair = {}, soft = [], fixed = 0, nfree = 0, free, c, e, n, part;
  function set(p, right) { right = right && !flat; cw[p] = right ? T - m : m; cw[p + 1] = right ? m : T - m; pair[p] = true; }
  function count() { fixed = 0; nfree = 0; cw.forEach(function (v) { if (v >= 0) fixed += v; else nfree++; }); }
  for (c = 0; c < w; c++) cw.push(-1);
  hintStems(S, R, runs).forEach(function (p) { set(p, p === w - 2 && p !== 0); });
  runs.forEach(function (q) { var c0 = q[1]; if (q[2] === 2 && cw[c0] < 0 && cw[c0 + 1] < 0) set(c0, c0 + 1 === w - 1 && c0 !== 0); });
  runs.forEach(function (q) {
    var c0 = q[1];
    if (q[2] !== 2 || pair[c0]) return;
    if (cw[c0] >= 0 && cw[c0 + 1] < 0 && T - cw[c0] > 0) { cw[c0 + 1] = T - cw[c0]; soft.push(c0 + 1); }
    else if (cw[c0] < 0 && cw[c0 + 1] >= 0 && T - cw[c0 + 1] > 0) { cw[c0] = T - cw[c0 + 1]; soft.push(c0); }
  });
  runs.forEach(function (q) {
    var c0 = q[1];
    if (q[2] !== 3) return;
    if (pair[c0] && cw[c0 + 2] < 0) cw[c0 + 2] = m;
    else if (pair[c0 + 1] && cw[c0] < 0) cw[c0] = m;
  });
  if (S.own && !flat && pair[w - 2] && w > 2 && runs.some(function (q) { return q[2] === 2 && cw[q[1]] >= 0 && cw[q[1] + 1] >= 0 && cw[q[1]] + cw[q[1] + 1] !== T; })) return hintCols(S, R, s, T, more, true);
  count();
  if (!nfree && (W - fixed) * 5 >= W) { soft.forEach(function (i) { cw[i] = -1; }); count(); }
  free = Math.max(W, fixed + nfree) - fixed;
  for (c = 0; c < w; c++) {
    if (cw[c] >= 0) continue;
    e = c;
    while (e + 1 < w && cw[e + 1] < 0) e++;
    n = e - c + 1; part = Math.max(n, Math.round(free * n / nfree));
    hintShare(part, n).forEach(function (v, i) { cw[c + i] = v; });
    free -= part; nfree -= n; c = e;
  }
  return cw;
}
function hintTurn(R) {
  var out = [], c, r, t;
  for (c = 0; c < R[0].length; c++) { t = ''; for (r = 0; r < R.length; r++) t += R[r].charAt(c); out.push(t); }
  return out;
}
function hintSum(S, P, s, T, want, full) {
  function wid(cw) { var t = 0; cw.forEach(function (v) { t += v; }); return t; }
  var have = 0, by = {}, G = [], best = null, d, step, m, o;
  P.forEach(function (p) { p.w = wid(p.cw); p.g = null; have += p.gap + p.w; });
  d = want - have; step = d > 0 ? 1 : -1;
  if (!d) return;
  P.forEach(function (p, i) {
    var cw = hintCols(S, p.L.R, s, T, step), k = p.L.R.join(' ');
    if (wid(cw) !== p.w + step || Math.min.apply(null, cw) <= 0) return;
    if (!by[k]) G.push(by[k] = { off: (p.L.R[0].length * s - p.w) * step, w: p.w, i: i, it: [] });
    by[k].it.push({ p: p, cw: cw }); p.g = by[k];
  });
  G.sort(function (a, b) { return (Math.abs(b.off - a.off) > 1e-6 ? b.off - a.off : 0) || b.it.length - a.it.length || b.w - a.w || a.i - b.i; });
  G.forEach(function (g, j) { g.bit = j < 12 ? 1 << j : 0; g.worth = j < 12 ? 2048 >> j : 0; });
  function choice(m) {
    var c = { m: m, n: 0, apart: 0, away: 0, far: 0, ord: 0 }, lo = {}, hi = {};
    P.forEach(function (p) {
      var k = p.L.R[0].length, on = !!p.g && !!(m & p.g.bit), w = p.w + (on ? step : 0);
      if (on) { c.n++; if (p.g.off < 1e-6) c.away++; }
      lo[k] = k in lo ? Math.min(lo[k], w) : w; hi[k] = k in hi ? Math.max(hi[k], w) : w;
      c.far = Math.max(c.far, Math.abs(w - k * s));
    });
    Object.keys(lo).forEach(function (k) { c.apart += hi[k] - lo[k]; });
    G.forEach(function (g) { if (m & g.bit) c.ord += g.worth; });
    c.w = have + step * c.n; c.miss = Math.abs(c.w - full); c.in3 = c.miss <= 0.03 * full + 1e-9;
    return c;
  }
  function better(a, b) {
    if (a.in3 !== b.in3) return a.in3;
    if (a.in3 && a.apart !== b.apart) return a.apart < b.apart;
    if (a.in3 && a.away !== b.away) return a.away < b.away;
    if (Math.abs(a.miss - b.miss) > 1e-6) return a.miss < b.miss;
    if (a.apart !== b.apart) return a.apart < b.apart;
    if (a.away !== b.away) return a.away < b.away;
    if (Math.abs(a.far - b.far) > 1e-6) return a.far < b.far;
    return a.w !== b.w ? a.w < b.w : a.ord > b.ord;
  }
  for (m = 0; m < 1 << Math.min(G.length, 12); m++) { o = choice(m); if (!best || better(o, best)) best = o; }
  G.forEach(function (g) { if (best.m & g.bit) g.it.forEach(function (q) { q.p.cw = q.cw; }); });
}
export function hintWord(B, s, sum) {
  var S = B.S, T = hintRound(2 * s), rows = S.own ? null : hintRows(S, s, T), track = hintRound(S.track * s), x = 0, h = 0, rects = [], cols = [], prev = null;
  var P = B.list.map(function (L) {
    var n = prev ? L.x - prev.x - prev.R[0].length : 0, p = { L: L, n: n, gap: !prev ? 0 : n === S.track ? track : hintRound(n * s), cw: hintCols(S, L.R, s, T) };
    prev = L;
    return p;
  });
  if (sum) hintSum(S, P, s, T, hintRound(B.w * s), B.w * s);
  P.forEach(function (p) {
    var L = p.L, cw = p.cw, rh = rows || hintCols(S, hintTurn(L.R), s, T), X, Y = [0];
    if (p.n > 0) cols = cols.concat(hintShare(p.gap, p.n));
    X = [x += p.gap];
    cw.forEach(function (v) { X.push(X[X.length - 1] + v); });
    rh.forEach(function (v) { Y.push(Y[Y.length - 1] + v); });
    L.R.forEach(function (row, r) { for (var c = 0; c < row.length; c++) if (row.charAt(c) === '#' && cw[c] > 0 && rh[r] > 0) rects.push([X[c], Y[r], cw[c], rh[r]]); });
    cols = cols.concat(cw);
    x = X[X.length - 1]; h = Math.max(h, Y[Y.length - 1]);
  });
  return { w: Math.max(1, x), h: h, T: T, rects: rects, cols: cols, rows: rows };
}
/* hint: end */
