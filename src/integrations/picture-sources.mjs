// A page's pictures finished once the pages and their files are written (the speed round's picture policy,
// 2026-10-16; every file of both forms already like its source: lib/picture-encode.mjs):
//   1. a post's AVIF <img> becomes its <picture>'s <source type="image/avif">: a Markdown picture is made by Astro's
//      own image step, which writes an <img> for every image it is given, so plugins/remark-dialect.mjs gives it two
//      in a <picture>, the AVIF one marked by its class zl-avif (and hidden till then), and here it becomes the
//      <source> it is (its srcset, its src where it has none, and its sizes);
//   2. in every <picture>, the lighter form at each width: where the fallback's file of a width weighs less than the
//      AVIF one, the AVIF <source> names the fallback's (a browser that shows AVIF shows WebP and JPEG too); a
//      <source> left naming only the <img>'s own files goes, and its <picture> with it (the <img> stands alone);
//   3. in every srcset of a <picture>, no file that weighs as much as a wider one of the same srcset: the screen that
//      would take it takes the wider, lighter file, drawn smaller (never larger than its own pixels); where every
//      screen the site is checked on still takes a file at least as wide as the picture is drawn (lib/picture.mjs);
//   4. a frame (components/Frame.astro) whose fallback weighs no more than its AVIF keeps only its fallback: its
//      image-set() goes from its style and its data-img-set; the same for its big-screen mode's file (its
//      data-img-set-wide goes, its data-src-wide alone left);
//   5. the viewer's full picture on /see/ (data-full-avif, for a browser that took the AVIF) the lighter of the two.
// Only the HTML changes: every file named is one the build made, and the boxes are the same.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shortOf } from '../lib/picture.mjs';

const ATTR = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
/** a tag's attributes, in order: [[name, value or null]] */
function attrsOf(tag) {
  const body = tag.replace(/^<[a-zA-Z]+/, '').replace(/\/?>$/, '');
  return [...body.matchAll(ATTR)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? null]);
}
const get = (list, k) => { const a = list.find(([n]) => n === k); return a ? a[1] : undefined; };
function set(list, k, v) { const i = list.findIndex(([n]) => n === k); if (v == null) { if (i >= 0) list.splice(i, 1); } else if (i >= 0) list[i][1] = v; else list.push([k, v]); }
const tagOf = (name, list) => `<${name}${list.map(([k, v]) => (v == null ? ` ${k}` : ` ${k}="${v}"`)).join('')}>`;
/** a srcset's candidates: [{ u, d }] (d: its descriptor, '' for none) */
const candidates = (set) => String(set || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [u, d] = s.split(/\s+/); return { u, d: d || '' }; });
const setOf = (c) => c.map((x) => (x.d ? `${x.u} ${x.d}` : x.u)).join(', ');

/**
 * The pages of a build finished (1 to 5 above).
 * @param {string} outDir the build's folder
 * @param {string} base the site's base address ('/' or '/a/b/')
 * @returns {{ pages: number, sources: number, lighter: number, gone: number, pruned: number, frames: number, full: number }}
 */
