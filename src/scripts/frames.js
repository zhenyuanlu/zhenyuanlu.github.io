// The picture frame (the draft's V1K.frame, inner.js): zhenyuanlu.com's fixed frame whose picture moves in hand.
// Every frame in a row is one box; the picture is drawn as tall as the frame, whole from top to bottom, never
// past its own pixels (a small one stands in the middle of the plate). One wider than the frame rests on its
// start and, while its host (.pf-host: a blog row) is in hand, glides to its far edge and back (the sheet does
// the moving: --pf-x, --pf-x1, --pf-t). In hand: a pointer that has moved on the host (not one the page merely
// came under: panPoint), or his own Tab (panKey). A finger drags a wide picture sideways instead. A frame with a
// film (data-film) plays it over its still while in hand: never on touch, never with ?pan=off, never under
// reduced motion. Each frame snaps its box to whole device pixels. A host with no stop of its own for the keyboard
// (build's cards without a link) has its travelling picture as the stop, under its words (frameStop, panPress).
// The draft's comments explain every rule.
import { emit, reduced } from './hub.js';
import { zoom } from './wide.js';

let frames = [], frameRaf = 0, frameRO = null, frameIO = null, panPressed = null;
const MARK = 0.72, MIN_WAY = 16, TRAVEL = [500, 5, 700, 4000];
const PAN = !/[?&]pan=off(?:[&#]|$)/.test(location.search);
let host = null;

function framePos(s, d) {
  const m = /^\s*(-?[\d.]+)%\s+(-?[\d.]+)%\s*$/.exec(s || '');
  return m ? [Math.max(0, Math.min(1, m[1] / 100)), Math.max(0, Math.min(1, m[2] / 100))] : d;
}
/* a cover that is a short film: the still is the frame's picture; in hand the film plays over it, at its place
   and size; let go, it stops, goes back to its first frame and the still shows again */
let filmN = 0;
function frameFilm(F) {
  const f = F.el, src = f.getAttribute('data-film');
  if (!src) return;
  const on = !!F.hand && PAN && !reduced() && f.classList.contains('pf-in') && !(window.matchMedia && matchMedia('(any-hover: none)').matches);
  if (/\.(webp|gif)(?:[?#]|$)/i.test(src)) {
    if (on && !F.film) {
      const im = (F.film = document.createElement('img'));
      im.className = 'pf-film'; im.alt = ''; im.decoding = 'async';
      im.setAttribute('aria-hidden', 'true');
      im.addEventListener('load', () => { if (F.film === im && F.hand) f.classList.add('pf-run'); });
      im.src = src + '#' + (++filmN);
      f.appendChild(im);
    } else if (!on && F.film) {
      f.classList.remove('pf-run');
      F.film.remove();
      F.film = null;
    }
    return;
  }
  if (on) {
    let v = F.film;
    if (!v) {
      v = F.film = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.tabIndex = -1;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.disablePictureInPicture = true;
      v.addEventListener('playing', () => { if (F.hand) f.classList.add('pf-run'); });
      v.src = src;
      f.appendChild(v);
    }
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => {});
  } else if (F.film) {
    F.film.pause();
    f.classList.remove('pf-run');
    try { F.film.currentTime = 0; } catch (e) { /* not loaded yet */ }
  }
}
function frameLayout(F) {
  const f = F.el, st = f.style;
  if (!f.isConnected) return;
  const dpr = window.devicePixelRatio || 1;
  st.width = ''; st.height = ''; st.left = ''; st.top = '';
  const r = f.getBoundingClientRect();
  if (!r.width || !r.height) return;   // hidden (a filter): laid out once it shows
  const fwD = Math.max(1, Math.floor(r.width * dpr + 0.01)), fhD = Math.max(1, Math.round(fwD * r.height / r.width));
  st.width = (fwD / dpr) + 'px'; st.height = (fhD / dpr) + 'px';
  const x = r.left + window.scrollX, y = r.top + window.scrollY;
  const dx = (Math.round(x * dpr) - x * dpr) / dpr, dy = (Math.round(y * dpr) - y * dpr) / dpr;
  if (Math.abs(dx) > 0.0005) st.left = dx.toFixed(4) + 'px';
  if (Math.abs(dy) > 0.0005) st.top = dy.toFixed(4) + 'px';
  const [iw, ih] = frameDims(f);
  if (!iw || !ih) return;
  const fit = f.getAttribute('data-fit'), mark = fit === 'mark';
  let s = Math.min(1, mark ? Math.min(fwD * MARK / iw, fhD * MARK / ih) : fhD / ih);
  let dwD = Math.round(iw * s), dhD = Math.round(ih * s), over = dwD - fwD;
  if (!mark && fit === 'whole' && over > 0) { s = fwD / iw; dwD = fwD; dhD = Math.round(ih * s); over = 0; }
  else if (!mark && over && Math.abs(over) <= 2 && dhD === fhD) { dwD = fwD; over = 0; }
  over = Math.max(0, over);
  const can = over >= MIN_WAY * dpr && PAN, go = can && !reduced();
  const a = f.hasAttribute('data-pos') ? framePos(f.getAttribute('data-pos'), [0, 0])[0] : (over >= MIN_WAY * dpr ? 0 : 0.5);
  const b = f.hasAttribute('data-to') ? framePos(f.getAttribute('data-to'), [1, 1])[0] : (a < 0.5 ? 1 : 0);
  F.dpr = dpr; F.over = can ? over : 0;
  F.x0 = over ? -Math.round(over * a) : Math.floor((fwD - dwD) / 2);
  F.x1 = go ? -Math.round(over * b) : F.x0;
  if (!can) F.frac = null;
  F.cx = can && F.frac != null ? -Math.round(over * F.frac) : F.x0;
  const way = Math.abs(F.x1 - F.x0) / dpr;
  st.setProperty('--pf-w', (dwD / dpr) + 'px'); st.setProperty('--pf-h', (dhD / dpr) + 'px');
  st.setProperty('--pf-x', (F.cx / dpr) + 'px'); frameFar(F);
  st.setProperty('--pf-y', (Math.floor((fhD - dhD) / 2) / dpr) + 'px');
  st.setProperty('--pf-t', Math.round(Math.max(TRAVEL[2], Math.min(TRAVEL[3], TRAVEL[0] + TRAVEL[1] * way))) + 'ms');
  st.setProperty('--pf-hl', (Math.max(1, Math.round(dpr)) / dpr) + 'px');
  f.setAttribute('data-pan', can ? 'x' : '');
  /* the keyboard reaches a hidden side through its host's own stops (a blog row's title). A host with none (build's
     cards without a link) has the frame itself as the stop, under its own words (its label), and only while its
     picture travels; a picture with nothing hidden is never one */
  F.stop = go && f.hasAttribute('aria-label') && !!F.host && !F.host.querySelector('a[href]:not([tabindex="-1"]), button, [tabindex="0"]:not(.pf)');
  frameStop(F);
  f.classList.add('pf-in');
  if (F.near || !frameIO) frameShow(F);
}
function frameFar(F) { F.el.style.setProperty('--pf-x1', F.hand && F.x1 != null ? (F.x1 / F.dpr) + 'px' : 'var(--pf-x)'); }
/* the keyboard's stop is on the frame, but not while a button or a finger is down on it (panPress, below) */
function frameStop(F) {
  const f = F.el;
  if (F.stop && F !== panPressed) f.setAttribute('tabindex', '0');
  else if (f.hasAttribute('tabindex')) f.removeAttribute('tabindex');
}
function frameShow(F) {
  if (F.shown) return;
  F.shown = true;
  frameImage(F);
}
function frameImage(F) {
  const w = wideFile(F.el), src = w ? 'data-src-wide' : 'data-src', set = w ? 'data-img-set-wide' : 'data-img-set';
  F.wide = w;
  // (the address is one already, as the image step wrote it: encoded again, the dev server's /_image/?href=%2F…
  // became %252F… and its picture never came)
  F.el.style.backgroundImage = 'url("' + (F.el.getAttribute(src) || '').replace(/"/g, '%22') + '")';
  /* (the AVIF where this browser reads image-set()'s types: Frame.astro data-img-set; one that cannot read it keeps the url) */
  if (F.el.hasAttribute(set)) F.el.style.backgroundImage = F.el.getAttribute(set);
}
/* the big-screen mode: a frame may hold a larger file of its picture for the mode alone (Frame.astro's wide prop:
   data-src-wide, its type switch data-img-set-wide and its own pixels data-w-wide x data-h-wide), made only where the
   source has more pixels than the plain page's file. While the frame is a step wider than 960px (zoom.k > 1) that
   file is the one shown, drawn and capped by (frameCaps); else, and with ?wide=off, the plain page's, as without the
   mode. A frame already shown takes the other file when the window crosses the mode's edge (frameAll) */
function wideFile(f) { return !!(zoom && zoom.k > 1) && f.hasAttribute('data-src-wide'); }
function frameDims(f) { const w = wideFile(f); return [+f.getAttribute(w ? 'data-w-wide' : 'data-w'), +f.getAttribute(w ? 'data-h-wide' : 'data-h')]; }
/* the big-screen mode (scripts/wide.js; the draft's inner.js frameCaps): on a wider frame a row's frames grow with
   their column, but only as far as the pixels their pictures hold, and never under their size at 960. A page marks a
   row of frames data-pf-row="N" (N: a frame's width in the 960px frame, CSS px); here each row's widest frame that
   its pictures still fill on this screen is worked out (a picture's height over the device px a page px holds, times
   the frame's shape; one shown whole, its width too) and given to the row as --pf-fw, which every frame's width reads
   (frame.css; blog.css's column, wide.css's featured figure). A mark (fit "mark") holds no one back, nor does a
   picture far smaller than the row's others (under 0.6 of their median: one small diagram among the covers stands in
   the middle of its plate). A frame in a hidden row (the blog under a topic) counts too, by its shape, so the size
   the rows share does not change with what is shown. Where the frame stays 960px (and with ?wide=off) nothing is set */
let capsOn = false;
function frameCaps() {
  const on = !!(zoom && zoom.k > 1);
  if (!on && !capsOn) return;
  capsOn = on;
  const dpr = window.devicePixelRatio || 1;
  (host || document).querySelectorAll('[data-pf-row]').forEach((g) => {
    if (!on) { g.style.removeProperty('--pf-fw'); return; }
    const ws = [];
    g.querySelectorAll('.pf').forEach((f) => {
      const [iw, ih] = frameDims(f), fit = f.getAttribute('data-fit'), r = f.getBoundingClientRect();
      const hid = (!r.width || !r.height) && !!f.closest('[hidden]');
      if (!iw || !ih || fit === 'mark' || ((!r.width || !r.height) && !hid)) return;
      /* (its shape as the style gives it, not as its box stands: frameLayout snaps the box to whole device pixels) */
      const sh = (getComputedStyle(f).aspectRatio || '').split('/');
      let ar = sh.length === 2 ? parseFloat(sh[0]) / parseFloat(sh[1]) : parseFloat(sh[0]);
      if (!(ar > 0) || !isFinite(ar)) { if (hid) return; ar = r.width / r.height; }
      ws.push((fit === 'whole' ? Math.max(iw, ih * ar) : ih * ar) / dpr);
    });
    ws.sort((a, b) => a - b);
    const med = ws.length ? ws[ws.length >> 1] : 0;
    let cap = Infinity;
    ws.forEach((w) => { if (w >= 0.6 * med) cap = Math.min(cap, w); });
    const least = (+g.getAttribute('data-pf-row') || 0) / zoom.z;
    if (cap === Infinity) g.style.removeProperty('--pf-fw');
    else g.style.setProperty('--pf-fw', 'min(100%, ' + Math.max(least, cap).toFixed(3) + 'px)');
  });
}
function frameAll() {
  frameRaf = 0;
  frames = frames.filter((F) => {
    if (F.el.isConnected) return true;
    if (frameRO) frameRO.unobserve(F.el);
    if (frameIO) frameIO.unobserve(F.el);
    return false;
  });
  frameCaps();
  if (host) host.classList.add('pf-still');
  frames.forEach(frameLayout);
  frames.forEach((F) => { if (F.shown && !!F.wide !== wideFile(F.el)) frameImage(F); });   // (the mode's edge crossed: the other file)
  if (host) { void host.offsetWidth; host.classList.remove('pf-still'); }
  if (frames.length) emit('frames');
}
export function layoutFrames() { if (!frameRaf) frameRaf = requestAnimationFrame(frameAll); }
function frameOf(node) { for (let i = 0; i < frames.length; i++) if (frames[i].el === node) return frames[i]; return null; }
export function mountFrames(rootEl = document) {
  host = document.getElementById('inner');
  if (!frameRO && 'ResizeObserver' in window) frameRO = new ResizeObserver(layoutFrames);
  if (!frameIO && 'IntersectionObserver' in window) {
    frameIO = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const F = frameOf(e.target);
        if (!F) return;
        F.near = true;
        if (F.el.classList.contains('pf-in')) frameShow(F);
        frameIO.unobserve(e.target);
      });
    }, { rootMargin: '800px 0px' });
  }
  const fresh = [...rootEl.querySelectorAll('.pf:not([data-pf])')];
  if (fresh.length) frameCaps();   // (the big-screen mode: each row's cap before its frames are first laid out)
  fresh.forEach((f) => {
    f.setAttribute('data-pf', '');
    const F = { el: f, host: f.closest('.pf-host') };
    frames.push(F);
    frameLayout(F);
    if (frameRO) frameRO.observe(f);
    if (frameIO) frameIO.observe(f);
  });
}
addEventListener('resize', layoutFrames);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutFrames);

