// The home's pixel letters (the draft's home script, "the pixel letters"): the name, a canvas per syllable with the
// middle dots that ride with them, its small grey suffix, and the cells of every drawing on the home (the name's, the
// road's, in the big-screen mode grown together). The letters and their grid-fitting are the site's own
// (scripts/lettering/: bits.js, the alphabet; hint.js, the fitting, the draft's "hint: begin" to "hint: end" word for
// word); what is the home's is how they are sized, set on the device grid and underlined under the keyboard's focus.
// The door words are drawn by doors.js, in the door sets, through drawWord here.
import { PIXEL, wordBits } from '../lettering/bits.js';
import { hintWord } from '../lettering/hint.js';
import { cellOf, clamp, edgesOf, fitted, hintRound, letterCell, put, r3 } from './util.js';

/* the letters (the draft's #letters block, style "pixel"; scripts/lettering/letters.json), each set with its height,
   its underline's row and whether the fitting was made for it, as the draft's start gave them: the name's (LS) and
   the door words' own sets (doors e2: the same letters stretched). Made once, on top of the site's own objects */
function fitSet(S) { return !!S && S.asc >= 2 && S.desc >= 2 && S.x >= 8 && !(S.x % 2); }
function setOf(S, fit) {
  var D = Object.create(S);
  D.h = S.asc + S.x + S.desc;
  D.uy = S.asc + S.x + S.line;          /* the underline's row */
  D.fit = fit;
  return D;
}
var LS = setOf(PIXEL, fitSet(PIXEL));   /* one size on every screen (below): the letters the fitting was made for */
LS.doors = (PIXEL.doors || []).map(function (D) { return setOf(D, LS.fit && fitSet(D)); });

