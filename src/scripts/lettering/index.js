// The site's pixel lettering in the browser (the draft's inner.js, "pixels"): a word on a canvas of whole device
// pixels, in the stage's ink, drawn again when the light, the screen's scale or the layout changes.
//
// API (for every page and for the home and race ports):
//   drawWord(text, { size, set, ui, fit, colour, cls })  a canvas: the word `size` CSS px tall at 100% (the name's
//       set is 18 rows, so size 18 is a 1px cell, 36 a 2px cell; the door set is 23 rows). ui: a control's word,
//       the same size on every screen (fitted to the device grid where a cell is not whole device pixels);
//       fit: lettering that grows with the page's ratio. set: 'pixel' (default) or 'door'.
//       colour: 'ink' (default), 'grey', 'accent', 'red' or a function(tok) -> css colour.
//   word(text, { cell, ... })      the same, by its cell in CSS px (the draft's V1K.word)
//   bitmap(rows, opt)              a drawing given as rows of '#' and '.'
//   pixelCanvas(bits, opt)         a canvas for any grid of cells ({ w, h, bits }: lettering/bits.js)
//   mountWords(scope)              every svg[data-word] the server drew (components/PixelWord.astro) gets its canvas
//   repaint(), snap(canvas), snapAll()
// Every canvas made here is repainted on the light's change ('zl:stage' on document) and on a new screen scale.
//
// One size on every screen (the owner, 2026-10-11/12): a control's word keeps the size it has at 100%; where that
// is not a whole number of device pixels a cell, its letters are fitted to the grid (hint.js). A phone, a touch
// screen and a window that gets the phone layout keep whole cells.
import { wordBits, bitsFromRows, figureBits, rowsOf, PIXEL, DOOR_SET } from './bits.js';
import { hintWord } from './hint.js';
import { on, emit, phone, tok } from '../hub.js';
import { zoom } from '../wide.js';

export { wordBits, bitsFromRows, figureBits, PIXEL, DOOR_SET };

let painters = [];

/* the big-screen mode (scripts/wide.js; with ?wide=off, and wherever the frame stays 960px, zoom.k is not over 1 and
   all of this is as it was): a control's word (the header's name, a page's title, an article's way back) never grows
   on a big screen: it stands in a box zoomed back to the window's px (styles/wide.css), while the page round it is
   zoomed by z. Its cells are sized by the screen's own ratio (uiDpr), and it is put on the device grid in the
   window's px (snap). Every other drawing grows from its cell on the plain page (paintPixels: zoom.grow) */
function wideZ() { return zoom && zoom.k > 1 ? zoom.z : 1; }
function uiDpr() { return zoom && zoom.k > 1 ? zoom.dpr() : window.devicePixelRatio || 1; }

/** where lettering is one size on every screen: a desktop's page (not a phone, a touch screen, a narrow window) */
function lettered() { return !phone() && !(window.matchMedia && matchMedia('(any-hover: none)').matches); }
/** the page's ratio (device px a page px: the screen's times the page's zoom) with its float noise off (a zoomed
    browser says 1.100000024 for 110%) */
function trueRatio() {
  const on = !!(zoom && zoom.dpr), d = on ? zoom.dpr() : window.devicePixelRatio || 1, r = Math.round(d * 1e4) / 1e4;
  return (Math.abs(d - r) < 1e-6 ? r : d) * (on && zoom.z ? zoom.z : 1);
}

