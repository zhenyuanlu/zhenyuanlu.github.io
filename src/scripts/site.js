// Every page's script: the frame on the device grid, the header's faint rule once the page has gone under it,
// the pixel words, the footer's next race and its heart on whole device pixels, the fader. Pages add their own
// (blog-list.js, article.js); none of it is needed to read. The big-screen mode's engine first (wide.js: before any
// script measures anything, every page's entry importing this file first), where early.js turned the mode on.
import { zoom } from './wide.js';
import './fader.js';
import { mountWords, snap } from './lettering/index.js';
import { footerNext } from './race/next.js';
import { todayOf } from './today.js';
import { arrowSvg } from '../lib/arrows.mjs';

const root = document.documentElement;
/* the frame on the device grid (the draft's frameGrid): each part of the frame takes the left margin auto would
   give it, to the nearest whole device pixel (frame.css, html[data-grid]); not on a touch screen. (early.js sets it
   first, before the first paint; this follows a zoom or another screen). --dwx is a device pixel in the window's px,
   so the screen's own ratio (in the big-screen mode the page's is the screen's times the root's zoom: frame.css
   divides by --z for the page's own boxes) */
const mqTouch = window.matchMedia ? matchMedia('(any-hover: none)') : { matches: false };
function frameGrid() {
  const d = zoom ? zoom.dpr() : window.devicePixelRatio || 1;
  if (mqTouch.matches || !(d > 0)) { root.removeAttribute('data-grid'); root.style.removeProperty('--dwx'); return; }
  root.style.setProperty('--dwx', 1 / d + 'px');
  if (!root.hasAttribute('data-grid')) root.setAttribute('data-grid', '');
}
frameGrid();
addEventListener('resize', frameGrid);

const hd = document.querySelector('.ih');
function lineUp() { if (hd) hd.classList.toggle('lined', window.scrollY > 2); }
lineUp();
addEventListener('scroll', lineUp, { passive: true });

mountWords();

/* the footer's next race (the draft's footer(), inner.js): by the visitor's day (?today=YYYY-MM-DD where the address
   names one, as the race page reads it), from the races the footer carries (#zl-next, components/Footer.astro), after
   "Hello from Boston": " · next: <the race, its days> →" from three weeks before it, " · now: <the race> →" while it
   is under way, the long name on a desk and the tiny one on a phone (.fn-l, .fn-s), a link to it on the map
   (/race/#next: race/next.js, which the race page and the home's door read too). Written once, as the page opens,
   in a span of its own (.fn): on a desk it runs on to the right of "Hello from Boston", out of the line's measure
   (frame.css), so writing it moves nothing; on a phone it follows on the same line */
function footNext() {
  const box = document.getElementById('zl-next'), fh = document.querySelector('.if .fh');
  if (!box || !fh) return;
  let races = null;
  try { races = JSON.parse(box.textContent || ''); } catch (e) { /* (no data: no next) */ }
  const F = races && footerNext(races, todayOf(location.search));
  if (F) {
    const n = document.createElement('span'), a = document.createElement('a'), l = document.createElement('span'), s = document.createElement('span');
    a.href = box.getAttribute('data-href') || '/race/#next';
    l.className = 'fn-l'; l.textContent = F.long;
    s.className = 'fn-s'; s.textContent = F.tiny;
    a.append(F.lead, l, s, ' ');
    a.insertAdjacentHTML('beforeend', arrowSvg('r'));
    n.className = 'fn';
    n.append('\u00a0\u00b7 ', a);   /* (a no-break space: the run starts a line of its own on a desk, where a plain one would fold away) */
    fh.append(n);
  }
  fh.setAttribute('data-next', F ? (F.now ? 'now' : 'next') : '');
}
footNext();
/* (on a desk the next runs on towards the last edit's words: a race whose name would bring it within 24px of them
   (one without a short name, at a window of 1000px) is named by its tiny name there, as on a phone (.fn-t)) */
const fn = document.querySelector('.if .fn'), last = document.querySelector('.if .f1 > :nth-child(3)');
const mqDesk = window.matchMedia ? matchMedia('not all and (max-width: 999px)') : { matches: true };   /* (frame.css's desk) */
function fitNext() {
  fn.classList.remove('fn-t');
  if (!mqDesk.matches) return;
  const r = document.createRange();
  r.selectNodeContents(last);
  const x = Math.min(...[...r.getClientRects()].map((q) => q.left));
  if (fn.getBoundingClientRect().right + 24 > x) fn.classList.add('fn-t');
}
if (fn && last) {
  fitNext();
  addEventListener('resize', fitNext);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNext);
}

/* the footer's heart, a little svg of 1px cells: on a screen of 125%, 150% or 175% each cell is the whole device
   pixels nearest it (frame.css, --hb-z: a hair over, as a length is kept in 64ths cut down: a hair under and a cell
   of the 9 would come out a device pixel short) and the drawing stands on the device grid, moved by the fraction it
   is off, as the lettering is (the draft's zoom engine gave the heart the same cells, its --zk). At 100% and 200%
   the cells are whole already. (early.js sets --hb-z first, before the first paint, so the heart has its size then.)
   The heart is in the footer, a control, which in the big-screen mode stands in a box zoomed back to the window's px:
   its cells by the screen's own ratio, its nudge written in its own px (lettering's snap: __ui) */
const hearts = [...document.querySelectorAll('.hb')];
hearts.forEach((h) => { h.__ui = true; });
function heartGrid() {
  const d = zoom ? zoom.dpr() : window.devicePixelRatio || 1, c = Math.max(1, Math.round(d));
  if (Math.abs(d - c) > 1e-6 && d > 1) root.style.setProperty('--hb-z', String((c + 1e-3) / d));
  else root.style.removeProperty('--hb-z');
  hearts.forEach((h) => snap(h));
}
if (hearts.length) {
  heartGrid();
  let hr = 0;
  const again = () => { cancelAnimationFrame(hr); hr = requestAnimationFrame(heartGrid); };
  addEventListener('resize', again);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
  /* (and when the page over it settles to another height, by any fraction of a pixel, as a picture or see's wall
     coming in late moves the footer: it was left off the grid till the next resize) */
  if (window.ResizeObserver) new ResizeObserver(again).observe(document.body);
}
