// How a picture's file is made from its source (the speed round's picture policy, 2026-10-16; the owner's rule: no
// picture worse than its source): sharp's rotate and resize as Astro's own sharp service makes them, then the
// lightest step of the form's ladder that is like its source at that size (lib/likeness.mjs: PSNR 42 dB or more, no
// 32px block's SSIM under 0.98; a partly transparent picture over the day's paper and the night's). The image
// service (lib/image-service.mjs) makes every srcset file of these forms so; a form is a format and a quality that
// Astro passes through and keys its cache on:
//   avif 90    AVIF, chroma 4:4:4 (no colour halved: a red line on paper stays red), at the lowest quality from 30 to
//              90 that is like its source (searched by halves: the bar is the rule, the coordinator, 2026-10-16), else
//              95, else 98, else lossless
//   avif 100   AVIF lossless (pixel art, a lossless source)
//   webp 92    WebP at 92 with sharp YUV (a lossy WebP source's own kind), else near-lossless (level 60: no channel
//              of any pixel off by more than 2), else lossless
//   webp 100   WebP lossless
//   jpg 100    at its own size, the smallest of the source JPEG itself (its metadata cut out byte for byte: Exif,
//              XMP, IPTC, comments; its colour profile and picture data untouched) and JPEG 4:4:4 (mozjpeg's encoder)
//              at 86, 90, 92, 95 or 98 that is like it; below it, the first of JPEG 4:4:4 at 86, 90, 92, 95, 98, 100
// AVIF at sharp's effort 6, and on one thread: its encoder (libaom) shares a picture out by its threads, and the same
// picture at 1, 4 and 32 threads is three files (the more threads, the larger: a tenth more at 32). So every file is
// made on one thread, the same file on every machine and the lightest, and the build makes many pictures at once
// instead, as many as libuv's pool holds (UV_THREADPOOL_SIZE: 4 unless set; npm run images sets it to the machine's
// threads). WebP and JPEG come out the same on any number of threads.
// Which step each file takes is measured once and kept, by the source's own bytes (their SHA-1), the size and the
// form, in src/lib/image-choices.json, committed with the pictures: a build reads it and makes each file at its step,
// measuring nothing, so every deploy makes the same files. A picture not in it yet (a new one, one changed, a new
// width) is measured by a local build, which writes its choice there (sorted, a line a choice, so a diff is small);
// a build in CI (CI set, or ZL_BUDGET=strict, the deploy's) stops instead, naming it and `npm run images`, which
// measures what is missing. ZL_IMAGES=measure: measured, CI or not. (Astro keeps the files it made in
// node_modules/.astro/assets, by their form, not their step: after a change to the ladders here, npm run images,
// which empties that cache first, makes every file anew.)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BACKS, alike, compareAsync, pixels, transparent } from './likeness.mjs';

sharp.concurrency(1);   /* (one thread a file: above) */

/** the forms (lib/picture-forms.mjs chooses one of each for a picture) */
export const FORM = { avif: 90, avifLossless: 100, webp: 92, webpLossless: 100, jpg: 100 };
/** AVIF: sharp's effort, and the lowest quality the search goes down to */
export const AVIF_EFFORT = 6, AVIF_LOW = 30;

/** a JPEG without its metadata: APP1 (Exif, XMP), APP13 (IPTC) and COM segments cut; APP0, APP2 (ICC) and APP14
    (Adobe) kept, so its colours are read the same; nothing from the first scan on touched */
export function stripJpeg(buf) {
  const out = [buf.subarray(0, 2)]; let o = 2;
  while (o < buf.length) {
    if (buf[o] !== 0xff) throw new Error('stripJpeg: not a marker at ' + o);
    const m = buf[o + 1];
    if (m === 0xda) { out.push(buf.subarray(o)); break; }
    const len = buf.readUInt16BE(o + 2);
    if (!(m === 0xe1 || m === 0xed || m === 0xfe)) out.push(buf.subarray(o, o + 2 + len));
    o += 2 + len;
  }
  return Buffer.concat(out);
}

const e = `e${AVIF_EFFORT}`;
/** a form's ladder: { search: [low, high] } (AVIF's: the lowest quality between them that is like the source, by
    halves), then steps in order; at its own size a JPEG's are all weighed, the smallest like it taken */
