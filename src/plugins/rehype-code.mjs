// Code blocks, highlighted at build time by Shiki, as the draft sets them (shiki-quiet.mjs says how: two quiet
// tones, no inline style). Astro's own Shiki step is off (astro.config.mjs, syntaxHighlight: false): this one
// leaves nothing a strict CSP would have to allow. ```lang {2-3} marks lines (transformerMetaHighlight).
import { createHighlighter, createCssVariablesTheme } from 'shiki';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { shikiQuiet } from './shiki-quiet.mjs';

const theme = createCssVariablesTheme({ name: 'zl-quiet', variablePrefix: '--zl-code-' });
const ALIAS = { py: 'python', js: 'javascript', ts: 'typescript', sh: 'shell', yml: 'yaml', md: 'markdown', tex: 'latex', text: 'plaintext', txt: 'plaintext' };
let hl = null;

function cls(el) {
  const c = el.properties?.className;
  return Array.isArray(c) ? c.map(String) : typeof c === 'string' ? c.split(/\s+/) : [];
}
function textOf(n) { return n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''); }

export function rehypeCode() {
  return async function transform(tree) {
    const jobs = [];
    const visit = (node, parent) => {
      if (node.type === 'element' && node.tagName === 'pre' && parent) {
        const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
        if (code && node.children.filter((c) => c.type === 'element').length === 1) {
          const lang = (cls(code).find((c) => c.startsWith('language-')) || 'language-plaintext').slice(9);
          if (lang !== 'math') jobs.push({ node, parent, code, lang });
          return;
        }
      }
      if (node.children) node.children.forEach((c) => visit(c, node));
    };
    visit(tree, null);
    if (!jobs.length) return;
    hl ??= createHighlighter({ themes: [theme], langs: [] });
    const h = await hl;
    for (const { node, parent, code, lang: raw } of jobs) {
      let lang = ALIAS[raw] || raw;
      try { if (!h.getLoadedLanguages().includes(lang)) await h.loadLanguage(lang); } catch { lang = 'plaintext'; }
      const meta = code.data?.meta || code.properties?.metastring || '';
      const value = textOf(code).replace(/\n$/, '');
      const out = h.codeToHast(value, {
        lang, theme: 'zl-quiet',
        meta: meta ? { __raw: String(meta) } : undefined,
        transformers: [transformerMetaHighlight(), shikiQuiet({ word: raw })],
      });
      const figure = out.children[0];
      parent.children.splice(parent.children.indexOf(node), 1, figure);
    }
  };
}
