// npm run check, last: the speed budget (the speed round, 2026-10-16). What each page costs a reader who opens it,
// read from the built files alone: no browser, nothing timed, the same answer on every run. Counted: its HTML; its
// stylesheets; its scripts, with every module they import before they run (an import made later, as a post's live
// figure, is asked for when needed and not counted); the fonts it preloads; and its pictures as four screens take
// them, a phone (390 CSS px wide at 3x), his screen (1463 at 1.75x) and the big-screen mode's two (2194 x 1100 at
// 1.75x, his monitor, and 2560 x 1440 at 1x): from srcset and sizes the file Chrome takes (its own rule, the
// geometric mean of two densities: lib/picture.mjs chromePick; in a <picture>, from its first <source> of a type
// Chrome shows, its AVIF), the videos' posters, the framed pictures (the image-set() of a frame's data-img-set as Chrome reads it, its
// AVIF, else its data-src; on the mode's two screens its data-img-set-wide, else data-src-wide, where it has them;
// another element's style url()) and the favicon. Bytes as GitHub Pages sends them: text gzipped, fonts and pictures as they are; KB are 1000 bytes.
// It says, naming the page, the kind and the overrun, where:
//   budget   a page is over its row of BUDGET (below: the round's own numbers and about a tenth more): a failure,
//            in a local npm run check as in the deploy's (.github/workflows/deploy.yml), since the speed round's
//            numbers were set (the coordinator, 2026-10-17); ZL_BUDGET=warn lists an overrun and goes on, for a
//            builder whose work is still moving a page
// and it fails where:
//   origin   a page asks another origin for anything: a script, a stylesheet, a font, a picture, a frame, a
//            connection. One exception, by name: the visitor stats' tag (GA4's gtag.js, async, from
//            www.googletagmanager.com: integrations/csp.mjs GA_SCRIPT), whose bytes are Google's, not the build's, so
//            they are not in the page's numbers and are said on a line of their own (README.md, "Analytics")
//   cap      a picture is wider than the most its place can show: its slot (sizes, or its width) on the screens the
//            build makes pictures for (lib/picture.mjs SCREENS: a desk at up to 2x, the big-screen mode's among them, a
//            tablet at 2x, a phone at up to 3x), past the srcset's file for that; a srcset's file at the picture's own width excepted (the picture
//            as it is, for a screen past those); a <picture>'s <source> as its <img>, so each form the browsers take
//   preload  a module a page's scripts import is not preloaded (src/integrations/modulepreload.mjs)
//   rules    a page of the site (one with its CSP) has no speculation rules, or more than one, or rules that do not
//            parse or prerender nothing, or whose hash its CSP's script-src does not name
// node scripts/check-budget.mjs [dir] [base]   (ZL_BUDGET=warn: an overrun is listed, not failed on; README.md,
// "Speed budget", says how a budget is raised, and when)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fromHtml } from 'hast-util-from-html';
import sharp from 'sharp';
import { importsOf } from '../src/integrations/modulepreload.mjs';
import { GA_SCRIPT } from '../src/integrations/csp.mjs';
import { SCREENS as MADE_FOR, chromePick, slotAt } from '../src/lib/picture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.argv[2] || 'dist');
const BASE = process.argv[3] || '/';
const HOST = 'zhenyuanlu.com';
const STRICT = process.env.ZL_BUDGET !== 'warn';
/** the screens the pages are weighed on: a phone, his screen, and the big-screen mode's two (the coordinator,
    2026-10-16: his monitor, and a 1440p screen at 100%) */
const SCREENS = { phone: { w: 390, h: 844, dpr: 3 }, desk: { w: 1463, h: 914, dpr: 1.75 }, wide: { w: 2194, h: 1100, dpr: 1.75 }, big: { w: 2560, h: 1440, dpr: 1 } };
const ON = Object.keys(SCREENS);
/* the screens in the big-screen mode (scripts/early.js, step(): a desk window at least 1000px wide, whose 960 x k is
   at most 60% of its width and 860 x k at most its height for a k of 1.125 to 1.5; never a phone): wide and big */
const MODE = Object.fromEntries(ON.map((s) => { const c = SCREENS[s]; return [s, s !== 'phone' && c.w >= 1000 && [1.5, 1.375, 1.25, 1.125].some((k) => 960 * k <= 0.6 * c.w + 1e-6 && 860 * k <= c.h + 1e-6)]; }));

