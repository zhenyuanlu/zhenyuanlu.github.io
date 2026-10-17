// The selective big-screen mode in the browser: the draft's engine (design/assets/zoom/wide.js, v2ab's mode, the
// owner's choice: "大屏用B", 2026-10-11, kept on 2026-10-12 after the four wide prototypes) for a site of one document
// per address. What the mode is, and the decision itself (the step k, the page's zoom z, the variables and the
// attributes the sheet reads), are early.js's: made in the head before the first paint, so a page the browser makes
// ready before it is shown (the speculation rules' prerender) already has its final size. This module is the rest:
//   1. Every script keeps working in the page's own px. The root is zoomed by z (k on a poster page: the home, race,
//      the 404; the text's small step t on a reading page), and the browser answers some things in the window's px
//      (rects, the pointer, the window's size, the root's scroll) and others in the page's (offsetWidth, computed
//      styles, an element's own scroll). Here the former are put in the page's px, and devicePixelRatio is the
//      screen's times z, so every pixel drawing is drawn again for its size on whole device pixels, as the draft's
//      shim does (its text below, copied from design/assets/zoom/wide.js and zoom.js: keep them in step).
//   2. grow(): a drawing's cell on a poster page, grown from its cell on the plain page as one set with the page's
//      other drawings (the draft's point 2: the name and the road's pixel, race's figures and medals, the traveller).
//   3. The decision again on every resize, before the page's own listeners (this is the first there is), and on a
//      move to a screen of another scale (a resize is then sent, so every page lays out and draws again).
// Controls (the header, the fader, the footer, the doors' ring, the page's word, tags, filters, link rows) stand in
// boxes zoomed back to the window's px (styles/wide.css): a drawing there is sized by the screen's own ratio
// (zoom.dpr()) and a nudge measured in the page's px is written z times as long (scripts/lettering, fader.js,
// site.js ask zoom.k > 1).
// Not here, as the site needs none of it: the draft's router hook (each page is its own document, its kind fixed),
// its twin (race made ready out of sight on a reading page: the speculation rules make it ready instead), and
// zoom.js's whole-page scale-up. Where early.js did not turn the mode on (?wide=off, a touch-only screen, a browser
// whose zoom does not answer as the standard's), nothing here runs and `zoom` is null: the plain 960px page.
// The API (window.__zoom, as the draft's: the home's and race's engines take it as their opts.zoom):
//   z k t       the page's zoom, the step, the text's step (1 where the frame is 960px)
//   reading     a reading page (zoomed by t) or a poster (by k)
//   iw() ih() dpr()   the window's own size and the screen's own ratio (unwrapped)
//   rawRect(el) rawRects(el)   the browser's own rects, in the window's px
//   grow(c, own, mates)        a drawing's cell (above)
//   apply()     decide again (a resize does it already)
const W = window, R = document.documentElement, E = W.__wide;

export const zoom = E && E.std && !W.__zoom ? install() : W.__zoom || null;

