// The race page for one season (the draft's makePage): its elements, its state, and its laying out in order: the
// season set (its races, venues, roads and clubs), the map measured and fitted to the screen, the placing in its
// forms, the cards placed or sent to the column, the terrain, the audit, the timeline and the paint; then what the
// address names, pinned. Each part is a module of its own (model, layout, render, cards, timeline, scenes, fit,
// input), installed on one object they share, pg: the page's elements, its state S and its layout L (the draft's
// closure variables) and each module's functions by their own names. Ported from the draft
// (design/assets/v2ac/race.js); each comment is the draft's own.
import { repaint, snap, word } from '../lettering/index.js';
import { BOX, MEDAL_WORD, RETRIES, SHORT, TRIES } from './consts.js';
import { esc, slug } from './util.js';
import { asked, createModel } from './model.js';
import { installLayout } from './layout.js';
import { installRender } from './render.js';
import { installCards } from './cards.js';
import { installTimeline } from './timeline.js';
import { installScenes } from './scenes.js';
import { installFit } from './fit.js';
import { installInput } from './input.js';

/* an element (the frame's V1K.el) */
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
/* the title: the page's word in pixels, alone on its row and the loudest thing on the page, its words for a screen
   reader beside it (the frame's V1K.title). Its cell, the home's name's own 2 CSS px, as 1.99: whole device pixels,
   a half going down (2 at 100% and 125%, 3 at 150% and 175%) */
var TITLE_CELL = 1.99;
function title(into) {
  var tb = el('section', 'tb'), h1 = el('h1', 'tb-h');
  h1.tabIndex = -1;
  var cv = word('race', { cell: TITLE_CELL, ui: true });
  cv.classList.add('tb-word');
  h1.appendChild(cv);
  h1.appendChild(el('span', 'sr', esc('race')));
  tb.appendChild(h1);
  into.appendChild(tb);
  return tb;
}

/* a season's page in main (the element it stands in): ctx { sub, today }, ASK what the address names (model.js
   asked), DKEY today as a key, host the mount's (index.js: its options, the pages it keeps, the page it shows).
   The page made and laid out; the page's own object back: { year, wake, sleep, arrive, destroy }.
   (The speed round, 2026-10-16: ctx.prep, a box out of sight where the page shown stands (index.js prep), makes the
   season there instead, and nothing more at once: its making is given back as steps, I.steps, which set it as
   setYear does and lay it out as full does, then take it off the page and keep it for the switch, as a season put
   away is kept. It is put up as a kept season is (wake), and is laid out again then unless the window measures
   exactly as it did for it) */
