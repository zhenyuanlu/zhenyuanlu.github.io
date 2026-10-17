// The little figure (the draft's home script, "the traveller"): 9 x 13 pixels in a wide-brimmed hat on the level
// road, at its corner until a city is in hand; then he walks there (short walks stroll, long ones stride), leaves a
// faint print under the line at each step, hops on arrival and does the city's thing for the stage (a bicycle in
// Shanghai, a wave in Okinawa ...), mirrored when he stands on its right. Behind the cities as he passes them. By
// night his own colours, edged in moonlight. Now and then, standing, he blinks (the draft's; opts.blink: false
// leaves his eyes open). Reduced motion: he is simply there.
import { palAt } from './colour.js';
import { clamp, hrank, put, r3 } from './util.js';

export function installFigure(hm) {
  var ACT2 = hm.ACT2, ALTI = hm.ALTI, DATA = hm.DATA, flow = hm.flow, phone = hm.phone, reduced = hm.reduced, root = hm.root, sceneOf = hm.sceneOf, walkEl = hm.walkEl;
  Object.assign(hm, { actOf: actOf, actRestage: actRestage, blinkLater: blinkLater, corner: corner, cx: cx, drawPrints: drawPrints, drawW: drawW, frame: frame, fx: fx, hop: hop, iconFrame: iconFrame, placeW: placeW, restX: restX, sizePrints: sizePrints, startAct: startAct, stopAct: stopAct, walkTo: walkTo });
  /* ---------- the traveller ----------
     He starts at the road's corner and keeps his place between visits. Resting on a city sends him
     there: he stops beside it, on the side he came from, just clear of its weather. Short walks stroll,
     long ones stride, never faster than VMAX; his legs change with the ground covered (a stride grows a
     little with speed, so they never flicker), each step leaves a faint dot under the line that fades
     within 8 s, and he hops once on arrival. Passing a city he goes behind it (behind the paper inside its
     outline). Arrived, he does the thing of the city's scene for the stage (DATA.acts2: by day in v1e a bicycle in
     Shanghai, a wave in Okinawa, a guitar in Austin, a horse in Dallas, a tea chest in Boston), drawn for him
     standing on the city's left and mirrored on its right, in the stage's palette. If the stage changes while
     he is at it, the new thing dissolves in over the old one, pixel by pixel (XA ms). Reduced motion: he is
     simply there, and the city's thing is one still frame. */
  var prints = walkEl.querySelector('.prints'), pctx = prints.getContext('2d', { willReadFrequently: true });
  var walker = { el: walkEl.querySelector('.walker'), x: 0, at: -1, side: 'l', to: -1, dir: 1, walking: false, raf: 0, end: 0, f: '', flip: false, blink: false, bt: 0,
                 w: 9, h: 13, fa: 4, act: null, actT: 0 };
  var V0 = 240, VK = .9, VMAX = 520, CAD = 15, LEAD = 60, arriveT = 0;
  hm.U = 2;
  /* 9 x 13: standing (facing you, a wide-brimmed hat), and two strides seen from the side, pack on his
     back, scarf flying; k ink, s scarf, e eyes (closed for a blink now and then) */
  var SPRITE = {
    idle: ['..kkkkk..', '.kkkkkkk.', 'kkkkkkkkk', '.k.....k.', '.k.e.e.k.', '.k.....k.', '..kkkkk..', '..sssss..', '.k.kkk.k.', '.k.kkk.k.', '...kkk...', '...k.k...', '..kk.kk..'],
    a: ['..kkkkk..', '.kkkkkkk.', '.kkkkkkkk', '..k....k.', '..k..e.k.', '..k....k.', '...kkkkk.', '.ssss....', 'kk.kkkk..', 'kk.kkk.k.', 'kk.kkk...', '..k...k..', '.kk...kk.'],
    b: ['..kkkkk..', '.kkkkkkk.', '.kkkkkkkk', '..k....k.', '..k..e.k.', '..k....k.', '...kkkkk.', 'sssss....', 'kk.kkkk..', 'kk.kkkk..', 'kk.kkk...', '...kk....', '...kkk...']
  };
  var SCARF = [196, 56, 27];
  /* by night he keeps his own colours instead of turning into a light negative of himself: a dark slate coat
     and hat, his face a moonlit cream, the red scarf, and an edge of moonlight all round, so he still stands
     off the night paper */
  var NIGHTW = { k: [43, 48, 64], rim: [96, 106, 132], face: [214, 204, 187], e: [19, 20, 24], s: [226, 96, 74] };
  var FACES = new Map();
  /* his face in one drawing: the empty cells his eyes reach without leaving it (none when they reach the
     edge, or when he has no eyes, seen from behind) */
  function faceOf(rows) {
    var F = FACES.get(rows);
    if (F) return F;
    var h = rows.length, w = rows[0].length, seen = {}, todo = [], leak = false;
    F = {};
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (rows[j][i] === 'e') todo.push(j * w + i);
    while (todo.length) {
      var k = todo.pop(), x = k % w, y = (k - x) / w;
      if (seen[k]) continue;
      seen[k] = true;
      if (rows[y][x] === '.') F[k] = true;
      for (var d = 0; d < 4; d++) {
        var a = x + [1, -1, 0, 0][d], b = y + [0, 0, 1, -1][d];
        if (a < 0 || b < 0 || a >= w || b >= h) { leak = true; continue; }
        if (rows[b][a] === '.' && !seen[b * w + a]) todo.push(b * w + a);
      }
    }
    if (leak) F = {};
    FACES.set(rows, F);
    return F;
  }
  var wctx = walker.el.getContext('2d', { willReadFrequently: true }), wimg = wctx.createImageData(9, 13);
  var XA = 260;
  function actOf(id, sg) { return ACT2[sceneOf(id, sg).act] || null; }
  /* a drawing of him: rows, size, the column of his feet, mirrored or not, its palette and its shift in cells */
  function actLayer(A, f, mirror, dx, dy, sg) {
    return { rows: A.frames[f] || A.frames[A.still], w: A.w, h: A.h, ax: A.ax, flip: mirror, pal: hm.onPaper(palAt(A, sg), sg), sx: mirror ? -dx : dx, sy: dy };
  }
  /* the canvas takes the size of what he is drawn as (9 x 13 standing or walking, larger doing a city's thing,
     the union of both while one thing dissolves into another). Its bottom row stands on the line at Y 0 (lower
     when a thing shifts him down); fa is the column of his feet */
  function sizeW(w, h, fa, y0) {
    if (walker.el.width !== w || walker.el.height !== h) { walker.el.width = w; walker.el.height = h; wimg = wctx.createImageData(w, h); }
    walker.w = w; walker.h = h; walker.fa = fa;
    var es = walker.el.style;
    es.width = r3(w * hm.U) + 'px'; es.height = r3(h * hm.U) + 'px';
    /* big screens (2026-10-09): his box on the device grid by its own place (the road's fraction, measured in layout());
       placeW() moves him along the road by whole cells only */
    es.left = (walker.ox || 0) + 'px'; es.top = ((y0 - 1) * hm.U + (walker.oy || 0)) + 'px';
  }
  /* a canvas, drawn cell by cell and scaled with nearest-neighbour, so he stays crisp wherever the road falls */
  function drawW() {
    var act = walker.act, L = [], x = 1;
    if (act) {
      L.push(actLayer(act.A, act.f, act.mirror, act.dx, act.dy, act.sg));
      if (act.X) {
        x = clamp((performance.now() - act.X.t0) / XA, 0, 1);
        if (x >= 1) act.X = null;
        else { var o = act.X.L; L.push(o.A ? actLayer(o.A, o.f, o.mirror, o.dx, o.dy, o.sg) : o); }
      }
    } else L.push({ rows: SPRITE[walker.f] || SPRITE.idle, w: 9, h: 13, ax: 4, flip: walker.flip, pal: null, sx: 0, sy: 0 });
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    L.forEach(function (l) {
      l.a = l.flip ? l.w - 1 - l.ax : l.ax;
      x0 = Math.min(x0, l.sx - l.a); x1 = Math.max(x1, l.sx - l.a + l.w - 1);
      y0 = Math.min(y0, l.sy - l.h + 1); y1 = Math.max(y1, l.sy);
    });
    var W = x1 - x0 + 1, H = y1 - y0 + 1;
    sizeW(W, H, -x0, y0);
    var D = wimg.data, K = hm.ink(), NT = hm.dark(), NW = NIGHTW, two = L.length > 1;
    D.fill(0);
    L.forEach(function (l, n) {
      var F = NT ? faceOf(l.rows) : null;
      function open(a, b) {                   /* off the drawing, or an empty cell that is not his face */
        return a < 0 || b < 0 || a >= l.w || b >= l.h || (l.rows[b][a] === '.' && !F[b * l.w + a]);
      }
      for (var j = 0; j < l.h; j++) for (var i = 0; i < l.w; i++) {
        var si = l.flip ? l.w - 1 - i : i, c = l.rows[j][si];
        if (c === '.' && !(F && F[j * l.w + si])) continue;
        var X = l.sx - l.a + i, Y = l.sy - l.h + 1 + j;
        if (two && (hrank(X, Y) < x) !== (n === 0)) continue;   /* the new drawing where its rank has come, the old elsewhere */
        var col;
        if (!NT) col = c === 'k' || (c === 'e' && !walker.blink) ? K : c === 's' ? SCARF : l.pal && l.pal[c];
        else if (c === '.') col = NW.face;
        else if (c === 'k') col = open(si - 1, j) || open(si + 1, j) || open(si, j - 1) || open(si, j + 1) ? NW.rim : NW.k;
        else if (c === 'e') col = walker.blink ? NW.face : NW.e;
        else if (c === 's') col = NW.s;
        else col = l.pal && l.pal[c];
        if (col) put(D, (Y - y0) * W + X - x0, col, 255);
      }
    });
    wctx.putImageData(wimg, 0, 0);
  }
  /* his city's thing: the sequence plays from the clock; dx/dy shift the whole drawing by whole cells.
     X: the drawing he was just doing, which dissolves out as this one comes in */
  function startAct(i, X) {
    var A = actOf(hm.cities[i].id, hm.stage);
    stopAct(true);
    if (!A) return;
    if (A.hold && hm.cities[i].mode !== 'held') return;   /* a thing he stays at only while the city is in hand */
    var act = walker.act = { A: A, i: i, sg: hm.stage, mirror: walker.side === 'r', f: A.still, dx: 0, dy: 0, t0: performance.now(), raf: 0, tm: 0, drawn: false, ic: '', icKey: '', X: reduced() ? null : X || null };
    if (reduced()) {
      if (A.hold) { inIcon(act, A.hold.still); drawW(); placeW(); return; }   /* simply in there, until let go */
      drawW(); placeW(); act.tm = hm.later(function () { stopAct(); }, 1200); return;
    }
    var total = A.sequence.reduce(function (t, q) { return t + q.ms; }, 0);
    var loop = A.hold && A.hold.loop, round = loop ? loop.reduce(function (t, q) { return t + q.ms; }, 0) : 0;
    act.raf = hm.raf(function step(now) {
      if (walker.act !== act) return;
      var t = now - act.t0, acc = 0, q = null, seq = A.sequence;
      if (t >= total) {
        if (!round) { stopAct(); return; }
        t = (t - total) % round; seq = loop;    /* a thing he stays at (inside Boston's house) plays round until let go */
      }
      for (var k = 0; k < seq.length; k++) { acc += seq[k].ms; if (t < acc) { q = seq[k]; break; } }
      if (q && q.ic) inIcon(act, q.ic);
      if (q && (q.f !== act.f || (q.dx || 0) !== act.dx || (q.dy || 0) !== act.dy || !act.drawn || act.X)) {
        act.f = q.f; act.dx = q.dx || 0; act.dy = q.dy || 0; act.drawn = true;
        drawW(); placeW();
      }
      act.raf = hm.raf(step);
    });
  }
  /* the stage changed while he was at it: the same thing in the new stage's colours, or the new stage's thing */
  function actRestage(now) {
    var act = walker.act;
    if (!act || act.sg === hm.stage) return;
    var A2 = actOf(hm.cities[act.i].id, hm.stage), old = { A: act.A, f: act.f, mirror: act.mirror, dx: act.dx, dy: act.dy, sg: act.sg };
    if (A2 === act.A) {
      act.sg = hm.stage;
      if (!reduced()) act.X = { L: old, t0: now };
      drawW(); placeW();
    } else if (A2) startAct(act.i, { L: old, t0: now });
    else stopAct();
  }
  function stopAct(quiet) {
    var act = walker.act;
    hm.clear(walker.actT);
    if (!act) return;
    hm.caf(act.raf); hm.clear(act.tm);
    walker.act = null;
    if (act.ic) {                              /* he has left the house: its window shows the room without him */
      var st = hm.cities[act.i];
      if (st.P && st.P.frameIn === act.icKey) { st.P = hm.drawOf(st, act.icKey); hm.paint(st); }
    }
    if (!quiet) { walker.f = ''; frame('idle'); placeW(); }
  }
  /* a scene icon drawn in frames (Boston's house by night: the fire, the lights, and him inside once he has
     gone in): his act names the frame to show. Each frame is a drawing of its own, made once */
  function iconFrame(st, key, name) {
    var A = ALTI[key];
    if (!A || name === 'base') return hm.drawOf(st, key);
    if (!A.frames || !A.frames[name]) return null;
    var ck = key + '#' + name;
    if (!st.draws[ck]) {
      var S = Object.create(A);
      S.co = A.frames[name];
      st.draws[ck] = hm.iconOf(DATA.icons[st.id], 7 + st.i, S, st.W, st.H);
      st.draws[ck].frameIn = key;
    }
    return st.draws[ck];
  }
  function inIcon(act, name) {
    if (!name || act.ic === name) return;
    var st = hm.cities[act.i], key = sceneOf(st.id, act.sg).icon, P = iconFrame(st, key, name);
    if (!P || st.mode === 'rest') return;
    if (st.P !== hm.drawOf(st, key) && st.P.frameIn !== key) return;   /* the city shows another stage's scene by now */
    act.ic = name; act.icKey = key;
    if (st.P !== P) { st.P = P; hm.paint(st); }
  }
  function frame(f) { if (walker.f !== f) { walker.f = f; drawW(); } }
  /* now and then, standing, he blinks */
  function blinkLater() {
    hm.clear(walker.bt);
    if (reduced() || hm.blink === false) return;
    walker.bt = hm.later(function () {
      if (walker.f !== 'idle' || document.hidden) { blinkLater(); return; }
      walker.blink = true; drawW();
      walker.bt = hm.later(function () { walker.blink = false; drawW(); blinkLater(); }, 170);
    }, 5200 + Math.random() * 2400);
  }
  function fx() { return flow.getBoundingClientRect(); }
  function cx(i) { return hm.cities[i].li.getBoundingClientRect().left - fx().left; }
  function corner() { return (phone() ? 30 / 350 : 300 / 960) * fx().width + 4.5 * hm.U + 1; }
  /* his feet stand 6 cells clear of the icon's edge (24 cells from the centre of a 36-cell icon): room for his
     city's thing, which reaches 4 cells toward the city and 14 away from it */
  function off(i) {
    var gap = cx(1) - cx(0), st = hm.cities[i], hw = st && st.mode !== 'rest' ? st.P.w / 2 : 18;   /* clear of what the city shows */
    return Math.min((hw + 6) * hm.U, gap / 2 - hm.U);
  }
  function restX(i, side) { return cx(i) + (side === 'l' ? -1 : 1) * off(i); }
  /* he moves in whole sprite pixels, rounded to device pixels so he stays crisp */
  function placeW() {
    var dpr = window.devicePixelRatio || 1, step = Math.max(1, Math.round(hm.U * dpr)) / dpr;
    /* drawW() has put his feet at column fa, with any shift of his thing already in the drawing. The road sits at RY/900
       of the height, rarely a whole pixel: his box is put on the device grid by its own place (sizeW, from layout()),
       and the transform moves him by whole cells of whole device pixels only (big screens, 2026-10-09: a fraction there
       was drawn off the grid, his top row of cells blending into the paper, at every zoomed size and at 125%) */
    var tx = Math.round((walker.x - (walker.fa + .5) * hm.U) / step) * step;
    walker.el.style.transform = 'translate(' + tx + 'px,0px)';
  }
  /* footprints: one faint dot (a cell wide, a pixel high) just under the line at each step, kept as a fraction
     of the road so a resize keeps it; each holds for PHOLD, then fades out by PLIFE */
  var steps = [], pT = 0, PHOLD = 2000, PLIFE = 8000, PA = .22;
  function frac(px) { var a = corner(), b = cx(hm.cities.length - 1); return (px - a) / (b - a); }
  function lay(x) { steps.push({ f: frac(x), t: performance.now() }); drawPrints(); }
  function sizePrints() {
    var dpr = window.devicePixelRatio || 1, w = Math.ceil(fx().width), o = walkEl.getBoundingClientRect();
    prints.width = Math.round(w * dpr); prints.height = Math.round(3 * dpr);
    /* big screens (2026-10-09): its CSS size its backing's own (3 CSS px made whole device pixels, never resampled) */
    prints.style.width = prints.width / dpr + 'px'; prints.style.height = prints.height / dpr + 'px';
    /* its top row starts a pixel and a half below the line's centre, on the device grid (by its place, not a transform) */
    var ox = Math.round(o.left * dpr) / dpr - o.left, oy = Math.round((o.top + 1.5) * dpr) / dpr - o.top;
    prints.style.transform = 'none'; prints.style.left = ox + 'px'; prints.style.top = oy + 'px';
  }
  function drawPrints() {
    hm.clear(pT); pT = 0;
    var now = performance.now(), dpr = window.devicePixelRatio || 1;
    steps = steps.filter(function (s) { return now - s.t < PLIFE; });
    pctx.clearRect(0, 0, prints.width, prints.height);
    if (!steps.length) return;
    var a = corner(), b = cx(hm.cities.length - 1), w = Math.max(1, Math.round(hm.U * dpr)), h = Math.max(1, Math.round(dpr));
    pctx.fillStyle = getComputedStyle(root).getPropertyValue('--line').trim() || '#6b6b6b';
    steps.forEach(function (s) {
      var age = now - s.t;
      pctx.globalAlpha = PA * (age < PHOLD ? 1 : 1 - (age - PHOLD) / (PLIFE - PHOLD));
      pctx.fillRect(Math.round((a + s.f * (b - a)) * dpr - w / 2), 0, w, h);
    });
    pctx.globalAlpha = 1;
    pT = hm.later(drawPrints, 125);
  }
  function hop() {
    if (reduced()) return;
    var e = walker.el;
    e.classList.remove('hop'); void e.offsetWidth; e.classList.add('hop');
  }
  hm.listen(walker.el, 'animationend', function (e) { if (e.animationName === 'hop') walker.el.classList.remove('hop'); });
  /* returns how long the walk will take, in ms */
  function walkTo(i) {
    var W = walker;
    if (W.at === i && !W.walking) { if (!W.act) hop(); arrive(i); return 0; }
    if (W.walking && W.to === i) return Math.max(0, W.end - performance.now());
    var side = cx(i) >= W.x ? 'l' : 'r', tx = restX(i, side), dx = tx - W.x, dist = Math.abs(dx);
    hm.caf(W.raf);
    stopAct();
    W.to = i; W.side = side;
    if (dist >= 1) W.dir = dx > 0 ? 1 : -1;
    if ((W.dir < 0) !== W.flip) { W.flip = W.dir < 0; drawW(); }   /* facing the way he goes */
    if (dist < 1 || reduced()) {
      W.walking = false; W.x = tx; W.at = i; placeW();
      frame('idle');
      hop(); arrive(i);
      return 0;
    }
    var v = Math.min(VMAX, V0 + VK * dist), D = dist / v * 1000, x0 = W.x, t0 = performance.now();
    var stride = Math.max(5 * hm.U, v / CAD), led = false;
    W.walking = true; W.at = -1; W.end = t0 + D;
    W.raf = hm.raf(function step(now) {
      var p = Math.min(1, (now - t0) / D);
      W.x = x0 + dx * p;
      placeW();
      var fr = Math.floor(Math.abs(W.x - x0) / stride) % 2 ? 'b' : 'a';
      if (fr !== W.f) lay(W.x);               /* a foot comes down */
      frame(fr);
      /* the burst leads his last step a little, so its first cells land with the hop */
      if (!led && (1 - p) * D <= LEAD) { led = true; W.at = i; arrive(i); }
      if (p < 1) { W.raf = hm.raf(step); return; }
      W.walking = false; W.at = i;
      frame('idle');
      hop();
    });
    return D;
  }
  /* he has reached city i: its weather, if the visit was meant (the city is still in hand, or was held
     for DWELL ms; a pointer sweeping along the road only sends him walking) */
  function arrive(i) {
    var st = hm.cities[i];
    hm.clear(arriveT);
    if (st.mode === 'held') {
      var wait = hm.DWELL - (performance.now() - st.hs);
      if (wait > 0) { arriveT = hm.later(function () { if (st.mode === 'held' && walker.at === i) hm.burst(i); }, wait); return; }
      hm.burst(i);
    } else if (st.held >= hm.DWELL) hm.burst(i);
  }
  Object.assign(hm, { walker: walker });
}
