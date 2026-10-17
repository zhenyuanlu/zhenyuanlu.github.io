// The race map's placing, pure (no DOM): the grid a window gets (pickGrid), the season's map in cells (its raster,
// its highways two cells across, its stops and their flags' places: buildSteps), each venue's row and its scene's
// room (solve: the forms, the tries and the repairs), the rows' leaders (apply), where a card may lie and its leader
// (cardGridSteps, cardPlaceSteps), a room moved for its cards (roomRepairSteps), the terrain's whisper (terrainSteps)
// and the audit of what is left. It reads the season's page (pg: S, L and the model) and the sizes the DOM side
// measured for it (a name's P.lw and P.lh, a card's sizes, the column's words, the key's box), and writes its answers
// there; the DOM side puts them on the page (cards.js applyRows). Ported from the draft (design/assets/v2ac/race.js):
// the same work in the same order; each comment is the draft's own.
import { maskOf, picOf } from './art.js';
import { APART, AVOID, BIG, BORDER, BOX, BRUSH, CARDC, CARDC_ROW, COARSER, COAST, COASTC, FLAG, FLAG_H, LAB, MAN, NEAR, PENNANT, REACH, REPAIR, ROAD, ROWGAP, ROWGAP2, SKY, STOP, TERR, T_GLYPH } from './consts.js';
import { bres, clamp, gapE, hash, hit, inPoly, pad, trace, unite } from './util.js';
import { choiceGet, choiceSet } from './kept.js';

