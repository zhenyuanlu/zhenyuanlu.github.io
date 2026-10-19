// /see/'s behaviour (the draft v2ac's see.js, after its markup, which pages/see.astro writes): the wall hung in its
// columns (three on a desk, two on a phone), dealt in turn as ArtLife deals them, the middle column (desk) or the
// right one (phone) starting lower; each photograph at its share of the column, never past its own pixels counted in
// the screen's device pixels (on a phone, one nearer the column than the narrowest fills it, and each stands at its
// column's left edge: hang()); slowly appearing as each comes into view (a 1s fade while the place settles 8px, those
// in view one after another, 140ms apart). The filter takes the wall down (150ms) and hangs it again (?kind= keeps
// it). A click opens the viewer on the paper: the photograph as large as fits, its caption bottom left, ← → bottom
// right; the arrows, the keys or a swipe step through the filter's photographs; Escape, close, a click or a swipe
// down closes back to its place; two fingers pinch-zoom (view.js, which a photograph's own page shares). The address
// follows the open photograph (its own page, /see/<name>/, replaceState, the filter's ?kind= kept), and so does the
// document's title; both come back to the wall's when it closes. On a touch phone the open viewer is a step of its
// own in the history (pushState): the phone's Back closes it and stays on the wall, Forward opens that photograph
// again, and close, a swipe down or a tap on the paper go back through that step. Arriving at /see/#<name> (a
// photograph's page's "close") brings that photograph into view, below the sticky header, and gives it the focus. A
// ?kind= the wall has no filter for leaves the address. Reduced motion: everything at once. Should this script come
// later than see.css's 3s wait for it (the wall shown as the plain grid it is without script), the wall is hung at
// once, nothing faded out and in again.
import { on, reduced as isReduced } from '../hub.js';
import { clearHeader } from '../header.js';
import { fitPhoto, handOn } from './view.js';
import { arrowSvg } from '../../lib/arrows.mjs';
import { zoom } from '../wide.js';

const main = document.getElementById('ip');
const gal = main && main.querySelector('.s-gal');
if (gal) setup();

function dpr() { return window.devicePixelRatio || 1; }

