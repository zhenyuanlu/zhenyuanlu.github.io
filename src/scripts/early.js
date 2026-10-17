/* The light is set before the first paint, so a dusk visit never flashes day first (the draft's own script,
   inlined in every page's head; its hash is in the page's CSP). The fader's position 0..100 in three stages: day
   0..33, dusk 34..66, night 67..100. Saved ('zl-fade', read inside try/catch: a browser may refuse storage) ->
   the system's dark (100) -> the visitor's own clock. The paper, its surface (one tone step off it, lighter at
   night: the panels' ground), ink, grey, hairline and accent of each stage; day to dusk is one continuous blend over
   0..50, dusk deepens a touch by 66, and dusk to night is a cut. As draft v2t has them (the taste round, 2026-10-16):
   dusk keeps r14's cream, its amber line one step deeper (#a8733f: 3.25:1 on dusk's deepest paper, so it holds 3:1);
   the accent a burnt orange one step deeper by day and at dusk (day #a65412, dusk #96490d, night #f0a860: 4.5:1 or
   more on the paper and on the surface at every position of the fader); red stays for the living now. The phone's
   browser bar takes the paper's colour (<meta name="theme-color">, made here if the page has none yet). window.__fade
   is the fader's (scripts/fader.js). */
(function () {
  var R = document.documentElement;
  R.classList.add('js');
  function hx(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) {
    var A = hx(a), B = hx(b);
    return '#' + A.map(function (v, i) { var c = Math.round(v + (B[i] - v) * t); return (c < 16 ? '0' : '') + c.toString(16); }).join('');
  }
  var C = {
    day: { bg: '#fcfcfa', surface: '#f1f1ee', ink: '#1b1b1b', grey: '#666666', line: '#6b6b6b' },
    dusk: { bg: '#f3ece3', surface: '#e9e1d6', ink: '#1d1a18', grey: '#675d55', line: '#a8733f' },
    late: { bg: '#eee5da', surface: '#e4dace' },
    night: { bg: '#131418', surface: '#1e1f24', ink: '#e8e6e1', grey: '#8f9096', line: '#8f8f8f' }
  };
  var A = { day: '#a65412', dusk: '#96490d', night: '#f0a860' };
  function stage(v) { return v <= 33 ? 'day' : v <= 66 ? 'dusk' : 'night'; }
  function colours(v) {
    var s = stage(v), N = C.night, D = C.day, K = C.dusk, t;
    if (s === 'night') return { bg: N.bg, surface: N.surface, ink: N.ink, grey: N.grey, line: N.line, accent: A.night, stage: s, dark: true };
    if (v <= 50) {
      t = v / 50; t = t * t * (3 - 2 * t);
      return { bg: mix(D.bg, K.bg, t), surface: mix(D.surface, K.surface, t), ink: mix(D.ink, K.ink, t), grey: mix(D.grey, K.grey, t), line: mix(D.line, K.line, t), accent: mix(A.day, A.dusk, t), stage: s, dark: false };
    }
    t = (v - 50) / 16;
    return { bg: mix(K.bg, C.late.bg, t), surface: mix(K.surface, C.late.surface, t), ink: K.ink, grey: K.grey, line: K.line, accent: A.dusk, stage: s, dark: false };
  }
  /* 06:30-16:59 day (0) · 17:00-18:59 dusk, 34 rising to 66 · 19:00-05:29 night (100) · 05:30-06:29 dawn, as dusk (50) */
  function clock(d) {
    var m = d.getHours() * 60 + d.getMinutes(), v;
    if (m >= 390 && m < 1020) v = 0;
    else if (m >= 1020 && m < 1140) v = 34 + 32 * (m - 1020) / 119;
    else if (m >= 330 && m < 390) v = 50;
    else v = 100;
    return Math.round(v);
  }
  var bar = null;
  function apply(v) {
    var c = colours(v), th = c.dark ? 'dark' : 'light', st = R.style;
    st.setProperty('--bg', c.bg);
    st.setProperty('--surface', c.surface);
    st.setProperty('--ink', c.ink);
    st.setProperty('--grey', c.grey);
    st.setProperty('--line', c.line);
    st.setProperty('--accent', c.accent);
    if (!bar || !bar.isConnected) {
      bar = document.querySelector('meta[name="theme-color"]');
      if (!bar && document.head) { bar = document.createElement('meta'); bar.setAttribute('name', 'theme-color'); document.head.appendChild(bar); }
    }
    if (bar) bar.setAttribute('content', c.bg);
    if (R.getAttribute('data-stage') !== c.stage) R.setAttribute('data-stage', c.stage);
    if (R.getAttribute('data-theme') !== th) R.setAttribute('data-theme', th);
  }
  var v, s = null;
  try { s = localStorage.getItem('zl-fade'); } catch (e) {}
  if (s !== null && s !== '' && isFinite(+s)) v = Math.max(0, Math.min(100, Math.round(+s)));
  else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) v = 100;
  else v = clock(new Date());
  apply(v);
  window.__fade = { v: v, apply: apply, colours: colours, stage: stage };
  /* the frame on the device grid and the footer heart's cells on whole device pixels, as scripts/site.js keeps them
     (frameGrid, heartGrid: the same values, and they follow a zoom or another screen): set here too, so the first
     paint has them and nothing moves when that script runs (at 150% the heart was 9px till then and 12px after, and
     the words after it moved 3.3px) */
  var d = window.devicePixelRatio || 1, n = Math.max(1, Math.round(d));
  if (!(window.matchMedia && matchMedia('(any-hover: none)').matches) && d > 0) { R.style.setProperty('--dwx', 1 / d + 'px'); R.setAttribute('data-grid', ''); }
  if (Math.abs(d - n) > 1e-6 && d > 1) R.style.setProperty('--hb-z', String((n + 1e-3) / d));
  /* The selective big-screen mode (the draft's, design/assets/zoom/wide.js; the owner's choice, on at launch): decided
     here, before the first paint, so a page made ready before it is shown (the speculation rules' prerender) already
     has its final size; scripts/wide.js puts the page's scripts in its px and decides again on every resize. On a
     desktop with a pointer that hovers, at least 1000px wide, in a browser whose zoom answers as the standard's (a
     probe: Chromium; not Safari's), the frame is 960 x k, k the largest of 1.5, 1.375, 1.25, 1.125 whose frame is at
     most 60% of the window's width and whose 860 x k is at most its height (from 1800 x 968: 1920 x 1080 gets 1080,
     his 2194 x 1100 1200, 2560 x 1440 1440). A poster page (the home, race, the 404) is zoomed by k; a reading page
     (build, teach, see, the blog, a post, a photograph's page) by the text's one small step t (1.0625; from k 1.375,
     1.125), its frame widened in its own px (--cw); the controls stand in boxes zoomed back to the window's px
     (styles/wide.css: --wi, --ww). At k 1 nothing is set and the page is the plain 960px page, as with ?wide=off,
     where nothing here or in scripts/wide.js runs. ?wide=1.25 (any step) sets a step, to compare.
     For the sheets: html[data-wide] (k), html[data-wkind] (poster, reading), --z (the page's zoom), --wk, --wt, --wi
     (a control's zoom: 1 / z and a hair over, as a length is kept in 64ths cut down), --wtz (t / z), --ww (the frame
     in the window's px), --zd (device px a page px), --wp (a control's px made whole device pixels), --vw and --vh (a
     hundredth of the window in the page's px: 100vw under a zoomed root is the window times z), --cw (a reading
     page's frame in its own px). The browser's own size and ratio are kept here, before scripts/wide.js wraps them */
  var Wn = window, mm = Wn.matchMedia;
  function own(o, k) { var q; while (o && !(q = Object.getOwnPropertyDescriptor(o, k))) o = Object.getPrototypeOf(o); return q || null; }
  var dIW = own(Wn, 'innerWidth'), dIH = own(Wn, 'innerHeight'), dDPR = own(Wn, 'devicePixelRatio');
  function iw() { return dIW.get.call(Wn); }
  function ih() { return dIH.get.call(Wn); }
  function sr() { return dDPR.get.call(Wn) || 1; }
  var ask = /[?&]wide=([\w.]+)/.exec(location.search), STEPS = [1.5, 1.375, 1.25, 1.125], HAIR = 1 + 1e-6;
  var reading = /^(build|teach|see|blog)$/.test(R.getAttribute('data-page') || '');
  var force = ask && ask[1] !== 'on' && ask[1] !== 'auto' ? Math.max(1, Math.min(1.5, parseFloat(ask[1]) || 0)) : 0;
  function touch() { return !!(mm && mm.call(Wn, '(any-hover: none)').matches); }
  /* (the probe: a hidden 100px box, 10px from the left, under the root zoomed by 2; nothing else is laid out yet: its
     rect must be 200 wide at 20, its offsetWidth 100, and the root's client width the window's) */
  function probe() {
    var box = document.createElement('div'), r = null, w = 0, cw = 0, z0 = R.style.zoom;
    box.style.cssText = 'position:absolute;left:10px;top:0;width:100px;height:1px;margin:0;border:0;padding:0;visibility:hidden;pointer-events:none';
    R.style.zoom = '2';
    R.appendChild(box);
    try { r = box.getBoundingClientRect(); w = box.offsetWidth; cw = R.clientWidth; } catch (e) { r = null; }
    R.removeChild(box);
    R.style.zoom = z0;
    return !!r && w === 100 && Math.abs(r.width - 200) < 0.5 && Math.abs(r.left - 20) < 0.5 && cw > iw() * 0.75;
  }
  var std = !(ask && ask[1] === 'off') && !touch() && !!(Wn.CSS && CSS.supports && CSS.supports('zoom', '2')) && probe();
  var wk = 1, wt = 1, wz = 1, printing = false, VARS = ['zoom', '--vw', '--vh', '--z', '--wk', '--wt', '--wi', '--wtz', '--ww', '--zd', '--wp', '--cw'];
  function step() {
    var w = iw(), h = ih(), i, s;
    if (w < 1000 || touch()) return 1;
    for (i = 0; i < STEPS.length; i++) {
      s = STEPS[i];
      if (force ? s <= force + 1e-9 && w / s >= 1000 && h / s >= 620 : 960 * s <= 0.6 * w + 1e-6 && 860 * s <= h + 1e-6) return s;
    }
    return 1;
  }
  function wide() {
    var st = R.style, dr = sr(), c = Math.max(1, Math.round(dr)), V = [];
    wk = std && !printing ? step() : 1;
    wt = wk >= 1.375 ? 1.125 : wk >= 1.125 ? 1.0625 : 1;
    wz = reading ? wt : wk;
    if (wk > 1) V = [wz, iw() / wz / 100 + 'px', ih() / wz / 100 + 'px', wz, wk, wt, HAIR / wz, wt * HAIR / wz, 960 * wk + 'px', dr * wz, c / dr + 'px', reading ? 960 * wk / wz + 'px' : ''];
    VARS.forEach(function (p, i) { if (V[i] === undefined || V[i] === '') st.removeProperty(p); else st.setProperty(p, String(V[i])); });
    ['data-z', 'data-wide', 'data-wkind'].forEach(function (a, i) { if (wk > 1) R.setAttribute(a, String([wz, wk, reading ? 'reading' : 'poster'][i])); else R.removeAttribute(a); });
  }
  window.__wide = { std: std, reading: reading, iw: iw, ih: ih, dpr: sr, apply: wide,
    print: function (p) { printing = !!p; wide(); },   /* (a printed page is the plain page: scripts/wide.js, beforeprint) */
    k: function () { return wk; }, t: function () { return wt; }, z: function () { return wz; } };
  if (std) wide();
})();