export function installLayout(pg) {
  var EDGES = pg.EDGES, G = pg.G, GH = pg.GH, GW = pg.GW, HOMEN = pg.HOMEN, LAND7 = pg.LAND7, NODES = pg.NODES, S = pg.S, TERRAIN = pg.TERRAIN, proj = pg.proj;
  /* ---------- the grid: whole device pixels, never finer than the map's own raster ---------- */
  /* (env, from fit.js env(): dpr, the page's pixel ratio; rd, the screen's own (zoomed, as the draft's realDPR); ww, the
     window's width) */
  function pickGrid(Wa, Ha, phone, env) {
    /* (a large screen, BIG css px wide or more: cells up to 3 css px, so the map fills the page's column where at
       2 it would not (a 1440p screen at 100% or a 4K one at 150%: round 5, "不同monitor的adaptive"); a coarser grid
       taken only where its map is COARSER wider, so the owner's 4K screen at 175% keeps its finer one) */
    var dpr = env.dpr, rd = env.rd, lo = phone ? 0.74 : 1.5, hi = phone ? 1.4 : env.ww >= BIG ? 3.0 : 2.6, best = null;
    /* at a fractional pixel ratio (1.75, 2.625, 1.25) the browser lays a box out in 64ths of a CSS px: the map's
       width and height must land on those exactly, or the canvas is resampled and its cells blur. So each cell size
       is judged by the widest map it can draw exactly (a few columns fewer, and its rows the nearest that land); then
       the widest map wins (widths within a cell count as equal, and then the finer grid). (Zoomed, the 64ths are of the
       window's px: n cells of u device px are n u / rd of them, rd the screen's own ratio) */
    function exact(n, u) { var v = n * u * 64 / rd; return Math.abs(v - Math.round(v)) < 1e-6; }
    function land(c0, u, cs) {
      for (var c = c0, k = 0; k < 64 && c >= 120; k++, c--) {
        if (!exact(c, u)) continue;
        var r0 = Math.round(c * GH / GW), Dl = [0, 1, -1, 2, 3];
        for (var j = 0; j < Dl.length; j++) { var r = r0 + Dl[j]; if (exact(r, u) && r * cs <= Ha + 1e-6) return { cols: c, rows: r }; }
      }
      return null;
    }
    for (var u = 1; u <= 24; u++) {
      var cs = u / dpr;
      if (cs < lo - 1e-6 || cs > hi + 1e-6) continue;
      var cols = Math.min(GW, Math.floor(Wa / cs + 1e-6), Math.floor(Math.floor(Ha / cs + 1e-6) * GW / GH));
      if (cols < 120) continue;
      var e = land(cols, u, cs);
      if (!e) continue;
      var w = e.cols * cs, tie = best && Math.max(cs, best.cs), more = best && cs > best.cs + 1e-6 ? best.w * COARSER : 0;
      if (!best || w > Math.max(best.w + tie, more) || (Math.abs(w - best.w) <= tie && e.cols > best.cols)) best = { u: u, cs: cs, cols: e.cols, rows: e.rows, w: w };
    }
    if (!best) {
      var u0 = Math.max(1, Math.round((phone ? 1 : 2) * dpr)), c0 = u0 / dpr;
      best = { u: u0, cs: c0, cols: clamp(Math.min(Math.floor(Wa / c0), Math.floor(Math.floor(Ha / c0) * GW / GH)), 120, GW) };
      best.rows = Math.round(best.cols * GH / GW);
    }
    best.dpr = dpr;
    return best;
  }
  /* every layer in cells: the raster resampled (cell x of map7 lands on floor((x + .5) k)), the season's highways
     two cells across, the stops and their flags' places; then the names, pictures and rooms; then the terrain */
  function gx(v) { return Math.floor((v + 0.5) * pg.L.k); }
  function gpt(p) { return [(p[0] + 0.5) * pg.L.k - 0.5, (p[1] + 0.5) * pg.L.k - 0.5]; }
  /* (in steps too: the raster, the roads, then each stop's flag; it was one step of 13ms. build runs them in one go) */
  function build() { var g = buildSteps(); while (!g.next().done); }
  function* buildSteps() {
    yield 3;   /* (the raster and the land, cell by cell: 2 to 3ms) */
    var C = pg.L.cols, R = pg.L.rows, occ = pg.L.occ = new Uint16Array(C * R);
    function mark(list, x, y, bit) { if (x < 0 || y < 0 || x >= C || y >= R) return; var i = y * C + x; if (occ[i] & bit) return; occ[i] |= bit; if (list) list.push(x, y); }
    pg.L.coast = []; pg.L.border = []; pg.L.road = [];
    var cs = G.coast || [], bs = G.border || [], i;
    for (i = 0; i + 1 < cs.length; i += 2) mark(pg.L.coast, gx(cs[i]), gx(cs[i + 1]), COAST);
    for (i = 0; i + 1 < bs.length; i += 2) mark(pg.L.border, gx(bs[i]), gx(bs[i + 1]), BORDER);
    var land = pg.L.land = new Uint8Array(C * R);
    for (var y = 0; y < R; y++) {
      var y7 = Math.min(GH - 1, Math.floor((y + 0.5) / pg.L.k));
      for (var x = 0; x < C; x++) { var x7 = Math.min(GW - 1, Math.floor((x + 0.5) / pg.L.k)); land[y * C + x] = LAND7 ? LAND7[y7 * GW + x7] : 1; }
    }
    yield;
    pg.L.adj = {};
    EDGES.forEach(function (e, j) {
      if (!S.roads[j]) return;
      (pg.L.adj[e.a] = pg.L.adj[e.a] || []).push({ to: e.b, e: e, rev: false });
      (pg.L.adj[e.b] = pg.L.adj[e.b] || []).push({ to: e.a, e: e, rev: true });
      trace(e.pts.map(function (p) { return [gx(p[0]), gx(p[1])]; })).forEach(function (q) { BRUSH.forEach(function (d) { mark(pg.L.road, q[0] + d[0], q[1] + d[1], ROAD); }); });
    });
    /* a stop is 5 x 5 cells with a cell of paper round it (3 x 3 where the map is drawn small, so New York and
       Flushing keep apart); the cell of paper is the stop's too */
    var h = pg.L.half = pg.L.k >= (pg.L.phone ? 0.8 : 0.7) ? 2 : 1;
    function stop(P) {
      var n = NODES[P.node];
      P.cx = gx(n[0]); P.cy = gx(n[1]);
      P.sq ={ x0: P.cx - h, y0: P.cy - h, x1: P.cx + h, y1: P.cy + h };
    }
    S.PL.forEach(function (P) {
      stop(P);
      for (var yy = P.sq.y0 - 1; yy <= P.sq.y1 + 1; yy++) for (var xx = P.sq.x0 - 1; xx <= P.sq.x1 + 1; xx++) if (xx >= 0 && yy >= 0 && xx < C && yy < R) occ[yy * C + xx] |= STOP;
    });
    yield;
    /* each stop's flag (any of them may be pinned): a pole over its right-hand corner, the pennant flying right;
       else over its left, flying left; else flying the other way, on a shorter or taller pole, or out from the
       corner (by up to three cells, beside a road that leaves the stop there): the first whose pole, pennant and
       cell of paper round them keep clear of the roads (of the coast a little less) */
    /* (round 11, 2026-10-13: a stop's flag's place is the same on the same grid, and a laying out builds the same
       grid up to four times (a card's retry, the cards' last look): the places found once are kept with the
       season (S.flagK: by the grid, whose roads, coast and stops are all a place is chosen by), and put back) */
    var fkey = C + 'x' + R + ':' + pg.L.k + ':' + h, FK = S.flagK && S.flagK.PL === S.PL && S.flagK.key === fkey ? S.flagK : (S.flagK = { PL: S.PL, key: fkey, got: [] });
    var flagOf = function (P, fi) {
      var best = FK.got[fi] || null, q = P.sq;
      if (!best) [0, 1, 2, 3].forEach(function (off) { [1, -1].forEach(function (side) {
        [side, -side].forEach(function (dir) {
          [FLAG_H, FLAG_H - 1, FLAG_H + 1, FLAG_H - 2, FLAG_H + 2, FLAG_H - 3].forEach(function (fh, hi) {
            var n = hi * 2 + (dir !== side ? 3 : 0) + (side < 0 ? 1 : 0) + off * 12;
            if (best && n >= best.n) return;   /* (round 11: what it starts at is not under the best: it is only added to) */
            var f = { side: side, dir: dir, h: fh, off: off }, cells = flagCells(P, f), set = {};
            /* (round 11: the cells' set by a number each, not a string made for every cell asked: 8ms of every
               first laying out) */
            cells.forEach(function (c) { set[(c[1] + 64) * 8192 + c[0] + 64] = 1; });
            cells.forEach(function (c) {
              for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
                var X = c[0] + dx, Y = c[1] + dy, own = !dx && !dy;
                if (!own && (set[(Y + 64) * 8192 + X + 64] || (Y >= q.y0 - 1 && X >= q.x0 - 1 && X <= q.x1 + 1))) continue;
                if (X < 0 || Y < 0 || X >= C || Y >= R) { n += own ? 999 : 0; continue; }
                var o = occ[Y * C + X];
                if (o & ROAD) n += 100;
                else if (o & COAST) n += own ? 4 : 1;
              }
            });
            if (!best || n < best.n) best = { f: f, n: n, cells: cells };
          });
        });
      }); });
      FK.got[fi] = best;
      P.flag = best.f; P.fdir = best.f.dir; P.fcells = best.cells;
      P.fbox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
      best.cells.forEach(function (c) {
        P.fbox = { x0: Math.min(P.fbox.x0, c[0]), y0: Math.min(P.fbox.y0, c[1]), x1: Math.max(P.fbox.x1, c[0] + 1), y1: Math.max(P.fbox.y1, c[1] + 1) };
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) mark(null, c[0] + dx, c[1] + dy, FLAG);
      });
    };
    for (var fi = 0; fi < S.PL.length; fi++) { flagOf(S.PL[fi], fi); yield; }
    /* home: Boston's stop, or (a season without a race there) the place it would be */
    pg.L.homeP = S.PL.filter(function (P) { return P.node === HOMEN; })[0] || null;
    if (!pg.L.homeP && HOMEN) { pg.L.homeP = S.ghost || (S.ghost = { node: HOMEN, races: [], slots: [], name: '', ghost: true, md: [] }); stop(pg.L.homeP); }
  }
  function flagCells(P, f) {
    var q = P.sq, x = f.side > 0 ? q.x1 + (f.off || 0) : q.x0 - (f.off || 0), out = [], j, i;
    for (j = 1; j <= f.h; j++) out.push([x, q.y0 - j]);
    PENNANT.forEach(function (n, r) { for (i = 1; i <= n; i++) out.push([x + f.dir * i, q.y0 - f.h + r]); });
    return out;
  }
  /* ---------- placing: his spot at home first; then each venue's row (its name, right after it its pictures, then
     its medals, on the name's middle line and its strip of paper) beside its stop: level with it, a little higher
     or lower, above or below it, or at a corner of it, a little further out when the coast or a road is in the
     way, never nearer another venue's stop than its own, never over a stop's flag; the row's words and pictures
     stay within the map (on a desktop a name may reach left over the column's blank paper; on a phone into the
     page's side margin, softly), and its pictures and medals keep a cell from the roads and three from the stops.
     Then, beside the row or the stop, the venue's room: a box of blank paper as large as its largest scene with its
     sky, a cell inside the map, clear of every road, coast line, stop, flag, row and the key, of every other venue's
     room (a cell of paper between), and clearly nearer its own venue than any other (every other venue's stop and
     row at least two cells further than its own); the nearer the better, below the row first, and where the
     venue's card can sit beside it. The venues choose in turn, in several orders, and the order that leaves the
     fewest collisions and stays closest wins; then each room moves as near its stop, name and pictures as a free
     place is that keeps its card a place (nearer, round 5); a row that stands off gets a dotted leader to its stop; when
     collisions are left or a row stands far off, the names try a size smaller on a short screen, and the better of
     the two is kept (place: the forms it tries). A phone's small map: its names and pictures inside the page's
     margins; should one line each not lie clear, every row takes its pictures and medals onto a line of their own
     under its name; should rows and rooms together still collide, the rows are placed first and the rooms after them
     (a venue left without one plays no scene); and the map grows a little (see full) ---------- */
  function sqBox(P) { return { x0: P.sq.x0, y0: P.sq.y0, x1: P.sq.x1 + 1, y1: P.sq.y1 + 1 }; }
  /* a leader's cells: from a stop (q) straight to the nearest point of its row (B) where the row stands off from
     it, six cells or more: clear of the stop's own cell of paper, a cell short of the row. null where the row
     stands by its stop. The placing weighs them (solve: cand) and the map draws them (apply) */
  function leadPath(q, B, to) {
    if (Math.max(B.x0 - q.x1 - 1, q.x0 - B.x1, B.y0 - q.y1 - 1, q.y0 - B.y1) < 6) return null;
    var sx = (q.x0 + q.x1 + 1) / 2, sy = (q.y0 + q.y1 + 1) / 2, mh = (B.y1 - B.y0) * 0.3;
    var nx = to ? to[0] : clamp(sx, B.x0 + 1.5, B.x1 - 1.5), ny = to ? to[1] : clamp(sy, B.y0 + mh, B.y1 - mh), line = [], path = [];
    bres(Math.floor(sx), Math.floor(sy), Math.floor(nx), Math.floor(ny), line);
    for (var j = 0; j < line.length; j++) {
      var c = line[j];
      if (Math.max(B.x0 - c[0] - 1, c[0] - B.x1, B.y0 - c[1] - 1, c[1] - B.y1) < 0.5) break;
      if (c[0] >= q.x0 - 2 && c[0] <= q.x1 + 2 && c[1] >= q.y0 - 2 && c[1] <= q.y1 + 2) continue;
      path.push(c);
    }
    return path;
  }
  /* (the fourth round, 2026-10-13: where that way is not clear, a flag's place, a road, a scene or him standing on
     it, the leader may go straight to another point of the row instead: the points along the row's sides, as far in
     from its ends as the nearest is, the nearest to the stop first, none more than LEAD_FAR times as far as the
     nearest nor LEAD_MORE cells further where that is more. A row was left cut off for one cell of a flag's place
     under the one line it was allowed (the third review: springfield's and flushing's rows, and the rows moved
     away from their cards to mend it). leadFor: the way to draw, the nearest first, by the caller's own test of
     a way (ok); null where the row stands by its stop, false where no way is clear and the row is cut off. Only a
     row whose nearest way is not clear ever asks for another: where every row's is, nothing is done differently) */
  var LEAD_FAR = 1.5, LEAD_MORE = 4, LEAD_ENDS = 48, LEAD_GAP = 2, LEAD_HOLE = 4;
  function leadEnds(q, B) {
    var sx = (q.x0 + q.x1 + 1) / 2, sy = (q.y0 + q.y1 + 1) / 2, mh = (B.y1 - B.y0) * 0.3, x0 = B.x0 + 1.5, x1 = B.x1 - 1.5, y0 = B.y0 + mh, y1 = B.y1 - mh;
    var nx = clamp(sx, x0, x1), ny = clamp(sy, y0, y1), d0 = Math.hypot(nx - sx, ny - sy), far = Math.max(d0 * LEAD_FAR, d0 + LEAD_MORE), out = [], x, y;
    function add(ex, ey) { var d = Math.hypot(ex - sx, ey - sy); if (d <= far && (Math.floor(ex) !== Math.floor(nx) || Math.floor(ey) !== Math.floor(ny))) out.push([ex, ey, d]); }
    for (x = x0; x <= x1 + 1e-9; x++) { add(x, y0); add(x, y1); }
    for (y = Math.floor(y0) + 1; y < y1; y++) { add(x0, y); add(x1, y); }
    out.sort(function (a, b) { return a[2] - b[2]; });
    return out.slice(0, LEAD_ENDS);
  }
  function leadFor(q, B, ok) {
    var p = leadPath(q, B);
    if (!p) return null;
    if (ok(p)) return p;
    for (var E = leadEnds(q, B), i = 0; i < E.length; i++) { p = leadPath(q, B, E[i]); if (p && ok(p)) return p; }
    return false;
  }
  /* a venue's anchor, what a scene keeps near (round 5): its stop, its name and its pictures (its medals left out:
     a long row of them would carry a scene away from the city) */
  function anchorOf(sq, nb, pics) { var A = nb ? unite(sq, nb) : sq; (pics || []).forEach(function (b) { A = unite(A, b); }); return A; }
  /* where he plays in a venue's room: each of its scenes' acts, at the room's foot and the place its sky was fitted
     to (cells from the room's top left) */
  function figsOf(P) {
    return P.slots.filter(function (sl) { return sl.A && sl.sky; }).map(function (sl) {
      var M = maskOf(sl.A);
      return { x0: sl.sky.ox, y0: P.rh - M.h, x1: sl.sky.ox + M.w, y1: P.rh };
    });
  }
  /* a room's nearness, a hard rule (round 5's second look, both checks: "像素动画靠近一点城市", and Flushing's scene
     still the farthest): a room lies within ROOM_CAP cells of its venue's anchor (its stop, its name and its
     pictures), and every other venue (its row, its stop, and on a phone its pictures' finger-sized buttons) lies
     clearly further from it than its own row or stop does: twice as far, NEAR cells further at least, and never
     within OTHER_PX (round 5: on a phone and on a short screen scenes lay 4 to 6px from the next venue's row); on a
     phone OTHER_PX_PHONE (round 5's third look: its scenes 8 to 15px from the next venue's name, pictures, medals or
     stop, 16px at least now; where no place within ROOM_CAP is that clear, the rooms of SKY rows of sky, else no
     scene for that venue on that screen: place). A room that finds no such place has none (its venue plays no scene;
     on a desktop a collision, so the placing looks on).
     Within that, the cheapest place: ROOM_F a cell between his act (the farthest of the venue's) and the stop, where
     he walks to and fades out as the scene fades in; ROOM_SIDE beside the row or under it before over it; and
     ROOM_COASTC a cell of coastline under it: a scene may lie on paper over a coastline where that keeps it near, as
     a card may (it covers the line with paper while it plays: drawScenes). Its anchor's parts, each apart (a room
     between a stop and a row that stands off from it is near neither) */
  function ancGap(r, parts) { var d = Infinity; for (var i = 0; i < parts.length; i++) d = Math.min(d, gapE(r, parts[i])); return d; }
  function ancParts(P, nb, pics) { return [sqBox(P)].concat(nb ? [nb] : []).concat((pics || []).map(function (b) { return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }; })); }
  var ROOM_F = 12, ROOM_CAP = 5, ROOM_CAP_PX = 10, ROOM_SIDE = [0, 8, 20], ROOM_COASTC = 20, OTHER_PX = 8, OTHER_PX_PHONE = 16, NEARER_TRIES = 10, ROOM_CARDS = 40;
  /* (ROOM_CAP cells, and on a phone's fine grid ROOM_CAP_PX: five cells of 1px would leave a small phone's crowded
     map no room for three of its scenes) */
  function roomCap() { return Math.max(ROOM_CAP, Math.ceil(ROOM_CAP_PX / pg.L.cs - 1e-6)); }
  function roomNeed(dOwn) { return Math.max(dOwn + NEAR, 2 * dOwn, Math.ceil((pg.L.phone ? OTHER_PX_PHONE : OTHER_PX) / pg.L.cs - 1e-6)); }
  /* (a phone's venue of several sports: its pictures' buttons, a finger square on each as icons() makes them, in cells) */
  function tapsOf(P, pics) {
    if (!pg.L.phone || !P.multi || !pics || !pics.length) return null;
    var hf = 11.5 / pg.L.cs;
    return pics.map(function (b) { var mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2; return { x0: Math.min(b.x0, mx - hf), y0: Math.min(b.y0, my - hf), x1: Math.max(b.x1, mx + hf), y1: Math.max(b.y1, my + hf) }; });
  }
  function roomCost(r, A, figs, sq, row) {
    var dF = 0;
    for (var i = 0; i < figs.length; i++) { var f = figs[i]; dF = Math.max(dF, gapE({ x0: r.x0 + f.x0, y0: r.y0 + f.y0, x1: r.x0 + f.x1, y1: r.y0 + f.y1 }, sq)); }
    return ROOM_F * dF + ROOM_SIDE[!row || r.y0 >= row.y1 ? 0 : r.y1 <= row.y0 ? 2 : 1];
  }
  /* (the fix round: solve, place, layout, cardsPlaced, retry and the laying out itself (fullSteps) are generators, the
     same work in the same order with a yield between its parts (a venue's places, a try of the venues' order, a
     venue mended, a venue's cards), so the page can be made ready a few ms at a time; run in one go (full) they do
     what they did) */
  /* (the third round, 2026-10-12: a making that lays the map out again, a card having found no place (retry, the
     other forms), solved the same map from nothing each time: three solves of 0.25s at 1536 x 960 and 125% and at
     1366 x 657, where the other sizes take one of 0.12s. What a solve works out of the map alone is now kept for
     the next solve of the same map (SOLVED, by solveKey: everything those parts read): its integral images, his
     spots at home, the free maps, each venue's row's places and, as they are asked for, their rooms' places and the
     boxes beside them; and a venue's choice among the others as they stand, which the tries ask for again and again
     (bestForSteps: memo), is remembered with them. Nothing is chosen differently: the same answers, not worked out
     twice. Let go of when the laying out ends (fullSteps); three maps at most) */
  var SOLVED = new Map();
  function solveKey(roomsAfter, wrap) {
    var a = 0, b = 0, i, occ = pg.L.occ, land = pg.L.land, hp = pg.L.homeP;
    function bx(q) { return q ? q.x0 + ' ' + q.y0 + ' ' + q.x1 + ' ' + q.y1 : '-'; }
    for (i = 0; i < occ.length; i++) a = (Math.imul(a, 31) + occ[i]) | 0;
    for (i = 0; i < land.length; i++) b = (Math.imul(b, 31) + land[i]) | 0;
    var k = [roomsAfter ? 1 : 0, wrap ? 1 : 0, pg.L.cols, pg.L.rows, pg.L.cs, pg.L.phone ? 1 : 0, pg.L.lowSky ? 1 : 0, pg.L.gl, pg.L.gr, pg.L.nl, pg.L.nr, pg.L.xl || 0, a, b, bx(pg.L.keyB), (pg.L.txtB || []).map(bx).join('/'), (pg.L.guard || []).map(bx).join('/'), hp ? S.PL.indexOf(hp) + ' ' + bx(hp.sq) + ' ' + hp.cx : '-'];
    S.PL.forEach(function (P) {
      k.push(bx(P.sq), P.lw, P.lh, P.rw, P.rh, P.cw || 0, P.ch || 0, P.cw2 || 0, P.ch2 || 0, P.cw0 || 0, P.ch0 || 0, P.cwf || 0, P.chf || 0);
      P.slots.forEach(function (sl) { k.push(sl.A && sl.sky ? sl.sky.S + ' ' + sl.sky.ox : '-'); });
    });
    return k.join(',');
  }
  function* solve(roomsAfter, wrap) {
    var C = pg.L.cols, Rw = pg.L.rows, cs = pg.L.cs, occ = pg.L.occ, W1 = C + 1, x, y, i;
    var KEY = solveKey(roomsAfter, wrap), K = SOLVED.get(KEY) || null;
    if (K && K.PL !== S.PL) K = null;
    yield K ? 0 : 4;   /* (a map not solved before: what is near a road or a stop, and the sums' first band) */
    var near = K ? null : new Uint8Array(C * Rw);
    if (!K) S.PL.concat(pg.L.homeP && pg.L.homeP.ghost ? [pg.L.homeP] : []).forEach(function (P) {
      for (var yy = P.sq.y0 - 3; yy <= P.sq.y1 + 3; yy++) for (var xx = P.sq.x0 - 3; xx <= P.sq.x1 + 3; xx++) if (xx >= 0 && yy >= 0 && xx < C && yy < Rw) near[yy * C + xx] = 1;
    });
    for (i = 0; !K && i < pg.L.road.length; i += 2) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var rx = pg.L.road[i] + dx, ry = pg.L.road[i + 1] + dy;
      if (rx >= 0 && ry >= 0 && rx < C && ry < Rw) near[ry * C + rx] = 1;
    }
    /* integral images (a box costs one lookup): where a picture, a medal or a room may not go (IH), where a name
       may not go (IN), soft costs (IS: the coast under a name, the faint state lines), the map's lines (IC), the
       flags (IF), where a phone's picture or a room may not go (IP: a road, a stop, a flag and the cells round them;
       a room may lie over the coast), the coast's cells (ICO), and where a card may not go (IK: a road, a stop, a
       flag) */
    var II = K ? K.II : [0, 1, 2, 3, 4, 5, 6].map(function () { return new Float64Array(W1 * (Rw + 1)); }), IH = II[0], IN = II[1], IS = II[2], IC = II[3], IF = II[4], IP = II[5], ICO = II[6];
    for (y = 0; !K && y < Rw; y++) {
      var rh = 0, rn = 0, rs = 0, rc = 0, rf = 0, rp = 0, ro = 0;
      for (x = 0; x < C; x++) {
        i = y * C + x;
        var o = occ[i];
        rh += (o & (ROAD | COAST | STOP | FLAG)) || near[i] ? 1 : 0;
        rp += (o & (ROAD | STOP | FLAG)) || near[i] ? 1 : 0;
        rn += o & (ROAD | STOP | FLAG) ? 1 : 0;
        rs += (o & COAST ? 60 : 0) + (o & BORDER ? 0.4 : 0);
        rc += o & (ROAD | COAST | STOP) ? 1 : 0;
        rf += o & (ROAD | STOP | FLAG) ? 1 : 0;
        ro += o & COAST ? 1 : 0;
        var j1 = (y + 1) * W1 + x + 1, j0 = y * W1 + x + 1;
        IH[j1] = IH[j0] + rh; IN[j1] = IN[j0] + rn; IS[j1] = IS[j0] + rs; IC[j1] = IC[j0] + rc; IF[j1] = IF[j0] + rf; IP[j1] = IP[j0] + rp; ICO[j1] = ICO[j0] + ro;
      }
      if (y % 8 === 7) yield;   /* (a band of rows a step: it was one of 4 to 7ms; 8 rows, not 32, since the fourth round: 16ms on a machine four times slower) */
    }
    yield;
    function sum(I, b) {
      var x0 = clamp(b.x0, 0, C), x1 = clamp(b.x1, 0, C), y0 = clamp(b.y0, 0, Rw), y1 = clamp(b.y1, 0, Rw);
      if (x1 <= x0 || y1 <= y0) return 0;
      return I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
    }
    function outside(b) { return b.x0 < pg.L.gl || b.y0 < 0 || b.x1 > C - pg.L.gr || b.y1 > Rw; }
    function outsideN(b) { return b.x0 < pg.L.nl || b.y0 < 0 || b.x1 > C - pg.L.nr || b.y1 > Rw; }
    function outside1(b) { return b.x0 < Math.max(1, pg.L.gl) || b.y0 < 1 || b.x1 > C - Math.max(1, pg.L.gr) || b.y1 > Rw - 1; }
    function dbox(px0, py0, b) { var ex = Math.max(b.x0 - px0, 0, px0 - b.x1), ey = Math.max(b.y0 - py0, 0, py0 - b.y1); return Math.sqrt(ex * ex + ey * ey); }
    var fixed = K ? K.fixed : (pg.L.keyB ? [pg.L.keyB] : []).concat(pg.L.txtB || []);
    /* his spot at home: beside Boston's stop, his feet level with its foot, or over it; a cell of paper between
       him and the stop's own cell of paper; on the land; clear of the flag's place */
    var hp = pg.L.homeP, MANS = K ? K.MANS : [], TIE = false;
    if (hp && !K) {
      var q0 = hp.sq, w = 9, hh = 13, ax = 4;
      [0, 2, 4, 6, 9].forEach(function (d, j) {
        MANS.push([q0.x0 - 4 - (w - 1 - ax) - d, q0.y1, j * 2], [q0.x1 + 4 + ax + d, q0.y1, 1 + j * 2], [q0.x0 - 4 - (w - 1 - ax) - d, q0.y1 + 4, 4 + j * 2], [q0.x1 + 4 + ax + d, q0.y1 + 4, 5 + j * 2]);
        MANS.push([hp.cx - d, q0.y0 - 4, 2 + j * 2], [hp.cx + d, q0.y0 - 4, 2 + j * 2], [hp.cx - d, q0.y1 + 3 + hh, 6 + j * 2], [hp.cx + d, q0.y1 + 3 + hh, 6 + j * 2]);
        /* (and a little higher over it, so his venue's row may lie level with the stop, close by) */
        MANS.push([hp.cx - d, q0.y0 - 8, 3 + j * 2], [hp.cx + d, q0.y0 - 8, 3 + j * 2], [hp.cx - d - 4, q0.y0 - 6, 4 + j * 2], [hp.cx + d + 4, q0.y0 - 6, 4 + j * 2]);
      });
      function onLand(fx, fy) {
        for (var yy = fy; yy <= fy + 1; yy++) for (var xx = fx - 2; xx <= fx + 2; xx++) if (xx < 0 || yy < 0 || xx >= C || yy >= Rw || !pg.L.land[yy * C + xx]) return false;
        return true;
      }
      MANS = MANS.map(function (c) {
        var B = { x0: c[0] - ax - 1, y0: c[1] - hh, x1: c[0] - ax + w + 1, y1: c[1] + 2 }, s = c[2] * 6 + sum(IS, B);
        var h = (outside(B) ? 1 : 0) + (sum(IC, { x0: c[0] - ax, y0: c[1] - hh + 1, x1: c[0] - ax + w, y1: c[1] + 1 }) > 0 ? 1 : 0) + (onLand(c[0], c[1]) ? 0 : 1) + (sum(IF, B) > 0 ? 1 : 0);
        fixed.forEach(function (T) { if (hit(B, T)) h++; });
        s += sum(IC, B) * 20;
        return { s: s, h: h, fx: c[0], fy: c[1], B: B };
      });
      MANS.forEach(function (m, j) { m.id = j; });
    }
    /* (the fourth round, 2026-10-13: while a row cut off is being tied, TIE, he may also stand at any other place by
       the stop that is as good as those: on the land, clear of the roads, the coast, the stops, the flags' places and
       what never moves, his feet MAN_UP cells over the stop's top at most (so his venue's row lies level with its
       stop under him, where his own places stand a cell too low for it), MAN_DOWN under its foot, MAN_SIDE either
       side; each dearer than any of his own, and dearer the further from the nearest of them. The third review:
       boston's row stood 26 to 50px off behind him, tied to nothing, in windows 603 to 692px tall; every one of
       his own places off the leader's way lay on a flag's place or under the row. Worked out when first asked
       for, and kept with the map) */
    var MAN_UP = 16, MAN_DOWN = 17, MAN_SIDE = 26, MAN_MORE = 14;
    function mans2() {
      if (K.MANS2) return K.MANS2;
      var out = [], q0 = hp.sq, w = 9, hh = 13, ax = 4, own = {}, fx, fy;
      MANS.forEach(function (m) { own[m.fx + ',' + m.fy] = 1; });
      for (fy = q0.y0 - MAN_UP; fy <= q0.y1 + MAN_DOWN; fy++) for (fx = hp.cx - MAN_SIDE; fx <= hp.cx + MAN_SIDE; fx++) {
        if (own[fx + ',' + fy]) continue;
        var B = { x0: fx - ax - 1, y0: fy - hh, x1: fx - ax + w + 1, y1: fy + 2 }, ok = !outside(B) && !(sum(IC, { x0: fx - ax, y0: fy - hh + 1, x1: fx - ax + w, y1: fy + 1 }) > 0) && !(sum(IF, B) > 0), xx, yy, k, d = Infinity;
        for (yy = fy; ok && yy <= fy + 1; yy++) for (xx = fx - 2; ok && xx <= fx + 2; xx++) if (xx < 0 || yy < 0 || xx >= C || yy >= Rw || !pg.L.land[yy * C + xx]) ok = false;
        for (k = 0; ok && k < fixed.length; k++) if (hit(B, fixed[k])) ok = false;
        if (!ok) continue;
        for (k = 0; k < MANS.length; k++) d = Math.min(d, Math.hypot(MANS[k].fx - fx, MANS[k].fy - fy));
        out.push({ s: (MAN_MORE + d) * 6 + sum(IS, B) + sum(IC, B) * 20, h: 0, fx: fx, fy: fy, B: B, id: MANS.length + out.length });
      }
      return (K.MANS2 = out);
    }
    function manFor(block, way, pics) {
      var best = null;
      (TIE && K && hp && !hp.ghost ? MANS.concat(mans2()) : MANS).forEach(function (m) {
        var h = m.h, s = m.s;
        block.forEach(function (T) { if (hit(m.B, T)) h++; });
        /* (and four cells of paper from his venue's pictures, or he reads as one more picture in their row) */
        if (pics) pics.forEach(function (T) { if (!hit(m.B, T) && hit(m.B, pad(T, 3))) s += 160; });
        /* (on his own venue's leader's way: a cost; while a row cut off is being tied (TIE, below) a collision, so
           he stands clear of it wherever he can) */
        if (way && way.some(function (q) { return q[0] >= m.B.x0 && q[0] < m.B.x1 && q[1] >= m.B.y0 && q[1] < m.B.y1; })) { if (TIE) h++; else s += 300; }
        if (!best || h < best.h || (h === best.h && s < best.s)) best = { h: h, s: s, m: m };
      });
      return best;
    }
    var ghost = K ? K.ghost : null;
    if (!K && hp && hp.ghost) { ghost = manFor([]).m; fixed.push(ghost.B); }
    /* where a box of a size is clear of what never moves (memo per size): for the rooms, and for the cards */
    var FREE = K ? K.FREE : new Map();
    /* (round 11, 2026-10-13: a map is worked out as it is asked for, not whole and ahead. Every size's whole map
       was made before the first choice, 23 to 26 maps of every cell of the map (a tenth of a plain screen's
       laying out, where a few rows round each venue and a few hundred single places are all that is ever asked).
       Now a map is its cells as far as they are known (F: 0 not asked yet, 1 free, 2 not), by the same test
       (freeIs: the map's sums on the numbers, what never moves, a card's guard): a row of it when a row of places
       is looked through (freeRow, which also sets each cell's next free place along the row, this cell or the
       first to its right (C: none): NF, so the places between are stepped over, not asked one by one), a cell
       when one place is asked about (freeAt). The answers are the same answers; nothing is made that is not
       asked for, and no step is longer for it: a row is a few hundred sums) */
    function freeMap(w, h, card) {
      var key = (card ? 'c' : 'r') + w + 'x' + h, M = FREE.get(key);
      if (!M) { M = { F: new Uint8Array(C * Rw), NF: new Int16Array(C * Rw), ok: new Uint8Array(Rw), w: w, h: h, I: card ? IF : IP, pd: card ? 1 : 0, gd: card ? pg.L.guard || [] : [], gl: Math.max(1, pg.L.gl), gr: Math.max(1, pg.L.gr) }; FREE.set(key, M); }
      return M;
    }
    /* (the test as it was made for every cell: inside the map's own margin, a cell in; nothing of the map under
       it (a card: nor within a cell of it); clear of what never moves and, a card, of the column's words' guard) */
    function freeIs(M, xx, yy) {
      var w = M.w, h = M.h, I = M.I, pd = M.pd, k, T;
      if (yy < 1 || yy + h > Rw - 1 || xx < M.gl || xx + w > C - M.gr) return false;
      var ya = Math.max(0, yy - pd), yb = Math.min(Rw, yy + h + pd), xa = Math.max(0, xx - pd), xb = Math.min(C, xx + w + pd);
      if (I[yb * W1 + xb] - I[ya * W1 + xb] - I[yb * W1 + xa] + I[ya * W1 + xa] > 0) return false;
      for (k = 0; k < fixed.length; k++) { T = fixed[k]; if (xx < T.x1 && xx + w > T.x0 && yy < T.y1 && yy + h > T.y0) return false; }
      for (k = 0; k < M.gd.length; k++) { T = M.gd[k]; if (xx < T.x1 && xx + w > T.x0 && yy < T.y1 && yy + h > T.y0) return false; }
      return true;
    }
    function freeRow(M, yy) {
      var F = M.F, NF = M.NF, w = M.w, h = M.h, I = M.I, pd = M.pd, gd = M.gd, i0 = yy * C, x0 = M.gl, x1 = C - M.gr - w, xx, nx = C, k, T, v;
      var live = yy >= 1 && yy + h <= Rw - 1, ya = Math.max(0, yy - pd), yb = Math.min(Rw, yy + h + pd), rA = ya * W1, rB = yb * W1, xa, xb;
      for (xx = C - 1; xx >= 0; xx--) {
        v = 2;
        if (live && xx >= x0 && xx <= x1) {
          xa = Math.max(0, xx - pd); xb = Math.min(C, xx + w + pd);
          if (!(I[rB + xb] - I[rA + xb] - I[rB + xa] + I[rA + xa] > 0)) {
            v = 1;
            for (k = 0; k < fixed.length; k++) { T = fixed[k]; if (xx < T.x1 && xx + w > T.x0 && yy < T.y1 && yy + h > T.y0) { v = 2; break; } }
            for (k = 0; v === 1 && k < gd.length; k++) { T = gd[k]; if (xx < T.x1 && xx + w > T.x0 && yy < T.y1 && yy + h > T.y0) v = 2; }
          }
        }
        F[i0 + xx] = v;
        if (v === 1) nx = xx;
        NF[i0 + xx] = nx;
      }
      M.ok[yy] = 1;
    }
    function freeAt(M, xx, yy) {
      if (!(xx >= 0 && yy >= 0 && xx + M.w <= C && yy + M.h <= Rw)) return false;
      var v = M.F[yy * C + xx];
      if (v === 0) v = M.F[yy * C + xx] = freeIs(M, xx, yy) ? 1 : 2;
      return v === 1;
    }
    /* where he plays in each venue's room (its scenes' acts at the room's foot) */
    S.PL.forEach(function (P) { P.figs = figsOf(P); });
    /* each venue's row: its shapes and places */
    var itemOf = function (P) {
      var q = P.sq, lwPx = P.lw, lhPx = P.lh, lw = Math.ceil(lwPx / cs - 1e-6), lh = Math.ceil(lhPx / cs - 1e-6);
      var nm = P.md.length, mdw = nm ? nm * 6 - 1 : 0, cx = (q.x0 + q.x1 + 1) / 2, cy = (q.y0 + q.y1 + 1) / 2;
      var pics = P.slots.filter(function (s) { return s.A; });
      pics.forEach(function (s) { s.pi = picOf(s.A); });
      /* the row's offsets from the name's top left (cells): its pictures two cells after the name and two apart
         (on a phone a venue of several sports keeps a finger's width between their middles), then its medals, each
         on the name's middle line */
      var tap = pg.L.phone && P.multi, pitch = tap ? Math.ceil(24 / cs) : 0, mid = lhPx / 2 / cs, g4 = Math.max(2, Math.ceil(4 / cs - 1e-6));
      /* its pictures and medals in a line from x0 (cells), each centred on the line's middle my */
      function line(x0, my) {
        var at = [], xx = x0, pc = null;
        pics.forEach(function (s, j) {
          var a0 = xx + (j ? g4 : x0 === lw ? (tap ? Math.ceil(9 / cs) : g4) : 0);
          if (pc != null && pitch) a0 = Math.max(a0, Math.ceil(pc + pitch - s.pi.w / 2));
          at.push({ s: s, dx: a0, dy: Math.round(my - s.pi.h / 2), w: s.pi.w, h: s.pi.h });
          pc = a0 + s.pi.w / 2; xx = a0 + s.pi.w;
        });
        var mdx = nm ? xx + (pics.length ? g4 : x0 === lw ? Math.max(1, Math.ceil(3 / cs)) : 0) : xx;
        return { at: at, mdx: mdx, mdy: Math.round(my - 2.5), end: nm ? mdx + mdw : xx };
      }
      function shape(Ln, pen) {
        var top = Math.min.apply(null, [0, nm ? Ln.mdy : 0].concat(Ln.at.map(function (a) { return a.dy; })));
        var bot = Math.max.apply(null, [lh, nm ? Ln.mdy + 5 : 0].concat(Ln.at.map(function (a) { return a.dy + a.h; })));
        return { at: Ln.at, mdx: Ln.mdx, mdy: Ln.mdy, bw: Math.max(lw, Ln.end), top: top, bot: bot, pen: pen };
      }
      /* the row: right after the name, on its middle line; on a phone's small map, where that line is too long to
         lie clear, its pictures and medals may go on a line of their own under the name (a step more costly) */
      /* (wrap: every row of the map so, its pictures and medals on a line of their own under its name) */
      var shapes = [];
      if (wrap && (pics.length || nm)) { var ph0 = Math.max.apply(null, [nm ? 5 : 0].concat(pics.map(function (s) { return s.pi.h; }))); shapes.push(shape(line(0, lh + 1 + ph0 / 2), 0)); }
      else shapes.push(shape(line(lw, mid), 0));
      var cands = [];
      function cand(SH, side, bx, by, pen, only0) {
        var at = SH.at, mdx = SH.mdx, mdy = SH.mdy, bw = SH.bw, top = SH.top, bot = SH.bot;
        var B = { x0: bx, y0: by + top, x1: bx + bw, y1: by + bot }, NB = { x0: bx, y0: by, x1: bx + lw, y1: by + lh };
        var T = { x0: bx, y0: by, x1: bx + lwPx / cs, y1: by + lhPx / cs };
        var pb = at.map(function (a) { return { x0: bx + a.dx, y0: by + a.dy, x1: bx + a.dx + a.w, y1: by + a.dy + a.h, s: a.s }; });
        var MD = nm ? { x0: bx + mdx, y0: by + mdy, x1: bx + mdx + mdw, y1: by + mdy + 5 } : null;
        var hard = 0, s = (pen + SH.pen) * 4 + sum(IS, NB);
        /* the name inside the map (on a phone, the page's column where it can; where it cannot, the page's side
           margin, never past the map's edge); the whole row on paper: no road, stop or flag under it; its pictures
           and medals inside the map, clear of the coast too (on a phone's small map they may lie over it, as a name
           may, softly), a cell from a road */
        var NT = { x0: Math.floor(bx + 1e-6), y0: by, x1: Math.ceil(T.x1 - 1e-6), y1: by + lh };
        if (pg.L.phone) { if (NT.x0 < 1 || NT.x1 > C - 1 || NT.y0 < 0 || NT.y1 > Rw || outsideN(NT)) hard++; }
        else if (outsideN(NT)) hard++;
        if (sum(IN, B) > 0) hard++;
        pb.concat(MD ? [MD] : []).forEach(function (b) {
          if (sum(pg.L.phone ? IP : IH, b) > 0) hard++;
          else if (pg.L.phone) { if (b.x0 < 1 || b.x1 > C - 1 || b.y0 < 0 || b.y1 > Rw || outside(b)) hard++; }
          else if (outside(b)) hard++;
          s += sum(IS, b) * (pg.L.phone ? 1 : 0.2);
        });
        fixed.forEach(function (F0) { if (hit(B, F0)) hard++; });
        var dOwn = dbox(cx, cy, B);
        S.PL.forEach(function (Q) { if (Q !== P && dbox((Q.sq.x0 + Q.sq.x1 + 1) / 2, (Q.sq.y0 + Q.sq.y1 + 1) / 2, B) < dOwn) hard++; });
        if (only0 && hard) return null;   /* (more: only a place clear by itself is weighed on) */
        s += 14 * Math.max(0, dOwn - 5);
        /* a row that stands off needs the way to its stop clear for its leader: the cells of that line */
        var way = null;
        if (Math.max(B.x0 - q.x1 - 1, q.x0 - B.x1, B.y0 - q.y1 - 1, q.y0 - B.y1) >= 6) {
          var mh = (B.y1 - B.y0) * 0.3, wx = clamp(cx, B.x0 + 1.5, B.x1 - 1.5), wy = clamp(cy, B.y0 + mh, B.y1 - mh);
          way = [];
          bres(Math.floor(cx), Math.floor(cy), Math.floor(wx), Math.floor(wy), way);
          way = way.filter(function (c) { return !(c[0] >= q.x0 - 3 && c[0] <= q.x1 + 3 && c[1] >= q.y0 - 3 && c[1] <= q.y1 + 3) && !(c[0] >= B.x0 && c[0] < B.x1 && c[1] >= B.y0 && c[1] < B.y1); });
          /* (and clear of what never moves, a road, a stop, a flag's place, the map's edge: under the line no
             leader is drawn at all (apply), so that place costs as much as one that leaves its card no room
             (CARDC; at half that boston's row, 1366 x 657, still stood 30px over its stop behind its flag's
             place), and a row stands off only where it can be tied to its stop) */
          var lp = leadPath(q, B);
          if (!lp || lp.length < 3 || lp.some(function (c) { return c[0] < 0 || c[1] < 0 || c[0] >= C || c[1] >= Rw || (occ[c[1] * C + c[0]] & (ROAD | STOP | FLAG)); })) s += CARDC;
        }
        var made = { side: side, B: B, NB: NB, T: T, pics: pb, MD: MD, hard: hard, s: s, way: way, bx: bx, by: by };
        if (!only0) cands.push(made);
        return made;
      }
      shapes.forEach(function (SH) {
        var bw = SH.bw, top = SH.top, bot = SH.bot;
        /* beside the stop: the name's middle level with the stop's, then a little higher or lower, and further out */
        [0, -0.6, 0.6, -1.2, 1.2, -1.8, 1.8, -2.6, 2.6].forEach(function (f, j) {
          var by = Math.round(cy - mid + f * lh);
          [0, 3, 6, 10, 14, 18].forEach(function (o, k) {
            cand(SH, 'r', q.x1 + 3 + o, by, j * 4 + k * 5);
            cand(SH, 'l', q.x0 - 2 - bw - o, by, j * 4 + 2 + k * 5);
          });
        });
        /* over it or under it: centred on it, or its start or its end over the stop */
        [0, -0.35, 0.35, -0.6, 0.6].forEach(function (f, j) {
          var bx = Math.round(cx - bw / 2 + f * bw);
          [0, 3, 6].forEach(function (d, k) {
            cand(SH, 'u', bx, q.y0 - 2 - d - bot, 9 + j * 3 + k * 5);
            cand(SH, 'd', bx, q.y1 + 3 + d - top, 9 + j * 3 + k * 5);
          });
        });
        /* at a corner of it */
        [0, 3, 6, 10].forEach(function (d, k) {
          var pe = 14 + k * 6;
          cand(SH, 'r', q.x1 + 2 + d, q.y0 - 1 - d - bot, pe);
          cand(SH, 'l', q.x0 - 1 - d - bw, q.y0 - 1 - d - bot, pe);
          cand(SH, 'r', q.x1 + 2 + d, q.y1 + 2 + d - top, pe);
          cand(SH, 'l', q.x0 - 1 - d - bw, q.y1 + 2 + d - top, pe);
        });
      });
      cands.sort(function (a, b) { return a.hard - b.hard || a.s - b.s; });
      cands = cands.slice(0, 160);
      cands.forEach(function (c, n) { c.id = items.length * 1000 + n; });
      var made = { P: P, id: 'i' + items.length, cands: cands, lh: lh, lw: lw, lwPx: lwPx, lhPx: lhPx, rw: P.rw, rh: P.rh, cw: P.cw || 0, ch: P.ch || 0, cw2: P.cw2 || 0, ch2: P.ch2 || 0, cw0: P.cw0 || 0, ch0: P.ch0 || 0, cwf: P.cwf || 0, chf: P.chf || 0, cfm: new Map() };
      /* (the fourth round, 2026-10-13: a desktop's venue none of whose places above is clear by itself, a road, a
         coast or a stop under its row at every one of them, looks at every cell within MORE cells of its stop
         instead, and takes on the MORE_KEEP cheapest that are: the nearest, level with the stop first. The third
         review's audit: rhode island's name lay across the road to Boston in windows 583, 597 and 598px tall,
         and its medals on the coast at 615 and 616, the placing's one collision left there, in every form it
         tried. In steps, a band of rows each; only such a venue ever asks: where every venue has a clear place
         among its own, nothing is done differently) */
      if (!pg.L.phone && cands.length && cands[0].hard) made.more = function* () {
        var ix = +made.id.slice(1), got = [], n = 0;
        for (var si = 0; si < shapes.length; si++) {
          var SH = shapes[si], lev = Math.round(cy - mid);
          for (var by = q.y0 - MORE - SH.bot; by <= q.y1 + 1 + MORE - SH.top; by++) {
            for (var bx = q.x0 - MORE - SH.bw; bx <= q.x1 + 1 + MORE; bx++) {
              var c = cand(SH, bx >= q.x1 + 1 ? 'r' : bx + SH.bw <= q.x0 ? 'l' : by < lev ? 'u' : 'd', bx, by, MORE_PEN + Math.round(4 * Math.abs(by - lev) / lh), true);
              if (c) got.push(c);
            }
            if (++n % MORE_ROWS === 0) yield;
          }
        }
        got.sort(function (a, b) { return a.s - b.s; });
        cands = got.slice(0, MORE_KEEP).concat(cands).slice(0, 160);
        cands.forEach(function (c, k) { c.id = ix * 1000 + k; });
        made.cands = cands; made.more = null; made.took = got.length > 0;
      };
      return made;
    };
    var MORE = 20, MORE_PEN = 30, MORE_KEEP = 60, MORE_ROWS = 6;
    var items = K ? K.items : [];
    /* (a venue's places: 1 to 3ms, said since the fourth round) */
    for (var pi = 0; !K && pi < S.PL.length; pi++) { yield 3; var it1 = itemOf(S.PL[pi]); items.push(it1); if (it1.more) { yield; yield* it1.more(); } }
    yield;
    /* (kept from here: every row's place is in; what is asked for later is added to it as it is worked out) */
    if (!K) {
      K = { PL: S.PL, II: II, fixed: fixed, MANS: MANS, ghost: ghost, FREE: FREE, items: items, memo: new Map(), cr: new Map(), co: new Map(), fl: new Map() };
      if (SOLVED.size >= 3) SOLVED.delete(SOLVED.keys().next().value);
      SOLVED.set(KEY, K);
    }
    var MEMO = K.memo;
    /* (each venue's maps of free places, its room's and its cards', were worked out ahead here, a step each;
       since round 11 they are worked out as they are asked for, a row or a cell at a time: freeMap) */
    /* every place a venue's room may take, its row's place given (memo per row's place and the room's size): within
       ROOM_CAP cells of its anchor (round 5's rule), off its row (a cell of paper between), inside the map; free of
       what never moves (a road, a stop, a flag and the cells round them, the key, the column's words) or else a
       collision (fx); costing by roomCost, the coast under it and a cell's touch of its row or stop; the free first,
       the cheapest first */
    function spotCost(c, P, r, A, sq) {
      return roomCost(r, A, P.figs || [], sq, c.B) + ROOM_COASTC * sum(ICO, r) + (Math.min(gapE(r, c.B), gapE(r, sq)) < 1.5 ? 6 : 0);
    }
    /* (round 11, 2026-10-13: the list made on the numbers, 0.3 million places of it at 1366 x 657 and 0.4 million
       at 1536 x 960 and 125%: the two tests most cells fail (on its row, or too far from its anchor: ancGap's own
       sums) first, then spotCost's own sums in spotCost's own order (roomCost, the coast, the touch), no box
       and no list made for a cell. The list is columns of numbers, a place a row of them: X, Y (its cell), C
       (its cost), D (its gap to its row or stop) and, worked out when it is first weighed (roomHard), ND (what
       that asks of the others) and HS (the count the others have no part in; -1: not yet). n places in all,
       the first nf of them free. The order is the one the sort gave, the free first, the cheapest first,
       places of one cost as they were met: the costs are put in order as plain numbers, each place then set
       at its cost's first rank and on from there (inOrder: the place for each rank).
       The free places are the list at first, found by stepping from one to the next; those that are not free,
       two in three, come after them and are made, the same way, only when an asker has gone through the free
       ones and may still choose among the rest: roomFor, rest) */
    var SPN = 0, SPX = null, SPY = null, SPC = null, SPD = null, SPK = null, SPI = null, SPO = null;
    function inOrder(n) {
      var i, v, lo, hi, mid, ks = SPK.subarray(0, n);
      for (i = 0; i < n; i++) { ks[i] = SPC[i]; SPI[i] = 0; }
      ks.sort();
      for (i = 0; i < n; i++) {
        v = SPC[i]; lo = 0; hi = n;
        while (lo < hi) { mid = (lo + hi) >> 1; if (ks[mid] < v) lo = mid + 1; else hi = mid; }
        SPO[lo + SPI[lo]++] = i;
      }
    }
    function roomSpots(c, P, w, h, rest) {
      var key = w + 'x' + h + ':' + (pg.L.lowSky ? 1 : 0), SP = c.spots;
      if (SP && SP.key === key && (!rest || SP.all)) return SP;
      var sq = sqBox(P), A = anchorOf(sq, c.NB, c.pics), AP = ancParts(P, c.NB, c.pics), M = freeMap(w, h, false), F = M.F, PB = pad(c.B, 1), B = c.B, m = 0, xx, yy;
      var X0 = Math.max(Math.max(1, pg.L.gl), A.x0 - w - roomCap()), X1 = Math.min(C - Math.max(1, pg.L.gr) - w, A.x1 + roomCap()), Y0 = Math.max(1, A.y0 - h - roomCap()), Y1 = Math.min(Rw - 1 - h, A.y1 + roomCap());
      var np = AP.length, far = roomCap() + 1e-9, figs = P.figs || [], nf = figs.length, k, pt, f, dx, dy, d, g, dF, side, cost, i0, i1, nx, NF = M.NF;
      /* (the places are set down in columns kept for the purpose, as long as the longest list asked so far) */
      k = Math.max(0, X1 - X0 + 1) * Math.max(0, Y1 - Y0 + 1);
      if (k > SPN || !SPX) { SPN = Math.max(k, 2 * SPN, 1024); SPX = new Int16Array(SPN); SPY = new Int16Array(SPN); SPC = new Float64Array(SPN); SPD = new Float64Array(SPN); SPK = new Float64Array(SPN); SPI = new Int32Array(SPN); SPO = new Int32Array(SPN); }
      for (yy = Y0; yy <= Y1; yy++) {
        if (!M.ok[yy]) freeRow(M, yy);
        side = ROOM_SIDE[yy >= B.y1 ? 0 : yy + h <= B.y0 ? 2 : 1];
        i0 = yy * W1; i1 = (yy + h) * W1;
        for (xx = X0; xx <= X1; xx++) {
          if (rest) { if (F[yy * C + xx] === 1) continue; }
          else { nx = NF[yy * C + xx]; if (nx !== xx) { if (nx > X1) break; xx = nx - 1; continue; } }
          if (xx < PB.x1 && xx + w > PB.x0 && yy < PB.y1 && yy + h > PB.y0) continue;
          g = Infinity;
          for (k = 0; k < np; k++) { pt = AP[k]; dx = Math.max(0, xx - pt.x1, pt.x0 - xx - w); dy = Math.max(0, yy - pt.y1, pt.y0 - yy - h); d = Math.sqrt(dx * dx + dy * dy); if (d < g) g = d; }
          if (g > far) continue;
          dF = 0;
          for (k = 0; k < nf; k++) { f = figs[k]; dx = Math.max(0, xx + f.x0 - sq.x1, sq.x0 - (xx + f.x1)); dy = Math.max(0, yy + f.y0 - sq.y1, sq.y0 - (yy + f.y1)); dF = Math.max(dF, Math.sqrt(dx * dx + dy * dy)); }
          dx = Math.max(0, xx - B.x1, B.x0 - xx - w); dy = Math.max(0, yy - B.y1, B.y0 - yy - h); g = Math.sqrt(dx * dx + dy * dy);
          dx = Math.max(0, xx - sq.x1, sq.x0 - xx - w); dy = Math.max(0, yy - sq.y1, sq.y0 - yy - h); d = Math.min(g, Math.sqrt(dx * dx + dy * dy));
          cost = ROOM_F * dF + side + ROOM_COASTC * (ICO[i1 + xx + w] - ICO[i0 + xx + w] - ICO[i1 + xx] + ICO[i0 + xx]) + (d < 1.5 ? 6 : 0);
          SPX[m] = xx; SPY[m] = yy; SPC[m] = cost; SPD[m] = d; m++;
        }
      }
      inOrder(m);
      /* (cb: the card's boxes beside each place, as they are asked for: cardFits; all: the places not free are in) */
      var n0 = rest ? SP.n : 0, n1 = n0 + m, X = new Int16Array(n1), Y = new Int16Array(n1), CO = new Float64Array(n1), D = new Float64Array(n1), ND = new Float64Array(n1), HS = new Int8Array(n1);
      if (rest) { X.set(SP.X); Y.set(SP.Y); CO.set(SP.C); D.set(SP.D); ND.set(SP.ND); HS.set(SP.HS); }
      for (k = 0; k < m; k++) { i0 = SPO[k]; X[n0 + k] = SPX[i0]; Y[n0 + k] = SPY[i0]; CO[n0 + k] = SPC[i0]; D[n0 + k] = SPD[i0]; HS[n0 + k] = -1; }
      if (rest) { SP.n = n1; SP.all = true; }
      else SP = c.spots = { key: key, A: A, cb: [], all: false, n: n1, nf: n1, X: null, Y: null, C: null, D: null, ND: null, HS: null };
      SP.X = X; SP.Y = Y; SP.C = CO; SP.D = D; SP.ND = ND; SP.HS = HS;
      return SP;
    }
    /* a room's collisions at a place, its row's place given, with the rows, rooms and his spot placed so far: another
       venue's row or room within a cell; another venue's row, stop or (a phone's) picture's button nearer than
       roomNeed of its own row or stop; him (another venue's room); its row's leader */
    /* (the third round: the same tests written on the numbers, the stops' boxes made once a solve: it made a box for
       every row and every stop at every place weighed, 0.09 to 0.14s of a dear size's making) */
    var SQB = S.PL.map(sqBox);
    /* (the fourth round: cap, where the asker only needs to know that a place has more collisions than that (a
       place looked at after a better one, roomFor; any at all, where only a clear place will do): the count stops
       there, the answer more than cap, the same choice made. With the cards' places turned down before their boxes are
       made, cardPlaceSteps' at, 5% of a dear screen's laying out: 0.82 to 0.78s at 1366 x 657) */
    /* (round 11, 2026-10-13: a place is the k-th of its row's place's list (roomSpots' SP), and what of the count
       the others have no part in is worked out when the place is first weighed and kept with it: what its gap
       to its own row or stop (D) asks of the others (ND), and the other venues' stops nearer than that, with
       its own row's leader under it (HS). The others' part, him, their rooms and their rows, is counted on the
       numbers. The count is the same count, in another order, stopped past cap as before: more than cap is all
       such an asker needs to know. 0.86 million of these at 1366 x 657, each with two boxes made for it) */
    function roomHard(P, SP, k, w, h, c, stat, rooms, man, cap) {
      var x0 = SP.X[k], y0 = SP.Y[k], x1 = x0 + w, y1 = y0 + h, n, q, tb, dx, dy;
      if (SP.HS[k] < 0) {
        var r = { x0: x0, y0: y0, x1: x1, y1: y1 }, nd = roomNeed(SP.D[k]) - 1e-9, hs = 0;
        for (n = 0; n < S.PL.length; n++) if (S.PL[n] !== P && gapE(r, SQB[n]) < nd) hs++;
        if (c.way) for (n = 0; n < c.way.length; n++) { q = c.way[n]; if (q[0] >= x0 && q[0] < x1 && q[1] >= y0 && q[1] < y1) { hs++; break; } }
        SP.ND[k] = nd; SP.HS[k] = hs;
      }
      var need = SP.ND[k], hh = SP.HS[k];
      if (hh > cap) return hh;
      if (man && P !== hp) { tb = man.B; if (x0 < tb.x1 && x1 > tb.x0 && y0 < tb.y1 && y1 > tb.y0 && ++hh > cap) return hh; }
      for (n = 0; n < rooms.length; n++) { tb = rooms[n].b; if (rooms[n].P !== P && x0 - 1 < tb.x1 && x1 + 1 > tb.x0 && y0 - 1 < tb.y1 && y1 + 1 > tb.y0 && ++hh > cap) return hh; }
      for (n = 0; n < stat.length; n++) {
        var T = stat[n];
        if (T.P === P) continue;
        tb = T.b;
        if (x0 < tb.x1 + 1 && x1 > tb.x0 - 1 && y0 < tb.y1 + 1 && y1 > tb.y0 - 1) { if (++hh > cap) return hh; continue; }
        dx = Math.max(0, x0 - tb.x1, tb.x0 - x1); dy = Math.max(0, y0 - tb.y1, tb.y0 - y1);
        if (Math.sqrt(dx * dx + dy * dy) < need) { if (++hh > cap) return hh; continue; }
        if (T.taps) for (q = 0; q < T.taps.length; q++) {
          tb = T.taps[q]; dx = Math.max(0, x0 - tb.x1, tb.x0 - x1); dy = Math.max(0, y0 - tb.y1, tb.y0 - y1);
          if (Math.sqrt(dx * dx + dy * dy) < need) { if (++hh > cap) return hh; break; }
        }
      }
      return hh;
    }
    /* a card's places beside a room: right of it (its top or its foot level with the room's), left of it, under
       it, over it; a cell or two apart; and along its sides */
    /* (round 11: the places as numbers in a row, x then y, in the order they were listed in: no list made for each) */
    function cardSpots(r, w, h) {
      var out = [], g;
      for (g = 1; g <= 2; g++) {
        out.push(r.x1 + g, r.y0, r.x1 + g, r.y1 - h, r.x0 - g - w, r.y0, r.x0 - g - w, r.y1 - h);
        out.push(r.x0, r.y1 + g, r.x1 - w, r.y1 + g, r.x0, r.y0 - g - h, r.x1 - w, r.y0 - g - h);
      }
      for (var d = 4; d < h; d += 6) { out.push(r.x1 + 1, r.y0 - d, r.x0 - 1 - w, r.y0 - d, r.x1 + 1, r.y1 - h + d, r.x0 - 1 - w, r.y1 - h + d); }
      for (var d2 = 4; d2 < w; d2 += 8) { out.push(r.x0 - d2, r.y1 + 1, r.x1 - w + d2, r.y1 + 1, r.x0 - d2, r.y0 - 1 - h, r.x1 - w + d2, r.y0 - 1 - h); }
      return out;
    }
    /* the card the venue may need fits beside a room, or beside the row and its stop, clear of what never moves
       (the boxes beside a place found once per place and size), of its row, its room and the rows placed so far:
       the venue's largest card at the middle width, the widest or the narrowest */
    function cardBoxes(it, bx, zi) {
      var z = zi === 2 ? [it.cw0, it.ch0] : zi ? [it.cw2, it.ch2] : [it.cw, it.ch], key = ((bx.x0 + 2048) * 4096 + (bx.y0 + 2048)) * 4 + zi, K2 = bx.x1 * 4096 + bx.y1, m = it.cfm.get(key);
      if (m && m.k2 === K2) return m.list;
      var list = [];
      if (z[0] && z[1]) {
        var M = freeMap(z[0], z[1], true), sp = cardSpots(bx, z[0], z[1]), sq = sqBox(it.P), x, y;
        for (var k = 0; k < sp.length; k += 2) {
          x = sp[k]; y = sp[k + 1];
          /* (free; not within a cell of its own stop; and, round 11, APART px from every other venue's stop: the
             second half of what both its askers asked of a box every time, asked once, here) */
          if (!freeAt(M, x, y) || (x - 1 < sq.x1 && x + z[0] + 1 > sq.x0 && y - 1 < sq.y1 && y + z[1] + 1 > sq.y0)) continue;
          var cb = { x0: x, y0: y, x1: x + z[0], y1: y + z[1] };
          if (apartSq(cb, it.P)) list.push(cb);
        }
      }
      it.cfm.set(key, { k2: K2, list: list });
      return list;
    }
    function apartSq(cb, P) {
      var m = APART / cs - 1e-6;
      for (var n = 0; n < S.PL.length; n++) if (S.PL[n] !== P && gapE(cb, SQB[n]) < m) return false;
      return true;
    }
    /* (round 11: what its two askers asked of a box, on the numbers: with a cell of paper round it clear of its row
       and the rows placed, and APART px from every other venue's row with its stop (T.u, made once a row
       placed). The other venues' stops are asked where the box is made: cardBoxes) */
    function boxOk(cb, B, stat, P) {
      var x0 = cb.x0 - 1, y0 = cb.y0 - 1, x1 = cb.x1 + 1, y1 = cb.y1 + 1, m = APART / cs - 1e-6, n, T, tb, dx, dy;
      if (x0 < B.x1 && x1 > B.x0 && y0 < B.y1 && y1 > B.y0) return false;
      for (n = 0; n < stat.length; n++) { tb = stat[n].b; if (x0 < tb.x1 && x1 > tb.x0 && y0 < tb.y1 && y1 > tb.y0) return false; }
      for (n = 0; n < stat.length; n++) {
        T = stat[n];
        if (T.P === P) continue;
        tb = T.u || (T.u = unite(T.b, sqBox(T.P)));
        dx = Math.max(0, cb.x0 - tb.x1, tb.x0 - cb.x1); dy = Math.max(0, cb.y0 - tb.y1, tb.y0 - cb.y1);
        if (Math.sqrt(dx * dx + dy * dy) < m) return false;
      }
      return true;
    }
    /* (and APART px from every other venue: its stop, and its row with its stop where it is placed, as cardPlace
       asks; round 5's second look: a scene kept clear of the next venue's row could leave its card none, a place
       the placing thought free lying by another venue's stop. Since round 11 in two halves: apartSq, boxOk) */
    /* (beside the row and its stop: once per row's place, clear of the row and the rows placed) */
    function cardsByRow(it, B, stat) {
      if (!it.cw || !it.ch) return null;
      var U = unite(B, sqBox(it.P)), out = [];
      [0, 1, 2].forEach(function (zi) { cardBoxes(it, U, zi).forEach(function (cb) { if (boxOk(cb, B, stat, it.P)) out.push(pad(cb, 1)); }); });
      return out;
    }
    /* (round 11: cbl, k: the boxes beside this place, the k-th of its row's place's list, kept with the list at
       3 k + the size, so they are not looked up by the place's cells each time; the same boxes, cardBoxes') */
    function cardFits(it, r, B, stat, byRow, cbl, k) {
      if (!it.cw || !it.ch) return true;
      var j, cb;
      if (byRow) for (j = 0; j < byRow.length; j++) if (!hit(byRow[j], r)) return true;
      for (var zi = 0; zi < 3; zi++) {
        var m = cbl[3 * k + zi] || (cbl[3 * k + zi] = cardBoxes(it, r, zi));
        for (j = 0; j < m.length; j++) { cb = m[j]; if (!(cb.x0 - 1 < r.x1 && cb.x1 + 1 > r.x0 && cb.y0 - 1 < r.y1 && cb.y1 + 1 > r.y0) && boxOk(cb, B, stat, it.P)) return true; }
      }
      return false;
    }
    /* a venue's room, its row given (and the rows, rooms and his spot placed so far) */
    /* (the places in order: the first free one without a collision whose card fits is the best; a place where the
       card finds no room costs CARDC, so the next ones are tried for it, ROOM_CARDS at most; none free and clear: the
       one with the fewest collisions) */
    /* (round 11, 2026-10-13: lim, where the asker's row's place already has as many collisions as the best so far:
       what its room's place has to cost less than to be chosen at all (the best's cost less the row's own). A
       room with a collision cannot be chosen then, nor a clear one costing lim or more, at whatever its card
       costs (that is only added); so once the list is past lim and no clear place has turned up, none will that
       can be, and the answer is "none" (a collision), which the asker turns down as it would the true one. A
       clear place found under lim, the list is gone through as ever and the true answer given. A third of the
       rows' places weighed found their rooms' lists at an end this way) */
    function roomFor(it, c, stat, rooms, man, lim) {
      var P = it.P, w = it.rw, h = it.rh, best = null, av = S.avoid && S.avoid[P.name], cards = 0;
      if (!w || !h) return { h: 0, s: 0, b: null, dOwn: 0 };
      var SP = roomSpots(c, P, w, h), byRow, card = !!(it.cw && it.ch), r = null, s = 0, cbl = SP.cb, e2, e3;
      for (var k = 0; ; k++) {
        /* (the free places gone through: a clear one found, the rest cannot do better; told what to beat and none
           found, "none", as below; else the places that are not free, made now, and on) */
        if (k >= SP.n) {
          if (SP.all || (best && best.h === 0)) break;
          if (lim != null) return { h: 1, s: 0, b: null, dOwn: 0, lose: 1 };
          roomSpots(c, P, w, h, true);
          if (k >= SP.n) break;
        }
        /* (the place's cost, and whether it is free: 0, or not: 1) */
        e2 = SP.C[k]; e3 = k < SP.nf ? 0 : 1;
        if (best && best.h === 0 && (e3 || e2 >= best.s)) break;
        if (best && e3 > best.h) break;
        if (lim != null && (!best || best.h > 0) && (e3 || e2 >= lim + 1e-6)) return { h: 1, s: 0, b: null, dOwn: 0, lose: 1 };
        /* (round 11: a clear place is found and the card tests are spent: every place from here on costs CARDC and
           is no cheaper than that one (the list is in order of cost; no place to keep off, which costs out of
           that order), so none of them can be taken. Each was weighed: half the places weighed on a dear size) */
        if (best && best.h === 0 && card && cards >= ROOM_CARDS && !av) break;
        s = e2;
        if (av) { r = { x0: SP.X[k], y0: SP.Y[k], x1: SP.X[k] + w, y1: SP.Y[k] + h }; if (av.some(function (a) { return a.room && hit(r, a.room); })) s += AVOID; }
        if (best && e3 === best.h && s >= best.s) continue;
        if (best && SP.HS[k] > best.h - e3) continue;   /* (its own count, once known, is already too many: roomHard would say so) */
        var hh2 = roomHard(P, SP, k, w, h, c, stat, rooms, man, best ? best.h - e3 : Infinity) + e3;
        if (best && (hh2 > best.h || (hh2 === best.h && s >= best.s))) continue;
        var cp = 0;
        if (!av) r = { x0: SP.X[k], y0: SP.Y[k], x1: SP.X[k] + w, y1: SP.Y[k] + h };
        if (card && cards++ < ROOM_CARDS) { if (byRow === undefined) byRow = cardsByRow(it, c.B, stat); cp = cardFits(it, r, c.B, stat, byRow, cbl, k) ? 0 : CARDC; }
        else if (card) cp = CARDC;
        if (!best || hh2 < best.h || (hh2 === best.h && s + cp < best.s)) best = { h: hh2, s: s + cp, b: r, dOwn: SP.D[k], cp: cp };
      }
      return best || { h: 3, s: 999, b: null, dOwn: 0 };
    }
    /* a venue's best choice with the others given (their rows, their rooms, his spot) */
    /* (in steps: a yield after each of its row's places whose room was weighed, the dear part; a venue's first choice
       on a map, its rooms' places not yet worked out, was one step of 15 to 18ms. bestFor runs them in one go) */
    /* (round 11, 2026-10-13: cap, from an asker with one row's place to weigh that keeps the answer only within
       { h: collisions, s: cost } (mend: no collision more, not much dearer): a place already past either before
       its room is weighed, or whose room's list holds no clear place cheap enough (roomFor's lim), gets a
       stand-in answer the asker turns down as it would the true one (a collision more, its room none), and
       that one is not remembered. Within the cap the answer is the true one, remembered as ever. Mend weighed
       up to 80 of a venue's row's places in full, each with its room's whole list, to turn most of them down) */
    function bestFor(it, stat, rooms, man, cap) { var g = bestForSteps(it, stat, rooms, man, cap), r = g.next(); while (!r.done) r = g.next(); return r.value; }
    function* bestForSteps(it, stat, rooms, man, cap) {
      var best = null, av = S.avoid && S.avoid[it.P.name];
      /* (asked before, the others standing as they stand now (stat.key, from others) and the same places to keep off:
         the answer it had, a copy: what is done with a choice afterwards (nearer, the rooms after the rows) is done
         to the copy) */
      var mk = stat.key == null ? null : it.id + (TIE ? '!' : '') + '|' + (av ? av.map(function (a) { return a.B.x0 + ' ' + a.B.y0 + ' ' + a.B.x1 + ' ' + a.B.y1 + (a.room ? ' ' + a.room.x0 + ' ' + a.room.y0 + ' ' + a.room.x1 + ' ' + a.room.y1 : ''); }).join('/') : '') + '|' + stat.key, m0 = mk ? MEMO.get(mk) : null;
      if (m0) return { h: m0.h, s: m0.s, c: m0.c, rm: m0.rm, mf: m0.mf };
      for (var n = 0; n < it.cands.length; n++) {
        var c = it.cands[n], h = c.hard, s = c.s;
        if (best && h > best.h) break;
        if (best && h === best.h && s >= best.s) continue;
        /* clear of the rows placed (a cell of paper between), of the rooms (and not nearer one than its own venue
           is), and of him */
        var PB = pad(c.B, 1);
        stat.forEach(function (T) { if (hit(PB, T.b)) h++; });
        var tp = rooms.length ? tapsOf(it.P, c.pics) : null;
        rooms.forEach(function (T) {
          var need = roomNeed(T.dOwn) - 1e-9;
          if (hit(PB, T.b) || gapE(c.B, T.b) < need || (tp && tp.some(function (b) { return gapE(b, T.b) < need; }))) h++;
        });
        if (man && hit(c.B, man.B)) h++;
        /* (a place where its card found no room: it tries its others first, see retry) */
        if (av && av.some(function (a) { return hit(c.B, a.B); })) s += AVOID;
        if (best && (h > best.h || (h === best.h && s >= best.s))) continue;
        var mf = null;
        if (it.P === hp && !hp.ghost) { mf = manFor(stat.map(function (T) { return T.b; }).concat([c.B]), c.way, c.pics); h += mf.h; s += mf.s; }
        /* the leader's way: across another venue's row, or him, it could not be drawn */
        if (c.way && c.way.length) {
          var blk = stat.map(function (T) { return T.b; }).concat(mf ? [mf.m.B] : man ? [man.B] : []);
          if (blk.some(function (b) { return c.way.some(function (q) { return q[0] >= b.x0 - 1 && q[0] < b.x1 + 1 && q[1] >= b.y0 - 1 && q[1] < b.y1 + 1; }); })) s += 300;
        }
        if (best && (h > best.h || (h === best.h && s >= best.s))) continue;
        var lim = best && h === best.h ? best.s - s : null;
        if (!best && cap) {
          if (h > cap.h || s > cap.s + 1e-3) return { h: h + 1, s: s, c: c, rm: { h: 1, s: 0, b: null, dOwn: 0, lose: 1 }, mf: mf };
          if (h === cap.h) lim = cap.s - s + 1e-3;
        }
        var rm = roomsAfter ? { h: 0, s: 0, b: null, dOwn: 0 } : roomFor(it, c, stat, rooms, mf ? mf.m : man, lim);
        /* (the room's place weighs where its venue's card will go; the row's but a little: a row keeps to its stop,
           taking its other side or a step off only where that leaves the card its room) */
        h += rm.h; s += rm.s - (rm.cp || 0) + (rm.cp ? CARDC_ROW : 0);
        if (!best || h < best.h || (h === best.h && s < best.s)) best = { h: h, s: s, c: c, rm: rm, mf: mf };
        yield;
      }
      if (mk && best && !best.rm.lose) MEMO.set(mk, { h: best.h, s: best.s, c: best.c, rm: best.rm, mf: best.mf });
      return best;
    }
    /* (a venue with one row's place to weigh: c; with no room where rw is 0, its scene dropped) */
    function sub(it, c, rw) { return { P: it.P, id: 'c' + c.id + (rw === 0 ? 'n' : ''), cands: [c], rw: rw === 0 ? 0 : it.rw, rh: rw === 0 ? 0 : it.rh, cw: it.cw, ch: it.ch, cw2: it.cw2, ch2: it.ch2, cw0: it.cw0, ch0: it.ch0, cwf: it.cwf, chf: it.chf, cfm: it.cfm }; }
    function sums(pick) {
      var r = { total: 0, hard: 0, pick: pick, man: null };
      pick.forEach(function (pk) { r.total += pk.s; r.hard += pk.h; if (pk.mf) r.man = pk.mf.m; });
      return r;
    }
    function others(pick, it) {
      var stat = [], rooms = [], man = null, key = '';
      items.forEach(function (o) {
        if (o === it) return;
        var pk = pick.get(o);
        if (!pk) return;
        stat.push({ b: pk.c.B, P: o.P, taps: tapsOf(o.P, pk.c.pics), way: pk.c.way });
        if (pk.rm.b) rooms.push({ b: pk.rm.b, P: o.P, dOwn: pk.rm.dOwn });
        if (pk.mf) man = pk.mf.m;
        key += pk.c.id + (pk.rm.b ? '@' + pk.rm.b.x0 + ' ' + pk.rm.b.y0 : '') + (pk.mf ? 'm' + pk.mf.m.id : '') + ';';
      });
      stat.key = key;   /* (how the others stand, for bestForSteps to know a question by) */
      return { stat: stat, rooms: rooms, man: man };
    }
    /* the venues choose in turn, each clear of those before it */
    function* run(seq) {
      var pick = new Map();
      for (var qi = 0; qi < seq.length; qi++) {
        var it = seq[qi], o = others(pick, it);
        pick.set(it, yield* bestForSteps(it, o.stat, o.rooms, o.man));
        yield;
      }
      return sums(pick);
    }
    /* then each venue chooses again with all the others in place, while one of them can do better */
    function* polish(r) {
      var pick = new Map(r.pick);
      for (var pass = 0; pass < 3; pass++) {
        var moved = false;
        for (var qi = 0; qi < items.length; qi++) {
          var it = items[qi], o = others(pick, it);
          var nb = yield* bestForSteps(it, o.stat, o.rooms, o.man), cur = bestFor(sub(it, pick.get(it).c), o.stat, o.rooms, o.man);
          if (nb.c !== cur.c && (nb.h < cur.h || (nb.h === cur.h && nb.s < cur.s - 1e-9))) { pick.set(it, nb); moved = true; }
          else pick.set(it, cur);
          yield;
        }
        if (!moved) break;
      }
      return sums(pick);
    }
    /* (the card's own test, near enough to cardPlace's: within REACH of the venue's row, stop and room, clear of what
       never moves, of its row and room and the other rows, a cell of paper between, and clearly its own. fine (the
       cards' last look, seek): also at the widest with its crews' lines run on (flow), clear of every leader's cells
       (the rows standing off: their c.way, its own fine.way among them) and, for his own venue's cards where it has
       no scene, of his spot at home (fine.man), as a card is. The place found, or null) */

    /* (round 11, 2026-10-13: the same test for a fraction of the work. It was asked a thousand times at 1366 x 657,
       nine times in ten finding nothing after 8000 places looked at, a third of them left of the map and tested
       there against every one of the column's words. The test is a string of yes-or-no questions of each place in
       turn, the first place that passes them all taken; so those that do not depend on the other venues can be
       asked first, once, and their answer kept. Now:
       (1) cardOwn: the places that pass everything they owe to their own venue and the map alone (free of what
       never moves, within RM of the venue's stop, row or room and off them, off its own row's lines and its own
       leader, and far enough from every other venue's stop: no nearer another venue's whole than its stop, so a
       place that fails that by the stops fails it by the wholes), in the order the test meets them, kept with
       the map (K.co) by the venue, its row, its room and the sizes asked. Looked for only where a place can be
       within RM of one of the venue's parts, a row of places at a time; a place left of the map tested once per
       size (K.fl), all it is tested against being the map's own.
       (2) the others' part asked of those few, in that order: the other rows, their leaders, him, the nearest
       other, the card's own leader's way.
       (3) an answer kept (K.cr) under everything it came from: the venue, its row, its room, the fine test's
       extras and the other venues that can touch it. One that cannot is left out of the key, so its moving asks
       nothing again: a venue whose whole (its row with its stop, or its stop alone) lies CR_FAR cells or more
       from every place the card may take (the box rg) can neither lie within a cell of a place, nor on its lines
       within ROWGAP2 px, nor be the nearest other where that decides (a place is at most RM cells from its own
       venue; CR_FAR is more than RM / 0.6 and than APART px), nor have a cell of its leader, which runs inside
       its whole, under a place or under the card's leader, which runs inside rg) */
    function cardOwn(it, B, room, fine, parts, U, RM) {
      var P = it.P, XL = pg.L.xl || 0, np = parts.length, out = [], lo = [0, 0, 0], hi = [0, 0, 0], sqs = [], n, ow = fine && fine.way && fine.way.length ? fine.way : null;
      for (n = 0; n < S.PL.length; n++) if (S.PL[n] !== P) sqs.push(SQB[n]);
      /* (a place reaching left of the map, over the column's blank paper, as cardPlace allows: its part on the map
         clear as any, the rest clear of the column's words and their guard) */
      /* (round 11: on the numbers: sum's own clamps and corners, hit's own comparisons) */
      var gd = pg.L.guard || [];
      function freeLeft(w, h, xx, yy) {
        var x1 = xx + w, y1 = yy + h, k, T;
        if (x1 > 1) {
          var ax = clamp(Math.max(0, xx) - 1, 0, C), bx = clamp(x1 + 1, 0, C), ay = clamp(yy - 1, 0, Rw), by = clamp(y1 + 1, 0, Rw);
          if (bx > ax && by > ay && IF[by * W1 + bx] - IF[ay * W1 + bx] - IF[by * W1 + ax] + IF[ay * W1 + ax] > 0) return false;
        }
        for (k = 0; k < fixed.length; k++) { T = fixed[k]; if (xx < T.x1 && x1 > T.x0 && yy < T.y1 && y1 > T.y0) return false; }
        for (k = 0; k < gd.length; k++) { T = gd[k]; if (xx < T.x1 && x1 > T.x0 && yy < T.y1 && y1 > T.y0) return false; }
        return true;
      }
      [[it.cw0, it.ch0], [it.cw, it.ch], [it.cw2, it.ch2]].concat(fine ? [[it.cwf, it.chf]] : []).forEach(function (z) {
        var w = z[0], h = z[1];
        if (!w || !h) return;
        var M = freeMap(w, h, true), NF = M.NF, yy, xx, FL = null, fk = w + 'x' + h, fv, k, j, pt, dx, dy, d, m, a, e, from, t0, nx, onB, onR;
        var ya = Math.max(1, U.y0 - h - RM), yb = Math.min(Rw - 1 - h, U.y1 + RM), xa = Math.max(1 - XL, U.x0 - w - RM), xb = Math.min(C - 1 - w, U.x1 + RM);
        if (xa < 1) { FL = K.fl.get(fk); if (!FL) { FL = new Uint8Array(XL * Rw); K.fl.set(fk, FL); } }
        for (yy = ya; yy <= yb; yy += 2) {
          if (!M.ok[yy]) freeRow(M, yy);
          /* (the row's places that can be within RM of a part: each part's stretch, in order from the left) */
          m = 0;
          for (k = 0; k < np; k++) {
            pt = parts[k];
            if (Math.max(0, yy - pt.y1, pt.y0 - yy - h) > RM) continue;
            a = pt.x0 - w - RM; e = pt.x1 + RM;
            for (j = m; j > 0 && lo[j - 1] > a; j--) { lo[j] = lo[j - 1]; hi[j] = hi[j - 1]; }
            lo[j] = a; hi[j] = e; m++;
          }
          from = xa;
          /* (a place on its own row or room, or within a cell of them, is none: on the rows of places that reach
             them, those are stepped over at once, to the first place past the row's or the room's right end) */
          onB = yy - 1 < B.y1 && yy + h + 1 > B.y0; onR = !!room && yy - 1 < room.y1 && yy + h + 1 > room.y0;
          for (j = 0; j < m; j++) {
            a = Math.max(from, lo[j]); e = Math.min(xb, hi[j]);
            if ((a - xa) % 2) a++;
            for (xx = a; xx <= e; xx += 2) {
              if (onB && xx - 1 < B.x1 && xx + w + 1 > B.x0) { xx = B.x1 - 1 + ((B.x1 + 1 - xa) & 1); continue; }
              if (onR && xx - 1 < room.x1 && xx + w + 1 > room.x0) { xx = room.x1 - 1 + ((room.x1 + 1 - xa) & 1); continue; }
              if (xx >= 1) {
                nx = NF[yy * C + xx];
                if (nx !== xx) { if (nx > e) break; xx = nx - 2 + ((nx - xa) & 1); continue; }
              }
              else {
                fv = FL[yy * XL + xx + XL - 1];
                if (!fv) fv = FL[yy * XL + xx + XL - 1] = freeLeft(w, h, xx, yy) ? 1 : 2;
                if (fv !== 1) continue;
              }
              var dO = Infinity;
              for (k = 0; k < np; k++) { pt = parts[k]; dx = Math.max(0, xx - pt.x1, pt.x0 - xx - w); dy = Math.max(0, yy - pt.y1, pt.y0 - yy - h); d = Math.sqrt(dx * dx + dy * dy); if (d < dO) dO = d; }
              if (dO > RM) continue;
              /* (hit's, lineBeside's and gapE's own questions, and whether a cell of its own leader's way lies under it, on the numbers) */
              if (xx - 1 < B.x1 && xx + w + 1 > B.x0 && yy - 1 < B.y1 && yy + h + 1 > B.y0) continue;
              if (room && xx - 1 < room.x1 && xx + w + 1 > room.x0 && yy - 1 < room.y1 && yy + h + 1 > room.y0) continue;
              if (Math.min(yy + h, B.y1) - Math.max(yy, B.y0) > 0 && Math.max(0, xx - B.x1, B.x0 - xx - w) * pg.L.cs < ROWGAP) continue;
              if (ow) { for (k = 0; k < ow.length; k++) if (ow[k][0] >= xx - 1 && ow[k][0] < xx + w + 1 && ow[k][1] >= yy - 1 && ow[k][1] < yy + h + 1) break; if (k < ow.length) continue; }
              t0 = Infinity;
              for (k = 0; k < sqs.length; k++) { pt = sqs[k]; dx = Math.max(0, xx - pt.x1, pt.x0 - xx - w); dy = Math.max(0, yy - pt.y1, pt.y0 - yy - h); d = Math.sqrt(dx * dx + dy * dy); if (d < t0) t0 = d; }
              if (!(dO <= 0.6 * t0 && t0 * cs >= APART)) continue;
              out.push(xx, yy, w, h, dO);
            }
            if (e + 1 > from) from = e + 1;
          }
        }
      });
      return out;
    }
    function cardRoom(it, B, room, stat, fine) {
      var P = it.P, sq = sqBox(P), parts = [sq, B].concat(room ? [room] : []), U = parts.reduce(unite), RM = Math.max(4, Math.floor(REACH / cs + 1e-6));
      var ok = S.PL.indexOf(P) + '|' + B.x0 + ' ' + B.y0 + ' ' + B.x1 + ' ' + B.y1 + '|' + (room ? room.x0 + ' ' + room.y0 + ' ' + room.x1 + ' ' + room.y1 : '-') + '|' + (fine ? 'f' : 'n');
      var oth = [], ck = ok + (fine && fine.man ? fine.man.x0 + ' ' + fine.man.y0 + ' ' + fine.man.x1 + ' ' + fine.man.y1 : '') + '|';
      var wm = Math.max(it.cw0 || 0, it.cw || 0, it.cw2 || 0, fine ? it.cwf || 0 : 0), hm = Math.max(it.ch0 || 0, it.ch || 0, it.ch2 || 0, fine ? it.chf || 0 : 0);
      var rg = { x0: U.x0 - wm - RM, y0: U.y0 - hm - RM, x1: U.x1 + RM + wm, y1: U.y1 + RM + hm }, CR_FAR = Math.max(RM / 0.6, APART / cs, ROWGAP2 / cs) + 2;
      for (var qi = 0; qi < S.PL.length; qi++) {
        var Q = S.PL[qi], t = null;
        if (Q === P) continue;
        for (var si = 0; si < stat.length; si++) if (stat[si].P === Q) { t = stat[si]; break; }
        var whole = t ? unite(t.b, sqBox(Q)) : sqBox(Q);
        oth.push(whole);
        if (gapE(whole, rg) < CR_FAR) ck += qi + (t ? ':' + t.b.x0 + ' ' + t.b.y0 + ' ' + t.b.x1 + ' ' + t.b.y1 : '') + ';';
      }
      if (K.cr.has(ck)) return K.cr.get(ck);
      var own = K.co.get(ok);
      if (!own) { own = cardOwn(it, B, room, fine, parts, U, RM); K.co.set(ok, own); }
      var found = null, ns = stat.length, no = oth.length, fm = fine && fine.man ? fine.man : null;
      (function () {
        var k, j, tb, wy, q, dx, dy, d, x0, y0, x1, y1;
        for (var oi = 0; oi < own.length; oi += 5) {
          /* (the same questions as hit, lineBeside and gapE ask, and whether a leader's way lies under it, on the numbers; a box made for a place
             that passes them) */
          x0 = own[oi]; y0 = own[oi + 1]; x1 = x0 + own[oi + 2]; y1 = y0 + own[oi + 3];
          var dO = own[oi + 4], clear = true;
          if (fm && x0 - 1 < fm.x1 && x1 + 1 > fm.x0 && y0 - 1 < fm.y1 && y1 + 1 > fm.y0) continue;
          for (k = 0; clear && k < ns; k++) {
            tb = stat[k].b;
            if (x0 - 1 < tb.x1 && x1 + 1 > tb.x0 && y0 - 1 < tb.y1 && y1 + 1 > tb.y0) clear = false;
            else if (Math.min(y1, tb.y1) - Math.max(y0, tb.y0) > 0 && Math.max(0, x0 - tb.x1, tb.x0 - x1) * pg.L.cs < ROWGAP2) clear = false;
            else if (fine && (wy = stat[k].way)) for (j = 0; j < wy.length; j++) { q = wy[j]; if (q[0] >= x0 - 1 && q[0] < x1 + 1 && q[1] >= y0 - 1 && q[1] < y1 + 1) { clear = false; break; } }
          }
          if (!clear) continue;
          var dT = Infinity;
          for (k = 0; k < no; k++) { tb = oth[k]; dx = Math.max(0, x0 - tb.x1, tb.x0 - x1); dy = Math.max(0, y0 - tb.y1, tb.y0 - y1); d = Math.sqrt(dx * dx + dy * dy); if (d < dT) dT = d; }
          if (!(dO <= 0.6 * dT && dT * cs >= APART)) continue;
          var b = { x0: x0, y0: y0, x1: x1, y1: y1 };
          /* (standing off, its leader's way clear of every road, stop, flag and row, as cardLead asks) */
          if (dO > 5) {
            var wayOk = parts.slice(1).filter(function (pt, i) { return i || !room || Math.min(b.y1, pt.y1) - Math.max(b.y0, pt.y0) <= 0; }).some(function (pt) {
              var ax = clamp((b.x0 + b.x1) / 2, pt.x0, pt.x1 - 1), ay = clamp((b.y0 + b.y1) / 2, pt.y0, pt.y1 - 1), bx = clamp(ax, b.x0, b.x1 - 1), by = clamp(ay, b.y0, b.y1 - 1), ln = [];
              ax = clamp(bx, pt.x0, pt.x1 - 1); ay = clamp(by, pt.y0, pt.y1 - 1);
              bres(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), ln);
              return ln.every(function (q) {
                if ((q[0] >= pt.x0 - 1 && q[0] < pt.x1 + 1 && q[1] >= pt.y0 - 1 && q[1] < pt.y1 + 1) || (q[0] >= b.x0 - 1 && q[0] < b.x1 + 1 && q[1] >= b.y0 - 1 && q[1] < b.y1 + 1)) return true;
                if (q[0] < 0 || q[1] < 0 || q[0] >= C || q[1] >= Rw || (occ[q[1] * C + q[0]] & (ROAD | STOP | FLAG))) return false;
                for (var s2 = 0; s2 < stat.length; s2++) { var T2 = stat[s2].b; if (q[0] >= T2.x0 && q[0] < T2.x1 && q[1] >= T2.y0 && q[1] < T2.y1) return false; }
                for (s2 = 0; s2 < S.PL.length; s2++) { var F2 = S.PL[s2].fbox; if (F2 && q[0] >= F2.x0 - 1 && q[0] < F2.x1 + 1 && q[1] >= F2.y0 - 1 && q[1] < F2.y1 + 1) return false; }
                return true;
              });
            });
            if (!wayOk) continue;
          }
          found = b;
          return;
        }
      })();
      K.cr.set(ck, found);
      return found;
    }
    function crowd(P) { return S.PL.filter(function (Q) { return Q !== P && Math.abs(Q.cx - P.cx) < 70 && Math.abs(Q.cy - P.cy) < 40; }).length; }
    var first = items.slice().sort(function (a, b) { return crowd(b.P) - crowd(a.P) || b.P.slots.length - a.P.slots.length; });
    var seed = 7, best = null;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    /* (the speed round, 2026-10-16: the search's choice for this map, written down as it was made (kept.js), is taken
       back where the same map is laid out again: the same key (solveKey, with the places to keep off), each venue's
       row's place by its place in its list, its room, his spot, the order the choice was made in, and the dice
       where the search left them (the rooms after the rows throw them again), so what follows is what it was. A key
       not kept, or a list grown otherwise: searched, as ever) */
    var CK = KEY + '|' + avoidKey(), kept = choiceGet(CK);
    if (kept) { try { best = choiceBack(kept); } catch (e) { best = null; } }
    if (!best) {
      best = yield* polish(yield* run(first));
      for (var tries = 0; tries < 24; tries++) {
        if ((!best.hard && tries > 5) || tries > 18) break;
        var seq = items.slice();
        for (var m = seq.length - 1; m > 0; m--) { var j = Math.floor(rnd() * (m + 1)), tt = seq[m]; seq[m] = seq[j]; seq[j] = tt; }
        var r = yield* polish(yield* run(seq));
        if (r.hard < best.hard || (r.hard === best.hard && r.total < best.total)) best = r;
      }
      choiceSet(CK, choiceOf(best));
    }
    /* (what the places to keep off are, for the key: retry's, by venue) */
    function avoidKey() {
      var av = S.avoid;
      if (!av) return '';
      return Object.keys(av).sort().map(function (n) { return n + ':' + (av[n] || []).map(function (a) { var B = a.B, q = a.room; return B.x0 + ' ' + B.y0 + ' ' + B.x1 + ' ' + B.y1 + (q ? ' ' + q.x0 + ' ' + q.y0 + ' ' + q.x1 + ' ' + q.y1 : ''); }).join('/'); }).join(';');
    }
    /* (the choice as numbers: each venue in the order it stands in the choice, its row's place's index in its list,
       its room, his spot's id) */
    function choiceOf(b) {
      var order = [], picks = [];
      b.pick.forEach(function (pk, it) {
        order.push(items.indexOf(it));
        picks.push({ c: it.cands.indexOf(pk.c), h: pk.h, s: pk.s, rm: pk.rm, mf: pk.mf ? { h: pk.mf.h, s: pk.mf.s, id: pk.mf.m.id } : null });
      });
      return { seed: seed, nc: items.map(function (it) { return it.cands.length; }), order: order, picks: picks };
    }
    /* (a choice that does not fit the map as it stands, or is not one choiceOf wrote: null, and the map is searched;
       a throw is too, where it is read, the seed it would set untouched) */
    function choiceBack(g) {
      if (!g || !Array.isArray(g.nc) || g.nc.length !== items.length || g.nc.some(function (n, i) { return items[i].cands.length !== n; })) return null;
      if (!Array.isArray(g.order) || !Array.isArray(g.picks) || g.order.length !== items.length || g.picks.length !== items.length || typeof g.seed !== 'number' || !isFinite(g.seed)) return null;
      var pick = new Map();
      for (var q = 0; q < g.order.length; q++) {
        var it = items[g.order[q]], p = g.picks[q], c = it && p ? it.cands[p.c] : null, mf = null;
        if (!c) return null;
        if (p.mf) {
          var mm = MANS.filter(function (x) { return x.id === p.mf.id; })[0];
          if (!mm) return null;
          mf = { h: p.mf.h, s: p.mf.s, m: mm };
        }
        pick.set(it, { h: p.h, s: p.s, c: c, rm: p.rm, mf: mf });
      }
      if (pick.size !== items.length) return null;
      seed = g.seed;
      return sums(pick);
    }
    /* a venue whose largest card (at any of three widths) would find no place by it, the others as they are: its
       row and room take the cheapest of its other places that leaves it one, costs no collision more and not much
       more else (REPAIR: a row keeps near its stop) */
    function one(it, c, o, cap) { return bestFor(sub(it, c), o.stat, o.rooms, o.man, cap); }
    function fitsNow(it, pick) { var pk = pick.get(it), o = others(pick, it); return !it.rw || !it.cw || !pk || !pk.rm.b || cardRoom(it, pk.c.B, pk.rm.b, o.stat); }
    function fails(pick) { return items.filter(function (x) { return !fitsNow(x, pick); }).length; }
    /* (the third round, 2026-10-12: a row that stands off from its stop is tied to it by its leader, or it is a
       fault: the second review found boston's row 30px over its stop, tied to nothing, in windows 630, 640 and
       690px tall, moved there for its card's sake. The venues a choice would leave so, by apply's own test, which
       draws a leader or none: its cells (leadPath) inside the map, three or more, the last by the row; none on a
       road, a stop or a flag's place, on the key or the column's words, on a row, a room or him, nor on a leader
       drawn before it; and a dot of it off the coast. The steps below that move a row or a room for a card's sake
       (mend, the last look, nearer) keep no choice that leaves more rows so, and one left so is tied first: tie) */
    function cutOf(pick) {
      var out = [], led = {}, bx = fixed.slice(), m0 = ghost || sums(pick).man;
      if (m0) bx.push(m0.B);
      items.forEach(function (o) { var pk = pick.get(o); if (!pk) return; bx.push(pk.c.B); if (pk.rm && pk.rm.b) bx.push(pk.rm.b); });
      items.forEach(function (o) {
        var pk = pick.get(o), B = pk ? pk.c.B : null;
        if (!B) return;
        /* (the fourth round: the way to its nearest point, or the first of its other ways that is clear: leadFor) */
        var path = leadFor(o.P.sq, B, function (path) {
          var e = path[path.length - 1], ok = path.length >= 3 && Math.max(B.x0 - e[0] - 1, e[0] - B.x1, B.y0 - e[1] - 1, e[1] - B.y1) <= 1.75, dots = 0;
          for (var j = 0; ok && j < path.length; j++) {
            var q = path[j], qi = q[1] * C + q[0];
            if (q[0] < 0 || q[1] < 0 || q[0] >= C || q[1] >= Rw || (occ[qi] & (ROAD | STOP | FLAG)) || led[qi]) ok = false;
            for (var k = 0; ok && k < bx.length; k++) if (q[0] >= bx[k].x0 && q[0] < bx[k].x1 && q[1] >= bx[k].y0 && q[1] < bx[k].y1) ok = false;
            if (ok && (path.length - 1 - j) % 2 === 0 && !(occ[qi] & COAST)) dots++;
          }
          return ok && dots > 0;
        });
        if (path) path.forEach(function (q) { led[q[1] * C + q[0]] = 1; }); else if (path === false) out.push(o);
      });
      return out;
    }
    /* (counted a venue a step: fails' own count, which was one step of 5 to 7ms) */
    var nFail = 0;
    for (var fa = 0; !roomsAfter && fa < items.length; fa++) { if (!fitsNow(items[fa], best.pick)) nFail++; yield; }
    var mend = function* (it) {
      if (fitsNow(it, best.pick)) return;
      var pk = best.pick.get(it), o = others(best.pick, it), n, done = false;
      for (n = 0; n < it.cands.length && n < 80 && !done; n++) {
        if (n) yield;
        var c = it.cands[n];
        if (c.hard > pk.h) break;
        /* (the third round: a place that costs more than it may before its room is weighed is not weighed: a place
           costs at least its own cost (c.s; all that is added to it is 0 or more), so the test below would turn it
           down in any case. The same below, for a neighbour's) */
        if (c.s > pk.s + REPAIR) continue;
        var alt = one(it, c, o, { h: pk.h, s: pk.s + REPAIR });
        if (!alt || alt.h > pk.h || alt.s > pk.s + REPAIR || !alt.rm.b || !cardRoom(it, c.B, alt.rm.b, o.stat)) continue;
        var t1 = new Map(best.pick);
        t1.set(it, alt);
        var f1 = fails(t1);
        if (f1 < nFail && cutOf(t1).length <= cutOf(best.pick).length) { best = sums(t1); nFail = f1; done = true; }
      }
      /* (else a neighbour's row and room step aside for it: a venue whose row lies within reach of its card, taking
         the cheapest of its own places that leaves both cards theirs, costs no collision more and leaves fewer
         cards without a place) */
      if (done) return;
      var U = unite(pk.c.B, sqBox(it.P)), RM = Math.max(4, Math.floor(REACH / cs + 1e-6)) + Math.max(it.cw, it.ch);
      for (var bi = 0; bi < items.length; bi++) {
        var nb = items[bi];
        if (done || nb === it) continue;
        var pn = best.pick.get(nb);
        if (!pn || gapE(pn.c.B, U) > RM) continue;
        var on = others(best.pick, nb);
        for (var m = 0; m < nb.cands.length && m < 40 && !done; m++) {
          if (m) yield;
          var c2 = nb.cands[m];
          if (c2 === pn.c || c2.hard > pn.h || c2.s > pn.s + REPAIR) continue;
          var alt2 = one(nb, c2, on, { h: pn.h, s: pn.s + REPAIR });
          if (!alt2 || alt2.h > pn.h || alt2.s > pn.s + REPAIR || (pn.rm.b && !alt2.rm.b)) continue;
          var trial = new Map(best.pick);
          trial.set(nb, alt2);
          if (!fitsNow(it, trial) || !fitsNow(nb, trial)) continue;
          /* (and its own row's place still clear of the others) */
          var oi = others(trial, it), chk = one(it, pk.c, oi, { h: pk.h, s: pk.s + REPAIR });
          if (!chk || chk.h > pk.h || chk.s > pk.s + REPAIR) continue;
          trial.set(it, chk);
          var f2 = fails(trial);
          if (f2 >= nFail || cutOf(trial).length > cutOf(best.pick).length) continue;
          best = sums(trial); nFail = f2; done = true;
        }
      }
    };
    if (nFail) for (var mi = 0; mi < items.length; mi++) { yield* mend(items[mi]); yield; }
    /* the cards' last look (round 5's third look: on a desktop 640 to 690px tall, and 600 to 620, more cards took the
       column than before the scenes were kept near their venues), on a screen where some cards found no place by
       their venues (full: S.seekOn), on the form the placing chose (R.seek). For each venue whose cards the fine test
       finds no place for: its rows in turn, cheapest first, the venues its row would collide with choosing again
       round it, and at each its scene's other spots within the nearness limit (roomSpots: free and clear, roomHard),
       the first that leaves its cards a place (cardRoom, fine); failing that, a neighbour's rows the same way, its
       scene kept; then its own rows with no scene, its scene dropped on this screen (its picture still inks); last a
       neighbour's rows with no scene. Kept where no collision is added and fewer cards are left without a place
       (each venue's that the test finds none for); SEEK_ROWS, SEEK_NB and the card tests' budgets bound it, SEEK_WORK
       guards it, and full() keeps it only where the cards' own placing leaves fewer in the column */
    function fitsAll(it, pick) { var pk = pick.get(it), o = others(pick, it); return !it.cw || !pk || cardRoom(it, pk.c.B, pk.rm.b || null, o.stat, fineOf(it, pk.c, pk.rm.b, pk.mf)); }
    /* (the fine test's extras: its row's leader, and his spot where his own venue's card has no scene) */
    function fineOf(it, c, room, mf) { return { way: c.way, man: it.P === hp && !room && mf ? mf.m.B : null }; }
    /* (the cards left without a place: each venue's that its test finds none for, its cards on the map counted) */
    /* (a venue a step) */
    function* failsAll(pick) {
      var n = 0;
      for (var xi = 0; xi < items.length; xi++) {
        var x = items[xi];
        if (!fitsAll(x, pick)) n += pg.selsOf(x.P).filter(function (o) { return !S.colKeys[o.key]; }).length;
        yield;
      }
      return n;
    }
    /* (a venue's row at c, the venues it would collide with (their row or room, or a room that would lie nearer it than
       their own) choosing again round it; then, pass 0, its scene's spots, the first free and clear one that leaves
       its cards a place; pass 1, no scene. The trial, or null) */
    function* tryAt(pick, v, c, pass, cap, budget, memo) {
      var pv = pick.get(v), P = v.P, m = memo && memo.get(c);
      if (!m) {
        var t0 = new Map(pick), Z = pad(c.B, 1), o0 = others(t0, v);
        t0.set(v, bestFor(sub(v, c, 0), o0.stat, o0.rooms, o0.man));
        for (var qi = 0; qi < items.length; qi++) {
          var q = items[qi];
          if (q === v) continue;
          var pq = t0.get(q);
          if (!hit(Z, pq.c.B) && !(pq.rm.b && (hit(Z, pq.rm.b) || gapE(c.B, pq.rm.b) < roomNeed(pq.rm.dOwn) - 1e-9))) continue;
          var oq = others(t0, q);
          t0.set(q, bestFor(q, oq.stat, oq.rooms, oq.man));
          yield;
        }
        o0 = others(t0, v);
        var b0 = bestFor(sub(v, c, 0), o0.stat, o0.rooms, o0.man), ok0 = !!b0 && b0.h <= pv.h;
        /* (its cards' place with no scene: at pass 0 the spots clear of it are tried first, the first of them (free and
           clear) leaving its cards that place, as near or nearer its scene, with no test more) */
        m = { t: t0, o: o0, base: b0, ok: ok0, cb: ok0 && v.cw ? cardRoom(v, c.B, null, o0.stat, fineOf(v, c, null, b0.mf)) : null };
        if (memo) memo.set(c, m);
        yield;
      }
      if (!m.ok) return null;
      var o = m.o, base = m.base, cb = m.cb, rm = null, t = new Map(m.t);
      if (pass === 0) {
        var sp = roomSpots(c, P, v.rw, v.rh), tests = 0;
        /* (the free places only: the first nf of the list) */
        for (var round = cb ? 0 : 1; round < 2 && !rm; round++) for (var k = 0; k < sp.nf && tests < cap && budget.n > 0 && !rm; k++) {
          var r = { x0: sp.X[k], y0: sp.Y[k], x1: sp.X[k] + v.rw, y1: sp.Y[k] + v.rh };
          if (cb && (round === 0) === hit(pad(r, 1), cb)) continue;
          if (roomHard(P, sp, k, v.rw, v.rh, c, o.stat, o.rooms, base.mf ? base.mf.m : o.man, 0)) continue;
          if (round === 0 || !v.cw) { rm = { h: 0, s: sp.C[k], b: r, dOwn: sp.D[k], cp: 0 }; break; }
          tests++; budget.n--;
          if (cardRoom(v, c.B, r, o.stat, fineOf(v, c, r, base.mf))) rm = { h: 0, s: sp.C[k], b: r, dOwn: sp.D[k], cp: 0 };
          yield;
        }
        if (!rm) return null;
      } else if (v.cw && !cb) return null;
      t.set(v, { h: base.h, s: base.s + (rm ? rm.s : 0), c: c, rm: rm || { h: 0, s: 0, b: null, dOwn: 0 }, mf: base.mf, seek: true });
      return t;
    }
    /* (the third round: in steps, a row a step: it was one step of 0.1 to 0.55s on the screens 640 to 690px tall,
       the only long task left in a making; and within a row its own parts (the venues choosing again round it, each
       card test, the cards left counted a venue at a time: tryAt, failsAll), a row being 10 to 17ms. The same rows
       in the same order. R0.seek runs them in one go) */
    /* (round 11, 2026-10-13: its guard is counted in work, the rows looked at (SEEK_WORK of them at most, all
       venues together), not in the machine's time. It was SEEK_MS, three seconds of the time it worked: a
       machine busy with other work, or a slow one, ran out of them where an idle one did not, and laid the
       same window out with fewer cards by their venues (9 of 6432 pages of a sweep run with many at once).
       The layout is now the window's, the screen's scale's, the data's and the date's alone. The most rows a
       window of the sweeps looks at is 474 (125%, 580 to 584px tall), under an eighth of the guard) */
    function* seekSteps() {
      var ck = { n: 0 }, moved = false, memo = new Map();
      var nAll = roomsAfter || pg.L.phone ? 0 : yield* failsAll(best.pick);
      /* (v's rows in turn at a pass, for the cards of the venue it (v itself, or v a neighbour of it): kept where those
         then find a place, no collision is added and fewer cards are left without one) */
      function* look(v, N, it, pass, tests) {
        var pv = best.pick.get(v), budget = { n: tests };
        if (pass === 0 && !v.rw) return false;
        for (var n = 0; n < v.cands.length && n < N && ck.n < SEEK_WORK; n++) {
          if (n) yield 3;   /* (1 to 5ms, as below) */
          ck.n++;
          var c = v.cands[n];
          if (c.hard > pv.h) break;
          if (v !== it && c === pv.c && pass === 0) continue;
          var t = yield* tryAt(best.pick, v, c, pass, SEEK_SPOTS, budget, memo);
          if (!t || (v !== it && !fitsAll(it, t))) continue;
          var r2 = sums(t), f3 = yield* failsAll(t);
          if (r2.hard > best.hard || f3 >= nAll || cutOf(t).length > cutOf(best.pick).length) continue;
          best = r2; nAll = f3; moved = true; memo = new Map();
          return true;
        }
        return false;
      }
      if (nAll) for (var si = 0; si < items.length; si++) {
        var it = items[si], ni, got = false;
        yield 3;
        if (fitsAll(it, best.pick)) continue;
        if (yield* look(it, SEEK_ROWS, it, 0, SEEK_TESTS)) continue;
        /* (failing that, a neighbour's row steps aside, its scene kept: a venue whose row, stop or room lies within reach
           of its cards; then its own rows with no scene; and last a neighbour's row with no scene) */
        var pk = best.pick.get(it), U = unite(unite(pk.c.B, sqBox(it.P)), pk.rm.b || pk.c.B), RM = Math.max(4, Math.floor(REACH / cs + 1e-6)) + Math.max(it.cw, it.ch, it.cwf || 0);
        /* (a neighbour whose row, were it anywhere else, would still leave its cards no place is not looked at) */
        var o = others(best.pick, it), fn = fineOf(it, pk.c, pk.rm.b, pk.mf);
        var near = items.filter(function (nb) {
          if (nb === it) return false;
          var pn = best.pick.get(nb);
          return gapE(unite(unite(pn.c.B, sqBox(nb.P)), pn.rm.b || pn.c.B), U) <= RM && !!cardRoom(it, pk.c.B, pk.rm.b || null, o.stat.filter(function (T) { return T.P !== nb.P; }), fn);
        });
        for (ni = 0; ni < near.length && !got; ni++) got = yield* look(near[ni], SEEK_NB, it, 0, SEEK_TESTS / 3);
        if (got) continue;
        if (yield* look(it, SEEK_ROWS, it, 1, 0)) continue;
        for (ni = 0; ni < near.length; ni++) if (yield* look(near[ni], SEEK_NB, it, 1, 0)) break;
      }
      return moved;
    }
    /* (a row still cut off from its stop, see cutOf, is tied: its place as it is where he alone stands on its way
       and can step off it; else the cheapest of its venue's places that leaves a row fewer cut off, beside its
       stop or tied, and adds no collision. Its card may lose its place by it and take the column, as any card
       that finds none: a row tied comes before a card by its venue) */
    /* (the fourth round, 2026-10-13: where he cannot step off its way and it is another venue's scene that lies on
       it, that scene steps aside before the row is moved: the cheapest of its own places, roomSpots, that is free
       and clear, keeps its card a place where it had one, and leaves a row fewer cut off; ASIDE of them looked at.
       At 606px tall rockland lake's leader was cut by a corner of new york's scene, and its row, moved to be tied,
       cost hartford's card its place by its venue. The trial, or null) */
    var ASIDE = 12;
    function* asideSteps(itc, nCut) {
      var pkc = best.pick.get(itc), U = pad(unite(pkc.c.B, sqBox(itc.P)), 1);
      for (var vi = 0; vi < items.length; vi++) {
        var v = items[vi], pv = best.pick.get(v);
        if (v === itc || !pv || !pv.rm || !pv.rm.b || !v.rw || !v.rh || !hit(U, pv.rm.b)) continue;
        var o = others(best.pick, v), sp = roomSpots(pv.c, v.P, v.rw, v.rh), wy = pv.seek ? fineOf(v, pv.c, pv.rm.b, pv.mf) : null;
        var had = !v.cw || !!cardRoom(v, pv.c.B, pv.rm.b, o.stat, wy), man = o.man || (v.P !== hp ? best.man : null);
        for (var k = 0, tries = 0; k < sp.nf && tries < ASIDE; k++) {
          if (sp.X[k] === pv.rm.b.x0 && sp.Y[k] === pv.rm.b.y0) continue;
          var r = { x0: sp.X[k], y0: sp.Y[k], x1: sp.X[k] + v.rw, y1: sp.Y[k] + v.rh };
          if (roomHard(v.P, sp, k, v.rw, v.rh, pv.c, o.stat, o.rooms, man, 0)) continue;
          var ta = new Map(best.pick);
          ta.set(v, { h: pv.h, s: pv.s, c: pv.c, rm: { h: pv.rm.h, s: pv.rm.s, b: r, dOwn: sp.D[k], cp: pv.rm.cp }, mf: pv.mf, seek: pv.seek });
          if (cutOf(ta).length >= nCut) continue;
          tries++;
          if (had && v.cw && !cardRoom(v, pv.c.B, r, o.stat, wy)) { yield; continue; }
          return ta;
        }
        yield;
      }
      return null;
    }
    var cut = cutOf(best.pick);
    try {
      for (var ci = 0; ci < cut.length; ci++) {
        var itc = cut[ci], now0 = cutOf(best.pick), pkc = best.pick.get(itc), oc = others(best.pick, itc), top2 = null;
        if (now0.indexOf(itc) < 0) continue;   /* (tied since, as another moved) */
        TIE = true;
        for (var cn = -1; cn < itc.cands.length && !(cn === 0 && top2); cn++) {
          /* (its own place as it is did not do: a scene on its way steps aside, asideSteps, before its row moves) */
          if (cn === 0) { var tas = yield* asideSteps(itc, now0.length); if (tas) { top2 = { alt: null, t: tas }; break; } }
          var cc = cn < 0 ? pkc.c : itc.cands[cn];
          if (cn >= 0 && cc.hard > pkc.h) break;
          if (cn >= 0 && cc === pkc.c) continue;
          var altc = one(itc, cc, oc), tc = null;
          if (altc && altc.h <= pkc.h && (!top2 || altc.s < top2.alt.s)) { tc = new Map(best.pick); tc.set(itc, altc); if (cutOf(tc).length < now0.length) top2 = { alt: altc, t: tc }; }
          yield;
        }
        TIE = false;
        if (top2) best = sums(top2.t);
      }
    } finally { TIE = false; }
    /* (rooms after the rows, where the map is too small for both at once: a phone's. Each venue in turn takes the
       best room clear of every row, room and him; one that finds none has no scene, its picture still inks) */
    /* (in several orders, the most crowded first and then others, the one that leaves the most venues their scenes
       kept, then the cheapest: a small phone's map, round 5's second look, its rooms now kept near their venues) */
    if (roomsAfter) {
      var stat0 = [];
      items.forEach(function (it) { var c0 = best.pick.get(it).c; stat0.push({ b: c0.B, P: it.P, taps: tapsOf(it.P, c0.pics) }); });
      var ord0 = items.slice().sort(function (a, b) { return crowd(b.P) - crowd(a.P); }), seqs = [ord0, ord0.slice().reverse()], top = null;
      for (var q3 = 0; q3 < 6; q3++) { var sq3 = ord0.slice(); for (var m3 = sq3.length - 1; m3 > 0; m3--) { var j3 = Math.floor(rnd() * (m3 + 1)), t3 = sq3[m3]; sq3[m3] = sq3[j3]; sq3[j3] = t3; } seqs.push(sq3); }
      seqs.forEach(function (sq4) {
        var rooms0 = [], got0 = new Map(), n0 = 0, s0 = 0;
        sq4.forEach(function (it) {
          var got = roomFor(it, best.pick.get(it).c, stat0, rooms0, best.man), rm = got.b && !got.h ? got : { h: 0, s: 0, b: null, dOwn: 0 };
          got0.set(it, rm);
          if (rm.b) { rooms0.push({ b: rm.b, P: it.P, dOwn: rm.dOwn }); n0++; s0 += rm.s; }
        });
        if (!top || n0 > top.n || (n0 === top.n && s0 < top.s)) top = { n: n0, s: s0, got: got0 };
      });
      items.forEach(function (it) { best.pick.get(it).rm = top.got.get(it); });
    }
    /* then each room once more, every row and room in place: the cheapest of its places (roomSpots) that is free and
       clear (roomHard) and that leaves its card a place wherever it had one (cardRoom); the rows stay as they are,
       beside their stops */
    function nearer() {
      items.forEach(function (it) {
        var pk = best.pick.get(it), P = it.P;
        if (!pk || !pk.rm || !pk.rm.b || !it.rw || !it.rh) return;
        var c = pk.c, o = others(best.pick, it), sq = sqBox(P), w = it.rw, h = it.rh, sp = roomSpots(c, P, w, h), A = c.spots.A;
        var wy = pk.seek ? fineOf(it, c, pk.rm.b, pk.mf) : null, cur = spotCost(c, P, pk.rm.b, A, sq), had = !it.cw || cardRoom(it, c.B, pk.rm.b, o.stat, wy), man = o.man || (P !== hp ? best.man : null);
        for (var k = 0, tries = 0; k < sp.nf && tries < NEARER_TRIES; k++) {
          if (sp.C[k] >= cur - 4) break;
          var r = { x0: sp.X[k], y0: sp.Y[k], x1: sp.X[k] + w, y1: sp.Y[k] + h };
          if (roomHard(P, sp, k, w, h, c, o.stat, o.rooms, man, 0)) continue;
          /* (its card's test, the costly one, for the first few places only) */
          if (had && it.cw && (tries++, !cardRoom(it, c.B, r, o.stat, wy))) continue;
          /* (nor on another venue's leader's way: cutOf) */
          var rm0 = pk.rm, nc0 = cutOf(best.pick).length;
          pk.rm = { h: pk.rm.h, s: pk.rm.s, b: r, dOwn: sp.D[k], cp: pk.rm.cp };
          if (cutOf(best.pick).length > nc0) { pk.rm = rm0; continue; }
          break;
        }
      });
    }
    yield;
    nearer();
    yield;
    /* what is left to wish for: rows standing far off (cells beyond 14 from the stop) */
    var off = 0;
    best.pick.forEach(function (pk, it) {
      var q = it.P.sq;
      off += Math.max(0, Math.round(dbox((q.x0 + q.x1 + 1) / 2, (q.y0 + q.y1 + 1) / 2, pk.c.B)) - 14);
    });
    var R0 = { items: items, best: best, hard: best.hard, off: off, total: best.total, ghost: ghost, wrap: !!wrap, cut: cutOf(best.pick).length, more: items.some(function (it) { return it.took; }) };
    /* (the cards' last look, on the form chosen: its rooms nearer again where it moved any) */
    R0.seek = function () { var g = R0.seekSteps(); while (!g.next().done); };
    R0.seekSteps = function* () { S.PL.forEach(function (P) { P.figs = figsOf(P); }); if (!(yield* seekSteps())) return; yield; nearer(); R0.best = best; R0.hard = best.hard; R0.total = best.total; R0.cut = cutOf(best.pick).length; };
    return R0;
  }
  function lowSky(on) {
    pg.L.lowSky = !!on;
    S.PL.forEach(function (P) {
      P.rh = 0;
      P.slots.forEach(function (sl) {
        if (!sl.A) return;
        var M = maskOf(sl.A);
        sl.sky = on ? { S: SKY, ox: Math.floor((P.rw - M.w) / 2) } : sl.skyFit;
        P.rh = Math.max(P.rh, M.h + sl.sky.S);
      });
    });
  }
  /* apply: the name, its pictures, its medals, the room; a row left on a road (none should be) loses its strip of
     paper, so the road shows through */
  function apply(res) {
    var C = pg.L.cols, Rw = pg.L.rows, cs = pg.L.cs, occ = pg.L.occ, best = res.best;
    function fill(b, bit) { for (var yy = Math.max(0, b.y0); yy < Math.min(Rw, b.y1); yy++) for (var xx = Math.max(0, b.x0); xx < Math.min(C, b.x1); xx++) occ[yy * C + xx] |= bit; }
    function roadUnder(b) { for (var yy = Math.max(0, b.y0); yy < Math.min(Rw, b.y1); yy++) for (var xx = Math.max(0, b.x0); xx < Math.min(C, b.x1); xx++) if (occ[yy * C + xx] & ROAD) return true; return false; }
    pg.L.hard = best.hard;
    pg.L.home = res.ghost || best.man || null;
    if (pg.L.home) fill(pg.L.home.B, MAN);
    if (pg.L.keyB) fill(pg.L.keyB, LAB);
    (pg.L.txtB || []).forEach(function (b) { fill(b, LAB); });
    S.PL.forEach(function (P) { P.room = null; P.slots.forEach(function (sl) { sl.pic = null; sl.tap = null; }); });
    res.items.forEach(function (it) {
      var P = it.P, pk = best.pick.get(it), c = pk.c, lw = P.lw, lh = P.lh;
      P.bare = roadUnder(c.B);
      fill(c.B, LAB);
      c.pics.forEach(function (pb) { pb.s.pic = { x0: pb.x0, y0: pb.y0, x1: pb.x1, y1: pb.y1 }; });
      P.room = pk.rm.b ? { x0: pk.rm.b.x0, y0: pk.rm.b.y0, x1: pk.rm.b.x1, y1: pk.rm.b.y1 } : null;
      if (P.room) fill(P.room, BOX);
      var lx = Math.round(c.bx * cs), ly = Math.round(c.by * cs);
      P.labAt = [lx, ly];   /* (the name's place: cards.js applyRows) */
      P.labBox = { x0: lx, y0: ly, x1: lx + lw, y1: ly + lh };
      P.tb = { x0: Math.floor(lx / cs + 1e-6), y0: Math.floor(ly / cs + 1e-6), x1: Math.ceil((lx + lw) / cs - 1e-6), y1: Math.ceil((ly + lh) / cs - 1e-6) };
      P.LB = c.B; P.side = c.side; P.anc = anchorOf(sqBox(P), c.NB, c.pics); P.ancP = ancParts(P, c.NB, c.pics);
      P.mdAt = c.MD ? { x: c.MD.x0, y: c.MD.y0 } : null;
    });
    /* a row that had to stand off from its stop gets a dotted leader: from the stop (clear of its cell of paper)
       straight to the nearest point of the row, its last dot a cell short of it; drawn only where the way is clear
       of every road, stop, flag, other row, room and him, else not at all */
    /* (a coastline it may cross, its dots on the line itself left out: where the line's last cell fell on a coast
       no leader was drawn at all, and flushing's row, across Long Island's shore from its stop, stood 76px off in
       the sea tied to nothing: the second review, 2026-10-12) */
    S.PL.forEach(function (P) {
      P.lead = null;
      var B = P.LB, q = P.sq;
      if (!B) return;
      function gapW(c) { return Math.max(B.x0 - c[0] - 1, c[0] - B.x1, B.y0 - c[1] - 1, c[1] - B.y1); }
      function dotsOf(path) { return path.filter(function (c, j) { return (path.length - 1 - j) % 2 === 0 && !(occ[c[1] * C + c[0]] & COAST); }); }
      /* (the fourth round: the way to the row's nearest point, or the first of its other ways that is clear: leadFor) */
      var clear = function (path) {
        var end = path[path.length - 1];
        if (path.length < 3 || gapW(end) > 1.75 || path.some(function (c) {
          if (c[0] < 0 || c[1] < 0 || c[0] >= C || c[1] >= Rw) return true;
          return occ[c[1] * C + c[0]] & (ROAD | STOP | FLAG | BOX | MAN | LAB);
        })) return false;
        return dotsOf(path).length > 0;
      };
      var path = leadFor(q, B, clear);
      if (!path) return;
      /* (round 11, 2026-10-13: the dots must read as tying the row to its stop: the last within LEAD_GAP cells of
         the leader's end by the row, the first within LEAD_GAP of its start by the stop. A dot is never drawn on
         a coastline's cell (it would be a lighter cell in the line), and a leader that ran along a shore lost the
         dots it needed there: rhode island's stopped five cells short of its row, or began six from its stop, in
         windows 581 to 634px tall (the fourth review: 428 pages of the sweeps).
         A leader whose every-other-cell dots tie is drawn as it was. Else its dots are set from both ends
         (tieDots: from each end the first cell off the coast, then every other cell, the two halves meeting in
         the middle, a cell of paper between two dots); and should even those not tie, the leader takes another
         of the row's clear ways (leadEnds, the nearest first) whose dots do: the first that also leaves no gap
         wider than LEAD_HOLE cells between two of its dots (one dot lost to a coastline), else the one with the
         narrowest. Which rows have a leader is as it was) */
      var tieDots = function (path) {
        var n = path.length, d = dotsOf(path), out = [], j, half = n / 2, sea = function (k) { return !!(occ[path[k][1] * C + path[k][0]] & COAST); };
        var ok = function (d) { return d.length > 0 && path.indexOf(d[d.length - 1]) >= n - 1 - LEAD_GAP && path.indexOf(d[0]) <= LEAD_GAP; };
        var hole = function (d) { var m = 0; for (var k = 1; k < d.length; k++) m = Math.max(m, path.indexOf(d[k]) - path.indexOf(d[k - 1])); return m; };
        if (ok(d)) return { d: d, ok: true, hole: hole(d) };
        for (j = 0; j < half; ) { if (sea(j)) j++; else { out.push(path[j]); j += 2; } }
        var mid = out.length, last = mid ? path.indexOf(out[mid - 1]) : -9;
        for (j = n - 1; j >= half; ) { if (sea(j)) j--; else { out.splice(mid, 0, path[j]); j -= 2; } }
        if (mid && out.length > mid && path.indexOf(out[mid]) - last < 2) out.splice(mid - 1, 1);
        return out.length ? { d: out, ok: ok(out), hole: hole(out) } : { d: d, ok: false, hole: hole(d) };
      };
      var TD = tieDots(path);
      if (!TD.ok) {
        var alt = null, altP = null;
        for (var E2 = [null].concat(leadEnds(q, B)), ei = 0; ei < E2.length; ei++) {
          var p2 = E2[ei] ? leadPath(q, B, E2[ei]) : leadPath(q, B), t2 = p2 && clear(p2) ? tieDots(p2) : null;
          if (!t2 || !t2.ok) continue;
          if (!alt || t2.hole < alt.hole) { alt = t2; altP = p2; }
          if (alt.hole <= LEAD_HOLE) break;
        }
        if (alt) { path = altP; TD = alt; }
      }
      P.lead = TD.d;
      path.forEach(function (c) { occ[c[1] * C + c[0]] |= LAB; });
    });
    /* (the rows left standing off with no leader, as the audit counts them: retry and the column closed up keep
       no layout that has more of them) */
    pg.L.cut = S.PL.filter(function (P) { return P.LB && !P.lead && leadPath(P.sq, P.LB); }).length;
    /* on a phone, a picture's button is a finger wide and tall (centred on it), cut back a pixel short of every
       name and every other picture */
    if (pg.L.phone) {
      var keepT = [];
      S.PL.forEach(function (P) { if (P.labBox) keepT.push({ b: P.labBox }); P.slots.forEach(function (sl) { if (sl.pic) keepT.push({ b: { x0: sl.pic.x0 * cs, y0: sl.pic.y0 * cs, x1: sl.pic.x1 * cs, y1: sl.pic.y1 * cs }, sl: sl }); }); });
      S.PL.forEach(function (P) {
        P.slots.forEach(function (sl) {
          if (!sl.P.multi || !sl.A || !sl.pic) return;   /* (a sport's button: a venue of several sports, cards.js makeButtons) */
          var b = sl.pic, pb = { x0: b.x0 * cs, y0: b.y0 * cs, x1: b.x1 * cs, y1: b.y1 * cs }, mx = (pb.x0 + pb.x1) / 2, my = (pb.y0 + pb.y1) / 2;
          var r = { x0: Math.min(pb.x0, mx - 11.5), y0: Math.min(pb.y0, my - 11.5), x1: Math.max(pb.x1, mx + 11.5), y1: Math.max(pb.y1, my + 11.5) };
          keepT.forEach(function (K) { if (K.sl !== sl && hit(r, { x0: K.b.x0 - 1, y0: K.b.y0 - 1, x1: K.b.x1 + 1, y1: K.b.y1 + 1 })) r = cutAround(r, K.b, pb); });
          sl.tap = { x0: Math.max(0, r.x0), y0: Math.max(0, r.y0), x1: Math.min(pg.L.W, r.x1), y1: Math.min(pg.L.H, r.y1) };
        });
      });
    }
    solids();
    icons();
  }
  /* the map's solid cells, that no paper of his or a flag's covers: the roads, the stops, the medals, the pictures */
  function solids() {
    var C = pg.L.cols, Rw = pg.L.rows, sol = pg.L.solid = new Uint8Array(C * Rw), i;
    for (i = 0; i < C * Rw; i++) if (pg.L.occ[i] & ROAD) sol[i] = 1;
    function box(b) { for (var y = Math.max(0, b.y0); y < Math.min(Rw, b.y1); y++) for (var x = Math.max(0, b.x0); x < Math.min(C, b.x1); x++) sol[y * C + x] = 1; }
    S.PL.forEach(function (P) {
      box(sqBox(P));
      if (P.mdAt) box({ x0: P.mdAt.x, y0: P.mdAt.y, x1: P.mdAt.x + P.md.length * 6 - 1, y1: P.mdAt.y + 5 });
      P.slots.forEach(function (sl) { if (sl.pic) box(sl.pic); });
    });
  }
  function solidAt(x, y) { return !!(pg.L && pg.L.solid && x >= 0 && y >= 0 && x < pg.L.cols && y < pg.L.rows && pg.L.solid[y * pg.L.cols + x]); }
  /* a box cut back short of another (the side that keeps the most of it) */
  function cutAround(G0, O, p) {
    var opts = [];
    if (O.x1 <= p.x0) opts.push({ x0: Math.max(G0.x0, O.x1 + 1), y0: G0.y0, x1: G0.x1, y1: G0.y1 });
    if (O.x0 >= p.x1) opts.push({ x0: G0.x0, y0: G0.y0, x1: Math.min(G0.x1, O.x0 - 1), y1: G0.y1 });
    if (O.y1 <= p.y0) opts.push({ x0: G0.x0, y0: Math.max(G0.y0, O.y1 + 1), x1: G0.x1, y1: G0.y1 });
    if (O.y0 >= p.y1) opts.push({ x0: G0.x0, y0: G0.y0, x1: G0.x1, y1: Math.min(G0.y1, O.y0 - 1) });
    var best = G0, ba = -1;
    opts.forEach(function (o) { var a = (o.x1 - o.x0) * (o.y1 - o.y0); if (a > ba) { ba = a; best = o; } });
    return best;
  }
  /* a sport's button: its picture's box (on a phone a finger's size); the same boxes answer the pointer */
  function icons() {
    if (!pg.L) return;
    var cs = pg.L.cs;
    S.PL.forEach(function (P) {
      P.slots.forEach(function (sl) {
        sl.hit = null;
        if (!sl.pic) { sl.btnBox = null; return; }
        var b = sl.tap || { x0: sl.pic.x0 * cs, y0: sl.pic.y0 * cs, x1: sl.pic.x1 * cs, y1: sl.pic.y1 * cs };
        sl.hit = { x0: Math.max(0, b.x0), y0: Math.max(0, b.y0), x1: Math.min(pg.L.W, b.x1), y1: Math.min(pg.L.H, b.y1) };
        var x0 = Math.round(sl.hit.x0), y0 = Math.round(sl.hit.y0), x1 = Math.round(sl.hit.x1), y1 = Math.round(sl.hit.y1);
        sl.btnBox = { x0: x0, y0: y0, x1: x1, y1: y1 };   /* (a sport's button there: cards.js applyRows) */
      });
    });
  }
  /* (the cards' last look, solve's seek: SEEK_ROWS of a venue's rows, SEEK_SPOTS card tests of its scene's spots at
     each and SEEK_TESTS in all, SEEK_NB of a neighbour's rows (a third of those tests each); SEEK_WORK rows at most
     in all, a guard
     only: those keep it to about 0.6s on the screens that need it) */
  var SEEK_ROWS = 80, SEEK_SPOTS = 32, SEEK_TESTS = 480, SEEK_NB = 40, SEEK_WORK = 4000;
  /* (in two steps where the page is made ready: every cell, then the cells' sums; it was one of 5 to 6ms, 12 on
     the largest grids. cardGrid runs them in one go) */
  var GRID_ROWS = 48;
  function cardGrid() { var g = cardGridSteps(); while (!g.next().done); }
  function* cardGridSteps() {
    var C = pg.L.cols, Rw = pg.L.rows, occ = pg.L.occ, XL = pg.L.xl || 0, CE = C + XL, W1 = CE + 1, N = W1 * (Rw + 1), x, y, i;
    var blk = new Uint8Array(CE * Rw), soft = new Float32Array(CE * Rw), wet = new Uint8Array(CE * Rw);
    function fillB(b) {
      var x0 = Math.max(-XL, Math.floor(b.x0)), x1 = Math.min(C, Math.ceil(b.x1)), y0 = Math.max(0, Math.floor(b.y0)), y1 = Math.min(Rw, Math.ceil(b.y1));
      for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) blk[yy * CE + xx + XL] = 1;
    }
    /* (the fourth round: a band of GRID_ROWS rows a step, here and at the sums: each half was a step of 2 to 4ms,
       15 on a machine four times slower) */
    for (y = 0; y < Rw; y++) {
      for (x = 0; x < C; x++) {
        var o = occ[y * C + x], j = y * CE + x + XL;
        if (o & (ROAD | STOP | FLAG | LAB)) blk[j] = 1;
        soft[j] = (o & COAST ? COASTC : 0) + (o & BOX ? 0.12 : 0);
        if (o & COAST) wet[j] = 1;
      }
      if (y % GRID_ROWS === GRID_ROWS - 1) yield;
    }
    for (i = 0; i + 1 < (pg.L.water || []).length; i += 2) { soft[pg.L.water[i + 1] * CE + pg.L.water[i] + XL] += COASTC; wet[pg.L.water[i + 1] * CE + pg.L.water[i] + XL] = 1; }
    S.PL.forEach(function (P) {
      if (P.LB) fillB(P.LB);
      if (P.tb) fillB(P.tb);
      fillB({ x0: P.sq.x0 - 1, y0: P.sq.y0 - 1, x1: P.sq.x1 + 2, y1: P.sq.y1 + 2 });
      if (P.fbox) fillB(pad(P.fbox, 1));
    });
    /* (and, apart, without the column's guard, for the last tier, which measures the guard exactly) */
    var blkN = blk.slice();
    (pg.L.guard || []).forEach(fillB);
    yield 3;
    var IK = new Float64Array(N), IS = new Float64Array(N), IW = new Float64Array(N), IKN = new Float64Array(N);
    for (y = 0; y < Rw; y++) {
      var a = 0, s2 = 0, w2 = 0, a2 = 0;
      for (x = 0; x < CE; x++) {
        a += blk[y * CE + x]; s2 += soft[y * CE + x]; w2 += wet[y * CE + x]; a2 += blkN[y * CE + x];
        var j1 = (y + 1) * W1 + x + 1, j0 = y * W1 + x + 1;
        IK[j1] = IK[j0] + a; IS[j1] = IS[j0] + s2; IW[j1] = IW[j0] + w2; IKN[j1] = IKN[j0] + a2;
      }
      if (y % GRID_ROWS === GRID_ROWS - 1) yield;
    }
    pg.L.cg = { IK: IK, IS: IS, IW: IW, IKN: IKN, W1: W1, XL: XL, blk: blk, CE: CE };
  }
  function csum(I, b) {
    var XL = pg.L.cg.XL, CE = pg.L.cg.CE, Rw = pg.L.rows, W1 = pg.L.cg.W1, x0 = clamp(b.x0 + XL, 0, CE), x1 = clamp(b.x1 + XL, 0, CE), y0 = clamp(b.y0, 0, Rw), y1 = clamp(b.y1, 0, Rw);
    if (x1 <= x0 || y1 <= y0) return 0;
    return I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
  }
  /* a venue's parts (its stop, its row, and the scene that plays with the card) and every other venue's whole (its
     row and stop), for the card's distances */
  function ownParts(P, sel) { var room = sel && playable(sel) ? P.room : null; return [sqBox(P)].concat(P.LB ? [P.LB] : []).concat(room ? [room] : []); }
  function otherWholes(P) { return S.PL.filter(function (Q) { return Q !== P; }).map(function (Q) { return Q.LB ? unite(Q.LB, sqBox(Q)) : sqBox(Q); }); }
  function dmin(b, list) { var d = Infinity; for (var i = 0; i < list.length; i++) d = Math.min(d, gapE(b, list[i])); return d; }
  /* a card on a row's lines (sharing any of its cells' rows) lies ROWGAP px from it at least, or its words would read
     on into the name's (round 4's look: "…Dragon rockland lake"); another venue's row ROWGAP2 px, or the card reads
     as that venue's */
  function lineBeside(b, r, gap) { return Math.min(b.y1, r.y1) - Math.max(b.y0, r.y0) > 0 && Math.max(0, b.x0 - r.x1, r.x0 - b.x1) * pg.L.cs < (gap || ROWGAP); }
  function besideRow(b, P) { for (var i = 0; i < S.PL.length; i++) { var Q = S.PL[i]; if (Q.LB && lineBeside(b, Q.LB, Q === P ? ROWGAP : ROWGAP2)) return true; } return false; }
  /* the card's place: the blank paper nearest its venue's scene (the scene and the words together), within REACH px
     of the venue and clearly its own (at most 0.6 of the nearest other venue's distance, and APART px from it at
     least); on the scene's side of the venue (tier 2: across it, at a cost), the scene's far side from the column
     first: right of it, then under, over, left; the further from the column's words the better; standing off, a
     dotted leader from its row or its scene (its way clear). Placed at every other cell, then the best refined to the
     cell; where none is found, every cell. Tier 3, the last: the column's guard measured exactly (no cell of paper
     added to its 40px) and the map's edges reached */
  /* (in steps: a yield every CARD_ROWS rows of the places tried; a card that found none at every other cell and
     tried every cell was one step of 10 to 17ms. cardPlace runs them in one go) */
  var CARD_ROWS = 16;
  function cardPlace(P, w, h, sel, tier) { var g = cardPlaceSteps(P, w, h, sel, tier), r = g.next(); while (!r.done) r = g.next(); return r.value; }
  function* cardPlaceSteps(P, w, h, sel, tier) {
    var loose = tier >= 1, across = tier >= 2, edge = tier >= 3, m1 = edge ? 0 : 1;
    if (!pg.L || !pg.L.cg) return null;
    var C = pg.L.cols, Rw = pg.L.rows, XL = pg.L.xl || 0, cs = pg.L.cs, room = sel && playable(sel) ? P.room : null, sq = sqBox(P);
    var parts = ownParts(P, sel), U = parts.reduce(unite), r = room || U, others = otherWholes(P), CT = pg.L.colU, best = null;
    var RM = Math.max(4, Math.floor(REACH / cs + 1e-6));
    /* (his spot at home is free while a card is shown, he being at its venue, but for his own venue's card where he
       has no scene: there he stands at home) */
    var manB = pg.L.home && P === pg.L.homeP && !room ? pg.L.home.B : null;
    var sc = [(sq.x0 + sq.x1) / 2, (sq.y0 + sq.y1) / 2], rv = room ? [(room.x0 + room.x1) / 2 - sc[0], (room.y0 + room.y1) / 2 - sc[1]] : null;
    function at(x, y) {
      if (x < 1 - XL || y < m1 || x + w > C - m1 || y + h > Rw - m1) return;
      /* (the third round: what most places fail, something of the map within a cell of them (the same sum as below,
         on the numbers), is asked first, before the distances and the cost: 0.14 to 0.27s of a dear size's making
         went on places that could never be taken) */
      var cg = pg.L.cg, IB = edge ? cg.IKN : cg.IK, qx0 = Math.max(0, x - 1 + cg.XL), qx1 = Math.min(cg.CE, x + w + 1 + cg.XL), qy0 = Math.max(0, y - 1), qy1 = Math.min(Rw, y + h + 1);
      if (qx1 > qx0 && qy1 > qy0 && IB[qy1 * cg.W1 + qx1] - IB[qy0 * cg.W1 + qx1] - IB[qy1 * cg.W1 + qx0] + IB[qy0 * cg.W1 + qx0] > 0) return;
      var b = { x0: x, y0: y, x1: x + w, y1: y + h }, dOwn = dmin(b, parts);
      if (dOwn > RM) return;
      var dR = gapE(b, r), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      var side = b.x0 >= r.x1 ? 0 : b.y0 >= r.y1 ? 2 : b.y1 <= r.y0 ? 3 : b.x1 <= r.x0 ? 4 : 3;
      var s = 8 * dR + 2 * dOwn + side * 3 + csum(pg.L.cg.IS, b) + (dOwn > 5 ? 20 + 2 * (dOwn - 5) : 0);
      /* (on its own name's lines, even clear of them, it costs: under or over the name reads better) */
      if (P.LB && lineBeside(b, P.LB, 40)) s += 60;
      if (rv && (cx - sc[0]) * rv[0] + (cy - sc[1]) * rv[1] < 0) { if (!across) return; s += 60; }
      if (CT) s += Math.max(0, 160 - gapE(b, CT) * cs) * 0.12;
      if (best && s >= best.s) return;
      if ((edge ? csum(pg.L.cg.IKN, pad(b, 1)) > 0 || (pg.L.guard || []).some(function (g) { return hit(b, g); }) : csum(pg.L.cg.IK, pad(b, 1)) > 0) || (room && hit(pad(b, 1), room)) || (manB && hit(pad(b, 1), manB))) return;
      if (!loose && csum(pg.L.cg.IW, b) > 0) return;
      var dOther = dmin(b, others);
      if (dOwn > 0.6 * dOther || dOther * cs < APART) return;
      if (besideRow(b, P)) return;
      var lead = null;
      /* (beside its own name on its lines, a step from it, the name says whose it is: no leader) */
      if (dOwn > 5 && !(P.LB && lineBeside(b, P.LB, 28))) {
        /* (to its name's row, where that way is clear; else to its scene: never from the stop, where the flag's pole
           rises, nor, for a card with a scene to lead to, from the row along its own line, where the dots would lead
           the eye from the name into the card as a table of contents does) */
        var order = parts.slice(1).filter(function (pt, i) { return i || !room || Math.min(b.y1, pt.y1) - Math.max(b.y0, pt.y0) <= 0; });
        for (var k = 0; k < order.length && !lead; k++) lead = cardLead(order[k], b);
        if (!lead) return;
      }
      best = { s: s, b: b, lead: lead, dOwn: dOwn, dOther: dOther };
    }
    var y, x, y0 = Math.max(m1, U.y0 - h - RM), y1 = Math.min(Rw - m1 - h, U.y1 + RM), x0 = Math.max(1 - XL, U.x0 - w - RM), x1 = Math.min(C - m1 - w, U.x1 + RM);
    var n = 0;
    /* (round 11, 2026-10-13: a row of places. What nearly every place fails, something of the map within a cell of
       it (at's own first test: the same sum on the same numbers), is asked here in the loop, and at is called only
       for the few that pass: 7 million calls of at at 1366 x 657, 2% of them past that test. The same places in the
       same order; from: the first of the row's places asked) */
    var cg0 = pg.L.cg, IB0 = edge ? cg0.IKN : cg0.IK, W10 = cg0.W1, CE0 = cg0.CE, XL0 = cg0.XL;
    /* (and only along the stretches of the row where a place can be within RM cells of one of the venue's parts,
       at's own next test: each part's stretch, in order from the left, on the row's own every-other cells) */
    /* (and those places are the same for a size at every tier but the last (the sums asked are the same, and the
       venue's parts): they are found once and kept with the cards' grid (cg.pc, by the size, the venue's parts and
       the sums), the every-other-cell ones and, when they are asked for, the rest; each tier then asks at of
       them in the same order. A card that finds no place went through its venue's map three times a size) */
    var LO = [0, 0, 0, 0], HI = [0, 0, 0, 0], got = null;
    var PC = cg0.pc || (cg0.pc = new Map()), pk = w + 'x' + h + (edge ? 'e' : '') + '|' + parts.map(function (q) { return q.x0 + ' ' + q.y0 + ' ' + q.x1 + ' ' + q.y1; }).join('/'), pc = PC.get(pk), gi;
    if (!pc) { pc = { a: null, b: null }; PC.set(pk, pc); }
    function row(yy, from, st) {
      var qy0 = Math.max(0, yy - 1), qy1 = Math.min(Rw, yy + h + 1), r0 = qy0 * W10, r1 = qy1 * W10, a, b, xx, k, j, m = 0, pt, lo, e, cur = from;
      for (k = 0; k < parts.length && k < 4; k++) {
        pt = parts[k];
        if (Math.max(0, yy - pt.y1, pt.y0 - yy - h) > RM) continue;
        lo = pt.x0 - w - RM;
        for (j = m; j > 0 && LO[j - 1] > lo; j--) { LO[j] = LO[j - 1]; HI[j] = HI[j - 1]; }
        LO[j] = lo; HI[j] = pt.x1 + RM; m++;
      }
      for (j = 0; j < m; j++) {
        lo = Math.max(cur, LO[j]); e = Math.min(x1, HI[j]);
        if (st === 2 && ((lo - from) & 1)) lo++;
        for (xx = lo; xx <= e; xx += st) {
          a = xx - 1 + XL0; if (a < 0) a = 0;
          b = xx + w + 1 + XL0; if (b > CE0) b = CE0;
          if (b > a && qy1 > qy0 && IB0[r1 + b] - IB0[r0 + b] - IB0[r1 + a] + IB0[r0 + a] > 0) continue;
          got.push(xx, yy);
        }
        if (e + 1 > cur) cur = e + 1;
      }
    }
    if (!pc.a) { got = []; for (y = y0; y <= y1; y += 2) { row(y, x0, 2); if (++n % CARD_ROWS === 0) yield; } pc.a = got; }
    for (gi = 0; gi < pc.a.length; gi += 2) at(pc.a[gi], pc.a[gi + 1]);
    if (best) { var bx = best.b.x0, by = best.b.y0; for (y = by - 1; y <= by + 1; y++) for (x = bx - 1; x <= bx + 1; x++) at(x, y); }
    /* (none at every other cell: every cell; those just asked, which found none and would find none again, left out) */
    else {
      if (!pc.b) { got = []; for (y = y0; y <= y1; y++) { if ((y - y0) % 2) row(y, x0, 1); else row(y, x0 + 1, 2); if (++n % CARD_ROWS === 0) yield; } pc.b = got; }
      for (gi = 0; gi < pc.b.length; gi += 2) at(pc.b[gi], pc.b[gi + 1]);
    }
    return best;
  }
  /* a dotted leader from a part's nearest point to a card's (a dot every other cell, a cell short of each end), only
     where nothing lies under it */
  function cardLead(r, b) {
    var C = pg.L.cols, occ = pg.L.occ, ax = clamp((b.x0 + b.x1) / 2, r.x0, r.x1 - 1), ay = clamp((b.y0 + b.y1) / 2, r.y0, r.y1 - 1);
    var bx = clamp(ax, b.x0, b.x1 - 1), by = clamp(ay, b.y0, b.y1 - 1), line = [], out = [];
    ax = clamp(bx, r.x0, r.x1 - 1); ay = clamp(by, r.y0, r.y1 - 1);
    bres(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), line);
    for (var i = 0; i < line.length; i++) {
      var c = line[i], inR = c[0] >= r.x0 - 1 && c[0] < r.x1 + 1 && c[1] >= r.y0 - 1 && c[1] < r.y1 + 1, inB = c[0] >= b.x0 - 1 && c[0] < b.x1 + 1 && c[1] >= b.y0 - 1 && c[1] < b.y1 + 1;
      if (inR || inB) continue;
      if (c[0] < 0 || c[0] >= C || c[1] < 0 || c[1] >= pg.L.rows || pg.L.cg.blk[c[1] * pg.L.cg.CE + c[0] + pg.L.cg.XL]) return null;
      var o = c[0] >= 0 ? occ[c[1] * C + c[0]] : 0;
      out.push(o & COAST ? null : c);
    }
    return out.length >= 2 ? out.filter(function (c, j) { return c && j % 2 === 0; }) : [];
  }
  /* a venue's scene's room moved to make way for its cards: each card placed as if the room were not there, then the
     nearest place for the room clear of them all (a cell of paper between) and of what a room keeps clear of: every
     road (a cell round it), stop (three cells round it), flag's place, row and other room, him, the lakes and the
     ranges' marks (the coast it may lie over, at a cost); within ROOM_CAP of its anchor and clearly its own
     (roomNeed); the nearest to its venue (roomCost) and to its cards. back: put the room back where it was */
  /* (in steps: a card placed, a few of the room's places tried; it was one step of 8 to 25ms. roomRepair runs them
     in one go) */
  function roomRepair(P, back) { var g = roomRepairSteps(P, back), r = g.next(); while (!r.done) r = g.next(); return r.value; }
  /* (round 11, 2026-10-13: fresh: a venue that has no room, its scene dropped by the cards' last look: the room it
     would have (as wide and tall as its scenes ask), found the same way clear of the cards it has: sceneBack) */
  function* roomRepairSteps(P, back, fresh) {
    var C = pg.L.cols, Rw = pg.L.rows, occ = pg.L.occ, i, x, y;
    function setBox(b, on) { for (y = Math.max(0, b.y0); y < Math.min(Rw, b.y1); y++) for (x = Math.max(0, b.x0); x < Math.min(C, b.x1); x++) { if (on) occ[y * C + x] |= BOX; else occ[y * C + x] &= ~BOX; } }
    if (back) { if (P.room0) { setBox(P.room, false); P.room = P.room0; setBox(P.room, true); P.room0 = null; } return false; }
    if ((!P.room && !fresh) || !P.LB) return false;
    var old = P.room, w = old ? old.x1 - old.x0 : P.rw, h = old ? old.y1 - old.y0 : P.rh, keep = [];
    if (!w || !h) return false;
    P.room = null;
    /* (the room is out of the way from here to the last of its cards: nothing else looks at this venue between two
       steps, the page being made where nothing is in hand) */
    var sels = pg.selsOf(P);
    for (var si = 0; si < sels.length; si++) { var o1 = sels[si]; if (!S.colKeys[o1.key] && o1.sel.slot && o1.sel.slot.A) { var c1 = yield* pg.placeCardSteps(P, o1); if (!c1.fail) keep.push(pad(c1.b, 1)); } }
    P.room = old;
    if (!keep.length && !fresh) return false;
    var water = {};
    for (i = 0; i + 1 < (pg.L.water || []).length; i += 2) water[pg.L.water[i + 1] * C + pg.L.water[i]] = 1;
    var sq = sqBox(P), A = P.anc || anchorOf(sq, P.tb, P.slots.map(function (sl) { return sl.pic; }).filter(Boolean)), AP = P.ancP || [sq], best = null;
    function ok(r) {
      if (r.x0 < 1 || r.y0 < 1 || r.x1 > C - 1 || r.y1 > Rw - 1) return false;
      if (ancGap(r, AP) > roomCap() + 1e-9 || hit(r, pad(P.LB, 1))) return false;
      var need = roomNeed(Math.min(gapE(r, P.LB), gapE(r, sq))) - 1e-9;
      for (var k = 0; k < keep.length; k++) if (hit(r, keep[k])) return false;
      for (var q = 0; q < S.PL.length; q++) { var Q = S.PL[q]; if (Q !== P && Math.min(gapE(r, sqBox(Q)), Q.LB ? gapE(r, Q.LB) : Infinity) < need) return false; }
      /* (round 11: the two of the cells' tests that turn most places down, a stop within three cells and a road, a
         row or him within one, asked first by a sum each (below); the cells are gone through for the rest) */
      if (boxSum(ISt, r.x0 - 3, r.y0 - 3, r.x1 + 3, r.y1 + 3) > 0 || boxSum(IRl, r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1) > 0) return false;
      for (y = Math.max(0, r.y0 - 3); y < Math.min(Rw, r.y1 + 3); y++) for (x = Math.max(0, r.x0 - 3); x < Math.min(C, r.x1 + 3); x++) {
        var o = occ[y * C + x], inR = x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1, d = Math.max(r.x0 - x, x - r.x1 + 1, r.y0 - y, y - r.y1 + 1, 0);
        if (o & STOP) return false;
        if (d <= 1 && (o & (ROAD | LAB | MAN))) return false;
        if (d <= 1 && (o & BOX) && !(old && x >= old.x0 && x < old.x1 && y >= old.y0 && y < old.y1)) return false;
        if (inR && ((o & (FLAG | TERR)) || water[y * C + x])) return false;
      }
      if (P.lead && P.lead.some(function (c) { return c[0] >= r.x0 && c[0] < r.x1 && c[1] >= r.y0 && c[1] < r.y1; })) return false;
      return true;
    }
    /* (round 11: the coast's cells under a place by a sum of the map's (made the first time a room is moved on this
       laying out of the cards, kept with their grid): they were counted cell by cell for every place weighed) */
    /* (with them the stops' cells and the roads', rows' and his, which no room's moving changes, for ok's two
       first questions) */
    var ICo = pg.L.cg.ICo, ISt = pg.L.cg.ISt, IRl = pg.L.cg.IRl;
    if (!ICo) {
      ICo = pg.L.cg.ICo = new Int32Array((C + 1) * (Rw + 1)); ISt = pg.L.cg.ISt = new Int32Array((C + 1) * (Rw + 1)); IRl = pg.L.cg.IRl = new Int32Array((C + 1) * (Rw + 1));
      for (y = 0; y < Rw; y++) {
        var run = 0, run2 = 0, run3 = 0, j1 = (y + 1) * (C + 1) + 1, j0 = y * (C + 1) + 1;
        for (x = 0; x < C; x++) {
          var ob = occ[y * C + x];
          if (ob & COAST) run++; if (ob & STOP) run2++; if (ob & (ROAD | LAB | MAN)) run3++;
          ICo[j1 + x] = ICo[j0 + x] + run; ISt[j1 + x] = ISt[j0 + x] + run2; IRl[j1 + x] = IRl[j0 + x] + run3;
        }
      }
    }
    function boxSum(I, x0, y0, x1, y1) {
      var xa = Math.max(0, x0), xb = Math.min(C, x1), ya = Math.max(0, y0), yb = Math.min(Rw, y1);
      if (xb <= xa || yb <= ya) return 0;
      return I[yb * (C + 1) + xb] - I[ya * (C + 1) + xb] - I[yb * (C + 1) + xa] + I[ya * (C + 1) + xa];
    }
    function coastIn(r) { return boxSum(ICo, r.x0, r.y0, r.x1, r.y1); }
    /* (every place within ROOM_CAP of its anchor, by its cost and its nearness to its cards; each tested only while it
       could still be the best) */
    yield 4;   /* (their costs, the coast under each counted: 4 to 5ms) */
    var sp = [], xx, yy;
    for (yy = A.y0 - h - roomCap(); yy <= A.y1 + roomCap(); yy++) for (xx = A.x0 - w - roomCap(); xx <= A.x1 + roomCap(); xx++) {
      var rr = { x0: xx, y0: yy, x1: xx + w, y1: yy + h };
      if (ancGap(rr, AP) > roomCap() + 1e-9 || hit(rr, pad(P.LB, 1))) continue;
      sp.push([xx, yy, roomCost(rr, A, P.figs || [], sq, P.LB) + ROOM_COASTC * coastIn(rr)]);
    }
    sp.sort(function (a, b) { return a[2] - b[2]; });
    yield;
    for (var q2 = 0; q2 < sp.length; q2++) {
      if (q2 % 24 === 23) yield;
      if (best && sp[q2][2] >= best.s) break;
      var r2 = { x0: sp[q2][0], y0: sp[q2][1], x1: sp[q2][0] + w, y1: sp[q2][1] + h };
      if (!ok(r2)) continue;
      var s2 = sp[q2][2] + 2 * Math.min.apply(null, keep.map(function (k) { return gapE(r2, k); }));
      if (!best || s2 < best.s) best = { s: s2, r: r2 };
    }
    if (!best) return false;
    if (old) setBox(old, false);
    setBox(best.r, true);
    P.room0 = old; P.room = best.r;
    /* (the terrain's faint dots out of its new place, as out of every room) */
    var R2 = pad(best.r, 1), dots = [];
    for (i = 0; i + 1 < pg.L.dots.length; i += 2) if (!(pg.L.dots[i] >= R2.x0 && pg.L.dots[i] < R2.x1 && pg.L.dots[i + 1] >= R2.y0 && pg.L.dots[i + 1] < R2.y1)) dots.push(pg.L.dots[i], pg.L.dots[i + 1]);
    pg.L.dots = dots;
    return true;
  }
  /* ---------- terrain, a whisper, last, in what is left: the lakes (whole, or not at all), a few marks on the real
     ranges, and a faint stipple over the rest of the land that thins on the lowlands and toward the map's edge. A
     wide clear corridor round the roads and stops, room round the names, pictures and rooms ---------- */
  /* (in steps where the page is made ready: how far each cell is from what it keeps clear of, the lakes, the marks,
     the stipple; it was one step of 6 to 10ms. terrain runs them in one go) */
  function terrain() { var g = terrainSteps(); while (!g.next().done); }
  function* terrainSteps() {
    yield 4;   /* (every cell's distance, one way, 3 to 4ms, and, below, back, 2 to 3) */
    var C = pg.L.cols, Rw = pg.L.rows, occ = pg.L.occ, land = pg.L.land, N = C * Rw, BIG = 9999, i, x, y;
    var corr = pg.L.cs < 1.4 ? 9 : 7, Dm = new Int16Array(N);
    for (i = 0; i < N; i++) {
      var o = occ[i];
      Dm[i] = o & (ROAD | STOP) ? -corr : o & (LAB | BOX | MAN | FLAG) ? -4 : o & COAST ? -2 : BIG;
    }
    for (y = 0; y < Rw; y++) for (x = 0; x < C; x++) {
      i = y * C + x;
      var v = Dm[i];
      if (x > 0) v = Math.min(v, Dm[i - 1] + 1);
      if (y > 0) { v = Math.min(v, Dm[i - C] + 1); if (x > 0) v = Math.min(v, Dm[i - C - 1] + 1); if (x < C - 1) v = Math.min(v, Dm[i - C + 1] + 1); }
      Dm[i] = v;
    }
    yield 3;
    for (y = Rw - 1; y >= 0; y--) for (x = C - 1; x >= 0; x--) {
      i = y * C + x;
      var w = Dm[i];
      if (x < C - 1) w = Math.min(w, Dm[i + 1] + 1);
      if (y < Rw - 1) { w = Math.min(w, Dm[i + C] + 1); if (x < C - 1) w = Math.min(w, Dm[i + C + 1] + 1); if (x > 0) w = Math.min(w, Dm[i + C - 1] + 1); }
      Dm[i] = w;
    }
    yield;
    /* the column's words are one block (the second review, 2026-10-12): from the title down to what is at hand, as
       wide as their longest line, with two cells of paper round it. Each line kept only its own room, so where the
       words stand on the map (1440 x 900, 1600 x 900, 1536 x 864: they moved up with the smaller title, the map
       did not) a lake and a range's mark lay between two of their lines. Nothing of the terrain in the block now:
       no lake, no mark, no dot of the stipple, which thins toward it as it did toward each line */
    var blk = (pg.L.colT || []).concat(pg.L.txtB || []).reduce(function (u, b) { return u ? unite(u, b) : b; }, null);
    if (blk) blk = { x0: Math.floor(blk.x0) - 2, y0: Math.floor(blk.y0) - 2, x1: Math.ceil(blk.x1) + 2, y1: Math.ceil(blk.y1) + 2 };
    if (blk && !(blk.x1 > 0 && blk.y1 > 0 && blk.x0 < C && blk.y0 < Rw)) blk = null;
    pg.L.blk = blk;   /* (drawBase: nor a state line's dots there) */
    function free(X, Y) { if (X < 1 || Y < 1 || X >= C - 1 || Y >= Rw - 1) return false; if (blk && X >= blk.x0 && X < blk.x1 && Y >= blk.y0 && Y < blk.y1) return false; var j = Y * C + X; return land[j] && Dm[j] > 0 && !(occ[j] & TERR); }
    pg.L.water = []; pg.L.terr = []; pg.L.dots = [];
    var k = pg.L.k;
    function cells(poly) {
      var P = poly.map(proj).filter(Boolean);
      if (P.length < 3) return [];
      var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      P.forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
      var out = [], X0 = Math.max(0, Math.floor((bx0 + 0.5) * k) - 1), X1 = Math.min(C - 1, Math.ceil((bx1 + 0.5) * k) + 1), Y0 = Math.max(0, Math.floor((by0 + 0.5) * k) - 1), Y1 = Math.min(Rw - 1, Math.ceil((by1 + 0.5) * k) + 1);
      for (var Y = Y0; Y <= Y1; Y++) for (var X = X0; X <= X1; X++) if (inPoly((X + 0.5) / k - 0.5, (Y + 0.5) / k - 0.5, P)) out.push(X, Y);
      return out;
    }
    function round(c) {
      var set = {}, j, out = [];
      for (j = 0; j < c.length; j += 2) set[c[j + 1] * C + c[j]] = 1;
      for (j = 0; j < c.length; j += 2) {
        var X = c[j], Y = c[j + 1], l = set[Y * C + X - 1], r = set[Y * C + X + 1], u = set[(Y - 1) * C + X], d = set[(Y + 1) * C + X];
        if ((l ? 1 : 0) + (r ? 1 : 0) + (u ? 1 : 0) + (d ? 1 : 0) === 2 && !(l && r) && !(u && d)) continue;
        out.push(X, Y);
      }
      return out;
    }
    function thick(c) {
      var rowsN = {}, colsN = {}, j;
      for (j = 0; j < c.length; j += 2) { rowsN[c[j + 1]] = (rowsN[c[j + 1]] || 0) + 1; colsN[c[j]] = (colsN[c[j]] || 0) + 1; }
      var mr = 0, mc = 0;
      Object.keys(rowsN).forEach(function (r) { mr = Math.max(mr, rowsN[r]); });
      Object.keys(colsN).forEach(function (q) { mc = Math.max(mc, colsN[q]); });
      return Math.min(mr, mc);
    }
    function shape(c) {
      var set = {}, keep = {}, j, out = [];
      for (j = 0; j < c.length; j += 2) set[c[j + 1] * C + c[j]] = 1;
      for (j = 0; j < c.length; j += 2) {
        var X = c[j], Y = c[j + 1], k0 = Y * C + X;
        if (set[k0 - 1] && set[k0 + 1] && set[k0 - C] && set[k0 + C]) { keep[k0] = keep[k0 - 1] = keep[k0 + 1] = keep[k0 - C] = keep[k0 + C] = 1; }
      }
      for (j = 0; j < c.length; j += 2) if (keep[c[j + 1] * C + c[j]]) out.push(c[j], c[j + 1]);
      return out.length >= 0.8 * c.length ? out : [];
    }
    (TERRAIN.lakes || []).forEach(function (lk) {
      var c0 = cells(lk.poly || []), ok = c0.length >= 9 && thick(c0) >= 3;
      for (var j = 0; ok && j < c0.length; j += 2) if (!free(c0[j], c0[j + 1])) ok = false;
      if (!ok) return;
      var c = shape(round(c0));
      for (j = 0; j < c.length; j += 2) { occ[c[j + 1] * C + c[j]] |= TERR; pg.L.water.push(c[j], c[j + 1]); }
    });
    yield;
    var ranges = [];
    (TERRAIN.marks || []).forEach(function (mk) {
      var p = proj(mk.at || [0, 0]), G2 = T_GLYPH[mk.kind] || T_GLYPH.peak, h = G2.length, w = G2[0].length;
      if (!p) return;
      var X = gx(p[0]), Y = gx(p[1]);
      ranges.push([X, Y]);
      [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 2], [-3, -2]].some(function (d) {
        var x0 = X + d[0] - (w >> 1), y0 = Y + d[1] - h + 1, a, b;
        for (b = -1; b <= h; b++) for (a = -1; a <= w; a++) if (!free(x0 + a, y0 + b)) return false;
        for (b = 0; b < h; b++) for (a = 0; a < w; a++) if (G2[b][a] === '#') { occ[(y0 + b) * C + x0 + a] |= TERR; pg.L.terr.push(x0 + a, y0 + b); }
        return true;
      });
    });
    yield;
    var Rr = 26 * k, fade = 15;
    for (y = 0; y < Rw; y += 5) for (x = 0; x < C; x += 5) {
      var X2 = x + Math.floor(hash(x, y) * 5), Y2 = y + Math.floor(hash(y + 7, x + 3) * 5);
      if (X2 >= C || Y2 >= Rw || !free(X2, Y2)) continue;
      var dr = Infinity;
      ranges.forEach(function (r) { dr = Math.min(dr, Math.hypot(r[0] - X2, r[1] - Y2)); });
      var keep = dr <= Rr ? 1 : dr >= 2 * Rr ? 0.5 : 1 - 0.5 * (dr - Rr) / Rr;
      keep *= clamp((Math.min(X2, Y2, C - 1 - X2, Rw - 1 - Y2) - 1) / fade, 0, 1);
      (blk ? [blk] : pg.L.txtB || []).forEach(function (q) { var ex = Math.max(q.x0 - X2, 0, X2 - q.x1 + 1), ey = Math.max(q.y0 - Y2, 0, Y2 - q.y1 + 1); keep *= clamp((Math.hypot(ex, ey) - 4) / 10, 0, 1); });
      if (hash(X2 * 3 + 11, Y2 * 5 + 17) >= keep) continue;
      var clear = true;
      for (var b2 = -1; b2 <= 1 && clear; b2++) for (var a2 = -1; a2 <= 1; a2++) if (occ[(Y2 + b2) * C + X2 + a2] & TERR) { clear = false; break; }
      if (clear) pg.L.dots.push(X2, Y2);
    }
  }
  /* what the placing left, counted (for the checks, on .r-map[data-audit]): cells of road, coast or stop under a
     picture, a medal, a room or his spot (road or stop under a name; the coast under a name apart); anything outside
     the map; two rows (or the key, the column's words, him) that overlap; a room over another venue's row, room or
     the key (cover), over its own row (own), or over a flag (flag); a picture away from its name (far); names left
     without their strip of paper on a road (bare); a room not clearly its own venue's (astray) or far from it
     (loose); a row standing off from its stop with no leader (cut); the cards (below); hard is what the placing
     could not avoid */
  /* (dom, from page.js audit: small and cmp, the names' and the cards' smaller type; on a phone edge: the map's left,
     the window's width, the page's margin and each name's left and right, in the window's px) */
  function audit(dom) {
    var C = pg.L.cols, Rw = pg.L.rows, occ = pg.L.occ, a = { out: 0, road: 0, coast: 0, stop: 0, nameCoast: 0, overlap: 0, cover: 0, own: 0, rooms: 0, flag: 0, far: 0, terrain: 0, bare: 0, astray: 0, loose: 0, who: [] }, stat = [], sc = [];
    function nm(r) { return (r.P ? r.P.name : '') + ' ' + r.k; }
    S.PL.forEach(function (P) {
      if (P.LB) stat.push({ b: { x0: P.tb.x0, y0: P.tb.y0, x1: P.tb.x1, y1: P.tb.y1 }, k: 'name', P: P, row: P.LB });
      if (P.bare) { a.bare++; a.who.push(P.name + ' bare'); }
      P.slots.forEach(function (sl) {
        if (sl.pic) {
          stat.push({ b: sl.pic, k: 'pic', P: P, sl: sl });
          if (P.LB && !(sl.pic.x0 >= P.LB.x0 && sl.pic.x1 <= P.LB.x1 && sl.pic.y0 >= P.LB.y0 && sl.pic.y1 <= P.LB.y1)) { a.far++; a.who.push(P.name + ' far'); }
        }
      });
      if (P.mdAt) stat.push({ b: { x0: P.mdAt.x, y0: P.mdAt.y, x1: P.mdAt.x + P.md.length * 6 - 1, y1: P.mdAt.y + 5 }, k: 'medals', P: P });
      if (P.room) sc.push({ b: P.room, k: 'room', P: P });
    });
    if (pg.L.keyB) stat.push({ b: pg.L.keyB, k: 'key' });
    a.textOn = 0;
    (pg.L.txtB || []).forEach(function (b) { stat.push({ b: b, k: 'text' }); });
    if (pg.L.home) stat.push({ b: { x0: pg.L.home.fx - 4, y0: pg.L.home.fy - 12, x1: pg.L.home.fx + 5, y1: pg.L.home.fy + 1 }, k: 'man' });
    stat.concat(sc).forEach(function (r) {
      var b = r.b;
      var ob = r.k === 'text' ? false : r.k === 'name' ? (r.P.tb.x0 < (pg.L.phone ? 0 : pg.L.nl) || r.P.tb.x1 > C - (pg.L.phone ? 0 : pg.L.nr) || b.y0 < 0 || b.y1 > Rw) : b.x0 < 0 || b.y0 < 0 || b.x1 > C || b.y1 > Rw;
      if (ob) { a.out++; a.who.push(nm(r) + ' out'); }
      if (r.k === 'text') {
        for (var ty = Math.max(0, b.y0 + 2); ty < Math.min(Rw, b.y1 - 2); ty++) for (var tx = Math.max(0, b.x0 + 2); tx < Math.min(C, b.x1 - 2); tx++) if (occ[ty * C + tx] & (COAST | ROAD | STOP)) a.textOn++;
        return;
      }
      if (r.k === 'key') {
        a.keyOn = 0;
        for (var ky = Math.max(0, b.y0 + 1); ky < Math.min(Rw, b.y1 - 1); ky++) for (var kx = Math.max(0, b.x0 + 1); kx < Math.min(C, b.x1 - 1); kx++) if (occ[ky * C + kx] & (COAST | ROAD | STOP)) a.keyOn++;
        return;
      }
      var B2 = r.k === 'name' ? r.row : b;
      for (var y = Math.max(0, B2.y0); y < Math.min(Rw, B2.y1); y++) for (var x = Math.max(0, B2.x0); x < Math.min(C, B2.x1); x++) {
        var o = occ[y * C + x];
        if (o & ROAD) { a.road++; if (a.who.indexOf(nm(r) + ' road') < 0) a.who.push(nm(r) + ' road'); }
        if (o & STOP) a.stop++;
        if (o & TERR) a.terrain++;
        if (o & COAST) { if (r.k === 'room') continue; if (r.k === 'name' || (pg.L.phone && (r.k === 'pic' || r.k === 'medals'))) a.nameCoast++; else { a.coast++; if (a.who.indexOf(nm(r) + ' coast') < 0) a.who.push(nm(r) + ' coast'); } }
      }
      if (r.k !== 'name') for (var y2 = Math.max(0, b.y0); y2 < Math.min(Rw, b.y1); y2++) for (var x2 = Math.max(0, b.x0); x2 < Math.min(C, b.x1); x2++) if (occ[y2 * C + x2] & FLAG) { a.flag++; if (a.who.indexOf(nm(r) + ' flag') < 0) a.who.push(nm(r) + ' flag'); }
    });
    stat.forEach(function (r, i) {
      for (var j = i + 1; j < stat.length; j++) {
        var o = stat[j];
        if ((r.k === 'text' && o.k === 'text') || (r.P && r.P === o.P)) continue;
        if (hit(r.k === 'name' ? r.row : r.b, o.k === 'name' ? o.row : o.b)) { a.overlap++; a.who.push(nm(r) + ' x ' + nm(o)); }
      }
    });
    sc.forEach(function (r, i) {
      stat.forEach(function (T) {
        if (T.k === 'man' && r.P === pg.L.homeP) return;
        if (!hit(r.b, T.k === 'name' ? T.row : T.b)) return;
        if (T.P && T.P === r.P) { a.own++; a.who.push(nm(r) + ' over own ' + T.k); return; }
        a.cover++; a.who.push(nm(r) + ' over ' + nm(T));
      });
      for (var j = i + 1; j < sc.length; j++) if (hit(pad(r.b, 1), sc[j].b)) { a.rooms++; a.who.push(nm(r) + ' x ' + nm(sc[j])); }
    });
    a.reach = {};
    /* (cut: a row standing off from its stop, six cells or more, with no leader to tie it) */
    a.cut = 0;
    S.PL.forEach(function (P) {
      if (!P.LB) return;
      var px0 = (P.sq.x0 + P.sq.x1 + 1) / 2, py0 = (P.sq.y0 + P.sq.y1 + 1) / 2, B = P.LB;
      a.reach[P.name] = Math.round(Math.hypot(Math.max(B.x0 - px0, 0, px0 - B.x1), Math.max(B.y0 - py0, 0, py0 - B.y1)));
      if (leadPath(P.sq, B) && !P.lead) { a.cut++; a.who.push(P.name + ' cut off'); }
    });
    /* a room not clearly its own venue's: another venue's stop, row or (a phone's) picture's button nearer than
       roomNeed of its own stop or row (astray); or more than ROOM_CAP cells from its anchor (loose); and the coast
       under rooms, a scene's paper covering it (roomCoast, soft) */
    a.roomCoast = 0;
    sc.forEach(function (r) {
      var P = r.P, dOwn = Math.min(gapE(r.b, sqBox(P)), gapE(r.b, P.LB)), need = roomNeed(dOwn), oth = Infinity, on = '';
      S.PL.forEach(function (Q) {
        if (Q === P) return;
        var d = Math.min(gapE(r.b, sqBox(Q)), Q.LB ? gapE(r.b, Q.LB) : Infinity);
        if (pg.L.phone && Q.multi) Q.slots.forEach(function (sl) { if (sl.tap) d = Math.min(d, gapE(r.b, { x0: sl.tap.x0 / pg.L.cs, y0: sl.tap.y0 / pg.L.cs, x1: sl.tap.x1 / pg.L.cs, y1: sl.tap.y1 / pg.L.cs })); });
        if (d < oth) { oth = d; on = Q.name; }
      });
      if (oth < need - 1e-9) { a.astray++; a.who.push(nm(r) + ' astray (' + Math.round(dOwn * 10) / 10 + ' own, ' + Math.round(oth * 10) / 10 + ' ' + on + ', cells)'); }
      if (ancGap(r.b, P.ancP || [sqBox(P)]) > roomCap() + 1e-9) { a.loose++; a.who.push(nm(r) + ' loose'); }
      for (var y3 = Math.max(0, r.b.y0); y3 < Math.min(Rw, r.b.y1); y3++) for (var x3 = Math.max(0, r.b.x0); x3 < Math.min(C, r.b.x1); x3++) if (occ[y3 * C + x3] & COAST) a.roomCoast++;
    });
    function bx(b) { return b ? [b.x0, b.y0, b.x1, b.y1] : null; }
    /* (each room's nearness, round 5: its gap and his act's from the venue's stop, name and pictures, in cells; those
       past ROOM_CAP listed, softly: roomFar) */
    a.roomFar = [];
    a.v = S.PL.map(function (P) {
      var anc = P.anc || sqBox(P), fig = null, dR = null, dF = null;
      if (P.room) {
        dR = ancGap(P.room, P.ancP || [anc]); dF = 0;
        (P.figs || []).forEach(function (f) { var b = { x0: P.room.x0 + f.x0, y0: P.room.y0 + f.y0, x1: P.room.x0 + f.x1, y1: P.room.y0 + f.y1 }; fig = fig ? unite(fig, b) : b; dF = Math.max(dF, gapE(b, sqBox(P))); });
        if (dR > roomCap() + 1e-9) a.roomFar.push(P.name + ' ' + Math.round(dR * 10) / 10);
      }
      return { n: P.name, sq: [P.sq.x0, P.sq.y0, P.sq.x1 + 1, P.sq.y1 + 1], row: bx(P.LB), tb: bx(P.tb), md: P.mdAt ? [P.mdAt.x, P.mdAt.y, P.md.length] : null, room: bx(P.room), fig: bx(fig), anc: bx(anc), dR: dR, dF: dF, flag: bx(P.fbox), side: P.side,
        lead: P.lead ? [P.lead[0], P.lead[P.lead.length - 1], P.lead.length] : null,
        sl: P.slots.map(function (sl) { return { sp: sl.sport, pic: bx(sl.pic) }; }) };
    });
    /* where what is at hand is shown on this screen (map: cards by the venues, those that found no place in the
       column, colCards; col: the column), the cards placed, and any that could not be */
    a.mode = S.mode; a.cards = S.mode === 'map' ? Object.keys(S.cards).length : 0; a.cardFail = S.cardFail || [];
    a.colCards = Object.keys(S.colKeys || {}); a.avoid = Object.keys(S.avoid || {});
    /* the flags' places over a road (flagRoad); on a phone, a name, a picture or medals in the page's side margin
       (nameEdge); the rows alike, each on one line or each on two (wrap) */
    a.flagRoad = 0;
    S.PL.forEach(function (P) { (P.fcells || []).forEach(function (q) { if (q[0] >= 0 && q[1] >= 0 && q[0] < C && q[1] < Rw && (occ[q[1] * C + q[0]] & ROAD)) { a.flagRoad++; a.who.push(P.name + ' flag on a road'); } }); });
    a.nameEdge = 0; a.wrap = !!pg.L.wrap;
    if (pg.L.phone) {
      var mr0 = { left: dom.edge.left }, vw0 = dom.edge.vw, mg0 = dom.edge.mg;
      S.PL.forEach(function (P, pi) {
        var bs = [dom.edge.labs[pi]].map(function (r) { return [r[0] + 1, r[1] - 1]; });
        P.slots.forEach(function (sl) { if (sl.pic) bs.push([mr0.left + sl.pic.x0 * pg.L.cs, mr0.left + sl.pic.x1 * pg.L.cs]); });
        if (P.mdAt) bs.push([mr0.left + P.mdAt.x * pg.L.cs, mr0.left + (P.mdAt.x + P.md.length * 6 - 1) * pg.L.cs]);
        if (bs.some(function (b) { return b[0] < mg0 - 0.5 || b[1] > vw0 - mg0 + 0.5; })) { a.nameEdge++; a.who.push(P.name + ' in the margin'); }
      });
    }
    /* every card placed on this screen, checked: over a name, a picture, medals, a stop, a flag's place, a leader, a
       road, the key, the column's words or its own scene (cardOver); not clearly its own venue's, nearer another
       than 0.6 of that one's distance or within APART px of it (cardNear); more than REACH px from its own
       (cardFar); within 40px of the column's words or on their lines within 120px (cardCol); across its venue from
       its scene (cardSide, a cost); the coast and lake cells under it (cardCoast, a cost). cardsAt: key, box
       (cells), px to its venue, px to the nearest other */
    a.cardOver = 0; a.cardNear = 0; a.cardFar = 0; a.cardCol = 0; a.cardSide = 0; a.cardCoast = 0; a.cardRow = 0; a.cardsAt = [];
    var wset = {};
    for (var wi = 0; wi + 1 < (pg.L.water || []).length; wi += 2) wset[pg.L.water[wi + 1] * C + pg.L.water[wi]] = 1;
    Object.keys(S.cards).forEach(function (key) {
      var c = S.cards[key], b = c.b, P = c.P, ov = [], cs = pg.L.cs;
      S.PL.forEach(function (Q) {
        if (Q.tb && hit(b, Q.tb)) ov.push(Q.name + ' name');
        Q.slots.forEach(function (sl) { if (sl.pic && hit(b, sl.pic)) ov.push(Q.name + ' picture'); });
        if (Q.mdAt && hit(b, { x0: Q.mdAt.x, y0: Q.mdAt.y, x1: Q.mdAt.x + Q.md.length * 6 - 1, y1: Q.mdAt.y + 5 })) ov.push(Q.name + ' medals');
        if (hit(b, sqBox(Q))) ov.push(Q.name + ' stop');
        if (Q.fbox && hit(b, Q.fbox)) ov.push(Q.name + ' flag');
        if (Q.lead && Q.lead.some(function (d) { return d[0] >= b.x0 && d[0] < b.x1 && d[1] >= b.y0 && d[1] < b.y1; })) ov.push(Q.name + ' leader');
      });
      var rd = 0, co = 0, y, x;
      for (y = Math.max(0, b.y0); y < Math.min(Rw, b.y1); y++) for (x = Math.max(0, b.x0); x < Math.min(C, b.x1); x++) {
        if (occ[y * C + x] & ROAD) rd++;
        if ((occ[y * C + x] & COAST) || wset[y * C + x]) co++;
      }
      if (rd) ov.push(rd + ' road cells');
      if (pg.L.keyB && hit(b, { x0: pg.L.keyB.x0 + 1, y0: pg.L.keyB.y0 + 1, x1: pg.L.keyB.x1 - 1, y1: pg.L.keyB.y1 - 1 })) ov.push('the key');
      if ((pg.L.colT || []).some(function (t) { return hit(b, t); })) ov.push('the column');
      if (c.sel && playable(c.sel) && P.room && hit(b, P.room)) ov.push('its scene');
      if (ov.length) { a.cardOver += ov.length; a.who.push(key + ' over ' + ov.join(', ')); }
      var dOwn = dmin(b, ownParts(P, c.sel)), dOther = dmin(b, otherWholes(P));
      if (dOwn > 0.6 * dOther + 1e-9 || dOther * cs < APART - 1e-6) { a.cardNear++; a.who.push(key + ' near another (' + Math.round(dOwn * cs) + ' vs ' + Math.round(dOther * cs) + 'px)'); }
      if (dOwn * cs > REACH + 2) { a.cardFar++; a.who.push(key + ' far (' + Math.round(dOwn * cs) + 'px)'); }
      if (besideRow(b, P)) { a.cardRow++; a.who.push(key + ' on a name\'s line'); }
      (pg.L.colT || []).forEach(function (t) {
        var dx = Math.max(0, b.x0 - t.x1, t.x0 - b.x1) * cs, vo = Math.min(b.y1, t.y1) - Math.max(b.y0, t.y0);
        if (gapE(b, t) * cs < 40 - 1e-6 || (vo > 0 && dx < 120 - 1e-6)) { a.cardCol++; a.who.push(key + ' by the column (' + Math.round(gapE(b, t) * cs) + 'px)'); }
      });
      if (c.sel && playable(c.sel) && P.room) {
        var q = sqBox(P), sx = (q.x0 + q.x1) / 2, sy = (q.y0 + q.y1) / 2, rr = P.room;
        if (((b.x0 + b.x1) / 2 - sx) * ((rr.x0 + rr.x1) / 2 - sx) + ((b.y0 + b.y1) / 2 - sy) * ((rr.y0 + rr.y1) / 2 - sy) < 0) { a.cardSide++; a.who.push(key + ' across from its scene'); }
      }
      a.cardCoast += co;
      a.cardsAt.push([key, b.x0, b.y0, b.x1, b.y1, Math.round(dOwn * cs), Math.round(dOther * cs)]);
    });
    a.man = pg.L.home ? [pg.L.home.fx, pg.L.home.fy] : null;
    a.boxes = sc.length;
    a.cols = C; a.cs = pg.L.cs; a.hard = pg.L.hard; a.ms = pg.L.ms; a.cms = pg.L.cms; a.small = dom.small; a.cmp = dom.cmp; a.lowSky = !!pg.L.lowSky;
    return a;
  }
  /* the scene he plays at the venue in hand (none: he stands there) */
  function playable(sel) { return sel && sel.slot && sel.slot.A && sel.P.room ? sel.slot : null; }
  Object.assign(pg, { SOLVED: SOLVED, apply: apply, audit: audit, buildSteps: buildSteps, cardGridSteps: cardGridSteps, cardPlaceSteps: cardPlaceSteps, gpt: gpt, lowSky: lowSky, pickGrid: pickGrid, playable: playable, roomRepair: roomRepair, roomRepairSteps: roomRepairSteps, solidAt: solidAt, solve: solve, terrainSteps: terrainSteps });
}
