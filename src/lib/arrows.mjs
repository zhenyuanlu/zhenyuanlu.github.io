// The arrows ← → ↑, drawn (Claude's call in the taste round, 2026-10-16, instead of a font download): Figtree has no
// ← or → and each system draws its own, so the site draws one. An arrow is a small SVG the size of its line's letters
// (styles/tokens.css .zl-ar: .8em x .6em, ↑ .6em x .8em), its stroke the line's colour; aria-hidden, since the link's
// words or its label say where it goes.
//   arrowSvg(dir, cls)  the markup, for a template (components) or a string (scripts)
//   arrowHast(dir, cls) the same as a HTML-tree node (plugins/rehype-*)
//   arrowMd(dir, cls)   the same as a Markdown-tree node that becomes it (plugins/remark-dialect.mjs)
// dir: 'l' (←), 'r' (→), 'u' (↑).
const SHAPE = {
  l: { box: '0 0 16 12', d: 'M15 6H2.4M6.8 1.6 2.4 6l4.4 4.4' },
  r: { box: '0 0 16 12', d: 'M1 6h12.6M9.2 1.6 13.6 6l-4.4 4.4' },
  u: { box: '0 0 12 16', d: 'M6 15V2.4M1.6 6.8 6 2.4l4.4 4.4' },
};
const STROKE = { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'square' };

function shape(dir) {
  const s = SHAPE[dir];
  if (!s) throw new Error(`arrows: no arrow "${dir}" (l, r, u)`);
  return s;
}
const classes = (dir, cls) => ['zl-ar', `zl-${dir}`, ...(cls ? String(cls).split(/\s+/).filter(Boolean) : [])];

/** the arrow's markup */
export function arrowSvg(dir, cls = '') {
  const s = shape(dir);
  const stroke = Object.entries(STROKE).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<svg class="${classes(dir, cls).join(' ')}" viewBox="${s.box}" aria-hidden="true" focusable="false"><path d="${s.d}" ${stroke}></path></svg>`;
}

/** the arrow as a HTML-tree (hast) element */
export function arrowHast(dir, cls = '') {
  const s = shape(dir);
  return {
    type: 'element', tagName: 'svg',
    properties: { className: classes(dir, cls), viewBox: s.box, ariaHidden: 'true', focusable: 'false' },
    children: [{ type: 'element', tagName: 'path', properties: { d: s.d, fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'square' }, children: [] }],
  };
}

/** the arrow as a Markdown-tree (mdast) node that turns into it */
export function arrowMd(dir, cls = '') {
  const h = arrowHast(dir, cls);
  return { type: 'zlArrow', data: { hName: 'svg', hProperties: h.properties, hChildren: h.children } };
}
