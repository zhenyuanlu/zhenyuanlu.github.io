// The second half of the dialect (remark-dialect.mjs is the first), on the HTML tree after KaTeX:
// the classes the article's sheet expects (lists, quotes, tables), external links opened apart and without a
// referrer, the cover's caption, the notes and the author's end sections (:::appendix) taken out of the text for the
// page to place, the post's own small pixel picture on the rule over each chapter after the first, and what the page
// needs besides (contents, references, notes, end sections, reading time) handed over as frontmatter `zl`.
// A formula KaTeX cannot read fails the build, as a citation of a missing source does.
import { toHtml } from 'hast-util-to-html';

function walk(n, fn, parent = null) {
  if (fn(n, parent) === 'skip') return;
  if (n.children) for (const c of [...n.children]) walk(c, fn, n);
}
function cls(el) {
  const c = el.properties?.className;
  return Array.isArray(c) ? c.map(String) : typeof c === 'string' ? c.split(/\s+/) : [];
}
function addClass(el, ...names) { el.properties.className = [...new Set([...cls(el), ...names])]; }
function textOf(n) { return n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''); }

/* the chapter picture (taste items 26 and 27, as draft v2t draws it): the post's own rows (front matter `motif`),
   else a talk's speech bubble or three dots; 2px a cell, in the grey. Drawn here as an SVG of whole cells (what a
   reader without script sees) in a box as tall as the drawing at 2px a cell; in the browser lettering/index.js puts a
   canvas of whole device pixels in its place, standing on the box's foot, so nothing under it moves */
const BUBBLE = ['#######', '#.....#', '#.#.#.#', '#.....#', '###.###', '..##...'];
const DOTS = ['#.#.#'];
function rowsPath(rows) {
  let d = '';
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      if (r[x] !== '#') continue;
      const x0 = x;
      while (x + 1 < r.length && r[x + 1] === '#') x++;
      d += `M${x0} ${y}h${x - x0 + 1}v1h-${x - x0 + 1}z`;
    }
  });
  return d;
}
function chapterPicture(rows) {
  const w = rows[0].length, h = rows.length, cell = 2;
  return {
    type: 'element', tagName: 'div', properties: { className: ['a-brk'], ariaHidden: 'true', style: `height:${h * cell}px` },
    children: [{
      type: 'element', tagName: 'svg',
      properties: {
        className: ['a-brk-i'], width: w * cell, height: h * cell, viewBox: `0 0 ${w} ${h}`, shapeRendering: 'crispEdges', fill: 'currentColor',
        focusable: 'false', dataRows: rows.join('/'), dataCell: String(cell), dataColour: 'grey', dataCls: 'a-brk-i',
      },
      children: [{ type: 'element', tagName: 'path', properties: { d: rowsPath(rows) }, children: [] }],
    }],
  };
}

export function rehypeArticle(options = {}) {
  const site = new URL(options.site || 'https://zhenyuanlu.com');
  const base = options.base || '/';
  return function transform(tree, file) {
    // KaTeX's complaints are fatal here: a formula that does not parse is a mistake in the post
    const bad = file.messages.filter((m) => m.source === 'rehype-katex');
    if (bad.length) file.fail(`KaTeX could not read a formula: ${bad[0].reason} (${bad[0].cause?.message || ''})`);
    const Z = file.data.zl;
    const fm = (file.data.astro ??= {}).frontmatter ??= {};
    if (!Z) return;

    const out = { toc: Z.toc, minutes: Z.minutes, words: Z.words, coverN: Z.coverN || 0, coverCaptionHtml: '', notes: [], refs: [], appendix: [] };

    // first every element as the sheet expects it (the cover's caption and the notes too), then those two taken out
    walk(tree, (el, parent) => {
      if (el.type !== 'element') return;
      const p = el.properties || (el.properties = {});
      if (el.tagName === 'ul' || el.tagName === 'ol') addClass(el, 'w-ls');
      if (el.tagName === 'blockquote') addClass(el, 'w-q');
      // (a column's alignment, GitHub's :--:, is the draft's left as every cell's; align is obsolete HTML)
      if ((el.tagName === 'td' || el.tagName === 'th') && p.align) delete p.align;
      if (el.tagName === 'table') {
        addClass(el, 'w-tbl');
        // a head row with nothing in it (the old posts' tables have none) is no head
        const head = el.children.find((c) => c.type === 'element' && c.tagName === 'thead');
        if (head && !textOf(head).trim()) el.children.splice(el.children.indexOf(head), 1);
        if (!(parent?.type === 'element' && cls(parent).includes('w-tw'))) {
          const wrap = { type: 'element', tagName: 'div', properties: { className: ['w-tw'] }, children: [el] };
          parent.children.splice(parent.children.indexOf(el), 1, wrap);
        }
      }
      // a link written from the site's root (/blog/) lands under the build's base (the preview copy's, on the LAN build)
      if (el.tagName === 'a' && typeof p.href === 'string' && /^\/(?!\/)/.test(p.href) && base !== '/' && !p.href.startsWith(base)) {
        p.href = base + p.href.slice(1);
      }
      if (el.tagName === 'a' && typeof p.href === 'string' && /^https?:\/\//i.test(p.href)) {
        let ext = true;
        try { ext = new URL(p.href).host !== site.host; } catch { /* keep */ }
        if (ext) { p.target = '_blank'; p.rel = ['noopener', 'noreferrer']; }
      }
    });
    walk(tree, (el, parent) => {
      if (el.type !== 'element') return;
      const p = el.properties || {};
      // the cover's caption: set with the text (its citations numbered first), placed by the page
      if (p.dataZlCover !== undefined) {
        const para = el.children.find((c) => c.type === 'element') || el;
        out.coverCaptionHtml = toHtml(para.children || []);
        parent.children.splice(parent.children.indexOf(el), 1);
        return 'skip';
      }
      // the author's end sections: each its title, its address and its words, for the foot (they stand first there)
      if (p.dataZlAppendix !== undefined) {
        out.appendix.push({ id: String(p.id || ''), title: String(p.dataZlAppendix), html: toHtml(el.children) });
        parent.children.splice(parent.children.indexOf(el), 1);
        return 'skip';
      }
      // the notes: their words for the list at the end and the cards
      if (p.dataZlNotes !== undefined) {
        for (const note of el.children.filter((c) => c.type === 'element')) {
          const kids = note.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
          const one = kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'p';
          out.notes.push({ n: Number(note.properties.dataN), html: toHtml(one ? kids[0].children : kids), block: !one });
        }
        parent.children.splice(parent.children.indexOf(el), 1);
        return 'skip';
      }
    });

    // the chapter pictures: on the rule over each chapter (a heading of the text's top level) after the first
    const motif = Array.isArray(fm.motif) && fm.motif.length ? fm.motif.map(String) : fm.kind === 'talk' ? BUBBLE : DOTS;
    const heads = tree.children.filter((c) => c.type === 'element' && c.tagName === 'h2');
    heads.slice(1).forEach((h) => tree.children.splice(tree.children.indexOf(h), 0, chapterPicture(motif)));

    out.refs = Z.order.map((key, i) => {
      const r = Z.refs.get(key);
      return { n: i + 1, key, title: r.title, authors: r.authors, venue: r.venue, year: r.year, url: r.url || '', uses: Z.uses[key] || [] };
    });
    fm.zl = out;
  };
}
