// The fader in the header (the draft's home script, "the crossfader"): day, dusk, night on one slider, the only
// thing that ever changes the light. Its three stops are minimal pixel glyphs (a sun, the sun setting over its
// horizon, a moon), the stage's own in its colour, the others grey, one under the pointer in its colour; drawn on
// whole device pixels at their 100% size on every screen (fSize). The place is kept in localStorage ('zl-fade');
// the early script (early.js) has already applied it before the first paint.
import { reduced } from './hub.js';
import { zoom } from './wide.js';

const root = document.documentElement;
/* the big-screen mode (scripts/wide.js; with ?wide=off, and wherever the frame stays 960px, zoom.k is not over 1 and
   all of this is as it was): the fader never grows on a big screen. It stands in a box zoomed back to the window's px
   (styles/wide.css: in the header, and on the home), so its cells are worked out from the screen's own ratio, not the
   zoomed page's (the draft's home script, fSize), and its glyphs and its line are put on the device grid in its own
   px, the window's, by the browser's own rects: so they stand exactly where the plain page puts them (measured in the
   zoomed page's px, as the draft did, a glyph on a half device pixel rounded the other way and stood a device pixel
   off: the dusk sun, at 100%) */
const wideOn = () => !!(zoom && zoom.k > 1);
const screenRatio = () => (wideOn() ? zoom.dpr() : window.devicePixelRatio || 1);
const rectOf = (el) => (wideOn() ? zoom.rawRect(el) : el.getBoundingClientRect());
const F = window.__fade;
const box = document.querySelector('.fader');
const fader = box && box.querySelector('input');

function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function cssRGB(v, fb) {
  let m; v = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return rgb(v);
  if ((m = v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/))) return [+m[1], +m[2], +m[3]];
  return fb;
}
function put(D, k, c, a) { const i = k * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = a; }

