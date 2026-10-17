// Code blocks as the draft sets them (v2ac write.css, .a-code): the mono face in ink, comments and strings a
// tone quieter, and that is all the colour there is. Shiki's css-variables theme says what each token is; this
// transformer turns that into two classes and takes every inline style away (so a page needs no 'unsafe-inline'
// for its code), and wraps the block in its figure: the language over it, a copy word (shown by the page's
// script), and the lines named in braces marked (```python {4-5}: transformerMetaHighlight's "highlighted").
const LANG = { py: 'python', js: 'javascript', ts: 'typescript', md: 'markdown', sh: 'shell', yml: 'yaml', tex: 'latex', plaintext: 'code', text: 'code', txt: 'code' };

function classOf(style) {
  const s = String(style || '');
  if (/token-comment/.test(s)) return 'a-tc';
  if (/token-string/.test(s)) return 'a-ts';
  return '';
}
const el = (tagName, properties, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

export function shikiQuiet(opts = {}) {
  return {
    name: 'zl-quiet-code',
    pre(node) {
      const marked = /\{[\d,\s-]+\}/.test(this.options.meta?.__raw || '');
      node.properties = { className: marked ? ['w-code', 'a-marked'] : ['w-code'] };
    },
    code(node) {
      // the lines are blocks of their own (.a-ln): the newlines between them would add an empty line each
      node.children = node.children.filter((c) => !(c.type === 'text' && c.value === '\n'));
      node.properties = {};
    },
    line(node) {
      const c = [].concat(node.properties.className || node.properties.class || []).join(' ').split(/\s+/);
      node.properties = { className: c.includes('highlighted') ? ['a-ln', 'a-on'] : ['a-ln'] };
      if (!node.children.length) node.children.push(text(' '));   // an empty line keeps its height
    },
    span(node) {
      const c = classOf(node.properties.style);
      node.properties = c ? { className: [c] } : {};
    },
    root(root) {
      const pre = root.children.find((c) => c.type === 'element' && c.tagName === 'pre');
      if (!pre) return;
      const raw = String(opts.word || this.options.lang || 'plaintext').toLowerCase();
      root.children = [el('figure', { className: ['a-code'] }, [
        el('div', { className: ['a-code-h'] }, [
          el('span', { className: ['a-code-l'] }, [text(LANG[raw] || raw || 'code')]),
          el('button', { type: 'button', className: ['a-copy'], hidden: true }, [text('copy')]),
        ]),
        pre,
      ])];
    },
  };
}
