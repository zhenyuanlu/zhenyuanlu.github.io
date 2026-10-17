// A picture on a page, as the build makes it (a post's: the Markdown step, plugins/remark-dialect.mjs, and
// components/Article.astro for the cover; a photograph on /see/: scripts/see/photos.mjs and pages/see.astro): the
// widths a reader's screen may need (a srcset Astro's image step writes, up to the picture's own) and the width it
// takes on the page (sizes). Its forms, AVIF and the fallback every browser shows, each no worse than its source:
// lib/picture-forms.mjs (the speed round's picture policy, 2026-10-16). The sheet (styles/article.css) never draws a
// picture past its own pixels, counted in the screen's device pixels.
// The rule (the coordinator, 2026-10-16): on every screen of SCREENS, the file a browser takes is never narrower
// than the picture is drawn there (in device pixels, to the nearest; or its own width, where the picture is smaller).
// Chrome is the one that can take a narrower file: up to at least version 131 (the version the round's tools carry),
// of two files about a screen's need it takes the narrower when the screen's ratio is under the geometric mean of
// their two densities (a 304px column at 1.75x needs 532px, and of 480w and 640w it took 480w); Chrome 155, as
// Firefox and Safari, takes the narrowest file dense enough, never narrower than that (the round measured both: 665
// choices each, scripts of the round, chrome-pick-test.cjs). So each need gets a file the older rule takes for it
// (chromePick), and every browser takes one at least as wide: needs within 4% share the widest of them, and a need
// that rule would still serve with a narrower file gets one of its own.

// the places, in CSS px of the window (styles/article.css, styles/frame.css, styles/see.css): the frame's column is
// 960 on a desk (the window less 64 below 1024), the text's measure 632, nine columns 714; under 1000px one column, at
// most 520 and the window less 40; see's columns 304 on a desk, two of the column less 14 under 1000px
const SLOT = { text: 632, wide: 714, full: 960, see: 304 };
/* the big-screen mode (design/assets/zoom/wide.js, ported to the site by the wide builder): on a desk window at least
   1600k wide and 860k tall, the frame is 960k, k one of 1.125, 1.25, 1.375, 1.5, the largest that fits; a page is
   zoomed in it, and Chrome takes a srcset's file by sizes in the window's px, not the zoomed page's, so sizes names
   the slots the mode draws, in the window's px (the coordinator's: the frame's 960k for a cover or a figure on the
   frame, nine columns, see's columns; the text's measure stays 632). Keep these in step with the mode's own steps.
   A media query knows only the window's size, so these slots hold wherever a window is that large, the mode on or
   not: where it stays off (Safari, and any browser whose zoom early.js's probe does not trust; a touch desktop;
   ?wide=off) a picture is drawn at the plain page's slot from the mode's larger file (a cover at 2560 x 1440: a file
   for 1440px drawn at 960px). More bytes there, the same look, never a picture short of its pixels (the review,
   2026-10-17; README.md, "Add a picture") */
export const WIDE = [
  { k: 1.5, minW: 2400, minH: 1290, wide: 1073, full: 1440, see: 462 },
  { k: 1.375, minW: 2200, minH: 1182.5, wide: 983, full: 1320, see: 422 },
  { k: 1.25, minW: 2000, minH: 1075, wide: 894, full: 1200, see: 383 },
  { k: 1.125, minW: 1800, minH: 967.5, wide: 804, full: 1080, see: 343 },
];
/** the screens a picture is made for and checked against (here, integrations/picture-sources.mjs and
    scripts/check-budget.mjs): a desk window at its common widths, the big-screen mode's four steps among them, each
    at 100% to 200%; a tablet at 2x; a phone at 2x and 3x */
