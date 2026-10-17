// The blog's Markdown dialect (content/blog/format-guide shows every part of it), read at build time.
// On top of CommonMark, GitHub tables and footnotes, and remark-math's $...$ and $$...$$:
//   [@key] [@a; @b]          citations from the post's .bib (front matter `bibliography`), numbered in order; with
//   [see @a, p. 3]           words before a source and its place after a comma, as Pandoc writes them
//   \$                       a dollar sign (a bare $ opens a formula)
//   <!-- ... -->             a note in the source, never in the page
//   [^id] / [^id]: note      footnotes, as a card in the text and a list at the end
//   :::note|tip|caution      call-outs; :::aside an aside (closed by a line ":::")
//   :::appendix Title        an end section of the author's own (acknowledgements, author contributions, a
//                            dataset's terms...): it leaves the text and stands first in the foot, under its title
//   ![alt](file "caption"){#fig:x .wide}     a figure: numbered when it has a caption or a label; widths
//                            .wide .full .screen; {-} keeps it out of the numbering; {max=60%} holds a small
//                            picture to a share of its width. A .mp4/.webm file is a video with controls, a .gif
//                            an animation that waits for play, a YouTube address a link out (nothing loads)
//   $$ ... $$ {#eq:x}        a display formula, numbered when labelled
//   Table: caption {#tbl:x}  the line after a table: its caption (numbered)
//   @fig:x @eq:x @tbl:x      a pointer to a figure, a formula or a table
//   <LiveFigure .../>        (MDX) a live figure, numbered as figures are
// Headings: the top level written is drawn as h2 (the page's h1 is the title); each gets an id, its own link
// and an entry in the contents (h2, h3). What the page needs besides the HTML (the contents, the references,
// the reading time) goes to file.data.zl, which the rehype step (rehype-article.mjs) hands to the page.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkSmartypants from 'remark-smartypants';
import { bibRecords } from './bibtex.mjs';
import { videoSize } from '../lib/video-size.mjs';
import { sizesFor, widthsFor } from '../lib/picture.mjs';
import { pictureForms } from '../lib/picture-forms.mjs';
import { arrowMd } from '../lib/arrows.mjs';

const RESERVED = ['references', 'notes', 'updates', 'cite-this-post', 'contents', 'w-h1', 'ip', 'top', 'a-card', 'a-shm', 'a-toc'];
const WIDTH = { wide: 'a-wide', full: 'a-full', screen: 'a-win', window: 'a-win', page: 'a-full', 'page-outset': 'a-full', 'body-outset': 'a-wide', middle: 'a-wide' };
const VIDEO = /\.(mp4|webm|m4v)$/i;
const GIF = /\.gif$/i;
const YOUTUBE = /^https:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/;
const NB = ' ';   // a narrow space that never breaks: between a word and its citation's bracket
const PLAY_SVG = [
  svg(['b-ic', 'a-pl'], 'M2 1h1v7h-1zM3 2h1v5h-1zM4 3h1v3h-1zM5 4h1v1h-1z'),
  svg(['b-ic', 'a-pa'], 'M2 1h2v7h-2zM5 1h2v7h-2z'),
];