function install() {
  let k = E.k(), t = E.t(), z = E.z();
  const reading = E.reading;
  const sync = () => { k = E.k(); t = E.t(); z = E.z(); };
  const dprReal = E.dpr;
  const rawRect = Element.prototype.getBoundingClientRect, rawRects = Element.prototype.getClientRects;
  const mmO = W.matchMedia;

  /* a drawing's cell on this page (the draft's point 2). c: its cell on the plain page, in whole device pixels (the
     caller works it out from the screen's own ratio, dpr()); own: the cell its own rule gives at this page's ratio
     (it settles a tie: of two sizes as near, the one the drawing had before this rule); mates: the page's other
     drawings, each [c, own], or [c, own, cell] for one whose cell is settled already. Each takes the whole device
     pixel below c x z or the one above, and the combinations are weighed as one: the one whose worst distance from z
     is the smallest (then its next worst); of equals the one whose drawings grow most alike; of equals the one that
     leaves most drawings at the cell their own rule gives; of equals the larger */
  function grow(c, own, mates) {
    const S = [[c, own]].concat(mates || []);
    let best = null;
    (function each(i, cells) {
      if (i < S.length) {
        const v = S[i][0] * z, lo = Math.max(1, Math.floor(v + 1e-6)), hi = Math.max(1, Math.ceil(v - 1e-6));
        (S[i][2] ? [S[i][2]] : lo === hi ? [lo] : [lo, hi]).forEach((x) => each(i + 1, cells.concat(x)));
        return;
      }
      const f = cells.map((v, j) => v / S[j][0]);
      const o = { cell: cells[0], d: f.map((v) => Math.abs(v - z)).sort((a, b) => b - a),
        apart: Math.max.apply(null, f) - Math.min.apply(null, f),
        own: cells.filter((v, j) => v === S[j][1]).length,
        sum: f.reduce((a, b) => a + b, 0) };
      if (!best || better(o, best)) best = o;
    })(0, []);
    return best.cell;
  }
  function better(a, b) {
    for (let i = 0; i < a.d.length; i++) if (Math.abs(a.d[i] - b.d[i]) > 1e-9) return a.d[i] < b.d[i];
    if (Math.abs(a.apart - b.apart) > 1e-9) return a.apart < b.apart;
    if (a.own !== b.own) return a.own > b.own;
    return a.sum > b.sum + 1e-9;
  }
  function inv(v) { return z === 1 || typeof v !== 'number' ? v : v / z; }
  function mul(v) { return z === 1 || typeof v !== 'number' ? v : v * z; }

  /* ---------- the window: its size, its pixel ratio, its scroll ---------- */
  function own(o, key) { let d; while (o && !(d = Object.getOwnPropertyDescriptor(o, key))) o = Object.getPrototypeOf(o); return d || null; }
  function wrapGet(o, key, f) {
    const d = own(o, key);
    if (!d || !d.get) return null;
    Object.defineProperty(o, key, { configurable: true, enumerable: d.enumerable, get() { return f(d.get.call(this), this); }, set: d.set });
    return d;
  }
  wrapGet(W, 'innerWidth', inv);
  wrapGet(W, 'innerHeight', inv);
  /* the screen's ratio times z, its float noise taken off (2.135, not 2.1350000000000002) */
  wrapGet(W, 'devicePixelRatio', (v) => (z === 1 ? v : Math.round(v * z * 1e9) / 1e9));
  ['scrollX', 'scrollY', 'pageXOffset', 'pageYOffset'].forEach((key) => wrapGet(W, key, inv));
  /* scrollTo(x, y), scrollTo({ top, left, behavior }) and the same for scroll and scrollBy, in the page's px */
  function scroller(f) {
    return function (a, b) {
      if (z === 1) return f.apply(this, arguments);
      if (a && typeof a === 'object') {
        const o = {};
        for (const key in a) o[key] = (key === 'top' || key === 'left') && typeof a[key] === 'number' ? a[key] * z : a[key];
        return f.call(this, o);
      }
      return f.call(this, mul(+a), mul(+b));
    };
  }
  ['scrollTo', 'scroll', 'scrollBy'].forEach((key) => { if (W[key]) W[key] = scroller(W[key]); });

  /* ---------- rects: an element's and a range's, in the page's px ---------- */
  function rect(r) { return z === 1 ? r : new DOMRect(r.x / z, r.y / z, r.width / z, r.height / z); }
  function rects(a) {
    if (z === 1) return a;
    const o = [];
    for (let i = 0; i < a.length; i++) o.push(rect(a[i]));
    o.item = (i) => o[i] || null;
    return o;
  }
  [Element.prototype, W.Range && Range.prototype].forEach((P) => {
    if (!P) return;
    const g = P.getBoundingClientRect, l = P.getClientRects;
    if (g) P.getBoundingClientRect = function () { return rect(g.call(this)); };
    if (l) P.getClientRects = function () { return rects(l.call(this)); };
  });
  /* an svg's screen matrix maps its units to the window's px: to the page's */
  if (W.SVGGraphicsElement && SVGGraphicsElement.prototype.getScreenCTM) {
    const ctm = SVGGraphicsElement.prototype.getScreenCTM;
    SVGGraphicsElement.prototype.getScreenCTM = function () {
      const M = ctm.call(this);
      return !M || z === 1 ? M : new DOMMatrix([1 / z, 0, 0, 1 / z, 0, 0]).multiply(M);
    };
  }

  /* ---------- the root's own box is the window's: its client and scroll sizes and its scroll offsets ----------
     (only the root's: body and every other element already answer in the page's px, their own scroll too) */
  const isRoot = (el) => el === R || el === document.scrollingElement;
  ['clientWidth', 'clientHeight', 'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft'].forEach((key) => {
    const d = own(Element.prototype, key);
    if (!d || !d.get) return;
    Object.defineProperty(Element.prototype, key, { configurable: true, enumerable: d.enumerable,
      get() { const v = d.get.call(this); return isRoot(this) ? inv(v) : v; },
      set: d.set ? function (v) { d.set.call(this, isRoot(this) ? mul(+v) : v); } : undefined });
  });
  ['scrollTo', 'scroll', 'scrollBy'].forEach((key) => {
    const f = Element.prototype[key];
    if (!f) return;
    const g = scroller(f);
    Element.prototype[key] = function () { return isRoot(this) ? g.apply(this, arguments) : f.apply(this, arguments); };
  });

  /* ---------- the pointer, the wheel, a touch ---------- */
  function wrapAll(P, keys, f) {
    if (!P) return;
    keys.forEach((key) => { if (Object.getOwnPropertyDescriptor(P, key)) wrapGet(P, key, f); });
  }
  const PTR = ['clientX', 'clientY', 'pageX', 'pageY', 'x', 'y', 'offsetX', 'offsetY', 'layerX', 'layerY', 'movementX', 'movementY'];
  wrapAll(W.MouseEvent && MouseEvent.prototype, PTR, inv);
  wrapAll(W.PointerEvent && PointerEvent.prototype, PTR.concat(['width', 'height']), inv);
  /* a wheel's pixels are the window's: in the page's px, as scrollBy takes them (lines and pages left alone) */
  wrapAll(W.WheelEvent && WheelEvent.prototype, ['deltaX', 'deltaY', 'deltaZ'], (v, e) => (e.deltaMode === 0 ? inv(v) : v));
  wrapAll(W.Touch && Touch.prototype, ['clientX', 'clientY', 'pageX', 'pageY', 'radiusX', 'radiusY'], inv);
  /* what is under a point given in the page's px */
  ['elementFromPoint', 'elementsFromPoint', 'caretRangeFromPoint', 'caretPositionFromPoint'].forEach((key) => {
    const f = Document.prototype[key];
    if (!f) return;
    Document.prototype[key] = function (x, y) { return f.apply(this, [mul(x), mul(y)].concat([].slice.call(arguments, 2))); };
  });

  /* ---------- the observers and the visual viewport ----------
     IntersectionObserver answers in the window's px: its entries' rects come back in the page's, and a margin in px
     round the window (no root given) is taken in the page's px too (at the z it is made with) */
  const IO = W.IntersectionObserver;
  if (IO) {
    const entry = (e) => ({ target: e.target, time: e.time, isIntersecting: e.isIntersecting, isVisible: e.isVisible, intersectionRatio: e.intersectionRatio,
      boundingClientRect: rect(e.boundingClientRect), intersectionRect: rect(e.intersectionRect), rootBounds: e.rootBounds ? rect(e.rootBounds) : null });
    const ZIO = function (cb, opt) {
      const o = {};
      opt = opt || {};
      for (const key in opt) o[key] = opt[key];
      if (z !== 1 && !o.root && typeof o.rootMargin === 'string') o.rootMargin = o.rootMargin.replace(/(-?[\d.]+)px/g, (_, n) => (+n * z) + 'px');
      const io = new IO(function (es, obs) { return cb.call(this, z === 1 ? es : es.map(entry), obs); }, o);
      const take = io.takeRecords;
      io.takeRecords = function () { const a = take.call(io); return z === 1 ? a : a.map(entry); };
      return io;
    };
    ZIO.prototype = IO.prototype;
    W.IntersectionObserver = ZIO;
  }
  if (W.VisualViewport) wrapAll(VisualViewport.prototype, ['width', 'height', 'offsetLeft', 'offsetTop', 'pageLeft', 'pageTop'], inv);

  /* ---------- media queries asked from a script: a resolution the page computed from its devicePixelRatio is put back
     to the screen's own (the lettering's and teach's re-arm on a move to another screen ask for exactly that) ---------- */
  if (mmO) W.matchMedia = function (q) {
    if (z !== 1 && typeof q === 'string') {
      const real = dprReal();
      q = q.replace(/((?:min-|max-)?resolution\s*:\s*)([\d.]+)(dppx|x)\b/g, (_, a, n, u) => {
        const v = n / z;
        return a + (Math.abs(v - real) < 1e-6 ? real : Math.round(v * 1e6) / 1e6) + u;
      }).replace(/((?:min-|max-)?resolution\s*:\s*)([\d.]+)dpi\b/g, (_, a, n) => a + Math.round(n / z * 1e4) / 1e4 + 'dpi')
        .replace(/(-webkit-(?:min-|max-)?device-pixel-ratio\s*:\s*)([\d.]+)/g, (_, a, n) => {
          const v = n / z;
          return a + (Math.abs(v - real) < 1e-6 ? real : Math.round(v * 1e6) / 1e6);
        });
    }
    return mmO.call(W, q);
  };

  /* ---------- the decision again on every resize (before the page's own listeners: this one is the first there is) */
  const decide = () => { E.apply(); sync(); };
  let resizedAt = -1e9;
  W.addEventListener('resize', (e) => { if (e.isTrusted) resizedAt = Date.now(); decide(); }, true);
  /* a move to a screen of another scale: where the window kept its CSS size (so no resize came: race's page and the
     frame's listen for nothing else) a resize is sent, so every page lays out and draws again for the new ratio, as it
     does for a new z */
  (function arm() {
    if (!mmO) return;
    const q = mmO.call(W, '(resolution: ' + dprReal() + 'dppx)');
    function on() {
      if (q.removeEventListener) q.removeEventListener('change', on); else q.removeListener(on);
      decide(); arm();
      if (Date.now() - resizedAt > 100) W.dispatchEvent(new Event('resize'));
    }
    if (q.addEventListener) q.addEventListener('change', on); else q.addListener(on);
  })();
  /* a printed page is the plain page (its sheet, article.css, sets its own widths and type), as the page's scripts see
     it too (a picture's cap, the frame's width): the mode off for the print and on again after, each followed by a
     resize, so every page lays out and draws for it. (wide.css takes the zoom off for print too, where a browser
     prints without saying so first) */
  W.addEventListener('beforeprint', () => { E.print(true); sync(); W.dispatchEvent(new Event('resize')); });
  W.addEventListener('afterprint', () => { E.print(false); sync(); W.dispatchEvent(new Event('resize')); });
  /* (a page brought back from the browser's cache into a window of another size: decided again, and where z changed
     with it the page is told, as by a resize) */
  W.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const z0 = z;
    decide();
    if (z !== z0 && Date.now() - resizedAt > 100) W.dispatchEvent(new Event('resize'));
  });

  W.__zoom = {
    get z() { return z; },
    get k() { return k; },
    get t() { return t; },
    get reading() { return reading; },
    wide: true, std: true, base: [960, 860], cap: 1.5,
    iw: E.iw, ih: E.ih, dpr: dprReal,
    rawRect: (el) => rawRect.call(el),
    rawRects: (el) => rawRects.call(el),
    apply: decide, grow,
  };
  return W.__zoom;
}