export function installLettering(hm) {
  var flow = hm.flow, nmr = hm.nmr, phone = hm.phone, reduced = hm.reduced, say = hm.say;
  Object.assign(hm, { cellFor: cellFor, drawWord: drawWord, grown: grown, letterCanvas: letterCanvas, lettered: lettered, lettersName: lettersName, lettersPaint: lettersPaint, lettersSize: lettersSize, lettersSnap: lettersSnap, nameCell: nameCell, setWord: setWord, trueRatio: trueRatio, wordFit: wordFit });
  /* ---------- the pixel letters: the name and the three words, drawn on the page's own grid ----------
     With a lettering option (?type=pixel or pixel-light; html[data-letters]) each door word, and each syllable of
     the name, is a canvas of whole cells drawn from the hand-made alphabet in the #letters block. A cell is a whole
     number of device pixels (round(cell x devicePixelRatio): 2px at 100%, 2.4 at 125%, 2 at 150%), and each canvas
     is nudged onto the device grid, so every edge is a hard step from paper to ink, like the city icons'. The words
     stay in the page as transparent text over their canvas (the link, focus, search, selection, screen readers).
     The ink is the stage's, frame by frame through the cut. The underline is one row of cells under the baseline
     (it steps round a descender): it draws in from the left, cell by cell, in LIN ms and goes back in LOUT ms;
     under the name it runs on from one syllable to the next. Reduced motion: there or not. (The site has the one
     lettering, "pixel": main.lt below is the draft's html.lt) */
  var LIN = 160, LOUT = 110;
  hm.LS = LS;
  hm.lcell = 1;
  var lfit = 0;
  var lq = 1;
  var lgroups = [];
  var lineRaf = 0;
  /* ---------- one size on every screen: the lettering grid-fitted (the owner, 2026-10-12) ----------
     Pixel lettering is one size on every screen: at one window it does not change with the display's scale, and it
     grows only with the type round it (the big-screen mode zooms the home by k: design/assets/zoom/wide.js). Drawn in
     whole cells of whole device pixels, each word rounded its own way, the name stood 36, 43.2, 36 and 41.1px tall at
     100, 125, 150 and 175%, and "build" 20, 18.4, 24 and 22.9. So on a desktop's page (lettered(): not a phone, a
     touch screen or a window that gets the phone layout, where everything here is as it was) a word's cell is its
     cell at 100% on the plain page, in the page's px, whatever the screen: the name's 2px (LS.cell), the suffix's and
     the door words' 1px (half of it; the door words in their 20-row set, tight in the name's own letters). In device
     px that is cell x devicePixelRatio (the screen's ratio times the page's zoom), often not a whole number: there
     the word is fitted to the device grid as the inner pages' title and the header's name are (lettering/hint.js:
     every stem and bar the same whole number of device px, every edge on a whole device pixel, the word's width and
     height their own nearest whole) and drawn in device pixels (wordFit, drawWord). Where it is whole (100%, 200%;
     the name at 150% too) the word is whole cells, as ever.
     The pictures (the road and its cities, the traveller, the marks) keep their own rule, untouched: cellFor, below.
     The stations' bead and race's red dot are marks, not letters: on a desktop's page the odd number of the line's
     cells nearest their 7 and 5 of the page's px (the dot four of them where three, a square, would be the nearest
     odd: doorsSize) */
  var mqTouch = window.matchMedia ? matchMedia('(any-hover: none)') : { matches: false };
  function lettered() { return !!(hm.LS && hm.LS.fit) && !phone() && !mqTouch.matches; }
  /* the page's ratio (device px a page px: the screen's times the page's zoom) with its float noise off: a zoomed
     browser says 1.100000024 for 110%, a headless one 2.0000000894 for 2. A fitted word's cell and box are worked out
     from this, so the box never comes out a hair, and with it a 64th of a px, under its device pixels (the browser
     then draws the word a row or a column short). Whole cells keep the ratio as the page sees it, as ever */
  function trueRatio(dpr) {
    var WZ = hm.zoom, on = !!(WZ && WZ.dpr), d = on ? WZ.dpr() : dpr, r = Math.round(d * 1e4) / 1e4;
    return (Math.abs(d - r) < 1e-6 ? r : d) * (on && WZ.z ? WZ.z : 1);
  }
  /* a word at s device px a cell (0: not lettering here): fitted where s is not whole (W.F: its grid, cols and rows,
     and their edges X and Y, in device px), else whole cells (W.F null). Its canvas holds the device pixels of the
     one, the cells of the other. True when the canvas was made anew: it is blank then, and the caller draws it */
  function wordFit(W, s) {
    var F = null, w, h;
    s = fitted(s);
    if (s) {
      F = W.F && W.F.s === s && W.F.S === W.S ? W.F : hintWord(W, s, true);
      if (F !== W.F) { F.s = s; F.S = W.S; F.X = edgesOf(F.cols); F.Y = edgesOf(F.rows); }
    }
    W.F = F;
    w = F ? F.w : W.w; h = F ? F.h : W.h;
    if (W.cv.width === w && W.cv.height === h) return false;
    W.cv.width = w; W.cv.height = h;
    return true;
  }
  /* n of the name's cells, in the page's px: where the name is fitted (lfit: its cell in device px; lq: the page's
     ratio then), the whole device pixels nearest, a half down as the letters' own gaps; else n cells */
  function nameLen(n) { return lfit ? hintRound(n * lfit) / lq : n * hm.lcell; }
  /* a word as cells: letters S.track apart, a space S.space cells; S the set (the name's, LS, unless another is
     given). The site's own (lettering/bits.js wordBits: the draft's setWord, its sets having no kerning pair) */
  function setWord(t, S) { return wordBits(t, S || hm.LS); }
  function letterCanvas(host, text, cls, S) {
    var W = setWord(text, S), cv = document.createElement('canvas');
    cv.className = cls; cv.setAttribute('aria-hidden', 'true');
    cv.width = W.w; cv.height = W.h;
    host.insertBefore(cv, host.firstChild);
    W.cv = cv; W.ctx = cv.getContext('2d'); W.img = W.ctx.createImageData(W.w, W.h);
    return W;
  }
  /* the name: a canvas per syllable (they still move apart), and before yuan and lu the middle dot that rides with them */
  var nameG = { u: 0, ws: [], dots: [], line: function () { return document.activeElement === say && hm.kbd(say); } };
  [].forEach.call(say.querySelectorAll('.tk'), function (tk, i) {
    nameG.ws.push(letterCanvas(tk, tk.querySelector('.tx').textContent, 'lx'));
    if (i) { var D = letterCanvas(tk, '\u00b7', 'dt'); D.dot = true; nameG.dots.push(D); }
  });
  lgroups.push(nameG);
  /* the name's suffix (the default; ?phd=off without): the small "phd" after the name, a word of its own in the same letters: grey,
     at about half the name's cell (lettersSize), never underlined; a group of its own, so it is set on the device
     grid as the name is (lettersSnap) */
  var sfxEl = flow.querySelector('.name .sfx');
  if (sfxEl) {
    var sfxW = letterCanvas(sfxEl, sfxEl.querySelector('.tx').textContent, 'lx');
    sfxW.half = true;
    lgroups.push({ u: 0, ws: [sfxW], dots: [], grey: true, line: function () { return false; } });
  }
  /* doors e: the door words are drawn by the doors module, in their own set and shade */
  flow.classList.add('lt');
  ['pointerover', 'pointerout', 'focusin', 'focusout', 'keydown'].forEach(function (t) { hm.listen(document, t, lineCheck, true); });
  /* the cells of a word in the ink, and the first n cells of its underline (a cell next to a descender is left out) */
  function drawWord(W, n, c) {
    var F = W.F, D = W.img.data, w = W.w, y = (W.S || hm.LS).uy, g = W.ctx, q;
    /* (a fitted word, one size on every screen, above: each cell is its box of device pixels, in the colour the
       cells' own bytes would hold; else a cell is a cell, as ever) */
    function cell(i, j) { if (F) g.fillRect(F.X[i], F.Y[j], F.cols[i], F.rows[j]); else put(D, j * w + i, c, 255); }
    if (F) {
      q = new Uint8ClampedArray(3); q[0] = c[0]; q[1] = c[1]; q[2] = c[2];
      g.clearRect(0, 0, F.w, F.h);
      g.fillStyle = 'rgb(' + q[0] + ',' + q[1] + ',' + q[2] + ')';
    } else D.fill(0);
    for (var k = 0; k < W.bits.length; k++) if (W.bits[k]) cell(k % w, Math.floor(k / w));
    for (var i = 0; i < Math.min(n, w); i++) {
      var near = false;
      for (var dy = -1; dy <= 1 && !near; dy++) for (var dx = -1; dx <= 1; dx++) {
        var X = i + dx, Y = y + dy;
        if (X >= 0 && X < w && Y >= 0 && Y < W.h && W.bits[Y * w + X]) { near = true; break; }
      }
      if (!near) cell(i, y);
    }
    if (!F) g.putImageData(W.img, 0, 0);
  }
  function drawGroup(g) {
    var c = g.grey ? hm.tok().grey : hm.ink(), T = 0;   /* (grey: the name's suffix) */
    g.ws.forEach(function (W) { T += W.w; });
    var n = Math.round(g.u * T);
    g.ws.forEach(function (W) { drawWord(W, n, c); n -= W.w; });
    g.dots.forEach(function (W) { drawWord(W, 0, hm.tok().grey); });
  }
  function lettersPaint() { lgroups.forEach(drawGroup); }
  function aimLine(g, to) {
    if (g.to === to) return;
    g.to = to;
    hm.caf(g.raf);
    var u0 = g.u, dur = (to > u0 ? LIN : LOUT) * Math.abs(to - u0), t0 = performance.now();
    if (reduced() || dur < 1) { g.u = to; drawGroup(g); return; }
    g.raf = hm.raf(function f(now) {
      g.u = u0 + (to - u0) * clamp((now - t0) / dur, 0, 1);
      drawGroup(g);
      if (g.u !== to) g.raf = hm.raf(f);
    });
  }
  /* hover and focus are read a frame later, once the browser has moved them */
  function lineCheck() {
    if (!lgroups.length || lineRaf) return;
    lineRaf = hm.raf(function () { lineRaf = 0; lgroups.forEach(function (g) { aimLine(g, g.line() ? 1 : 0); }); });
  }
  /* the canvases' size: on a desktop's page the letters' own, one size on every screen (above: the name's 2px a cell
     and its suffix's 1px, of the page's, fitted to the device grid where that is not whole device pixels); else whole
     cells of whole device pixels. The baseline is the line's */
  function lettersSize(dpr) {
    if (!hm.LS) return;
    var fit = lettered(), q = trueRatio(dpr), sn = letterCell(hm.LS.cell, q), sh = letterCell(hm.LS.cell / 2, q), blank = false, N;
    lfit = fit ? fitted(sn) : 0; lq = q;
    /* (not fitted: the nearest whole device pixels; on a phone never bigger than asked, so a 125% phone keeps its one
       screen; in the big-screen mode grown from its cell on the plain page, with the road's pixel: cellFor. On a
       desktop's page whose cell is whole device pixels: that many, over the ratio as the page sees it, as ever) */
    hm.lcell = lfit ? sn / q : fit ? Math.round(sn) / dpr : cellFor(nameCell, dpr, hm.roadCell) / dpr;
    /* (the name's suffix, not fitted: the whole device pixels nearest half the name's cell as it is asked for, the rule
       the doors' words began with (cellOf): 1 of 2 at 100%, 1 of 3 at 125%, 2 of 3 at 150%, 2 of 4 at 175% and 200%;
       on a phone never bigger than asked; in the big-screen mode in step with the name's cell there, sfxCell. Its gap
       after "lu": six of the name's cells) */
    var hcell = !fit ? sfxCell(dpr) / dpr : fitted(sh) ? sh / q : Math.round(sh) / dpr;
    if (sfxEl) sfxEl.style.setProperty('--sfx-gap', nameLen(6) + 'px');
    lgroups.forEach(function (g) {
      g.ws.concat(g.dots).forEach(function (W) {
        var s = W.cv.style, k = W.half ? hcell : hm.lcell, F;
        if (wordFit(W, fit ? (W.half ? sh : sn) : 0)) blank = true;
        F = W.F;
        s.width = F ? F.w / q + 'px' : r3(W.w * k) + 'px'; s.height = F ? F.h / q + 'px' : r3(W.h * k) + 'px';
        if (W.dot) s.marginRight = r3((hm.LS.gap - W.w) / 2 * hm.lcell) + 'px';   /* centred in the gap the syllables open (a fitted dot: to the device pixel lettersSnap then puts it on) */
        else s.verticalAlign = F ? -(F.h - F.Y[hm.LS.asc + hm.LS.x]) / q + 'px' : r3(-hm.LS.desc * k) + 'px';
      });
    });
    N = lgroups.length && lgroups[0].ws[0] ? lgroups[0].ws[0].F : null;
    /* (the name's transparent words: the draft set these on the page's root; the home's own here) */
    flow.style.setProperty('--lt-h', N ? N.h / q + 'px' : r3(hm.LS.h * hm.lcell) + 'px');
    flow.style.setProperty('--lt-fs', r3(hm.LS.x * hm.lcell * 1.6) + 'px');
    if (blank) lettersPaint();   /* (a canvas made anew, fitted or back to cells, is blank) */
  }
  /* the name opens by whole cells: yuan sits a letter's track after zhen and lu a word space after yuan; open, both
     gaps are LS.gap cells */
  function lettersName() {
    var g = nameLen(hm.LS.gap), tr = nameLen(hm.LS.track), sp = nameLen(hm.LS.space);   /* (the name fitted: whole device px each, nameLen; else cells, as ever) */
    /* (big screens: in full, not to 0.001: zoomed, a cell is rarely a round number of the page's px, and the syllables'
       translate must stay whole device pixels) */
    say.style.setProperty('--ltr', tr + 'px');
    say.style.setProperty('--lsp', sp + 'px');
    say.style.setProperty('--g2', g - tr + 'px');
    say.style.setProperty('--g3', 2 * g - tr - sp + 'px');
    if (sfxEl) sfxEl.style.setProperty('--g3', 2 * g - tr - sp + 'px');   /* (the suffix steps aside with "lu") */
    nmr.style.setProperty('--shift', r3(2 * g - tr - sp) + 'px');
  }
  /* onto the device grid. A group moves as one (from its first canvas), so the syllables keep their whole-pixel
     distances; a syllable's own move is left out (it is whole device pixels too), so an open name stays crisp */
  function lettersSnap(dpr) {
    function dev(v) { return Math.round(v * dpr) / dpr; }
    lgroups.forEach(function (g) {
      /* big screens (2026-10-09): by their own place, not a translate: a syllable a relative offset, a dot (absolute,
         set by right: 100%) its margins */
      var put = function (W, x, y) {
        var s = W.cv.style;
        if (W.dot) { s.marginRight = ((hm.LS.gap - W.w) / 2 * hm.lcell - x) + 'px'; s.marginTop = y + 'px'; }
        else { s.position = 'relative'; s.left = x + 'px'; s.top = y + 'px'; }
      };
      var all = g.ws.concat(g.dots), at = all.map(function (W) {
        var cv = W.cv, m = 0, tf;
        cv.style.translate = 'none';
        put(W, 0, 0);
        var b = cv.getBoundingClientRect();
        tf = getComputedStyle(cv.parentNode).transform;
        if (tf && tf !== 'none') m = new DOMMatrixReadOnly(tf).m41;
        return { x: b.left - m, y: b.top };
      }), o = at[0], X = dev(o.x), Y = dev(o.y);
      all.forEach(function (W, i) {
        var p = at[i];
        put(W, X + dev(p.x - o.x) - p.x, Y + dev(p.y - o.y) - p.y);
      });
    });
  }
  /* the big-screen mode (design/assets/zoom/wide.js, its point 2; phase 5 of the site, opts.zoom): the home grows as
     one composition. Worked out
     afresh from the zoomed page's ratio the drawings part, as each rule rounds its own way: on a 4K screen at 175%
     and k 1.25 a 2px cell is 4.375 device px, and the name (4 at 960: 3.5, up) stayed 4 while the road's pixel (3 at
     960: 3.5, down) went to 4: the name and the door words x1.00, the cities x1.33, the type x1.25. So there a
     drawing's cell is the one the plain page gives it on this screen (f at the screen's own ratio) times k, in whole
     device pixels: the one below or the one above, and which, the engine settles for the name's cell and the road's
     pixel together (__zoom.grow, where the rule is written: the two as near k as both can come, and as alike; g is
     the other of the two). So the name, the cities, the traveller and the marks keep to one another: 4 to 5 and 3
     to 4 there; both up where both stand at a half (3 and 3 at 150% and k 1.5); neither where one cannot move (175%
     and k 1.125). What follows the name follows it here too: the door words through doorsPick (the name's cell is
     their measure), the suffix (sfxCell) and the stations' beads (doorsSize).
     The road's pixel may so come out a little over its 2 of the page's px, and the road has only so much room
     (roadRoom, layout() says how much: 2.22px). Where the pair's road pixel would be past it (a 100% screen at k
     1.25: both at a half, 3 device px is 2.4px; the traveller at the corner stood against Shanghai and Boston ran
     3px past the line's end), the two keep the cells their own rules give, as without this: the name x1.5 and the
     road x1.0 there.
     Without the mode (k 1, ?wide=off, a phone): f at the page's ratio, as ever */
  hm.roadCell = null;
  hm.roadRoom = Infinity;
  function grown() { var WZ = hm.zoom; return WZ && WZ.k > 1 && WZ.grow && !phone() ? WZ : null; }
  function nameCell(d) { return Math.max(1, phone() ? Math.floor(hm.LS.cell * d + .01) : Math.round(hm.LS.cell * d)); }
  function cellFor(f, dpr, g) {
    var WZ = grown(), D = WZ && WZ.dpr();
    if (!WZ) return f(dpr);
    if (hm.roadCell && WZ.grow(hm.roadCell(D), hm.roadCell(dpr), hm.LS ? [[nameCell(D), nameCell(dpr)]] : []) > hm.roadRoom) return f(dpr);
    return WZ.grow(f(D), f(dpr), g ? [[g(D), g(dpr)]] : []);
  }
  /* the name's suffix (lettersSize says how it is sized). In the big-screen mode it stays in step with the name: half
     the name's cell as it is drawn there, where that is a whole number of device pixels; else, of the two whole
     numbers beside that half, the nearer to its own cell on the plain page times k (the upper of two as near) */
  function sfxCell(dpr) {
    function f(d) { return Math.max(1, phone() ? Math.floor(hm.LS.cell * d / 2 + .01) : cellOf(hm.LS.cell * d / 2)); }
    var WZ = grown(), n = Math.round(hm.lcell * dpr), t;
    if (!WZ) return f(dpr);
    if (n % 2 === 0) return n / 2;
    t = f(WZ.dpr()) * WZ.z;
    return (n + 1) / 2 - t <= t - (n - 1) / 2 + 1e-6 ? (n + 1) / 2 : Math.max(1, (n - 1) / 2);
  }
  Object.assign(hm, { mqTouch: mqTouch });
}