function svg(cls, d) {
  return { type: 'element', tagName: 'svg', properties: { className: cls, viewBox: '0 0 9 9', ariaHidden: 'true', focusable: 'false' },
    children: [{ type: 'element', tagName: 'path', properties: { d }, children: [] }] };
}
function node(type, hName, hProperties, children = [], extra = {}) {
  return { type, data: { hName, hProperties, ...extra }, children };
}
function text(value) { return { type: 'text', value }; }
function textOf(n) {
  if (!n) return '';
  if (n.type === 'text' || n.type === 'inlineCode') return n.value;
  if (n.type === 'inlineMath') return n.value;
  return (n.children || []).map(textOf).join('');
}
/** {#fig:x .wide max=60% -} */
function readAttrs(s) {
  const o = { id: '', width: '', unnumbered: false, kv: {} };
  String(s || '').trim().replace(/^\{|\}$/g, '').trim().split(/\s+/).filter(Boolean).forEach((t) => {
    if (t === '-' || t === '.unnumbered') o.unnumbered = true;
    else if (t[0] === '#') o.id = t.slice(1);
    else if (t[0] === '.') { if (WIDTH[t.slice(1)]) o.width = WIDTH[t.slice(1)]; }
    else if (t.includes('=')) { const [k, ...v] = t.split('='); o.kv[k] = v.join('=').replace(/^["']|["']$/g, ''); }
  });
  return o;
}
const ATTR_ONLY = /^\s*(\{[^{}]*\})\s*$/;

const capParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkSmartypants);
/** a caption's Markdown as inline nodes */
async function inlineMd(s) {
  if (!s) return [];
  const tree = await capParser.run(capParser.parse(String(s)));
  const out = [];
  tree.children.forEach((b, i) => { if (i) out.push(text(' ')); out.push(...(b.type === 'paragraph' ? b.children : [b])); });
  return out;
}

export function remarkDialect(options = {}) {
  const base = options.base || '/';
  return async function transform(tree, file) {
    const fm = (file.data.astro ??= {}).frontmatter ??= {};
    const filePath = String(file.path || '');
    const dir = path.dirname(filePath);
    const slug = path.basename(dir);
    const urlBase = `${base}blog/${slug}/`;
    // a mistake in the post stops the build, with the file and (where the Markdown has it) the line: the file's own
    // line, so the Markdown's (counted from the text, after the front matter) moves down by the lines above the text
    let shift = 0;
    try {
      const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n'), body = String(file.value ?? '').replace(/\r\n/g, '\n');
      const fence = /^---[ \t]*\n[\s\S]*?\n---[ \t]*(?:\n|$)/.exec(raw);
      const at = !body.trim() ? -1 : raw.endsWith(body) ? raw.length - body.length : raw.indexOf(body.slice(0, 400), fence ? fence[0].length : 0);
      if (at > 0) shift = (raw.slice(0, at).match(/\n/g) || []).length;
    } catch { /* the text's own lines, then */ }
    const fail = (msg, at) => {
      const line = at?.position?.start?.line;
      file.fail(`${msg} (in ${path.relative(process.cwd(), filePath)}${line ? `, line ${line + shift}` : ''})`, at?.position);
    };
    const Z = {
      ids: new Set(RESERVED), labels: {}, fig: 0, eq: 0, tbl: 0,
      refs: new Map(), order: [], uses: {}, notes: [], toc: [], warnings: [],
    };
    file.data.zl = Z;

    // ---- notes to himself (<!-- ... -->) stay in the source: never in the page ----
    dropComments(tree);

    // ---- the bibliography beside the post ----
    if (fm.bibliography) {
      const bib = path.resolve(dir, String(fm.bibliography));
      if (!fs.existsSync(bib)) fail(`the bibliography ${fm.bibliography} is not beside the post`);
      Z.refs = bibRecords(fs.readFileSync(bib, 'utf8'));
    }

    // ---- call-outs and asides (:::name ... :::), at any depth ----
    containers(tree.children, fail);

    // ---- the author's end sections (:::appendix Title): an address each, as a heading has; the page puts them
    //      first in the foot (rehype-article.mjs lifts them out of the text) ----
    Z.appendix = [];
    for (const n of tree.children) {
      if (n.type !== 'zlAppendix') continue;
      const title = String(n.data.hProperties.dataZlAppendix);
      const id = anchorId(title, Z.ids);
      n.data.hProperties.id = id;
      Z.appendix.push({ id, title });
    }

    // ---- headings: the top level written is h2; ids; their own links; the contents ----
    let top = 6;
    walk(tree, (n) => { if (n.type === 'heading') top = Math.min(top, n.depth); });
    walk(tree, (n) => {
      if (n.type !== 'heading') return;
      n.depth = Math.max(2, Math.min(5, n.depth - top + 2));
      const label = textOf(n).replace(/\s+/g, ' ').trim();
      const id = anchorId(label, Z.ids);
      n.data = { ...(n.data || {}), hProperties: { ...(n.data?.hProperties || {}), id, tabIndex: -1 } };
      if (n.depth <= 3) Z.toc.push({ depth: n.depth, id, text: label });
      // its own link, the "#" a pointer resting on the heading shows (article.css): the hand's alone, so it is kept
      // out of the heading's name and of the keyboard's way (aria-hidden, and so tabindex -1), and the heading is
      // named by its own words ("Abstract", not "Abstract link to this section"). The contents' entries (h2, h3) are
      // the sections' links for the keyboard, as they are on a touch screen, where the "#" is never shown
      n.children.push({ type: 'link', url: `#${id}`, data: { hProperties: { className: ['a-hl'], ariaHidden: 'true', tabIndex: -1 } },
        children: [text('#')] });
    });

    // ---- the cover's caption, set as the text is (its citations come first) ----
    if (fm.coverLabel || fm.coverCaption) {
      const kids = [];
      let coverN = 0;
      if (fm.coverLabel) {
        coverN = ++Z.fig;
        const lab = /^fig:/.test(fm.coverLabel) ? fm.coverLabel : `fig:${fm.coverLabel}`;
        Z.labels[lab] = { id: `fig-${coverN}`, n: coverN, kind: 'fig' };
        Z.ids.add(`fig-${coverN}`);
        kids.push(node('zlSpan', 'span', { className: ['a-fn'] }, [text(`Figure ${coverN}.`)]), text(' '));
      }
      kids.push(...(await inlineMd(fm.coverCaption || '')));
      Z.coverN = coverN;
      tree.children.unshift(node('zlCover', 'div', { dataZlCover: '' }, [node('paragraph', 'p', {}, kids)]));
    }

    // ---- figures, formulas, tables and live figures, numbered in the text's order ----
    await blocks(tree, { Z, dir, slug, urlBase, fail, file });

    // ---- footnotes: numbered in the order first cited; the notes go to the end, for the list ----
    footnotes(tree, Z);

    // ---- citations and pointers, now that every number is known ----
    refsAndPointers(tree, Z, fail);

    // ---- the reading time (the draft's: the text's words at 220 a minute; the cover's caption is not the text) ----
    let words = 0;
    walk(tree, (n) => {
      if (n.type === 'zlCover') return 'skip';
      if (n.type === 'text' || n.type === 'inlineCode' || n.type === 'code') {
        words += (String(n.value).match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
      }
    });
    Z.words = words;
    Z.minutes = Math.max(1, Math.round(words / 220));
  };
}

/** the ids the page gives its numbered parts (fig-3, eq-1, tbl-2, ref-4, fn-1, fnref-1, cite-2-1) and a live figure's
    controls (lf-…): a heading never takes one of their shape, so "## Fig 1" cannot clash with Figure 1 */
const NUMBERED = /^(?:(?:fig|eq|tbl|ref|fn|fnref|cite)-\d+(?:-\d+)?|lf-.*)$/;
/** an id from a heading's words, unique in the page (the draft's anchorId) */
function anchorId(label, ids) {
  let s = String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
  if (NUMBERED.test(s)) s = `${s}-section`;
  let id = s, n = 1;
  while (ids.has(id)) id = `${s}-${++n}`;
  ids.add(id);
  return id;
}

/** HTML comments out of the Markdown (a block of its own, or inside a line of HTML): what was written as a note in
    the source never reaches the page (an unclosed one runs to the end of its block, as the browser would read it) */
function dropComments(n) {
  if (!n.children) return;
  for (let i = n.children.length - 1; i >= 0; i--) {
    const k = n.children[i];
    if (k.type === 'html') {
      const v = String(k.value).replace(/<!--[\s\S]*?(?:-->|$)/g, '');
      if (v.trim()) k.value = v;
      else n.children.splice(i, 1);
    } else dropComments(k);
  }
}

/** every node, depth first, in document order; fn may return 'skip' */
function walk(n, fn, parent = null) {
  if (fn(n, parent) === 'skip') return;
  if (n.children) for (const c of [...n.children]) walk(c, fn, n);
}

// ---------------------------------------------------------------------------------------------- containers
const OPEN = /^:::[ \t]*([a-z]+)[ \t]*([^\n]*)/i;
function containers(list, fail, top = true) {
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    if (n.children && n.type !== 'paragraph') containers(n.children, fail, false);
    if (n.type !== 'paragraph' || n.children[0]?.type !== 'text') continue;
    const m = OPEN.exec(n.children[0].value);
    if (!m) continue;
    const name = m[1].toLowerCase(), title = m[2].trim();
    // the opening line goes; what follows it in the same paragraph stays
    n.children[0].value = n.children[0].value.slice(m[0].length).replace(/^\n/, '');
    const inner = [];
    let closed = false, j = i;
    if (closesItself(n)) { closed = true; if (hasContent(n)) inner.push(n); }
    else {
      if (hasContent(n)) inner.push(n);
      let depth = 1;
      for (j = i + 1; j < list.length; j++) {
        const k = list[j];
        const t = k.type === 'paragraph' ? textOf(k) : '';
        if (k.type === 'paragraph' && OPEN.test(t)) depth++;
        if (k.type === 'paragraph' && /(^|\n):::[ \t]*$/.test(t)) {
          depth--;
          if (!depth) {
            closesItself(k);
            if (hasContent(k)) inner.push(k);
            closed = true;
            break;
          }
        }
        inner.push(k);
      }
    }
    if (!closed) fail(`":::${name}" is never closed by a line ":::"`, n);
    containers(inner, fail, false);
    let box;
    if (name === 'aside') box = node('zlAside', 'aside', { className: ['a-aside'], role: 'note' }, inner);   // (a note in the text, not a landmark of the page)
    else if (name === 'appendix') {
      // (the page lifts it out of the text into the foot: rehype-article.mjs; so only at the text's own level)
      if (!top) fail('":::appendix" stands at the text\'s own level, not inside another block', n);
      if (!title) fail('":::appendix" needs its title on the same line, as ":::appendix Acknowledgements"', n);
      box = node('zlAppendix', 'section', { className: ['a-app'], dataZlAppendix: title }, inner);
    } else if (/^(note|tip|caution|warning)$/.test(name)) {
      const kind = name === 'warning' ? 'caution' : name;
      box = node('zlCall', 'div', { className: ['a-call'], dataKind: kind, role: 'note' },
        [node('paragraph', 'p', { className: ['a-call-l'] }, [text(title || kind)]), ...inner]);
    } else fail(`":::${name}" is not a block this blog knows (note, tip, caution, aside, appendix)`, n);
    list.splice(i, (closed && j > i ? j - i : 0) + 1, box);
  }
}
/** a paragraph whose last line is ":::": that line goes; true if it was there */
function closesItself(p) {
  const last = p.children[p.children.length - 1];
  if (!last || last.type !== 'text') return false;
  const m = /(^|\n):::[ \t]*$/.exec(last.value);
  if (!m) return false;
  last.value = last.value.slice(0, m.index);
  return true;
}
function hasContent(p) { return p.children.some((c) => c.type !== 'text' || c.value.trim()); }

// ---------------------------------------------------------------------------------------------- blocks
async function blocks(tree, C) {
  const jobs = [];
  const visit = (list) => {
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.type === 'zlCover') continue;
      // a figure: a paragraph that is one picture (and its attributes)
      if (n.type === 'paragraph') {
        const kids = n.children.filter((k) => !(k.type === 'text' && !k.value.trim()) && k.type !== 'break');
        if (kids[0]?.type === 'image' && (kids.length === 1 || (kids.length === 2 && kids[1].type === 'text' && ATTR_ONLY.test(kids[1].value)))) {
          const at = readAttrs(kids[1] ? ATTR_ONLY.exec(kids[1].value)[1] : nextAttrs(list, i));
          const slot = { list, i };
          jobs.push(() => figure(kids[0], at, slot, C));
          continue;
        }
        // a display formula on one line: $$ ... $$ {#eq:x}
        if (kids[0]?.type === 'inlineMath' && isDisplay(kids[0], C) && (kids.length === 1 || (kids.length === 2 && kids[1].type === 'text' && ATTR_ONLY.test(kids[1].value)))) {
          const at = readAttrs(kids[1] ? ATTR_ONLY.exec(kids[1].value)[1] : nextAttrs(list, i));
          list[i] = equation(kids[0].value, at, C);
          continue;
        }
      }
      if (n.type === 'math') { list[i] = equation(n.value, readAttrs(nextAttrs(list, i)), C); continue; }
      if (n.type === 'table') { tableFigure(list, i, C); continue; }
      if (n.type === 'mdxJsxFlowElement' && n.name === 'LiveFigure') { jobs.push(() => liveFigure(n, C)); continue; }
      if (n.children && n.type !== 'paragraph' && n.type !== 'heading') visit(n.children);
    }
  };
  visit(tree.children);
  // numbering happens in the order the jobs were found, which is the text's (each job takes its number first)
  for (const job of jobs) await job();
  // the attribute lines that were taken by the block above them go
  const drop = (list) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.zlTaken) list.splice(i, 1);
      else if (n.children && n.type !== 'paragraph') drop(n.children);
    }
  };
  drop(tree.children);
}
/** the attributes on the line under a block: "{#fig:x}" alone in the next paragraph */
function nextAttrs(list, i) {
  const n = list[i + 1];
  if (n?.type === 'paragraph' && n.children.length === 1 && n.children[0].type === 'text' && ATTR_ONLY.test(n.children[0].value)) {
    n.zlTaken = true;
    return ATTR_ONLY.exec(n.children[0].value)[1];
  }
  return '';
}
/** $$...$$ written in a paragraph (remark-math reads it as inline math): display when the source says $$ */
function isDisplay(m, C) {
  const src = String(C.file?.value ?? '');
  const at = m.position?.start?.offset;
  return at != null && src.slice(at, at + 2) === '$$';
}