/** a canvas of whole cells for a grid of cells */
export function pixelCanvas(B, opt = {}) {
  const cv = document.createElement('canvas');
  if (opt.cls) cv.className = opt.cls;
  cv.setAttribute('aria-hidden', 'true');
  const P = { cv, B, cell: opt.cell || 2, colour: opt.colour || 'ink', ui: !!opt.ui };
  P.size = opt.size || Math.round(P.cell);   // a control's word: its cell in CSS px, the same on every screen
  P.fit = !!opt.fit && !P.ui;                // lettering: its cell is cell x the page's ratio, whole or not
  if (P.ui) cv.__ui = true;                  // a control's drawing (the big-screen mode, above)
  paintPixels(P);
  painters.push(P);
  return cv;
}
function paintPixels(P) {
  const dpr = P.ui ? uiDpr() : window.devicePixelRatio || 1, B = P.B, cv = P.cv;
  let cd = Math.max(1, Math.round(P.cell * dpr));
  const lt = P.fit && !!B.fit && lettered();
  /* (the big-screen mode: a page's own drawing grows from its cell on the plain page, with the page's other
     drawings: scripts/wide.js grow(). A control's keeps its size, above; lettering takes no whole-cell result, below) */
  if (!P.ui && !lt && zoom && zoom.k > 1 && zoom.grow) cd = zoom.grow(Math.max(1, Math.round(P.cell * zoom.dpr())), cd);
  const q = lt ? trueRatio() : dpr;
  const s = P.ui && B.fit ? P.size * dpr : lt ? P.cell * q : 0;
  const F = s > 1 && Math.abs(s - Math.round(s)) > 1e-6 ? hintWord(B, s, lt) : null;
  const c = cv.getContext('2d'), T = tok();
  const fill = typeof P.colour === 'function' ? P.colour(T) : (T[P.colour] || P.colour);
  if (F) {
    cv.width = F.w; cv.height = F.h;
    cv.style.width = (F.w / q) + 'px'; cv.style.height = (F.h / q) + 'px';
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = fill;
    F.rects.forEach((r) => c.fillRect(r[0], r[1], r[2], r[3]));
    return;
  }
  cv.width = B.w * cd; cv.height = B.h * cd;
  cv.style.width = (B.w * cd / dpr) + 'px'; cv.style.height = (B.h * cd / dpr) + 'px';
  c.clearRect(0, 0, cv.width, cv.height);
  c.fillStyle = fill;
  for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) if (B.bits[y * B.w + x]) c.fillRect(x * cd, y * cd, cd, cd);
}
export function repaint() {
  painters = painters.filter((P) => P.cv.isConnected || P.keep);
  painters.forEach(paintPixels);
  snapAll();
}
/* a canvas starts on a whole device pixel, so its cells stay crisp at 125%, 150% and 175%: moved in layout by the
   fraction it is off (position: relative, left / top), never by a transform (the compositor samples that half a
   pixel off). A canvas the page placed absolutely keeps its own left / top, plus the fraction */
export function snap(cv) {
  /* (the big-screen mode: a control's drawing is put on the grid in its own px, the window's, measured by the
     browser's own rect at the screen's own ratio, so it lands exactly where the plain page puts it: measured in the
     zoomed page's px, a drawing on a half device pixel could round the other way and stand a device pixel off) */
  const ui = !!cv.__ui && wideZ() !== 1;
  const dpr = ui ? zoom.dpr() : window.devicePixelRatio || 1, st = cv.style;
  st.transform = '';
  if (cv.__sn) { st.left = cv.__sn.l; st.top = cv.__sn.t; st.position = cv.__sn.p; cv.__sn = null; }
  if (!cv.isConnected) return;
  const cs = getComputedStyle(cv), pos = cs.position;
  if (pos === 'sticky' || pos === 'fixed') return;
  let l0 = 0, t0 = 0;
  if (pos === 'absolute') {
    if (cs.left === 'auto' || cs.top === 'auto') return;
    l0 = parseFloat(cs.left) || 0; t0 = parseFloat(cs.top) || 0;
  } else if (pos === 'relative') {
    l0 = parseFloat(cs.left) || 0; t0 = parseFloat(cs.top) || 0;
  }
  const r = ui ? zoom.rawRect(cv) : cv.getBoundingClientRect(), z = ui ? zoom.z : 1;
  const x = r.left + window.scrollX * z, y = r.top + window.scrollY * z;
  const dx = (Math.round(x * dpr) - x * dpr) / dpr, dy = (Math.round(y * dpr) - y * dpr) / dpr;
  if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) return;
  cv.__sn = { l: st.left, t: st.top, p: st.position };
  if (pos === 'static') st.position = 'relative';
  st.left = (l0 + dx).toFixed(4) + 'px';
  st.top = (t0 + dy).toFixed(4) + 'px';
}
export function snapAll() { painters.forEach((P) => snap(P.cv)); }

