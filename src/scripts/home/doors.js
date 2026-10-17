// The five doors (the draft's home script, "doors e2"): build, teach, see, blog and race as stations along the line,
// their words in the door sets of the pixel letters a shade under the ink, their grey lines under them. In hand (a
// pointer resting 30ms that is not sweeping past, or keyboard focus) a door comes to full ink and a small bead of the
// hairline appears on the line at its station; let go, it settles back. race's grey line is what comes next (model.js
// raceOf), after a small red dot while a race is ahead or under way. Their sizes on every screen, their place on the
// device grid, their seats on the line (seat) and their targets. The links are the server's (render.js): race's
// door says its two addresses (data-href at rest, data-next while it names a race) and its own line (data-rest).
import { cssRGB, mixC } from './colour.js';
import { raceOf, raceText } from './model.js';
import { beadOf, cellOf, clamp, fitted, gridOf, letterCell, minX, r, r3, smooth, xAt } from './util.js';

export function installDoors(hm) {
  var doorSecs = hm.doorSecs, flow = hm.flow, lineD = hm.lineD, marks = hm.marks, phone = hm.phone, reduced = hm.reduced, root = hm.root;
  Object.assign(hm, { doorM: doorM, doorsBack: doorsBack, doorsClear: doorsClear, doorsPaint: doorsPaint, doorsShort: doorsShort, doorsSize: doorsSize, doorsSnap: doorsSnap, doorsTight: doorsTight, hide: hide, seat: seat });
  /* ---------- doors e2: five stations along the line, C's quiet words, what is next on race's line (E2, 2026-10-07) ----------
     E kept, with H's "next" (the owner's choice). Each door's section stands on the line (seat() puts it where the
     line passes the middle of its grey line). Its word is C's: the name's own pixel letters (#letters, as the name), a
     little bigger than E's and a little smaller than H's: the 20-row door set (the same letters stretched) at one CSS
     px a cell at 1x, 2x and 3x (see doorsPick for 125% to 175%), resting a shade under the ink (REST). At rest there
     is no mark on the line (C's quiet); the station is where a bead appears.
     In hand (a pointer on the block for 30ms that is not sweeping past, or keyboard focus; the owner found the first
     timing slow, 2026-10-07) the door comes to full ink, its word and its grey line, and a small filled bead of the
     hairline appears on the line at its station (cells as wide as the line, about 7 CSS px across), all in one 50ms
     fade (the door is all there about 80ms after the pointer arrives, moving or not): nothing moves, nothing is typed, nothing else fades, no arrow. race is no different: its grey
     line already says what is coming, at rest ("next: Hyrox Boston · Oct 8–11" after a small red dot, the one red;
     "now: Hyrox Boston" while one is under way; with none ahead the latest one run, or its own "on water, on land"), so nothing
     new appears on it in hand; while it names a race the door opens that race on the map (/race/#next, as the
     footer's next does), else the season (/race/).
     Let go (GRACE ms after the pointer leaves, so a slip off the edge is not a let-go), the door settles back in 150ms:
     the bead fades, the word and the grey line ease back to rest. Back within half a second the door is in hand again
     at once. Keyboard focus is the same in-hand state (no underline); Escape lets the door go, as it does the name and
     the cities, until the door is focused anew. Touch: every door goes in on the first tap. Reduced motion: no fades. */
  var REST = .78, FILL = 50, SETTLE = 150, BACK = 500, GRACE = 100, TAKE = 30, SWEEP = .8;
  /* the red dot before race's line: the site's one red (--red: the heart's, the race page's dot's), at every stage.
     A 5px mark, not text: 5.1:1 on the day paper, about 3.5:1 on the night's */
  var RED = [200, 53, 43];
  var DW = 1;
  hm.lineW = 1;
  var BK = 1;
  var bead = null;
  var rdot = null;
  hm.openD = null;
  var dRaf = 0;
  var dTimer = 0;
  var backTo = null;
  var backNow = null;
  var raceD = null;
  var doors = doorSecs.map(function (sec) {
    var a = sec.querySelector('h2 a'), st = sec.querySelector('.st'), what = sec.querySelector('.what');
    var d = { sec: sec, a: a, db: sec.querySelector('.db'), what: what, art: sec.getAttribute('data-art'),
              verb: a.querySelector('.tx').textContent, lower: sec.classList.contains('v'), st: st, sctx: st.getContext('2d'),
              W: null, y0: 0, s0: -1e9, r0: -1e9, leftAt: -1e9, at: 0, on: false, want: false,
              dwellT: 0, leaveT: 0, uOut: 0, ax: 0, ay: 0, rd: null, wt: null, rest: '', R: null };
    /* the grey line; for race, a red dot before it (hidden until the data says a race is near) and its words */
    var wd = document.createElement('span');
    wd.className = 'wd';
    while (what.firstChild) wd.appendChild(what.firstChild);
    what.appendChild(wd);
    d.wd = wd;
    if (a.hasAttribute('data-next')) {
      var rd = document.createElement('canvas'), wt = document.createElement('span');
      d.rest = what.hasAttribute('data-rest') ? what.getAttribute('data-rest') : wd.textContent;
      d.hrefs = [a.getAttribute('data-href') || a.getAttribute('href'), a.getAttribute('data-next')];
      wt.textContent = d.rest; wd.textContent = '';
      rd.className = 'rd'; rd.setAttribute('aria-hidden', 'true'); rd.hidden = true;
      wd.appendChild(rd); wd.appendChild(wt);
      what.id = 'wh-' + d.art; a.setAttribute('aria-describedby', what.id);
      d.rd = rd; d.rctx = rd.getContext('2d'); d.wt = wt;
      raceD = d;
    }
    if (hm.LS) {
      d.W = hm.letterCanvas(a, d.verb, 'lx dx', hm.LS.doors && hm.LS.doors[0]);
      d.W.cv.style.pointerEvents = 'none';
      inkTop(d);
    }
    return d;
  });
  /* the word's first row of ink */
  function inkTop(d) {
    for (var k = 0, y0 = d.W.h; k < d.W.bits.length; k++) if (d.W.bits[k]) { y0 = Math.floor(k / d.W.w); break; }
    d.y0 = y0;
  }
  /* doors e2: the word set again in another set (the scale changed which one draws it), on the same canvas */
  function wordIn(d, S) {
    if (d.W.S === S) return;
    var N = hm.setWord(d.verb, S), W = d.W;
    W.w = N.w; W.h = N.h; W.bits = N.bits; W.S = S; W.list = N.list; W.F = null;
    W.cv.width = W.w; W.cv.height = W.h;
    W.img = W.ctx.createImageData(W.w, W.h);
    inkTop(d);
  }
  function focused(d) { return document.activeElement === d.a && hm.kbd(d.a); }
  /* how far a door let go has settled (0 just let go, 1 at rest) */
  function settled(d, now) { return d.on || reduced() ? 1 : clamp((now - d.r0) / SETTLE, 0, 1); }
  /* how far a door in hand has come (0 just taken .. 1) */
  function taken(d, now) { return reduced() ? 1 : clamp((now - d.s0) / FILL, 0, 1); }
  /* the bead in device pixels: cells of BK (the line's width) in c, at alpha a; nothing at all at rest */
  function drawBead(d, a, c) {
    var ctx = d.sctx;
    ctx.clearRect(0, 0, d.st.width, d.st.height);
    if (!bead || a <= .001) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
    bead.cells.forEach(function (q) { ctx.fillRect(q.i * BK, q.j * BK, BK, BK); });
    ctx.globalAlpha = 1;
  }
  /* race's red dot: whole cells of BK, the stage's red */
  function drawDot(d) {
    if (!d.rd || !rdot) return;
    var x = d.rctx, c = cssRGB(getComputedStyle(root).getPropertyValue('--red'), RED);
    x.clearRect(0, 0, d.rd.width, d.rd.height);
    x.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    rdot.cells.forEach(function (q) { x.fillRect(q.i * BK, q.j * BK, BK, BK); });
  }
  /* u: how far in hand (0 at rest .. 1); the word from its rest shade to the ink, the bead from nothing to full */
  function drawDoor(d, now) {
    var u = d.on ? smooth(taken(d, now)) : d.uOut * (1 - smooth(settled(d, now)));
    if (d.W) hm.drawWord(d.W, 0, mixC(hm.ink(), mixC(hm.ink(), hm.paperC, REST), u));
    drawBead(d, u, hm.ink());
  }
  function doorsPaint() {
    var now = performance.now();
    doors.forEach(function (d) { drawDoor(d, now); drawDot(d); });
  }
  /* when a door's drawing next changes: 0 every frame (coming to ink, settling), else never */
  function wake(d, now) {
    if (!d.on) return settled(d, now) < 1 ? 0 : Infinity;
    return taken(d, now) < 1 ? 0 : Infinity;
  }
  /* one loop for the doors: every frame only while one moves, else nothing */
  function dTick() {
    dRaf = 0; hm.clear(dTimer); dTimer = 0;
    var now = performance.now(), next = Infinity;
    doors.forEach(function (d) {
      if (now >= d.at - 2) drawDoor(d, now);
      var w = wake(d, now);
      d.at = now + w;
      next = Math.min(next, w);
    });
    if (next === 0) dRaf = hm.raf(dTick);
    else if (next < Infinity) dTimer = hm.later(dKick, Math.max(0, next - 8));
  }
  function dKick() { if (dRaf) return; hm.clear(dTimer); dTimer = 0; dRaf = hm.raf(dTick); }
  function redraw(d) { d.at = 0; dKick(); }
  /* in hand. quiet (or back within BACK ms of letting go): already there */
  function show(d, quiet) {
    if (hm.openD === d) return;
    if (hm.openD) release(hm.openD);
    var now = performance.now(), back = quiet || now - d.leftAt < BACK;
    hm.openD = d; d.on = true;
    d.s0 = back ? now - FILL - 10 : now;
    d.sec.classList.add('in');
    redraw(d);
  }
  /* let go: it settles back from where it is (SETTLE ms), nothing restarted */
  function release(d) {
    var now = performance.now(), p = d.on ? taken(d, now) : 0;
    d.uOut = smooth(p);
    d.on = false; d.r0 = now; d.leftAt = now;
    d.sec.classList.remove('in');
    redraw(d);
  }
  /* the door the keyboard is on, if any */
  function keyDoor() { for (var i = 0; i < doors.length; i++) if (focused(doors[i]) && !doors[i].esc) return doors[i]; return null; }
  function hide(d, going) {
    hm.clear(d.dwellT); hm.clear(d.leaveT); d.leaveT = 0;
    d.want = false;
    if (hm.openD !== d) return;
    hm.openD = null;
    release(d);
    /* a pointer that took over from the keyboard's door leaves: that door is in hand again, quietly */
    var k = going ? null : keyDoor();
    if (k && k !== d) show(k, true);
  }
  /* the intent: a pointer on a door for TAKE ms is taken, still moving or not; only a sweep (moves faster than SWEEP px
     a ms) starts the count again, so a pointer swept across the doors sets nothing off while an aimed one is at once */
  function ask(d, delay) {
    d.want = true;
    hm.clear(d.dwellT);
    /* when the count runs out, the pointer's latest pace still counts: a sweep whose events paused for a frame or two
       (the last move fast and under 40ms ago) is asked again rather than taken */
    d.dwellT = hm.later(function () {
      if (!d.want) return;
      if (d.mv > SWEEP && performance.now() - d.mt < 40) { ask(d, TAKE); return; }
      show(d);
    }, delay);
  }
  doors.forEach(function (d) {
    /* back within GRACE of leaving: still in hand; back within BACK of a let-go: in hand again at once */
    hm.listen(d.sec, 'pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      d.ax = e.clientX; d.ay = e.clientY; d.mt = e.timeStamp; d.mv = 0;
      if (d.leaveT) { hm.clear(d.leaveT); d.leaveT = 0; if (hm.openD === d) return; }
      ask(d, performance.now() - d.leftAt < BACK ? 0 : TAKE);
    });
    hm.listen(d.sec, 'pointermove', function (e) {
      if (e.pointerType === 'touch' || hm.openD === d || !d.want) return;
      var dx = e.clientX - d.ax, dy = e.clientY - d.ay, dt = e.timeStamp - (d.mt || e.timeStamp), v = SWEEP * Math.max(dt, 1);
      d.ax = e.clientX; d.ay = e.clientY; d.mt = e.timeStamp; d.mv = Math.sqrt(dx * dx + dy * dy) / Math.max(dt, 1);
      if (dx * dx + dy * dy > v * v) ask(d, TAKE);
    });
    hm.listen(d.sec, 'pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      if (focused(d) && !d.esc) return;        /* keyboard focus keeps it in hand (not once Escape let it go) */
      if (hm.openD !== d) { hide(d); return; }    /* not yet in hand: forgotten at once */
      hm.clear(d.leaveT);
      d.leaveT = hm.later(function () { d.leaveT = 0; hide(d); }, GRACE);
    });
    hm.listen(d.a, 'focus', function () {
      d.esc = false;                         /* focused anew: Escape's let-go is over */
      if (backNow === d.a) show(d, true);    /* back from its page: in hand at once */
      else if (hm.kbd(d.a)) ask(d, 0);
      redraw(d);
    });
    /* a tap on the door's own grey line (which takes no focus) is not leaving the door */
    hm.listen(d.a, 'blur', function () {
      d.esc = false;
      if (hm.pointer === 'touch' ? downSec !== d.sec : !d.sec.matches(':hover')) hide(d);
      redraw(d);
    });
    hm.listen(d.a, 'keydown', function (e) { if (e.key === 'Enter') d.byKey = true; });
    /* touch: every door goes in on the first tap (its link does it) */
    hm.listen(d.a, 'click', function () { if (hm.pointer !== 'key') d.byKey = false; });
    /* the whole block is the door: a click (or tap) on the grey line or the room round the words is one on the word */
    hm.listen(d.db, 'click', function (e) {
      if (d.a.contains(e.target)) return;
      e.preventDefault();
      d.a.click();
    });
  });
  /* Escape: the door in hand (by pointer or keyboard) is let go and one about to be taken is not, as the name and the
     cities let go; the keyboard's door then stays at rest until it is focused anew (or the pointer takes it again) */
  hm.listen(document, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    doors.forEach(function (d) {
      if (focused(d)) d.esc = true;
      if (d.want && hm.openD !== d) { hm.clear(d.dwellT); d.want = false; }
    });
    if (hm.openD) hide(hm.openD, true);
  });
  var downSec = null;
  hm.listen(document, 'pointerdown', function (e) {
    var sec = e.target.closest ? e.target.closest('.door') : null;
    downSec = sec;
    if (e.pointerType === 'mouse') return;
    doors.forEach(function (d) { if (d.sec !== sec && (hm.openD === d || d.want)) hide(d); });
  }, true);
  /* going in (or anywhere by the hash): the door is let go, so the home comes back at rest; a door gone into from
     the keyboard is remembered, and has the focus again when the home comes back (the mount's shown()) */
  function hrefTop(a) { return (a.getAttribute('href') || '').replace(/^#\/?/, '').split('/')[0]; }
  hm.listen(window, 'hashchange', function () {
    var h = location.hash.replace(/^#\/?/, '').split('/')[0], hit = null;
    if (h) {
      doors.forEach(function (d) { if (d.byKey && h === hrefTop(d.a)) hit = d.a; d.byKey = false; });
      if (hit) backTo = hit;
      else if (backTo && h !== hrefTop(backTo)) backTo = null;   /* gone on elsewhere */
    }
    doors.forEach(function (d) { hide(d, true); });
  });
  function doorsBack() {
    var a = backTo, f = document.activeElement;
    backTo = null;
    /* only where the focus was left nowhere: on the page, or on the inner page just hidden */
    if (!a || (f && f !== document.body && f.getClientRects().length)) return;
    backNow = a;
    a.focus({ preventScroll: true });
    backNow = null;
  }
  /* a page of its own (the site): the door gone into is let go as the page goes, so a page brought back from the
     browser's cache (Back) shows the home at rest, and the keyboard's door has the focus again (the draft's hash
     change and its return to the home, above) */
  hm.listen(window, 'pagehide', function () {
    doors.forEach(function (d) { if (d.byKey) backTo = d.a; d.byKey = false; hide(d, true); });
  });
  hm.listen(window, 'pageshow', function (e) { if (e.persisted) doorsBack(); });
  /* race's grey line: what is next (model.js raceOf, by the mount's today) */
  function raceSet(d, t, live) {
    if (d.wt.textContent !== t) d.wt.textContent = t;
    if (d.rd.hidden === live) d.rd.hidden = !live;
  }
  /* as long as the room beside the door allows: the whole of it, else the race's short name, else cut. Right-aligned
     (a desktop) it reaches no further left than 16px from the screen's edge, left-aligned (a phone) to 16px from the
     right. Only its width changes, which moves no station. While it names a race to come or under way the door opens
     that race on the map (/race/#next, as the footer's "next:"); else, the latest one run named or not, the season at
     rest (/race/: nothing pinned, nothing moving. Round 7's review: opened by its id the race was pinned and its
     scene looped until Escape) */
  function raceFit() {
    var d = raceD;
    if (!d) return;
    var R = raceOf(hm.races, hm.today());
    d.R = R;
    d.a.setAttribute('href', R && !R.past ? d.hrefs[1] : d.hrefs[0]);
    /* its address settled, the door is the one link the speculation rules make ready eagerly (components/DocHead.astro,
       data-eager): marked before, the server's /race/ and then /race/#next were two addresses, two prerenders */
    if (!d.a.hasAttribute('data-eager')) d.a.setAttribute('data-eager', '');
    d.what.style.maxWidth = ''; d.what.classList.remove('cut');
    if (!R) { raceSet(d, d.rest, false); return; }
    var w = d.what.getBoundingClientRect(), left = phone() && d.lower;
    var room = Math.max(40, left ? root.clientWidth - 16 - w.left : w.right - 16);
    raceSet(d, raceText(R, false), !R.past);
    if (d.wd.getBoundingClientRect().width > room + .5) raceSet(d, raceText(R, true), !R.past);
    if (d.wd.getBoundingClientRect().width > room + .5) { d.what.style.maxWidth = r(room) + 'px'; d.what.classList.add('cut'); }
  }
  /* doors e2 (E2): which set draws the words, and its cell in device pixels: a little bigger than E's, a little
     smaller than H's (the owner's choice, 2026-10-07). The aim is the 20-row door set's share of the name, 20/36 of
     its height as drawn here (the name's cell is whole device pixels too: 43.2 CSS px tall at 125%, 41.1 at 175%). Of
     the door sets and the name's own letters, each in whole cells of whole device pixels, the one nearest that aim
     (by ratio, the larger on a tie) of those taller than E's words (the name's letters at the whole cell nearest half
     the name's) and shorter than H's (the 23-row set's share, on a desktop never under its size at 1x); with none
     between them, E's. So 20 CSS px at 1x, 2x and 3x (the 20-row set at 1, 2 and 3 device px a cell; E's 18, H's
     23), 18.4 at 125% (the 23-row set at 1; E's 14.4, H's 28.8), 24 at 150% (the name's letters at 2, which E and H
     both draw there), 22.9 at 175% (the 20-row set at 2; E's 20.6, H's 26.3); on a 2.625x phone E's 20.6 (the 20-row
     set at 3 is H's there). Without door sets (another lettering), and tight (doorsTight), E's */
  function doorsPick(dpr, tight) {
    var ek = cellOf((hm.LS ? hm.LS.cell : hm.lcell) * dpr / 2), E = { S: hm.LS, k: ek, h: hm.LS ? hm.LS.h * ek / dpr : 0 };
    var D = hm.LS && hm.LS.doors && hm.LS.doors[0];
    if (!D || tight) return E;
    var T = hm.LS.doors[1] || D, sc = hm.lcell / hm.LS.cell, sets = hm.LS.doors.concat([hm.LS]);
    function near(want, ok) {
      var best = null;
      sets.forEach(function (S) {
        for (var k = 1; k <= 8; k++) {
          var h = S.h * k / dpr, e = Math.abs(Math.log(h / want));
          if (!ok(h)) continue;
          if (!best || e < best.e - 1e-9 || (Math.abs(e - best.e) <= 1e-9 && h > best.h)) best = { S: S, k: k, h: h, e: e };
        }
      });
      return best;
    }
    var lo = phone() ? 0 : D.h - .01, H = near(D.h * sc, function (h) { return h >= lo; });
    return near(T.h * sc, function (h) { return h > E.h + .01 && (!H || h < H.h - .01); }) || E;
  }
  /* one size on every screen (the owner, 2026-10-12; "the lettering grid-fitted", above): on a desktop's page the door
     words stand in their 20-row set (tight: in the name's own letters, E's) at half the name's cell as the plain page
     has it at 100%, 1px of the page's, in device px that need not be whole: doorsSize fits them to the grid there. So
     "build" is 40 x 20 of the page's px on every screen (it was 34 x 18 at 125%, 49 x 24 at 150%). Else (a phone, a
     touch screen, other letters) doorsPick, as ever */
  function doorsWord(dpr, tight) {
    var T = hm.LS.doors && hm.LS.doors[1], S = tight ? hm.LS : T, q = hm.trueRatio(dpr), k;
    if (!hm.lettered() || !T || !T.fit) return doorsPick(dpr, tight);
    k = letterCell(hm.LS.cell / 2, q);
    return { S: S, k: fitted(k) ? k : Math.round(k), h: S.h * k / q, fit: true };
  }
  /* the clear room between one block's grey line and the next block's word, at the stations just seated. Under TIGHT
     px (a very short window) the words step down to E's size, which gives each gap back a little air, and the caller
     seats the stations again; only where that gives the blocks their TIGHT px back is it kept (a short phone, whose
     line gives way first, gains nothing by it: there the words keep their size). Once a layout.
     Where lettering is one size on every screen (doorsOne: a desktop's page whose ratio is 1 or more, so that the
     words stand at their size on the plain page) the step is a matter of the window alone (the owner's leftovers,
     2026-10-13). Measured, it fell with the screen's scale and with how often the page had been laid out: at 1366 x
     620 the words stood 37 x 18 at 100% and 40 x 20 at 125 to 200%, and at 150% one or the other by turns as the
     window was dragged. The room between the blocks stands within a device pixel of TIGHT there (the stations close
     up to it and no further, lift()), and a device pixel is as large as the screen's scale makes it. So there the
     words step down wherever the page is under SHORT px tall, at every scale, and nowhere else: 623px is the least
     height at which the plain page at 100%, the measure every lettering's size is taken from, keeps its blocks TIGHT
     px apart at full size (15.9, 15.8 and 15.7px at 620, 621 and 622; 16.5 at 623), and no scale needs it higher
     (150%: to 621; 250 and 300%: 620). With a mouse the page is 580px tall at least (the sheet: it was 620, and
     scrolled in a shorter window), so these are the windows of 580 to 622px, and the shorter ones, whose page keeps
     its 620px and scrolls. (A page zoomed out past 100% of a 100% screen draws its letters larger
     than their size, a cell being a device pixel at least: there the room is measured, as ever) */
  var TIGHT = 16, SHORT = 623;
  function doorsClear() {
    var c = Infinity;
    for (var i = 0; i + 1 < doors.length; i++) c = Math.min(c, doors[i + 1].W.cv.getBoundingClientRect().top - doors[i].what.getBoundingClientRect().bottom);
    return c;
  }
  function doorsOne(dpr) { return hm.lettered() && hm.trueRatio(dpr) >= 1 - 1e-9; }
  function doorsShort(dpr) { return !!hm.LS && !!hm.LS.doors && doorsOne(dpr) && flow.getBoundingClientRect().height < SHORT; }
  function doorsTight(dpr) {
    if (!hm.LS || !hm.LS.doors || !doors.length || !doors[0].W) return false;
    if (doorsOne(dpr)) return false;   /* (by the page's height: doorsShort) */
    if (!(doorsClear() < TIGHT)) return false;
    var p0 = doorsWord(dpr, false), p1 = doorsWord(dpr, true);
    if (!p1 || !(p1.h < p0.h - .01)) return false;
    doorsSize(dpr, true);
    return true;
  }
  function doorsSize(dpr, tight) {
    var pick = hm.LS ? doorsWord(dpr, tight) : { S: null, k: cellOf(hm.lcell * dpr / 2) }, S = pick.S, fit = !!pick.fit;
    DW = pick.k;   /* (fit: the word's cell in device px as it is asked for, whole or not: one size on every screen, doorsWord) */
    hm.lineW = Math.max(1, Math.round(dpr - .01));
    BK = hm.lineW;
    /* (cells(a, d): the cells across a bead of a px at the ratio d, as ever. The bead and the dot are marks, not
       letters: where the lettering is one size on every screen (lettered()) they are their size on the plain page at
       100% times k, 7 and 5 of the page's px, in the odd number of the line's cells nearest that: at every scale and
       every step, a zoomed browser's too (the owner's leftovers, 2026-10-13: it was so only in the big-screen mode,
       and at 250% on the plain page the seven and five cells "as ever" stood 5.6 and 4.0px across, where nine and
       seven stand 7.2 and 5.6).
       Else they stay in step with the name's whole cells (cellFor, above): where the name has grown (nf: its cell here
       over its cell on the plain page, and no more than the page grew, k), the bead is as many times its size on the
       plain page, in the odd number of the line's cells nearest that, if that is more cells than it has as ever) */
    function cells(a, d) { return Math.round(d - .01) > 1 ? a : Math.max(a, 2 * Math.round((a * d - 1) / 2) + 1); }
    var WZ = hm.grown(), D = WZ && WZ.dpr(), nf = WZ && hm.LS ? Math.min(WZ.z, hm.lcell * dpr / hm.nameCell(D)) : 1, one = hm.lettered(), q = hm.trueRatio(dpr);
    function cellsOf(a) {
      var m = cells(a, dpr);
      if (one) return Math.max(1, 2 * Math.round((a * q / hm.lineW - 1) / 2) + 1);
      return WZ ? Math.max(m, 2 * Math.round((cells(a, D) * Math.max(1, Math.round(D - .01)) * nf / hm.lineW - 1) / 2) + 1) : m;
    }
    var m = cellsOf(7), c = DW / dpr, n = m * BK;
    var dm = cellsOf(5), dn;
    /* (the red dot is a disc, and three cells across are a square, no disc: 4.8px of one at 2048 x 1152 at 125%, where
       the line is 2 device px and the dot's 5px are 3.9 cells. The bead needs its odd number, to stand with its
       middle cell on the line; the dot stands by a line of words, so where the nearest odd number is three and four
       are as near its size or nearer (3.5 cells or more: every desktop from 100% to 300%, zoomed or not), it is the
       disc of four: 5.1px there, round. Under 3.5 cells, a page zoomed far out, the cells are too large to draw one) */
    if (one && dm < 5 && 5 * q / hm.lineW >= 3.5) dm = 4;
    dn = dm * BK;
    if (!bead || bead.m !== m) bead = beadOf(m);
    if (!rdot || rdot.m !== dm) rdot = beadOf(dm);
    doors.forEach(function (d) {
      if (d.W) {
        wordIn(d, S);
        hm.wordFit(d.W, fit ? DW : 0);             /* (its canvas: device pixels where it is fitted, else its cells; doorsPaint, below, draws it) */
        var s = d.W.cv.style, F = d.W.F;
        s.position = 'relative';                /* doorsSnap moves it by left and top */
        s.width = F ? F.w / q + 'px' : r3(d.W.w * c) + 'px'; s.height = F ? F.h / q + 'px' : r3(d.W.h * c) + 'px';
        s.verticalAlign = F ? -(F.h - F.Y[S.asc + S.x]) / q + 'px' : r3(-S.desc * c) + 'px';
        d.sec.style.setProperty('--lt-h', F ? F.h / q + 'px' : r3(S.h * c) + 'px');
        d.sec.style.setProperty('--lt-fs', r3(S.x * c * 1.6) + 'px');
      }
      if (d.st.width !== n) { d.st.width = n; d.st.height = n; }
      var ss = d.st.style;
      ss.width = ss.height = r3(n / dpr) + 'px';
      ss.left = ss.top = r3(-n / 2 / dpr) + 'px';   /* its middle on the station; doorsSnap puts it on whole pixels */
      if (d.rd) {
        if (d.rd.width !== dn) { d.rd.width = dn; d.rd.height = dn; }
        d.rd.style.width = d.rd.style.height = r3(dn / dpr) + 'px';
      }
    });
    doorsPaint();
  }
  function snapAt(el, dpr, x0, y0) {
    var g = gridOf(dpr);
    el.style.translate = 'none';
    el.style.left = r3(x0) + 'px'; el.style.top = r3(y0) + 'px';
    var b = el.getBoundingClientRect();
    el.style.left = r3(x0 + Math.round(b.left * g) / g - b.left) + 'px';
    el.style.top = r3(y0 + Math.round(b.top * g) / g - b.top) + 'px';
  }
  function doorsSnap(dpr) {
    var h = -bead.m * BK / 2 / dpr;
    doors.forEach(function (d) {
      if (d.W) snapAt(d.W.cv, dpr, 0, 0);
      snapAt(d.st, dpr, h, h);
      if (d.rd && !d.rd.hidden) snapAt(d.rd, dpr, 0, 0);
    });
  }
  /* each block's reach from its station (the middle of its grey line): up to the top of its word's ink, down to the
     foot of its grey line; the layout keeps 12px between one block's grey line and the next block's word */
  function doorM() {
    var dpr = window.devicePixelRatio || 1;
    return doors.map(function (d) {
      var w = d.what.getBoundingClientRect(), lh = parseFloat(getComputedStyle(d.what).lineHeight) || 16, mid = w.top + lh / 2;
      var top = d.a.getBoundingClientRect().top + (d.W ? (d.W.F ? d.W.F.Y[d.y0] / hm.trueRatio(dpr) : d.y0 * DW / dpr) : 0);   /* the word's own box (not its nudged canvas); a fitted word's first ink where its rows put it */
      return { up: mid - top, down: w.bottom - mid };
    });
  }
  function seat() {
    if (!doors) return;
    var f = flow.getBoundingClientRect(), P = phone();
    if (!f.width) return;
    /* the station is level with the middle of the grey line */
    function level() {
      doors.forEach(function (d) {
        var lh = parseFloat(getComputedStyle(d.what).lineHeight) || 21;
        d.sec.style.setProperty('--wc', r3(d.what.getBoundingClientRect().top - d.db.getBoundingClientRect().top + lh / 2) + 'px');
      });
    }
    level();
    if (P) doors.forEach(function (d) { d.sec.style.setProperty('--sh', '0px'); });   /* a phone's runs are upright: nothing to step off */
    else {
      var sx = f.width / 960, sy = f.height / 900, pts = hm.sampleLine(lineD), lo = hm.dotY.d + 1, hi = hm.RY - 1;
      doors.forEach(function (d) {
        var s = d.sec.style, y = parseFloat(s.getPropertyValue('--y')), x = d.lower ? xAt(pts, y, lo, hi) : hm.X1s;
        if (isNaN(x)) x = hm.X1s;
        s.setProperty('--x', r3(x));
        if (!d.lower) { s.setProperty('--sh', '0px'); return; }
        var cs = getComputedStyle(d.db), wc = parseFloat(s.getPropertyValue('--wc')) || 40, h = d.db.getBoundingClientRect().height;
        var top = y * sy - wc + parseFloat(cs.paddingTop), bot = y * sy - wc + h - parseFloat(cs.paddingBottom);
        var m = minX(pts, top / sy, bot / sy, lo, hi);
        s.setProperty('--sh', r(Math.max(0, x - (isFinite(m) ? m : x)) * sx) + 'px');
      });
    }
    /* race's line, now that its block stands where it stands (its words set the block's width, not its place) */
    raceFit();
    /* the targets: each block reaches up to 6px above and below its words, but never into another block's (two that
       stand closer than 12px share the room between them) nor, for build, into the marks' own 8px */
    var R = doors.map(function (d) {
      var b = d.db.getBoundingClientRect(), cs = getComputedStyle(d.db);
      return { l: b.left, r: b.right, t: b.top + parseFloat(cs.paddingTop), b: b.bottom - parseFloat(cs.paddingBottom), pt: 6, pb: 6 };
    });
    var socs = [].map.call(marks.querySelectorAll('a'), function (a) { return a.getBoundingClientRect(); });
    R.forEach(function (A, i) {
      R.forEach(function (B, j) {
        if (j <= i || A.l >= B.r || B.l >= A.r) return;
        var U0 = A.t <= B.t ? A : B, L0 = U0 === A ? B : A, half = Math.max(0, (L0.t - U0.b) / 2);
        U0.pb = Math.min(U0.pb, half); L0.pt = Math.min(L0.pt, half);
      });
      socs.forEach(function (s) { if (s.width && A.l < s.right && s.left < A.r && s.bottom <= A.t + 6) A.pt = Math.min(A.pt, Math.max(0, A.t - s.bottom)); });
    });
    doors.forEach(function (d, i) {
      d.sec.style.setProperty('--pt', r3(Math.floor(R[i].pt * 4) / 4) + 'px');
      d.sec.style.setProperty('--pb', r3(Math.floor(R[i].pb * 4) / 4) + 'px');
    });
    level();
  }
  Object.assign(hm, { TIGHT: TIGHT, doors: doors });
}