function equation(value, at, C) {
  const { Z } = C;
  let n = 0, id = '';
  if (at.id && !at.unnumbered) {
    n = ++Z.eq; id = `eq-${n}`; Z.ids.add(id);
    Z.labels[/^eq:/.test(at.id) ? at.id : `eq:${at.id}`] = { id, n, kind: 'eq' };
  }
  const math = { type: 'math', value: String(value).trim(), data: { hName: 'pre', hChildren: [{ type: 'element', tagName: 'code', properties: { className: ['language-math', 'math-display'] }, children: [{ type: 'text', value: String(value).trim() }] }] } };
  const kids = [node('zlEqS', 'div', { className: ['a-eq-s'] }, [math])];
  if (n) kids.push(node('zlEqN', 'span', { className: ['a-eq-n', 'num'] }, [text(`(${n})`)]));
  return node('zlEq', 'div', { className: n ? ['a-eq', 'a-eqn'] : ['a-eq'], ...(id ? { id, tabIndex: -1 } : {}) }, kids);
}

function tableFigure(list, i, C) {
  const { Z } = C;
  const t = list[i];
  // its caption: the next paragraph, "Table: words {#tbl:x .wide}"; or an attribute line alone
  let cap = null, at = readAttrs('');
  const nx = list[i + 1];
  if (nx?.type === 'paragraph' && nx.children[0]?.type === 'text' && /^Table:\s*/.test(nx.children[0].value)) {
    cap = nx;
    cap.zlTaken = true;
    const first = cap.children[0];
    first.value = first.value.replace(/^Table:\s*/, '');
    const last = cap.children[cap.children.length - 1];
    if (last.type === 'text') {
      const m = /\s*(\{[^{}]*\})\s*$/.exec(last.value);
      if (m) { at = readAttrs(m[1]); last.value = last.value.slice(0, m.index); }
    }
  } else {
    const s = nextAttrs(list, i);
    if (s) at = readAttrs(s);
  }
  if (!cap && !at.id && !at.width) return;
  let n = 0, id = '';
  if ((cap || at.id) && !at.unnumbered) {
    n = ++Z.tbl; id = `tbl-${n}`; Z.ids.add(id);
    if (at.id) Z.labels[/^tbl:/.test(at.id) ? at.id : `tbl:${at.id}`] = { id, n, kind: 'tbl' };
  }
  const kids = [t];
  if (cap || n) {
    const capKids = [];
    if (n) capKids.push(node('zlSpan', 'span', { className: ['a-fn'] }, [text(`Table ${n}.`)]));
    if (cap) { if (n) capKids.push(text(' ')); capKids.push(...cap.children); }
    kids.push(node('zlCap', 'figcaption', { className: ['w-cap'] }, capKids));
  }
  list[i] = node('zlTfig', 'figure', { className: ['a-tfig', ...(at.width ? [at.width] : [])], ...(id ? { id, tabIndex: -1 } : {}) }, kids);
}