export function ladderOf(format, quality, own) {
  const f = format === 'jpeg' ? 'jpg' : format, q = +quality;
  if (f === 'avif') return q === 100 ? { steps: [`avif lossless ${e}`] } : q === 90 ? { search: [AVIF_LOW, 90], steps: [`avif 95 ${e}`, `avif 98 ${e}`, `avif lossless ${e}`] } : null;
  if (f === 'webp') return q === 100 ? { steps: ['webp lossless'] } : q === 92 ? { steps: ['webp 92', 'webp near-lossless', 'webp lossless'] } : null;
  if (f === 'jpg') return q === 100 ? { steps: own ? ['jpg own', 'jpg 86', 'jpg 90', 'jpg 92', 'jpg 95', 'jpg 98'] : ['jpg 86', 'jpg 90', 'jpg 92', 'jpg 95', 'jpg 98', 'jpg 100'], all: own } : null;
  return null;
}

/** one step's file, at a size, from the source's bytes (a step: 'avif 76 e6', 'avif lossless e6', 'webp 92',
    'webp near-lossless', 'webp lossless', 'jpg 95', 'jpg own') */
export async function encodeStep(input, { width, height }, step) {
  if (step === 'jpg own') return stripJpeg(Buffer.from(input));
  let s = sharp(input, { failOn: 'none', pages: 1 }).rotate();
  if (width && height) s = s.resize({ width: Math.round(width), height: Math.round(height), withoutEnlargement: true });
  else if (width) s = s.resize({ width: Math.round(width), withoutEnlargement: true });
  else if (height) s = s.resize({ height: Math.round(height), withoutEnlargement: true });
  const [f, k, x] = step.split(' ');
  if (f === 'avif') { const effort = x && /^e\d$/.test(x) ? +x.slice(1) : 4; return s.avif(k === 'lossless' ? { lossless: true, effort } : { quality: +k, chromaSubsampling: '4:4:4', effort }).toBuffer(); }
  if (f === 'webp') return s.webp(k === 'lossless' ? { lossless: true, effort: 6 } : k === 'near-lossless' ? { nearLossless: true, quality: 60, effort: 6 } : { quality: +k, smartSubsample: true, effort: 6 }).toBuffer();
  if (f === 'jpg') return s.jpeg({ quality: +k, chromaSubsampling: '4:4:4', mozjpeg: true }).toBuffer();
  throw new Error('encodeStep: no step ' + step);
}

export const CHOICES = path.join(process.cwd(), 'src', 'lib', 'image-choices.json');
/** the code of the error a build that may not measure stops with (lib/image-service.mjs logs its message) */
export const NO_CHOICE = 'ZL_NO_IMAGE_CHOICE';
const MEASURE = process.env.ZL_IMAGES === 'measure' || !(process.env.CI || process.env.ZL_BUDGET === 'strict');
let store = null;
/** the choices, as the file has them */
export function kept() { if (!store) { try { store = JSON.parse(fs.readFileSync(CHOICES, 'utf8')); } catch { store = {}; } } return store; }
/** the file written again: sorted, a line a choice */
function write() {
  const keys = Object.keys(store).sort();
  fs.writeFileSync(CHOICES, '{\n' + keys.map((k, i) => `  ${JSON.stringify(k)}: ${JSON.stringify(store[k])}${i < keys.length - 1 ? ',' : ''}`).join('\n') + '\n}\n');
}
function keep(k, v) { kept()[k] = v; write(); }
/* (npm run images: every choice the build used, so it can drop the ones no file is made at any more: scripts/images.mjs) */
export const USED_FILE = path.join(process.cwd(), 'node_modules', '.astro', 'zl-image-choices-used.json');
const used = process.env.ZL_IMAGES === 'measure' ? new Set() : null;
if (used) process.on('exit', () => { try { fs.writeFileSync(USED_FILE, JSON.stringify([...used].sort())); } catch {} });

/**
 * The lowest quality in [lo, hi] whose file is like the source, found from a guess (the quality a neighbouring width
 * of the same picture took: neighbours take nearly the same): up from it by doubling steps until one is like it
 * (none up to hi: null), down from there by doubling steps until one is not, then by halves between the two. Where
 * likeness rises with quality, as it does, this is the lowest; it takes two or three files where the guess is near,
 * against six or seven by halves from the whole range.
 */
