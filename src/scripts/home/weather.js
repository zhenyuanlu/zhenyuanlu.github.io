// The weather (the draft's home script, "the weather"): one brief pixel burst round the city he reaches, in the
// road's pixel, behind the city's icon and never below the road, simulated from the clock (a pure function of the
// effect, a seed and the time); the city's scene's weather for the stage, Boston's by the visitor's month. It plays
// to its end and never loops (Boston's snow by night goes on while the city is in hand). Reduced motion: one still
// frame for 1.2s.
import { palAt } from './colour.js';
import { LINE_A, clamp, put, rng } from './util.js';

export function installWeather(hm) {
  var DATA = hm.DATA, WXD = hm.WXD, reduced = hm.reduced, sceneOf = hm.sceneOf;
  Object.assign(hm, { burst: burst, wxClear: wxClear, wxDraw: wxDraw, wxRestage: wxRestage });
  /* ---------- the weather: one brief pixel burst round the city he reaches ----------
     Cells are the traveller's own pixel (U). A burst is a pure function of (effect, seed, t), simulated
     from the clock at 120 steps a second. Cells inside the icon's outline are never drawn, so it passes
     behind the city and never touches the icon; nothing falls below the road, where the name hangs;
     fades are ordered dithers, so it comes and goes cell by cell. Each effect is drawn for a traveller
     standing on the city's left (his side is left to his city thing) and mirrored when he stands on its right. One city
     at a time (a new burst dithers the old one out in 200ms); it plays to its end and never loops; the
     same city replays after COOL ms. Which weather is the city's scene's for the stage (DATA.wx; none if
     the scene says null), in the stage's palette; a stage change mid-burst dithers the old weather out
     while the new one plays. A season-based weather (Boston) follows the visitor's month (winter snow,
     spring petals, a summer harbour, autumn leaves). Reduced motion: one still frame for 1.2 s. */
  var WX = DATA.weather, BOX = WX.box, BW = BOX.x1 - BOX.x0 + 1, BH = BOX.y1 - BOX.y0 + 1, BAYER = WX.bayer, COOL = 500;
  function season(S) {
    var m = new Date().getMonth() + 1;
    for (var k in S) if (S[k].months && S[k].months.indexOf(m) >= 0) return k;
    return S.winter ? 'winter' : Object.keys(S)[0];
  }
  function effectOf(key) { var e = key && WXD[key]; return !e ? null : e.seasons ? e.seasons[season(e.seasons)] : e; }
  function simulate(E, T, seed) {
    var R = rng(seed * 7919), DT = 1 / 120, Gr = {}, pend = [], live = [];
    E.groups.forEach(function (g) { Gr[g.id] = g; });
    function jit(a) { return a ? Math.round((R() * 2 - 1) * a) : 0; }
    E.groups.forEach(function (g) {
      (g.at || []).forEach(function (s) {
        var j = g.jitter || [0, 0, 0];
        pend.push({ g: g, s: s, x: s.x + jit(j[0]), y: s.y + jit(j[1]), t: Math.max(0, s.t + (R() * 2 - 1) * j[2]) });
      });
    });
    pend.sort(function (a, b) { return a.t - b.t; });
    function make(g, s, x, y) {
      var v = s.v || g.v || [0, 0];
      return { g: g, sp: s.sprite || g.sprite, x: x, y: y, vx: v[0], vy: v[1], age: 0, life: g.life, life0: g.life,
               ph: R() * 6.2832, dist: 0, hops: 0, hy: 0, wx: 0, wy: 0, flip: !!s.flip, swap: s.swap || null, rest: false, dead: false };
    }
    function spawn(id, x, y) { var g = Gr[id]; (g.burst || [{}]).forEach(function (b) { live.push(make(g, b, x + (b.dx || 0), y + (b.dy || 0))); }); }
    var k = 0, steps = Math.floor(T / DT + 1e-6);
    for (var n = 0; ; n++) {
      var t = n * DT;
      while (k < pend.length && pend[k].t <= t + 1e-9) { var q = pend[k++]; live.push(make(q.g, q.s, q.x, q.y)); }
      if (n >= steps) break;
      var len = live.length;
      for (var i = 0; i < len; i++) {
        var p = live[i], g = p.g;
        if (p.dead) continue;
        p.age += DT;
        if (p.age >= p.life) { p.dead = true; continue; }
        if (p.rest) continue;
        if (g.g) { p.vx += g.g[0] * DT; p.vy += g.g[1] * DT; }
        p.x += p.vx * DT; p.y += p.vy * DT; p.dist += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * DT;
        if (g.wobble) { var o = g.wobble.amp * Math.sin(6.2832 * g.wobble.hz * p.age + p.ph); if (g.wobble.axis === 'y') p.wy = o; else p.wx = o; }
        if (g.hop) {
          var P = g.hop.path, d = p.dist, hi = 0;
          while (hi < P.length && d >= P[hi][0]) { d -= P[hi][0]; hi++; }
          p.hy = hi < P.length ? -P[hi][1] * Math.sin(Math.PI * d / P[hi][0]) : 0;
          if (hi > p.hops) { p.hops = hi; if (g.hop.spawn) spawn(g.hop.spawn, Math.round(p.x), p.y); }
        }
        if (g.land && p.y >= g.land.row) {
          p.y = g.land.row;
          if (g.land.spawn) { p.dead = true; spawn(g.land.spawn, Math.round(p.x + p.wx), g.land.row); }
          else { p.rest = true; p.life = p.age + g.land.rest + (g.fade ? g.fade[1] : 0); }
        }
      }
    }
    var out = [], tail = E.tail || 0, env = tail > 0 ? clamp((E.duration - T) / tail, 0, 1) : 1;
    live.forEach(function (p) {
      if (p.dead) return;
      var f = p.g.fade || [0, 0], a = env;
      if (f[0] > 0) a = Math.min(a, p.age / f[0]);
      if (f[1] > 0) a = Math.min(a, (p.life - p.age) / f[1]);
      if (a <= 0) return;
      out.push({ sp: p.sp, f: frameOf(p, E.sprites[p.sp]), ix: Math.round(p.x + p.wx), iy: Math.round(p.y + p.wy + p.hy), a: a, flip: p.flip, swap: p.swap, floor: !!p.g.floor });
    });
    return out;
  }
  function frameOf(p, S) {
    var A = p.g.anim, n = S.frames.length;
    if (p.rest && p.g.land.frame != null) return p.g.land.frame;
    if (!A || n === 1) return 0;
    if (A.seq) return A.seq[Math.min(A.seq.length - 1, Math.floor(p.age / p.life0 * A.seq.length))] % n;
    if (A.fps) return Math.floor(p.age * A.fps + p.ph) % n;
    if (A.per) return Math.floor(p.dist / A.per) % n;
    if (A.sway) { var s = Math.sin(6.2832 * p.g.wobble.hz * p.age + p.ph); return A.sway[Math.min(A.sway.length - 1, Math.floor((s + 1) / 2 * A.sway.length))]; }
    return 0;
  }
  /* a city near the screen's edge (Boston on a phone): what stands on that far side of it is drawn closer in, by
     whole cells, so the sun and the boats still fit (A: a thing's column, mirrored already; limL / limR: the last
     whole cells on screen either side, from layout()) */
  function squeeze(st, A) {
    var h = st.P.w / 2;
    function f(lim) { return clamp((lim - h - 3) / (BOX.x1 - h - 3), .3, 1); }
    if (A >= h && st.limR < BOX.x1) return Math.round(h + (A - h) * f(st.limR)) - A;
    var B = -1 - A;
    if (B >= h && st.limL < BOX.x1) return B - Math.round(h + (B - h) * f(st.limL));
    return 0;
  }
  /* layers: the burst playing, and under it one being dithered out (k: its strength) */
  function wxPaint(st, layers) {
    var img = st.wctx.createImageData(BW, BH), D = img.data, FW = st.P.W, FH = st.P.H, h2 = FW / 2, sil = st.P.sil, K = hm.ink();
    layers.forEach(function (Ly) {
      var E = Ly.E, pal = hm.onPaper(palAt(E, Ly.sg), Ly.sg), mir = Ly.mirror && !E.fixed, line = Ly.line, k = Ly.k;   /* fixed: tied to the icon (a chimney's smoke), never mirrored */
      Ly.items.forEach(function (it) {
        var S = E.sprites[it.sp], rows = (line ? S.bw : S.frames)[it.f];
        var ax = it.flip ? S.w - 1 - S.anchor[0] : S.anchor[0], ay = S.anchor[1], sh = squeeze(st, mir ? -1 - it.ix : it.ix);
        for (var j = 0; j < S.h; j++) for (var i = 0; i < S.w; i++) {
          var key = rows[j][it.flip ? S.w - 1 - i : i];
          if (key === '.') continue;
          var ci = it.ix - ax + i, cj = it.iy - ay + j;
          if (it.floor && cj >= 0) continue;    /* rolling on the road: nothing below the line */
          if (mir) ci = -1 - ci;
          ci += sh;
          if (ci < BOX.x0 || ci > BOX.x1 || cj < BOX.y0 || cj > BOX.y1) continue;
          if (ci > st.limR || ci < -1 - st.limL) continue;   /* past the screen's edge (Boston's snow on a phone) */
          if (ci >= -h2 && ci < h2 && cj >= -FH && cj < 0 && sil[(cj + FH) * FW + ci + h2]) continue;   /* behind the icon */
          var gx = ci - BOX.x0, gy = cj - BOX.y0;
          if (gy < st.gy0) continue;
          var ea = it.a * k * Math.min(1, (gx + .5) / 2, (BOX.x1 - ci + .5) / 2, (gy - st.gy0 + .5) / 2,
            (st.limR - ci + .5) / 2, (ci + 1 + st.limL + .5) / 2);   /* and it dithers out there, as at the box's */
          if (ea * 16 <= BAYER[(gy & 3) * 4 + (gx & 3)] + .5) continue;
          if (it.swap && it.swap[key]) key = it.swap[key];
          if (!line && !pal[key]) continue;
          put(D, gy * BW + gx, line ? K : pal[key], line ? LINE_A : 255);
        }
      });
    });
    st.wctx.putImageData(img, 0, 0);
  }
  function wxLayer(o, t, k) { return { E: o.E, items: simulate(o.E, t, o.seed), k: k, line: o.line, mirror: o.mirror, sg: o.sg }; }
  function wxDraw(st, t, seed, k) { var B = st.B; wxPaint(st, [{ E: B.E, items: simulate(B.E, t, seed), k: k, line: B.line, mirror: B.mirror, sg: B.sg }]); }
  function wxClear(st) {
    var B = st.B;
    hm.clear(B.tm);
    if (B.on) B.end = performance.now();
    B.on = false; B.still = false; B.out = 0; B.old = null;
    st.wctx.clearRect(0, 0, BW, BH);
  }
  var wxRaf = 0;
  function burst(i) {
    var st = hm.cities[i], B = st.B, now = performance.now(), A = hm.actOf(st.id, hm.stage);
    /* one burst per arrival: it plays to its end. But a thing he stays at (Boston's house by night) starts again
       whenever the city is back in hand: he goes back in, weather or not */
    if ((B.on && !B.out) || (!B.on && now - B.end < COOL)) { if (A && A.hold && !hm.walker.act) actLater(i, now); return; }
    actLater(i, now);
    wxStart(st, now);
  }
  function actLater(i, now) {
    hm.clear(hm.walker.actT);
    hm.walker.actT = hm.later(function () { if (hm.walker.at === i && !hm.walker.walking) hm.startAct(i); }, reduced() ? 0 : Math.max(0, hm.walker.end - now) + 200);
  }
  /* the scene's weather for the stage begins round city st; a burst already playing there dithers out under it */
  function wxStart(st, now) {
    var B = st.B, E = effectOf(sceneOf(st.id, hm.stage).wx);
    hm.cities.forEach(function (o) {
      if (o === st || !o.B.on) return;
      if (reduced() || o.B.still) wxClear(o); else if (!o.B.out) o.B.out = now;
    });
    hm.clear(B.tm);
    B.old = B.on && !B.still && !reduced() ? { E: B.E, seed: B.seed, t0: B.t0, sg: B.sg, line: B.line, mirror: B.mirror, out: now } : null;
    if (!E) {                                 /* this scene has no weather */
      if (B.on) B.end = now;
      B.on = false; B.still = false; B.out = 0;
      if (!B.old) st.wctx.clearRect(0, 0, BW, BH);
      else if (!wxRaf) wxRaf = hm.raf(wxTick);
      return;
    }
    B.E = E; B.sg = hm.stage; B.seed = st.i + 1 + (++B.n);
    B.line = st.mode !== 'held' && st.a < .5;   /* the line frames only for a city already gone back to line art */
    B.mirror = hm.walker.side === 'r';           /* he stands on the city's right */
    B.on = true; B.out = 0; B.outMs = 0; B.t0 = now; B.still = false;
    if (reduced()) {                          /* drawn and cleared on frames, so the page shows them */
      B.still = true;
      hm.raf(function () { if (B.still) wxDraw(st, B.E.still, st.i + 1, 1); });
      B.tm = hm.later(function () { hm.raf(function () { if (B.still) wxClear(st); }); }, 1200);
      return;
    }
    if (!wxRaf) wxRaf = hm.raf(wxTick);
  }
  /* the stage changed: a burst playing crosses to the new stage's weather; a city in hand with him beside it
     gets the new weather even if its own had finished */
  function wxRestage(now) {
    hm.cities.forEach(function (st) {
      var B = st.B;
      if (B.still) {
        var E = effectOf(sceneOf(st.id, hm.stage).wx);
        if (E) { B.E = E; B.sg = hm.stage; } else wxClear(st);
      } else if ((B.on && !B.out) || (st.mode === 'held' && hm.walker.at === st.i && !hm.walker.walking)) wxStart(st, now);
    });
  }
  function wxTick(now) {
    var busy = false;
    hm.cities.forEach(function (st) {
      var B = st.B, o = B.old, Ls = [];
      if (B.still || (!B.on && !o)) return;
      /* weather that goes on (E.loop, Boston's snow by night): while the city is in hand, a fresh burst takes over as
         this one tails off, and this one plays out under it */
      if (B.on && B.E.loop && !B.out && !o && st.mode === 'held' && (now - B.t0) / 1000 >= B.E.duration - (B.E.tail || 0)) {
        o = B.old = { E: B.E, seed: B.seed, t0: B.t0, sg: B.sg, line: B.line, mirror: B.mirror, out: Infinity };
        B.seed = st.i + 1 + (++B.n); B.t0 = now;
      }
      if (o) {
        var to = Math.max(0, (now - o.t0) / 1000), ko = Math.min(1, 1 - (now - o.out) / 200);
        if (ko <= 0 || to >= o.E.duration) B.old = null; else Ls.push(wxLayer(o, to, ko));
      }
      if (B.on) {
        var t = Math.max(0, (now - B.t0) / 1000), k = B.out ? 1 - (now - B.out) / (B.outMs || 200) : 1;
        if (t >= B.E.duration || k <= 0) { B.on = false; B.out = 0; B.end = now; } else Ls.push(wxLayer(B, t, k));
      }
      if (!Ls.length) { st.wctx.clearRect(0, 0, BW, BH); return; }
      wxPaint(st, Ls);
      busy = true;
    });
    wxRaf = busy ? hm.raf(wxTick) : 0;
  }
  Object.assign(hm, { BH: BH, BOX: BOX, BW: BW });
}