async function figure(img, at, slot, C) {
  const { Z, dir, urlBase, fail } = C;
  const url = String(img.url || '');
  const cap = img.title || '';
  // a YouTube address: a link out, so nothing of YouTube's loads (the CSP has no frame for it either)
  const yt = YOUTUBE.exec(url);
  if (yt) {
    slot.list[slot.i] = node('paragraph', 'p', { className: ['w-cap'] }, [
      { type: 'link', url: `https://www.youtube.com/watch?v=${yt[1]}`, data: { hProperties: { className: ['w-out'] } },
        children: [text(`${img.alt || 'the video on YouTube'} `), arrowMd('r')] }]);
    return;
  }
  // a picture on another site is not loaded (nothing of another site's loads here): its caption stays, with a way
  // to it, as YouTube's do
  if (/^https:\/\//i.test(url)) {
    let host = 'its site';
    try { host = new URL(url).host.replace(/^www\./, ''); } catch { /* keep */ }
    const words = await inlineMd(cap);
    // (a caption that names its own source keeps to itself; one that does not gets the way to the picture)
    const named = words.some((w) => w.type === 'link');
    slot.list[slot.i] = node('paragraph', 'p', { className: ['w-cap'] }, named ? words : [
      ...words, ...(words.length ? [text(' ')] : []),
      { type: 'link', url, data: { hProperties: { className: ['w-out'] } }, children: [text(`${img.alt || `the picture on ${host}`} `), arrowMd('r')] }]);
    return;
  }
  if (/^[a-z]+:/i.test(url) || url.startsWith('/')) fail(`a picture must be a file beside the post: ${url}`, img);
  const file = path.resolve(dir, decodeURI(url));
  if (!fs.existsSync(file)) fail(`the picture ${url} is not beside the post`, img);
  // its number: a caption or a label gives one, {-} none
  let n = 0;
  if ((cap || at.id) && !at.unnumbered) n = ++Z.fig;
  const id = n ? `fig-${n}` : '';
  if (id) Z.ids.add(id);
  if (at.id && n) Z.labels[/^fig:/.test(at.id) ? at.id : `fig:${at.id}`] = { id, n, kind: 'fig' };
  else if (at.id) fail(`the figure ${url} has a label (${at.id}) but no number ({-})`, img);
  const capKids = [];
  if (n) capKids.push(node('zlSpan', 'span', { className: ['a-fn'] }, [text(`Figure ${n}.`)]));
  const words = await inlineMd(cap);
  if (words.length) { if (n) capKids.push(text(' ')); capKids.push(...words); }
  const caption = capKids.length ? [node('zlCap', 'figcaption', { className: ['w-cap'] }, capKids)] : [];
  const max = /^(\d{1,3})%$/.exec(at.kv.max || '');
  const cls = ['w-fig', ...(at.width ? [at.width] : [])];
  const name = path.basename(file);

  if (VIDEO.test(file)) {
    let meta;
    try { meta = videoSize(file); } catch (e) { fail(e.message, img); }
    const style = `--w:${meta.w}px;--ar:${(meta.w / meta.h).toFixed(4)}` + (max ? `;--mw:${max[1]}%` : '');
    // (its words, ![what it shows](clip.mp4), name it for a reader who cannot see it)
    const video = node('zlVideo', 'video', { src: urlBase + name, width: meta.w, height: meta.h, controls: true, playsInline: true, preload: 'metadata', ...(img.alt ? { ariaLabel: img.alt } : {}) },
      [text('Your browser does not play this video here: '), { type: 'link', url: urlBase + name, children: [text('open the file')] }, text('.')]);
    slot.list[slot.i] = node('zlFig', 'figure', { className: cls, style, ...(id ? { id, tabIndex: -1 } : {}) }, [video, ...caption]);
    return;
  }
  const meta = await sharp(file, { pages: 1 }).metadata();
  const w = meta.width, h = meta.pageHeight || meta.height;
  const style = `--w:${w}px;--ar:${(w / h).toFixed(4)}` + (max ? `;--mw:${max[1]}%` : '');
  if (GIF.test(file) && (meta.pages || 1) > 1) {
    // an animation waits for play: its first frame stands until then (post-media.mjs makes it, and copies the gif)
    const still = urlBase + name.replace(/\.gif$/i, '.still.webp');
    const im = node('zlImg', 'img', { src: still, alt: img.alt || '', width: w, height: h, loading: 'lazy', decoding: 'async' });
    const ctl = node('zlCtl', 'div', { className: ['a-live-k'], hidden: true }, [
      node('zlPlay', 'button', { type: 'button', className: ['a-play'], ariaPressed: 'false', ariaLabel: 'play the animation' }, [], { hChildren: [...PLAY_SVG, { type: 'element', tagName: 'span', properties: { className: ['a-pw'] }, children: [{ type: 'text', value: 'play' }] }] }),
    ]);
    // where there is no play (no script, or reduced motion: the sheet shows it then, styles/article.css), a plain
    // way to the file itself
    const kb = Math.max(1, Math.round(fs.statSync(file).size / 1024));
    const plain = node('zlAnimL', 'p', { className: ['a-anim-l'] }, [
      { type: 'link', url: urlBase + name, children: [text('open the animation')] }, text(` (GIF, ${kb} KB)`)]);
    slot.list[slot.i] = node('zlFig', 'figure', { className: [...cls, 'a-anim'], style, dataAnim: urlBase + name, ...(id ? { id, tabIndex: -1 } : {}) }, [im, ctl, plain, ...caption]);
    return;
  }
  // a picture: Astro's image step makes it (the url stays relative, so Astro finds it), in the widths a screen may
  // ask for and at the width it takes here (lib/picture.mjs), in its two forms (the speed round's picture policy,
  // 2026-10-16: lib/picture-forms.mjs), AVIF for the browsers that show it and a fallback every browser shows,
  // neither visibly worse than its source: a <picture> (display: contents, so its picture lays out as it did) of the
  // two, the AVIF one made its <source> once the pages are written (integrations/picture-sources.mjs); no title on
  // the <img>
  const place = at.width === 'a-wide' ? 'wide' : at.width === 'a-full' ? 'full' : at.width === 'a-win' ? 'screen' : 'text';
  const share = max ? +max[1] / 100 : 1;
  const forms = await pictureForms(file);
  const one = (f, more) => ({ ...img, title: null, data: { ...(img.data || {}), hProperties: { ...(img.data?.hProperties || {}),
    widths: widthsFor(w, place, share), sizes: sizesFor(place, share), format: f.format, quality: f.quality, ...more } } });
  /* (the AVIF <img>'s marker a class, which an .md post and an .mdx post both write as it is: a data attribute came
     out of MDX's image component as "datazlavif", and that post showed its picture twice. Hidden till a build makes
     it its <source>: the dev server, which never does, shows the fallback alone) */
  const pic = node('zlPicture', 'picture', { style: 'display:contents' }, [one(forms.avif, { className: ['zl-avif'], style: 'display:none' }), one(forms.fallback)]);
  slot.list[slot.i] = node('zlFig', 'figure', { className: cls, style, ...(id ? { id, tabIndex: -1 } : {}) }, [pic, ...caption]);
}