/* a finger on a wide picture: dragged sideways, one to one, and it stays where it was left */
let panTouch = null, panNoClick = 0;
function panDown(e) {
  if (e.pointerType !== 'touch' || !e.isPrimary) return;
  const n = e.target && e.target.closest ? e.target.closest('.pf[data-pan="x"]') : null, F = n ? frameOf(n) : null;
  panTouch = F && F.over > 0 ? { F, id: e.pointerId, x: e.clientX, cx: F.cx, moved: false } : null;
}
function panDrag(e) {
  const S = panTouch;
  if (!S || e.pointerType !== 'touch' || e.pointerId !== S.id || !S.F.el.isConnected) return;
  const dx = e.clientX - S.x, F = S.F;
  if (!S.moved && Math.abs(dx) < 6) return;
  if (!S.moved) { S.moved = true; F.el.classList.add('pf-drag'); }
  F.cx = Math.max(-F.over, Math.min(0, Math.round(S.cx + dx * F.dpr)));
  F.frac = -F.cx / F.over;
  F.el.style.setProperty('--pf-x', (F.cx / F.dpr) + 'px');
}
function panUp(e) {
  if (!panTouch || e.pointerId !== panTouch.id) return;
  if (panTouch.moved) { panNoClick = e.timeStamp; panTouch.F.el.classList.remove('pf-drag'); }
  panTouch = null;
}
function panClick(e) {
  const t = panNoClick;
  panNoClick = 0;
  if (t && e.timeStamp - t < 350 && e.target.closest && e.target.closest('.pf')) { e.preventDefault(); e.stopPropagation(); }
}
/* in hand only once the pointer has moved on the host (nothing moves unless he does), or his own Tab put the
   focus there; a host that came under a resting pointer waits until the pointer has gone REST px */