const setOf = (s) => (s === 'door' ? DOOR_SET : s && typeof s === 'object' ? s : PIXEL);
/** a word by its cell in CSS px (the draft's V1K.word) */
export function word(text, opt = {}) {
  return pixelCanvas(wordBits(text, setOf(opt.set || opt.style)), opt);
}
/** a word by its nominal height in CSS px at 100% */
export function drawWord(text, opt = {}) {
  const S = setOf(opt.set || opt.style);
  const cell = opt.size ? opt.size / rowsOf(S) : opt.cell || 2;
  return pixelCanvas(wordBits(text, S), { ...opt, cell });
}
export function bitmap(rows, opt) { return pixelCanvas(bitsFromRows(rows), opt); }

/** the server's words: each svg[data-word] (components/PixelWord.astro) gives its place to its canvas; and each small
    pixel picture the server drew from rows (svg[data-rows]: rows of '#' and '.', joined by '/'; an article's chapter
    pictures, plugins/rehype-article.mjs) its own, on whole device pixels, in the colour it names (ink, grey) */
export function mountWords(scope = document) {
  scope.querySelectorAll('svg[data-rows]').forEach((el) => {
    const rows = String(el.getAttribute('data-rows') || '').split('/').filter(Boolean);
    if (!rows.length) return;
    const cv = bitmap(rows, { cell: parseFloat(el.getAttribute('data-cell') || '2'), colour: el.getAttribute('data-colour') || 'ink', cls: el.getAttribute('data-cls') || '' });
    el.replaceWith(cv);
  });
  scope.querySelectorAll('svg[data-word]').forEach((el) => {
    const accent = (T) => T.accent || T.ink;
    const cv = word(el.getAttribute('data-word') || '', {
      set: el.getAttribute('data-set') || '',
      cell: parseFloat(el.getAttribute('data-cell') || '2'),
      ui: el.hasAttribute('data-ui'),
      fit: el.hasAttribute('data-fit'),
      cls: el.getAttribute('data-cls') || '',
      colour: el.getAttribute('data-colour') === 'accent' ? accent : el.getAttribute('data-colour') || 'ink',
    });
    el.replaceWith(cv);
  });
  requestAnimationFrame(snapAll);
}

/* the light: across dusk and night the paper and ink crossfade for 200ms (html.xf), so the pixels follow frame by
   frame, and the pages are told once more when the colours have settled */
let xfRaf = 0;
document.addEventListener('zl:stage', () => {
  repaint(); emit('stage');
  cancelAnimationFrame(xfRaf);
  const t0 = performance.now();
  xfRaf = requestAnimationFrame(function f(now) {
    repaint();
    if (now - t0 < 280) { xfRaf = requestAnimationFrame(f); return; }
    xfRaf = 0; emit('stage');
  });
});
/* a new screen scale, or a window dragged across 1000px (one size on a desktop's page, whole cells in the phone
   layout), draws the lettering again */
let lastDpr = window.devicePixelRatio || 1, lastLt = lettered();
addEventListener('resize', () => {
  const lt = lettered(), turned = lt !== lastLt;
  lastLt = lt;
  if ((window.devicePixelRatio || 1) !== lastDpr || turned) { lastDpr = window.devicePixelRatio || 1; repaint(); }
  emit('resize');
  snapAll();
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(snapAll));
on('frames', () => snapAll());
