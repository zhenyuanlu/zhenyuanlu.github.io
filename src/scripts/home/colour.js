// The home's colour helpers (the draft's home script): hex and computed colours as numbers, and each drawing's
// palette per stage of the light. Pure; a palette worked out is kept on its drawing (the art's own objects).

export function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }

export function luma(c) { return (.3 * c[0] + .59 * c[1] + .11 * c[2]) / 255; }

/* a computed colour (#rrggbb, or rgb() while a registered colour is mid-transition) as [r, g, b] */
export function cssRGB(v, fb) {
  var m; v = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return rgb(v);
  if ((m = v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/))) return [+m[1], +m[2], +m[3]];
  return fb;
}

export function mixC(a, b, t) { return [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t), a[2] * t + b[2] * (1 - t)]; }

/* ---------- the stages and their colours ----------
   day 0..33, dusk 34..66, night 67..100. Every drawing has a palette per stage: the artist's own
   (palette / paletteDusk / paletteNight; pal / palDusk / palNight for the icons; v1e's paletteDark is read as
   the night's), else derived from the day's: warmer at dusk, moonlit at night, and the pale colours pulled
   toward that stage's paper, so nothing glares on dusk or night paper */
export var PAPER = { day: [252, 252, 250], dusk: [243, 236, 227], night: [19, 20, 24] };

export var DUSKC = [255, 170, 92], MOONC = [86, 104, 168], NIGHT_INK = [232, 230, 225];

export function graded(c, sg) {
  if (sg === 'day') return c;
  var L = luma(c);
  if (sg === 'dusk') {
    if (L < .29) return c;                  /* outlines stay ink-dark */
    c = mixC(DUSKC, c, .22);
    return L > .86 ? mixC(PAPER.dusk, c, .5) : c;
  }
  if (L < .2) return mixC(NIGHT_INK, c, .55);   /* a dark colour would vanish into the night paper */
  c = mixC(MOONC, c, .26);
  return L > .7 ? mixC(PAPER.night, c, .45) : c;
}

export function ownPal(A, sg) { return sg === 'dusk' ? A.paletteDusk : sg === 'night' ? (A.paletteNight || A.paletteDark) : null; }

/* a letter -> colour palette at a stage (null: not drawn); kept on the drawing itself */
export function palAt(A, sg) {
  var C = A.__pal || (A.__pal = {});
  if (C[sg]) return C[sg];
  var day = A.palette || {}, own = ownPal(A, sg), P = {};
  for (var c in day) P[c] = day[c] ? (own || sg === 'day' ? rgb(day[c]) : graded(rgb(day[c]), sg)) : null;
  if (own) for (var c2 in own) P[c2] = own[c2] ? rgb(own[c2]) : null;
  return (C[sg] = P);
}

/* an icon's palette (an array) at a stage; null: the near-black outline, drawn in the light ink at night */
export function iconPal(S, sg) {
  var C = S.__pal || (S.__pal = {});
  if (C[sg]) return C[sg];
  var own = sg === 'dusk' ? S.palDusk : sg === 'night' ? S.palNight : null;
  return (C[sg] = S.pal.map(function (h, i) {
    if (own && own[i]) return rgb(own[i]);
    var c = rgb(h);
    if (sg === 'night' && luma(c) < .29) return null;
    return graded(c, sg);
  }));
}