export function makePage(main, ctx, ASK, DKEY, host) {
  var M = createModel(host.races, ctx.today, host.assets);
  var pg = Object.assign({ main: main, E: esc, el: el, tok: host.tok, stage: host.stage, still: host.still, on: host.on, address: host.address, zoom: host.zoom, belowOf: host.belowOf }, M);
  var D = M.D, SEAS = M.SEAS, YEARS = M.YEARS, NX = M.NX, HOMEN = M.HOMEN, E = esc;

  /* ---------- the block: the title, the counts and what is at hand on the left; the map and the timeline on the right ---------- */
  var sea = el('section', 'r-sea');
  sea.id = 'season';
  sea.setAttribute('aria-label', 'Races by season');
  sea.innerHTML =
    '<div class="r-grid">' +
    '<div class="r-info">' + yearsHTML() + '<div class="r-hand"></div><div class="r-hand r-probe" aria-hidden="true"></div></div>' +
    '<div class="r-stage">' +
    '<div class="r-map" role="group"><div class="r-px"><canvas class="r-cv" aria-hidden="true"></canvas><canvas class="r-sc" aria-hidden="true"></canvas><canvas class="r-tr" aria-hidden="true"></canvas>' +
    '<div class="r-labs"></div><div class="r-cards"><canvas class="r-cl" aria-hidden="true"></canvas><div class="r-card" aria-hidden="true"></div><div class="r-card" aria-hidden="true"></div><div class="r-card r-cprobe" aria-hidden="true"></div></div></div></div>' +
    '<div class="r-tl"><div class="r-tpx"><canvas class="r-tcv" aria-hidden="true"></canvas><div class="r-mo"></div></div></div>' +
    '<p class="r-key" aria-hidden="true">' + [1, 2, 3, 'f', 'q'].map(function (m) { return '<span class="r-k"><canvas class="r-md" data-m="' + m + '"></canvas>' + (MEDAL_WORD[m] || 'qualified') + '</span>'; }).join('') + '</p>' +
    '</div></div>' +
    '<div class="sr r-list"></div><p class="sr r-say" aria-live="polite"></p>';
  (ctx.prep || main).appendChild(sea);
  var gridEl = sea.querySelector('.r-grid');
  /* the title: the frame's, at the place every page has it, heading the left column; the season's counts under it
     (r13: his motto, which stood between, is the home's alone) */
  var tbEl = title(gridEl);
  gridEl.insertBefore(tbEl, gridEl.firstChild);
  var statsEl = el('div', 'r-stats');
  tbEl.appendChild(statsEl);
  var yearsEl = sea.querySelector('.r-years'), infoEl = sea.querySelector('.r-info'), handEl = sea.querySelector('.r-hand'), probeEl = sea.querySelector('.r-probe'), keyEl = sea.querySelector('.r-key');
  var stageEl = sea.querySelector('.r-stage'), mapEl = sea.querySelector('.r-map'), pxEl = sea.querySelector('.r-px');
  var cv = sea.querySelector('.r-cv'), scv = sea.querySelector('.r-sc'), labsEl = sea.querySelector('.r-labs'), tr = sea.querySelector('.r-tr');
  var cardEls = [].slice.call(sea.querySelectorAll('.r-card:not(.r-cprobe)')), cprobeEl = sea.querySelector('.r-cprobe'), clv = sea.querySelector('.r-cl'), cardsEl = sea.querySelector('.r-cards');
  var tlEl = sea.querySelector('.r-tl'), tpxEl = sea.querySelector('.r-tpx'), tcv = sea.querySelector('.r-tcv'), moEl = sea.querySelector('.r-mo');
  /* the season for screen readers (its own node: the title's h1 carries a .sr span too), and a polite line that
     says a season switch, and a race pinned or let go */
  var srEl = sea.querySelector('.r-list'), sayEl = sea.querySelector('.r-say');
  function yearsHTML() {
    if (!YEARS.length) return '';
    if (YEARS.length === 1) return '<p class="r-years"><span class="r-y on">' + E(YEARS[0]) + '</span></p>';
    return '<p class="r-years" role="group" aria-label="Season">' + YEARS.map(function (y, i) {
      return (i ? '<span class="r-sep" aria-hidden="true">·</span>' : '') + '<button type="button" class="r-y" data-y="' + E(y) + '" aria-pressed="false">' + E(y) + '</button>';
    }).join('') + '</p>';
  }
  Object.assign(pg, { sea: sea, gridEl: gridEl, tbEl: tbEl, statsEl: statsEl, yearsEl: yearsEl, infoEl: infoEl, handEl: handEl, probeEl: probeEl, keyEl: keyEl,
    stageEl: stageEl, mapEl: mapEl, pxEl: pxEl, cv: cv, scv: scv, labsEl: labsEl, tr: tr, cardEls: cardEls, cprobeEl: cprobeEl, clv: clv, cardsEl: cardsEl,
    tlEl: tlEl, tpxEl: tpxEl, tcv: tcv, moEl: moEl, srEl: srEl, sayEl: sayEl });

  /* ---------- the season shown: its races, its venues (stops) and each venue's sports (slots) ---------- */
  var S = pg.S = { year: null, races: [], PL: [], nx: null, pin: null, prev: null, hover: null, dwell: 0, leaveT: 0, timer: 0, hopT: 0, raf: 0, sraf: 0, xf: 0,
    trip: null, act: null, scenes: [], at: null, node: HOMEN, hopUp: false, facing: 1, roads: {}, clubs: [], flag: null, mode: 'map', cards: {}, card: null, colKeys: {} };
  pg.L = null;
  installLayout(pg); installRender(pg); installCards(pg); installTimeline(pg); installScenes(pg); installFit(pg); installInput(pg);

  /* what the placing left, counted, for the checks (.r-map[data-audit]): layout.js audit, with what the page says of
     itself (the names' and the cards' size, and on a phone where each name stands against the page's margins) */
  function audit() {
    var dom = { small: labsEl.classList.contains('r-sm'), cmp: cardsEl.classList.contains('r-cmp'), edge: null };
    if (pg.L.phone) {
      var mr0 = mapEl.getBoundingClientRect(), vw0 = document.documentElement.clientWidth;
      dom.edge = { left: mr0.left, vw: vw0, mg: (vw0 - pg.main.clientWidth) / 2, labs: S.PL.map(function (P) { var r = P.lab.getBoundingClientRect(); return [r.left, r.right]; }) };
    }
    mapEl.setAttribute('data-audit', JSON.stringify(pg.audit(dom)));
  }
  /* nothing in hand, and he is at home: a season just opened, or its page put up again */
  function rest() {
    pg.stopMotion(); clearTimeout(S.dwell); clearTimeout(S.leaveT);
    S.pin = null; S.prev = null; S.hover = null; S.club = null; S.flag = null;
    S.trip = null; S.act = null; S.left = null; S.scenes = []; S.at = null; S.node = HOMEN; pg.upMan(false);
  }
  /* (the third round, 2026-10-12: in steps where the page is made ready out of sight: the season's races and
     venues, its roads, its clubs, then what it puts on the page, then that laid out for the first time. It was one
     step of 10 to 25ms, the longest left, 40 to 55 on a machine four times slower. Let go of half way, the season
     is not set (S.year null again): wake sets it, in one go as setYear does) */
  function setYear(y) { var g = setYearSteps(y); while (!g.next().done); }
  function* setYearSteps(y) {
    var set = false;
    try { yield* setYearParts(y); set = true; } finally { if (!set) S.year = null; }
  }
  function* setYearParts(y) {
    S.year = y;
    var M = yield* pg.modelSteps(y), list = M.races;
    S.races = list;
    S.nx = NX && NX.season === y ? NX : null;   /* (the next race's own season, whichever it is: next.js) */
    S.PL = M.PL;
    yield;
    S.roads = pg.reveal(S.PL.map(function (P) { return P.node; }));
    yield;
    S.clubs = pg.clubRows(y);
    S.races.forEach(function (R) {
      var ids = [];
      pg.crewsOf(R).forEach(function (c) { if (c.club && ids.indexOf(c.club) < 0 && S.clubs.some(function (k) { return k.c.id === c.club; })) ids.push(c.club); });
      R.clubs = ids;
    });
    rest(); S.ghost = null;
    yield 4;   /* (the season said, its key, its counts, its venues' buttons and the column at rest: 3 to 5ms) */
    if (yearsEl) [].forEach.call(yearsEl.querySelectorAll('button.r-y'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-y') === y ? 'true' : 'false'); });
    mapEl.setAttribute('aria-label', 'The ' + y + ' season on a map, venue by venue in date order');
    srEl.innerHTML = '<h2>The ' + E(y) + ' season</h2><ol>' + list.map(function (R) { return '<li>' + E(pg.told(R)) + '</li>'; }).join('') + '</ol>' +
      (S.clubs.length ? '<p>' + E('Clubs: ' + S.clubs.map(function (k) { return (k.c.long || k.c.name) + ' from ' + pg.clubWhen(k); }).join('; ') + '.') + '</p>' : '');
    tlEl.style.height = pg.tlHeight() + 'px';
    /* (the fourth round: in three steps, not one: 6ms and more where it was said to take 4, a slice of 25ms on a
       machine four times slower with the name in hand) */
    yield 3;
    /* the key tells only the medals the season has (a season with none: no key) */
    var used = {};
    list.forEach(function (R) { R.md.forEach(function (m) { used[m] = 1; }); });
    [].forEach.call(keyEl.querySelectorAll('.r-md'), function (k) { k.parentNode.hidden = !used[k.getAttribute('data-m')]; });
    keyEl.hidden = !Object.keys(used).length;
    S.handW = 0;
    pg.drawStats();
    yield 3;
    pg.makeButtons();
    pg.showHand();
    yield 4;   /* (the cards hidden at once, which lays all of that out for the first time: 3 to 5ms) */
    pg.hideCards(true);
  }
  function* place() {
    var t0 = performance.now();
    labsEl.classList.remove('r-sm');
    S.PL.forEach(function (P) { if (P.lab) P.lab.style.paddingLeft = P.lab.style.paddingRight = ''; });
    pg.placeKey(); yield 4;   /* (the first card measured: a reflow) */
    yield* pg.cardSizes(); yield;
    /* the placing as it is first, then (while collisions are left) its other forms, in turn, the one that leaves the
       fewest collisions kept: on a short screen the smaller names (also where they only bring a far row nearer); on
       a phone every row on two lines, its pictures and medals under its name (every row on one line, or every row
       on two: "每个城市都差不多", 2026-10-07; its names and pictures always inside the page's margins); on a small
       map whose scenes' rooms, as tall as their skies need, leave collisions, rooms of SKY rows of sky, their
       weather left out where it cannot keep clear of him there; and last, on a phone, the rows first, then the
       rooms */
    function* form(sm, low, wrap, after) {
      yield 4;   /* (the names' size set, and read again by the solve's key: a reflow) */
      labsEl.classList.toggle('r-sm', sm); pg.measureRows(); pg.lowSky(low);
      var R = yield* pg.solve(after, wrap);
      R.sm = sm; R.low = low; R.after = after;
      return R;
    }
    var A = yield* form(false, false, false, false), short = !pg.L.phone && window.innerHeight <= SHORT;
    /* (the third round: a row left cut off from its stop, solve's cutOf, counts as a collision where two forms are
       weighed, on a desktop: none that leaves more of them is taken for its rows standing nearer, and on a short
       screen the smaller names are tried for it. It does not ask for the low skies by itself: at 1280 x 690 that
       took every scene's sky for one row, which a card's retry, not kept, ties as well) */
    function bad(R) { return R.hard + (pg.L.phone ? 0 : R.cut); }
    /* (the fourth round: a form a venue of which had to look at every cell for a clear place, solve's more, is taken
       for a collision or a cut row fewer only, not for its rows standing nearer: at 605 and 606px tall the smaller
       names, clear by that alone, took the place of a form that had been clear all along, and six cards went to
       the column) */
    function take(B, loose) { if (bad(B) < bad(A) || (loose && !B.more && bad(B) === bad(A) && B.off < A.off - 4)) A = B; }
    if (short && (bad(A) || A.off > 4)) take(yield* form(true, false, false, false), true);
    if (A.hard && pg.L.phone) take(yield* form(false, false, true, false));
    if (A.hard) take(yield* form(false, true, A.wrap, false));
    if (A.hard && short) take(yield* form(true, true, false, false));
    if (A.hard && pg.L.phone) take(yield* form(false, true, true, false));
    if (A.hard && pg.L.phone) take(yield* form(false, A.low, A.wrap, true));
    /* (rooms after the rows, some venues left without one: their skies low, where that leaves more their scenes) */
    function roomsOf(R) { var n = 0; R.best.pick.forEach(function (pk) { if (pk.rm && pk.rm.b) n++; }); return n; }
    if (A.after && !A.low && roomsOf(A) < S.PL.filter(function (P) { return P.rw; }).length) { var B2 = yield* form(false, true, A.wrap, true); if (B2.hard <= A.hard && roomsOf(B2) > roomsOf(A)) A = B2; }
    labsEl.classList.toggle('r-sm', A.sm); pg.measureRows(); pg.lowSky(A.low);
    pg.L.wrap = A.wrap;
    if (S.seekOn) yield* A.seekSteps();
    pg.L.R = A;
    yield 4;   /* (apply: the rows, rooms and buttons set on the page) */
    pg.apply(A); pg.applyRows();
    pg.L.ms = Math.round(performance.now() - t0);
  }
  /* (in steps where the page is made ready: the map, then the rest. paint runs them in one go) */
  function paint() { var g = paintSteps(); while (!g.next().done); }
  function* paintSteps() { pg.drawBase(); yield 4; pg.drawTimeline(); pg.drawMan(); pg.drawScenes(); pg.drawDiscCanvases(handEl); pg.drawDiscCanvases(keyEl); cardEls.forEach(pg.drawDiscCanvases); pg.snapStats(); }
  /* a new grid (a resize, the fonts, another season): a walk under way ends where it was going. The details sit
     by their venues where every card finds its place; else (and on a phone) they take the column */
  /* (the form the placing chose on this map, its last look run on it and the map drawn again with what that moved: the
     solving not done again) */
  function* reseekSteps() {
    var A = pg.L && pg.L.R;
    if (!A || !A.seek || pg.L.phone) return false;
    yield* pg.buildSteps(); yield; yield* A.seekSteps(); yield 4; pg.measureRows(); pg.apply(A); pg.applyRows(); yield; yield* pg.terrainSteps();
    return true;
  }
  /* (a step that cannot be cut up, a reflow mostly, says how long it takes on the machine it was written on:
     "yield 5", five ms. The frame begins it only in an idle moment with that much left, more on a slower machine
     (inner.js prepStep); run in one go the number is not looked at. The window measured and the grid set on the
     page: 2 to 3ms) */
  function* layout() {
    yield 3;
    var g = pg.measure();
    S.gk = gridKey(g);
    pg.fit(g); yield; yield* pg.buildSteps(); yield; yield* place(); yield;
    var base = { phone: pg.L.phone, u: pg.L.u, cols: pg.L.cols, dpr: pg.L.dpr };
    for (var n = 0; pg.L.phone && pg.L.hard && n < 12; n++) {
      var g2 = pg.pickGrid(document.documentElement.clientWidth, (pg.L.rows + 6) * pg.L.cs, true, pg.env());
      if (g2.cols <= pg.L.cols) break;
      g2.phone = true;
      pg.fit(g2); yield; yield* pg.buildSteps(); yield; yield* place(); yield;
    }
    pg.L.base = base;
  }
  /* a venue whose card finds no place first tries its row's and its room's other places, the place it had
     costing AVOID (S.avoid, read by the solver), one venue at a time: kept where fewer cards are left without one
     and no collision is added. (2026-10-07: a row and a room inside the loop of roads, the card
     nowhere there clear of the other rows, while the row's other side left it room; and Mercer's corner by the
     column.) Two tries in all, each a layout of the map, on a screen SHORT px tall or more (the cards' goal; under
     that the map is small, its layouts slow, and the column takes them). The cards left without a place then take
     the column, the map laid out again with what was kept */
  function* retry(miss) {
    var hard0 = pg.L.hard, cut0 = pg.L.cut, undo = false, keep = {}, left = (S.missV || []).slice(), pos = {}, n = 0;
    function now(nm) { var P = S.PL.filter(function (Q) { return Q.name === nm; })[0]; return P && P.LB ? { B: P.LB, room: P.room } : null; }
    function mark() { left.forEach(function (nm) { pos[nm] = now(nm); }); }
    mark();
    var names = left.slice();
    for (var ri = 0; ri < names.length; ri++) {
      var nm = names[ri];
      if (left.indexOf(nm) < 0 || !pos[nm]) continue;   /* (its card found a place as another moved) */
      var tried = [pos[nm]], got = false;
      for (var k = 0; k < TRIES && n < RETRIES && tried[tried.length - 1] && !got; k++, n++) {
        var av = {};
        Object.keys(keep).forEach(function (q) { av[q] = keep[q]; });
        av[nm] = tried.slice();
        S.avoid = av; S.handW = 0;
        yield* layout(); yield* pg.terrainSteps(); yield;
        var m2 = yield* pg.cardsPlaced();
        /* (the third round: nor one that leaves a row more cut off from its stop, boston's at 1280 x 690, its card
           found a place by it; the map then stands as that try left it, so it is laid out again as it was kept,
           below, before anything is built on it) */
        if (m2.length < miss.length && pg.L.hard <= hard0 && pg.L.cut <= cut0) { keep = av; miss = m2; left = S.missV.slice(); mark(); got = true; undo = false; }
        else { tried.push(now(nm)); if (pg.L.cut > cut0) undo = true; }
      }
    }
    S.avoid = keep;
    if (undo) { S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; miss = yield* pg.cardsPlaced(); }
    return miss;
  }
  /* (round 11, 2026-10-13: a card in the column that has a place by its venue on the map as it stands at last
     takes it. Cards join the column one laying out after another, each for want of a place on the map as it was
     then, and none came back, though the map laid out again without them may in the end have a place for one:
     at 1536 x 582 and 125% springfield's card stood in the column over a map on which its place, where the
     draft before had it, lay free. Each of the column's cards is tried on the map as it stands, placed as any
     card is (placeCardSteps, the last tier too; no room is moved for it). The column keeps the height it was
     laid out with (S.colHold: fitColumn, textBoxes), whether its last card has gone back or not, so nothing of
     the page moves: the map was laid out round a column of that height) */
  /* (round 11, 2026-10-13: and a venue left without its scene takes one. The cards' last look may drop a venue's
     scene so that a card finds a place (its own, or a neighbour's: on the upright tablet, 768 x 1024, flushing's
     scene went so that mercer county's card could stand by its venue, and flushing played nothing: the owner,
     "有能播放的方法么？"); yet the map as it stands at last may have a room for it. Looked for as a room moved for
     a card is (roomRepairSteps, fresh: within reach of its stop, name and pictures, clearly its own, clear of
     every road, stop, flag, row, leader, room, lake and him, and of the cards it has, each placed as if no room
     were there); then its cards are placed again beside it, as cards are, and the scene is kept only where
     every one of them that had a place by its venue still has one. Else the map is put back as it was) */
  function* sceneBack() {
    for (var pi = 0; pi < S.PL.length; pi++) {
      var P = S.PL[pi];
      if (P.room || !P.rw || !P.rh || !P.LB || !P.slots.some(function (sl) { return sl.A && sl.sky; })) continue;
      var dots0 = pg.L.dots, list = pg.selsOf(P).filter(function (o) { return !S.colKeys[o.key] && S.cards[o.key]; }), got = {}, ok = true;
      yield 4;
      if (!(yield* pg.roomRepairSteps(P, false, true))) continue;
      for (var k = 0; ok && k < list.length; k++) {
        var c = yield* pg.placeCardSteps(P, list[k]);
        if (c.fail) c = yield* pg.placeCardSteps(P, list[k], true);
        if (c.fail) ok = false; else got[list[k].key] = c;
        yield;
      }
      if (ok) Object.keys(got).forEach(function (key) { S.cards[key] = got[key]; });
      else {
        /* (put back: the room's cells, the room, the terrain's dots) */
        for (var y = Math.max(0, P.room.y0); y < Math.min(pg.L.rows, P.room.y1); y++) for (var x = Math.max(0, P.room.x0); x < Math.min(pg.L.cols, P.room.x1); x++) pg.L.occ[y * pg.L.cols + x] &= ~BOX;
        P.room = null; pg.L.dots = dots0;
      }
      P.room0 = null;
    }
  }
  function* backSteps() {
    for (var pi = 0; pi < S.PL.length; pi++) {
      var P = S.PL[pi], list = pg.selsOf(P);
      for (var k = 0; k < list.length; k++) {
        var o = list[k];
        if (!S.colKeys[o.key]) continue;
        yield 3;
        var c = yield* pg.placeCardSteps(P, o);
        if (c.fail) c = yield* pg.placeCardSteps(P, o, true);
        if (c.fail) continue;
        if (!S.colHold) S.colHold = pg.handMax();
        delete S.colKeys[o.key]; S.handW = 0;
        S.cards[o.key] = c;
      }
    }
  }
  /* the laying out in one go, as ever (its steps, generators, are the draft's: a page made ready a few ms at a time in
     idle moments, phase 6, would run them so) */
  function full() { var g = fullSteps(); while (!g.next().done); }
  function* fullSteps() {
    var resume = null;
    /* (a laying out let go of half way, the page being made ready and the reader going elsewhere, is not taken for
       one that was finished: the words' sizes it was worked out for are set at its end, and unset from here) */
    S.sig = null;
    if (S.trip) {
      var T = S.trip;
      S.trip = null; cancelAnimationFrame(S.raf); S.raf = 0; pg.upMan(false);
      S.at = T.P; S.node = T.P.node;
    }
    S.act = null; S.scenes = []; cancelAnimationFrame(S.sraf); S.sraf = 0;
    if (pg.shown() && S.at === pg.shown().P) resume = pg.shown();
    S.mode = pg.narrow() ? 'col' : 'map';
    S.handW = 0;
    pg.drawStats();
    pg.drawDiscCanvases(keyEl);   /* (the key's discs drawn before it is measured, or a blank canvas's 300 x 150 counts) */
    S.colKeys = {}; S.colHold = 0; S.avoid = null; S.tightMin = null; S.seekOn = false;
    /* (the words' own size on a coarse grid, once taken on this screen (below), kept while the screen is as it is:
       the other season's words not a size larger) */
    var fk = window.innerWidth + 'x' + window.innerHeight + '@' + pg.DPR();
    if (S.plainKey !== fk) { S.plain = false; S.plainKey = fk; }
    /* (the column at rest while the map is laid out, as a card is shown only then: its words, the next race's line
       among them, are what the cards keep clear of. Round 5: a race pinned whose details had taken the column left
       the next line out of that, and its card, back on the map, lay over the line) */
    pg.showHand();
    yield* layout(); yield* pg.terrainSteps(); yield;
    /* a card that finds no place, its venue's other places tried (retry), takes the column, it alone (the column
       holds the tallest of those, and the map is laid out again round it); should that leave others without one,
       they join it, twice at most; then all */
    for (var n = 0; S.mode === 'map'; n++) {
      var miss = (yield* pg.cardsPlaced());
      if (!miss.length) break;
      if (!n && window.innerHeight >= SHORT) { miss = yield* retry(miss); if (!miss.length) break; }
      /* (a large screen's coarse grid whose cards do not all find their places by their venues sets its words and
         cards at their own size, not a size larger, before any card takes the column: round 5's second look,
         Mercer's two crews at 2560 x 1440 and 150%, its scene now kept by it) */
      if (!n && pg.L.big && !S.plain) { S.plain = true; S.avoid = null; S.colKeys = {}; S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; n = -1; continue; }
      /* (and before any takes the column, round 5's third look: the placing's last look for the venues whose cards find
         no place (solve: seek), the map laid out again with it, kept where fewer cards are left without a place, and
         on for what follows; then, on a screen SHORT px tall or more, as retry, the column at rest closed up, its gaps
         (r-tight, as it is on these screens where a card's details take it), kept where that leaves fewer without a
         place (Mercer's card a few px short of a place under the column's last line, 640 to 660px tall)) */
      if (!n && !S.seekOn && !pg.L.phone) {
        S.seekOn = true;
        if (!(yield* reseekSteps())) { S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; }
        var m1 = (yield* pg.cardsPlaced());
        if (!m1.length) break;
        if (m1.length > miss.length) { S.seekOn = false; S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; m1 = (yield* pg.cardsPlaced()); S.seekOn = true; }
        miss = m1;
      }
      if (!n && window.innerHeight >= SHORT && S.tightMin == null && !sea.classList.contains('r-tight')) {
        var cut3 = pg.L.cut;
        S.tightMin = 1; S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield;
        var m3 = (yield* pg.cardsPlaced());
        if (!m3.length && pg.L.cut <= cut3) break;
        if (m3.length >= miss.length || pg.L.cut > cut3) { S.tightMin = 0; S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; m3 = (yield* pg.cardsPlaced()); }
        miss = m3;
      }
      if (n === 2) { S.mode = 'col'; S.colKeys = {}; S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield; S.cards = {}; break; }
      miss.forEach(function (k) { S.colKeys[k] = 1; });
      S.handW = 0; yield* layout(); yield* pg.terrainSteps(); yield;
    }
    if (S.mode === 'map' && pg.anyCol()) yield* backSteps();
    if (S.mode === 'map' && !pg.L.phone) yield* sceneBack();
    pg.L.R = null; pg.SOLVED.clear();   /* (the solving's state let go of, and what the solves kept of the map) */
    yield;
    /* (a season made ready out of sight is not drawn there: wake draws it as it puts it up, in the stage of then) */
    yield 4; audit(); yield 3; pg.timelineWords(); pg.showHand(); yield 4; if (!S.prepping) yield* paintSteps(); yield;
    pg.breathe(); pg.keyAt();
    pg.snapTo(pxEl); pg.snapTo(tpxEl); pg.snapStats();
    requestAnimationFrame(pg.snapStats);   /* (once more after the frame's own nudge, which comes in the next frame) */
    pg.hideCards(true); pg.showCard();
    if (resume) pg.settle(resume);
    S.sig = pg.sig();
    stageEl.style.visibility = '';
    I.ready = true;
  }
  /* the map laid out (fresh: a page just made), or checked as a resize checks it and against its words' sizes, and
     drawn as it stands; then what the address names is pinned: he is there already, in its scene, the flag up (an
     address opened is not a walk) */
  /* (the speed round: the window as the grid was measured for a laying out (layout), whole: a season made ready out
     of sight is put up as it was laid out there only where the window measures the same in every part, the rows a
     phone's height gives included, which a season put away and up again does not ask) */
  function gridKey(g) { return [g.phone ? 1 : 0, g.u, g.cs, g.cols, g.rows, g.dpr, g.A, g.dx, g.x0, g.y0, g.tlL, g.colL, g.colR].join(','); }
  function landing(A, fresh) {
    if (!mapEl.isConnected) return;
    var g = null, made = S.made;
    S.made = false;
    if (fresh || !pg.L || pg.sig() !== S.sig || !pg.same2(g = pg.measure()) || (made && gridKey(g) !== S.gk)) full();
    else { pg.relayout(g); paint(); I.ready = true; }
    var want = A.next && S.nx ? S.nx.race : A.want, wantV = A.wantV, sel0 = null;
    if (want) { var W0 = S.races.filter(function (R) { return R.r === want; })[0]; if (W0 && W0.p) sel0 = { P: W0.p, slot: W0.slot, R: W0.slot && W0.slot.races.length > 1 ? W0 : null }; }
    else if (wantV) {
      var P0 = S.PL.filter(function (P) { return slug(P.name) === wantV.v; })[0], sl0 = P0 && wantV.s ? P0.slots.filter(function (x) { return x.sport === wantV.s; })[0] : null;
      if (P0) sel0 = sl0 && P0.multi ? { P: P0, slot: sl0, R: null } : pg.venueSel(P0);
    }
    if (sel0) { S.at = sel0.P; S.node = sel0.P.node; S.instant = true; pg.pin(sel0, false); S.instant = false; }
    pg.syncUrl();
    requestAnimationFrame(function () { [].forEach.call(sea.querySelectorAll('.tb-word, .r-st canvas'), function (c) { snap(c); }); });
  }
  /* the frame fills the ring and the footer after this render: the map is laid out once they are in, before the
     first paint (a microtask). An address
     opened cold, the page's type still on its way: the map waits for it, FONT_WAIT ms at most (its place kept
     blank), and is laid out once; it was laid out twice, before the type and after it */
  var FONT_WAIT = 300, fontT = 0, landN = 0;
  function begin(A, fresh) {
    pg.arm();
    /* (the site's: a landing still to come is the last begin's only; one the page was put away before, or begun
       again before, lands nothing, so the address of the moment is the one pinned) */
    var n = ++landN;
    if (fresh && document.fonts && document.fonts.ready && document.fonts.status === 'loading') {
      var went = false, goNow = function () { if (went || n !== landN) return; went = true; clearTimeout(fontT); land(A, true); };
      stageEl.style.visibility = 'hidden';
      document.fonts.ready.then(goNow);
      fontT = setTimeout(goNow, FONT_WAIT);
      return;
    }
    Promise.resolve().then(function () { if (n === landN) land(A, fresh); });
  }
  /* (the site's: a landing that throws (a canvas that gives no drawing context, say) is the mount's to undo: index.js
     puts back what the server printed; host.fail) */
  function land(A, fresh) {
    try { landing(A, fresh); } catch (e) { if (host.fail) host.fail(e); else throw e; }
  }
  /* (the landing still to come let go of: the page put away, by the switch or by an address) */
  function unland() { landN++; clearTimeout(fontT); }
  /* put up again: on the frame's paper as it was left; the title's word and the counts' figures made again (they
     are the frame's to paint, and a page that was away is no longer on its list); nothing in hand, him at home */
  function wake(m2, A) {
    pg.main = m2;   /* (the element the page stands in) */
    pg.main.appendChild(sea);
    var t2 = title(gridEl);
    gridEl.insertBefore(t2, pg.tbEl); gridEl.removeChild(pg.tbEl); t2.appendChild(statsEl); pg.tbEl = t2;
    pg.drawStats();
    rest(); S.facing = 1;
    sea.classList.remove('r-ptr'); sayEl.textContent = ''; mapEl.style.cursor = ''; tlEl.style.cursor = '';
    S.PL.forEach(function (P) { if (P.lab) P.lab.classList.remove('hov', 'cl'); });
    pg.styleOn(); pg.hideCards(true); S.handKey = null; pg.showHand();
    begin(A, false);
  }
  /* another season: its own page, kept as this one is (made the first time it is asked for), in this one's place;
     the switch keeps the focus (on its own twin there), and the season is said */
  function swap(y) {
    var ptr = sea.classList.contains('r-ptr'), A = asked(SEAS, YEARS, y);
    pg.disarm(); unland();
    if (sea.parentNode === pg.main) pg.main.removeChild(sea);
    var J = host.kept(y, DKEY);
    try { if (J) J.wake(pg.main, A); else J = makePage(pg.main, { sub: y, today: ctx.today }, A, DKEY, host); } catch (e) { if (host.fail) { host.fail(e); return; } throw e; }
    host.shown(J);
    J.arrive(ptr);
  }
  function arrive0(ptr) {
    sea.classList.toggle('r-ptr', !!ptr);
    var b = yearsEl && yearsEl.querySelector('button.r-y[aria-pressed="true"]');
    if (b) { try { b.focus({ preventScroll: true }); } catch (err) {} }
    sayEl.textContent = 'The ' + S.year + ' season';
  }
  /* (the site's: its page taken off main as the switch takes it, to be put up again by wake, this season's or
     another's, when the address changes under it: Back, Forward, a fragment followed; and its polite line) */
  function away() {
    pg.disarm(); unland();
    if (sea.parentNode) sea.parentNode.removeChild(sea);
  }
  function say(t) { sayEl.textContent = t; }
  /* the fonts, should they come late, change the words' sizes: the column, the names and the clubs are measured
     again (only then: a face that changes none of the page's words, as the bold one a heading out of sight asked
     for, lays nothing out) */
  /* (round 11, 2026-10-13: what was kept of the stand-in face is let go of first, the cards' sizes and the words'
     own size on a coarse grid, so that the map is laid out again as a machine with its type in from the start
     lays it out. Still only where faces were on their way as the page was made, as before: a builder's wider
     rule, at every face that arrives later too, was not proven free of a layout under his pointer and was
     left out) */
  var typeIn = function () { if (mapEl.isConnected && pg.L && S.sig != null && pg.sig() !== S.sig) { pg.forgetCards(); S.plainKey = null; full(); } };
  /* (the mount let go of, index.js: nothing heard, nothing moving, no timer left, the page off the page. The site's
     lettering keeps a list of the canvases it repaints, the title's and the counts' among them, until its next
     repaint: they are taken out of the page's tree first, so that list holds nothing of the page but them, and the
     lettering then repaints, which lets go of every canvas no longer on the page) */
  function destroy() {
    pg.disarm(); unland();
    if (sea.parentNode) sea.parentNode.removeChild(sea);
    [].forEach.call(sea.querySelectorAll('canvas'), function (c) { c.parentNode.removeChild(c); });
    repaint();
  }
  Object.assign(pg, { full: full, paint: paint, swap: swap });

  /* ---------- start: the newest season (or the one asked for: #/race/2025, #/race/<race id>, #/race/next) ---------- */
  /* (a season named in the address is the one opened: its races' ids and its venues are looked up in it alone, so
     #/race/2025/hartford is 2025's Hartford, and #/race/2025/flushing, a venue 2025 did not have, the 2025 season;
     round 5's check found the newest season's race of that id opened instead. With no season named, a race's id
     is looked up in every season, the newest first, and a venue's name in the newest) */
  var y0 = ASK.year;
  var I = { year: y0, day: DKEY, data: host.races, wake: wake, sleep: pg.disarm, away: away, say: say, arrive: arrive0, destroy: destroy, ready: false };
  if (!y0) { handEl.innerHTML = ''; return I; }
  /* (made ready out of sight, ctx.prep: in steps, kept once made, put up by wake) */
  if (ctx.prep) {
    I.steps = (function* () {
      S.prepping = true;
      yield* setYearSteps(y0);
      pg.listen();
      yield* fullSteps();
      S.prepping = false;
      if (sea.parentNode) sea.parentNode.removeChild(sea);
      S.made = true;
      host.keep(y0, I);
    })();
    return I;
  }
  host.keep(y0, I);
  setYear(y0);
  pg.listen();
  if (document.fonts && document.fonts.ready && document.fonts.status !== 'loaded') document.fonts.ready.then(typeIn);
  begin(ASK, true);
  return I;
}