async function lowestLike(probe, lo, hi, guess) {
  let q = Math.min(hi, Math.max(lo, Math.round(guess)));
  let r = await probe(q), good = null, bad = lo - 1;
  if (r.ok) good = { q, r };
  else {
    bad = q;
    for (let step = 2; !good; step *= 2) {
      if (q === hi) return null;
      q = Math.min(hi, q + step);
      r = await probe(q);
      if (r.ok) good = { q, r }; else bad = q;
    }
  }
  for (let step = 1; good.q - 1 > bad; step *= 2) {
    const t = Math.max(bad + 1, good.q - step);
    r = await probe(t);
    if (r.ok) good = { q: t, r }; else { bad = t; break; }
  }
  while (good.q - bad > 1) {
    const mid = (bad + good.q) >> 1;
    r = await probe(mid);
    if (r.ok) good = { q: mid, r }; else bad = mid;
  }
  return good.r;
}
/** the quality the last width of each picture's AVIF took, by its source's SHA-1: the next width's guess */
const guesses = new Map();
/** where a search starts with no neighbour to go by: about the middle of what the site's pictures take */
const FIRST_GUESS = 78;

const clear = new Map();
/**
 * A file of a form at a size (Astro's transform: width, height, format, quality), and what was chosen; null where the
 * form is none of these (Astro's own encoder makes it then).
 * @returns {Promise<{ data: Buffer, step: string, psnr: number, block: number } | null>}
 */
export async function makeForm(input, transform) {
  const meta = await sharp(input, { pages: 1 }).metadata();
  if ((meta.pages || 1) > 1) return null;   /* (an animation: Astro's own, which keeps it) */
  const W = meta.width, H = meta.pageHeight || meta.height;
  const own = (!transform.width || transform.width >= W) && (!transform.height || transform.height >= H) && !(meta.orientation > 1);
  const ladder = ladderOf(transform.format, transform.quality, own && meta.format === 'jpeg');
  if (!ladder) return null;
  const size = { width: transform.width, height: transform.height };
  const sha = crypto.createHash('sha1').update(input).digest('hex');
  const key = [sha, size.width || '', size.height || '', transform.format, transform.quality].join(':');
  if (used) used.add(key);
  const k = kept()[key];
  if (k) return { data: await encodeStep(input, size, k.step), ...k };
  if (!MEASURE) {
    const name = String(transform.src || '').replace(/^.*\//, '').replace(/\.[\w-]{8}(?=\.\w+$)/, '');   /* (its file's name: /_astro/table.Bk3x_Zq9.webp is table.webp) */
    throw Object.assign(new Error(`the picture ${name} (${transform.src}) at ${size.width || '?'}x${size.height || '?'} as ${transform.format} has no choice in src/lib/image-choices.json yet (a new picture, a changed one, or a new width): run \`npm run images\` on your machine and commit src/lib/image-choices.json with it`), { code: NO_CHOICE });
  }
  /* the source at this size, over the day's paper, and over the night's too where it is partly transparent */
  if (!clear.has(sha)) clear.set(sha, transparent(input));
  const backs = (await clear.get(sha)) ? [BACKS.day, BACKS.night] : [BACKS.day];
  const refs = await Promise.all(backs.map((bg) => pixels(input, { w: size.width, h: size.height, bg })));
  const tryStep = async (step) => {
    const data = await encodeStep(input, size, step);
    const cs = await Promise.all(backs.map(async (bg, i) => compareAsync(refs[i], await pixels(data, { bg }))));
    const c = cs.reduce((a, b) => ({ psnr: Math.min(a.psnr, b.psnr), block: Math.min(a.block, b.block) }));
    return { data, step, ok: alike(c), psnr: c.psnr === Infinity ? 99 : +c.psnr.toFixed(2), block: +c.block.toFixed(4), bytes: data.length };
  };
  let pick = null;
  if (ladder.search) {
    /* the lowest quality like the source (none up to the top of the range: the steps over it are tried) */
    const [lo, hi] = ladder.search;
    pick = await lowestLike((q) => tryStep(`avif ${q} ${e}`), lo, hi, guesses.get(sha) ?? FIRST_GUESS);
    if (pick) guesses.set(sha, +pick.step.split(' ')[1]);
  }
  if (!pick) {
    for (const step of ladder.steps) {
      const got = await tryStep(step);
      if (!got.ok) continue;
      if (!ladder.all) { pick = got; break; }
      if (!pick || got.bytes < pick.bytes) pick = got;   /* (at its own size: the smallest JPEG like it) */
    }
  }
  if (!pick) pick = await tryStep(ladder.steps[ladder.steps.length - 1]);   /* (none like it: the last, the most faithful) */
  keep(key, { step: pick.step, psnr: pick.psnr, block: pick.block, bytes: pick.bytes });
  return pick;
}
