// The line and the road (the draft's home script, "the line leaves from the point after Northeastern."): measured
// from the point at the sentence's end, the one hairline drawn down past build and teach, along the slant past see,
// blog and race (on a phone: down the right, across, down the left) and into the level road under the cities; its
// runs on whole device pixels. Its samples, read once a drawing, seat the doors on it (doors.js seat).
import { clamp, r, r3 } from './util.js';

export function installPath(hm) {
  var dot = hm.dot, flow = hm.flow, lineD = hm.lineD, lineM = hm.lineM, phone = hm.phone;
  Object.assign(hm, { route: route, sampleLine: sampleLine });
  var dotY = { d: 200, m: 173 };             /* where the line starts, in each drawing's own units */
  /* the line on whole device pixels: an upright run's middle, and a level run's, on a device pixel's middle (lineW
     device pixels wide); the road's top edge right under the icons' feet. In the drawing's own units, to 0.001 */
  hm.X1s = hm.X1;
  function onPx(u, o, len, W) {
    var dpr = window.devicePixelRatio || 1, px = o + u / W * len;
    var c = Math.abs(dpr - Math.round(dpr)) < 1e-6 ? Math.floor(px) + .5 : (hm.lineW % 2 ? Math.floor(px * dpr) + .5 : Math.round(px * dpr)) / dpr;
    return r3((c - o) / len * W);
  }
  function underPx(u, o, len, W) {
    var dpr = window.devicePixelRatio || 1, px = o + u / W * len;
    return r3(((Math.round(px * dpr) + hm.lineW / 2) / dpr - o) / len * W);
  }
  function route() {
    var f = flow.getBoundingClientRect(), o = dot.getBoundingClientRect();
    if (!f.width || !f.height || !o.width) return;
    var P = phone(), W = P ? 350 : 960, H = P ? 844 : 900;
    var x = r((o.left + o.width / 2 - f.left) / f.width * W);
    var y = r((o.top + o.height / 2 - f.top) / f.height * H);
    var lw = r3(hm.lineW / (window.devicePixelRatio || 1)) + 'px';
    lineD.style.strokeWidth = lw; lineM.style.strokeWidth = lw;
    if (P) {
      hm.spread(f);
      dotY.m = y;
      /* the run sits a little right of the point */
      hm.RM = r(clamp(x + 30, 214, 236));
      var rm = onPx(hm.RM, f.left, f.width, W), lm = onPx(hm.LM, f.left, f.width, W), yl = onPx(y, f.top, f.height, H);
      var ry = underPx(hm.RYM, f.top, f.height, H);
      flow.style.setProperty('--rm', rm);
      flow.style.setProperty('--lm', lm);
      var mm = r((hm.RAM + hm.RBM) / 2), head;
      if (x <= rm - 22) head = ' H' + r3(rm - 20) + ' C' + r3(rm - 9) + ' ' + yl + ' ' + rm + ' ' + r3(yl + 9) + ' ' + rm + ' ' + r3(yl + 20);
      else {
        /* a wide face can end the sentence right of the run: the line hooks down off the point and swings back
           under the sentence's end to the run, instead of running back through the words */
        var hx = onPx(x + 14, f.left, f.width, W);
        head = ' H' + r3(hx - 10) + ' C' + r3(hx - 2) + ' ' + yl + ' ' + hx + ' ' + r3(yl + 6) + ' ' + hx + ' ' + r3(yl + 14) +
          ' C' + hx + ' ' + r3(yl + 34) + ' ' + rm + ' ' + r3(yl + 26) + ' ' + rm + ' ' + r3(yl + 46);
        dotY.m = r(y + 26);
      }
      lineM.setAttribute('d', 'M' + x + ' ' + yl + head +
        ' V' + hm.RAM + ' C' + rm + ' ' + mm + ' ' + lm + ' ' + mm + ' ' + lm + ' ' + hm.RBM +
        ' V' + r3(ry - 22) + ' C' + lm + ' ' + r3(ry - 8) + ' ' + r3(lm + 8) + ' ' + ry + ' ' + r3(lm + 22) + ' ' + ry + ' H362');   /* on past Boston's icon */
    } else {
      dotY.d = y;
      hm.lift(f, y);
      var x1 = hm.X1s = onPx(hm.X1, f.left, f.width, W), xl = onPx(hm.XL, f.left, f.width, W), yd = onPx(y, f.top, f.height, H);
      var rd = underPx(hm.RY, f.top, f.height, H), h = hm.RB - hm.RA, c = r(h * hm.SLANT);
      lineD.setAttribute('d', 'M' + x + ' ' + yd + ' H' + r3(x1 - 36) + ' C' + r3(x1 - 14) + ' ' + yd + ' ' + x1 + ' ' + r3(yd + 14) + ' ' + x1 + ' ' + r3(yd + 36) +
        ' V' + hm.RA + ' C' + x1 + ' ' + r(hm.RA + c) + ' ' + xl + ' ' + r(hm.RB - c) + ' ' + xl + ' ' + hm.RB +
        ' V' + r3(rd - 30) + ' C' + xl + ' ' + r3(rd - 10) + ' ' + r3(xl + 10) + ' ' + rd + ' ' + r3(xl + 30) + ' ' + rd + ' H960');   /* on past Boston's icon */
    }
    if (typeof hm.seat === 'function') hm.seat();
  }
  /* the stations: level with the middle of each grey line, x read off the drawn line; on the slant each block of
     words moves off it just as far as its lowest corner needs (--sh), so they keep clear of it all the way down */
  /* (the points are kept with the path's "d": the page lays out four times as it starts (its script, the fonts twice,
     load), and reading the same 896 points off the same line took 36-40ms each time, one task of 120ms right after
     load with everything queued behind it. A new window draws a new line, and that is read afresh) */
  var sampleD = null, samplePts = null;
  function sampleLine(path) {
    var d = path.getAttribute('d');
    if (d != null && d === sampleD) return samplePts;
    var T = path.getTotalLength ? path.getTotalLength() : 0, pts = [];
    for (var s = 0; s <= T; s += 2) { var q = path.getPointAtLength(s); pts.push([q.x, q.y]); }
    sampleD = d; samplePts = pts;
    return pts;
  }
  Object.assign(hm, { dotY: dotY });
}
