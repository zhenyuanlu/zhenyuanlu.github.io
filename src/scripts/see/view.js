// The photograph on the paper, as see's viewer (index.js) and a photograph's own page (photo.js) both show it (the
// draft v2ac's see viewer): placed as large as the window's room allows, never past its own pixels counted in the
// screen's device pixels; and the hand on it. A swipe sideways steps to the photograph before or after, a swipe down
// closes, a plain tap or click on the paper closes (not on a control, not with a selection made); the wheel scrolls
// nothing. Two fingers pinch-zoom as on any page (the browser's own: see.css gives the paper touch-action pinch-zoom),
// and a gesture two fingers took part in steps and closes nothing; zoomed in, one finger pans the zoomed screen and
// no gesture steps or closes, until the screen is zoomed out again. A trackpad's pinch (the wheel with ctrl) zooms too.
import { phone } from '../hub.js';

/** where a w x h photograph stands (CSS px): { x, y, w, h } */
export function fitPhoto(w, h) {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight, ph = phone(), d = window.devicePixelRatio || 1, r = w / h;
  const top = ph ? 52 : 64, bot = ph ? 76 : 72, side = ph ? 0 : 48;
  const aw = vw - 2 * side, ah = Math.max(80, vh - top - bot);
  let fw = Math.min(aw, Math.floor(w / d)), fh = fw / r;
  if (fh > ah) { fh = ah; fw = fh * r; }
  fw = Math.floor(fw); fh = Math.min(Math.floor(h / d), Math.round(fw / r));
  return { x: Math.round((vw - fw) / 2), y: Math.round(top + (ah - fh) / 2), w: fw, h: fh };
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
    else if (!g.moved && !(window.getSelection && String(window.getSelection()))) o.close();
  });
  view.addEventListener('pointercancel', (e) => { sw = null; up(e); });
}
