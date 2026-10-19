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
  let dk = null;   // a finger's fader (a touch phone only, below): its line, its thumb and where things stand
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
      if (dk) dPaint();
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
    if (dk) { dPaint(); dThumb(); }
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
    b.addEventListener('focus', () => { S.foc = b.matches(':focus-visible'); fDraw(S); if (dk) dPaint(); });
    b.addEventListener('blur', () => { S.foc = false; fDraw(S); if (dk) dPaint(); });
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
    box.querySelectorAll('.fw canvas').forEach((cv) => {   // (the stops' own: on a phone the line and thumb are placed below)
      const s = cv.style;
      s.position = 'relative'; s.left = s.top = '0px';
      const b = rectOf(cv);
      s.left = (Math.round(b.left * dpr) - b.left * dpr) / dpr + 'px'; s.top = (Math.round(b.top * dpr) - b.top * dpr) / dpr + 'px';
    });
    fTrack();
  }
  /* ---------- a finger's fader (a touch phone; styles/frame.css, the owner's design D, 2026-10-18): ●──⌓──☾, the
     three stops on one line in three equal cells of 48px, the setting sun's own horizon row the line itself. Every
     part asks the touch query first, at each event and at each layout (a resize, a turn of the phone, a pointer
     added): a desk, and a narrow window in a mouse's hand, never get any of it, and their fader is the one above.
     The glyphs' cells are one and a half of the desk's (round(1.5 x its cell) device px: 3 at 2x and 2.625x, 5 at
     3x), each glyph put on the device grid from the line's row; the line (one cell thick) and the thumb (2 x 9
     cells) are canvases of whole device pixels, painted in the stage's colours as the glyphs are */
  const tq = window.matchMedia ? matchMedia('(max-width: 999px) and (hover: none) and (pointer: coarse)') : null;
  const onTouch = () => !!(tq && tq.matches);
  let P = null, gT = 0, gl = false;
  function dLayout() {
    const dpr = screenRatio(), cd = Math.round(1.5 * Math.max(1, Math.floor(dpr + 1e-6)));
    if (!dk) {
      dk = {};
      ['tk', 'th'].forEach((k) => { const c = dk[k] = document.createElement('canvas'); c.className = 'f' + k; c.setAttribute('aria-hidden', 'true'); box.appendChild(c); });
      dk.th.hidden = true;
    }
    box.style.setProperty('--dc', cd / dpr + 'px');
    const b = rectOf(box), bx = b.left * dpr, by = b.top * dpr, yT = Math.round(by + 22 * dpr - cd / 2), at = [], px = (v) => v / dpr + 'px';
    // each glyph in its cell, on the line: the sun's and the moon's middle row on it, the setting sun's horizon row it
    fstops.forEach((S, i) => {
      const w = S.w * cd, l = Math.round(bx + (24 + 48 * i) * dpr - w / 2), t = yT - (i === 1 ? S.h - 1 : (S.h - 1) >> 1) * cd;
      const cs = S.cv.style, r = rectOf(S.cv);
      cs.left = px(l - r.left * dpr + (parseFloat(cs.left) || 0) * dpr); cs.top = px(t - r.top * dpr + (parseFloat(cs.top) || 0) * dpr);
      at[i] = [l, l + w];
    });
    const x1 = at[0][1] + 2 * cd, x2 = at[2][0] - 2 * cd, tw = 2 * cd, tk = dk.tk, th = dk.th;
    tk.width = x2 - x1; tk.height = cd; th.width = tw; th.height = 9 * cd;
    tk.style.cssText = 'left:' + px(x1 - bx) + ';top:' + px(yT - by) + ';width:' + px(x2 - x1) + ';height:' + px(cd);
    th.style.top = px(yT - 4 * cd - by); th.style.width = px(tw); th.style.height = px(9 * cd);
    // where the thumb may stand: the free line each side of the setting sun, a cell clear of each glyph
    Object.assign(dk, { dpr, bx, tw, c: at.map((a) => (a[0] + a[1]) / 2), L0: x1 + tw / 2, L1: at[1][0] - cd - tw / 2, R0: at[1][1] + cd + tw / 2, R1: x2 - tw / 2 });
    dPaint(); dThumb();
  }
  function dOff() {   // (no longer a touch phone: a tablet turned past 1000px, a mouse attached)
    if (!dk) return;
    dk.tk.remove(); dk.th.remove(); dk = P = null;
    box.style.removeProperty('--dc');
  }
  /* the thumb between stops, on the free line at the light's place (device px); at a stop, or within 6 of it, it is
     its glyph (null). And the light under a finger (client px): held at a stop while the finger is over its glyph
     (the detents) */
  const seg = (v) => (v < 7 || (v > 43 && v < 57) || v > 93 ? null : v < 50 ? dk.L0 + (v - 7) * (dk.L1 - dk.L0) / 36 : dk.R0 + (v - 57) * (dk.R1 - dk.R0) / 36);
  function lightAt(x) {
    const d = x * dk.dpr;
    return d < dk.L0 ? 0 : d <= dk.L1 ? 7 + 36 * (d - dk.L0) / (dk.L1 - dk.L0) : d < dk.R0 ? 50 : d <= dk.R1 ? 57 + 36 * (d - dk.R0) / (dk.R1 - dk.R0) : 100;
  }
  /* the line in the setting sun's horizon colour (the line's at dusk, else the stops' grey, live in the cut), the thumb
     in the ink */
  function dPaint() {
    const g = grey(), C = F.colours(fv);
    [[dk.tk, stage === 'dusk' || fstops[1].foc ? cssRGB(C.line, g) : g], [dk.th, live ? cssRGB(getComputedStyle(root).getPropertyValue('--ink'), rgb(C.ink)) : rgb(C.ink)]].forEach(([c, v]) => {
      const x = c.getContext('2d'); x.fillStyle = 'rgb(' + v + ')'; x.fillRect(0, 0, c.width, c.height);
    });
  }
  const tX = (d) => 'translateX(' + (Math.round(d - dk.tw / 2) - dk.bx) / dk.dpr + 'px)';
  function dThumb() {
    const s = seg(fv), t = dk.th;
    if (gl) return;
    t.hidden = s === null;
    if (s !== null) { t.classList.remove('glide'); t.style.transform = tX(s); }
  }
  /* a tap: the thumb glides from where it stood to the stop in the press's time, and is then its glyph; under reduced
     motion it is there at once */
  function dGlide(a, z) {
    if (reduced() || Math.abs(a - z) < 1) return;
    const t = dk.th;
    clearTimeout(gT); gl = true;
    t.classList.remove('glide'); t.style.transform = tX(a); t.hidden = false;
    void t.offsetWidth;   // (laid out where it starts)
    t.classList.add('glide'); t.style.transform = tX(z);
    gT = setTimeout(() => { gl = false; if (dk) { t.classList.remove('glide'); dThumb(); } }, 170);
  }
  /* a finger: a tap is its cell's stop; a sideways drag past 8px, the light under the finger; an upright move, the
     page's own (touch-action: pan-y), which takes the finger and leaves the light; a drag the browser takes over is
     undone, so a swipe never leaves the light moved */
  function dTouch(e) {
    const T = e.type;
    if (T === 'pointerdown') { if (onTouch() && dk && e.isPrimary && e.button < 1) P = { id: e.pointerId, x: e.clientX, y: e.clientY, v0: fv, m: 0 }; return; }
    if (!P || e.pointerId !== P.id || !dk) return;
    const dx = Math.abs(e.clientX - P.x), dy = Math.abs(e.clientY - P.y);
    if (T === 'pointermove') {
      if (!P.m) {
        if (dy > 8 && dy >= dx) P.m = 2;
        else if (dx > 8 && dx > dy) { P.m = 1; try { box.setPointerCapture(P.id); } catch (er) { /* none */ } }
      }
      const v = Math.round(lightAt(e.clientX));
      if (P.m === 1 && v !== fv) setFade(v, 'save');
      return;
    }
    const p = P; P = null;
    if (T === 'pointercancel') { if (p.m === 1 && fv !== p.v0) setFade(p.v0, 'save'); return; }
    if (p.m || Math.hypot(dx, dy) > 8) return;
    const k = (p.x * dk.dpr - dk.bx) / (48 * dk.dpr), to = k < 1 ? 0 : k < 2 ? 50 : 100;
    if (to === fv) return;
    const s = seg(fv), from = s !== null ? s : dk.c[fv < 7 ? 0 : fv > 93 ? 2 : 1];
    setFade(to, 'save');
    dGlide(from, dk.c[to / 50]);
  }
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((t) => box.addEventListener(t, dTouch));
  function layout() { fSize(); snapFader(); if (onTouch()) dLayout(); else dOff(); }
  layout();
  fstops.forEach(fDraw);
  addEventListener('resize', layout);
  if (tq && tq.addEventListener) tq.addEventListener('change', layout);
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
