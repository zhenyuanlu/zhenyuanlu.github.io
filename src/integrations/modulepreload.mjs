// Each page's scripts asked for at once (the speed round, 2026-10-16). A page's script is a module that imports the
// parts it shares with other pages (site.js, hub.js, the lettering), and those import their own: the browser finds
// each import only once the file before it has come and been read, a network round trip a step. On a phone that cost
// race ~230ms before its map could be laid out, and the blog's title ~340 (Fast 4G: four steps, HTML, the page's
// module, site.js, the lettering). Astro writes no modulepreload for a page's own scripts, so once the pages are
// written each page's head is given a <link rel="modulepreload"> for every module its scripts import, all the way
// down (the static imports only: what a script imports later, as a post's live figures, is asked for when needed).
// Nothing changes but when the files are asked for: the same files, run in the same order.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** a built module's static imports (rolldown writes them first in the file: import{...}from"./x.js";import"./y.js");
    also read by scripts/check-budget.mjs */
export function importsOf(code) {
  const out = [];
  const re = /^\s*(?:import\s*(?:[\w$]+\s*,?\s*)?(?:\{[^}]*\}|\*\s*as\s*[\w$]+)?\s*(?:from\s*)?|export\s*(?:\{[^}]*\}|\*(?:\s*as\s*[\w$]+)?)\s*from\s*)["']([^"']+)["']\s*;?/;
  let rest = code;
  for (;;) {
    const m = re.exec(rest);
    if (!m) break;
    out.push(m[1]);
    rest = rest.slice(m[0].length);
  }
  return out;
}

export function modulePreload({ base = '/' } = {}) {
  return {
    name: 'zl-modulepreload',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const fileOf = (url) => path.join(out, url.slice(base.length));
        const known = new Map();
        const deps = (url, seen) => {
          if (!known.has(url)) {
            const f = fileOf(url);
            const code = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
            known.set(url, importsOf(code).filter((s) => s.startsWith('.')).map((s) => path.posix.join(path.posix.dirname(url), s)));
          }
          for (const d of known.get(url)) if (!seen.has(d)) { seen.add(d); deps(d, seen); }
          return seen;
        };
        const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []));
        let pages = 0, links = 0;
        for (const f of walk(out)) {
          const html = fs.readFileSync(f, 'utf8');
          const entries = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith(base));
          if (!entries.length || !html.includes('</head>')) continue;
          const seen = new Set();
          entries.forEach((u) => deps(u, seen));
          entries.forEach((u) => seen.delete(u));
          if (!seen.size) continue;
          const tags = [...seen].map((u) => `<link rel="modulepreload" href="${u}">`).join('');
          fs.writeFileSync(f, html.replace('</head>', `${tags}</head>`));
          pages++; links += seen.size;
        }
        logger.info(`modulepreload: ${links} links on ${pages} pages`);
      },
    },
  };
}