async function liveFigure(el, C) {
  const { Z, slug } = C;
  const attr = (k) => { const a = el.attributes.find((x) => x.type === 'mdxJsxAttribute' && x.name === k); return a ? String(a.value ?? '') : ''; };
  const label = attr('id'), cap = attr('caption'), width = attr('width');
  let n = 0;
  if (cap || label) n = ++Z.fig;
  const id = n ? `fig-${n}` : '';
  if (id) Z.ids.add(id);
  if (label && n) Z.labels[/^fig:/.test(label) ? label : `fig:${label}`] = { id, n, kind: 'fig' };
  const set = (k, v) => {
    el.attributes = el.attributes.filter((x) => !(x.type === 'mdxJsxAttribute' && x.name === k));
    el.attributes.push({ type: 'mdxJsxAttribute', name: k, value: String(v) });
  };
  set('figid', id);
  set('post', slug);
  set('cls', WIDTH[width] || '');
  // the caption, set as every caption is, becomes the component's content (its <figcaption>)
  const kids = [];
  if (n) kids.push(node('zlSpan', 'span', { className: ['a-fn'] }, [text(`Figure ${n}.`)]));
  const words = await inlineMd(cap);
  if (words.length) { if (n) kids.push(text(' ')); kids.push(...words); }
  el.children = kids.length ? [node('zlCap', 'figcaption', { className: ['w-cap'] }, kids)] : [];
}

