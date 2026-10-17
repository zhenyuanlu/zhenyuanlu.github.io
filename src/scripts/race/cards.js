// The race map's cards, names and leaders, and the left column: each venue's name (a button on its strip of paper)
// and its sports' buttons, set where the placing put them (applyRows); the medals' key in the map's open sea; what is
// at hand, in a small card by its venue (its words measured at four widths, its place found by layout.js, its dotted
// leader drawn) or in the column (a short screen, a phone); the column at rest (the counts in the home's pixel
// figures, the next race in one line). Ported from the draft (design/assets/v2ac/race.js); each comment is the
// draft's own. The figures are the site's pixel lettering (scripts/lettering/).
import { figureBits, pixelCanvas, snap } from '../lettering/index.js';
import { DIGITS } from './consts.js';
import { cap } from './util.js';

export function installCards(pg) {
  var E = pg.E, LATEST = pg.LATEST, S = pg.S, YEARS = pg.YEARS, cardEls = pg.cardEls, cardsEl = pg.cardsEl, clv = pg.clv, cprobeEl = pg.cprobeEl, handEl = pg.handEl, keyEl = pg.keyEl, labsEl = pg.labsEl, mapEl = pg.mapEl, probeEl = pg.probeEl, sea = pg.sea, statsEl = pg.statsEl;
  /* a number in the home's pixel figures: its cells, and its figures one by one for the frame's fitting (lettering is
     one size on every screen, 2026-10-12: the lettering grid-fitted, scripts/lettering/) */
  function figures(n) {
    return figureBits(String(n).split('').map(function (ch) { return DIGITS[ch] ? DIGITS[ch].split(' ') : null; }), 2);
  }
  function drawStats(el) {
    el = el || statsEl;
    var C = pg.countsOf(S.races);
    el.innerHTML = '<p class="sr">' + E(C.length ? C.map(function (c) { return c[0] + ' ' + (c[0] === 1 ? c[1].replace(/s$/, '') : c[1]); }).join(', ') : 'No race run yet this season') + '</p>';
    C.forEach(function (c) {
      var s = pg.el('span', 'r-st'), w = pg.el('span', 'r-sw', E(c[0] === 1 ? c[1].replace(/s$/, '') : c[1]));
      s.setAttribute('aria-hidden', 'true');
      /* (the desktop's figures are lettering: 2px cells at 100% on the plain page, that size times the page's
         step on every screen, fitted to the device grid where that is not whole cells. The phone layout's: whole
         cells, as ever) */
      s.appendChild(pixelCanvas(figures(c[0]), { cell: pg.narrow() ? 1.5 : 2, colour: 'ink', fit: !pg.narrow() }));
      s.appendChild(w);
      el.appendChild(s);
    });
  }
  /* the column at rest: the next race; on a phone, where the column is docked under the map, the season's counts
     over it (they give way to what is chosen, so the dock it holds is no taller) */
  function restHTML() { return (pg.narrow() ? '<div class="r-stats r-dstats"></div>' : '') + nextHTML(); }
  function restFill(el) { var d = el.querySelector('.r-dstats'); if (d) drawStats(d); }
  /* the left column's tallest state in any season (every race, every sport's races, every venue of several
     sports), rendered in a hidden twin of the column as wide as it: where the details take the column (a short
     screen, a phone), the column and so the map keep their size when the season or the race changes */
  function handMax() {
    var w = handEl.clientWidth;
    if (S.handW === w && S.handH != null) return S.handH;
    var mx = 0, states = [restHTML()];
    if (S.mode === 'col') YEARS.forEach(function (y) {
      var M = y === S.year ? { races: S.races, PL: S.PL } : pg.model(y);
      M.races.forEach(function (R) { states.push(handHTML({ P: R.p, slot: R.slot, R: R })); });
      M.PL.forEach(function (P) {
        P.slots.forEach(function (sl) { if (sl.races.length > 1) states.push(handHTML({ P: P, slot: sl, R: null })); });
        if (P.multi) states.push(handHTML({ P: P, slot: null, R: null }));
      });
    });
    /* (where only some cards take the column, only theirs) */
    else S.PL.forEach(function (P) { selsOf(P).forEach(function (o) { if (S.colKeys[o.key]) states.push(handHTML(o.sel)); }); });
    probeEl.style.width = w + 'px';
    states.forEach(function (h) { probeEl.innerHTML = h; restFill(probeEl); pg.drawDiscCanvases(probeEl); mx = Math.max(mx, probeEl.offsetHeight); });
    probeEl.innerHTML = '';
    S.handW = w; S.handH = Math.ceil(mx);
    return S.handH;
  }
  /* (its box, a layer of its own, on a whole device pixel, then its discs on whole device pixels, as a card's are:
     round 5's check found two of the five resampled at 125%) */
  function keyAt() {
    if (!pg.L || !pg.L.keyB) return;
    var l = Math.round(mapEl.offsetLeft + (pg.L.keyB.x0 + 1) * pg.L.cs), t = Math.round(mapEl.offsetTop + (pg.L.keyB.y0 + 1) * pg.L.cs), dpr = pg.DPR();
    keyEl.style.left = l + 'px'; keyEl.style.top = t + 'px';
    var kr = keyEl.getBoundingClientRect(), kx = kr.left + window.scrollX, ky = kr.top + window.scrollY;
    keyEl.style.left = (l + (Math.round(kx * dpr) - kx * dpr) / dpr).toFixed(4) + 'px';
    keyEl.style.top = (t + (Math.round(ky * dpr) - ky * dpr) / dpr).toFixed(4) + 'px';
    [].forEach.call(keyEl.querySelectorAll('canvas'), function (c) { snap(c); });
  }
  /* ---------- the buttons: each venue's name (a venue of one sport stands for its race(s); of several, for the
     venue), and at a venue of several sports a button over each sport's picture. In date order. ---------- */
  function makeButtons() {
    labsEl.innerHTML = '';
    S.btns = [];
    S.PL.forEach(function (P, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'r-lab';
      b.innerHTML = (P.hasNext ? '<i class="r-dot" aria-hidden="true"></i>' : '') + E(P.name);
      b.setAttribute('aria-label', pg.toldVenue(P));
      labsEl.appendChild(b);
      P.lab = b;
      pg.wire(b, function () { return venueSel(P); });
      b.tgt = function () { return { key: 'v' + i, sel: venueSel(P) }; };
      P.slots.forEach(function (sl, j) {
        sl.btn = null;
        if (!P.multi || !sl.A) return;
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'r-ic';
        c.setAttribute('aria-label', pg.toldSlot(sl));
        labsEl.appendChild(c);
        sl.btn = c;
        pg.wire(c, function () { return { P: P, slot: sl, R: null }; });
        c.tgt = function () { return { key: 's' + i + '.' + j, sel: { P: P, slot: sl, R: null } }; };
      });
    });
  }
  /* each name's size as the placing reads it (layout.js solve and apply): measured as its type stands now (page.js
     calls it whenever the names' size is set: before a form is solved and before the form chosen is applied) */
  function measureRows() { S.PL.forEach(function (P) { if (P.lab) { P.lw = P.lab.offsetWidth; P.lh = P.lab.offsetHeight; } }); }
  /* the placing's answers on the page (layout.js apply): each name at its place, without its strip of paper where it
     lies on a road; each sport's button over its picture (on a phone a finger's size), hidden where it has none */
  function applyRows() {
    S.PL.forEach(function (P) {
      if (P.lab && P.labAt) { P.lab.style.transform = 'translate(' + P.labAt[0] + 'px,' + P.labAt[1] + 'px)'; P.lab.classList.toggle('bare', !!P.bare); }
      P.slots.forEach(function (sl) {
        if (!sl.btn) return;
        if (!sl.pic || !sl.btnBox) { sl.btn.hidden = true; return; }
        var b = sl.btnBox;
        sl.btn.hidden = false;
        sl.btn.style.transform = 'translate(' + b.x0 + 'px,' + b.y0 + 'px)';
        sl.btn.style.width = (b.x1 - b.x0) + 'px';
        sl.btn.style.height = (b.y1 - b.y0) + 'px';
      });
    });
  }
  function venueSel(P) { return P.multi ? { P: P, slot: null, R: null } : { P: P, slot: P.slots[0], R: null }; }
  /* the key, in the map's open sea at its bottom right (on a phone too) */
  function placeKey() {
    pg.L.keyB = null;
    keyEl.style.left = ''; keyEl.style.top = ''; keyEl.style.maxWidth = '';
    if (keyEl.hidden) return;
    /* (on one line where it fits in 0.42 of the map's width, else on two lines, about half each: round 5's finisher
       left "qualified" alone on a second line) */
    keyEl.style.maxWidth = 'none';
    var nat = keyEl.offsetWidth, cap = Math.max(120, Math.round(pg.L.W * 0.42));
    keyEl.style.maxWidth = (nat <= cap ? nat + 1 : Math.min(cap, Math.ceil(nat * 0.62))) + 'px';
    var cs = pg.L.cs, kw = Math.ceil(keyEl.offsetWidth / cs), kh = Math.ceil(keyEl.offsetHeight / cs);
    var x0 = pg.L.cols - kw - Math.max(1, pg.L.gr), y0 = pg.L.rows - kh - 1;
    pg.L.keyB = { x0: x0 - 1, y0: y0 - 1, x1: x0 + kw + 1, y1: y0 + kh + 1 };
    keyEl.style.left = Math.round(mapEl.offsetLeft + x0 * cs) + 'px';
    keyEl.style.top = Math.round(mapEl.offsetTop + y0 * cs) + 'px';
  }
  /* ---------- the card: what is at hand, next to its venue (the owner's question, 2026-10-07: details where the eye
     already is). On the map's paper beside the venue's room, the scene and the words together; a cell of paper
     from every road, stop, flag, row, leader and the key; 40px from the column's words at least, and off their
     lines within 120px. Each venue's largest card is measured before the placing (so its room keeps space for it,
     and its row takes the side that leaves it some), and every card's place is found once the map is laid out:
     should one not fit, its venue's room makes way; should it still not fit, its details take the left column on
     this screen, its alone (round 4's check: never all the cards for one) ---------- */
  function selsOf(P) {
    var out = [];
    var i = S.PL.indexOf(P);
    if (P.multi) out.push({ key: 'v' + i, sel: { P: P, slot: null, R: null } });
    P.slots.forEach(function (sl, j) {
      out.push({ key: 's' + i + '.' + j, sel: { P: P, slot: sl, R: null } });
      if (sl.races.length > 1) sl.races.forEach(function (R) { out.push({ key: 'r' + S.races.indexOf(R), sel: { P: P, slot: sl, R: R } }); });
    });
    return out;
  }
  function selKey(s) {
    if (!s) return '';
    var i = S.PL.indexOf(s.P);
    if (s.R && s.slot && s.slot.races.length > 1) return 'r' + S.races.indexOf(s.R);
    if (s.slot) return 's' + i + '.' + s.P.slots.indexOf(s.slot);
    return 'v' + i;
  }
  /* what is at hand where the details take the column: on a short desktop screen as before; docked under a phone's
     map, the card's own compact words (so the dock it holds is no taller than it need be) */
  function handHTML(s) { return pg.narrow() ? '<div class="r-dock">' + cardHTML(s) + '</div>' : detailHTML(s); }
  /* what is at hand, in the column (as before) */
  function detailHTML(s) {
    if (s.R) return raceHTML(s.R);
    if (s.slot) return s.slot.races.length === 1 ? raceHTML(s.slot.races[0]) : groupHTML(s.slot);
    return venueHTML(s.P);
  }
  var RDOT = '<i class="r-dot" aria-hidden="true"></i>';
  function cardRace(R) {
    var st = pg.statusOf(R), res = pg.done(R) ? pg.resultWords(R) : '', md = R.md || [], h = '';
    if (st) h += '<p class="c-s">' + items(st.text.split(' · ').map(function (x, j) { return (j || !st.red ? '' : RDOT) + E(x); })) + '</p>';
    h += '<p class="c-m">' + items(['<span class="num">' + E(R.w.approx ? R.w.long : R.w.label) + '</span>', E(pg.shortPlace(R.r.place))]) + '</p>';
    h += '<p class="c-n">' + E(R.r.name) + '</p>';
    pg.crewsOf(R).forEach(function (c) { h += '<p class="c-c">' + items(pg.crewParts(c).map(E)) + '</p>'; });
    if (res || md.length) h += '<p class="c-r">' + items(res ? res.split(' · ').map(E) : [], md) + '</p>';
    if (pg.medleyWords(R)) h += '<p class="c-y">' + items(pg.medleyWords(R).split(' · ').map(E)) + '</p>';
    return h;
  }
  function cardHTML(s) {
    if (s.R) return cardRace(s.R);
    var sl = s.slot, h;
    if (sl && sl.races.length === 1) return cardRace(sl.races[0]);
    if (sl) {
      h = '<p class="c-n">' + E(pg.sportWord(sl)) + '</p>';
      sl.races.forEach(function (R) {
        var st = pg.statusOf(R), res = pg.done(R) ? pg.resultWords(R) : '';
        h += '<p class="c-l ' + (pg.done(R) ? 'dn' : 'tc') + '">' + items([(pg.isNext(R) ? RDOT : '') + E(pg.shortOf(R, sl.races)), '<span class="num">' + E(R.w.label) + '</span>',
          st ? E(st.red ? 'next' : st.text) : ''].concat(res ? res.split(' · ').map(E) : []), R.md) + '</p>';
      });
      return h;
    }
    h = '<p class="c-n">' + E(cap(s.P.name)) + '</p>';
    s.P.slots.forEach(function (sl2) {
      h += '<p class="c-l ' + (sl2.races.every(pg.done) ? 'dn' : 'tc') + '">' + items([(sl2.races.some(pg.isNext) ? RDOT : '') + E(cap(pg.sportWord(sl2))),
        '<span class="num">' + E(sl2.races.map(function (R) { return R.w.label; }).join(', ')) + '</span>']) + '</p>';
    });
    return h;
  }
  /* a card's words at a width (CSS px): its size. Four widths, narrow and tall to wide and low */
  var CARD_W = [140, 168, 204, 244], CARD_WB = [162, 194, 236, 282];
  function cardW() { return pg.L && pg.L.big ? CARD_WB : CARD_W; }
  /* (laid out at the width, then drawn in to its widest line: a line of several parts asks the width of all its parts
     on one line, so a card would keep blank paper at its side; tw is the width it is shown at) */
  /* (round 7: a card's words at a width are measured once and remembered while what sets a card's type stands (the
     cards' and the words' size on this map, the screen's scale, the window, the type in or not): the placing asks
     for the same ones again at every form and every try. Its medals take their room without being drawn) */
  var CARDM = new Map(), CARDK = '';
  /* (the type come late: what was measured of the stand-in face let go of, page.js typeIn) */
  function forgetCards() { CARDM.clear(); CARDK = ''; }
  function measureCard(h, w, flow, anew) {
    var ck = (cardsEl.classList.contains('r-cmp') ? 'c' : '') + (sea.classList.contains('r-big') ? 'b' : '') + '|' + pg.DPR() + '|' + window.innerWidth + 'x' + window.innerHeight + '|' + (document.fonts ? document.fonts.status : '');
    if (ck !== CARDK) { CARDM.clear(); CARDK = ck; }
    var mk = w + (flow ? 'f' : '') + '|' + h, m0 = anew ? null : CARDM.get(mk);
    if (m0) return { w: m0.w, h: m0.h, mw: m0.mw, tw: m0.tw };
    var m1 = measureCard1(h, w, flow);
    CARDM.set(mk, m1);
    return { w: m1.w, h: m1.h, mw: m1.mw, tw: m1.tw };
  }
  /* (round 11, 2026-10-13: a card's words at its several widths measured together: a twin of the probe each, all
     put on the page, then all read, so the browser lays the lot out once (and once more for those drawn in to
     their words) where it laid out the card at one width at a time, 64 to 70 times on a screen's first laying
     out. Each twin is the probe's own element with the same words at the same width, a box of its own
     (absolute, as wide as its words up to its width), so its numbers are the ones the probe gives; they are
     remembered as measureCard's are, under the same names. reqs: [words, width, flow]) */
  function measureMany(reqs) {
    var ck = (cardsEl.classList.contains('r-cmp') ? 'c' : '') + (sea.classList.contains('r-big') ? 'b' : '') + '|' + pg.DPR() + '|' + window.innerWidth + 'x' + window.innerHeight + '|' + (document.fonts ? document.fonts.status : '');
    if (ck !== CARDK) { CARDM.clear(); CARDK = ck; }
    var todo = [], seen = {}, host = cprobeEl.parentNode;
    reqs.forEach(function (q) { var mk = q[1] + (q[2] ? 'f' : '') + '|' + q[0]; if (!CARDM.has(mk) && !seen[mk]) { seen[mk] = 1; todo.push({ h: q[0], w: q[1], flow: !!q[2], mk: mk, e: null, r: null, tw: 0 }); } });
    if (todo.length < 2 || !host) return;   /* (one: measured as ever, when it is asked for) */
    todo.forEach(function (t) {
      var e = t.e = cprobeEl.cloneNode(false);
      e.style.width = ''; e.style.maxWidth = t.w + 'px';
      e.classList.toggle('c-flow', t.flow);
      e.innerHTML = t.h;
      host.appendChild(e);
      pg.drawDiscCanvases(e, true);
    });
    todo.forEach(function (t) {
      var e = t.e, cr = e.getBoundingClientRect(), pr = pg.px(e, 'paddingRight'), right = cr.left, rg = document.createRange(), tw0 = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), tn;
      while ((tn = tw0.nextNode())) { rg.selectNodeContents(tn); [].forEach.call(rg.getClientRects(), function (q) { if (q.width > 0) right = Math.max(right, q.right); }); }
      [].forEach.call(e.querySelectorAll('canvas, .r-dot'), function (c) { right = Math.max(right, c.getBoundingClientRect().right); });
      t.r = { w: e.offsetWidth, h: e.offsetHeight, mw: t.w, tw: 0 }; t.tw = Math.ceil(right - cr.left + pr);
    });
    var again = todo.filter(function (t) { return t.tw < t.r.w - 1; });
    again.forEach(function (t) { t.e.style.width = t.tw + 'px'; t.e.style.maxWidth = 'none'; });
    again.forEach(function (t) { if (t.e.offsetHeight === t.r.h) { t.r.w = t.e.offsetWidth; t.r.tw = t.tw; } });
    todo.forEach(function (t) { host.removeChild(t.e); CARDM.set(t.mk, t.r); });
  }
  function measureCard1(h, w, flow) {
    cprobeEl.style.width = ''; cprobeEl.style.maxWidth = w + 'px';
    cprobeEl.classList.toggle('c-flow', !!flow);
    cprobeEl.innerHTML = h;
    pg.drawDiscCanvases(cprobeEl, true);
    var cr = cprobeEl.getBoundingClientRect(), pr = pg.px(cprobeEl, 'paddingRight'), right = cr.left, rg = document.createRange(), tw0 = document.createTreeWalker(cprobeEl, NodeFilter.SHOW_TEXT), tn;
    while ((tn = tw0.nextNode())) { rg.selectNodeContents(tn); [].forEach.call(rg.getClientRects(), function (q) { if (q.width > 0) right = Math.max(right, q.right); }); }
    [].forEach.call(cprobeEl.querySelectorAll('canvas, .r-dot'), function (e) { right = Math.max(right, e.getBoundingClientRect().right); });
    var r = { w: cprobeEl.offsetWidth, h: cprobeEl.offsetHeight, mw: w, tw: 0 }, tw = Math.ceil(right - cr.left + pr);
    if (tw < r.w - 1) {
      cprobeEl.style.width = tw + 'px'; cprobeEl.style.maxWidth = 'none';
      if (cprobeEl.offsetHeight === r.h) { r.w = cprobeEl.offsetWidth; r.tw = tw; }
      cprobeEl.style.width = ''; cprobeEl.style.maxWidth = w + 'px';
    }
    cprobeEl.innerHTML = '';
    return r;
  }
  /* each venue's largest card at a middle width and at the widest, in cells (its room keeps space for one of them;
     none where the details take the column); and at the widest with its crews' lines run on (flow, as placeCard
     tries it last: round 5's third look, Mercer's two crews at 640 to 690px tall, a card the placing thought too
     tall for every place by its venue) */
  function* cardSizes() {
    for (var pk = 0; pk < S.PL.length; pk++) {
      var P = S.PL[pk];
      P.cw = P.ch = P.cw2 = P.ch2 = P.cw0 = P.ch0 = P.cwf = P.chf = 0;
      if (S.mode !== 'map') continue;
      var list = selsOf(P);
      for (var k = 0; k < list.length; k++) {
        var o = list[k];
        if (S.colKeys[o.key]) continue;
        var h = cardHTML(o.sel), W4 = cardW();
        /* (round 11: the card's words at the four widths its placing asks for and, with crews, at the widest with
           their lines run on, measured together: one layout or two for the step, where it was four: measureMany) */
        measureMany(W4.map(function (cw) { return [h, cw, false]; }).concat(/class="c-c"/.test(h) ? [[h, W4[3], true]] : []));
        var m = measureCard(h, W4[1]), m2 = measureCard(h, W4[3]), m0 = measureCard(h, W4[0]);
        var mf = /class="c-c"/.test(h) ? measureCard(h, W4[3], true) : m2;
        P.cw = Math.max(P.cw, Math.ceil(m.w / pg.L.cs - 1e-6)); P.ch = Math.max(P.ch, Math.ceil(m.h / pg.L.cs - 1e-6));
        P.cw2 = Math.max(P.cw2, Math.ceil(m2.w / pg.L.cs - 1e-6)); P.ch2 = Math.max(P.ch2, Math.ceil(m2.h / pg.L.cs - 1e-6));
        P.cw0 = Math.max(P.cw0, Math.ceil(m0.w / pg.L.cs - 1e-6)); P.ch0 = Math.max(P.ch0, Math.ceil(m0.h / pg.L.cs - 1e-6));
        P.cwf = Math.max(P.cwf, Math.ceil(mf.w / pg.L.cs - 1e-6)); P.chf = Math.max(P.chf, Math.ceil(mf.h / pg.L.cs - 1e-6));
        yield 3;   /* (the next card's words at four widths: reflows, 2 to 3ms where they are not remembered; said since the fourth round) */
      }
    }
  }
  /* every card's place on this screen (the details' words measured at each width, then placed: the place that suits
     it best wins, a lower card and the middle widths by a little); a venue whose card finds none moves its scene's
     room to make way for it (roomRepair); the keys of those that still find none (their details take the column) */
  function placeCard(P, o, last) { var g = placeCardSteps(P, o, last), r = g.next(); while (!r.done) r = g.next(); return r.value; }
  function* placeCardSteps(P, o, last) {
    /* (first clear of the coast and the lakes and on its scene's side; else over them at a cost, still on its side;
       else across from its scene, at a cost; and where it has crews and none of that finds a place, its crews' lines
       run on, a crew's club and division after its name, so it is a line or two lower: flow. last: where none of
       that finds one, even with its scene's room moved (cardsPlaced), either way: the column's guard measured
       exactly, 40px and not a cell more, and the map's edges reached, its last cell of paper too: 2026-10-07,
       Mercer's card a row short at 1366 x 657) */
    var h = cardHTML(o.sel), best = null, tried = [], seen = {}, crews = /class="c-c"/.test(h), SZ = {};
    function sizesOf(flow) {
      if (SZ[flow]) return SZ[flow];
      var sizes = SZ[flow] = [];
      measureMany(cardW().map(function (cw) { return [h, cw, flow]; }));
      cardW().forEach(function (cw, wi) {
        var m = measureCard(h, cw, flow), w = Math.ceil(m.w / pg.L.cs - 1e-6), hh = Math.ceil(m.h / pg.L.cs - 1e-6), id = w + 'x' + hh + (flow ? 'f' : '');
        if (seen[id]) return;
        seen[id] = 1; tried.push(id);
        sizes.push({ w: w, h: hh, cw: cw, tw: m.tw, pen: 0.5 * hh + 0.08 * w + (wi === 0 ? 4 : 0) });
      });
      return sizes;
    }
    /* (the same order as ever, written as loops so a step can end between two places tried) */
    var tiers = last ? [3] : [0, 1, 2];
    for (var fi = 0; fi < 2; fi++) {
      var flow = !!fi;
      if (best || (flow && !crews)) continue;
      var sizes = sizesOf(flow);
      yield;
      for (var ti = 0; ti < tiers.length && !best; ti++) {
        for (var zi = 0; zi < sizes.length; zi++) {
          var z = sizes[zi], pl = yield* pg.cardPlaceSteps(P, z.w, z.h, o.sel, tiers[ti]), sc2 = pl ? pl.s + z.pen : Infinity;
          if (sc2 < (best ? best.s : Infinity)) best = { s: sc2, b: pl.b, lead: pl.lead, mw: z.cw, tw: z.tw, dOwn: pl.dOwn, dOther: pl.dOther, flow: flow };
          yield;
        }
      }
    }
    return best ? { b: best.b, lead: best.lead, mw: best.mw, tw: best.tw, flow: best.flow, P: P, sel: o.sel, dOwn: best.dOwn, dOther: best.dOther } : { fail: P.name + ' ' + o.key + ' ' + tried.join('/') + (P.room ? '' : ' (no room)') };
  }
  function* cardsPlaced() {
    S.cards = {}; S.cardFail = []; S.missV = [];
    var miss = [], t0 = performance.now();
    if (S.mode !== 'map') return miss;
    yield 3;   /* (the cards' grid: every cell, then, a step on, the cells' sums: 2 to 3ms each) */
    yield* pg.cardGridSteps();
    yield;
    var cardsOf = function* (P) {
      function* all() {
        var got = {}, bad = [];
        var list = selsOf(P);
        for (var k = 0; k < list.length; k++) { var o = list[k]; if (S.colKeys[o.key]) continue; var c = yield* placeCardSteps(P, o); if (c.fail) bad.push([o.key, c.fail]); else got[o.key] = c; yield; }
        return { got: got, bad: bad };
      }
      var res = yield* all();
      if (res.bad.length && (yield* pg.roomRepairSteps(P))) {
        var res2 = yield* all();
        if (res2.bad.length < res.bad.length) res = res2; else pg.roomRepair(P, true);
      }
      /* (those still without a place: the last tier; a card a step, as the tiers before it) */
      if (res.bad.length) {
        var left = [];
        for (var bi = 0; bi < res.bad.length; bi++) {
          var x = res.bad[bi], o = selsOf(P).filter(function (q) { return q.key === x[0]; })[0], c = o ? (yield* placeCardSteps(P, o, true)) : null;
          if (!c || c.fail) left.push(x); else res.got[x[0]] = c;
          yield;
        }
        res.bad = left;
      }
      Object.keys(res.got).forEach(function (k) { S.cards[k] = res.got[k]; });
      res.bad.forEach(function (x) { miss.push(x[0]); S.cardFail.push(x[1]); });
      if (res.bad.length) S.missV.push(P.name);
    };
    for (var ci = 0; ci < S.PL.length; ci++) { yield* cardsOf(S.PL[ci]); yield; }
    pg.L.cms = Math.round(performance.now() - t0);
    return miss;
  }
  /* where the details take the column on this screen: everything (a phone, or a screen where the cards do not find
     their places), or only the selections whose cards found none */
  function anyCol() { for (var k in S.colKeys) if (S.colKeys[k]) return true; return false; }
  function inCol(s) { return !!s && (S.mode === 'col' || !!S.colKeys[selKey(s)]); }
  /* the card in hand: the other card element fades out as this one fades in */
  function showCard() {
    var s = pg.shown();
    if (!s || S.mode !== 'map' || !pg.L) { hideCards(); return; }
    var key = selKey(s), pl = S.cards[key];
    if (!pl) { hideCards(); return; }
    if (S.card && S.card.key === key && S.card.el.classList.contains('on')) return;
    var cur = S.card ? S.card.el : null, el = cur && cur.classList.contains('on') ? cardEls[cardEls[0] === cur ? 1 : 0] : (cur || cardEls[0]);
    el.style.maxWidth = pl.tw ? 'none' : (pl.mw || cardW()[1]) + 'px';
    el.style.width = pl.tw ? pl.tw + 'px' : '';
    el.classList.toggle('c-flow', !!pl.flow);
    el.innerHTML = cardHTML(s);
    pg.drawDiscCanvases(el);
    /* (by whole device pixels, not whole CSS px: a translate of a fraction of a device pixel (125%, or any zoomed big
       screen) is drawn off the grid, and its medals' cells with it) */
    var dp = pg.DPR();
    el.style.transform = 'translate(' + Math.round(pl.b.x0 * pg.L.cs * dp) / dp + 'px,' + Math.round(pl.b.y0 * pg.L.cs * dp) / dp + 'px)';
    cardEls.forEach(function (e) { if (e !== el) e.classList.remove('on'); });
    /* (an address opened: the card is there at once, as he is) */
    if (S.instant) { el.classList.add('r-now'); el.classList.add('on'); void el.offsetWidth; el.classList.remove('r-now'); }
    el.classList.add('on');
    [].forEach.call(el.querySelectorAll('canvas'), function (c) { snap(c); });   /* (its discs on whole device pixels) */
    var lc = clv.getContext('2d'), u = pg.L.u;
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, clv.width, clv.height);
    if (pl.lead && pl.lead.length) { lc.fillStyle = pg.colours().lead; pl.lead.forEach(function (d) { lc.fillRect(d[0] * u, d[1] * u, u, u); }); }
    clv.classList.toggle('on', !!(pl.lead && pl.lead.length));
    S.card = { key: key, el: el, b: pl.b };
    mapEl.setAttribute('data-card', JSON.stringify({ key: key, b: [pl.b.x0, pl.b.y0, pl.b.x1, pl.b.y1] }));
  }
  function hideCards(now) {
    cardEls.forEach(function (e) {
      if (now) { e.classList.add('r-now'); e.classList.remove('on'); void e.offsetWidth; e.classList.remove('r-now'); }
      else e.classList.remove('on');
    });
    clv.classList.remove('on');
    S.card = null;
    mapEl.removeAttribute('data-card');
  }
  /* ---------- the left column: at rest the next race in one line; where the details take the column (a short
     screen, a phone), what is at hand ---------- */
  function statusHTML(st) { return st ? '<p class="rh-s' + (st.red ? ' red' : '') + '">' + (st.red ? '<i class="r-dot" aria-hidden="true"></i>' : '') + E(st.text) + '</p>' : ''; }
  /* words joined by middle dots that never start or end a line: each part is an item, its dot drawn in the gap
     before it (race.css), out of sight when the part wraps to a new line */
  function items(parts, md) {
    parts = parts.filter(Boolean);
    var cvs = md && md.length ? '<canvas class="r-md" data-m="' + md.join(',') + '" aria-hidden="true"></canvas>' : '';
    if (cvs && !parts.length) return '<span class="rh-x">' + cvs + '</span>';
    return parts.map(function (p, j) { return '<span class="rh-i">' + p + (j === parts.length - 1 ? cvs : '') + '</span>'; }).join('');
  }
  /* a race: its date and place, its name, its crews (crew · club · division), its result with its medals, the
     medley's leg; a race known only by its months says so ("May or June 2026") */
  function raceHTML(R) {
    var st = pg.statusOf(R), res = pg.done(R) ? pg.resultWords(R) : '', md = R.md || [], h = statusHTML(st);
    h += '<p class="rh-m">' + items(['<span class="num">' + E(R.w.approx ? R.w.long : R.w.label) + '</span>', E(R.r.place || '')]) + '</p>';
    h += '<p class="rh-n">' + E(R.r.name) + '</p>';
    pg.crewsOf(R).forEach(function (c) { h += '<p class="rh-c">' + items(pg.crewParts(c).map(E)) + '</p>'; });
    if (res || md.length) h += '<p class="rh-r">' + items(res ? res.split(' · ').map(E) : [], md) + '</p>';
    if (pg.medleyWords(R)) h += '<p class="rh-c rh-y">' + items(pg.medleyWords(R).split(' · ').map(E)) + '</p>';
    return h;
  }
  function groupHTML(sl) {
    var h = '<p class="rh-n">' + E(pg.sportWord(sl)) + '</p>';
    h += '<ul class="rh-l">' + sl.races.map(function (R) {
      var st = pg.statusOf(R), res = pg.done(R) ? pg.resultWords(R) : '';
      return '<li class="' + (pg.done(R) ? 'dn' : 'tc') + '">' + items([(pg.isNext(R) ? '<i class="r-dot" aria-hidden="true"></i>' : '') + E(pg.shortOf(R, sl.races)),
        '<span class="num">' + E(R.w.label) + '</span>', st ? E(st.red ? 'next' : st.text) : ''].concat(res ? res.split(' · ').map(E) : []), R.md) + '</li>';
    }).join('') + '</ul>';
    return h;
  }
  /* a venue of several sports: one line each (its words and dates), the next race's line with its dot */
  function venueHTML(P) {
    var h = '<p class="rh-n">' + E(cap(P.name)) + '</p>';
    h += '<ul class="rh-l">' + P.slots.map(function (sl) {
      var n = sl.races.some(pg.isNext);
      return '<li class="' + (sl.races.every(pg.done) ? 'dn' : 'tc') + '">' + items([(n ? '<i class="r-dot" aria-hidden="true"></i>' : '') + E(cap(pg.sportWord(sl))),
        '<span class="num">' + E(sl.races.map(function (R) { return R.w.label; }).join(', ')) + '</span>']) + '</li>';
    }).join('') + '</ul>';
    return h;
  }
  /* at rest: the next race in one line, its red dot ("● next · in 3 days · Hyrox Boston, Oct 8"), on its own
     season's page (next.js: whichever season it is in); a click on it pins it on the map. With none ahead (round 7:
     the year's last race run), the newest season's latest one run and what came of it, in grey and with no dot, the
     red being only for what is to come or under way ("latest · B.A.A. Half Marathon, Nov 8 · finisher"); it is
     pointed at and pinned as the next line is. Any other season has none */
  function restRace() {
    if (S.nx) return S.races.filter(function (x) { return x.r === S.nx.race; })[0] || null;
    if (S.year !== LATEST) return null;
    var past = S.races.filter(function (R) { return R.p && R.w.a && pg.done(R); });
    return past.length ? past[past.length - 1] : null;
  }
  function nextHTML() {
    var R = restRace();
    if (!R) return '';
    if (!S.nx) {
      var res = pg.resultWords(R);
      return '<p class="r-next"><button type="button" class="r-nx r-lt">latest · <span class="r-nn">' + E(R.r.name) + ', <span class="num">' + E(R.w.label) + '</span></span>' + (res ? ' · ' + E(res) : '') + '</button></p>';
    }
    var st = pg.statusOf(R);
    return '<p class="r-next"><button type="button" class="r-nx"><i class="r-dot" aria-hidden="true"></i>' + E(st ? st.text : 'next') +
      ' · <span class="r-nn">' + E(R.r.name) + ', <span class="num">' + E(R.w.label) + '</span></span></button></p>';
  }
  /* (what is at hand is written again only when it changes: the next line reached by Tab previews its race on the
     map, and so stays as it is, focused, for the next Tab to go on to the map (round 5's check: the line was written
     again under the focus, which fell to the page). Written again with the focus in it (a resize, a new season), the
     focus goes to its twin; where the details took its place (Enter on it where they take the column), to them) */
  function showHand() {
    var s = pg.shown(), h = inCol(s) ? handHTML(s) : restHTML(), key = h + '|' + S.year + '|' + (pg.narrow() ? 1 : 0) + '|' + pg.DPR();
    if (S.handKey === key) return;
    var a = document.activeElement, had = a && a !== document.body && handEl.contains(a);
    S.handKey = key;
    handEl.removeAttribute('tabindex');
    handEl.innerHTML = h;
    restFill(handEl);
    pg.drawDiscCanvases(handEl);
    var nb = handEl.querySelector('.r-nx');
    if (!nb) {
      if (had && h) { handEl.setAttribute('tabindex', '-1'); try { handEl.focus({ preventScroll: true }); } catch (err) {} }
      return;
    }
    /* the next line, as a name on the map: pointed at (after a breath) or reached by Tab, its race is previewed where
       it has a card on the map (where its details would take the column, the line under the pointer would turn into
       them: a click then); a click pins it */
    function nxSel() { var R = restRace(); return R && R.p ? { P: R.p, slot: R.slot, R: R } : null; }
    function nxCard(sel) { return !!(sel && S.mode === 'map' && S.cards[selKey(sel)]); }
    nb.addEventListener('click', function () { var sel = nxSel(); if (sel) pg.pin(sel, false); });
    nb.addEventListener('pointerenter', function (e) { var sel = nxSel(); if (e.pointerType !== 'touch' && nxCard(sel)) pg.point({ key: 'nx', sel: sel }); });
    nb.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch' && S.hover && S.hover.key === 'nx') pg.point(null); });
    nb.addEventListener('focus', function () { var sel = nxSel(); if (nb.matches(':focus-visible') && nxCard(sel)) { clearTimeout(S.leaveT); pg.preview(sel); } });
    nb.addEventListener('blur', function () { clearTimeout(S.leaveT); S.leaveT = setTimeout(function () { if (!S.hover) pg.endPreview(); }, 60); });
    /* (the twin focused once its own listeners are on, the old line's blur let go of: its preview stays) */
    if (had) { try { nb.focus({ preventScroll: true }); } catch (err) {} clearTimeout(S.leaveT); }
  }
  Object.assign(pg, { applyRows: applyRows, forgetCards: forgetCards, measureRows: measureRows, selKey: selKey, anyCol: anyCol, cardSizes: cardSizes, cardsPlaced: cardsPlaced, drawStats: drawStats, handMax: handMax, hideCards: hideCards, inCol: inCol, keyAt: keyAt, makeButtons: makeButtons, measureCard: measureCard, placeCardSteps: placeCardSteps, placeKey: placeKey, selsOf: selsOf, showCard: showCard, showHand: showHand, venueSel: venueSel });
}
