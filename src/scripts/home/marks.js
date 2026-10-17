// The four marks under the sentence (the draft's home script): GitHub, LinkedIn, Twitter and Instagram as pixel
// marks of 11 x 11 cells, grey at rest; in hand their cells turn to their own colour one by one; a tap goes straight
// through. Their links are the server's (render.js: those whose mark the art has, model.js homeData).
import { rgb } from './colour.js';
import { clamp, put, rng } from './util.js';

export function installMarks(hm) {
  var DATA = hm.DATA, reduced = hm.reduced, flow = hm.flow;
  Object.assign(hm, { drawMark: drawMark });
  /* ---------- the four marks under the intro ----------
     11 x 11 cells of the road's pixel (about 1.5 CSS px on a phone, never finer than the road's), grey at rest. Resting on one (or keyboard
     focus), its cells turn to its own colour one by one in a fixed shuffled order, in SIN ms; let go, they
     go back to grey, the last in first out, in SOUT ms. GitHub's colour is the ink; Instagram's runs in
     five bands from the lower left to the upper right. Reduced motion: the colour is simply there. A tap
     goes straight through. */
  var SOC = DATA.social, SNN = SOC.n, SIN = 240, SOUT = 420;
  var IGB = SOC.colour.instagram.bands.map(rgb);
  var socials = [].slice.call(flow.querySelectorAll('.soc a')).filter(function (a) { return !!SOC.glyphs[a.getAttribute('data-mark')]; }).map(function (a, i) {
    var id = a.getAttribute('data-mark'), g = SOC.glyphs[id], cv = a.querySelector('canvas'), order = [];
    for (var j = 0; j < SNN; j++) for (var x = 0; x < SNN; x++) if (g[j][x] === 'x') order.push(j * SNN + x);
    var R = rng(211 + i);
    for (var m = order.length - 1; m > 0; m--) { var q = Math.floor(R() * (m + 1)), t = order[m]; order[m] = order[q]; order[q] = t; }
    cv.width = SNN; cv.height = SNN;
    var ctx = cv.getContext('2d');
    return { a: a, id: id, cv: cv, ctx: ctx, img: ctx.createImageData(SNN, SNN), order: order, p: 0, raf: 0 };
  });
  function markColour(s, k) {
    if (s.id === 'github') return hm.ink();
    if (s.id === 'instagram') { var x = k % SNN, y = (k - x) / SNN; return IGB[Math.round((x + SNN - 1 - y) / (2 * (SNN - 1)) * 4)]; }
    var c = SOC.colour[s.id];
    return rgb(hm.dark() ? c.night : c.day);
  }
  function drawMark(s) {
    var D = s.img.data, n = Math.round(s.p * s.order.length), G0 = hm.tok().grey;
    D.fill(0);
    for (var q = 0; q < s.order.length; q++) put(D, s.order[q], q < n ? markColour(s, s.order[q]) : G0, 255);
    s.ctx.putImageData(s.img, 0, 0);
  }
  function aim(s, to) {
    hm.caf(s.raf);
    var p0 = s.p, dur = (to > p0 ? SIN : SOUT) * Math.abs(to - p0), t0 = performance.now();
    if (reduced() || dur < 1) { s.p = to; drawMark(s); return; }
    s.raf = hm.raf(function f(now) {
      s.p = p0 + (to - p0) * clamp((now - t0) / dur, 0, 1);
      drawMark(s);
      if (s.p !== to) s.raf = hm.raf(f);
    });
  }
  socials.forEach(function (s) {
    hm.listen(s.a, 'pointerenter', function (e) { if (e.pointerType !== 'touch') aim(s, 1); });
    hm.listen(s.a, 'pointerleave', function (e) { if (e.pointerType !== 'touch' && !(document.activeElement === s.a && hm.kbd(s.a))) aim(s, 0); });
    hm.listen(s.a, 'focus', function () { if (hm.kbd(s.a)) aim(s, 1); });
    hm.listen(s.a, 'blur', function () { if (!s.a.matches(':hover')) aim(s, 0); });
    drawMark(s);
  });
  Object.assign(hm, { socials: socials });
}
