// The home fitted to one screen (the draft's home script, "the line" and "layout"): where the road is (the source
// draft's own chain, srcRY and srcRYM), the doors chained down the line above it on a desk (lift) and on a phone
// (spread), the frame on the device grid, the road's pixel, and the one layout that sets everything in order:
// sizes, the line, the doors seated on it, the cities, the traveller, the weather's boxes, the footer. Laid out again
// on a resize, a new screen scale, the type arriving and the page's load (arm).
import { clamp, giveWay, r, r3 } from './util.js';

export function installFit(hm) {
  var doorSecs = hm.doorSecs, flow = hm.flow, marks = hm.marks, phone = hm.phone, roadEls = hm.roadEls, root = hm.root, walkEl = hm.walkEl;
  Object.assign(hm, { layout: layout, lift: lift, spread: spread, arm: arm });
  /* doors d: the road is where the source draft (home/v2a-season-map.html) has it, at every size: its own chains are
     kept here only to find the road (RY, RYM), so the cities and the footer sit exactly as there (doors h and e2
     have no "next:" line under Boston). The doors then fit above the road, never the road below the doors. */
  function srcRY(f, y) {
    var sy = f.height / 900;
    var by = Math.max(280, r(y + 45 / sy)), ty = Math.max(366, r(by + 85 / sy));
    var ra = Math.max(410, r(ty + 44 / sy)), rb = Math.max(540, r(ra + 60 / sy));
    var sey = Math.max(572, r(rb + 32 / sy));
    return r(Math.min(900 * (f.height - 70) / f.height, Math.max(748, sey + (37 + 16 + 36 * hm.U) / sy)));
  }
  function srcRYM(f, mb) {
    var sy = f.height / 844, b0 = Math.max(288, (mb + 20 + 23) / sy), hi = 844 - 70 / sy;
    /* the source's build block: its 36px words (the name's letters) over its grey line, as offsetHeight rounds it */
    var wh = hm.LS ? hm.LS.h * hm.lcell : 36, gl = 1.5 * (parseFloat(getComputedStyle(flow).getPropertyValue('--s')) || 13);   /* doors e: the source's grey line */
    var st0 = Math.max(60, Math.round(r3(wh + 4 + gl)) + 4), st1 = Math.max(90, st0);   /* doors e: r3, as offsetHeight rounds 59.49999 */
    function plan(step, sw, gap, run) { return b0 + (step + run + sw + gap + 92) / sy; }
    var y = plan(st1, 80, 36, 50), over = (y - hi) * sy;
    if (over > 0) {
      var ds = Math.min(st1 - st0, over), dw = Math.min(36, over - ds), dg = Math.min(6, over - ds - dw), dr = Math.min(20, over - ds - dw - dg);
      y = plan(st1 - ds, 80 - dw, 36 - dg, 50 - dr);
    }
    return r(Math.max(720, y));
  }
  /* Phone, in 350 x 844 units: the first run (x RM) past build and teach, ending at RAM; the swing to the left run
     (x LM), landing at RBM; see, blog and race hanging on that run, to its right; the road (RYM, the source's).
     Chained in px from the marks under the intro: build's word 20px under them (as the source promises), the stations
     g apart, the run going on RUN under teach, a SW-tall swing, see's station LAND under the landing, then race's grey
     line and AIR above the icons. One block's grey line keeps 12px from the next block's word (gm). When that is
     taller than the room above the road, the swing flattens first (to 46), the air above the icons gives way (to 36),
     the stations close up to gm, the run under teach and the landing shorten, the air goes to 20, the swing to 30;
     then the gaps between the blocks go under 12px (to 6) and the air to 12. A phone under ~640px tall has not the
     room for five blocks over the source's road: there, last, build's word comes to 10px under the marks, the swing
     and the landing flatten further, the gaps go to 4 and the air to 4. */
  hm.RM = 214;
  hm.RAM = 350;
  hm.RBM = 414;
  hm.RYM = 720;
  var LM = 8;
  function spread(f) {
    /* (r13: his motto under the marks, where it is shown: the chain starts at its foot) */
    var mot = flow.querySelector('.hero .mot'), mr = mot && mot.getClientRects().length ? mot.getBoundingClientRect() : null;
    var sy = f.height / 844, mb = Math.max(marks.querySelector('canvas').getBoundingClientRect().bottom, mr ? mr.bottom : 0) - f.top, icon = 36 * hm.U;
    hm.RYM = srcRYM(f, mb);
    var M = hm.doorM(), road = hm.RYM * sy, b0 = mb + 20 + M[0].up;
    var gm = [0, 1, 2, 3].map(function (i) { return M[i].down + 12 + M[i + 1].up; });
    var gs = [Math.max(62, gm[0]), 0, Math.max(62, gm[2]), Math.max(62, gm[3])], RUN = 18, SW = 62, LAND = 46, AIR = 60, v;
    function over() { return b0 + gs[0] + RUN + SW + LAND + gs[2] + gs[3] + M[4].down + AIR + icon - road; }
    var o = over(), mid = M[1].down + 12 + M[2].up;   /* teach's grey line to see's word, across the swing */
    if (o > 0) { v = Math.min(SW - 46, o); SW -= v; o -= v; }
    if (o > 0) { v = Math.min(AIR - 36, o); AIR -= v; o -= v; }
    if (o > 0) o = giveWay(gs, gm, o, [0, 2, 3]);
    if (o > 0) { v = Math.min(RUN - 10, o); RUN -= v; o -= v; }
    if (o > 0) { v = Math.min(LAND - 34, o); LAND -= v; o -= v; }
    if (o > 0) { v = Math.min(AIR - 20, o); AIR -= v; o -= v; }
    if (o > 0) { v = Math.min(Math.max(0, Math.min(SW - 30, RUN + SW + LAND - mid)), o); SW -= v; o -= v; }
    if (o > 0) o = giveWay(gs, gm.map(function (m) { return m - 6; }), o, [0, 2, 3]);
    if (o > 0) { v = Math.min(AIR - 12, o); AIR -= v; o -= v; }
    if (o > 0) { v = Math.min(10, o); b0 -= v; o -= v; }
    if (o > 0) { v = Math.min(Math.max(0, SW - 20), o); SW -= v; o -= v; }
    if (o > 0) { v = Math.min(Math.max(0, LAND - 26), o); LAND -= v; o -= v; }
    if (o > 0) { v = Math.min(Math.max(0, RUN - 6), o); RUN -= v; o -= v; }
    if (o > 0) o = giveWay(gs, gm.map(function (m) { return m - 8; }), o, [0, 2, 3]);
    if (o > 0) { v = Math.min(AIR - 4, o); AIR -= v; o -= v; }
    var t = b0 + gs[0], a = t + RUN, b = a + SW, s = b + LAND;
    var ys = [b0, t, s, s + gs[2], s + gs[2] + gs[3]];
    hm.RAM = r(a / sy); hm.RBM = r(b / sy);
    doorSecs.forEach(function (el, i) { el.style.setProperty('--my', r(ys[i] / sy)); });
    roadEls.forEach(function (el) { el.style.setProperty('--my', hm.RYM); });
  }
  /* Desktop, in 960 x 900 units: the first run (x X1) past build and teach turns at RA into the long slant back to the
     left run (x XL, the road's corner), landing at RB; see, blog and race stand on the slant; the road RY, the
     source's. Chained in px from the point the line leaves: build's station A under it, the stations 74px apart (see
     K more, past the turn), then race's grey line and AIR above the icons; one block's grey line keeps 12px from the
     next block's word (gm). doors e: the blocks are small, so on a shorter window the stations close up before race
     comes down near the cities: the air under the point and above the icons gives way first (to 64 and 40), then
     see's extra step (K), then the stations close up to 60 apart, then (doors e2) alike to 16px between the blocks
     (never past it before this), then the air under the point (build's word to 16px under the run), and only then
     the air above the icons (to 32), the stations alike to the largest block's gm (12px between the blocks; all on
     whole device pixels), the air above the icons (to 24), the air under the point (build's word 12px under the run)
     and the air above the icons (to 10). Only then do the blocks come under 12px apart (alike, then each to its own,
     never under 6), and last build's word to 6px under the run. The stations always stand alike apart (on whole
     device pixels) but in that last resort. A window so short that the blocks still stand under 16px apart takes
     E's size for the words (doorsTight), seated again; on a desktop's page, where lettering is one size on every
     screen, by the page's height alone (doorsShort) */
  var X1 = 660;
  var XL = 270;
  hm.RA = 400;
  hm.RB = 600;
  hm.RY = 748;
  var SLANT = .15;   /* the slant: straight, its two ends rounded */
  function lift(f, y) {
    var sy = f.height / 900, top = y * sy, icon = 36 * hm.U;
    hm.RY = srcRY(f, y);
    var M = hm.doorM(), room = hm.RY * sy - icon - top - M[4].down;   /* room = A + the gaps + K + AIR */
    var gm = [0, 1, 2, 3].map(function (i) { return M[i].down + 12 + M[i + 1].up; });
    var A = 84, K = 10, AIR = 64, gs = gm.map(function (m) { return Math.max(74, m); }), v;
    function over() { return A + gs[0] + gs[1] + gs[2] + gs[3] + K + AIR - room; }
    var o = over();
    var dq = window.devicePixelRatio || 1;   /* doors e2: the floor on whole steps, as the stations' (below) */
    dq = Math.abs(dq - Math.round(dq)) < 1e-6 ? 1 : dq;
    var gM = Math.ceil(Math.max.apply(null, gm) * dq - 1e-6) / dq;   /* doors e: the stations close up alike, to the largest block's floor */
    if (o > 0) { v = Math.min(44, o); A -= v * 20 / 44; AIR -= v * 24 / 44; o -= v; }
    if (o > 0) { v = Math.min(K, o); K -= v; o -= v; }
    var g16 = gM + 4 + 1 / dq;   /* doors e2: 16px between the blocks, and a device px for the words' snap */
    if (o > 0) o = giveWay(gs, gs.map(function () { return Math.max(60, g16); }), o, [0, 1, 2, 3]);
    if (o > 0) o = giveWay(gs, gs.map(function () { return g16; }), o, [0, 1, 2, 3]);
    if (o > 0) { v = Math.min(Math.max(0, A - (M[0].up + 16)), o); A -= v; o -= v; }   /* doors e2: before race comes under 40 */
    if (o > 0) { v = Math.min(Math.max(0, AIR - 32), o); AIR -= v; o -= v; }
    if (o > 0) o = giveWay(gs, gs.map(function () { return gM; }), o, [0, 1, 2, 3]);
    if (o > 0) { v = Math.min(AIR - 24, o); AIR -= v; o -= v; }
    if (o > 0) { v = Math.min(Math.max(0, A - (M[0].up + 12)), o); A -= v; o -= v; }
    if (o > 0) { v = Math.min(AIR - 10, o); AIR -= v; o -= v; }
    if (o > 0) o = giveWay(gs, gs.map(function () { return gM - 6; }), o, [0, 1, 2, 3]);
    if (o > 0) o = giveWay(gs, gm.map(function (m) { return m - 6; }), o, [0, 1, 2, 3]);   /* the last resort: unequal */
    if (o > 0) { v = Math.min(Math.max(0, A - (M[0].up + 6)), o); A -= v; o -= v; }
    /* doors e: room to spare (a tall window) spreads the stops along the line first: the stations up to 74px x the
       window's height / 900 apart (at most 110), the air under the point with them; then the air above the icons, to
       90; then all of them alike */
    if (o < 0) {
      var sp = -o, gT = Math.min(110, 74 * f.height / 900), aT = A * gT / 74, need = Math.max(0, aT - A), k1, k3;
      gs.forEach(function (g) { need += Math.max(0, gT - g); });
      k1 = need > 0 ? Math.min(1, sp / need) : 0;
      A += Math.max(0, aT - A) * k1;
      gs = gs.map(function (g) { return g + Math.max(0, gT - g) * k1; });
      sp -= need * k1;
      v = Math.min(sp, Math.max(0, 90 - AIR)); AIR += v; sp -= v;
      k3 = sp / (A + gs[0] + gs[1] + gs[2] + gs[3] + AIR);
      A *= 1 + k3; AIR *= 1 + k3; gs = gs.map(function (g) { return g * (1 + k3); });
    }
    var ys = [top + A], i, dpr = window.devicePixelRatio || 1;
    dpr = Math.abs(dpr - Math.round(dpr)) < 1e-6 ? 1 : dpr;   /* doors e2: whole CSS px at 2x and 3x, where the beads snap so */
    for (i = 0; i < 4; i++) ys.push(ys[i] + Math.floor((gs[i] + (i === 1 ? K : 0)) * dpr + 1e-6) / dpr);   /* whole device px */
    hm.RA = r((ys[1] + 22) / sy);
    hm.RB = r((ys[4] + 34) / sy);
    doorSecs.forEach(function (el, i) { el.style.setProperty('--y', r3(ys[i] / sy)); });
    roadEls.forEach(function (el) { el.style.setProperty('--y', hm.RY); });
  }
  /* ---------- layout ---------- */
  var wasPhone = phone();
  /* nudge an element onto the device-pixel grid, so its cells stay square and even */
  function snap(el, dpr) {
    /* big screens (2026-10-09): by its own place, not a translate (the browser snaps a box before it applies a
       transform, so a fraction there moved the cells off the grid again): an absolute box takes the fraction as its
       margins, any other as a relative offset */
    var s = el.style, abs = getComputedStyle(el).position === 'absolute';
    s.translate = 'none';
    if (abs) s.marginLeft = s.marginTop = '0px';
    else { s.position = 'relative'; s.left = s.top = '0px'; }
    var b = el.getBoundingClientRect(), dx = (Math.round(b.left * dpr) - b.left * dpr) / dpr, dy = (Math.round(b.top * dpr) - b.top * dpr) / dpr;
    if (abs) { s.marginLeft = dx + 'px'; s.marginTop = dy + 'px'; }
    else { s.left = dx + 'px'; s.top = dy + 'px'; }
  }
  /* doors d: the last city's frame (Boston's night house is 46 cells wide, wider than its icon) never reaches past the
     screen's edge. At 125% and 150% on a phone the road's pixel is 1.6 or 1.33px and the frame would end a few px past
     it, widening the page: its canvas is cut back on the right by whole cells (the house loses the cells the screen's
     edge would hide), so Boston, its name and the cities' even spacing stay as the source has them */
  function lastCity(dpr) {
    var st = hm.cities[hm.cities.length - 1], cv = st.ctx.canvas, keep = st.W;
    cv.style.width = '';
    var over = cv.getBoundingClientRect().right - root.clientWidth;
    if (over > .01) keep = Math.max(1, st.W - Math.ceil(over / hm.U - .001));
    if (cv.width !== keep) { cv.width = keep; hm.paint(st); }
    if (keep < st.W) cv.style.width = r3(keep * hm.U) + 'px';
  }
  /* the frame on the device grid (the sheet says why and how: html[data-grid], --dwx). All the script gives is the
     length of a device pixel in the window's px, 1 over the screen's own ratio (in the big-screen mode the page's
     ratio is the screen's times the root's zoom: the engine's dpr() is the screen's), and the word that it is there.
     Before anything is measured, at every layout, on the home and while a page is shown alike (the pages' frame reads
     the same two: inner.css), so no drawing is ever set against a frame that then moves. Not on a touch screen
     (nothing hovers: a phone, a tablet), where everything is as it was. (The frame's own script, scripts/site.js,
     sets the same two on every page; the home sets them again before it measures) */
  function frameGrid() {
    var WZ = hm.zoom, d = WZ && WZ.dpr ? WZ.dpr() : window.devicePixelRatio || 1;
    if (hm.mqTouch.matches || !(d > 0)) { root.removeAttribute('data-grid'); root.style.removeProperty('--dwx'); return; }
    root.style.setProperty('--dwx', 1 / d + 'px');
    if (!root.hasAttribute('data-grid')) root.setAttribute('data-grid', '');
  }
  function layout() {
    if (hm.dead) return;
    frameGrid();
    /* (the home out of sight, display none: measured when it is shown again; the draft's html.in) */
    if (!flow.getClientRects().length) return;
    /* the road's one pixel (U): the largest whole number of device pixels, at most 2 CSS px, that leaves room
       between two cities for an icon (36 cells), the traveller (9) and a little air. 2px on desktop (1.6px at 125%);
       on a phone 1px at 2x and 3x. The icons, the traveller and his city things, his hop and the weather all use it,
       so the road has one pixel size. Nothing of the icons hangs below the road any more, so short screens need no cap */
    var dpr = window.devicePixelRatio || 1, pitch = hm.cx(1) - hm.cx(0);
    /* never under one CSS px (in whole device pixels): on the narrowest phones his city things may brush a neighbour */
    /* phones fit a little tighter (43 cells a city), and a touch phone (nothing that hovers, its short side under
       600px) keeps one CSS px at most (the owner, 2026-10-18: the cities smaller on a phone): 3 device px at 3x, 2
       at 2x, 3 at 2.625x, so the icons are 36px (41px at 2.625x) where they were 48 from 375px wide and 72 held
       sideways, and the traveller and the weather with them. A window under 1000px in a mouse's hand, and a
       tablet, keep their pixel */
    /* (the big-screen mode: that pixel as the plain page has it on this screen, grown with the page together with the
       name's cell: cellFor, by the doors' sizes. There it may come out a little over 2 of the page's px, as far as
       the road has room (roadRoom, in device px): the last city's drawing, 18 cells from its middle, is to end on the
       line, 40px on: 2.22px (a 150% screen at k 1.5: 5 device px), where the traveller at the corner still stands
       two cells clear of the first city (four at 2px). The pitch has room to 2.8) */
    var hand = phone() && hm.mqTouch.matches && Math.min(innerWidth, innerHeight) < 600;
    hm.roadCell = function (d) { return Math.max(Math.ceil(d - .01), Math.floor(Math.min(hand ? 1 : 2, (pitch - 6) / (phone() ? 43 : 47)) * d + .01)); };
    hm.roadRoom = Math.floor((hm.fx().width - hm.cx(hm.cities.length - 1)) / 18 * dpr + .01);
    hm.U = hm.cellFor(hm.roadCell, dpr, hm.LS ? hm.nameCell : null) / dpr;
    flow.style.setProperty('--u', hm.U + 'px');   /* big screens: in full, so 46 cells are whole device pixels at any z */
    /* the marks' pixel: the road's on a desktop; on a phone about 1.5 CSS px, never finer than the road's.
       Set before route(), which measures the marks */
    marks.style.setProperty('--su', (phone() ? Math.max(hm.U, Math.ceil(1.5 * dpr - .01) / dpr) : hm.U) + 'px');   /* big screens: in full (to 0.001, a mark came out 0.02 device px short and lost a column at 150%, zoomed) */
    hm.lettersSize(dpr);                         /* the name's height moves the sentence, so before route() */
    hm.doorsSize(dpr, hm.doorsShort(dpr));          /* the words' height seats the stations, and the line's width, so before route() (a desktop's short page: E's size at once) */
    hm.route();
    if (hm.doorsTight(dpr)) {                    /* doors e2: blocks under 16px apart take E's size, seated again, */
      hm.route();
      if (hm.doorsClear() < hm.TIGHT) { hm.doorsSize(dpr, false); hm.route(); }   /* kept only where it gives them 16px back */
    }
    hm.measureName();
    /* the marks are not nudged: their box is untransformed, so the browser already puts it on the device grid */
    if (hm.openD && phone() !== wasPhone) hm.hide(hm.openD);
    if (phone() !== wasPhone) hm.cities.forEach(hm.wxClear);
    wasPhone = phone();
    [2, 3, 1].forEach(function (n, j) { hm.walker.el.style.setProperty('--h' + (j + 1), -n * hm.U + 'px'); });   /* big screens: in full, whole device px */
    var c = hm.U, words = hm.doors.map(function (d) { return d.db.getBoundingClientRect(); });
    hm.cities.forEach(function (st) {
      /* big screens (2026-10-09): the city's button centred on its place in layout (a margin of half its width) instead
         of by its translateX(-50%), which is a fraction of a pixel whenever the name is wider than the icon: a canvas
         under a transform of a fraction was drawn off the grid however it was nudged (Okinawa's icon at 3000 x 1300) */
      var bs = st.b.style;
      bs.transform = 'none'; bs.marginLeft = '0px';
      bs.marginLeft = -st.b.getBoundingClientRect().width / 2 + 'px';
      snap(st.ctx.canvas, dpr);
      var s = st.wx.style, p = st.li.getBoundingClientRect(), gy0 = 0;
      var ox = Math.round(p.left * dpr) / dpr - p.left, oy = Math.round(p.top * dpr) / dpr - p.top;
      s.left = r3(hm.BOX.x0 * c + ox) + 'px'; s.top = r3(hm.BOX.y0 * c + oy) + 'px'; s.width = r3(hm.BW * c) + 'px'; s.height = r3(hm.BH * c) + 'px';
      /* on a short screen a door's words can come down near the road: the weather's top edge stays below them */
      words.forEach(function (w) {
        if (w.right < p.left + hm.BOX.x0 * c || w.left > p.left + (hm.BOX.x1 + 1) * c) return;
        gy0 = Math.max(gy0, Math.ceil((w.bottom + 2 - p.top) / c) - hm.BOX.y0);
      });
      st.gy0 = clamp(gy0, 0, hm.BH);
      var cl = p.left + ox;
      st.limR = Math.floor((root.clientWidth - cl) / c) - 1; st.limL = Math.floor(cl / c) - 1;
    });
    if (!hm.walker.walking) {
      hm.caf(hm.walker.raf);
      hm.walker.x = hm.walker.at >= 0 ? hm.restX(hm.walker.at, hm.walker.side) : hm.corner();
    }
    lastCity(dpr);
    var wo = walkEl.getBoundingClientRect();   /* big screens: the road's fraction of a device pixel, which his box takes (sizeW) */
    hm.walker.ox = (Math.round(wo.left * dpr) - wo.left * dpr) / dpr; hm.walker.oy = (Math.round(wo.top * dpr) - wo.top * dpr) / dpr;
    hm.drawW();                                 /* his canvas size follows U */
    hm.placeW();
    hm.sizePrints();
    hm.drawPrints();
    hm.lettersSnap(dpr);
    hm.doorsSnap(dpr);
    /* (the fader's line and stops on the device grid: scripts/fader.js, on its own resize) */
    footer();
  }
  /* v1k: the footer line, shown only with room under the road's captions (the draft's v1kAfter. doors h, e2: no line
     under Boston any more; what is next is race's own grey line, set in seat()) */
  function footer() {
    var f = flow.getBoundingClientRect(), fts = flow.querySelectorAll('.foot');
    if (!f.width) return;
    if (fts.length) {
      var low = 0;
      [].forEach.call(flow.querySelectorAll('.city .nm, .city .mem'), function (el) { low = Math.max(low, el.getBoundingClientRect().bottom); });
      /* only with room under the road's captions (r13: the row's two lines each by its own top. On a phone his motto
         stands over who made it, two lines of it, and the 24px are not there under the road: it keeps 8px from the
         foot of a city's second caption, which shows only while the city is in hand, and 25 from the names') */
      [].forEach.call(fts, function (ft) { var fb = ft.getBoundingClientRect(); ft.classList.toggle('show', fb.top - low >= (phone() && ft.classList.contains('fmh') ? 8 : 24)); });
    }
  }
  /* laid out again: the type's arrival (its own font loads late: measure again when it does), the page's load, a
     resize, and a window moved to a screen of another scale (doors d: 100% to 150% may change only the resolution,
     not the size; the line, the words and the stations are whole device pixels, so lay out again, re-armed for the
     new scale) */
  function arm() {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); });
    if (document.fonts && document.fonts.addEventListener) hm.listen(document.fonts, 'loadingdone', layout);
    hm.listen(window, 'load', layout);
    hm.listen(window, 'resize', layout);
    armDpr();
  }
  function armDpr() {
    if (!window.matchMedia || hm.dead) return;
    var mq = matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
    function off() { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); }
    function on() { off(); layout(); armDpr(); }
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    hm.dprOff = off;
  }
  Object.assign(hm, { LM: LM, SLANT: SLANT, X1: X1, XL: XL });
}