// ---------------------------------------------------------------------------------------------- footnotes
function footnotes(tree, Z) {
  const defs = new Map();
  const strip = (list) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.type === 'footnoteDefinition') { defs.set(n.identifier, n); list.splice(i, 1); }
      else if (n.children) strip(n.children);
    }
  };
  strip(tree.children);
  if (!defs.size) return;
  const order = [];
  walk(tree, (n, parent) => {
    if (n.type !== 'footnoteReference' || !parent) return;
    const idn = n.identifier;
    if (!defs.has(idn)) return;
    let k = order.indexOf(idn) + 1;
    const first = !k;
    if (first) k = order.push(idn);
    const mark = node('zlFm', 'sup', { className: ['a-fm'] }, [{
      type: 'link', url: `#fn-${k}`,
      data: { hProperties: { className: ['num'], ...(first ? { id: `fnref-${k}` } : {}), dataFn: k, ariaLabel: `note ${k}` } },
      children: [text(String(k))],
    }]);
    parent.children.splice(parent.children.indexOf(n), 1, mark);
  });
  Z.noteCount = order.length;
  tree.children.push(node('zlNotes', 'div', { dataZlNotes: '' },
    order.map((idn, i) => node('zlNote', 'div', { dataN: i + 1 }, defs.get(idn).children))));
}

