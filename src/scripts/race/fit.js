// The race page fitted to one screen: the phone's stacked layout (narrow), the screen's pixel ratio, the desktop's
// rhythm by the window's height, the column's words (where the map runs under them, the cards keep off them), the
// column closing up on a short screen, the grid the window gets (measure, deskGrid, then layout.js pickGrid) and the
// page set to it (fit: the canvases, the map's and the timeline's boxes, the gutters), the room a phone does not
// need shared out (breathe), and a resize that lays the map out again only when its grid changes. Ported from the
// draft (design/assets/v2ac/race.js); each comment is the draft's own. The big-screen mode (phase 5) is the zoom
// hook, pg.zoom (the draft's window.__zoom), null on the plain page.
import { BIGCS, CMP_H } from './consts.js';
import { clamp, unite } from './util.js';

export function installFit(pg) {
  var GH = pg.GH, GW = pg.GW, NODES = pg.NODES, S = pg.S, SEAS = pg.SEAS, YEARS = pg.YEARS, cardsEl = pg.cardsEl, clv = pg.clv, cv = pg.cv, gridEl = pg.gridEl, handEl = pg.handEl, infoEl = pg.infoEl, keyEl = pg.keyEl, mapEl = pg.mapEl, moEl = pg.moEl, pxEl = pg.pxEl, scv = pg.scv, sea = pg.sea, stageEl = pg.stageEl, statsEl = pg.statsEl, tlEl = pg.tlEl, tpxEl = pg.tpxEl, tr = pg.tr, yearsEl = pg.yearsEl;
  /* the race page's own phone layout (stacked): under 700px wide, or under 580px tall at any width (a phone held
     sideways; a short window, where the desktop's one screen leaves 2026's map too small for its venues: round 5's
     check found Rhode Island's medal cut by the map's edge at 1280 x 560, pictures spilling under 540); from there up
     it is laid out as a desktop's (race.css) */
  function narrow() { return window.matchMedia ? matchMedia('(max-width: 699.98px), (max-height: 579.98px)').matches : window.innerWidth < 700 || window.innerHeight < 580; }
  /* the screen's pixel ratio, its float noise taken off (a headless or zoomed browser may report 1.0000000447) */
  function DPR() { var d = window.devicePixelRatio || 1, r = Math.round(d * 100) / 100; return Math.abs(d - r) < 1e-4 ? r : d; }
  /* big screens (2026-10-09, the owner: "yes，scale up，你可以用更好的像素图来表示"): past 1440 x 900 the page is zoomed
     (design/assets/zoom/zoom.js), its px z of the window's and devicePixelRatio z times the screen's, so every cell
     here is still whole device pixels. The browser's own CSS px are the window's, though: where a size must land on
     its 64ths (the map's, the timeline's) or a point is put in them (local), the window's px and the screen's own ratio
     are reasoned in. Without the engine, or at z 1, both are as they were */
  function ZM() { var Z = pg.zoom; return Z && Z.z > 1 ? Z.z : 1; }
  function realDPR() { var Z = pg.zoom, d = Z && Z.z > 1 ? Z.dpr() : window.devicePixelRatio || 1, r = Math.round(d * 100) / 100; return Math.abs(d - r) < 1e-4 ? r : d; }
  /* (the window's numbers the grid is picked by: layout.js pickGrid) */
  function env() { return { dpr: DPR(), rd: realDPR(), ww: window.innerWidth }; }
  function px(e, p) { return e ? parseFloat(getComputedStyle(e)[p]) || 0 : 0; }
  function below() {
    /* (a page that knows its own frame says it: opts.below) */
    if (pg.belowOf) return pg.belowOf();
    /* (the ring and the footer of the frame the page stands in: the frame's own, or its twin's while the page is
       made ready out of sight) */
    var s = px(pg.main, 'paddingBottom'), fr = sea.closest('.pre') || document.getElementById('inner') || document;
    ['.ring', '.close', 'footer.if'].forEach(function (q) {
      var e = fr.querySelector(':scope > ' + q) || fr.querySelector(q);
      if (!e || e.hidden || getComputedStyle(e).display === 'none') return;
      /* the selective big-screen mode (design/assets/zoom/wide.js): the ring and the footer never grow, they stand in
         boxes zoomed back to the window's px, so their own px are 1 / z of the page's (1 where the frame stays 960px) */
      var Z = pg.zoom, own = Z && Z.k > 1 && e.currentCSSZoom ? e.currentCSSZoom / Z.z : 1;
      s += (e.offsetHeight + px(e, 'marginTop') + px(e, 'marginBottom')) * own;
    });
    return s;
  }
  /* where the details take the column it holds its tallest state, and when a desktop's screen is too short for it
     the column closes up: its gaps first, then the title block's; its gaps also where that leaves the cards their
     places by their venues (S.tightMin: full) */
  function fitColumn() {
    sea.classList.remove('r-tight', 'r-tighter', 'r-tightest');
    sea.classList.toggle('r-col', S.mode === 'col');
    handEl.style.minHeight = '';
    if (S.mode === 'col' || pg.anyCol()) handEl.style.minHeight = Math.max(pg.handMax(), S.colHold || 0) + 'px';
    /* (round 11: or the height it held when its cards went back to the map: backSteps) */
    else if (S.colHold) handEl.style.minHeight = S.colHold + 'px';
    if (narrow()) return;
    var avail = window.innerHeight - (gridEl.getBoundingClientRect().top + window.scrollY) - below() - rhythm().b - 1;
    function need() { return handEl.getBoundingClientRect().bottom - gridEl.getBoundingClientRect().top; }
    if (S.tightMin || need() > avail) sea.classList.add('r-tight');
    if (need() > avail) sea.classList.add('r-tighter');
    if (need() > avail) sea.classList.add('r-tightest');
  }
  /* the desktop's rhythm, by the screen's height (CSS px): the map's top level with the title's (40px under the
     header; 22 on a short screen), the timeline a step under the map, and about the same breath under the
     timeline, before the ring, as over the map */
  function rhythm() {
    var f = clamp((window.innerHeight - 640) / 160, 0, 1);
    return { a: Math.round(22 + 18 * f), g: Math.round(8 + 4 * f), b: Math.round(20 + 16 * f) };
  }
  /* the column's words on a desktop (page px): the title (and a lede, if a page gave one), the counts, the season switch, and what is
     at hand (as tall as it is held) */
  function textBoxes(rest) {
    var out = [], sx = window.scrollX, sy = window.scrollY;
    function add(r) { if (r && r.right > r.left && r.bottom > r.top) out.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy }); }
    var tc = pg.tbEl.querySelector('canvas');
    if (tc) add(tc.getBoundingClientRect());
    var d = pg.tbEl.querySelector('.tb-d');
    if (d) { var rg = document.createRange(); rg.selectNodeContents(d); add(rg.getBoundingClientRect()); }
    /* (the counts: their track's own box, .r-stats. Since draft v2t's taste item 41 they stand as a grid of two rows,
       whose parts, .r-st, are display: contents and so no boxes of their own: measured, they gave none, and the map's
       names and cards were not kept off the counts) */
    if (statsEl.querySelector('.r-st')) add(statsEl.getBoundingClientRect());
    var ys = yearsEl ? yearsEl.querySelectorAll('.r-y') : [];
    if (ys.length) { var a = ys[0].getBoundingClientRect(), b = ys[ys.length - 1].getBoundingClientRect(); add({ left: a.left, top: Math.min(a.top, b.top), right: b.right, bottom: Math.max(a.bottom, b.bottom) }); }
    /* (what is at hand as it is held, where the details may take the column; or, rest, as it is at rest: a card is
       shown only while the column is at rest) */
    if (!rest && (S.mode === 'col' || pg.anyCol() || S.colHold)) add(handEl.getBoundingClientRect());
    else { var nx = handEl.querySelector('.r-nx'); if (nx) add(nx.getBoundingClientRect()); }
    return out;
  }
  /* the sizes of the page's words (the names, the column's lines, the key, the months, a card's lines): what the
     placing was worked out for. The type coming late, or a page put up again, lays the map out anew only when one
     of them has changed */
  function sig() {
    var a = [];
    S.PL.forEach(function (P) { if (P.lab) a.push(P.lab.offsetWidth, P.lab.offsetHeight); });
    textBoxes(true).forEach(function (b) { a.push(Math.round((b.x1 - b.x0) * 8), Math.round((b.y1 - b.y0) * 8)); });
    a.push(keyEl.offsetWidth, keyEl.offsetHeight);
    [].forEach.call(moEl.querySelectorAll('.r-mn'), function (e) { a.push(e.offsetWidth); });
    var m = pg.measureCard('<p class="c-m"><span class="num">0123456789</span></p><p class="c-n">Hamburgefonstiv</p><p class="c-c">abc xyz</p>', 400, false, true);
    a.push(m.w, m.h);
    return a.join(',');
  }
  function union(T) {
    if (!T.length) return null;
    var u = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    T.forEach(function (b) { u.x0 = Math.min(u.x0, b.x0); u.y0 = Math.min(u.y0, b.y0); u.x1 = Math.max(u.x1, b.x1); u.y1 = Math.max(u.y1, b.y1); });
    return u;
  }
  /* no venue of any season (its stop, with room round it for its name) under the words */
  function clearOf(g, T) {
    var k = g.cols / GW, cs = g.cs, ok = true;
    YEARS.forEach(function (y) {
      (SEAS[y] || []).forEach(function (r) {
        var n = pg.nodeFor(r);
        if (n == null || !NODES[n]) return;
        var X = g.x0 + (Math.floor((NODES[n][0] + 0.5) * k) + 0.5) * cs, Y = g.y0 + (Math.floor((NODES[n][1] + 0.5) * k) + 0.5) * cs;
        T.forEach(function (b) { if (X > b.x0 - 28 && X < b.x1 + 28 && Y > b.y0 - 18 && Y < b.y1 + 18) ok = false; });
      });
    });
    return ok;
  }
  /* a desktop: the map as large as the screen allows, against the column's right edge, its top level with the
     title's. Where it is wider than the room beside the words, it runs under them, into its own blank west, and
     the words lie on its paper; should a venue of any season fall under them, it stays beside them instead. Any
     height it cannot take goes over it, all of it (round 4's; the owner, round 3: blank paper over the map "可以留白",
     but an empty band under the timeline is clutter; round 5's share of it under the timeline, half on a tall
     screen, left 94 to 156px there): the map and the timeline come down together toward the ring, the timeline
     keeping its breath of rhythm() over it. The timeline runs across the column under the words and the map, or
     under the map alone where the words reach down beside it */
  function deskGrid() {
    var rh = rhythm(), sr = stageEl.getBoundingClientRect(), colL = sr.left + window.scrollX, colR = colL + stageEl.clientWidth;
    var top0 = gridEl.getBoundingClientRect().top + window.scrollY, A0 = Math.min(px(pg.tbEl, 'paddingTop'), rh.a), tlH = pg.tlHeight();
    var Ha = window.innerHeight - top0 - A0 - rh.g - tlH - rh.b - below() - 1;
    var T = textBoxes(), TU = union(T), gut = px(gridEl, 'columnGap') || 24;
    function make(Wa) {
      var g = pg.pickGrid(Wa, Math.max(Ha, 180), false, env()), H = g.rows * g.cs, Ex = Math.max(0, Ha - H);
      g.A = A0 + Math.round(Ex);
      g.x0 = colR - g.cols * g.cs; g.y0 = top0 + g.A;
      return g;
    }
    var g = make(colR - colL);
    if (TU && g.x0 < TU.x1 + gut && !clearOf(g, T)) g = make(Math.max(200, colR - TU.x1 - gut));
    g.phone = false; g.rh = rh; g.colR = colR; g.colL = colL; g.dx = Math.round((g.x0 - colL) * 64);
    var tlTop = g.y0 + g.rows * g.cs + rh.g;
    g.tlL = !TU || TU.y1 + 14 <= tlTop ? colL : Math.max(g.x0, TU.x1 + gut);
    return g;
  }
  function measure() {
    var phone = narrow(), Ha;
    stageEl.style.paddingTop = ''; infoEl.style.paddingTop = '';
    if (phone) S.mode = 'col';
    fitColumn();
    if (!phone) return deskGrid();
    /* a phone: the height the header, the title, the timeline, what is at hand (its tallest), the ring and the
       footer leave, up to the whole width; but never narrower than about two thirds of the screen */
    var Wa = document.documentElement.clientWidth, ptop = mapEl.getBoundingClientRect().top + window.scrollY;
    var fitH = window.innerHeight - ptop - (pg.tlHeight() + px(tlEl, 'marginTop')) - px(stageEl, 'paddingBottom') - infoEl.offsetHeight - below() - 2;
    Ha = Math.min(Wa * GH / GW + 2, Math.max(fitH, Math.min(0.56 * Wa * GH / GW, Math.max(window.innerHeight - 90, 200))));
    /* (a touch screen under 1000px wide where the page scrolls whatever the map's size, a phone held sideways: the map
       at its own size, its GW columns a CSS px each, or as wide as the window allows, whatever the window's height.
       The browser's bar hiding or showing as the page scrolls changes that height alone, so the grid stays as it is
       (same2) and the map is not laid out again under the finger: by the height, 750 x 340 and 750 x 390 had maps of
       348 x 250 and 400 x 287, and each change of the bar laid the map out again, 185 to 347ms on a phone four times
       slower (the phone audit, 2026-10-17). By the whole width, as a phone upright is, its cells would be 4 device
       px at 3x, a map of 532 x 380, taller than the window the sticky header leaves) */
    if (fitH < 0.56 * Wa * GH / GW && window.matchMedia && matchMedia('(max-width: 999px) and (hover: none)').matches) Ha = Math.min(Wa, GW) * GH / GW + 2;
    var g = pg.pickGrid(Wa, Math.max(Ha, 150), true, env());
    g.phone = true;
    return g;
  }
  function fit(g) {
    pg.L = { phone: g.phone, u: g.u, cs: g.cs, cols: g.cols, rows: g.rows, dpr: g.dpr, k: g.cols / GW, A: g.A, dx: g.dx, tlL: g.tlL, colR: g.colR };
    pg.L.xl = g.phone ? 0 : Math.max(0, Math.floor((g.x0 - g.colL) / g.cs + 1e-6));
    pg.L.W = pg.L.cols * pg.L.cs; pg.L.H = pg.L.rows * pg.L.cs;
    /* a small map (a desktop's, under CMP_H px tall) sets its cards a size smaller (race.css), so they find room by
       their venues; a large screen's coarse grid (cells of BIGCS px or more) sets the map's words a size larger, so
       they keep their measure beside its pictures. (Small on the screen: in the big-screen mode the map is drawn z
       times larger than its own px, so it is measured in the window's: a 2560 x 1440 window's map, 574 of its own px
       tall, stands 861px tall and keeps the full-size cards, as the draft has them) */
    cardsEl.classList.toggle('r-cmp', !pg.L.phone && pg.L.H * ZM() < CMP_H);
    pg.L.big = !pg.L.phone && pg.L.cs >= BIGCS - 1e-6 && !S.plain;
    sea.classList.toggle('r-big', pg.L.big);
    [cv, scv, tr, clv].forEach(function (c) { c.width = pg.L.cols * pg.L.u; c.height = pg.L.rows * pg.L.u; c.style.width = pg.L.W + 'px'; c.style.height = pg.L.H + 'px'; });
    mapEl.style.width = pg.L.W + 'px'; mapEl.style.height = pg.L.H + 'px';
    pxEl.style.width = pg.L.W + 'px'; pxEl.style.height = pg.L.H + 'px';
    tlEl.style.height = pg.tlHeight() + 'px';
    if (pg.L.phone) { stageEl.style.paddingTop = ''; tlEl.style.marginTop = ''; pg.L.TW = pg.main.clientWidth; }
    else { stageEl.style.paddingTop = g.A + 'px'; tlEl.style.marginTop = g.rh.g + 'px'; pg.L.TW = Math.round(g.colR - g.tlL); }
    tlEl.style.width = pg.L.TW + 'px';
    /* on a phone the map may run to the screen's edges, but its words, pictures, rooms and key keep the page's
       gutter (cells kept clear on its left and right) */
    pg.L.gl = pg.L.gr = pg.L.nl = pg.L.nr = 0;
    /* (on a desktop a name's words may reach left of the map, over the column's blank paper under its words) */
    if (!pg.L.phone) pg.L.nl = -pg.L.xl;
    if (pg.L.phone) {
      pg.L.nl = pg.L.nr = Math.ceil(((document.documentElement.clientWidth - pg.main.clientWidth) / 2 - (document.documentElement.clientWidth - pg.L.W) / 2) / pg.L.cs - 1e-6);
      pg.L.gl = pg.L.gr = Math.max(0, pg.L.nl);
    }
    /* the column's words where the map runs under them (a desktop), in cells, with two cells of paper round them */
    pg.L.txtB = [];
    /* and every one of them as it is (colT), their union (colU), and where a card may not lie for them (guard: 40px
       of paper round each, and 120px either side along its lines) */
    pg.L.colT = []; pg.L.guard = []; pg.L.colU = null;
    if (!pg.L.phone) {
      var mr = mapEl.getBoundingClientRect(), mx = mr.left + window.scrollX, my = mr.top + window.scrollY, gd = 40 / pg.L.cs, gr = 120 / pg.L.cs;
      textBoxes().forEach(function (b) {
        var c = { x0: Math.floor((b.x0 - mx) / pg.L.cs) - 2, y0: Math.floor((b.y0 - my) / pg.L.cs) - 2, x1: Math.ceil((b.x1 - mx) / pg.L.cs) + 2, y1: Math.ceil((b.y1 - my) / pg.L.cs) + 2 };
        if (c.x1 > 0 && c.y1 > 0 && c.x0 < pg.L.cols && c.y0 < pg.L.rows) pg.L.txtB.push(c);
      });
      textBoxes(true).forEach(function (b) {
        var t = { x0: (b.x0 - mx) / pg.L.cs, y0: (b.y0 - my) / pg.L.cs, x1: (b.x1 - mx) / pg.L.cs, y1: (b.y1 - my) / pg.L.cs };
        pg.L.colT.push(t);
        pg.L.guard.push({ x0: t.x0 - gd, y0: t.y0 - gd, x1: t.x1 + gd, y1: t.y1 + gd }, { x0: t.x0 - gr, y0: t.y0, x1: t.x1 + gr, y1: t.y1 });
      });
      pg.L.colU = pg.L.colT.length ? pg.L.colT.reduce(unite) : null;
    }
  }
  /* a phone: the room the page does not need is shared out: over the map, between the timeline and what is at
     hand, and under it before the ring */
  function breathe() {
    if (!pg.L || !pg.L.phone) return;
    var s = Math.floor(pg.main.getBoundingClientRect().bottom - px(pg.main, 'paddingBottom') - infoEl.getBoundingClientRect().bottom);
    if (s < 6) return;
    var q = Math.floor(s / 3);
    stageEl.style.paddingTop = (px(stageEl, 'paddingTop') + q) + 'px';
    infoEl.style.paddingTop = (px(infoEl, 'paddingTop') + q) + 'px';
  }
  /* the map and the timeline left where the page puts them (centred on a phone's screen, or after a column of text at
     125% or 175%, half a device pixel off): the browser draws an unmoved canvas on whole device pixels itself, where
     moving them by that fraction had it resample the map, a row or a column twice */
  function snapTo(e) { if (e) e.style.transform = ''; }
  /* the counts' figures left where the column's words put them: the browser draws an unmoved canvas on whole device
     pixels itself, where the frame's own nudge (a translate rounded to 4 places) leaves its rows a hair off at 150% */
  function snapStats() { [].forEach.call(sea.querySelectorAll('.r-st canvas'), function (c) { c.style.transform = ''; }); }
  /* a resize rebuilds only when the grid itself changes (a phone's address bar coming and going does not) */
  function same2(g) {
    var B = pg.L && (pg.L.base || pg.L);
    return !!B && g.phone === B.phone && g.u === B.u && g.cols === B.cols && g.dpr === B.dpr && (g.phone || (g.A === pg.L.A && g.dx === pg.L.dx && g.tlL - g.colR === pg.L.tlL - (pg.L.colR || g.colR)));
  }
  function relayout(g) {
    if (!pg.L.phone) { stageEl.style.paddingTop = g.A + 'px'; tlEl.style.marginTop = g.rh.g + 'px'; }
    pg.timelineWords(); pg.drawTimeline(); breathe(); pg.keyAt();
    snapTo(pxEl); snapTo(tpxEl); snapStats();
  }
  /* a rebuild (a phone turned, a window across a grid step) writes the map's buttons anew: the one the keyboard's focus
     was on (a venue's name or a sport's picture, by its place in the season; a club, a year, the next race) has it
     again after it, as timeline.js keeps a club's on a resize; one that is gone leaves it where the rebuild left it */
  function focusKey() {
    var fe = document.activeElement;
    if (!fe || fe === document.body || !sea.contains(fe)) return null;
    if (fe.tgt) { try { return { tgt: fe.tgt().key }; } catch (e) { return null; } }
    var a = fe.hasAttribute('data-c') ? 'data-c' : fe.hasAttribute('data-y') ? 'data-y' : null;
    return fe.classList.length ? { cls: fe.classList[0], attr: a, val: a && fe.getAttribute(a) } : null;
  }
  function focusAgain(k) {
    var fe = document.activeElement;
    if (!k || (fe && fe !== document.body && sea.contains(fe))) return;
    var el = null;
    [].some.call(sea.querySelectorAll(k.tgt ? '.r-lab, .r-ic' : '.' + k.cls), function (e) {
      if (k.tgt ? !!e.tgt && e.tgt().key === k.tgt : !k.attr || e.getAttribute(k.attr) === k.val) el = e;
      return !!el;
    });
    if (el && !el.hidden) el.focus({ preventScroll: true });
  }
  function onResize() {
    var g = measure();
    if (!same2(g)) { var k = focusKey(); pg.full(); focusAgain(k); return; }
    relayout(g);
  }
  Object.assign(pg, { DPR: DPR, ZM: ZM, env: env, breathe: breathe, fit: fit, measure: measure, narrow: narrow, onResize: onResize, px: px, realDPR: realDPR, relayout: relayout, same2: same2, sig: sig, snapStats: snapStats, snapTo: snapTo });
}