const REST = 3;
let panHost = null, panKeyHost = null, panAt = null, panOn = null, panFrom = null, panTab = false;
function panHands() {
  frames.forEach((F) => {
    const h = !!F.host && (F.host === panHost || F.host === panKeyHost);
    if (h !== !!F.hand) { F.hand = h; frameFar(F); frameFilm(F); }
  });
}
function panWasOn(h, at) { return h.contains(document.elementFromPoint(at[3], at[4])); }
function panPoint(e) {
  const to = e.type === 'pointerout' ? e.relatedTarget : e.target, h = to && to.closest ? to.closest('.pf-host') : null;
  const seen = e.pointerType !== 'touch' && e.type !== 'pointerout', was = panAt;
  let moved = false, hold = panHost;
  if (seen) {
    const d = window.devicePixelRatio || 1;
    moved = !!was && was[2] === d && (Math.abs(e.screenX - was[0]) > 0.05 || Math.abs(e.screenY - was[1]) > 0.05);
    panAt = [e.screenX, e.screenY, d, e.clientX, e.clientY];
    if (panFrom && was && was[2] !== d) panFrom = panAt;
  }
  if (h !== panOn) {
    panOn = seen ? h : null; hold = null;
    panFrom = !panOn ? null : !moved ? panAt : panWasOn(h, was) ? was : null;
  }
  if (panOn && hold !== panOn) {
    const dx = panFrom ? e.screenX - panFrom[0] : 0, dy = panFrom ? e.screenY - panFrom[1] : 0;
    if (!panFrom || (moved && dx * dx + dy * dy >= REST * REST)) hold = panOn;
  }
  if (hold !== panHost) { panHost = hold; panHands(); }
}
function panKey(e) {
  const t = e.type === 'focusin' ? e.target : document.hasFocus() ? null : document.activeElement, onIt = t && t.closest ? t.closest('.pf-host') : null;
  const h = onIt && (onIt === panKeyHost || (panTab && t.matches(':focus-visible'))) ? onIt : null;
  if (h !== panKeyHost) { panKeyHost = h; panHands(); }
}
function panTabKey(e) {
  panTab = e.type === 'keydown' && e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey;
  if (panPressed) panPress(e);   // (a press whose end never came, taken by a menu: the stop is back before the key acts)
}
/* a frame that is the keyboard's stop (frameLayout) is not the mouse's: a press on it would take the focus with it,
   and the next key would draw the keyboard's mark round a picture at rest. So while a button or a finger is down
   on it the frame is no stop, and the press lands as on any other picture: on the page */
