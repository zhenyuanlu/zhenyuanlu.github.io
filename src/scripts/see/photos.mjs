// The photographs as see's pages use them: build time only (Node, never the browser; pages/see.astro and
// pages/see/[photo].astro). Read and checked by src/schemas/see.ts, in the wall's order (newest first; two of one day
// in their names' order), each with its address, its words, its average colour and its pictures:
//   alt     its text alternative: the YAML's alt where it gives one (ownAlt; '' where not), else its title
//   avg     the linear-light mean of its pixels (the faintest breath of it, 3%, holds its place on the wall until it
//           appears; the colour itself the viewer's), from the file, with sharp
//   srcset  WebP from Astro's image step at the widths a wall's column asks for (320, 480, 640) below its own, and its
//           own: never past its own pixels. Quality 90: the photographs are the page, and they stay a quarter of
//           their originals' weight (the originals keep their camera data; these keep none)
//   full    its own width, the viewer's (and the wall's widest)
//   og      a JPEG of its own size, for a link preview
//   focus   its focus point, "x% y%" (the YAML's, else the middle): the wall's object-position, should a place ever
//           crop it (taste item 22; every place is the photograph's own shape, so none does)
import { getImage } from 'astro:assets';
import path from 'node:path';
import sharp from 'sharp';
import { pictureForms } from '../../lib/picture-forms.mjs';
import { widthsFor } from '../../lib/picture.mjs';
import { readSee, toPhotosShape } from '../../schemas/see.ts';
import { beside, slug } from '../../schemas/common.ts';

const IMG = import.meta.glob('/content/see/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' });
const QUALITY = 90;
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const LIN = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
/** a photograph's average colour, #rrggbb: the mean of its pixels in linear light, back to sRGB */
async function averageColour(file) {
  const { data, info } = await sharp(file).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0], n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) { sum[0] += LIN[data[i]]; sum[1] += LIN[data[i + 1]]; sum[2] += LIN[data[i + 2]]; }
  return '#' + sum.map((s) => {
    const l = s / n, c = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  }).join('');
}

let made = null;
/**
 * @returns {Promise<Array<{ name: string, title: string, date: string, year: number, day: string, place: string,
 *   kind: string, kindLabel: string, alt: string, ownAlt: string, w: number, h: number, avg: string, src: string,
 *   srcset: string, srcsetAvif: string, full: string, fullAvif: string, og: string, focus: string, n: number }>>}
 */
export function photos() {
  if (!made) made = make();
  return made;
}
async function make() {
  const entries = readSee();
  const meta = (file) => {
    const m = IMG[`/${file}`];
    if (!m) throw new Error(`${file}: no such photograph (content/see/)`);
    return m;
  };
  const byFile = new Map(entries.map((e) => [beside(e.file, e.data.file), e]));
  // the draft's order (oldest first; of one day the later name first), then the wall's: newest first, and of one day
  // the later in that list first, so two of one day hang in the order of their names
  const draft = toPhotosShape(entries, (f) => { const m = meta(f); return { src: f, w: m.width, h: m.height }; });
  const wall = draft.map((p, i) => ({ p, i })).sort((a, b) => (a.p.date < b.p.date ? 1 : a.p.date > b.p.date ? -1 : b.i - a.i));
  const out = [];
  for (const [n, { p }] of wall.entries()) {
    const e = byFile.get(p.file), m = meta(p.file);
    const own = m.width;
    /* (in its two forms, the speed round's picture policy, 2026-10-16: lib/picture-forms.mjs; AVIF for the browsers
       that show it, the fallback for every other, neither visibly worse than the photograph) */
    const forms = await pictureForms(path.resolve(p.file));
    const at = async (f, w) => (await getImage({ src: m, width: w, ...f })).src;
    const widths = widthsFor(own, 'see');
    const urls = await Promise.all(widths.map((w) => at(forms.fallback, w)));
    const avifs = await Promise.all(widths.map((w) => at(forms.avif, w)));
    const og = (await getImage({ src: m, format: 'jpg', quality: 85 })).src;
    const [y, mo, d] = p.date.split('-').map(Number);
    out.push({
      name: e.id, title: p.title, date: p.date, year: y, day: `${MON[mo - 1]} ${d}, ${y}`, place: p.place,
      kind: slug(p.kind), kindLabel: p.kind, alt: e.data.alt || p.title, ownAlt: e.data.alt || '', w: p.w, h: p.h,
      avg: await averageColour(p.file),
      src: urls[Math.min(1, urls.length - 1)], srcset: widths.map((w, k) => `${urls[k]} ${w}w`).join(', '),
      srcsetAvif: widths.map((w, k) => `${avifs[k]} ${w}w`).join(', '), fullAvif: avifs[avifs.length - 1],
      full: urls[urls.length - 1], og, focus: e.data.focus || '50% 50%', n,
    });
  }
  return out;
}