// ---- the budget: one row per kind of page, the first whose address matches; KB as sent, and requests ----
// (set from the speed round's final build, 2026-10-17 00:27, with the picture policy in it: the largest of each
// kind and about a tenth more, KB to the half above, a request more at least; 'other', the catch-all for a page of a
// new kind, kept as it was. A picture's budget never asks for a picture to be made worse than its source: every
// picture is made at the lightest setting like its source (lib/picture-encode.mjs), and where a page grows for a
// picture's own detail, its row is raised, never the picture made worse)
const COLS = ['html', 'css', 'js', 'fonts', ...['img', 'total', 'req'].flatMap((k) => ON.map((s) => `${k} ${s}`))];
const BUDGET = [
  //  kind      addresses                         html    css     js  fonts  img: phone    desk    wide     big  total: phone    desk    wide     big  req: phone  desk  wide   big
  ['home',      /^\/$/,                          [ 8.0,  10.0,  87.5,  19.5,      286.5,  286.5,  286.5,  286.5,        410.5,  410.5,  410.5,  410.5,         28,   28,   28,   28]],
  ['race',      /^\/race\/$/,                    [10.0,   9.5,  98.5,  25.5,        1.0,    1.0,    1.0,    1.0,        143.0,  143.0,  143.0,  143.0,         17,   17,   17,   17]],
  ['season',    /^\/race\/\d{4}\/$/,             [ 9.0,   9.5,  98.5,  25.5,        1.0,    1.0,    1.0,    1.0,        142.0,  142.0,  142.0,  142.0,         17,   17,   17,   17]],
  ['blog',      /^\/blog\/$/,                    [ 9.0,   8.5,  21.5,  25.5,       93.0,   93.0,   93.0,   93.0,        156.0,  156.0,  156.0,  156.0,         22,   22,   22,   22]],
  ['post',      /^\/blog\/[^/]+\/$/,             [29.0,  18.5,  20.0,  25.5,      488.5,  538.5,  551.5,  326.5,        580.5,  630.5,  643.5,  418.5,         30,   31,   31,   31]],
  ['see',       /^\/see\/$/,                     [10.5,   8.0,  20.5,  25.5,      818.5,  817.0,  827.5,  769.5,        882.5,  881.0,  891.5,  833.5,         30,   30,   30,   30]],
  /* (Huh: a row of its own since its photograph held the old pictures' largest; made at the bar as every other now,
     its row is its own numbers, as each kind's is) */
  ['huh',       /^\/see\/huh\/$/,                [ 6.0,   8.0,  17.0,  13.0,      114.5,  114.5,  114.5,  114.5,        157.5,  157.5,  157.5,  157.5,         18,   18,   18,   18]],
  ['photo',     /^\/see\/[^/]+\/$/,              [ 6.0,   8.0,  17.0,  13.0,      177.5,  177.5,  177.5,  177.5,        220.5,  220.5,  220.5,  220.5,         18,   18,   18,   18]],
  ['build',     /^\/build\/$/,                   [11.5,  10.0,  20.5,  25.5,      188.0,  188.0,  204.0,  204.0,        254.5,  254.5,  270.5,  270.5,         30,   30,   30,   30]],
  ['teach',     /^\/teach\/$/,                   [ 9.5,   7.5,  19.5,  25.5,        1.0,    1.0,    1.0,    1.0,         61.5,   61.5,   61.5,   61.5,         18,   18,   18,   18]],
  ['404',       /^\/404\.html$/,                 [ 6.5,   6.5,  17.0,  13.0,        1.0,    1.0,    1.0,    1.0,         42.5,   42.5,   42.5,   42.5,         15,   15,   15,   15]],
  ['other',     /./,                             [ 3.0,   7.0,  19.0,  25.5,        1.0,    1.0,    1.0,    1.0,         55.0,   55.0,   55.0,   55.0,         12,   12,   12,   12]],
];