export const SCREENS = [
  ...[[1000, 800], [1280, 800], [1366, 768], [1440, 900], [1463, 914], [1536, 864], [1680, 1050], [1920, 1080], [2194, 1100], [2304, 1296], [2560, 1440]]
    .flatMap(([w, h]) => [1, 1.25, 1.5, 1.75, 2].map((dpr) => ({ w, h, dpr }))),
  ...[[768, 1024], [820, 1180], [1024, 1366]].map(([w, h]) => ({ w, h, dpr: 2 })),
  ...[[360, 780], [375, 812], [390, 844], [393, 852], [412, 915], [414, 896], [430, 932]].flatMap(([w, h]) => [2, 3].map((dpr) => ({ w, h, dpr }))),
];
/** how far above a need a file may be and still be that need's (a need within 4% shares the widest of them) */
const SHARE = 0.04;
/** a device pixel over each need: a browser lays a slot out a fraction of a pixel off what sizes says (Chrome 131 on a
    phone: 350.286 CSS px for a 350px slot, 1050.86 device px at 3x), so a file of the need's own width would be drawn
    that fraction past its pixels */
const OVER = 1;

const PHONE = ['(max-width: 559px) calc(100vw - 40px)', '(max-width: 999px) 520px'];
const DESK = { text: ['632px'], wide: ['714px'], full: ['(max-width: 1023px) calc(100vw - 64px)', '960px'] };
const mode = (place) => WIDE.filter((s) => s[place]).map((s) => `(min-width: ${s.minW}px) and (min-height: ${s.minH}px) ${s[place]}px`);
/**
 * The sizes attribute for a picture at one of the places, held to a share of it ({max=60%}: on the text's measure
 * only, as the sheet holds it; a wider picture takes its whole width).
 * @param {'text'|'wide'|'full'|'screen'|'see'} width
 * @param {number} [share] 0..1
 */
export function sizesFor(width = 'text', share = 1) {
  const scale = (s) => {
    if (share >= 1 || width !== 'text') return s;
    const m = /^(.*?)\s*(calc\(.+\)|\d+(?:\.\d+)?px|\d+vw)$/.exec(s);
    const [cond, len] = m ? [m[1], m[2]] : ['', s];
    const px = /^(\d+(?:\.\d+)?)px$/.exec(len);
    const v = px ? `${Math.round(+px[1] * share)}px` : `calc(${len.replace(/^calc/, '')} * ${share})`;
    return cond ? `${cond} ${v}` : v;
  };
  if (width === 'screen') return scale('100vw');
  if (width === 'see') return [...mode('see'), '(max-width: 999px) calc((min(100vw - 40px, 520px) - 14px) / 2)', `${SLOT.see}px`].join(', ');
  return [...mode(width), ...PHONE, ...(DESK[width] || DESK.text)].map(scale).join(', ');
}

/** a CSS length of sizes (px, vw, vh, calc(), min(), max(), + - * /) in a window W x H, in CSS px */
function lengthAt(s, W, H) {
  const t = s.replace(/\s+/g, ' ').trim();
  let i = 0;
  const peek = () => { while (t[i] === ' ') i++; return t[i]; };
  function factor() {
    const c = peek();
    if (c === '(') { i++; const v = expr(); peek(); i++; return v; }
    if (c === '-') { i++; return -factor(); }
    const f = /^(calc|min|max)\(/.exec(t.slice(i));
    if (f) {
      i += f[0].length;
      const args = [expr()];
      while (peek() === ',') { i++; args.push(expr()); }
      peek(); i++;
      return f[1] === 'min' ? Math.min(...args) : f[1] === 'max' ? Math.max(...args) : args[0];
    }
    const m = /^(\d+(?:\.\d+)?|\.\d+)(px|vw|vh)?/.exec(t.slice(i));
    if (!m) throw new Error(`sizes: cannot read "${s}"`);
    i += m[0].length;
    return m[2] === 'vw' ? (+m[1] * W) / 100 : m[2] === 'vh' ? (+m[1] * H) / 100 : +m[1];
  }
  function term() { let v = factor(); for (;;) { const c = peek(); if (c === '*') { i++; v *= factor(); } else if (c === '/') { i++; v /= factor(); } else return v; } }
  function expr() { let v = term(); for (;;) { const c = peek(); if (c === '+') { i++; v += term(); } else if (c === '-') { i++; v -= term(); } else return v; } }
  return expr();
}
/** the slot a sizes attribute gives a picture in a window W x H, in CSS px (no sizes: the window's width) */
export function slotAt(sizes, W, H = 900) {
  if (!sizes) return W;
  const parts = []; let depth = 0, cur = '';
  for (const ch of String(sizes)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur); cur = ''; } else cur += ch; }
  parts.push(cur);
  for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
    const m = /^((?:\(\s*(?:max|min)-(?:width|height)\s*:\s*[\d.]+px\s*\)\s*(?:and\s+)?)+)(.+)$/i.exec(p);
    if (!m) return lengthAt(p, W, H);
    const ok = [...m[1].matchAll(/\(\s*(max|min)-(width|height)\s*:\s*([\d.]+)px\s*\)/gi)].every((q) => { const v = q[2].toLowerCase() === 'width' ? W : H; return q[1].toLowerCase() === 'max' ? v <= +q[3] : v >= +q[3]; });
    if (ok) return lengthAt(m[2], W, H);
  }
  return W;
}

