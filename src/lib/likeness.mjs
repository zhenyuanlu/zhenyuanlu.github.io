// How like its source a picture the build makes is (the speed round's picture policy, 2026-10-16;
// lib/picture-encode.mjs): the source made the picture's size as the build makes it, both over the day's paper where they
// have alpha, then PSNR over the three channels, and SSIM on luma (Gaussian window 11, sigma 1.5, K1 .01, K2 .03:
// Wang et al. 2004), the whole picture's and the worst 32px block's (where a loss is concentrated, on text or an
// edge, the whole's mean hides it). The round's audit measured every picture so, and its bar is this one's:
// not visibly worse than the source is PSNR 42 dB or more and no 32px block's SSIM under 0.98 (LIKE). A picture
// that is partly transparent is shown over the paper of every light, so it is measured over the lightest and the
// darkest (BACKS: the day's paper and the night's), and must be like its source over both. The measure itself is
// lib/likeness-core.mjs; here the pixels it is given, and a pool of worker threads that measures many pictures at
// once (the build's slow part when it measures).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';
import { LIKE, alike, compare } from './likeness-core.mjs';

export { LIKE, alike, compare };

/** the papers a transparent picture is measured over: the day's (styles/tokens.css --bg) and the night's */
export const BACKS = { day: { r: 0xfc, g: 0xfc, b: 0xfa }, night: { r: 0x13, g: 0x14, b: 0x18 } };

/** a picture's pixels, RGB, over a paper (o.bg, the day's unless named); at w x h as the build's resize makes them
    (o.w), or as they are */
export async function pixels(input, o = {}) {
  let s = sharp(input, { failOn: 'none', animated: false, pages: 1 });
  if (o.rotate !== false) s = s.rotate();
  if (o.w) s = s.resize({ width: o.w, height: o.h || undefined, withoutEnlargement: true });
  const { data, info } = await s.flatten({ background: o.bg || BACKS.day }).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { d: data, w: info.width, h: info.height };
}

/** whether a picture is partly transparent anywhere (its alpha under 255 somewhere) */
export async function transparent(input) {
  const m = await sharp(input, { failOn: 'none', pages: 1 }).metadata();
  if (!m.hasAlpha) return false;
  const st = await sharp(input, { failOn: 'none', pages: 1 }).ensureAlpha().stats();
  return st.channels[3].min < 255;
}

/* the pool: half the machine's threads, at most 16, each a worker running lib/likeness-core.mjs from the project's
   own file (the build bundles this module, so its own address is the bundle's: the project's path is the one that
   holds); none, where that file cannot be found, and compare runs here */
let pool = null;
function core() {
  const near = (() => { try { return fileURLToPath(new URL('./likeness-core.mjs', import.meta.url)); } catch { return null; } })();
  for (const f of [near, path.join(process.cwd(), 'src', 'lib', 'likeness-core.mjs')]) if (f && fs.existsSync(f)) return f;
  return null;
}
function start() {
  const file = core();
  const n = Math.max(1, Math.min(16, Math.floor(os.availableParallelism() / 2)));
  pool = { idle: [], all: [], queue: [], jobs: new Map(), next: 1 };
  if (!file) return pool;
  for (let i = 0; i < n; i++) {
    const w = new Worker(file, { workerData: { zlLikeness: true } });
    w.on('message', ({ id, c, error }) => {
      const j = pool.jobs.get(id); pool.jobs.delete(id);
      if (error) j.reject(new Error(error)); else j.resolve(c);
      give(w);
    });
    w.on('error', (e) => {
      for (const [id, j] of pool.jobs) if (j.w === w) { pool.jobs.delete(id); j.reject(e); }
      pool.all = pool.all.filter((x) => x !== w); pool.idle = pool.idle.filter((x) => x !== w);
      if (!pool.all.length) for (const j of pool.queue.splice(0)) { try { j.resolve(compare(j.A, j.B)); } catch (x) { j.reject(x); } }   /* (no worker left: here) */
    });
    w.unref();   /* (after its listeners: a 'message' listener holds the process open again) */
    pool.all.push(w); pool.idle.push(w);
  }
  return pool;
}
function give(w) {
  const next = pool.queue.shift();
  if (next) send(w, next); else { w.unref(); pool.idle.push(w); }
}
function send(w, job) {
  w.ref();   /* (a worker at work keeps the process alive until it answers) */
  job.w = w; pool.jobs.set(job.id, job);
  w.postMessage({ id: job.id, A: job.A, B: job.B });
}

/** compare, in a worker thread of the pool (or here, where there is none) */
export function compareAsync(A, B) {
  if (!pool) start();
  if (!pool.all.length) return Promise.resolve(compare(A, B));
  return new Promise((resolve, reject) => {
    const job = { id: pool.next++, A, B, resolve, reject };
    const w = pool.idle.pop();
    if (w) send(w, job); else pool.queue.push(job);
  });
}
