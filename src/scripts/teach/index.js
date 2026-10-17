// /teach/'s behaviour (the draft v2ac's teach.js, after its markup, which pages/teach.astro writes): the tallies and
// the covers painted on whole device pixels in the stage's colours (scripts/teach/art.js draws them), one course in
// hand (on a desk told in the margin, on a phone open under its row), a book in hand, and the dissolve between grey
// line art and colour. A row is in hand while pointed at (a moment's rest), or while its link has the focus; the
// running term's course is in hand at first, else the first course on a desk, and nothing is open on a phone.
// Red, the page's one red, only for a term running today (Boston's day, or ?today=YYYY-MM-DD: scripts/today.js).
import { on, phone, reduced, tok } from '../hub.js';
import { clearHeader } from '../header.js';
import { todayOf } from '../today.js';
import { CELL, DUR, INTENT, coverOf, drawThing, drawTally, parseSem, ranks, running, tallySize } from './art.js';

const sec = document.querySelector('.t-sec');
if (sec) setup();

function dpr() { return window.devicePixelRatio || 1; }
function stage() { return document.documentElement.getAttribute('data-stage') || 'day'; }

/* ---------- a small pixel painter: whole cells on whole device pixels, repainted for the stage and the dpr; the
   server's drawing gives its place to the canvas ---------- */
function Pix(host, dims, cell, draw) {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  const old = host.querySelector('svg.t-px');
  if (old) old.replaceWith(cv); else host.appendChild(cv);
  const P = { cv };
  P.paint = function () {
    const d = dims(), w = d[0], h = d[1], cd = Math.max(1, Math.round(cell * dpr())), c = cv.getContext('2d');
    if (cv.width !== w * cd || cv.height !== h * cd) { cv.width = w * cd; cv.height = h * cd; }
    cv.style.width = (w * cd / dpr()) + 'px'; cv.style.height = (h * cd / dpr()) + 'px';
    c.clearRect(0, 0, cv.width, cv.height);
    draw((x, y, col) => { c.fillStyle = col; c.fillRect(x * cd, y * cd, cd, cd); }, tok(), stage());
  };
  P.paint();
  return P;
}

