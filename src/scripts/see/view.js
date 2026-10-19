// The photograph on the paper, as see's viewer (index.js) and a photograph's own page (photo.js) both show it (the
// draft v2ac's see viewer): placed as large as the window's room allows, never past its own pixels counted in the
// screen's device pixels, or past the width it stands at on the wall where that is more (the wall's one width, the
// owner's of 2026-10-19, draws the 400px files past their pixels: opened, one is never smaller than there,
// wallWidth()); and the hand on it. A swipe sideways steps to the photograph before or after, a swipe down closes, a
// plain tap or click on the paper closes (not on a control, not with a selection made, and on a phone not a
// finger's tap on the photograph); the wheel scrolls nothing. Two fingers pinch-zoom as on any page (the browser's
// own: see.css gives the paper touch-action pinch-zoom), and a gesture two fingers took part in steps and closes
// nothing; zoomed in, one finger pans the zoomed screen and no gesture steps or closes, until the screen is zoomed out
// again. A trackpad's pinch (the wheel with ctrl) zooms too.
import { phone } from '../hub.js';

/** the width every photograph stands at on the wall in this window, as its plain page hangs it (index.js, hang()):
    its column (two under 1000px, --s-gap 14px, in the frame's column of at most 520 and the window less 40; three on
    a desk, 24px apart, in 960, the window less 64 below 1024), no wider than a 600px file at its own pixels. (In the
    big-screen mode the wall's column may be a little wider; this is never more than it) */
export function wallWidth() {
  const vw = document.documentElement.clientWidth, d = window.devicePixelRatio || 1;
  const [W, n, gap] = vw < 1000 ? [Math.min(vw - 40, 520), 2, 14] : [Math.min(vw - 64, 960), 3, 24];
  return Math.max(0, Math.min(Math.round((W - gap * (n - 1)) / n), Math.floor(600 / d)));
}

/** where a w x h photograph stands (CSS px): { x, y, w, h }; least, the width it stands at on the wall */
export function fitPhoto(w, h, least = 0) {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight, ph = phone(), d = window.devicePixelRatio || 1, r = w / h;
  const own = Math.max(Math.floor(w / d), Math.floor(least));   // (its own pixels, or its width on the wall where more)
  /* (the room the bars leave: top and bottom, and on a desk the sides) */
  function room(top, bot, side) {
    const aw = vw - 2 * side, ah = Math.max(80, vh - top - bot);
    let fw = Math.min(aw, own), fh = fw / r;
    if (fh > ah) { fh = ah; fw = fh * r; }
    fw = Math.floor(fw); fh = Math.min(Math.max(Math.floor(h / d), Math.floor(own / r)), Math.round(fw / r));
    return { x: Math.round((vw - fw) / 2), y: Math.round(top + (ah - fh) / 2), w: fw, h: fh };
  }
  /* a phone on its side: the caption and the arrows stand in the bottom corners beside the photograph, close in the
     top one, so the photograph takes the window's height but 16px above and the bars' 52px below (a portrait one as
     large as that height allows, up to the larger of its own pixels and its width on the wall). One wide enough to
     reach into those corners (more than the window less 172px a side: the caption's 16px and its words, the arrows' 92px) keeps the bars' room */
  if (ph && vw > vh) { const f = room(16, 52, 0); if (f.w <= vw - 344) return f; }
  return ph ? room(52, 76, 0) : room(64, 72, 48);
}

/** the hand on the paper (view, the viewer's or the page's element): o.step(dk) with -1 or 1, o.close(); o.skip the
    targets that are controls of their own (buttons, links) */
export function handOn(view, o) {
  const skip = o.skip || 'a, button';
  const vv = window.visualViewport;
  const zoomed = () => !!vv && vv.scale > 1.01;
  if (vv) vv.addEventListener('resize', () => view.classList.toggle('s-zoomed', zoomed()));
  view.addEventListener('wheel', (e) => { if (!e.ctrlKey) e.preventDefault(); }, { passive: false });
  /* (one finger moves nothing under the paper; two are the browser's pinch) */
  view.addEventListener('touchmove', (e) => { if (e.touches.length < 2 && !zoomed()) e.preventDefault(); }, { passive: false });
  let sw = null, many = false;
  const down = new Set();
  view.addEventListener('pointerdown', (e) => {
    if (e.isPrimary) { down.clear(); many = false; }   /* (a gesture begins: what an earlier one left is let go of) */
    down.add(e.pointerId);
    if (down.size > 1) many = true;
    sw = many || zoomed() || (e.target.closest && e.target.closest(skip)) ? null : { x: e.clientX, y: e.clientY, moved: false };
  });
  view.addEventListener('pointermove', (e) => {
    if (sw && (Math.abs(e.clientX - sw.x) > 10 || Math.abs(e.clientY - sw.y) > 10)) sw.moved = true;
  });
  function up(e) { down.delete(e.pointerId); if (!down.size) many = false; }
  view.addEventListener('pointerup', (e) => {
    const g = sw;
    sw = null;
    up(e);
    if (!g || e.button !== 0) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) o.step(dx < 0 ? 1 : -1);
    else if (dy > 64 && Math.abs(dy) > Math.abs(dx)) o.close();
    /* (on a phone a finger's tap on the photograph itself closes nothing: a double tap, the habit that zooms a
       photograph, closed it at its first tap. The paper, close, a swipe down and Back still close) */
    else if (!g.moved && !(window.getSelection && String(window.getSelection())) && !(phone() && e.pointerType === 'touch' && e.target.closest && e.target.closest('.s-big'))) o.close();
  });
  view.addEventListener('pointercancel', (e) => { sw = null; up(e); });
}