if (F && fader) {
  let fv = F.v, xfT = 0, stage = F.stage(fv);
  let fcell = 2;
  const fstops = [];
  const FSTOP = {
    day: { col: { day: '#f2b33d', dusk: '#efa73a', night: '#ffc95a' },
      rows: ['...###...', '.#######.', '.#######.', '#########', '#########', '#########', '.#######.', '.#######.', '...###...'] },
    dusk: { col: { day: '#e8763a', dusk: '#e2693a', night: '#f4803f' },
      rows: ['....###....', '..#######..', '..#######..', '.#########.', '...........', 'hhhhhhhhhhh'] },
    night: { col: { day: '#d4ac4c', dusk: '#c9a248', night: '#efdc9c' },
      rows: ['....#......', '..##.......', '.###.......', '.##........', '####.......', '####.......', '#####......', '.#####.....', '.#########.', '..#######..', '...#####...'] },
  };
  // the grey the stops are drawn in: the stage's own, or, during the cut's 200ms crossfade, the paper's grey as it
  // moves (xfRun), frame by frame, so no stop is left a stage behind the paper (the draft's home: xfRun, tokC)
  let live = null;
  const grey = () => live || rgb(F.colours(fv).grey);
  let xfRaf = 0;
  function xfRun() {
    const t0 = performance.now();
    cancelAnimationFrame(xfRaf);
    xfRaf = requestAnimationFrame(function f(now) {
      const going = now - t0 < 260;
      live = going ? cssRGB(getComputedStyle(root).getPropertyValue('--grey'), rgb(F.colours(fv).grey)) : null;
      fstops.forEach(fDraw);
      xfRaf = going ? requestAnimationFrame(f) : 0;
    });
  }
  function setFade(v, how) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    const flip = (v >= 67) !== (fv >= 67), sg = F.stage(v);
    fv = v;
    fader.value = String(v);
    fader.setAttribute('aria-valuetext', sg);
    if (flip && !reduced()) {   // the cut, dusk to night: paper and ink crossfade together, 200ms
      root.classList.add('xf');
      clearTimeout(xfT);
      xfT = setTimeout(() => root.classList.remove('xf'), 240);
    }
    F.apply(v);
    if (how === 'save') { try { localStorage.setItem('zl-fade', String(v)); } catch (e) { /* no storage: the light holds for this page */ } }
    if (sg !== stage) { stage = sg; fstops.forEach(fDraw); }
    else fstops.forEach(fDraw);
    try { document.dispatchEvent(new CustomEvent('zl:stage', { detail: { v, stage } })); } catch (e) { /* old browser */ }
    if (flip && !reduced()) xfRun();
  }
  fader.value = String(fv);
  fader.setAttribute('aria-valuetext', stage);
  fader.addEventListener('input', () => setFade(+fader.value, 'save'));
  fader.addEventListener('keydown', (e) => {
    const k = e.key, d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 25, PageDown: -25 }[k];
    const v = k === 'Home' ? 0 : k === 'End' ? 100 : d !== undefined ? fv + d : null;
    if (v === null) return;
    e.preventDefault();
    if (v !== fv) setFade(v, 'save');
  });
  box.querySelectorAll('.fw').forEach((b) => b.addEventListener('click', () => setFade(+b.getAttribute('data-to'), 'save')));
  // another tab moved the light: follow it
  addEventListener('storage', (e) => { if (e.key === 'zl-fade' && e.newValue != null && isFinite(+e.newValue)) setFade(+e.newValue); });

  box.querySelectorAll('.fw').forEach((b) => {
    const id = b.getAttribute('data-stop'), I = FSTOP[id], cv = b.querySelector('canvas');
    if (!I || !cv) return;
    const rows = I.rows, col = {};
    Object.keys(I.col).forEach((sg) => { col[sg] = rgb(I.col[sg]); });
    const S = { id, b, cv, ctx: cv.getContext('2d'), rows, col, w: rows[0].length, h: rows.length, hov: false, foc: false };
    cv.width = S.w; cv.height = S.h;
    b.style.setProperty('--iw', S.w); b.style.setProperty('--ih', S.h);
    S.img = S.ctx.createImageData(S.w, S.h);
    b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') { S.hov = true; fDraw(S); } });
    b.addEventListener('pointerleave', () => { if (S.hov) { S.hov = false; fDraw(S); } });
    b.addEventListener('focus', () => { S.foc = b.matches(':focus-visible'); fDraw(S); });
    b.addEventListener('blur', () => { S.foc = false; fDraw(S); });
    fstops.push(S);
  });
  function fDraw(S) {
    const on = S.id === stage || S.hov || S.foc, g = grey(), c = on ? S.col[stage] : g, D = S.img.data;
    const h = on ? cssRGB(F.colours(fv).line, g) : g;
    D.fill(0);
    for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) {
      const k = S.rows[j].charAt(i);
      if (k !== '.') put(D, j * S.w + i, k === 'h' ? h : c, 255);
    }
    S.ctx.putImageData(S.img, 0, 0);
  }
  /* the same three shapes at any number of cells (the hand's drawings are exact geometry, to the cell) */
  const fRep = (ch, n) => new Array(n + 1).join(ch);
  function fSun(n) {
    const r = n * 4.4 / 9, c = n / 2, out = [];
    for (let y = 0; y < n; y++) { let s = ''; for (let x = 0; x < n; x++) s += Math.sqrt((x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2) <= r ? '#' : '.'; out.push(s); }
    return out;
  }
  function fDusk(n, m) {
    const k = n / 9, sun = fSun(n), h = Math.round(6 * k), out = [];
    for (let y = 0; y < h; y++) {
      const yc = (y + 0.5) / k;
      out.push(yc >= 5 ? fRep('h', n + 2 * m) : yc >= 4 ? fRep('.', n + 2 * m) : fRep('.', m) + sun[y] + fRep('.', m));
    }
    return out;
  }
  function fMoon(n) {
    const k = n / 11, out = [];
    for (let y = 0; y < n; y++) {
      let s = '';
      for (let x = 0; x < n; x++) {
        const px = (x + 0.5) / k, py = (y + 0.5) / k;
        s += Math.sqrt((px - 5.55) ** 2 + (py - 5.65) ** 2) <= 5.35 && Math.sqrt((px - 8.15) ** 2 + (py - 3.5) ** 2) > 4.65 && (px <= 8.15 || py >= 8) ? '#' : '.';
      }
      out.push(s);
    }
    return out;
  }
  /* the slider's line: the whole device pixels nearest 1 CSS px thick, on the device grid */
  function fTrack() {
    const dpr = screenRatio();
    const r = rectOf(fader);
    if (!r.width) return;
    const x0 = r.left * dpr, y0 = r.top * dpr, t = Math.max(1, Math.round(dpr));   // (device px: the slider's corner)
    const x1 = Math.round(x0 + 12 * dpr), x2 = Math.round(x0 + 60 * dpr), y1 = Math.round(y0 + 24.5 * dpr - t / 2);
    box.style.setProperty('--ftx', (x1 - x0) / dpr + 'px'); box.style.setProperty('--ftw', (x2 - x1) / dpr + 'px'); box.style.setProperty('--fty', (y1 - y0) / dpr + 'px');
  }
  let fplan = '';
  function fSize() {
    const dpr = screenRatio();
    const u = Math.max(1, Math.floor(dpr + 1e-6)), c = Math.max(1, dpr / u);
    const ns = Math.max(9, Math.round(9 * c - 1e-6)), nm = Math.max(11, Math.round(11 * c - 1e-6)), m = Math.max(1, Math.round((11 * c - ns) / 2 - 1e-6));
    fcell = u / dpr;
    box.style.setProperty('--fc', Math.round(fcell * 1e6) / 1e6 + 'px');
    box.style.setProperty('--f1', Math.max(1, Math.round(dpr)) / dpr + 'px');
    box.style.setProperty('--f5', Math.max(1, Math.round(5 * dpr)) / dpr + 'px');
    if (fplan === ns + ' ' + nm + ' ' + m) return;
    fplan = ns + ' ' + nm + ' ' + m;
    fstops.forEach((S) => {
      const hand = FSTOP[S.id].rows;
      S.rows = S.id === 'night' ? (nm === 11 ? hand : fMoon(nm)) : ns === 9 ? hand : S.id === 'dusk' ? fDusk(ns, m) : fSun(ns);
      S.w = S.rows[0].length; S.h = S.rows.length;
      S.cv.width = S.w; S.cv.height = S.h;
      S.b.style.setProperty('--iw', S.w); S.b.style.setProperty('--ih', S.h);
      S.img = S.ctx.createImageData(S.w, S.h);
      fDraw(S);
    });
  }
  /* its glyphs on the device grid: by their own place (a relative offset), as the draft's header does */
  function snapFader() {
    const dpr = screenRatio();
    /* (the big-screen mode: the setting sun's place over the line's middle, its sheet's calc(50% - its half width -
       2px), is written as one length. In a box zoomed back to the window's px, a hair over 1 / z, the browser took
       that difference a 64th of a px short of the plain page's, so at 100% its half pixel rounded the other way and
       the sun stood a device pixel left of where the plain page puts it; one length is cut down exactly as there.
       The line's width is read back a hair short too, 71.9999px: taken to the 64th of a px the browser lays out in) */
    const sun = box.querySelector('.fw.fd'), line = sun && sun.parentElement, S = fstops.find((x) => x.id === 'dusk');
    if (sun) sun.style.left = '';
    if (sun && line && S && wideOn()) {
      const lw = Math.round(parseFloat(getComputedStyle(line).width) * 64) / 64, fc = Math.round(fcell * 1e6) / 1e6;
      sun.style.left = (lw / 2 - S.w * fc / 2 - 2) + 'px';
    }
    box.querySelectorAll('canvas').forEach((cv) => {
      const s = cv.style;
      s.position = 'relative'; s.left = s.top = '0px';
      const b = rectOf(cv);
      s.left = (Math.round(b.left * dpr) - b.left * dpr) / dpr + 'px'; s.top = (Math.round(b.top * dpr) - b.top * dpr) / dpr + 'px';
    });
    fTrack();
  }
  function layout() { fSize(); snapFader(); }
  layout();
  fstops.forEach(fDraw);
  addEventListener('resize', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(layout));
  // a page brought back from the cache (Back) shows the light another tab may have set since; and so does a page made
  // ready before he came (a prerender, components/DocHead.astro's speculation rules), as he arrives: the light was
  // read when it was made, and he may have moved it since
  const again = () => {
    let s = null;
    try { s = localStorage.getItem('zl-fade'); } catch (err) { /* none */ }
    if (s !== null && isFinite(+s) && +s !== fv) setFade(+s);
  };
  addEventListener('pageshow', (e) => { if (e.persisted) again(); });
  if (document.prerendering) document.addEventListener('prerenderingchange', again, { once: true });
}
