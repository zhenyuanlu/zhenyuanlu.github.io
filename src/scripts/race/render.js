// The race map's renderer: the stage's colours for every drawing (colours), the map itself on its canvas (the
// terrain's whisper, the lakes, the state lines, the coast, the season's highways, the stops, the rows' leaders and
// strips of paper, the medals, the sports' pictures in grey, in ink while in hand, on a faint chip when pointed at),
// and the medal discs beside words (a card, the column, the key). Whole cells of whole device pixels; the HD
// drawings where a cell is 4 device px or more. Ported from the draft (design/assets/v2ac/race.js); each comment is
// the draft's own.
import { half, hdOn, picOf } from './art.js';
import { css, over, rgb, tint, tintC } from './colour.js';
import { BOX, DISC, DISC2, FLAG, GLASS, LAB, LAKE, MAN, MED, MED_F_NIGHT, MED_RIM, RED, RING, RING2, STOP, TERR, WXC } from './consts.js';

export function installRender(pg) {
  var ACTS = pg.ACTS, S = pg.S, cv = pg.cv;
  /* ---------- drawing ---------- */
  function colours() {
    var T = pg.tok(), st = pg.stage(), ink = rgb(T.ink), bg = rgb(T.bg), grey = rgb(T.grey);
    var gl = ACTS.stand && (st === 'night' ? ACTS.stand.paletteNight : st === 'dusk' ? ACTS.stand.paletteDusk : ACTS.stand.palette);
    var K = { st: st, ink: ink, bg: bg, inkC: css(ink), bgC: css(bg), greyC: css(grey),
      coast: css(over(ink, bg, 0.42)), border: css(over(ink, bg, 0.16)), road: css(over(ink, bg, 0.88)), hair: css(over(ink, bg, 0.34)), lead: css(over(ink, bg, 0.52)), club: css(over(ink, bg, 0.3)), light: css(over(ink, bg, st === 'night' ? 0.4 : 0.5)), faint: css(over(ink, bg, 0.2)),
      pic: css(over(ink, bg, 0.58)), picOn: css(over(ink, bg, 0.9)), chip: css(over(ink, bg, st === 'night' ? 0.13 : 0.12)),
      dot: css(over(ink, bg, st === 'night' ? 0.08 : 0.11)), mark: css(over(ink, bg, st === 'night' ? 0.24 : 0.3)),
      lake: css(over(tintC(LAKE[0], st === 'dusk' ? 'day' : st, bg), bg, LAKE[1][st] || LAKE[1].day)),
      ring: css(over(ink, bg, 0.67)),
      glass: (gl && gl.i) || GLASS[st] || GLASS.day, wx: {}, red: tint(RED, st === 'dusk' ? 'day' : st, bg) };
    Object.keys(WXC).forEach(function (k) { K.wx[k] = css(st === 'night' ? rgb(WXC[k].night) : tintC(WXC[k][st] || WXC[k].day, st === 'dusk' ? 'day' : st, bg)); });
    return K;
  }
  /* a medal: v7b's flat disc, its outer cells (the qualified ring's) a step toward the ink, so gold and silver hold
     on the light paper (by night the rim lightens instead); a heat that qualified: the ring alone, grey */
  function discs(c, list, x0, y0, u, K) {
    var hd = hdOn(u), n = hd ? 10 : 5, D = hd ? DISC2 : DISC, Rg = hd ? RING2 : RING;
    list.forEach(function (m, j) {
      var nf = m === 'f' && K.st === 'night', base = m === 'q' ? null : nf ? MED_F_NIGHT.fill : MED[m] || MED[3];
      var rim = nf ? css(MED_F_NIGHT.rim) : base ? css(over(K.ink, base, MED_RIM)) : K.ring, fill = base ? css(base) : null;
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        if (Rg[y][x] === '#') c.fillStyle = rim;
        else if (fill && D[y][x] === '#') c.fillStyle = fill;
        else continue;
        if (hd) half(c, (x0 + j * 6) * u, y0 * u, u, x, y); else c.fillRect((x0 + j * 6 + x) * u, (y0 + y) * u, u, u);
      }
    });
  }
  function drawBase() {
    if (!pg.L) return;
    var c = cv.getContext('2d'), u = pg.L.u, K = colours(), i, s = pg.shown();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = K.dot;
    for (i = 0; i < pg.L.dots.length; i += 2) c.fillRect(pg.L.dots[i] * u, pg.L.dots[i + 1] * u, u, u);
    c.fillStyle = K.lake;
    for (i = 0; i < pg.L.water.length; i += 2) c.fillRect(pg.L.water[i] * u, pg.L.water[i + 1] * u, u, u);
    c.fillStyle = K.mark;
    for (i = 0; i < pg.L.terr.length; i += 2) c.fillRect(pg.L.terr[i] * u, pg.L.terr[i + 1] * u, u, u);
    c.fillStyle = K.border;
    for (i = 0; i < pg.L.border.length; i += 2) {
      var bx = pg.L.border[i], by = pg.L.border[i + 1];
      if ((bx + by) % 4 || (pg.L.occ[by * pg.L.cols + bx] & (TERR | LAB | BOX | MAN | FLAG))) continue;
      /* (nor in the block of the column's words, where a state line's last few dots read as specks among them: terrain) */
      if (pg.L.blk && bx >= pg.L.blk.x0 && bx < pg.L.blk.x1 && by >= pg.L.blk.y0 && by < pg.L.blk.y1) continue;
      c.fillRect(bx * u, by * u, u, u);
    }
    c.fillStyle = K.coast;
    for (i = 0; i < pg.L.coast.length; i += 2) { var cx0 = pg.L.coast[i], cy0 = pg.L.coast[i + 1]; if (!(pg.L.occ[cy0 * pg.L.cols + cx0] & STOP)) c.fillRect(cx0 * u, cy0 * u, u, u); }
    c.fillStyle = K.road;
    for (i = 0; i < pg.L.road.length; i += 2) c.fillRect(pg.L.road[i] * u, pg.L.road[i + 1] * u, u, u);
    /* the stops, a cell of paper round each; the one in hand (shown or pinned) open */
    S.PL.forEach(function (P) {
      var q = P.sq;
      c.clearRect((q.x0 - 1) * u, (q.y0 - 1) * u, (q.x1 - q.x0 + 3) * u, (q.y1 - q.y0 + 3) * u);
      c.fillStyle = K.inkC;
      c.fillRect(q.x0 * u, q.y0 * u, (q.x1 - q.x0 + 1) * u, (q.y1 - q.y0 + 1) * u);
      if (pg.inHand(P)) c.clearRect((q.x0 + 1) * u, (q.y0 + 1) * u, (q.x1 - q.x0 - 1) * u, (q.y1 - q.y0 - 1) * u);
      if (P.lead) { c.fillStyle = K.hair; P.lead.forEach(function (d) { c.fillRect(d[0] * u, d[1] * u, u, u); }); }
      /* its row's strip of paper under its pictures and medals (none on a road: there the road shows) */
      if (P.LB && !P.bare) c.clearRect(P.LB.x0 * u, P.LB.y0 * u, (P.LB.x1 - P.LB.x0) * u, (P.LB.y1 - P.LB.y0) * u);
      if (P.mdAt) discs(c, P.md, P.mdAt.x, P.mdAt.y, u, K);
      /* the pictures: grey; in ink while their venue is in hand; the one pointed at or in hand (its sport's, or a
         venue of one sport's) also in its accent, on a faint chip of the ink (round 5, the owner: "hover static icon，
         多少需要一点略微再明显一点的反馈…特别是sled"; a rectangle a cell larger, its corners cut: no disc, no line under) */
      P.slots.forEach(function (sl) {
        if (!sl.pic || !sl.A) return;
        var pi = sl.pi || picOf(sl.A), on = pg.inHand(P), hv = !!(S.hover && S.hover.sel && S.hover.sel.slot === sl);
        var acc = (on || hv) && (!P.multi || (s && s.P === P && s.slot === sl) || (S.pin && S.pin.P === P && S.pin.slot === sl) || hv);
        var col = acc ? K.inkC : on || hv ? K.picOn : K.pic, b = sl.pic;
        if (acc) {
          /* (the chip within its row's strip of paper: over nothing of the map's) */
          var lb = P.LB || { x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9 };
          c.fillStyle = K.chip;
          [[b.x0 - 1, b.y0, b.x1 + 1, b.y1], [b.x0, b.y0 - 1, b.x1, b.y1 + 1]].forEach(function (q) {
            var x0 = Math.max(q[0], lb.x0), y0 = Math.max(q[1], lb.y0), x1 = Math.min(q[2], lb.x1), y1 = Math.min(q[3], lb.y1);
            if (x1 > x0 && y1 > y0) c.fillRect(x0 * u, y0 * u, (x1 - x0) * u, (y1 - y0) * u);
          });
        }
        var hd = hdOn(u) && pi.hd;   /* (big screens: its HD variant, in half cells) */
        (hd || pi.rows).forEach(function (r, jj) {
          for (var ii = 0; ii < r.length; ii++) {
            var ch = r[ii], rs = pi.rest && pi.rest[ch];
            if (ch === '.') continue;
            c.fillStyle = acc && pi.pal[ch] ? tint(pi.pal[ch], K.st, K.bg) : rs != null && !acc ? (on || hv ? K.pic : css(over(K.ink, K.bg, rs))) : col;
            if (hd) half(c, b.x0 * u, b.y0 * u, u, ii, jj); else c.fillRect((b.x0 + ii) * u, (b.y0 + jj) * u, u, u);
          }
        });
      });
    });
  }
  /* medal discs beside words (the card, the column, the key): cells of 1.5 CSS px on whole device pixels */
  function drawDiscCanvases(root, sizeOnly) {
    var K = sizeOnly ? null : colours(), dpr = pg.DPR(), cd = Math.max(1, Math.round(1.5 * dpr)), Z = pg.zoom, fig;
    /* (the big-screen mode: grown from their cell on the plain page, in step with the counts' figures, which lead
       (2px cells, inner.js paintPixels): design/assets/zoom/wide.js, its point 2) */
    if (Z && Z.k > 1 && Z.grow) {
      fig = [Math.max(1, Math.round(2 * pg.realDPR())), Math.max(1, Math.round(2 * dpr))];
      cd = Z.grow(Math.max(1, Math.round(1.5 * pg.realDPR())), cd, [fig.concat(Z.grow(fig[0], fig[1]))]);
    }
    [].forEach.call(root.querySelectorAll('canvas.r-md'), function (cvs) {
      var list = String(cvs.getAttribute('data-m') || '').split(',').filter(Boolean).map(function (v) { return v === 'q' || v === 'f' ? v : +v; });
      var w = Math.max(1, list.length * 6 - 1);
      cvs.width = w * cd; cvs.height = 5 * cd;
      cvs.style.width = (w * cd / dpr) + 'px'; cvs.style.height = (5 * cd / dpr) + 'px';
      if (sizeOnly) return;   /* (a card being measured: its medals' room, nothing drawn) */
      var g = cvs.getContext('2d');
      g.clearRect(0, 0, cvs.width, cvs.height);
      discs(g, list, 0, 0, cd, K);
      cvs.style.transform = '';
    });
  }
  Object.assign(pg, { colours: colours, drawBase: drawBase, drawDiscCanvases: drawDiscCanvases });
}
