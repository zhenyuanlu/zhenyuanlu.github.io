// /see/<name>/'s behaviour (the draft v2ac's see viewer, on a photograph's own page, pages/see/[photo].astro): the
// photograph placed to the pixel as the viewer places it (as large as the window's room allows, never past its own
// pixels counted in the screen's device pixels), again on a resize; the arrow keys, a swipe sideways and the arrows
// go to the photograph before or after, Escape, a swipe down, close and a click on the paper back to the wall, at
// this photograph; two fingers pinch-zoom (view.js, which the viewer shares). Nothing scrolls. The wall's filter
// (?kind=, as the viewer's address keeps it) stays on the ways out: close, before, after. The page reads without it.
// On a touch phone (under 1000px wide, nothing that hovers: the wall's viewer's own test, index.js) a step to the
// photograph before or after takes this page's place in the history (location.replace), so Back leaves the
// photographs at once, however many were seen; close is a step of its own. A desk, and a narrow window in a mouse's
// hand, keep an entry a step, as before.
import { fitPhoto, handOn } from './view.js';

const view = document.querySelector('.s-one');
if (view) setup();

function setup() {
  const big = view.querySelector('.s-big');
  const W = +view.getAttribute('data-w') || big.naturalWidth || 600, H = +view.getAttribute('data-h') || big.naturalHeight || 900;
  const touch = () => !!(window.matchMedia && matchMedia('(max-width: 999px) and (hover: none)').matches);
  const go = (sel) => { const a = view.querySelector(sel); if (a && a.href) { if (touch() && sel !== '.s-x') location.replace(a.href); else location.assign(a.href); } };
  /* (the arrows' own taps on a touch phone: the step in this page's place too; a tap that asks for a new tab still goes there) */
  view.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a.s-prev, a.s-next');
    if (!a || !touch() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    location.replace(a.href);
  });
  /* (this page as a reload of the wall's viewer on a touch phone, which stood on a step of its own in the history,
     zlView (see/index.js): the steps before it still belong to this document, as a pushState step's do after a reload,
     so Back changes only the address, to the wall's. The wall is loaded in that step's place, at this photograph, as
     close leaves it: from this page's own address, so that it is a load and not a step to the wall's #. Nowhere else
     does this page see such a step) */
  const own = location.pathname + location.search, out = view.querySelector('a.s-x');
  if (out && history.state && history.state.zlView) addEventListener('popstate', () => {
    if (location.pathname + location.search === own) return;
    try { history.replaceState(null, '', own); } catch (e) { /* fine */ }
    location.replace(out.href);
  });
  /* (the wall's filter where the address has one: the wall itself drops one it does not know) */
  const kind = new URLSearchParams(location.search).get('kind');
  if (kind && /^[a-z0-9-]+$/.test(kind)) view.querySelectorAll('a.s-x, a.s-prev, a.s-next').forEach((a) => {
    const u = new URL(a.href);
    u.searchParams.set('kind', kind);
    a.href = u.pathname + u.search + u.hash;
  });
  function place() {
    const r = fitPhoto(W, H), s = big.style;
    s.left = r.x + 'px'; s.top = r.y + 'px'; s.width = r.w + 'px'; s.height = r.h + 'px';
    big.classList.add('s-set');
  }
  place();
  addEventListener('resize', place);
  /* the keys: as the viewer's (nothing scrolls the page; a space still presses a link) */
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); go('.s-x'); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); go('a.s-prev'); return; }
    if (k === 'ArrowRight') { e.preventDefault(); go('a.s-next'); return; }
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(k)) e.preventDefault();
  });
  /* a swipe steps; a swipe down closes; a plain click anywhere but the links closes */
  handOn(view, { skip: 'a', step: (dk) => go(dk > 0 ? 'a.s-next' : 'a.s-prev'), close: () => go('.s-x') });
}
