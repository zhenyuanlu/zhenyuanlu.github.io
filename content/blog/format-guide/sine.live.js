// sine.live.js: the format guide's live figure (<LiveFigure name="sine" .../>). One second of a sine wave, exact to
// the device pixel; the slider sets its frequency, play slides the second along at a tenth of real speed. The axis
// and its tenths in the hairline's colour, the wave in ink, the point where the second begins, and the two ends of
// the second in grey. The page owns play, the sliders, the still at rest and the rule that nothing moves by itself.
export default {
  label: 'one second of a sine wave',
  ratio: 3.4,
  min: 120,
  max: 230,
  controls: [{ id: 'f', label: 'frequency', min: 1, max: 6, step: 0.5, value: 2, unit: 'Hz' }],
  draw(g) {
    const c = g.ctx, w = g.w, h = g.h, px = g.px, f = g.v.f, s = 0.1 * g.t, pad = 6, top = 10, bot = h - 26;
    const mid = Math.round((top + bot) / 2 / px) * px + px / 2, A = (bot - top) / 2 - 4, x0 = pad, x1 = w - pad;
    const y = (x) => mid - A * Math.sin(2 * Math.PI * f * ((x - x0) / (x1 - x0) + s));
    c.globalAlpha = 0.45; c.fillStyle = g.line;
    c.fillRect(x0, mid - px / 2, x1 - x0, px);
    for (let k = 0; k <= 10; k++) { const xt = Math.round((x0 + (x1 - x0) * k / 10) / px) * px; c.fillRect(xt - px / 2, mid - (k % 5 ? 3 : 5), px, k % 5 ? 6 : 10); }
    c.globalAlpha = 1;
    c.strokeStyle = g.ink; c.lineWidth = 1.5; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    for (let x = x0; x <= x1 + 1e-6; x += px) { if (x === x0) c.moveTo(x, y(x)); else c.lineTo(x, y(x)); }
    c.stroke();
    c.fillStyle = g.ink; c.beginPath(); c.arc(x0, y(x0), 2.5, 0, 2 * Math.PI); c.fill();
    c.fillStyle = g.grey; c.font = '12px ' + (g.font || 'sans-serif'); c.textBaseline = 'alphabetic';
    c.textAlign = 'left'; c.fillText(s.toFixed(2) + ' s', x0, h - 6);
    c.textAlign = 'right'; c.fillText((s + 1).toFixed(2) + ' s', x1, h - 6);
  },
};