// ---------------------------------------------------------------------------------------------- citations
// Citations are Pandoc's, numbered: [@key], several in one pair of brackets as [@a; @b], each with words before it
// or a place after a comma, as [see @a, p. 3; @b]. Pointers: @fig:x (alone, or in brackets). Brackets that hold an
// @ but read as neither stop the build, with the line, rather than reach the page as plain text.
const POINTER = /(^|[^\w@])@((?:fig|eq|tbl):[\w-]+)/g;
const KEY = /(^|[^\w@.])(-?)@(\w[\w:.#$%&+?<>~/-]*)/g;
/** the items of one pair of brackets: [{ prefix, key, suffix }], or { error } */
function citeGroup(inner) {
  const items = [];
  for (const raw of inner.split(';')) {
    const keys = [...raw.matchAll(KEY)];
    if (keys.length !== 1) {
      return { error: keys.length ? 'has two sources in one place: put a ";" between them, as [@a; @b] (a page goes after a comma, as [@a, p. 3])'
        : 'has a part with no source in it: each part between the ";" names one, as [see @a, p. 3; @b]' };
    }
    const k = keys[0];
    const key = k[3].replace(/[.:]+$/, '');   // (a key's last stop or colon is the sentence's)
    const at = k.index + k[1].length;
    items.push({ prefix: raw.slice(0, at).trim(), key, suffix: raw.slice(at + 1 + k[2].length + key.length).trim() });
  }
  return { items };
}
function refsAndPointers(tree, Z, fail) {
  const pointer = (lab, at) => {
    const L = Z.labels[lab];
    if (!L) fail(`@${lab} points to no figure, formula or table with that label`, at);
    const word = L.kind === 'fig' ? `Figure ${L.n}` : L.kind === 'tbl' ? `Table ${L.n}` : `(${L.n})`;
    return { type: 'link', url: `#${L.id}`, data: { hProperties: { className: ['a-xr'] } }, children: [text(word)] };
  };
  // a suffix as written: ", p. 3" keeps its comma; any other words follow after a space
  const after = (s) => (!s ? '' : /^,/.test(s) ? s.replace(/^,\s*/, ', ') : ` ${s}`);
  const cite = (items, at) => {
    const kids = [text('[')];
    const affixed = items.some((x) => x.prefix || x.suffix);
    items.forEach(({ prefix, key, suffix }, i) => {
      if (!Z.refs.has(key)) fail(`[@${key}] is cited, but the post's bibliography has no entry "${key}"`, at);
      let n = Z.order.indexOf(key) + 1;
      if (!n) n = Z.order.push(key);
      const uses = (Z.uses[key] ??= []);
      const id = `cite-${n}-${uses.length + 1}`;
      uses.push(id);
      if (i) kids.push(text(affixed ? '; ' : ', '));
      if (prefix) kids.push(text(`${prefix} `));
      kids.push({ type: 'link', url: `#ref-${n}`, data: { hProperties: { className: ['a-cm', 'num'], id, dataRef: n, ariaLabel: `reference ${n}` } }, children: [text(String(n))] });
      if (suffix) kids.push(text(after(suffix)));
    });
    kids.push(text(']'));
    return node('zlCite', 'span', { className: affixed ? ['a-cite', 'a-cite-x'] : ['a-cite'] }, kids);
  };
  walk(tree, (n, parent) => {
    if (n.type === 'link' || n.type === 'linkReference' || n.type === 'code' || n.type === 'inlineCode') return 'skip';
    if (n.type !== 'text' || !parent) return;
    const v = n.value;
    if (!v.includes('@')) return;
    // where in the file a match is: the text's own line, and the lines before the match within it
    const lineOf = (i) => (n.position ? { position: { start: { line: n.position.start.line + (v.slice(0, i).match(/\n/g) || []).length } } } : undefined);
    const out = [];
    let last = 0;
    const re = new RegExp(`\\[([^\\[\\]]*)\\]|${POINTER.source}`, 'g');
    let m;
    while ((m = re.exec(v))) {
      const at = lineOf(m.index);
      if (m[1] != null) {
        if (!new RegExp(KEY.source).test(m[1])) continue;   // brackets with no @source in them are words
        const g = citeGroup(m[1]);
        if (g.error) fail(`[${m[1]}] ${g.error}`, at);
        const isPtr = (x) => /^(fig|eq|tbl):/.test(x.key);
        let before = v.slice(last, m.index);
        if (g.items.every(isPtr)) {
          out.push(text(before));
          g.items.forEach((x, i) => {
            if (i) out.push(text(', '));
            if (x.prefix) out.push(text(`${x.prefix} `));
            out.push(pointer(x.key, at));
            if (x.suffix) out.push(text(after(x.suffix)));
          });
        } else if (g.items.some(isPtr)) {
          fail(`[${m[1]}] puts a figure, formula or table and a source in one pair of brackets: write them apart`, at);
        } else {
          const sp = /\s+$/.exec(before);
          if (sp) before = before.slice(0, sp.index);
          out.push(text(before + (sp || m.index > 0 ? NB : '')));
          out.push(cite(g.items, at));
        }
      } else {
        out.push(text(v.slice(last, m.index) + m[2]));
        out.push(pointer(m[3], at));
      }
      last = m.index + m[0].length;
    }
    if (!out.length) return;
    out.push(text(v.slice(last)));
    const at = parent.children.indexOf(n);
    parent.children.splice(at, 1, ...out.filter((x) => x.type !== 'text' || x.value !== ''));
  });
}
