// npm run check (after astro check and a build): the built site in dist/ (or another folder and base:
// node scripts/check-dist.mjs <dir> <base>) checked as a reader and a search engine meet it.
//   links    every internal link, picture, video, script and stylesheet points at a file the build wrote, and
//            every #place at an id on its page (on race's /race/, a race's id of any season, or #next; on another
//            season's page, /race/<year>/, its own races' ids);
//            external addresses are listed, not fetched
//   pictures a picture's two forms (lib/picture-forms.mjs): a <picture>'s <source>s with its <img>'s sizes and widest
//            width, the lighter file at each width, none heavier than a wider one; on every screen the site is
//            checked on, the file Chrome takes never narrower than the picture is drawn (lib/picture.mjs); no post's
//            AVIF <img> left unmade into its <source>; a frame's image-set() ending in its own picture; no <picture>
//            without a <source>, no figure of more than one <img>, no "data" attribute without its hyphens.
//            ZL_DRAFTS=1 (a build with its drafts, to check them too): the drafts' rule under files is not for it
//   html     every page valid (html-validate, its recommended rules; DEVELOPMENT.md says what .htmlvalidate.json relaxes, and why)
//   csp      the Content-Security-Policy is the head's first element after the charset, and its hashes are exactly
//            those of the page's own inline scripts (the light's, and the speculation rules'): none missing, none
//            that matches nothing; no other origin in it but the visitor stats' own, on a page that carries their id
//   stats    the visitor stats (GA4): in the real site's build (base /) every page of the site carries
//            content/site.yaml's measurement id and our loader, and the home gtag.js's one static async tag in its
//            head (or Search Console's verification meta, once analytics.verify is set); none in another build; no
//            script from any other origin
//   data     every page's JSON-LD parses: a Person on every page, a BlogPosting on every post, an Event on every talk
//   files    feed.xml, the sitemap, robots.txt, CNAME, security.txt; no draft in a production build
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fromHtml } from 'hast-util-from-html';
import { HtmlValidate, formatterFactory } from 'html-validate';
import YAML from 'yaml';
import { draftSlugs } from '../src/lib/drafts.mjs';
import { GA_HOSTS, GA_SCRIPT } from '../src/integrations/csp.mjs';
import { shortOf } from '../src/lib/picture.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.argv[2] || 'dist');
const BASE = process.argv[3] || '/';
const SITE = 'https://zhenyuanlu.com';
/** the addresses on zhenyuanlu.com that other repositories' GitHub Pages serve (never made by this site) */
const OTHERS = ['/courses/', '/teachings/', '/artLife/', '/python-notebook/', '/r-comput-viz/', '/waycine/'];
const PROD = BASE === '/';
const errors = [], notes = [];
const err = (m) => errors.push(m);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
/** a file's address on the site, under the base */
function addressOf(file) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  return BASE + (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel);
}
/** an address under the base to the file that answers it, or null */
function fileOf(address) {
  if (!address.startsWith(BASE)) return null;
  let rel = decodeURIComponent(address.slice(BASE.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const f = path.join(DIST, rel);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? f : null;
}
/** a picture's address on a page to its file's bytes, or null */
function sizeAt(url, page) {
  let u;
  try { u = new URL(url, SITE + page); } catch { return null; }
  if (u.origin !== SITE) return null;
  const f = fileOf(u.pathname);
  return f ? fs.statSync(f).size : null;
}
/** a srcset's candidates (a lone src: one, with no descriptor) */
const cands = (set) => String(set || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [u, d] = s.split(/\s+/); return { u, d: d || '' }; });
/** a srcset of a <picture> names no file that weighs as much as a wider one of it (integrations/picture-sources.mjs),
    unless every screen the site is checked on needs it */
function heavier(what, c, page, sizes) {
  const ws = c.filter((x) => /^\d+w$/.test(x.d)).map((x) => ({ ...x, w: parseInt(x.d, 10), b: sizeAt(x.u, page) }));
  const own = Math.max(0, ...ws.map((x) => x.w));
  for (const x of ws) {
    const y = ws.find((z) => z.w > x.w && x.b != null && z.b != null && z.b <= x.b);
    if (y && !shortOf(ws.filter((z) => z !== x).map((z) => z.w), sizes, own).length) err(`${what}: ${x.u} (${x.d}, ${x.b} B) weighs as much as the wider ${y.u} (${y.d}, ${y.b} B)`);
  }
}
/** on every screen the site is checked on, the file Chrome takes of a srcset is at least as wide as the picture is
    drawn there (lib/picture.mjs: SCREENS, chromePick; to the nearest device pixel, or the picture's own width) */
function wideEnough(what, c, sizes) {
  const ws = c.filter((x) => /^\d+w$/.test(x.d)).map((x) => parseInt(x.d, 10));
  if (ws.length < 2) return;
  const own = Math.max(...ws);
  const short = shortOf(ws, sizes, own);
  if (short.length) err(`${what}: on ${short.length} screen${short.length > 1 ? 's' : ''} Chrome takes a narrower file than it draws, as at ${short[0].screen.w}x${short[0].screen.h} at ${short[0].screen.dpr}x: ${short[0].pick}w for ${Math.round(short[0].need)} device px`);
}

// ---- read every page: its ids, what it points at, its structured data ----
const pages = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const tree = fromHtml(html);
  const page = { file, address: addressOf(file), ids: new Set(), refs: [], ld: [], canonical: null, robots: '', head: [], scripts: [], csp: null };
  const visit = (n) => {
    if (n.type === 'element') {
      const p = n.properties || {};
      if (p.id) page.ids.add(String(p.id));
      if (n.tagName === 'a' && p.name) page.ids.add(String(p.name));
      const take = (v, kind) => { if (v != null && v !== '') page.refs.push({ url: String(v), kind: `${n.tagName}[${kind}]` }); };
      if (n.tagName === 'a' || (n.tagName === 'link' && p.rel)) take(p.href, 'href');
      if (['img', 'source', 'video', 'audio', 'script', 'iframe'].includes(n.tagName)) take(p.src, 'src');
      if (n.tagName === 'video') take(p.poster, 'poster');
      if (p.srcSet) String(p.srcSet).split(',').forEach((s) => take(s.trim().split(/\s+/)[0], 'srcset'));
      for (const k of ['dataSrc', 'dataFilm', 'dataAnim', 'dataFullAvif', 'dataSrcWide']) take(p[k], k);
      for (const k of ['dataImgSet', 'dataImgSetWide']) if (p[k]) for (const m of String(p[k]).matchAll(/url\("?([^")]+)"?\)/g)) take(m[1], k);
      // a picture in its two forms (the speed round's picture policy, lib/picture-forms.mjs; finished by
      // integrations/picture-sources.mjs): a <picture> is its <source>s, each with its type, srcset and the <img>'s
      // sizes, then its one <img>; an AVIF <source> names AVIF files, or the <img>'s own of the same width where that
      // is the lighter, and the same widest width as the <img>; no srcset of a <picture> names a file that weighs as
      // much as a wider one of it; no post's AVIF <img> is left unmade into its <source>; a frame's data-img-set is an
      // image-set() whose last option is its data-src, and is left only where its AVIF is the lighter.
      // And what a pipeline can break on its way (an .mdx post wrote the AVIF <img>'s marker data-zl-avif as
      // "datazlavif", so its <picture> kept two <img>s and showed its picture twice): no <picture> without a <source>,
      // no figure of more than one <img>, and no attribute "data" and letters with no hyphen (a property a pipeline wrote
      // as it was named, not as the attribute it stands for)
      for (const k of Object.keys(p)) if (/^data[a-z]+$/.test(k)) err(`${page.address}: a <${n.tagName}> with the attribute "${k}", a data attribute without its hyphens`);
      if (n.tagName === 'img' && (p.dataZlAvif != null || p.datazlavif != null || [].concat(p.className || []).includes('zl-avif'))) err(`${page.address}: a picture's AVIF <img> was not made its <source> (integrations/picture-sources.mjs): ${p.src}`);
      if (n.tagName === 'figure') {
        const imgsIn = (x) => (x.children || []).reduce((s, c) => s + (c.type === 'element' ? (c.tagName === 'img' ? 1 : 0) + imgsIn(c) : 0), 0);
        const k = imgsIn(n);
        if (k > 1) err(`${page.address}: a figure${p.id ? ` #${p.id}` : ''} of ${k} <img>s (a figure's picture is one <img>)`);
      }
      if (n.tagName === 'picture') {
        const kids = n.children.filter((c) => c.type === 'element');
        const imgs = kids.filter((c) => c.tagName === 'img');
        const where = `${page.address}: the picture ${imgs[0] ? imgs[0].properties.src : '(no img)'}`;
        if (!kids.some((c) => c.tagName === 'source')) err(`${where}: a <picture> without a <source>`);
        if (imgs.length !== 1 || kids[kids.length - 1] !== imgs[0]) err(`${where}: a <picture> has one <img>, after its <source>s`);
        else {
          const ip = imgs[0].properties || {};
          const own = cands(ip.srcSet || ip.src);
          heavier(where + "'s <img>", own, page.address, ip.sizes);
          wideEnough(where + "'s <img>", own, ip.sizes);
          for (const s of kids.filter((c) => c.tagName === 'source')) {
            const sp = s.properties || {};
            if (!sp.type || !sp.srcSet) { err(`${where}: a <source> without its type or its srcset`); continue; }
            if (String(sp.sizes || '') !== String(ip.sizes || '')) err(`${where}: its ${sp.type} <source>'s sizes are not its <img>'s`);
            const c = cands(sp.srcSet);
            const widest = (l) => l.reduce((m, x) => Math.max(m, parseFloat(x.d) || 0), 0);
            if (widest(c) !== widest(own)) err(`${where}: its ${sp.type} <source> is ${widest(c) || 'one file'} wide at most, its <img> ${widest(own) || 'one file'}`);
            if (String(sp.type).toLowerCase() === 'image/avif') for (const x of c) if (!/\.avif$/i.test(x.u) && !own.some((y) => y.u === x.u && (y.d || '1x') === (x.d || '1x'))) err(`${where}: its AVIF <source> names ${x.u} ${x.d}, neither an AVIF file nor its <img>'s of that width`);
            heavier(`${where}'s ${sp.type} <source>`, c, page.address, sp.sizes);
            wideEnough(`${where}'s ${sp.type} <source>`, c, sp.sizes);
          }
        }
      }
      for (const [k, s, nm] of [['dataImgSet', 'dataSrc', ''], ['dataImgSetWide', 'dataSrcWide', '-wide']]) if (p[k]) {
        const opts = [...String(p[k]).matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
        if (!/^image-set\(/.test(String(p[k])) || opts.length < 2 || opts[opts.length - 1] !== String(p[s] || '')) err(`${page.address}: a frame's data-img-set${nm} is not an image-set() whose last option is its data-src${nm}: ${p[k]}`);
        else { const a = sizeAt(opts[0], page.address), b = sizeAt(String(p[s]), page.address); if (a != null && b != null && b <= a) err(`${page.address}: a frame keeps its image-set()${nm ? ' for the big-screen mode' : ''} though its fallback ${p[s]} (${b} B) weighs no more than its AVIF ${opts[0]} (${a} B)`); }
      }
      // a frame's big-screen mode file (components/Frame.astro, wide): with its own pixels, more of them than the
      // frame's own file has, in the same shape; its image-set() only with it
      if (p.dataImgSetWide != null && p.dataSrcWide == null) err(`${page.address}: a frame has a data-img-set-wide without its data-src-wide`);
      if (p.dataSrcWide != null) {
        const w = +p.dataW, h = +p.dataH, ww = +p.dataWWide, hw = +p.dataHWide;
        if (!(ww > 0 && hw > 0)) err(`${page.address}: a frame's big-screen mode file ${p.dataSrcWide} has no data-w-wide and data-h-wide`);
        else if (!(hw > h && ww > w)) err(`${page.address}: a frame's big-screen mode file ${p.dataSrcWide} (${ww} x ${hw}) has no more pixels than its own (${w} x ${h})`);
        else if (Math.abs(ww / hw - w / h) > 0.01 * (w / h)) err(`${page.address}: a frame's big-screen mode file ${p.dataSrcWide} (${ww} x ${hw}) is not its own file's shape (${w} x ${h})`);
      }
      if (n.tagName === 'meta' && /^(og:image|twitter:image|og:url)$/.test(String(p.property || p.name || ''))) take(p.content, 'meta');
      if (n.tagName === 'link' && [].concat(p.rel).includes('canonical')) page.canonical = String(p.href);
      if (n.tagName === 'meta' && p.name === 'robots') page.robots = String(p.content || '');
      if (n.tagName === 'script' && p.type === 'application/ld+json') page.ld.push(n.children.map((c) => c.value || '').join(''));
      // a data block (type application/json: a page's data for its own script, as the home's races) is never run, so
      // it is no inline script and no hash of the CSP's; it must parse
      const data = n.tagName === 'script' && !p.src && p.type === 'application/json';
      if (data) {
        let json = null;
        try { json = JSON.parse(n.children.map((c) => c.value || '').join('')); } catch (e) { err(`${page.address}: the data block ${p.id ? '#' + p.id : ''} does not parse: ${e.message}`); }
        // race's pages (#race-data): the current season's, /race/, answers for every race's id after its #, of any
        // season (the engine opens a race of another season at its own page), and for #next; another season's page,
        // /race/<year>/, for its own races' ids: scripts/race/address.js readAddress, model.js asked
        if (json && p.id === 'race-data' && json.races && json.races.seasons) {
          const own = String(p.dataSeason), current = String(p.dataCurrent) === own;
          page.fragments = new Set(current ? ['next'] : []);
          Object.entries(json.races.seasons).forEach(([y, list]) => (current || y === own) && (list || []).forEach((r) => r && r.id && page.fragments.add(String(r.id))));
        }
      }
      // the speculation rules (components/DocHead.astro): not run either, but inline, so the CSP carries their hash
      // (below, as an inline script's); one at most, and it must parse
      const rules = n.tagName === 'script' && !p.src && p.type === 'speculationrules';
      if (rules) {
        page.rules = (page.rules || 0) + 1;
        try { JSON.parse(n.children.map((c) => c.value || '').join('')); } catch (e) { err(`${page.address}: the speculation rules do not parse: ${e.message}`); }
      }
      if (n.tagName === 'style' || (n.tagName === 'script' && !p.src && !data && !rules && p.type !== 'application/ld+json')) page.inline = (page.inline || 0) + 1;
      if (n.tagName === 'script' && !p.src && !data && p.type !== 'application/ld+json') page.scripts.push(n.children.map((c) => c.value || '').join(''));
      if (n.tagName === 'head') page.head = n.children.filter((c) => c.type === 'element');
      // the visitor stats (components/DocHead.astro): the id's meta, the home's static tag of gtag.js, Search Console's
      // verification meta, and our loader (a module of the page's that names gtag.js); any other script from another
      // origin is wrong
      if (n.tagName === 'script' && p.src && /^(https?:)?\/\//i.test(String(p.src)) && !String(p.src).startsWith(SITE + '/')) {
        if (String(p.src).startsWith(GA_SCRIPT + '/gtag/js?id=')) (page.ga = page.ga || []).push({ id: new URL(String(p.src)).searchParams.get('id'), async: p.async === true || p.async === '' });
        else err(`${page.address}: a script from another origin, ${p.src}: none but the visitor stats' tag may come from one`);
      }
      if (n.tagName === 'meta' && p.name === 'zl-ga4') (page.gaId = page.gaId || []).push(String(p.content || ''));
      if (n.tagName === 'meta' && p.name === 'google-site-verification') (page.gsv = page.gsv || []).push(String(p.content || ''));
      if (n.tagName === 'script' && p.type === 'module' && p.src) (page.modules = page.modules || []).push(String(p.src));
      if (n.tagName === 'meta' && String(p.httpEquiv || '').toLowerCase() === 'content-security-policy') page.csp = String(p.content || '');
      // a background picture written by the server (the blog's frames)
      if (typeof p.style === 'string') for (const m of p.style.matchAll(/url\("?([^")]+)"?\)/g)) take(m[1], 'style');
    }
    (n.children || []).forEach(visit);
  };
  visit(tree);
  pages.set(page.address, page);
}

// ---- the old addresses (phase 5, the launch) ----
// Every address the live Jekyll site answers (main at 1ad55db; its sitemap of 2026-10-16) and the 2024 site's
// /projects/<name>/ answer in this build: with their own page or file at the same address ('='), or with a redirect
// page to their new place (a meta refresh at once, noindex, that place its canonical), which the build has, with the
// id after its #. Redirect pages (astro.config.mjs redirects; public/_blog/) are checked here and left out of the page
// rules below, which are for the site's own pages. The old home's sections (/#software, ...) are followed by the
// home's script (scripts/home/old-anchors.js, once it is in): their new places must exist, and that script must name
// the same ones. And nothing is built where another repository's Pages serves (OTHERS), in any letter case.
{
  const LEGACY = [
    ...['/', '/blog/', '/404.html', '/feed.xml', '/sitemap.xml', '/robots.txt', '/CNAME'].map((a) => [a, '=']),
    ...['lfia', 'tufts-hia-ai', 'contrastive-learning-for-visual', 'informs-talk', 'artifacts-mitigation-nlp', 'gesture-classification', 'uw-workshop-ssl'].map((s) => [`/blog/${s}/`, '=']),
    // the PDFs the live sitemap names
    ...['docs/publications/2015-bmes.pdf', 'docs/publications/2016-bmes.pdf', 'docs/publications/2017-bmes.pdf',
      'images/blog/projects/gesture/outline_simple_2.pdf', 'images/publications/informs/zhenyuan_dataViz.pdf'].map((f) => [`/assets/${f}`, '=']),
    // Jekyll's copies of the posts (its _config.yml included _blog), in the live sitemap too
    ['/_blog/projects/2017-02-08-lfia.html', '/blog/lfia/'],
    ['/_blog/events/2021-01-08-tufts-hia-ai.html', '/blog/tufts-hia-ai/'],
    ['/_blog/posts/2022-10-06-contrastive-learning-for-visual.html', '/blog/contrastive-learning-for-visual/'],
    ['/_blog/events/2022-10-13-informs-talk.html', '/blog/informs-talk/'],
    ['/_blog/posts/2022-12-16-artifacts-mitigation-nlp.html', '/blog/artifacts-mitigation-nlp/'],
    ['/_blog/projects/2023-05-16-gesture-classification.html', '/blog/gesture-classification/'],
    ['/_blog/events/2023-09-05-uw-workshop-ssl.html', '/blog/uw-workshop-ssl/'],
    // the 2024 site's posts (its permalink /:categories/:title/), gone since December 2024
    ['/projects/lfia/', '/blog/lfia/'], ['/projects/personalizeMeal/', '/build/#mealthup'], ['/projects/hieralytics/', '/build/#hieralytics'],
    ['/projects/tufts/', '/blog/tufts-hia-ai/'], ['/projects/dataViz/', '/teach/#books'], ['/projects/clVR/', '/blog/contrastive-learning-for-visual/'],
    ['/projects/informs/', '/blog/informs-talk/'], ['/projects/artifacts/', '/blog/artifacts-mitigation-nlp/'],
    ['/projects/gesture/', '/blog/gesture-classification/'], ['/projects/rlWorkshop/', '/blog/uw-workshop-ssl/'],
  ];
  const OLD_HOME = { software: '/build/#software', publications: '/build/#research', blog: '/blog/', courses: '/teach/#courses' };

  // the build's redirect pages, and where each leads
  const moved = new Map();
  for (const page of pages.values()) {
    const html = fs.readFileSync(page.file, 'utf8');
    if (!/http-equiv\s*=\s*["']?refresh/i.test(html)) continue;
    let content = null;
    const find = (n) => {
      if (n.type === 'element' && n.tagName === 'meta' && String(n.properties.httpEquiv || '').toLowerCase() === 'refresh') content = String(n.properties.content || '');
      (n.children || []).forEach(find);
    };
    find(fromHtml(html));
    // (the address bare or in quotes: "0;url=/a/" and "0; url='/a/'" are the same redirect)
    const m = /^\s*(\d+)\s*;\s*url\s*=\s*['"]?([^'"\s]+)['"]?\s*$/i.exec(content || '');
    if (!m) { err(`${page.address}: a meta refresh that leads to no address ("${content}")`); continue; }
    moved.set(page.address, { page, delay: m[1], to: new URL(m[2], SITE + page.address) });
  }
  const map = fs.existsSync(path.join(DIST, 'sitemap-0.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap-0.xml'), 'utf8') : '';
  for (const [address, { page, delay, to }] of moved) {
    const where = to.pathname + to.hash, id = decodeURIComponent(to.hash.slice(1));
    const elsewhere = to.origin !== SITE || OTHERS.some((o) => to.pathname.startsWith(BASE + o.slice(1)));
    const target = elsewhere ? null : fileOf(to.pathname), tp = target && pages.get(addressOf(target));
    if (delay !== '0') err(`${address}: the redirect waits ${delay} s (a moved page's is at once: 0)`);
    if (!page.robots.includes('noindex')) err(`${address}: a redirect page without noindex`);
    if (map.includes(`<loc>${SITE}${address}</loc>`)) err(`${address}: a redirect page in the sitemap`);
    if (!elsewhere && !target) err(`${address}: leads to ${where}, which the build has no file for`);
    else if (target && moved.has(addressOf(target))) err(`${address}: leads to ${addressOf(target)}, itself a redirect (one step, never a chain)`);
    else if (tp && id && !tp.ids.has(id) && !(tp.fragments && tp.fragments.has(id))) err(`${address}: leads to ${where}: no id "${id}" there`);
    // (its canonical is the real site's address, as every page's is; under another base Astro's names that base's)
    if (PROD && page.canonical !== SITE + where) err(`${address}: its canonical ${page.canonical} is not where it leads (${SITE}${where})`);
  }
  for (const { page } of moved.values()) { pages.delete(page.address); const i = htmlFiles.indexOf(page.file); if (i >= 0) htmlFiles.splice(i, 1); }

  for (const [old, now] of LEGACY) {
    const at = BASE + old.slice(1), r = moved.get(at);
    if (now === '=') {
      if (r) err(`the old address ${old} answers with a redirect (to ${r.to.pathname}), not with its own page or file`);
      else if (!fileOf(at)) err(`the old address ${old} does not answer: the build has nothing there`);
    } else if (!r) err(`the old address ${old} does not lead to ${now}: ${fileOf(at) ? 'a page of its own is there, not a redirect' : 'the build has nothing there'}`);
    else if (r.to.pathname + r.to.hash !== BASE + now.slice(1)) err(`the old address ${old} leads to ${r.to.pathname}${r.to.hash}, not to ${now}`);
  }
  for (const [id, to] of Object.entries(OLD_HOME)) {
    const u = new URL(to, SITE), t = fileOf(BASE + u.pathname.slice(1)), tp = t && pages.get(addressOf(t));
    if (!tp) err(`the old home's #${id} goes to ${to}: the build has no page there`);
    else if (u.hash && !tp.ids.has(u.hash.slice(1))) err(`the old home's #${id} goes to ${to}: no id "${u.hash.slice(1)}" there`);
  }
  if (fs.existsSync(path.join(ROOT, 'src', 'scripts', 'home', 'old-anchors.js'))) {
    const said = (await import(new URL('../src/scripts/home/old-anchors.js', import.meta.url).href)).OLD_ANCHORS || {};
    const a = JSON.stringify(Object.entries(said).sort()), b = JSON.stringify(Object.entries(OLD_HOME).sort());
    if (a !== b) err(`src/scripts/home/old-anchors.js sends the old home's sections elsewhere than check-dist's list: ${a}, not ${b}`);
  } else notes.push("the old home's sections (/#software, /#publications, /#blog, /#courses) stay on the home: src/scripts/home/old-anchors.js is not in yet");

  // nothing where another repository's Pages serves, in any letter case (GitHub Pages tells /artLife/ from /artlife/;
  // a reader typing it may not)
  const others = OTHERS.map((o) => o.slice(1, -1).toLowerCase());
  for (const f of files) {
    const first = path.relative(DIST, f).split(path.sep)[0].toLowerCase().replace(/\.html?$/, '');
    if (others.includes(first)) err(`${addressOf(f)}: built where another repository's Pages serves (${OTHERS.join(' ')})`);
  }
  const same = LEGACY.filter(([, n]) => n === '=').length;
  notes.push(`old addresses: ${LEGACY.length} answer (${same} at the same address, ${LEGACY.length - same} by redirect); redirect pages ${moved.size}, left out of the page rules`);
}

// ---- links and anchors ----
const external = new Set();
let checked = 0;
for (const page of pages.values()) {
  for (const { url, kind } of page.refs) {
    if (/^(mailto|tel):/i.test(url)) continue;
    if (/^javascript:/i.test(url)) { err(`${page.address}: ${kind} uses javascript: (${url})`); continue; }
    let u;
    try { u = new URL(url, SITE + page.address); } catch { err(`${page.address}: ${kind} is no address: ${url}`); continue; }
    // (the addresses on this domain that other repositories' Pages serve, the courses, the photo site, the books,
    // Waycine: not this build's, so listed as external, not looked for here)
    const own = u.origin === SITE && !OTHERS.some((o) => u.pathname === o.slice(0, -1) || u.pathname.startsWith(o));
    if (!own) { external.add(u.origin + u.pathname); continue; }
    // a page's own canonical and social addresses are the real site's: they must exist under / in this build's tree
    let address = u.pathname;
    if (kind === 'meta[meta]' || (kind === 'link[href]' && url.startsWith(SITE))) address = BASE + u.pathname.slice(1);
    const target = fileOf(address);
    checked++;
    if (!target) { err(`${page.address}: ${kind} → ${url} has no file in the build`); continue; }
    if (u.hash && u.hash.length > 1) {
      const tp = pages.get(addressOf(target));
      const id = decodeURIComponent(u.hash.slice(1));
      if (tp && !tp.ids.has(id) && !(tp.fragments && tp.fragments.has(id))) err(`${page.address}: ${kind} → ${url}: no id "${id}" on ${tp.address}`);
    }
  }
  // one inline script is allowed: the light's own, whose hash the page's CSP carries
  if ((page.inline || 0) > 1) err(`${page.address}: ${page.inline} inline script/style elements (only the light's own script may be inline)`);
  if ((page.rules || 0) > 1) err(`${page.address}: ${page.rules} speculation rules scripts (one at most)`);
}

// ---- the Content-Security-Policy: first in the head after the charset (a policy governs only what follows it), and
// its hashes the page's own inline scripts', one for one ----
for (const page of pages.values()) {
  const [first, second] = page.head;
  const isCsp = (el) => el && el.tagName === 'meta' && String(el.properties.httpEquiv || '').toLowerCase() === 'content-security-policy';
  if (!page.csp) { err(`${page.address}: no Content-Security-Policy`); continue; }
  if (!(first && first.tagName === 'meta' && first.properties.charSet && isCsp(second))) err(`${page.address}: the Content-Security-Policy is not the head's first element after the charset`);
  const script = (/(?:^|;)\s*script-src\s([^;]*)/.exec(page.csp) || [])[1] || '';
  const hashes = (script.match(/'sha256-[^']+'/g) || []).map((h) => h.slice(1, -1));
  const own = page.scripts.map((s) => `sha256-${crypto.createHash('sha256').update(s).digest('base64')}`);
  own.filter((h) => !hashes.includes(h)).forEach(() => err(`${page.address}: an inline script whose hash the CSP does not carry`));
  hashes.filter((h) => !own.includes(h)).forEach((h) => err(`${page.address}: the CSP carries ${h}, which matches no script of the page`));
  if (/'sha256-/.test(page.csp.replace(/(?:^|;)\s*script-src\s[^;]*/, ''))) err(`${page.address}: the CSP carries a style hash, and the page writes no inline style`);
  /* (no other origin let in but the visitor stats': their script's in script-src, their hosts in img-src and
     connect-src, and only on a page that carries their id) */
  for (const d of page.csp.split(';').map((x) => x.trim()).filter(Boolean)) {
    const [name, ...src] = d.split(/\s+/);
    for (const t of src) {
      if (/^'/.test(t) || t === 'data:' || t === 'blob:') continue;
      const ok = !!page.gaId && (name === 'script-src' ? t === GA_SCRIPT : ['img-src', 'connect-src'].includes(name) && GA_HOSTS.includes(t));
      if (!ok) err(`${page.address}: the CSP lets ${t} in (${name}): no other origin may be, but the visitor stats' where the page carries their id`);
    }
  }
}

// ---- the visitor stats (GA4; the owner's decision, 2026-10-16: DEVELOPMENT.md, "Analytics"). In the real site's build
// (base /), with content/site.yaml's measurement id: every page of the site carries the id (meta zl-ga4) and our
// loader (scripts/ga.js, a module that adds gtag.js once the page has loaded); the home alone has gtag.js's own tag,
// once, static and async in its head, where Search Console looks for it, or, with analytics.verify set, Search
// Console's verification meta instead and no tag. In another build (the LAN preview), none of it ----
{
  let A = {};
  try { A = (YAML.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.yaml'), 'utf8')).site || {}).analytics || {}; } catch (e) { err(`content/site.yaml: not read for the visitor stats: ${e.message}`); }
  const ga = A.ga4 || null, verify = A.verify || null, on = PROD && !!ga;
  /* (our loader: a module of the page whose file names gtag.js) */
  const known = new Map();
  const loads = (src) => {
    if (!known.has(src)) { const f = fileOf(src.startsWith('/') ? src : BASE + src); known.set(src, !!f && fs.readFileSync(f, 'utf8').includes('https://www.googletagmanager.com/gtag/js?id=')); }
    return known.get(src);
  };
  let carried = 0;
  for (const page of pages.values()) {
    if (!page.csp) continue;   /* (no page of the site: a redirect page of the old addresses) */
    const tags = page.ga || [], ids = page.gaId || [], gsv = page.gsv || [], home = page.address === BASE;
    if (!on) { if (tags.length || ids.length || gsv.length) err(`${page.address}: the visitor stats, in a build that should have none (${PROD ? 'no id in content/site.yaml' : 'base ' + BASE})`); continue; }
    if (ids.length !== 1 || ids[0] !== ga) err(`${page.address}: ${ids.length === 1 ? "the visitor stats' id is not content/site.yaml's" : ids.length + ' metas of the visitor stats\' id (one wanted)'}`);
    if (!(page.modules || []).some(loads)) err(`${page.address}: no visitor stats loader (scripts/ga.js) among its modules`);
    if (home && !verify) {
      if (tags.length !== 1) err(`${page.address}: ${tags.length} visitor stats tags (the home has one, for Search Console)`);
      else {
        if (tags[0].id !== ga) err(`${page.address}: the visitor stats' tag has another measurement id than content/site.yaml's`);
        if (!tags[0].async) err(`${page.address}: the visitor stats' tag is not async (it would hold the page up)`);
        if (!page.head.some((e) => e.tagName === 'script' && String(e.properties.src || '').startsWith(GA_SCRIPT + '/gtag/js?id='))) err(`${page.address}: the visitor stats' tag is not in the head, where Search Console looks for it`);
      }
    } else if (tags.length) err(`${page.address}: a static visitor stats tag (only the home has one, and none once analytics.verify is set)`);
    if (home && verify && !(gsv.length === 1 && gsv[0] === verify)) err(`${page.address}: no Search Console verification meta with analytics.verify's content`);
    if (!home && gsv.length) err(`${page.address}: a Search Console verification meta (the home's alone)`);
    carried++;
  }
  notes.push(`visitor stats: ${on ? `GA4's id and loader on ${carried} pages; the home ${verify ? "verified by Search Console's meta, loading gtag.js as the others do" : "with gtag.js's static tag"}` : 'none in this build'}`);
}

// ---- structured data ----
for (const page of pages.values()) {
  if (!page.ld.length) { err(`${page.address}: no JSON-LD`); continue; }
  let graph = [];
  for (const raw of page.ld) {
    try { const d = JSON.parse(raw); graph = graph.concat(d['@graph'] || [d]); if (d['@context'] !== 'https://schema.org') err(`${page.address}: JSON-LD @context is not https://schema.org`); }
    catch (e) { err(`${page.address}: JSON-LD does not parse: ${e.message}`); }
  }
  // the Person on every page: on its own, or on the home as the ProfilePage's mainEntity (the home is his profile)
  const profile = graph.find((x) => x['@type'] === 'ProfilePage');
  const person = graph.find((x) => x['@type'] === 'Person') || (profile && profile.mainEntity && profile.mainEntity['@type'] === 'Person' ? profile.mainEntity : null);
  if (!person || !person.name || !person.url || !Array.isArray(person.sameAs) || !person.sameAs.length) err(`${page.address}: no Person with name, url and sameAs`);
  if (page.address === BASE && (!profile || profile.mainEntity !== person || profile.url !== page.canonical)) err(`${page.address}: the home is not a ProfilePage about the Person at the canonical url`);
  if (page.address !== BASE && profile) err(`${page.address}: a ProfilePage away from the home`);
  if (/^\/blog\/[^/]+\/$/.test(page.address.slice(BASE.length - 1))) {
    // a post is a BlogPosting; a talk's page, the talk: an Event (EducationEvent)
    const post = graph.find((x) => x['@type'] === 'BlogPosting');
    const talk = graph.find((x) => /Event$/.test(String(x['@type'])));
    if (!post === !talk) err(`${page.address}: an article needs one BlogPosting (a post) or one Event (a talk)`);
    else if (post) {
      const need = ['headline', 'description', 'datePublished', 'dateModified', 'author', 'url', 'image', 'mainEntityOfPage', 'publisher'];
      need.filter((k) => post[k] == null || (Array.isArray(post[k]) && !post[k].length)).forEach((k) => err(`${page.address}: BlogPosting has no ${k}`));
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(post.datePublished))) err(`${page.address}: BlogPosting datePublished is not a date`);
      if (post.url !== page.canonical) err(`${page.address}: BlogPosting url ${post.url} is not the canonical ${page.canonical}`);
    } else {
      ['name', 'description', 'startDate', 'location', 'performer', 'url', 'image'].filter((k) => talk[k] == null).forEach((k) => err(`${page.address}: ${talk['@type']} has no ${k}`));
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(talk.startDate))) err(`${page.address}: ${talk['@type']} startDate is not a date`);
      if (talk.url !== page.canonical) err(`${page.address}: ${talk['@type']} url ${talk.url} is not the canonical ${page.canonical}`);
    }
  }
  // the home, and it alone, is the WebSite, with the name a search result shows above it (Google reads it there only)
  const site = graph.find((x) => x['@type'] === 'WebSite');
  if (page.address === BASE && (!site || !site.name || site.url !== page.canonical)) err(`${page.address}: the home has no WebSite with its name and the canonical url`);
  if (page.address !== BASE && site) err(`${page.address}: a WebSite away from the home`);
  // every page names its canonical address, but the 404 page, which answers for every address that leads nowhere
  const is404 = page.address === BASE + '404.html';
  if (!page.canonical && !is404) err(`${page.address}: no canonical link`);
  if (page.canonical && is404) err(`${page.address}: the 404 page names a canonical address`);
}

// ---- HTML ----
const hv = new HtmlValidate(JSON.parse(fs.readFileSync(path.join(ROOT, '.htmlvalidate.json'), 'utf8')));
const stylish = formatterFactory('stylish');
let htmlErrors = 0;
for (const file of htmlFiles) {
  const report = await hv.validateString(fs.readFileSync(file, 'utf8'), path.relative(ROOT, file));
  if (!report.valid) { htmlErrors += report.errorCount; console.log(stylish(report.results)); }
}
if (htmlErrors) err(`html-validate: ${htmlErrors} error(s) (above)`);

// ---- the site's files ----
const read = (rel) => { const f = path.join(DIST, rel); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const feed = read('feed.xml');
if (!feed || !/<rss[\s>]/.test(feed)) err('feed.xml is missing or not RSS');
const items = feed ? (feed.match(/<item>/g) || []).length : 0;
const map = read('sitemap-index.xml'), map0 = read('sitemap-0.xml'), mapOld = read('sitemap.xml');
if (!map || !map0) err('sitemap-index.xml or sitemap-0.xml is missing');
if (map && mapOld !== map) err('sitemap.xml (the old address) does not mirror sitemap-index.xml');
const robots = read('robots.txt');
if (!robots || !/^Sitemap: https:\/\/zhenyuanlu\.com\/sitemap-index\.xml$/m.test(robots)) err('robots.txt has no Sitemap line for the sitemap index');
if (read('CNAME') !== 'zhenyuanlu.com') err('CNAME is not exactly "zhenyuanlu.com"');
const sec = read('.well-known/security.txt');
const exp = sec && /^Expires: (.+)$/m.exec(sec);
if (!sec || !/^Contact: /m.test(sec) || !exp || !(new Date(exp[1]) > new Date())) err('.well-known/security.txt is missing, has no Contact, or has expired');
if (map0) for (const page of pages.values()) {
  const loc = SITE + page.address;   // (the map names the pages under the build's base, as Astro writes it)
  const inMap = map0.includes(`<loc>${loc}</loc>`);
  if (page.robots.includes('noindex') && inMap) err(`${page.address}: noindex, but in the sitemap`);
  if (!page.robots.includes('noindex') && !inMap && page.address !== BASE + '404.html') err(`${page.address}: indexable, but not in the sitemap`);
}
/* (a build made with its drafts on purpose, ZL_DRAFTS=1, to check them too: the drafts' rule is not for it) */
if (PROD && process.env.ZL_DRAFTS !== '1') {
  // every post whose front matter says draft: true, read as astro.config.mjs reads it (src/lib/drafts.mjs: Astro's
  // own front matter parser): no page, no file of its own, no live-figure code, and no mention in the list, the
  // feed, the sitemap or any other page
  const blog = path.join(ROOT, 'content', 'blog');
  const drafts = draftSlugs(blog);
  const rels = files.map((f) => path.relative(DIST, f).split(path.sep).join('/'));
  const texts = rels.filter((r) => /\.(html|xml|txt|js|json|webmanifest)$/.test(r)).map((r) => [r, fs.readFileSync(path.join(DIST, r), 'utf8')]);
  for (const slug of drafts) {
    const live = fs.readdirSync(path.join(blog, slug)).filter((f) => f.endsWith('.live.js')).map((f) => f.slice(0, -'.live.js'.length));
    const leaks = rels.filter((r) => r.startsWith(`blog/${slug}/`) || live.some((n) => r.startsWith(`_astro/${n}.live.`)))
      .concat(texts.filter(([, t]) => t.includes(`/blog/${slug}/`)).map(([r]) => `${r} names it`));
    if (leaks.length) err(`the draft ${slug} is in the production build: ${leaks.join(', ')}`);
  }
  notes.push(`drafts kept out of this build: ${drafts.join(', ') || 'none'}`);
}

// ---- report ----
const articles = [...pages.keys()].filter((a) => /^\/blog\/[^/]+\/$/.test(a.slice(BASE.length - 1)));
console.log(`pages ${pages.size} (articles ${articles.length}); internal references checked ${checked}; external addresses ${external.size} (not fetched); feed items ${items}`);
notes.forEach((n) => console.log('note: ' + n));
if (errors.length) {
  errors.forEach((e) => console.error('ERROR ' + e));
  console.error(`check-dist: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log('check-dist: links, anchors, HTML, structured data and the site files all hold');
