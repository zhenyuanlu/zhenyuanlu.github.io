// Live figures (the draft v2ac's liveMount): a drawing with its own controls and caption that runs only when asked.
// Each figure's code is a module beside its post (content/blog/<post>/<name>.live.js), loaded only on the page
// that has the figure. The page owns the rest, which is the site's rule: at rest it is a still (its frame at t = 0);
// it runs once he presses play, a slider moved redraws the still; it stops when it leaves the window; under reduced
// motion there is no play at all. The canvas is sized in whole device pixels and drawn again for the stage's
// colours and a new width.
//   def: { label, ratio (width / height), min, max (its height's bounds, px), controls: [{ id, label, min, max,
//          step, value, unit }], draw({ ctx, w, h, t, v, ink, grey, line, bg, accent, px }) }
import { reduced, tok } from './hub.js';
// { '<post>/<name>': () => import(…) } for the posts this build shows (astro.config.mjs, liveFigures)
import MODULES from 'virtual:zl-live';

const fmt = (v, c) => (c.step < 1 ? (+v).toFixed(1) : String(+v)) + (c.unit ? ' ' + c.unit : '');

export function mountLive(fig) {
  const key = `${fig.getAttribute('data-post')}/${fig.getAttribute('data-live')}`;
  const load = MODULES[key];
  if (!load) return null;
  const cv = fig.querySelector('canvas'), stg = fig.querySelector('.a-live-s'), btn = fig.querySelector('.a-play');
  let D = null, t = 0, on = false, raf = 0, last = 0, W = 0, H = 0;
  const v = {}, ctl = {};
  function draw() {
    if (!W || !D) return;
    const g = cv.getContext('2d'), dpr = cv.width / W, T = tok();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    D.draw({ ctx: g, w: W, h: H, t, v, ink: T.ink, grey: T.grey, line: T.line, bg: T.bg, accent: T.accent, px: 1 / dpr, font: getComputedStyle(document.body).fontFamily });
  }
  function size() {
    const w = stg.clientWidth;
    if (!w || !D) return;
    const dpr = window.devicePixelRatio || 1, h = Math.round(Math.max(D.min || 100, Math.min(D.max || 260, w / (D.ratio || 3))));
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    W = cv.width / dpr; H = cv.height / dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    draw();
  }
  function frame(now) {
    t += Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    draw();
    raf = on ? requestAnimationFrame(frame) : 0;
  }
  function state() {
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.a-pw').textContent = on ? 'pause' : 'play';
    fig.classList.toggle('a-on', on);
  }
  function play() { if (on || reduced()) return; on = true; last = performance.now(); raf = requestAnimationFrame(frame); state(); }
  function pause() { if (!on) return; on = false; cancelAnimationFrame(raf); raf = 0; state(); }
  load().then((m) => {
    D = m.default;
    (D.controls || []).forEach((c) => { v[c.id] = c.value; ctl[c.id] = c; });
    if (!reduced()) btn.hidden = false;   // under reduced motion it stands still: the sliders still redraw it
    btn.addEventListener('click', () => { if (on) pause(); else play(); });
    fig.querySelectorAll('input[data-c]').forEach((inp) => {
      const c = ctl[inp.getAttribute('data-c')], o = inp.parentNode.querySelector('output');
      if (!c) return;
      inp.disabled = false;
      inp.addEventListener('input', () => { v[c.id] = +inp.value; o.textContent = fmt(inp.value, c); if (!on) draw(); });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) pause(); })).observe(fig);
    size();
  }).catch((e) => console.error(e));
  return { size, draw, stop: pause };
}