/** the width Chrome takes of a srcset's widths, for a slot in CSS px at a screen's ratio, by the rule that can take
    the narrowest (Chromium's SelectionLogic as Chrome 131 has it, the geometric mean of two densities; Chrome 155,
    Firefox and Safari take the narrowest dense enough, never narrower than this) */
export function chromePick(widths, slot, dpr) {
  const c = [...new Set(widths)].sort((a, b) => a - b).map((w) => ({ w, d: w / slot }));
  let i = 0;
  for (; i < c.length - 1; i++) {
    const next = c[i + 1].d;
    if (next < dpr) continue;
    const cur = c[i].d;
    if ((dpr <= 1 && dpr > cur) || dpr >= Math.sqrt(cur * next)) return c[i + 1].w;
    break;
  }
  return c[i].w;
}

/** the screens of SCREENS where Chrome would take a file narrower than the picture is drawn (to the nearest pixel;
    its own width where it is smaller): [{ screen, slot, need, pick }] */
export function shortOf(widths, sizes, own) {
  const out = [];
  for (const s of SCREENS) {
    const slot = slotAt(sizes, s.w, s.h), need = Math.min(own, slot * s.dpr), pick = chromePick(widths, slot, s.dpr);
    if (pick < Math.round(need)) out.push({ screen: s, slot, need, pick });
  }
  return out;
}

/**
 * The widths a picture is made in: a file for what every screen of SCREENS needs where it stands, a device pixel over
 * (OVER), below its own width (needs within SHARE above one another share one), its own, and a file of its own for a
 * need Chrome would still serve with a narrower one.
 * @param {number} own the picture's own width
 * @param {'text'|'wide'|'full'|'screen'|'see'} [place]
 * @param {number} [share] 0..1, a picture held to a share of the measure ({max=60%})
 * @returns {number[]}
 */
export function widthsFor(own, place = 'text', share = 1) {
  const sizes = sizesFor(place, share);
  const needs = [...new Set(SCREENS.map((s) => Math.ceil(slotAt(sizes, s.w, s.h) * s.dpr - 1e-9) + OVER).filter((n) => n < own))].sort((a, b) => a - b);
  const set = new Set([own]);
  for (let i = 0; i < needs.length;) { let j = i; while (j + 1 < needs.length && needs[j + 1] <= needs[i] * (1 + SHARE)) j++; set.add(needs[j]); i = j + 1; }
  /* (a step: what it adds for each screen still short, round after round, until none is or a round adds nothing) */
  const fix = (width) => {
    for (let round = 0; round < 64; round++) {
      const short = shortOf([...set], sizes, own);
      if (!short.length) return true;
      const before = set.size;
      for (const x of short) set.add(width(x));
      if (set.size === before) return false;
    }
    return !shortOf([...set], sizes, own).length;
  };
  /* first a file a device pixel over each need still short; then, where that leaves one short (Chrome's rule passing
     that file over for a narrower one: the geometric mean of the two densities past the screen's), the widest file
     the rule would take there instead, the need squared over the narrower file's width, and at least the need (the
     review, 2026-10-17). A picture the first step settles, every picture made before it, keeps its widths */
  if (!fix((x) => Math.min(own, Math.ceil(x.need - 1e-9) + OVER))) fix((x) => Math.min(own, Math.max(Math.ceil(x.need - 1e-9), Math.floor((x.need * x.need) / x.pick))));
  return [...set].sort((a, b) => a - b);
}