function panPress(e) {
  const was = panPressed;
  const f = (e.type === 'pointerdown' || e.type === 'mousedown') && e.target && e.target.closest ? e.target.closest('.pf') : null;
  const F = f ? frameOf(f) : null;
  panPressed = F && F.stop ? F : null;
  if (was && was !== panPressed) frameStop(was);
  if (panPressed && panPressed !== was) frameStop(panPressed);
}
if (PAN) {
  document.addEventListener('pointerdown', panDown, { passive: true });
  document.addEventListener('pointermove', panDrag, { passive: true });
  document.addEventListener('pointerup', panUp, { passive: true });
  document.addEventListener('pointercancel', panUp, { passive: true });
  document.addEventListener('click', panClick, true);
  document.addEventListener('pointermove', panPoint, { passive: true });
  document.addEventListener('pointerover', panPoint, { passive: true });
  document.addEventListener('pointerout', panPoint, { passive: true });
  document.addEventListener('focusin', panKey);
  document.addEventListener('focusout', panKey);
  document.addEventListener('keydown', panTabKey, true);
  document.addEventListener('keyup', panTabKey, true);
  addEventListener('blur', panTabKey);
  ['pointerdown', 'mousedown', 'pointerup', 'pointercancel', 'mouseup'].forEach((ty) => document.addEventListener(ty, panPress, { passive: true }));
}
