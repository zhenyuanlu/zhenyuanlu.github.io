// A picture's two forms (the speed round's picture policy, 2026-10-16; the owner's rule: faster, and no picture worse
// than its source): AVIF, for the browsers that show it (a <picture>'s <source>, or an image-set()'s first), and a
// fallback every browser shows (the <img>, or the image-set()'s last). Each is a ladder of encoders, the lightest like
// its source taken at every width of the srcset (lib/picture-encode.mjs, which the image service makes the files with,
// its choices kept in src/lib/image-choices.json), and a page names at each width the lighter of the two and no file
// heavier than a wider one (integrations/picture-sources.mjs); here only which ladders, by the source's own kind:
//   pixel art, a PNG, a lossless WebP or a GIF's still: lossless in both (AVIF lossless, WebP lossless)
//   a JPEG: AVIF 4:4:4 at the lowest quality like it, and JPEG 4:4:4 (86 and up), or the source JPEG with its
//           metadata cut at its own size
//   a lossy WebP: AVIF 4:4:4 at the lowest quality like it, and WebP 92 (sharp YUV), else near-lossless, else lossless
import fs from 'node:fs';
import sharp from 'sharp';
import { FORM } from './picture-encode.mjs';

function losslessWebp(buf) {
  if (buf.subarray(0, 4).toString() !== 'RIFF' || buf.subarray(8, 12).toString() !== 'WEBP') return false;
  let o = 12;
  for (let n = 0; o + 8 <= buf.length && n < 12; n++) { if (buf.subarray(o, o + 4).toString() === 'VP8L') return true; const len = buf.readUInt32LE(o + 4); o += 8 + len + (len & 1); }
  return false;
}

const known = new Map();
/**
 * @param {string} file the source on disk
 * @returns {Promise<{ lossless: boolean, avif: { format: 'avif', quality: number }, fallback: { format: 'webp'|'jpg', quality: number } }>}
 */
export async function pictureForms(file) {
  const st = fs.statSync(file), id = `${file}:${st.size}:${st.mtimeMs}`;
  if (known.has(id)) return known.get(id);
  const buf = fs.readFileSync(file);
  const meta = await sharp(buf, { pages: 1 }).metadata();
  const lossless = meta.format === 'png' || meta.format === 'gif' || (meta.format === 'webp' && losslessWebp(buf));
  const out = lossless
    ? { lossless, avif: { format: 'avif', quality: FORM.avifLossless }, fallback: { format: 'webp', quality: FORM.webpLossless } }
    : { lossless, avif: { format: 'avif', quality: FORM.avif }, fallback: meta.format === 'jpeg' ? { format: 'jpg', quality: FORM.jpg } : { format: 'webp', quality: FORM.webp } };
  known.set(id, out);
  return out;
}