function setup() {
  const t = todayOf(location.search);
  const items = [...sec.querySelectorAll('.t-c')].map((li) => {
    const code = li.getAttribute('data-code') || '', hue = li.getAttribute('data-hue') || '#888888';
    const sems = (li.getAttribute('data-terms') || '').split('|').map(parseSem).filter(Boolean);
    const n = sems.length, red = sems.map((s) => running(s, t));
    const it = { li, row: li.querySelector('.t-row'), tog: li.querySelector('.t-hang'), a: li.querySelector('.t-a'), p: 0, raf: 0, rank: ranks(code, n), now: red.some(Boolean) };
    // (a term running today: the course says so to a screen reader too)
    if (it.now && it.a && !it.a.querySelector('.t-vh')) { const s = document.createElement('span'); s.className = 't-vh'; s.textContent = ', teaching now'; it.a.appendChild(s); }
    it.pix = Pix(it.tog, () => tallySize(n), CELL, (put, T, st) => drawTally(put, T, st, n, hue, it.rank, it.p, red));
    return it;
  });
  li0Off();
  /* (the server marked its first course for a reader without script: from here the page says which is in hand) */
  function li0Off() { sec.querySelectorAll('.t-c0').forEach((li) => li.classList.remove('t-c0')); }
  /* the dissolve: the share in colour eases to 1 (or back to 0) in DUR ms (less from part way), fast at first so the
     first pixels come on the first frame; reduced motion swaps at once */
  function fade(o, to, instant) {
    cancelAnimationFrame(o.raf);
    if (instant || reduced()) { if (o.p !== to) { o.p = to; o.pix.paint(); } return; }
    if (o.p === to) return;
    const p0 = o.p, d = DUR * Math.abs(to - p0);
    let t0 = 0;
    o.raf = requestAnimationFrame(function f(now) {
      if (!t0) t0 = now - 16;
      const k = Math.min(1, (now - t0) / d), e = k * (2 - k);
      o.p = k < 1 ? p0 + (to - p0) * e : to;
      o.pix.paint();
      if (k < 1) o.raf = requestAnimationFrame(f);
    });
  }
  /* one course in hand: on a desk it is told in the margin, on a phone it opens under its row */
  let mode = null, cur = null, intent = 0;
  const run = items.findIndex((it) => it.now);
  function drop(it, instant) {
    if (!it) return;
    it.li.classList.remove('on'); it.tog.setAttribute('aria-expanded', 'false'); fade(it, 0, instant);
  }
  function hold(it, instant) {
    if (cur === it) return;
    drop(cur, instant);
    cur = it;
    if (!it) return;
    it.li.classList.add('on'); it.tog.setAttribute('aria-expanded', 'true');
    fade(it, 1, instant);
  }
  function fit() {
    if (mode !== 'desk') { sec.style.minHeight = ''; return; }
    let max = 0;
    items.forEach((it) => { max = Math.max(max, it.li.querySelector('.t-d').offsetHeight); });
    sec.style.minHeight = max + 'px';
  }
  function setMode() {
    const m = phone() ? 'phone' : 'desk';
    if (m === mode) return;
    mode = m;
    sec.setAttribute('data-mode', m);
    hold(null, true);
    /* the running term's course is in hand at first (on a phone it opens); otherwise the first, on a desk only */
    if (run >= 0) hold(items[run], true);
    else if (m === 'desk' && items[0]) hold(items[0], true);
  }
  /* a pointer sweeping down the rows takes only the row it rests on, so the margin does not flicker; the link's focus
     takes its row (on a phone too: it opens under it); a click on the row beside the link takes it (a phone: opens or
     closes it), while one on the link only follows it */
  items.forEach((it) => {
    it.row.addEventListener('pointerenter', (e) => {
      if (mode !== 'desk' || e.pointerType !== 'mouse') return;
      clearTimeout(intent);
      intent = setTimeout(() => hold(it), INTENT);
    });
    it.row.addEventListener('pointerleave', () => clearTimeout(intent));
    if (it.a) it.a.addEventListener('focus', () => hold(it));
    it.row.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('a')) { if (mode === 'desk') hold(it); return; }
      if (mode === 'desk') hold(it); else hold(cur === it ? null : it);
    });
  });

  /* ---------- the covers: line art at rest; the book in hand dissolves into its colour, as a tally does, and the
     point stands before its title (teach.css); let go, it dissolves back ---------- */
  const covers = [...sec.querySelectorAll('.t-bk')].map((li) => {
    const Th = coverOf(li.getAttribute('data-title') || '');
    const o = { li, p: 0, raf: 0 };
    o.pix = Pix(li.querySelector('.t-hang'), () => [Th.w, Th.h], CELL, (put, T, st) => drawThing(Th, o.p, put, T, st));
    function onIt() { if (li.classList.contains('on')) return; li.classList.add('on'); fade(o, 1); }
    function off() {
      if (li.contains(document.activeElement) || li.matches(':hover')) return;
      li.classList.remove('on'); fade(o, 0);
    }
    li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') onIt(); });
    li.addEventListener('pointerleave', () => { setTimeout(off, 0); });
    li.addEventListener('focusin', onIt);
    li.addEventListener('focusout', () => { setTimeout(off, 0); });
    return o;
  });

  /* ---------- crisp: canvases on whole device pixels, moved in layout (position: relative), not with a transform (at
     150% a compositor samples a canvas moved by a third of a pixel half a pixel off) ---------- */
  const all = items.map((it) => it.pix).concat(covers.map((o) => o.pix));
  function snapCv(cv) {
    cv.style.left = cv.style.top = '';
    if (!cv.isConnected) return;
    const d = dpr(), r = cv.getBoundingClientRect(), x = r.left + window.scrollX, y = r.top + window.scrollY;
    const dx = (Math.round(x * d) - x * d) / d, dy = (Math.round(y * d) - y * d) / d;
    if (Math.abs(dx) > 1e-3) cv.style.left = dx.toFixed(4) + 'px';
    if (Math.abs(dy) > 1e-3) cv.style.top = dy.toFixed(4) + 'px';
  }
  function snapAll() { all.forEach((P) => snapCv(P.cv)); }
  let lastDpr = dpr(), mq = null;
  function redpr() {
    if (dpr() === lastDpr || !sec.isConnected) return;
    lastDpr = dpr();
    all.forEach((P) => P.paint()); fit(); snapAll();
  }
  /* a zoom fires resize; a window moved to another screen may only change the resolution */
  function armDpr() {
    if (!window.matchMedia || !sec.isConnected) return;
    mq = matchMedia('(resolution: ' + dpr() + 'dppx)');
    mq.addEventListener('change', onDpr, { once: true });
  }
  function onDpr() { redpr(); armDpr(); }
  setMode(); armDpr();
  (document.getElementById('ip') || sec).addEventListener('focusin', clearHeader);
  requestAnimationFrame(() => { fit(); snapAll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (sec.isConnected) { fit(); snapAll(); } });
  on('stage', () => { all.forEach((P) => P.paint()); });
  on('resize', () => { redpr(); setMode(); fit(); snapAll(); });
}