function setup() {
  const reduced = isReduced(), EASE = 'cubic-bezier(.2, .7, .2, 1)';
  const fl = main.querySelector('.s-fl');
  const WALL = location.pathname;
  const all = [...gal.querySelectorAll('.s-it')].map((el, n) => {
    const w = +el.getAttribute('data-w') || 600, h = +el.getAttribute('data-h') || 900, img = el.querySelector('img'), title = (el.querySelector('.s-t') || {}).textContent || '';
    return {
      el, n, name: el.id, title, kind: el.getAttribute('data-kind') || '', w, h, r: w / h, f: Math.min(1, 0.6 + 0.4 * w / 600),
      avg: el.getAttribute('data-avg') || '#8a8580', fullOwn: el.getAttribute('data-full') || '', fullAvif: el.getAttribute('data-full-avif') || '', href: el.getAttribute('href'),
      /* (the viewer's picture is named by the title, as the draft's was, or by the YAML's own alt: the wall's picture
         has none, its link and caption saying the title already) */
      alt: el.getAttribute('data-alt') || title, cap: el.querySelector('.s-cap').innerHTML, ph: el.querySelector('.s-ph'), img, on: false,
    };
  });
  const FILTERS = fl ? [...fl.querySelectorAll('button[data-f]')].map((b) => b.getAttribute('data-f')) : ['all'];
  const asked = new URLSearchParams(location.search).get('kind');
  let filter = asked && FILTERS.includes(asked) ? asked : 'all';
  /* the document's title: the wall's, and while the viewer is open the photograph's, as its own page has it ("Huh ·
     Zhenyuan Lu": the head's words after this page's own) */
  const title0 = document.title, tail = title0.indexOf(' · ') >= 0 ? title0.slice(title0.indexOf(' · ')) : '';
  if (fl) fl.querySelectorAll('button[data-f]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === filter)));

  /* the address: a page of the wall's (a photograph's, or the wall's own with its filter), keeping what else it says */
  function addr(path, kind) {
    const u = new URL(path, location.href), q = new URLSearchParams(location.search);
    q.delete('kind');
    if (kind && kind !== 'all') q.set('kind', kind);
    u.search = q.toString(); u.hash = '';
    return u.pathname + u.search;
  }
  function swap(to) { try { history.replaceState(history.state, '', to); } catch (e) { /* fine */ } }

  /* ---------- the wall: dealt to the columns in turn, kept in the page in reading order ---------- */
  const off = document.createElement('div');   // the photographs the filter leaves out wait here, out of sight
  off.className = 's-off'; off.hidden = true;
  gal.after(off);
  function shown() { return all.filter((P) => filter === 'all' || P.kind === filter); }
  let lay = null, lastW = -1, lastD = dpr();
  /* how much lower a column starts, as a share of the column's width: the middle one of three, the right one of two
     (a phone's was 0.56 until the owner asked for its wall a little more even, 2026-10-18) */
  const STAGGER = { 3: [0, 0.3, 0], 2: [0, 0.35] };
  function gapOf(name) { return parseFloat(getComputedStyle(gal).getPropertyValue(name)) || 0; }
  function hang() {
    const W = gal.getBoundingClientRect().width, n = W >= 700 ? 3 : 2;
    const had = document.activeElement, keep = had && had.closest && had.closest('.s-it');   // moving a photograph drops focus
    lastW = gal.clientWidth; lastD = dpr();
    /* the columns share the wall's width, --s-gap apart; a column's whole pixels (cw) size its photographs, each at
       most its own pixels: its width over the screen's ratio, in CSS px */
    let gap = gapOf('--s-gap'), colW = (W - gap * (n - 1)) / n, cw = Math.round(colW);
    const d = lastD;
    all.forEach((P) => off.appendChild(P.el));
    const list = shown(), seen = [0, 0, 0];
    let wOf = (P) => Math.min(Math.floor(P.w / d), Math.round(cw * P.f));
    /* the big-screen mode (scripts/wide.js; the draft's see.js): a photograph grows with its column in the wider
       frame, but only as far as its own pixels on the screen itself (its width over the device px a page px holds:
       the screen's ratio times z, which a script reads as devicePixelRatio on a zoomed page), and it is never smaller
       than on the plain page (its width there, in the window's px). Where the files give out before the column does
       (the wall's 600px files on a 4K screen at 175%), the columns keep the width such a file fills and stand further
       apart, the outer two still on the frame's edges (styles/wide.css: --s-wall, the wall's own width there) */
    if (zoom && zoom.k > 1 && list.length && n > 1) {
      const z = zoom.z, real = zoom.dpr(), cw0 = Math.round((960 - gap * (n - 1)) / n), grow = wOf, full = Math.floor(600 / d);
      const plain = (P) => Math.min(Math.floor(P.w / real), Math.round(cw0 * P.f));   // (its width on the plain page, window px)
      wOf = (P) => Math.max(Math.floor(plain(P) / z), grow(P));
      if (colW > full) { colW = cw = Math.max(full, Math.floor(cw0 / z)); gap = (W - n * colW) / (n - 1); }
    }
    /* a phone's wall, two columns (the owner, 2026-10-18: "see里面的gallery有点过于没align好了，大小太过于层次不齐，可以稍微
       修正一点点", a little more aligned and even). On a 3x screen a 400px file stops at its own pixels (133px), short
       of its share, so the photographs came in three widths, and the narrower ones, against the outer edges, left
       the gap between the columns anywhere from 14 to 84px wide (390px screen). Here a photograph nearer the column's
       width than the wall's narrowest fills the column, as far as its own pixels go (Huh: 157px at 390 becomes 168,
       504 of its 506 device px), so the wall keeps two widths where its files allow; and every photograph stands at
       its column's left edge, where its caption starts, so each column has one straight left edge and only the right
       edges vary. (Where none of the second column's photographs fills it, a phone held sideways, that edge stands
       further right, until the widest meets the wall's right edge.) None is smaller than before, none past its
       pixels, every one whole */
    const phone = n === 2;
    if (phone && list.length) {
      const own = wOf, least = Math.min(...list.map(own));
      wOf = (P) => { const w = own(P), full = Math.min(Math.floor(P.w / d), cw); return full - w <= w - least ? full : w; };
    }
    list.forEach((P, k) => {   // in turn, as ArtLife deals them; into the page in reading order
      /* a photograph narrower than its column keeps a desk's outer edges: left in the first column, right in the
         last, and in the middle one alternately right and left (on a phone, left in both: above) */
      const c = k % n, narrow = wOf(P) < cw - 0.5;
      P.el.classList.toggle('s-r', !phone && narrow && (c === n - 1 || (c > 0 && seen[c]++ % 2 === 0)));
      P.el.style.width = wOf(P) + 'px';   // whole pixels, so its edges stay crisp
      gal.appendChild(P.el);
    });
    const w1 = phone ? Math.max(0, ...list.filter((P, k) => k % 2).map(wOf)) : cw;   // (a phone's second column's widest)
    lay = { n, colW, gap, list, top: STAGGER[n].map((s) => Math.round(cw * s)), x1: w1 && w1 < cw - 0.5 ? colW - w1 : 0 };
    place();
    gal.classList.add('s-hung');
    if (keep && keep.parentNode !== off) keep.focus({ preventScroll: true });
    if (ro) { ro.disconnect(); ro.observe(gal); list.forEach((P) => ro.observe(P.el)); }
  }
  /* each photograph in its column: the column's x (a narrower one against its right edge; a phone's second column
     further right where none of its photographs fills it), under the one before it in that column, --s-vgap below
     it; the wall as tall as its longest column */
  function place() {
    if (!lay) return;
    const vgap = gapOf('--s-vgap'), y = lay.top.slice();
    const hs = lay.list.map((P) => P.el.getBoundingClientRect().height);
    lay.list.forEach((P, k) => {
      const c = k % lay.n;
      let x = c * (lay.colW + lay.gap);
      if (P.el.classList.contains('s-r')) x += lay.colW - parseFloat(P.el.style.width);
      else if (c === 1 && lay.x1) x += lay.x1;
      P.el.style.left = x + 'px';
      P.el.style.top = y[c] + 'px';
      y[c] += hs[k] + vgap;
    });
    gal.style.height = Math.max(...y.map((v, c) => (v > lay.top[c] ? v - vgap : v))) + 'px';
  }
  /* a caption that wraps anew (a font arriving) or a wall that narrows (a scrollbar appearing) hangs it again, a frame
     later (never inside the observer, so it cannot loop) */
  let roRaf = 0;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => {
    if (roRaf) return;
    roRaf = requestAnimationFrame(() => {
      roRaf = 0;
      if (!gal.isConnected) return;
      if (gal.clientWidth !== lastW || dpr() !== lastD) { hang(); watch(); } else place();
    });
  }) : null;

  /* ---------- slowly, as each comes into view ---------- */
  let io = null, queue = [], qT = 0;
  function appear(P, delay) {
    if (P.on) return;
    P.on = true;
    // (the delay reaches the settle, the photograph's fade and its caption's alike: one variable, --d)
    const go = () => { if (P.el.isConnected) { P.el.style.setProperty('--d', (delay || 0) + 'ms'); P.el.classList.add('in'); } };
    if (P.img.complete && P.img.naturalWidth) go();
    else {   // wait for the file, but not for long: then its tint shows and the photograph follows
      const t = setTimeout(go, 600);
      P.img.addEventListener('load', () => { clearTimeout(t); go(); }, { once: true });
    }
  }
  function flush() {
    qT = 0;
    queue.sort((a, b) => a.top - b.top || a.left - b.left);
    queue.forEach((q, k) => appear(q.P, k * 140));
    queue = [];
  }
  function watch() {
    if (io) io.disconnect();
    if (reduced || !('IntersectionObserver' in window)) { shown().forEach((P) => { P.el.classList.add('in', 'now'); P.on = true; }); return; }
    io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const P = all[+e.target.getAttribute('data-n')];
        if (!P.on) queue.push({ P, top: e.boundingClientRect.top, left: e.boundingClientRect.left });
      });
      if (queue.length && !qT) qT = setTimeout(flush, 30);
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    shown().forEach((P) => { if (!P.on) io.observe(P.el); });
  }
  /* arriving at a photograph (/see/#<name>, its page's close): hung, it comes into view below the sticky header, at
     once, with the focus */
  function arrive() {
    let name = location.hash.slice(1);
    try { name = decodeURIComponent(name); } catch (e) { /* (a broken escape, /see/#%: as it is) */ }
    const P = name && all.find((x) => x.name === name);
    if (!P || P.el.parentNode === off) return;
    const rb = P.ph.getBoundingClientRect(), hd = document.querySelector('.ih'), top = hd ? hd.getBoundingClientRect().bottom : 0;
    window.scrollBy(0, rb.top - top - Math.max(0, (window.innerHeight - top - rb.height) / 2));
    if (!P.on) { P.on = true; P.el.classList.add('in', 'now'); }
    P.el.focus({ preventScroll: true });
  }
  /* (see.css's wait: a wall this script comes to after 3s is in sight already, as its plain grid. Hung now, it stays
     in sight: every photograph as it is, none faded out to come in again) */
  if (getComputedStyle(gal).visibility === 'visible') all.forEach((P) => { P.on = true; P.el.classList.add('in', 'now'); });
  hang();
  watch();
  arrive();
  /* (a ?kind= the wall has no filter for: out of the address, the photograph named after the # kept) */
  if (asked && filter !== asked) swap(addr(WALL, filter) + location.hash);
  on('resize', () => {
    if (gal.clientWidth !== lastW || dpr() !== lastD) { hang(); watch(); }   // a new ratio: new caps
    if (S.open && S.big) { S.r = fit(S.list[S.k]); setBox(S.big, S.r); }
  });

  /* a filter takes the wall down and hangs it again */
  let swapT = 0;
  function setFilter(id) {
    if (id === filter) return;
    filter = id;
    fl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === id)));
    swap(addr(WALL, id));
    function rehang() {
      swapT = 0;
      clearTimeout(qT); qT = 0; queue = [];
      gal.classList.add('s-now');
      all.forEach((P) => { P.on = false; P.el.classList.remove('in', 'now'); P.el.style.removeProperty('--d'); });
      hang();
      void gal.offsetWidth;
      gal.classList.remove('s-out', 's-now');
      watch();
    }
    if (reduced) { hang(); watch(); return; }
    clearTimeout(swapT);
    gal.classList.add('s-out');
    swapT = setTimeout(rehang, 160);
  }
  if (fl) fl.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-f]');
    if (b) setFilter(b.getAttribute('data-f'));
  });

  /* ---------- the viewer ---------- */
  const view = document.createElement('div');
  view.className = 's-view';
  view.hidden = true;
  view.tabIndex = -1;
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-labelledby', 's-vcap');
  view.innerHTML = '<div class="s-paper"></div><div class="s-stage"></div>' +
    '<div class="s-bar">' +
      '<button class="s-x" type="button">close</button>' +
      '<p class="s-vcap" id="s-vcap"></p>' +
      '<p class="s-vnav"><button class="s-prev" type="button" aria-label="previous photograph">' + arrowSvg('l') + '</button>' +
      '<button class="s-next" type="button" aria-label="next photograph">' + arrowSvg('r') + '</button></p>' +
    '</div>';
  main.appendChild(view);
  const paper = view.querySelector('.s-paper'), stageEl = view.querySelector('.s-stage'), bar = view.querySelector('.s-bar');
  const capEl = view.querySelector('.s-vcap'), prevB = view.querySelector('.s-prev'), nextB = view.querySelector('.s-next'), xB = view.querySelector('.s-x');
  const S = { open: false, list: [], k: 0, big: null, r: null, busy: 0, own: false, back: 0 };
  /* a touch phone (under 1000px, nothing that hovers): the viewer opens as a step of its own in the history, marked
     zlView, so the phone's Back (iOS's swipe from the left edge, Android's key) closes it and the wall stays. Its steps
     replace that step's address, as on a desk. A desk, and a narrow window in a mouse's hand, never take this path:
     the wall's one entry follows the photograph (replaceState), as before */
  const mqTouch = window.matchMedia ? matchMedia('(max-width: 999px) and (hover: none)') : { matches: false };
  const atView = () => !!(history.state && history.state.zlView);   // the history stands on the viewer's own step

  /* as large as fits, never past its own pixels: its width and height over the screen's ratio, in CSS px */
  function fit(P) { return fitPhoto(P.w, P.h); }
  function setBox(el, r) { el.style.left = r.x + 'px'; el.style.top = r.y + 'px'; el.style.width = r.w + 'px'; el.style.height = r.h + 'px'; }
  /* the viewer's picture in the form the browser took for the wall: AVIF where its <picture> gave it the AVIF (the
     wall's own picture, data-full-avif), else the other (data-full). Decided as the viewer first opens, from the
     photograph clicked (in view, so its picture is in), else from any wall picture the browser has taken by then; at
     setup a wall picture not yet loaded said nothing, and the viewer took the heavier form (the review, 2026-10-17) */
  let avif = null;
  function fullOf(P) {
    if (avif == null) {
      const q = [P].concat(all).find((x) => x.img && x.img.currentSrc);
      if (q) avif = /\.avif(\?|$)/.test(q.img.currentSrc);
    }
    return (avif && P.fullAvif) || P.fullOwn || (P.img && P.img.currentSrc) || '';
  }
  function makeBig(P) {
    const el = document.createElement('img');
    el.className = 's-big';
    el.src = fullOf(P); el.alt = P.alt; el.decoding = 'async';
    el.style.setProperty('--avg', P.avg);
    const r = fit(P);
    setBox(el, r);
    return { el, r };
  }
  function from(r0, r) { return 'translate(' + (r0.left - r.x) + 'px, ' + (r0.top - r.y) + 'px) scale(' + (r0.width / r.w) + ', ' + (r0.height / r.h) + ')'; }
  function hung(P) { return P.el.parentNode !== off; }
  function texts() {
    const P = S.list[S.k], had = document.activeElement;
    capEl.innerHTML = P.cap;
    prevB.disabled = S.k === 0;
    nextB.disabled = S.k === S.list.length - 1;
    // a button that has just been disabled lets its focus fall to the page: hand it to the other arrow, or the viewer
    if (had && had.disabled) (had === nextB && !prevB.disabled ? prevB : had === prevB && !nextB.disabled ? nextB : view).focus({ preventScroll: true });
    swap(addr(P.href, filter));
    document.title = P.title + tail;
  }
  function open(P, still, again) {
    if (S.open || S.busy || !P) return;
    S.list = shown();
    if (S.list.indexOf(P) < 0) S.list = all;
    S.k = S.list.indexOf(P);
    S.open = true;
    view.hidden = false;
    const B = makeBig(P);
    stageEl.appendChild(B.el);
    S.big = B.el; S.r = B.r;
    /* (a touch phone: the viewer's own step in the history, pushed before its address and title are set on it;
       opened again by Forward, it stands on that step already) */
    S.own = !!again;
    if (!again && mqTouch.matches) { try { history.pushState({ zlView: 1 }, '', addr(P.href, filter)); S.own = true; } catch (e) { /* the wall's entry, as on a desk */ } }
    texts();
    const r0 = hung(P) && P.on ? P.ph.getBoundingClientRect() : null;
    P.ph.classList.add('s-away');
    if (!reduced && !still) {
      if (r0 && r0.width) B.el.animate([{ transform: from(r0, B.r) }, { transform: 'none' }], { duration: 160, easing: EASE });
      paper.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: EASE });
      bar.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: EASE });
    }
    view.focus({ preventScroll: true });
  }
  /* close: on the viewer's own step the history goes back through it, and that step back closes the viewer (popstate,
     below), one step however many taps; elsewhere it closes at once */
  function close() {
    if (!S.open || S.busy) return;
    if (S.own && atView()) {
      if (!S.back) { S.back = setTimeout(() => { S.back = 0; }, 1000); history.back(); }
      return;
    }
    shut();
  }
  function shut() {
    if (!S.open || S.busy) return;
    const P = S.list[S.k], el = S.big, r = S.r, home = hung(P);
    if (home) {   // bring its photograph into view first, below the sticky header, so it can fly back to it
      const rb = P.ph.getBoundingClientRect(), hd = document.querySelector('.ih'), top = hd ? hd.getBoundingClientRect().bottom : 0;
      if (rb.top < top || rb.bottom > window.innerHeight) window.scrollBy(0, rb.top - top - Math.max(0, (window.innerHeight - top - rb.height) / 2));
      if (!P.on) { P.on = true; P.el.classList.add('in', 'now'); }
    }
    const r0 = home ? P.ph.getBoundingClientRect() : null;
    function done() {
      view.hidden = true;
      stageEl.textContent = '';
      all.forEach((x) => x.ph.classList.remove('s-away'));
      const own = S.own;
      S.open = false; S.busy = 0; S.big = null; S.own = false;
      /* (the wall's address on the wall's step; a Forward that came while it closed stands on the viewer's step,
         whose address stays, and opens its photograph again) */
      if (!own || !atView()) swap(addr(WALL, filter));
      document.title = title0;
      (home ? P.el : fl.querySelector('[aria-pressed="true"]')).focus({ preventScroll: true });
      if (own && atView()) follow();
    }
    if (reduced) { done(); return; }
    S.busy = 1;
    if (r0 && r0.width) el.animate([{ transform: 'none' }, { transform: from(r0, r) }], { duration: 140, easing: EASE, fill: 'forwards' });
    else el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: EASE, fill: 'forwards' });
    paper.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: EASE, fill: 'forwards' });
    const a = bar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: EASE, fill: 'forwards' });
    a.onfinish = () => {
      done();
      paper.getAnimations().forEach((x) => x.cancel());
      bar.getAnimations().forEach((x) => x.cancel());
    };
  }
  function step(dk) {
    if (!S.open || S.busy) return;
    const j = S.k + dk;
    if (j < 0 || j >= S.list.length) return;
    const old = S.big;
    S.list[S.k].ph.classList.remove('s-away');
    S.k = j;
    S.list[j].ph.classList.add('s-away');
    const B = makeBig(S.list[j]);
    stageEl.appendChild(B.el);
    S.big = B.el; S.r = B.r;
    texts();
    if (reduced) { if (old) old.remove(); return; }
    B.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: EASE });
    if (old) { const a = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: EASE, fill: 'forwards' }); a.onfinish = () => old.remove(); }
  }
  /* a photograph is a link to its own page: a plain click opens the viewer here instead (a click that asks for a new
     tab or window still goes there) */
  gal.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.s-it');
    if (!b || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(all[+b.getAttribute('data-n')]);
  });
  prevB.addEventListener('click', () => step(-1));
  nextB.addEventListener('click', () => step(1));
  xB.addEventListener('click', close);
  /* the history's steps on a touch phone: Back off the viewer's own step closes it, with no step more; Forward onto it
     opens its photograph again, as it was left. A frame later, once the browser has put the wall's scroll back, so a
     photograph flies home to where it stands. (A desk has no such step: nothing here acts there) */
  function follow() {
    if (S.busy) return;   // (closing: done() follows the history as it ends)
    if (S.open) { if (S.own && !atView()) shut(); return; }
    if (!atView()) return;
    const P = all.find((x) => new URL(x.href, location.href).pathname === location.pathname);
    if (P) open(P, true, true);
    else try { history.replaceState(null, '', addr(WALL, filter)); } catch (e) { /* fine */ }
  }
  addEventListener('popstate', () => { clearTimeout(S.back); S.back = 0; requestAnimationFrame(follow); });
  /* the keys are heard on the document while the viewer is open, so they work wherever the focus has fallen */
  function onKey(e) {
    if (!S.open) return;
    const k = e.key;
    if (k === 'Escape') { e.preventDefault(); close(); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); step(-1); return; }
    if (k === 'ArrowRight') { e.preventDefault(); step(1); return; }
    if (k === 'Tab') {   // focus stays in the viewer
      const f = [xB, prevB, nextB].filter((x) => !x.disabled);
      const at = f.indexOf(document.activeElement);
      e.preventDefault();
      f[at < 0 ? (e.shiftKey ? f.length - 1 : 0) : (at + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      return;
    }
    // nothing scrolls the page behind it: the keys that would are held back (a space still presses a button)
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(k)) { e.preventDefault(); return; }
    if (/^( |Spacebar)$/.test(k) && !(e.target.closest && e.target.closest('button'))) e.preventDefault();
  }
  document.addEventListener('keydown', onKey, true);
  /* (the viewer's own focus is never under the header: it stands over the page) */
  main.addEventListener('focusin', (e) => { if (!(e.target.closest && e.target.closest('.s-view'))) clearHeader(e); });
  /* nothing scrolls the page under the viewer; a swipe steps, a swipe down closes, a plain click anywhere but the
     buttons closes; two fingers pinch-zoom (view.js) */
  handOn(view, { skip: 'button', step, close });
}
