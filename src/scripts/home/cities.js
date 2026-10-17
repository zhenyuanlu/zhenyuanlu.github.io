// The cities (the draft's home script, "the cities"): Shanghai, Okinawa, Austin, Dallas and Boston equally spaced on
// the road, each a pixel icon of 36 x 36 cells in line art at rest. In hand (a resting pointer, keyboard focus, a
// tap) its colour comes in cell by cell from the traveller's side, as its scene for the stage (the original in
// colour or another subject), and he walks to it; let go, it cools back like a cup of coffee. Of the cities let go
// only the last two stay warm. A change of stage under a warm city dissolves its scene into the new one. Their
// buttons and names are the server's (render.js); the art is art.js's.
import { iconPal, mixC } from './colour.js';
import { KEYS, LINE_A, clamp, easeOut, put, rng, shuffle, smooth } from './util.js';

export function installCities(hm) {
  var ALTI = hm.ALTI, DATA = hm.DATA, flow = hm.flow, reduced = hm.reduced, sceneOf = hm.sceneOf;
  Object.assign(hm, { drawOf: drawOf, iconOf: iconOf, paint: paint, run: run, restage: restage });
  /* ---------- the cities: warm in hand; let go, the colour cools like a cup of coffee ----------
     Each icon is n x n cells (36): its line art, and its colour drawing. It stands on the line, and the cells inside
     its outline are backed with the paper, so the traveller passes behind it while the line under it stays whole.
     Warming, the colour replaces the line art cell by cell (a ragged wipe from the side the traveller comes
     from; a is the share of cells in colour). Let go, warmth o(t) = o0 * e^(-t / TAU), read from the clock: nothing
     turns grey and nothing speckles; each colour cell cross-fades to what it is at rest (line art, or paper), in the
     order it warmed, so the cooling runs across the icon like a soft wave (about 6 s); when o reaches CUT it is at
     rest. A quick pass cools in QUICK. What it becomes in colour is its scene's icon for the stage (the original in
     colour, or another subject), in that stage's palette; if the stage changes while it is warm, the new scene's
     drawing dissolves in over the old one, pixel by pixel, in XD ms. At rest it is always the original line art.
     Of the cities let go, only the last two stay warm; a third sends the oldest to rest in FAST ms. */
  var TAU = 1800, QUICK = 450, CUT = 0.04, FAST = 1200, KEEP = 2, WARM = 360, DWELL = 150, XD = 420;
  /* I: the icon (its line art is what shows at rest); S: the drawing it becomes in colour (I itself, or a scene's
     subject). W x H: the city's frame. A scene's subject may be larger than the icon (S.w x S.h, Boston's house by
     night): every drawing stands bottom-centred in the frame, the icon's own 36 x 36 in the middle of its foot */
  function iconOf(I, seed, S, W, H) {
    S = S || I;
    var G = I.co.length, sw = S.w || G, sh = S.h || G, idx = [], line = [], cells = [], sil = [], q = [];
    W = W || G; H = H || G;
    var bx = (W - G) / 2, by = H - G, ax = (W - sw) / 2, ay = H - sh;
    for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
      var k = j * W + i, sj = j - ay, si = i - ax, ij = j - by, ii = i - bx;
      var c = sj >= 0 && sj < sh && si >= 0 && si < sw ? S.co[sj][si] : '.';
      idx[k] = c === '.' ? -1 : KEYS.indexOf(c);
      line[k] = ij >= 0 && ij < G && ii >= 0 && ii < G && I.bw[ij][ii] !== '.';
      if (idx[k] >= 0 || line[k]) cells.push(k);
    }
    /* the silhouette: every cell not reachable from the edge through empty cells */
    for (var e = 0; e < W * H; e++) sil[e] = true;
    function seedAt(x, y) { var k = y * W + x; if (sil[k] && idx[k] < 0 && !line[k]) { sil[k] = false; q.push(k); } }
    for (var t = 0; t < W; t++) { seedAt(t, 0); seedAt(t, H - 1); }
    for (var u = 0; u < H; u++) { seedAt(0, u); seedAt(W - 1, u); }
    while (q.length) {
      var k2 = q.pop(), x = k2 % W, y = (k2 - x) / W;
      if (x > 0) seedAt(x - 1, y); if (x < W - 1) seedAt(x + 1, y); if (y > 0) seedAt(x, y - 1); if (y < H - 1) seedAt(x, y + 1);
    }
    function order(fromRight) {
      var R = rng(seed);
      return cells.map(function (k) { var x = k % W; return { k: k, s: 1.3 * (fromRight ? W - 1 - x : x) / W + R() }; })
        .sort(function (a, b) { return a.s - b.s; }).map(function (o) { return o.k; });
    }
    return { G: G, W: W, H: H, w: sw, S: S, idx: idx, line: line, sil: sil, n: cells.length, ordL: order(false), ordR: order(true) };
  }
  /* a city's frame: the icon's 36 x 36, or larger where one of its scenes' subjects is */
  function frameSize(id) {
    var G = DATA.icons[id].co.length, W = G, H = G, S = DATA.scenes && DATA.scenes[id];
    if (S) ['day', 'dusk', 'night'].forEach(function (sg) {
      var A = S[sg] && ALTI[S[sg].icon];
      if (A) { W = Math.max(W, A.w || G); H = Math.max(H, A.h || G); }
    });
    return [W, H];
  }
  /* the order the cells of one drawing give way to the next's, when the stage changes under a warm city (one per
     frame size) */
  var RANKS = {};
  function rankOf(n) {
    if (RANKS[n]) return RANKS[n];
    var a = [], rk = new Float32Array(n);
    for (var k = 0; k < n; k++) a.push(k);
    shuffle(a, 97).forEach(function (k, q) { rk[k] = q / n; });
    return (RANKS[n] = rk);
  }
  var trail = [], raf = 0;
  var cities = [].slice.call(flow.querySelectorAll('.city')).filter(function (li) { var c = li.querySelector('.c'); return !!(c && DATA.icons[c.getAttribute('data-city')]); }).map(function (li, i) {
    var b = li.querySelector('.c'), id = b.getAttribute('data-city'), cv = li.querySelector('.ic canvas'), wx = li.querySelector('.wx');
    var ctx = cv.getContext('2d'), F = frameSize(id), px = iconOf(DATA.icons[id], 7 + i, null, F[0], F[1]);
    cv.width = px.W; cv.height = px.H;
    b.style.setProperty('--icon', 'calc(' + px.G + ' * var(--u))');
    cv.style.setProperty('--cw', px.W); cv.style.setProperty('--ch', px.H);
    return { i: i, id: id, li: li, b: b, ic: li.querySelector('.ic'), ctx: ctx, img: ctx.createImageData(px.W, px.H), imgX: ctx.createImageData(px.W, px.H), W: px.W, H: px.H, lr: 0,
             px: px, draws: { base: px }, P: px, sg: hm.stage, X: null,
             right: false, mode: 'rest', o: 0, a: 0, o0: 0, t0: 0, tau: TAU, w0: 0, a0: 0, wt: 0, wd: 0, ad: 0, hs: 0, held: 0,
             s0: 0, sa: 0, sq: 0, sd: 0, dirty: false, gy0: 0, limL: 99, limR: 99,
             wx: wx, wctx: wx.getContext('2d', { willReadFrequently: true }),
             B: { on: false, still: false, out: 0, end: -1e9, n: 0, t0: 0, tm: 0, E: null, sg: hm.stage, line: false, mirror: false, seed: 0, old: null } };
  });
  /* the drawing a city becomes for a scene's icon key, made once */
  function drawOf(st, key) {
    if (key !== 'base' && !ALTI[key]) key = 'base';
    return st.draws[key] || (st.draws[key] = iconOf(DATA.icons[st.id], 7 + st.i, ALTI[key], st.W, st.H));
  }
  function qOf(o) { return clamp((o - CUT) / (1 - CUT), 0, 1); }
  function forget(i) { var k = trail.indexOf(i); if (k >= 0) trail.splice(k, 1); }
  function rest(st) { st.mode = 'rest'; st.o = 0; st.a = 0; st.P = st.px; st.X = null; forget(st.i); }
  /* bring a city up to this instant, from the clock */
  function sample(st, now) {
    if (st.mode === 'held') {
      st.o = st.wd > 0 ? Math.min(1, st.w0 + (1 - st.w0) * easeOut((now - st.wt) / st.wd)) : 1;
      st.a = st.ad > 0 ? Math.min(1, st.a0 + (1 - st.a0) * clamp((now - st.wt) / st.ad, 0, 1)) : 1;
    } else if (st.mode === 'cool') {
      st.o = st.o0 * Math.exp(-Math.max(0, now - st.t0) / st.tau);
      if (st.o < CUT) rest(st);
    }
  }
  /* draw one drawing at one stage: the paper inside its outline, then the first a of its cells (in the wipe's
     order) in colour, the rest line art (the ink at .72 over the paper, so nothing behind shows through).
     Cooling, a warm cell cross-fades toward what it is at rest, cell by cell in the wipe's order */
  function paintInto(D, st, P, sg) {
    var n = Math.round(st.a * P.n), ord = st.right ? P.ordR : P.ordL, K = hm.ink(), KL = mixC(K, hm.paperC, LINE_A / 255), pal = hm.onPaper(iconPal(P.S, sg), sg);
    var cold = st.mode === 'cool' ? 1 - qOf(st.o) : 0;
    D.fill(0);
    for (var e = 0; e < P.sil.length; e++) if (P.sil[e]) put(D, e, hm.paperC, 255);
    for (var q = 0; q < P.n; q++) {
      var k = ord[q];
      if (q < n) {
        var x = P.idx[k], c = x >= 0 ? (pal[x] || K) : null, to = P.line[k] ? KL : hm.paperC;
        var from = c || hm.paperC;
        var kc = cold ? smooth(cold * 1.7 - q / P.n * .7) : 0;
        if (!c && kc <= 0) continue;
        put(D, k, kc > 0 ? mixC(to, from, kc) : from, 255);
      } else if (P.line[k]) put(D, k, KL, 255);
    }
  }
  /* the icon: its drawing, and while a stage change is under way the old one giving way cell by cell */
  function paint(st) {
    var D = st.img.data, X = st.X;
    paintInto(D, st, st.P, st.sg);
    if (X) {
      var x = clamp((performance.now() - X.t0) / XD, 0, 1);
      if (x >= 1) st.X = null;
      else {
        var O = st.imgX.data, n = D.length / 4, RK = rankOf(n);
        paintInto(O, st, X.P, X.sg);
        for (var k = 0; k < n; k++) if (RK[k] >= x) { var b = k * 4; D[b] = O[b]; D[b + 1] = O[b + 1]; D[b + 2] = O[b + 2]; D[b + 3] = O[b + 3]; }
      }
    }
    st.ctx.putImageData(st.img, 0, 0);
    st.dirty = st.mode !== 'rest' || !!st.X;
  }
  /* the paper changed (the fader moved): the icons' backing follows it */
  /* one loop, and only while something is warming, cooling or changing scene */
  function tick() {
    var now = performance.now(), busy = false;
    cities.forEach(function (st) {
      if (st.mode === 'rest' && !st.dirty) return;
      sample(st, now);
      paint(st);
      if (st.mode === 'cool' || st.X || (st.mode === 'held' && (st.o < 1 || st.a < 1))) busy = true;
    });
    raf = busy ? hm.raf(tick) : 0;
  }
  function run() { if (!raf) raf = hm.raf(tick); }
  function hold(i) {
    cities.forEach(function (o) { if (o.i !== i) letGo(o.i); });
    var st = cities[i], now = performance.now();
    if (st.mode === 'held') return;
    sample(st, now);
    forget(i);
    /* a fresh colour comes in from the traveller's side, as the scene of the stage */
    if (st.a <= 0) { st.right = hm.walker.x > hm.cx(i); st.sg = hm.stage; st.P = drawOf(st, sceneOf(st.id, hm.stage).icon); st.X = null; }
    st.mode = 'held'; st.w0 = st.o; st.a0 = st.a; st.wt = now; st.hs = now;
    st.wd = reduced() ? 0 : WARM * (1 - st.o);
    st.li.classList.add('on');
    /* he sets off; the wipe takes as long as his walk (between WARM and 900ms), so the colour is whole as he arrives */
    var D = hm.walkTo(i);
    st.ad = reduced() ? 0 : Math.max(WARM, Math.min(900, D)) * (1 - st.a0);
    sample(st, now); paint(st); run();
    iconLoop(st);
  }
  /* a scene icon may play frames of its own while the city is in hand (Shanghai's neon by night): loop: [{ f, ms }].
     Once its colour is whole; an act that names frames (Boston's house, Austin's truck) has the say while it runs */
  function iconLoop(st) {
    hm.caf(st.lr);
    var key = sceneOf(st.id, st.sg).icon, A = ALTI[key], L = A && A.loop;
    if (!L || reduced()) return;
    var round = L.reduce(function (t, q) { return t + q.ms; }, 0), t0 = performance.now();
    st.lr = hm.raf(function step(now) {
      if (st.mode !== 'held' || sceneOf(st.id, st.sg).icon !== key) return;
      var act = hm.walker.act;
      if (st.a >= 1 && !(act && act.i === st.i && act.ic)) {
        var t = (now - t0) % round, acc = 0, f = L[0].f;
        for (var k = 0; k < L.length; k++) { acc += L[k].ms; if (t < acc) { f = L[k].f; break; } }
        var P2 = hm.iconFrame(st, key, f);
        if (P2 && st.P !== P2 && (st.P === drawOf(st, key) || st.P.frameIn === key)) { st.P = P2; paint(st); }
      }
      st.lr = hm.raf(step);
    });
  }
  function letGo(i) {
    var st = cities[i];
    if (st.mode !== 'held') return;
    var now = performance.now();
    hm.caf(st.lr);
    if (st.P.frameIn && !(hm.walker.act && hm.walker.act.i === i && hm.walker.act.ic)) st.P = drawOf(st, st.P.frameIn);   /* cools from its own drawing */
    if (st.B.on && !st.B.out && st.B.E && st.B.E.loop) { st.B.out = now; st.B.outMs = 900; }   /* weather that went on (snow, the plane trees) goes with the visit */
    if (hm.walker.act && hm.walker.act.i === i && hm.walker.act.A.hold) { hm.stopAct(); hm.hop(); }   /* he comes back out */
    sample(st, now);
    st.held = now - st.hs;
    st.li.classList.remove('on');
    st.mode = 'cool'; st.o0 = Math.max(st.o, CUT * 1.01); st.t0 = now;
    if (st.a < 1 || reduced()) st.tau = reduced() ? 1 : QUICK;   /* a quick pass cools quickly */
    else {
      st.tau = TAU;
      trail.push(i);
      while (trail.length > KEEP) hurry(trail.shift());
    }
    paint(st); run();
  }
  /* a third city was let go: the oldest warm one cools out in FAST ms, on the same curve, just quicker */
  function hurry(j) {
    var st = cities[j], now = performance.now();
    sample(st, now);
    if (st.mode !== 'cool') return;
    st.o0 = st.o; st.t0 = now; st.tau = FAST / Math.log(st.o / CUT);
  }
  /* the stage changed (33/34 or 66/67): every warm city's scene gives way to the new stage's, cell by cell;
     its weather crosses over, and the traveller's thing too */
  function restage() {
    var now = performance.now();
    cities.forEach(function (st) {
      if (st.mode === 'rest') { st.sg = hm.stage; return; }
      var P2 = drawOf(st, sceneOf(st.id, hm.stage).icon);
      if (reduced()) st.X = null;
      else if (!st.X || now - st.X.t0 > XD / 2) st.X = { P: st.P, sg: st.sg, t0: now };
      else st.X.t0 = now;                     /* turned back early: the old drawing is still most of it */
      st.P = P2; st.sg = hm.stage;
      if (st.mode === 'held') iconLoop(st);
    });
    run();
    hm.wxRestage(now);
    hm.actRestage(now);
  }
  /* ---------- in hand: hover, keyboard focus, or a tap ---------- */
  cities.forEach(function (st) {
    var b = st.b;
    hm.listen(b, 'pointerenter', function (e) { if (e.pointerType !== 'touch') hold(st.i); });
    hm.listen(b, 'pointerleave', function (e) { if (e.pointerType !== 'touch' && !(document.activeElement === b && hm.kbd(b))) letGo(st.i); });
    hm.listen(b, 'focus', function () { if (hm.kbd(b)) hold(st.i); });
    hm.listen(b, 'blur', function () { if (hm.pointer === 'touch' || !b.matches(':hover')) letGo(st.i); });
    /* touch: a tap visits the city; tapping it again, or anywhere else, lets it cool */
    hm.listen(b, 'click', function () { if (hm.pointer === 'touch') { if (st.mode === 'held') letGo(st.i); else hold(st.i); } });
    /* left / right walk along the road */
    hm.listen(b, 'keydown', function (e) {
      var j = e.key === 'ArrowRight' ? st.i + 1 : e.key === 'ArrowLeft' ? st.i - 1 : -1;
      if (j >= 0 && j < cities.length) { e.preventDefault(); cities[j].b.focus(); }
    });
  });
  hm.listen(document, 'pointerdown', function (e) {
    if (e.pointerType === 'touch' && !(e.target.closest && e.target.closest('.city'))) cities.forEach(function (st) { letGo(st.i); });
  });
  hm.listen(document, 'keydown', function (e) { if (e.key === 'Escape') cities.forEach(function (st) { letGo(st.i); }); });
  Object.assign(hm, { DWELL: DWELL, cities: cities });
}
