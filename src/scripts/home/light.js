// The light on the home (the draft's home script, "the crossfader", less the fader itself: scripts/fader.js is the
// site's and tells every page 'zl:stage'): the stage's own ink and grey from the fader's place, the paper there is,
// and every drawing of the home repainted as the light moves; across the cut from dusk to night (html.xf, 200ms)
// they follow the paper and the ink frame by frame. The stage's scenes change at 33/34 and 66/67 (cities.js restage).
import { PAPER, cssRGB, rgb } from './colour.js';

export function installLight(hm) {
  var F = hm.F, root = hm.root, reduced = hm.reduced;
  Object.assign(hm, { dark: dark, ink: ink, onPaper: onPaper, paper: paper, tok: tok, repaint: repaint, light: light });
  function dark() { return root.getAttribute('data-theme') === 'dark'; }
  /* the stage's own ink and grey, from the fader (the same numbers the pre-paint script sets) */
  var tokC = { v: -1 };
  function tok() {
    if (tokC.v !== hm.fv) { var c = F.colours(hm.fv); tokC = { v: hm.fv, ink: rgb(c.ink), grey: rgb(c.grey) }; }
    return tokC;
  }
  function ink() { return tok().ink; }
  /* the paper drifts inside a stage (day warms toward dusk over 0..50, dusk deepens a touch by 66), but each stage's
     palettes are drawn for that stage's own paper: they are printed on the paper there is (each channel times
     paper / the stage's paper, never brighter, and no channel above the paper's), so no white or pale cool cell
     sits paler than the paper under it */
  function onPaper(P, sg) {
    if (sg === 'night') return P;
    var ref = PAPER[sg], f = [0, 1, 2].map(function (i) { return Math.min(1, hm.paperC[i] / ref[i]); });
    var key = hm.paperC.join(), C = P.__on;
    if (C && C.key === key) return C.v;
    var v = Array.isArray(P) ? [] : {};
    for (var k in P) { var c = P[k]; v[k] = c ? [0, 1, 2].map(function (i) { return Math.min(c[i] * f[i], hm.paperC[i]); }) : c; }
    Object.defineProperty(P, '__on', { value: { key: key, v: v }, writable: true, configurable: true, enumerable: false });
    return v;
  }
  /* the light moved (the fader's 'zl:stage', v its new place, 0..100; the page's colours are already set): the hover
     scenes swap at 33/34 and 66/67, ink, grey and paper move with the fader and every canvas follows; the cut from
     dusk to night crossfades (the draft's setFade, its home's half) */
  function light(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    var flip = (v >= 67) !== (hm.fv >= 67), sg = F.stage(v);
    hm.fv = v;
    if (sg !== hm.stage) { hm.stage = sg; hm.restage(); }
    repaint();
    if (flip && !reduced()) xfRun();
  }
  /* during the cut's 200ms crossfade every canvas follows the paper and ink as they move, frame by frame, so
     no icon's backing or line art is left a stage behind (a dark block on light paper, or the reverse) */
  var xfRaf = 0;
  function xfRun() {
    var t0 = performance.now();
    hm.caf(xfRaf);
    xfRaf = hm.raf(function f(now) {
      var live = now - t0 < 260, cs = getComputedStyle(root), c = F.colours(hm.fv);
      tokC = live ? { v: hm.fv, ink: cssRGB(cs.getPropertyValue('--ink'), rgb(c.ink)), grey: cssRGB(cs.getPropertyValue('--grey'), rgb(c.grey)) } : { v: -1 };
      repaint();
      xfRaf = live ? hm.raf(f) : 0;
    });
  }
  function paper() { return cssRGB(getComputedStyle(root).getPropertyValue('--bg'), PAPER[hm.stage]); }
  hm.paperC = PAPER.day;
  /* (the fader's own stops are scripts/fader.js's) */
  function repaint() {
    hm.paperC = paper();
    hm.cities.forEach(hm.paint);
    if (hm.cities.some(function (st) { return st.X; })) hm.run();
    hm.socials.forEach(hm.drawMark);
    hm.lettersPaint();
    hm.doorsPaint();
    hm.drawW();
    hm.cities.forEach(function (st) { if (st.B.still) hm.wxDraw(st, st.B.E.still, st.i + 1, 1); });
  }
}