const errors = [], over = [];
const err = (m) => errors.push(m);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const addressOf = (file) => { const rel = path.relative(DIST, file).split(path.sep).join('/'); return BASE + (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel); };
/** an address (absolute, root-relative or relative to the page) to its file in the build, or null; another origin: 'other' */
function fileOf(ref, page) {
  if (!ref || /^(data|blob|about|javascript|mailto|tel):/i.test(ref) || ref.startsWith('#')) return null;
  let u;
  try { u = new URL(ref, `https://${HOST}${page}`); } catch { return null; }
  if (u.host !== HOST) return 'other';
  if (!u.pathname.startsWith(BASE)) return null;
  let rel = decodeURIComponent(u.pathname.slice(BASE.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}
const TEXT = /\.(html|css|js|mjs|json|svg|xml|txt|webmanifest|ico|map)$/i;
const sentOf = new Map();
/** a file's bytes as GitHub Pages sends them: text gzipped (level 6), the rest as it is */
function sent(file) {
  if (!sentOf.has(file)) { const b = fs.readFileSync(file); sentOf.set(file, TEXT.test(file) ? zlib.gzipSync(b, { level: 6 }).length : b.length); }
  return sentOf.get(file);
}
const kb = (n) => Math.round(n / 100) / 10;

// ---- sizes and srcset, as a browser reads them (slotAt, chromePick: lib/picture.mjs) ----
/** a srcset's candidates: { u, w } or { u, x } */
const candidates = (srcset) => (srcset || '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
  const [u, d] = x.split(/\s+/);
  return /w$/.test(d || '') ? { u, w: parseFloat(d) } : { u, x: d ? parseFloat(d) : 1 };
});
/** the types of picture Chrome shows: a <picture>'s <source> or an image-set()'s option of one of them is its */
const SHOWN = new Set(['image/avif', 'image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']);
/** a list's parts at its top level (commas inside parentheses are the parts' own) */
function topLevel(s) {
  const parts = []; let depth = 0, cur = '';
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { parts.push(cur); cur = ''; } else cur += ch; }
  return [...parts, cur].map((x) => x.trim()).filter(Boolean);
}
/** the file an image-set() gives Chrome: its first option of a type Chrome shows (null: no image-set) */
function imageSetPick(v) {
  const m = /^\s*image-set\(([\s\S]*)\)\s*$/i.exec(v || '');
  if (!m) return null;
  for (const o of topLevel(m[1])) {
    const u = /url\(\s*(["']?)([^"')]+)\1\s*\)/.exec(o), t = /type\(\s*(["'])([^"']+)\1\s*\)/.exec(o);
    if (u && (!t || SHOWN.has(t[2].toLowerCase()))) return u[2];
  }
  return null;
}
/** the candidate a screen takes, as Chrome takes it: by width (lib/picture.mjs chromePick), or by density */
function pick(cands, slot, dpr) {
  if (cands.every((c) => c.w)) { const w = chromePick(cands.map((c) => c.w), slot, dpr); return cands.find((c) => c.w === w); }
  const d = cands.map((c) => ({ ...c, d: c.w ? c.w / slot : c.x })).sort((a, b) => a.d - b.d);
  return d.find((c) => c.d >= dpr - 1e-9) || d[d.length - 1];
}
/** the most device pixels a slot shows on the screens the build makes pictures for (lib/picture.mjs SCREENS) */
function capOf(slotFn) {
  let m = 0;
  for (const s of MADE_FOR) m = Math.max(m, slotFn(s.w, s.h) * s.dpr);
  return m;
}

// ---- each page ----
const pages = [];
const widthOf = new Map();
async function pixelWidth(f) { if (!widthOf.has(f)) { try { widthOf.set(f, (await sharp(f).metadata()).width || 0); } catch { widthOf.set(f, 0); } } return widthOf.get(f); }
const depsOf = new Map();
function deps(file, seen) {
  if (!depsOf.has(file)) depsOf.set(file, importsOf(fs.readFileSync(file, 'utf8')).filter((s) => s.startsWith('.')).map((s) => path.resolve(path.dirname(file), s)));
  for (const d of depsOf.get(file)) if (!seen.has(d) && fs.existsSync(d)) { seen.add(d); deps(d, seen); }
  return seen;
}
const textOf = (n) => (n.children || []).map((c) => (c.type === 'text' ? c.value : textOf(c))).join('');

for (const file of walk(DIST).filter((f) => f.endsWith('.html')).sort()) {
  const address = addressOf(file);
  const tree = fromHtml(fs.readFileSync(file, 'utf8'));
  const P = { address, file, css: new Set(), js: new Set(), mp: new Set(), fonts: new Set(), img: Object.fromEntries(ON.map((s) => [s, new Set()])), lazy: 0, later: 0, ga: 0, csp: null, rules: [], icon: null };
  const refs = [];   // [what, url]: everything that makes a request, for the origin rule
  const want = (what, url) => { refs.push([what, url]); return fileOf(url, address); };
  const shots = [];  // pictures for the cap rule: [what, file, cap]
  const visit = (n) => {
    if (n.type !== 'element') return (n.children || []).forEach(visit);
    const p = n.properties || {};
    const rel = (p.rel || []).map((r) => String(r).toLowerCase());
    if (n.tagName === 'meta' && (p.httpEquiv || []).map((x) => String(x).toLowerCase()).includes('content-security-policy')) P.csp = String(p.content || '');
    if (n.tagName === 'link' && p.href) {
      if (rel.includes('stylesheet')) { const f = want('stylesheet', p.href); if (f && f !== 'other') P.css.add(f); }
      if (rel.includes('modulepreload')) { const f = want('modulepreload', p.href); if (f && f !== 'other') P.mp.add(f); }
      if (rel.includes('preload') && p.as === 'font') { const f = want('font', p.href); if (f && f !== 'other') P.fonts.add(f); }
      if (rel.includes('preload') && p.as === 'image') for (const s of Object.keys(SCREENS)) { const c = p.imageSrcSet ? pick(candidates(p.imageSrcSet), slotAt(p.imageSizes, SCREENS[s].w, SCREENS[s].h), SCREENS[s].dpr) : { u: p.href }; const f = want('picture', c.u); if (f && f !== 'other') P.img[s].add(f); }
      if (['preload', 'prefetch', 'preconnect', 'dns-prefetch', 'prerender', 'manifest', 'icon', 'apple-touch-icon'].some((r) => rel.includes(r))) want(rel.join(' '), p.href);
      if (rel.includes('icon') && (!P.icon || p.type === 'image/svg+xml')) P.icon = p.href;
    }
    if (n.tagName === 'script') {
      /* (the visitor stats' tag: allowed by name, async; its bytes are Google's, said apart) */
      if (p.src && String(p.src).startsWith(GA_SCRIPT + '/gtag/js?id=') && (p.async === true || p.async === '')) P.ga++;
      else if (p.src) { const f = want('script', p.src); if (f && f !== 'other') P.js.add(f); }
      else if (p.type === 'speculationrules') P.rules.push(textOf(n));
    }
    if (n.tagName === 'picture') {
      /* (a <picture>: Chrome takes its first <source> of a type it shows, and its <img> shows that source's file; the
         <img>'s own src and srcset are for a browser that shows none of them) */
      const kids = (n.children || []).filter((c) => c.type === 'element');
      const img = kids.find((c) => c.tagName === 'img');
      const src = kids.find((c) => { const q = c.properties || {}; return c.tagName === 'source' && !q.media && (!q.type || SHOWN.has(String(q.type).toLowerCase())); });
      if (img && src) img.zlSource = src.properties || {};
    }
    if (n.tagName === 'img') {
      const S = n.zlSource || null;
      const cands = (S ? S.srcSet : p.srcSet) ? candidates(S ? S.srcSet : p.srcSet) : [];
      const sizes = S ? S.sizes : p.sizes;
      if (p.loading === 'lazy') P.lazy++;
      for (const s of Object.keys(SCREENS)) {
        const c = cands.length ? pick(cands.some((x) => x.w) ? cands.filter((x) => x.w) : cands.concat(!S && p.src && !cands.some((x) => x.x === 1) ? [{ u: p.src, x: 1 }] : []), slotAt(sizes, SCREENS[s].w, SCREENS[s].h), SCREENS[s].dpr) : { u: p.src };
        const f = want('picture', c.u);
        if (f && f !== 'other') P.img[s].add(f);
      }
      /* the cap: the srcset's files past the one that holds the most its place shows, its own width's excepted; for
         the <img>'s own files and its <source>'s, each form the browsers take */
      const own = +p.width || 0;
      const capped = (set, sz, one) => {
        const cs = set ? candidates(set) : [];
        if (cs.some((x) => x.w) && sz) {
          const cap = capOf((W, H) => slotAt(sz, W, H)), ws = cs.filter((x) => x.w).sort((a, b) => a.w - b.w), top = ws.find((x) => x.w >= cap - 1e-6);
          ws.filter((x) => top && x.w > top.w && x.w !== own).forEach((x) => err(`${address}: cap: ${x.u} (${x.w}w) is past the most its place shows (${Math.ceil(cap)} device px: ${top.u}, ${top.w}w, holds it)`));
        } else if (one && own) shots.push(['picture', fileOf(one, address), capOf((W) => Math.min(own, W))]);
      };
      capped(p.srcSet, p.sizes, p.src);
      if (S) capped(S.srcSet, S.sizes, cands.length === 1 && !cands[0].w ? cands[0].u : null);
    }
    if (n.tagName === 'video') {
      if (p.poster) { const f = want('poster', p.poster); if (f && f !== 'other') { ON.forEach((s) => P.img[s].add(f)); if (+p.width) shots.push(['poster', f, capOf((W) => Math.min(+p.width, W))]); } }
      if (p.src) { want('video', p.src); P.later++; }
    }
    if (['source', 'audio', 'track', 'iframe', 'embed', 'input'].includes(n.tagName) && p.src) want(n.tagName, p.src);
    if (n.tagName === 'source' && p.srcSet) candidates(p.srcSet).forEach((c) => want('source', c.u));
    if (n.tagName === 'object' && p.data) want('object', p.data);
    /* a frame (components/Frame.astro): its picture as Chrome takes it, the AVIF of its data-img-set's image-set() (frames.js
       puts it in, or its first style has it), else its data-src; its style's url()s, the same picture's other forms,
       only for the origin rule. Another element's style url(): its picture */
    const framed = p.dataImgSet != null || p.dataSrc != null ? imageSetPick(String(p.dataImgSet || '')) || (p.dataSrc != null ? String(p.dataSrc) : null) : null;
    /* (and on a screen in the big-screen mode, the mode's own file where the frame has one: Frame.astro's wide) */
    const framedW = p.dataSrcWide != null ? imageSetPick(String(p.dataImgSetWide || '')) || String(p.dataSrcWide) : null;
    if (framed) {
      const f = want('framed picture', framed), fw = framedW ? want('framed picture (the big-screen mode)', framedW) : null;
      ON.forEach((s) => { const x = fw && MODE[s] ? fw : f; if (x && x !== 'other') P.img[s].add(x); });
    }
    if (p.style) for (const m of String(p.style).matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g)) { const f = want('style url()', m[2]); if (!framed && f && f !== 'other') ON.forEach((s) => P.img[s].add(f)); }
    if (p.dataFull) P.later++;
    (n.children || []).forEach(visit);
  };
  visit(tree);
  if (P.icon) { const f = want('icon', P.icon); if (f && f !== 'other') ON.forEach((s) => P.img[s].add(f)); }
  /* the scripts, and every module they import before they run */
  const entries = [...P.js];
  const graph = new Set(entries);
  entries.forEach((f) => deps(f, graph));
  for (const f of graph) if (!entries.includes(f) && !P.mp.has(f)) err(`${address}: preload: ${path.relative(DIST, f)}, which its scripts import, is not preloaded`);
  P.js = graph;
  /* the stylesheets' own requests (their fonts are counted where preloaded), for the origin rule */
  for (const f of P.css) for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:url\(\s*(["']?)([^"')]+)\1\s*\)|@import\s+["']([^"']+)["'])/g)) { const u = m[2] || m[3]; if (!u.startsWith('#')) refs.push(['stylesheet ' + path.basename(f), new URL(u, `https://${HOST}${BASE}${path.relative(DIST, f).split(path.sep).join('/')}`).href]); }
  for (const [what, url] of refs) if (fileOf(url, address) === 'other') err(`${address}: origin: a ${what} from another origin, ${url}`);
  for (const [what, f, cap] of shots) if (f && f !== 'other') { const w = await pixelWidth(f); if (w > Math.ceil(cap)) err(`${address}: cap: the ${what} ${path.relative(DIST, f)} is ${w}px wide, past the most its place shows (${Math.ceil(cap)} device px)`); }
  /* the speculation rules, on a page of the site */
  if (P.csp != null) {
    if (P.rules.length !== 1) err(`${address}: rules: ${P.rules.length} speculation rules scripts (one wanted)`);
    for (const r of P.rules) {
      let j = null;
      try { j = JSON.parse(r); } catch (e) { err(`${address}: rules: the speculation rules do not parse: ${e.message}`); }
      if (j && !(Array.isArray(j.prerender) && j.prerender.length)) err(`${address}: rules: the speculation rules prerender nothing`);
      const h = `'sha256-${crypto.createHash('sha256').update(r).digest('base64')}'`;
      const src = (/(?:^|;)\s*script-src\s+([^;]*)/.exec(P.csp) || [])[1] || '';
      if (!src.split(/\s+/).includes(h)) err(`${address}: rules: the CSP's script-src does not name the rules' hash ${h}`);
    }
  }
  const sum = (s) => [...s].reduce((a, f) => a + sent(f), 0);
  const m = { html: sent(file), css: sum(P.css), js: sum(P.js), fonts: sum(P.fonts) };
  for (const s of ON) {
    m[`img ${s}`] = sum(P.img[s]);
    m[`total ${s}`] = m.html + m.css + m.js + m.fonts + m[`img ${s}`];
    m[`req ${s}`] = 1 + P.css.size + P.js.size + P.fonts.size + P.img[s].size;
  }
  const row = BUDGET.find((b) => b[1].test(address.slice(BASE.length - 1)));
  pages.push({ address, kind: row[0], m, lazy: P.lazy, later: P.later, ga: P.ga });
  COLS.forEach((c, i) => {
    const lim = row[2][i], v = c.startsWith('req') ? m[c] : kb(m[c]);
    if (v > lim) over.push(`${address}: budget: ${c} ${v}${c.startsWith('req') ? ' requests' : ' KB'} is over its budget (${row[0]}: ${lim}) by ${c.startsWith('req') ? v - lim : Math.round((v - lim) * 10) / 10}${c.startsWith('req') ? '' : ' KB'} (${Math.round(((v - lim) / lim) * 1000) / 10}%)`);
  });
}

// ---- the table, then what is wrong ----
console.log(`speed budget: ${pages.length} pages of ${path.relative(ROOT, DIST) || DIST}, KB as sent (text gzipped), requests; ${ON.map((k) => `${k} ${SCREENS[k].w}x${SCREENS[k].h} at ${SCREENS[k].dpr}x`).join(', ')}`);
console.log(['page'.padEnd(46), 'kind'.padEnd(7), ...COLS.map((c) => c.padStart(11))].join(' '));
for (const p of pages) console.log([p.address.padEnd(46), p.kind.padEnd(7), ...COLS.map((c) => String(c.startsWith('req') ? p.m[c] : kb(p.m[c]).toFixed(1)).padStart(11))].join(' ') + (p.lazy || p.later ? `   (${p.lazy} lazy pictures counted; ${p.later} asked for only when wanted, not counted)` : ''));
const byKind = {};
for (const p of pages) for (const c of COLS) { const v = c.startsWith('req') ? p.m[c] : kb(p.m[c]); byKind[p.kind] = byKind[p.kind] || {}; byKind[p.kind][c] = Math.max(byKind[p.kind][c] || 0, v); }
console.log('\nthe largest of each kind against its budget:');
for (const [k, , lim] of BUDGET) if (byKind[k]) console.log(`  ${k.padEnd(7)} ${COLS.map((c, i) => `${c} ${byKind[k][c]}/${lim[i]}`).join(', ')}`);
if (over.length) {
  console.error(`\n${over.length} over budget${STRICT ? '' : ' (listed only, as ZL_BUDGET=warn asks; without it they fail, as in the deploy)'}:`);
  over.forEach((e) => console.error('  ' + e));
}
if (errors.length) {
  console.error(`\n${errors.length} speed problem${errors.length > 1 ? 's' : ''}:`);
  errors.forEach((e) => console.error('  ' + e));
}
/* (the visitor stats on a line of their own: gtag.js is Google's file, its size Google's to change, so it is not
   in the pages' numbers; the round measured it in the browser: README.md, "Analytics") */
const gaN = pages.filter((p) => p.ga).length;
const gaIds = walk(DIST).filter((f) => f.endsWith('.html') && /<meta name="zl-ga4"/.test(fs.readFileSync(f, 'utf8'))).length;
console.log(gaIds || gaN ? `\nvisitor stats: GA4's gtag.js (from www.googletagmanager.com, Google's file: not in the numbers above), its static tag on ${gaN} page${gaN === 1 ? '' : 's'} (the home's, for Search Console), added once the page has loaded on the other ${gaIds - gaN}; a request a page more, and its counts'` : '\nvisitor stats: none in this build');
if (errors.length || (STRICT && over.length)) process.exit(1);
const held = "no other origin but the visitor stats' tag; no picture past its cap; every module preloaded; the speculation rules on every page, hashed";
console.log(over.length ? `\nspeed budget: ${held}; ${over.length} over budget, warned of above` : `\nspeed budget: every page within its budget; ${held}`);