export function finishPictures(outDir, base = '/') {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
  const sizes = new Map();
  /** a file's bytes, by its address on a page (null: not a file of the build) */
  const bytes = (u) => {
    if (!sizes.has(u)) {
      let n = null;
      const p = String(u).replace(/&amp;/g, '&');
      if (p.startsWith(base)) { const f = path.join(outDir, decodeURIComponent(p.slice(base.length))); try { const st = fs.statSync(f); if (st.isFile()) n = st.size; } catch {} }
      sizes.set(u, n);
    }
    return sizes.get(u);
  };
  /** no candidate that weighs as much as a wider one (width descriptors only, all files of the build), but only where
      every screen the build is checked on still takes a file at least as wide as the picture is drawn there
      (lib/picture.mjs shortOf: a file left out can leave Chrome to take a narrower one by its geometric mean) */
  const prune = (c, sizes) => {
    if (c.length < 2 || !c.every((x) => /^\d+w$/.test(x.d) && bytes(x.u) != null)) return c;
    const w = (x) => parseInt(x.d, 10);
    const own = Math.max(...c.map(w));
    let kept = [...c].sort((a, b) => w(a) - w(b));
    for (const x of [...kept]) {
      if (!kept.some((y) => w(y) > w(x) && bytes(y.u) <= bytes(x.u))) continue;
      const left = kept.filter((y) => y !== x);
      if (!shortOf(left.map(w), sizes, own).length) kept = left;
    }
    return kept.length < c.length ? c.filter((x) => kept.includes(x)) : c;
  };
  const n = { pages: 0, sources: 0, lighter: 0, gone: 0, pruned: 0, frames: 0, full: 0 };
  for (const f of walk(outDir)) {
    const html = fs.readFileSync(f, 'utf8');
    if (!/<picture\b|data-img-set(?:-wide)?=|data-full-avif=/.test(html)) continue;
    /* (the marker: the class zl-avif; and data-zl-avif, as the first builds of the policy wrote it, or datazlavif, as
       MDX turned that) */
    let next = html.replace(/<img\b(?=[^>]*(?:\bclass="(?:[^"]*\s)?zl-avif(?:\s[^"]*)?"|\bdata-?zl-?avif\b))[^>]*>/gi, (tag) => {
      const a = attrsOf(tag);
      const s = get(a, 'srcset') || get(a, 'src');
      if (!s) return tag;
      n.sources++;
      const sz = get(a, 'sizes');
      return `<source type="image/avif" srcset="${s}"${sz ? ` sizes="${sz}"` : ''}>`;
    });
    next = next.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, (pic) => {
      const st = /<source\b[^>]*>/i.exec(pic), it = /<img\b[^>]*>/i.exec(pic);
      if (!it) return pic;
      const ia = attrsOf(it[0]);
      let B = candidates(get(ia, 'srcset') || get(ia, 'src'));
      let out = pic, gone = false;
      if (st) {
        const sa = attrsOf(st[0]);
        if (String(get(sa, 'type') || '').toLowerCase() === 'image/avif') {
          let A = candidates(get(sa, 'srcset'));
          const byD = new Map(B.map((x) => [x.d || '1x', x]));
          A = A.map((x) => {
            const y = byD.get(x.d || '1x') || (A.length === 1 && B.length === 1 ? B[0] : null);
            if (y && bytes(y.u) != null && bytes(x.u) != null && bytes(y.u) < bytes(x.u)) { n.lighter++; return { u: y.u, d: x.d }; }
            return x;
          });
          const A2 = prune(A, get(sa, 'sizes') || get(ia, 'sizes'));
          n.pruned += A.length - A2.length;
          const own = new Set(B.map((x) => `${x.u} ${x.d || '1x'}`));
          if (A2.every((x) => own.has(`${x.u} ${x.d || '1x'}`))) { out = out.replace(st[0], ''); n.gone++; gone = true; }
          else { set(sa, 'srcset', setOf(A2)); out = out.replace(st[0], tagOf('source', sa)); }
        }
      }
      const B2 = prune(B, get(ia, 'sizes'));
      if (B2.length < B.length && get(ia, 'srcset')) { n.pruned += B.length - B2.length; set(ia, 'srcset', setOf(B2)); out = out.replace(it[0], tagOf('img', ia)); }
      /* (no <source> left: the <img> alone, as a picture of one form is; the sheet styles both, styles/article.css) */
      if (gone) { const im = /<img\b[^>]*>/i.exec(out); if (im) return im[0]; }
      return out;
    });
    next = next.replace(/<span\b[^>]*\bdata-img-set="[^"]*"[^>]*>/gi, (tag) => {
      const a = attrsOf(tag);
      const src = get(a, 'data-src'), av = /url\(&quot;([^&]+)&quot;\)\s*type\(&quot;image\/avif&quot;\)/.exec(get(a, 'data-img-set') || '');
      if (!src || !av || bytes(src) == null || bytes(av[1]) == null || bytes(src) > bytes(av[1])) return tag;
      n.frames++;
      set(a, 'data-img-set', null);
      const style = get(a, 'style');
      if (style) set(a, 'style', style.replace(/background-image:image-set\((?:[^)]*\)\s*type\([^)]*\)\s*,?\s*)+\);?/g, ''));
      return tagOf('span', a);
    });
    /* (the big-screen mode's file of a frame, Frame.astro's wide: the same, its own image-set() and fallback) */
    next = next.replace(/<span\b[^>]*\bdata-img-set-wide="[^"]*"[^>]*>/gi, (tag) => {
      const a = attrsOf(tag);
      const src = get(a, 'data-src-wide'), av = /url\(&quot;([^&]+)&quot;\)\s*type\(&quot;image\/avif&quot;\)/.exec(get(a, 'data-img-set-wide') || '');
      if (!src || !av || bytes(src) == null || bytes(av[1]) == null || bytes(src) > bytes(av[1])) return tag;
      n.frames++;
      set(a, 'data-img-set-wide', null);
      return tagOf('span', a);
    });
    next = next.replace(/<a\b[^>]*\bdata-full-avif="[^"]*"[^>]*>/gi, (tag) => {
      const a = attrsOf(tag);
      const full = get(a, 'data-full'), av = get(a, 'data-full-avif');
      if (!full || !av || bytes(full) == null || bytes(av) == null || bytes(full) >= bytes(av)) return tag;
      n.full++;
      set(a, 'data-full-avif', full);
      return tagOf('a', a);
    });
    if (next !== html) { fs.writeFileSync(f, next); n.pages++; }
  }
  return n;
}

export function pictureSources() {
  let base = '/';
  return {
    name: 'zl-picture-sources',
    hooks: {
      'astro:config:done': ({ config }) => { base = config.base.endsWith('/') ? config.base : config.base + '/'; },
      'astro:build:done': ({ dir, logger }) => {
        const n = finishPictures(fileURLToPath(dir), base);
        logger.info(`pictures: ${n.sources} AVIF <source>s made; ${n.lighter} widths given the lighter fallback file, ${n.gone} <source>s left with none of their own; ${n.pruned} srcset files heavier than a wider one left out; ${n.frames} frames on their fallback alone; ${n.full} viewer pictures the lighter; on ${n.pages} pages`);
      },
    },
  };
}
