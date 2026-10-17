// The likeness measure itself (lib/likeness.mjs says what it measures and why): pure JavaScript on two pictures' RGB
// pixels, with nothing else imported, so it runs in the build's own thread or in a worker thread of the pool
// lib/likeness.mjs keeps (compareAsync), which loads this file by itself.
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

/** the bar: not visibly worse than the source is PSNR 42 dB or more and no 32px block's SSIM under 0.98 */
export const LIKE = { psnr: 42, block: 0.98 };

function gauss(n, sigma) { const k = new Float64Array(n), c = (n - 1) / 2; let s = 0; for (let i = 0; i < n; i++) { k[i] = Math.exp(-((i - c) ** 2) / (2 * sigma * sigma)); s += k[i]; } for (let i = 0; i < n; i++) k[i] /= s; return k; }
const K = gauss(11, 1.5);
function blur(src, w, h) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), r = 5;
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) { const xx = x + k < 0 ? 0 : x + k >= w ? w - 1 : x + k; s += src[o + xx] * K[k + r]; } tmp[o + x] = s; } }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -r; k <= r; k++) { const yy = y + k < 0 ? 0 : y + k >= h ? h - 1 : y + k; s += tmp[yy * w + x] * K[k + r]; } out[y * w + x] = s; }
  return out;
}
function luma(d, n) { const Y = new Float32Array(n); for (let i = 0, j = 0; i < n; i++, j += 3) Y[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]; return Y; }

/** two pictures of one size compared: { psnr, ssim, block (the worst 32px block's SSIM), maxe } */
export function compare(A, B) {
  if (A.w !== B.w || A.h !== B.h) throw new Error(`likeness: ${A.w}x${A.h} against ${B.w}x${B.h}`);
  const w = A.w, h = A.h, n = w * h;
  let se = 0, maxe = 0;
  for (let i = 0, j = 0; i < n; i++, j += 3) {
    const dr = A.d[j] - B.d[j], dg = A.d[j + 1] - B.d[j + 1], db = A.d[j + 2] - B.d[j + 2];
    se += dr * dr + dg * dg + db * db;
    const m = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
    if (m > maxe) maxe = m;
  }
  const mse = se / (3 * n);
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  let ssim = 1, block = 1;
  if (mse > 0) {
    const ya = luma(A.d, n), yb = luma(B.d, n);
    const a2 = new Float32Array(n), b2 = new Float32Array(n), ab = new Float32Array(n);
    for (let i = 0; i < n; i++) { a2[i] = ya[i] * ya[i]; b2[i] = yb[i] * yb[i]; ab[i] = ya[i] * yb[i]; }
    const m1 = blur(ya, w, h), m2 = blur(yb, w, h), s11 = blur(a2, w, h), s22 = blur(b2, w, h), s12 = blur(ab, w, h);
    const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
    let s = 0, c = 0;
    const bw = Math.ceil(w / 32), bh = Math.ceil(h / 32), bs = new Float64Array(bw * bh), bc = new Uint32Array(bw * bh);
    for (let y = 5; y < h - 5; y++) for (let x = 5; x < w - 5; x++) {
      const i = y * w + x, mu1 = m1[i], mu2 = m2[i];
      const v = ((2 * mu1 * mu2 + C1) * (2 * (s12[i] - mu1 * mu2) + C2)) / ((mu1 * mu1 + mu2 * mu2 + C1) * (s11[i] - mu1 * mu1 + (s22[i] - mu2 * mu2) + C2));
      s += v; c++;
      const bi = ((y / 32) | 0) * bw + ((x / 32) | 0); bs[bi] += v; bc[bi]++;
    }
    ssim = c ? s / c : 1;
    for (let i = 0; i < bs.length; i++) if (bc[i] > 200) block = Math.min(block, bs[i] / bc[i]);
  }
  return { psnr, ssim, block, maxe };
}

/** not visibly worse than its source (LIKE) */
export const alike = (c) => c.psnr >= LIKE.psnr && c.block >= LIKE.block;

/* a worker of lib/likeness.mjs's pool: two pictures in, their likeness out */
if (!isMainThread && workerData && workerData.zlLikeness) {
  parentPort.on('message', ({ id, A, B }) => {
    let r;
    try { r = { id, c: compare(A, B) }; } catch (e) { r = { id, error: String((e && e.message) || e) }; }
    parentPort.postMessage(r);
  });
}
