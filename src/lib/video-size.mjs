// A video's width and height, read from its own file at build time, with nothing to install: MP4 (and .m4v, .mov)
// from its video track's header, WebM (and .mkv) from its track's Video element. Both the Markdown step
// (plugins/remark-dialect.mjs: a video in a post) and the pages (lib/media.ts: a cover's or a list's film) use it.
// A file it cannot read stops the build with the file's name: a figure is never laid out at a size it does not have.
import fs from 'node:fs';
import path from 'node:path';

const MP4 = /\.(mp4|m4v|mov)$/i;
const WEBM = /\.(webm|mkv)$/i;

/**
 * The size a video is shown at (its display size, in CSS px at 100%).
 * @param {string} file the video on disk
 * @returns {{ w: number, h: number }}
 */
export function videoSize(file) {
  const name = path.relative(process.cwd(), file) || file;
  const fail = (why) => { throw new Error(`the video ${name}: ${why}`); };
  if (!fs.existsSync(file)) fail('there is no such file');
  const buf = fs.readFileSync(file);
  let size = null;
  try {
    if (MP4.test(file)) size = mp4Size(buf);
    else if (WEBM.test(file)) size = webmSize(buf);
    else fail('not a video this site reads (.mp4, .m4v, .mov, .webm, .mkv)');
  } catch (e) {
    if (String(e.message).startsWith(`the video ${name}`)) throw e;
    fail(`its file could not be read (${e.message})`);
  }
  if (!size || !(size.w > 0) || !(size.h > 0)) fail('no width and height in its file (is it a video, and whole?)');
  return { w: Math.round(size.w), h: Math.round(size.h) };
}

// ------------------------------------------------------------------------------------------------ MP4
/** the boxes in buf[start, end): { type, at, head, end } */
function boxes(buf, start, end) {
  const out = [];
  let at = start;
  while (at + 8 <= end) {
    let size = buf.readUInt32BE(at), head = 8;
    const type = buf.toString('latin1', at + 4, at + 8);
    if (size === 1) { size = Number(buf.readBigUInt64BE(at + 8)); head = 16; }
    else if (size === 0) size = end - at;
    if (size < head || at + size > end) break;   // a broken box: what follows cannot be trusted
    out.push({ type, at, head, end: at + size });
    at += size;
  }
  return out;
}
const child = (buf, box, type) => boxes(buf, box.at + box.head, box.end).find((b) => b.type === type);
/** the video track's tkhd: width and height, 16.16 fixed point, are its last eight bytes */
function mp4Size(buf) {
  const moov = boxes(buf, 0, buf.length).find((b) => b.type === 'moov');
  if (!moov) return null;
  let first = null;
  for (const trak of boxes(buf, moov.at + moov.head, moov.end).filter((b) => b.type === 'trak')) {
    const tkhd = child(buf, trak, 'tkhd');
    if (!tkhd || tkhd.end - tkhd.at < 92) continue;
    const w = buf.readUInt32BE(tkhd.end - 8) / 65536, h = buf.readUInt32BE(tkhd.end - 4) / 65536;
    if (!(w > 0 && h > 0)) continue;
    const mdia = child(buf, trak, 'mdia'), hdlr = mdia && child(buf, mdia, 'hdlr');
    const kind = hdlr ? buf.toString('latin1', hdlr.at + hdlr.head + 8, hdlr.at + hdlr.head + 12) : '';
    if (kind === 'vide') return { w, h };
    first ??= { w, h };
  }
  return first;
}

// ------------------------------------------------------------------------------------------------ WebM
// EBML: each element is an id (a variable-length integer that keeps its marker bit), a size (one that drops it;
// all ones means "unknown", as a live recording writes its Segment) and its data.
const ID = { Segment: 0x18538067, Tracks: 0x1654ae6b, TrackEntry: 0xae, TrackType: 0x83, Video: 0xe0, Cluster: 0x1f43b675,
  PixelWidth: 0xb0, PixelHeight: 0xba, DisplayWidth: 0x54b0, DisplayHeight: 0x54ba, DisplayUnit: 0x54b2 };
function vint(buf, at, keepMarker) {
  const first = buf[at];
  if (first === undefined || first === 0) throw new Error(`no EBML number at byte ${at}`);
  const len = Math.clz32(first) - 23;   // 1..8: the place of the first 1 bit
  let v = keepMarker ? first : first & (0xff >> len);
  let unknown = v === (0xff >> len);
  for (let i = 1; i < len; i++) { v = v * 256 + buf[at + i]; if (buf[at + i] !== 0xff) unknown = false; }
  return { v, len, unknown: !keepMarker && unknown };
}
function elements(buf, start, end) {
  const out = [];
  let at = start;
  while (at < end) {
    const id = vint(buf, at, true), sz = vint(buf, at + id.len, false);
    const data = at + id.len + sz.len;
    const stop = sz.unknown ? end : Math.min(end, data + sz.v);
    out.push({ id: id.v, data, end: stop, unknown: sz.unknown });
    if (sz.unknown) break;   // an element of unknown size runs to the end of its parent
    at = stop;
  }
  return out;
}
const uint = (buf, e) => { let v = 0; for (let i = e.data; i < e.end; i++) v = v * 256 + buf[i]; return v; };
function webmSize(buf) {
  const segment = elements(buf, 0, buf.length).find((e) => e.id === ID.Segment);
  if (!segment) return null;
  // the Tracks come before the first Cluster (one of unknown size is the rest of a live recording)
  for (const e of elements(buf, segment.data, segment.end)) {
    if (e.id === ID.Cluster) break;
    if (e.id === ID.Tracks) {
      for (const t of elements(buf, e.data, e.end).filter((x) => x.id === ID.TrackEntry)) {
        const kids = elements(buf, t.data, t.end);
        const type = kids.find((x) => x.id === ID.TrackType), video = kids.find((x) => x.id === ID.Video);
        if (!video || (type && uint(buf, type) !== 1)) continue;
        const v = Object.fromEntries(elements(buf, video.data, video.end).map((x) => [x.id, uint(buf, x)]));
        const pw = v[ID.PixelWidth], ph = v[ID.PixelHeight];
        const dw = v[ID.DisplayWidth], dh = v[ID.DisplayHeight], unit = v[ID.DisplayUnit] ?? 0;
        // the display size where it is given in pixels (it carries the pixels' shape); else the pixels' own
        if (unit === 0 && dw > 0 && dh > 0) return { w: dw, h: dh };
        if (pw > 0 && ph > 0) return { w: pw, h: ph };
      }
      return null;
    }
  }
  return null;
}
