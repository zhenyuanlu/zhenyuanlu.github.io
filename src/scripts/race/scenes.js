// The race map's pixel scenes and the little figure: his way along the season's highways (nodePath, route) and his
// walk, eased, setting off at the speed he had; a venue's scene fading in in its room as he fades out at its stop,
// and out again as he fades back in; every scene he is in counted, the one fading out as well as the one fading in,
// so from one sport to another at a venue he carries on and never snaps back to his start (r13); the sky's weather
// in each scene; the red pennant of the race pinned. Nothing moves unless the reader does something; with reduced
// motion (or pan off) he arrives at once and the scenes hold still. Ported from the draft
// (design/assets/v2ac/race.js); each comment is the draft's own.
import { faceOf, half, hdOn, hdRows, skyPlan } from './art.js';
import { css, tint } from './colour.js';
import { BIB, FADE, FLAG_DOWN, FLAG_H, FLAG_UP, NIGHTW, PENNANT, PENNANT2, SCARF, SKY, STAND, STRIDE } from './consts.js';
import { clamp, polyLen } from './util.js';

export function installScenes(pg) {
  var ACTS = pg.ACTS, HOMEN = pg.HOMEN, NODES = pg.NODES, S = pg.S, mapEl = pg.mapEl, scv = pg.scv, tr = pg.tr;
  /* ---------- the roads: the shortest way along the season's highways ---------- */
  function nodePath(a, b) {
    if (a == null || b == null) return null;
    if (a === b) return [pg.gpt(NODES[a]).concat([a])];
    var dist = {}, prev = {}, Q = Object.keys(pg.L.adj);
    if (Q.indexOf(a) < 0) Q.push(a);
    Q.forEach(function (k) { dist[k] = Infinity; });
    dist[a] = 0;
    while (Q.length) {
      Q.sort(function (x, y) { return dist[x] - dist[y]; });
      var u = Q.shift();
      if (u === b || dist[u] === Infinity) break;
      (pg.L.adj[u] || []).forEach(function (n) { var d = dist[u] + n.e.len; if (d < dist[n.to]) { dist[n.to] = d; prev[n.to] = { u: u, n: n }; } });
    }
    if (!prev[b]) return null;
    var segs = [], k = b, pts = [];
    while (prev[k]) { segs.unshift(prev[k]); k = prev[k].u; }
    segs.forEach(function (s, i) {
      var p = s.n.rev ? s.n.e.pts.slice().reverse() : s.n.e.pts;
      p.forEach(function (q, j) {
        if (i && !j) return;
        var g = pg.gpt(q);
        if (!j) g.push(s.u);
        if (j === p.length - 1) g.push(s.n.to);
        pts.push(g);
      });
    });
    return pts;
  }
  /* where a trip has him now (eased like v7b's walk), and the ways back and on to a junction */
  /* his way along a trip: eased in and out, or (a new trip taken while walking on in the same direction) setting off
     at the speed he had, so a quick sweep across the names never stops him dead at each one (a cubic from the
     speed he had, m0 cells over the trip, to rest; at most 2.5 lengths, so he never overshoots) */
  function tripS(T, f) { var m0 = T.m0 || 0, f2 = f * f, f3 = f2 * f; return (f3 - 2 * f2 + f) * m0 + (3 * f2 - 2 * f3) * T.len; }
  function tripV(T, now) { var f = clamp(((now || performance.now()) - T.t0) / T.dur, 0, 1), m0 = T.m0 || 0; return f >= 1 ? 0 : ((3 * f * f - 4 * f + 1) * m0 + (6 * f - 6 * f * f) * T.len) / T.dur; }
  function tripAt(T, now) {
    var f = clamp(((now || performance.now()) - T.t0) / T.dur, 0, 1);
    var s = clamp(tripS(T, f), 0, T.len), i = 0;
    while (i < T.cum.length - 2 && T.cum[i + 1] < s) i++;
    var a = T.pts[i], b = T.pts[i + 1] || a, seg = (T.cum[i + 1] || 0) - T.cum[i], k = seg ? clamp((s - T.cum[i]) / seg, 0, 1) : 1;
    var x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, back = [[x, y]], fwd = [[x, y]], pv = null, nv = null, j;
    for (j = i; j >= 0; j--) { back.push(T.pts[j]); if (T.pts[j][2] != null) { pv = T.pts[j][2]; break; } }
    for (j = i + 1; j < T.pts.length; j++) { fwd.push(T.pts[j]); if (T.pts[j][2] != null) { nv = T.pts[j][2]; break; } }
    return { x: x, y: y, s: s, f: f, dx: b[0] - a[0], dy: b[1] - a[1], prev: pv, back: back, next: nv, fwd: fwd };
  }
  /* where he is: on his way; in a scene (he leaves it from its stop); standing at home or at a stop */
  function stopFoot(P) { var c = pg.gpt(NODES[P.node]); return [c[0], P.sq.y1 + 0.0]; }
  function feet() {
    if (S.trip) { var w = tripAt(S.trip); return [w.x, w.y]; }
    if (S.act) return stopFoot(S.act.slot.P);
    var st = standAt();
    return st ? [st.fx, st.fy] : null;
  }
  function route(target, end) {
    var F = feet(), starts = [];
    if (!F || target == null) return null;
    if (S.trip) { var w = tripAt(S.trip); starts = [[w.prev, w.back], [w.next, w.fwd]]; }
    else { var n = S.at ? S.at.node : S.node || HOMEN; if (n != null && NODES[n]) starts = [[n, [F, pg.gpt(NODES[n]).concat([n])]]]; }
    var best = null;
    starts.forEach(function (st) {
      if (st[0] == null) return;
      var path = nodePath(st[0], target);
      if (!path) return;
      var pts = st[1].slice(0, -1).concat(path).concat([end]), len = polyLen(pts);
      if (!best || len < best.len) best = { pts: pts, len: len };
    });
    if (!best) return null;
    best.cum = [0];
    for (var i = 1; i < best.pts.length; i++) best.cum.push(best.cum[i - 1] + Math.hypot(best.pts[i][0] - best.pts[i - 1][0], best.pts[i][1] - best.pts[i - 1][1]));
    return best;
  }
  /* ---------- moving: only when something is in hand ---------- */
  function stopWalk() { cancelAnimationFrame(S.raf); S.raf = 0; clearTimeout(S.hopT); S.hopUp = false; }
  function stopMotion() { stopWalk(); cancelAnimationFrame(S.sraf); S.sraf = 0; if (S.flag) cancelAnimationFrame(S.flag.raf); }
  /* where he stands: at home on his spot; at another stop, on it */
  function standAt() {
    if (!pg.L) return null;
    var P = S.at || pg.L.homeP;
    if (!P) return null;
    if (P === pg.L.homeP && pg.L.home) return { fx: pg.L.home.fx, fy: pg.L.home.fy };
    return { fx: P.cx, fy: P.sq.y1 };
  }
  function hop() {
    if (pg.still()) return;
    clearTimeout(S.hopT);
    S.hopUp = true;
    S.hopT = setTimeout(function () { S.hopUp = false; drawMan(); }, 110);
  }
  function walkTo(P) {
    endAct();
    /* (on his way already: the speed and the way he was going) */
    var v0 = 0, d0 = null;
    if (S.trip && !pg.still()) { var w0 = tripAt(S.trip); v0 = tripV(S.trip); d0 = [w0.dx, w0.dy]; }
    stopWalk();
    var s = pg.shown(), sl = pg.playable(s && s.P === P ? s : null), home = P === pg.L.homeP && !sl && pg.L.home;
    var end = home ? [pg.L.home.fx, pg.L.home.fy] : stopFoot(P);
    var T = pg.still() ? null : route(P.node, end);
    if (!T || T.len < 0.5) { S.trip = null; upMan(false); arrive(P); return; }
    T.P = P; T.t0 = performance.now(); T.dur = clamp(T.len * pg.L.cs / 360 * 1000, 300, 2400);
    if (v0 > 0 && d0) {
      for (var i = 1; i < T.pts.length; i++) {
        var e0 = [T.pts[i][0] - T.pts[0][0], T.pts[i][1] - T.pts[0][1]];
        if (Math.abs(e0[0]) + Math.abs(e0[1]) < 1e-6) continue;
        if (e0[0] * d0[0] + e0[1] * d0[1] > 0) T.m0 = Math.min(2.5 * T.len, v0 * T.dur);
        break;
      }
    }
    S.trip = T;
    upMan(true);
    S.raf = requestAnimationFrame(function step(now) {
      if (S.trip !== T) return;
      if (now - T.t0 >= T.dur) { S.trip = null; S.raf = 0; upMan(false); arrive(P); return; }
      drawMan(now);
      S.raf = requestAnimationFrame(step);
    });
  }
  /* walking, he goes over the cards (they never hide him on his way); standing, under them */
  function upMan(on) { tr.classList.toggle('r-up', !!on); }
  /* how much of him shows where he stands or walks: never all of him in two places at once; as a scene with him in
     it fades in he fades out at its stop, and as it fades out he fades in (at the stop, or on his way from it).
     r13 (the owner, 2026-10-15: "每次切换运动，或者点击运动，小人会重新回到原始的位置"): every scene he is in counts, the one
     fading out as well as the one fading in. From one sport to another at a venue the two cross (one goes as the
     other comes, so together they are all of him), and he stays in them: he carries on from the scene he was in
     into the next. Only the new scene was counted, at nought as it began, so for that moment he stood whole at
     the stop again, where he starts, then faded into the new scene */
  function manAlpha() {
    var a = 0;
    S.scenes.forEach(function (sc) { a += sc.a; });
    return clamp(1 - a, 0, 1);
  }
  function arrive(P) {
    S.at = P; S.node = P.node;
    var s = pg.shown();
    if (s && s.P === P) settle(s);
    else { if (!S.instant) hop(); drawMan(); }
  }
  /* at the venue: its scene plays (or goes on, with the race now at hand's weather), or he stands */
  function settle(sel) {
    var sl = pg.playable(sel);
    if (sl && S.act && S.act.slot === sl) { S.act.R = sel.R; S.act.wx = weatherFor(sl, sel.R); drawScenes(); }
    else if (sl) startAct(sl, sel.R);
    else { endAct(); if (!S.instant) hop(); drawMan(); }
  }
  /* the weather in its sky: the race's own (one race at hand), else the latest raced of the scene's races */
  function weatherFor(sl, R) {
    if (R) return pg.wxOf(R);
    var list = sl.races.filter(function (x) { return pg.wxOf(x); });
    return list.length ? pg.wxOf(list[list.length - 1]) : null;
  }
  /* a scene fades in in its venue's room (him in it), and out when it ends; the picture by the name stays */
  function startAct(sl, R) {
    endAct();
    var A = sl.A, P = sl.P;
    S.at = P; S.node = P.node;
    var seq = A.seq && A.seq.length ? A.seq : Object.keys(A.frames), ms = A.ms || [], total = 0;
    seq.forEach(function (f, j) { total += ms[j] || 120; });
    var act = S.act = { slot: sl, R: R, A: A, f: A.still || seq[0], t0: performance.now(), wx: weatherFor(sl, R), step: 0, seq: seq, ms: ms, total: total, a: 0, a0: 0, to: 1, ft0: performance.now(), dur: pg.still() || S.instant ? 0 : FADE };
    S.scenes.push(act);
    drawMan();
    sceneLoop();
  }
  function endAct() {
    var a = S.act;
    if (!a) return;
    S.act = null; S.left = a;
    a.a0 = a.a; a.to = 0; a.ft0 = performance.now(); a.dur = pg.still() ? 0 : FADE;
    sceneLoop();
  }
  /* the scenes' one loop: their frames at their own pace (the rain and the wind a step every 110ms) and their fades */
  function sceneLoop() {
    if (S.sraf) return;
    S.sraf = requestAnimationFrame(function f(now) {
      S.sraf = 0;
      var live = false, red = pg.still();
      S.scenes = S.scenes.filter(function (sc) {
        var k = sc.dur ? clamp((now - sc.ft0) / sc.dur, 0, 1) : 1;
        sc.a = sc.a0 + (sc.to - sc.a0) * k;
        if (k < 1) live = true;
        if (!red) {
          var el = now - sc.t0, m = el % sc.total, j = 0;
          while (j < sc.seq.length - 1 && m >= (sc.ms[j] || 120)) { m -= sc.ms[j] || 120; j++; }
          sc.f = sc.seq[j]; sc.step = Math.floor(el / 110);
          live = true;
        }
        return !(sc.to === 0 && k >= 1);
      });
      drawScenes();
      /* (and him, fading against the scene, where he is not walking) */
      if (!S.trip) drawMan(now);
      if (live && S.scenes.length) S.sraf = requestAnimationFrame(f);
    });
  }
  /* the flag of the race pinned: up the moment it is pinned (a click, a tap, Enter; an address opened: there at
     once), whether he is there yet or not; down while another venue is previewed (round 5, the owner: "在鼠标hover其他
     城市的时候，应该消失"), up again when that preview ends; down when it is let go. Another venue pinned: its flag up,
     the last one gone at once */
  /* (and down at once, not in FLAG_DOWN, the moment the pointer is on another venue, before its preview's breath:
     round 5's check found it 120 to 240ms late) */
  function flagSync() {
    var pp = S.pin && S.pin.P, away = !!pp && ((S.prev && S.prev.P !== pp) || (S.hover && S.hover.sel && S.hover.sel.P && S.hover.sel.P !== pp));
    if (pp && !away) raiseFlag(pp); else lowerFlag(away ? 0 : FLAG_DOWN);
  }
  function raiseFlag(P) {
    if (S.flag && S.flag.P === P && S.flag.to === 1) return;
    if (S.flag && S.flag.P !== P) { cancelAnimationFrame(S.flag.raf); S.flag = null; }
    var f0 = S.flag ? S.flag.f : 0;
    S.flag = { P: P, f: f0, to: 1, raf: 0 };
    animFlag(S.flag, S.instant ? 0 : FLAG_UP);
  }
  function lowerFlag(ms) {
    if (!S.flag || (S.flag.to === 0 && ms)) return;
    S.flag.to = 0;
    animFlag(S.flag, ms == null ? FLAG_DOWN : ms);
  }
  function animFlag(F, ms) {
    cancelAnimationFrame(F.raf);
    var f0 = F.f, t0 = performance.now(), dur = ms * Math.abs(F.to - f0);
    if (pg.still() || dur < 1) { F.f = F.to; if (!F.f && S.flag === F) S.flag = null; drawMan(); return; }
    F.raf = requestAnimationFrame(function st(now) {
      var k = clamp((now - t0) / dur, 0, 1);
      F.f = f0 + (F.to - f0) * k;
      if (k >= 1 && !F.to && S.flag === F) S.flag = null;
      drawMan();
      if (k < 1) F.raf = requestAnimationFrame(st);
    });
  }
  /* him, on whole cells; walking or standing, with a cell of paper round him (but over no road, medal, picture or
     stop: those show round him, never cut); in a scene, as he is */
  function sprite(c, rows, ax, fx, fy, flip, K, pal, halo, hd) {
    var u = pg.L.u, h = rows.length, w = rows[0].length, X0 = fx - (flip ? w - 1 - ax : ax), Y0 = fy - (h - 1);
    var night = K.st === 'night', F = faceOf(rows), i, j;
    if (!hdOn(u)) hd = null;
    function at(a, b) { return a < 0 || b < 0 || a >= w || b >= h ? '.' : rows[b][flip ? w - 1 - a : a]; }
    function face(a, b) { return a >= 0 && b >= 0 && a < w && b < h && !!F[b * w + (flip ? w - 1 - a : a)]; }
    function open(a, b) { return at(a, b) === '.' && !face(a, b); }
    /* (his cell of paper, round him on the map, but never over a road, a medal, a picture or a stop: he stands on
       them, and they show round him) */
    if (halo) {
      c.fillStyle = K.bgC;
      for (j = -1; j <= h; j++) for (i = -1; i <= w; i++) {
        if (at(i, j) !== '.' || pg.solidAt(X0 + i, Y0 + j)) continue;
        if (face(i, j) || at(i + 1, j) !== '.' || at(i - 1, j) !== '.' || at(i, j + 1) !== '.' || at(i, j - 1) !== '.') c.fillRect((X0 + i) * u, (Y0 + j) * u, u, u);
      }
    }
    /* (big screens: his HD drawing in half cells, his cell of paper as at 1x; by night his face is the 1x drawing's (the
       empty cells his eyes reach), so the glasses may close round the eyes, and his moonlit edge the HD drawing's own) */
    if (hd) {
      var w2 = 2 * w, h2 = 2 * h;
      /* (on the map his own 1x cells are paper first, so a half cell the HD drawing leaves open (the hat's rounded
         corner) shows paper, as his cell of paper round him does, not the road he walks on) */
      if (halo) { c.fillStyle = K.bgC; for (j = 0; j < h; j++) for (i = 0; i < w; i++) if (at(i, j) !== '.' || face(i, j)) c.fillRect((X0 + i) * u, (Y0 + j) * u, u, u); }
      var at2 = function (a, b) { return a < 0 || b < 0 || a >= w2 || b >= h2 ? '.' : hd[b][flip ? w2 - 1 - a : a]; };
      var face2 = function (a, b) { return at2(a, b) === '.' && face(a >> 1, b >> 1); };
      var open2 = function (a, b) { return at2(a, b) === '.' && !face2(a, b); };
      for (j = 0; j < h2; j++) for (i = 0; i < w2; i++) {
        var ch2 = at2(i, j), col2 = null;
        if (ch2 === '.') { if (night && face2(i, j)) col2 = css(NIGHTW.face); }
        else if (ch2 === 'i') col2 = K.glass;
        else if (ch2 === 'm') col2 = K.pic;
        else if (!night) col2 = ch2 === 'k' || ch2 === 'e' ? K.inkC : ch2 === 's' ? css(SCARF) : ch2 === 'n' ? css(BIB) : pal && pal[ch2];
        else if (ch2 === 'k') col2 = css(open2(i - 1, j) || open2(i + 1, j) || open2(i, j - 1) || open2(i, j + 1) ? NIGHTW.rim : NIGHTW.k);
        else col2 = ch2 === 'e' ? css(NIGHTW.e) : ch2 === 's' ? css(NIGHTW.s) : ch2 === 'n' ? css(NIGHTW.n) : pal && pal[ch2];
        if (col2) { c.fillStyle = col2; half(c, X0 * u, Y0 * u, u, i, j); }
      }
      return;
    }
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var ch = at(i, j), col = null;
      if (ch === '.') { if (night && face(i, j)) col = css(NIGHTW.face); }
      else if (ch === 'i') col = K.glass;
      else if (ch === 'm') col = K.pic;
      else if (!night) col = ch === 'k' || ch === 'e' ? K.inkC : ch === 's' ? css(SCARF) : ch === 'n' ? css(BIB) : pal && pal[ch];
      else if (ch === 'k') col = css(open(i - 1, j) || open(i + 1, j) || open(i, j - 1) || open(i, j + 1) ? NIGHTW.rim : NIGHTW.k);
      else col = ch === 'e' ? css(NIGHTW.e) : ch === 's' ? css(NIGHTW.s) : ch === 'n' ? css(NIGHTW.n) : pal && pal[ch];
      if (col) { c.fillStyle = col; c.fillRect((X0 + i) * u, (Y0 + j) * u, u, u); }
    }
  }
  var PALS = new Map();
  function palOf(A, K) {
    var key = K.st + K.bgC, m = PALS.get(A);
    if (m && m.key === key) return m.P;
    var P = {};
    Object.keys(A.palette || {}).forEach(function (k) { P[k] = tint(A.palette[k], K.st, K.bg); });
    PALS.set(A, { key: key, P: P });
    return P;
  }
  function standRows() { var A = ACTS.stand && ACTS.stand.frames; return (A && (A.stand || A[ACTS.stand.still])) || STAND; }
  function strideRows(n) { var A = ACTS.walk && ACTS.walk.frames; return (A && A[n ? 'b' : 'a']) || STRIDE[n ? 'b' : 'a']; }
  /* (and their HD drawings, acts.json framesHD, where a cell is HD_MIN device px or more) */
  function standHD() { var A = ACTS.stand, R = standRows(), H = A && A.framesHD; return H && hdOn(pg.L.u) ? hdRows(H.stand || H[A.still], R[0].length, R.length) : null; }
  function strideHD(n) { var A = ACTS.walk, R = strideRows(n), H = A && A.framesHD; return H && hdOn(pg.L.u) ? hdRows(H[n ? 'b' : 'a'], R[0].length, R.length) : null; }
  /* the sky of a scene, across its room: the weather's glyphs where its plan puts them (skyPlan), the rain falling to
     its clearance over him and the wind going by beside it; nothing within CLEAR cells of him or his props */
  function sky(c, act, sk, x0, y0, RW, H, K) {
    var wx = act.wx, u = pg.L.u;
    if (!wx) return;
    var plan = skyPlan(act.A, RW, sk.ox, sk.S, wx, K.st);
    if (!plan) return;
    var t = pg.still() ? 3 : act.step, taken = {};
    function cell(x, y, col) { if (x < 0 || y < 0 || x >= RW || y >= H || plan.bad[y * RW + x] || taken[y * 999 + x]) return; c.fillStyle = col; c.fillRect((x0 + x) * u, (y0 + y) * u, u, u); taken[y * 999 + x] = 1; }
    plan.glyphs.forEach(function (g) { g.G.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (r[i] === '#' || r[i] === 'u') cell(g.x + i, g.y + j, r[i] === 'u' ? K.wx.under : K.wx[g.col]); }); });
    if (wx === 'overcast-wind') {
      for (var n = 0; n < 3; n++) {
        var yy = 3 + (n % 2), xs = ((n * 9 - t) % (RW + 6) + (RW + 6)) % (RW + 6) - 3;
        for (var i = 0; i < 3; i++) cell(xs + i, yy, K.wx.wind);
      }
    }
    if (wx === 'rain') {
      var cl = plan.glyphs[0] ? plan.glyphs[0].x : 2;
      [cl + 1, cl + 3, cl + 5, RW - 6, RW - 4].forEach(function (x, n) {
        if (x < 1 || x > RW - 2) return;
        var land = H, y;
        for (y = 4; y < H; y++) if (plan.bad[y * RW + x]) { land = y; break; }
        for (y = 4 + (n * 3 + t) % 5; y < land; y += 5) { cell(x, y, K.wx.rain); if (y + 1 < land) cell(x, y + 1, K.wx.rain); }
      });
    }
  }
  /* the scenes, each in its venue's room: its foot on the room's foot, at the place its sky was fitted to */
  function drawScenes() {
    var c = scv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, scv.width, scv.height);
    if (!pg.L) return;
    var K = pg.colours();
    S.scenes.forEach(function (a) {
      var P = a.slot.P, r = P.room;
      if (!r || a.a <= 0.001) return;
      var rows = a.A.frames[a.f] || a.A.frames[a.A.still], RW = r.x1 - r.x0, sk = a.slot.sky || { S: SKY, ox: Math.floor((RW - rows[0].length) / 2) };
      var H = rows.length + sk.S, x0 = r.x0, y0 = r.y1 - H;
      c.globalAlpha = a.a;
      /* (on its room's paper: a coastline the room lies over goes under it as the scene fades in) */
      c.fillStyle = K.bgC;
      c.fillRect(r.x0 * pg.L.u, r.y0 * pg.L.u, RW * pg.L.u, (r.y1 - r.y0) * pg.L.u);
      sky(c, a, sk, x0, y0, RW, H, K);
      sprite(c, rows, 0, x0 + sk.ox, r.y1 - 1, false, K, palOf(a.A, K), false);
      c.globalAlpha = 1;
    });
  }
  /* him walking or standing (fading against a scene with him in it), and the flag of the race pinned */
  function drawMan(now) {
    var c = tr.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, tr.width, tr.height);
    if (!pg.L) return;
    var K = pg.colours(), u = pg.L.u;
    if (S.flag && S.flag.f > 0) drawFlag(c, S.flag, K);
    var al = manAlpha();
    if (S.trip) {
      var w = tripAt(S.trip, now);
      if (Math.abs(w.dx) > 0.3) S.facing = w.dx < 0 ? -1 : 1;
      c.globalAlpha = al;
      var sn = Math.floor(w.s * pg.L.cs / 9) % 2;
      sprite(c, strideRows(sn), 4, Math.round(w.x), Math.round(w.y), S.facing < 0, K, null, true, strideHD(sn));
      c.globalAlpha = 1;
      /* on his way he passes behind the venues' rows, as he passes behind their names */
      S.PL.forEach(function (P) { if (P.LB) c.clearRect(P.LB.x0 * u, P.LB.y0 * u, (P.LB.x1 - P.LB.x0) * u, (P.LB.y1 - P.LB.y0) * u); });
    } else if (al > 0.004) {
      var st = standAt();
      if (st) { c.globalAlpha = al; sprite(c, standRows(), 4, st.fx, st.fy - (S.hopUp ? 1 : 0), false, K, null, true, standHD()); c.globalAlpha = 1; }
    }
    /* (for the checks: where he is, the scene playing, the flag, and how much of him shows outside a scene) */
    mapEl.setAttribute('data-man', JSON.stringify({ at: S.trip ? 'walking to ' + S.trip.P.name : S.act ? 'in the scene at ' + S.act.slot.P.name : pg.here() ? (pg.here().name || 'home') : '', scene: S.act ? S.act.slot.P.name + ':' + S.act.slot.sport : null, flag: S.flag ? S.flag.P.name + ':' + Math.round(S.flag.f * 100) / 100 : null, man: Math.round(al * 100) / 100, sc: Math.round((S.act ? S.act.a : S.left && S.scenes.indexOf(S.left) >= 0 ? S.left.a : 0) * 100) / 100 }));
  }
  /* the flag: the pole rises at the stop's corner (its place: build), then the pennant flies (a cell of paper round
     it all, but over no road) */
  /* (the pennant at the pole's top from the first frame, rising with it out from behind the stop's top edge: round
     5's check saw it only at 80% of the rise) */
  function drawFlag(c, F, K) {
    var P = F.P, q = P.sq, u = pg.L.u, fl = P.flag || { side: 1, dir: 1, h: FLAG_H, off: 0 }, x = fl.side > 0 ? q.x1 + (fl.off || 0) : q.x0 - (fl.off || 0), top = Math.max(1, Math.round(fl.h * Math.min(1, F.f))), cells = [], i, j;
    for (j = 1; j <= top; j++) cells.push([x, q.y0 - j, 0]);
    PENNANT.forEach(function (n, r) { var y = q.y0 - top + r; if (y < q.y0) for (i = 1; i <= n; i++) if (top >= fl.h || !pg.solidAt(x + fl.dir * i, y)) cells.push([x + fl.dir * i, y, 1]); });
    var set = {};
    cells.forEach(function (p) { set[p[0] + ',' + p[1]] = 1; });
    c.fillStyle = K.bgC;
    /* (its cell of paper, but never over a road, a medal, a picture or a stop: those show through) */
    cells.forEach(function (p) {
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var X = p[0] + dx, Y = p[1] + dy;
        if (set[X + ',' + Y] || (Y >= q.y0 - 1 && X >= q.x0 - 1 && X <= q.x1 + 1) || pg.solidAt(X, Y)) continue;
        c.fillRect(X * u, Y * u, u, u);
      }
    });
    if (!hdOn(u)) { cells.forEach(function (p) { c.fillStyle = p[2] ? K.red : K.inkC; c.fillRect(p[0] * u, p[1] * u, u, u); }); return; }
    /* (big screens: in half cells, on its own cells' paper: a slim pole on the pennant's side of its cell, a cap the
       cell's width on its top, the pennant's edge a straight diagonal; rising, as at 1x, over no road or picture) */
    c.fillStyle = K.bgC;
    cells.forEach(function (p) { c.fillRect(p[0] * u, p[1] * u, u, u); });
    var px = fl.dir > 0 ? 2 * x + 1 : 2 * x, ty = 2 * (q.y0 - top);
    c.fillStyle = K.inkC;
    half(c, 0, 0, u, px, ty, 1, 2 * top);
    half(c, 0, 0, u, 2 * x, ty, 2, 1);
    c.fillStyle = K.red;
    PENNANT2.forEach(function (n, r) {
      var y = ty + r;
      if (y >= 2 * q.y0) return;
      for (i = 1; i <= n; i++) {
        var X = fl.dir > 0 ? px + i : px - i;
        if (top < fl.h && pg.solidAt(X >> 1, y >> 1)) continue;
        half(c, 0, 0, u, X, y);
      }
    });
  }
  Object.assign(pg, { drawMan: drawMan, drawScenes: drawScenes, endAct: endAct, flagSync: flagSync, settle: settle, stopMotion: stopMotion, upMan: upMan, walkTo: walkTo });
}
