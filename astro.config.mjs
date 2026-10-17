// zhenyuanlu.com, built with Astro (static output).
// Everything he writes lives in content/; this file only says how it becomes pages.
//
// Two builds share this file:
//   npm run build       the real site, for https://zhenyuanlu.com (base "/", output dist/)
//   npm run build:lan   a preview copy for another machine at home (ZL_LAN=1, drafts included): its base and its
//                       output folder come from a file of this machine's own, lan.local.json, which git ignores
//                       (scripts/build-lan.mjs reads it and sets ZL_BASE and ZL_OUT; lan.example.json shows it)
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkDialect } from './src/plugins/remark-dialect.mjs';
import { rehypeArticle } from './src/plugins/rehype-article.mjs';
import { rehypeCode } from './src/plugins/rehype-code.mjs';
import { postMedia } from './src/integrations/post-media.mjs';
import { modulePreload } from './src/integrations/modulepreload.mjs';
import { pictureSources } from './src/integrations/picture-sources.mjs';
import { draftSlugs } from './src/lib/drafts.mjs';

const LAN = process.env.ZL_LAN === '1';
const BASE = LAN ? process.env.ZL_BASE : '/';
const OUT = LAN ? process.env.ZL_OUT : './dist';
if (LAN && !(BASE && /^\/(?:.*\/)?$/.test(BASE) && OUT)) {
  throw new Error('a LAN build needs its base (as /a/b/) and its output folder: run it as npm run build:lan, which reads them from lan.local.json');
}
const DRAFTS = LAN || process.env.ZL_DRAFTS === '1';

/** the posts whose front matter says draft: true (never in the sitemap, even where they are built) */
const DRAFT_SLUGS = draftSlugs('./content/blog');

/** virtual:zl-live, the code of the live figures (content/blog/<post>/<name>.live.js) of the posts this build
    shows, each loaded only by the page that has the figure: a draft's are not among the real site's files */
function liveFigures() {
  const ID = 'virtual:zl-live';
  const RID = `\0${ID}`;
  let dev = false;
  return {
    name: 'zl-live-figures',
    configResolved(config) {
      dev = config.command === 'serve';
    },
    resolveId(id) {
      return id === ID ? RID : undefined;
    },
    load(id) {
      if (id !== RID) return undefined;
      const rows = [];
      for (const d of fs.readdirSync('./content/blog', { withFileTypes: true })) {
        if (!d.isDirectory() || (!dev && !DRAFTS && DRAFT_SLUGS.includes(d.name))) continue;
        for (const f of fs.readdirSync(`./content/blog/${d.name}`)) {
          if (!f.endsWith('.live.js')) continue;
          const key = JSON.stringify(`${d.name}/${f.slice(0, -'.live.js'.length)}`);
          rows.push(`  ${key}: () => import(${JSON.stringify(`/content/blog/${d.name}/${f}`)}),`);
        }
      }
      return `export default {\n${rows.join('\n')}\n};\n`;
    },
  };
}

export default defineConfig({
  site: 'https://zhenyuanlu.com',
  base: BASE,
  trailingSlash: 'always',
  // the old addresses that are no page here any more answer with their new place (phase 5, the launch): the 2024
  // site's posts, /projects/<name>/ (its permalink /:categories/:title/, gone since December 2024), each a page of
  // Astro's own, a meta refresh at once with the new address as its canonical (GitHub Pages sends no server
  // redirect). The live Jekyll site's copies of its posts, /_blog/<kind>/<date>-<slug>.html, are files, not folders,
  // so they are public/_blog/'s pages; the old home's sections (/#software, ...) go by the home's script.
  // scripts/check-dist.mjs holds the whole list of old addresses and fails the build on one that leads nowhere.
  redirects: Object.fromEntries(Object.entries({
    '/projects/lfia/': '/blog/lfia/',
    '/projects/personalizeMeal/': '/build/#mealthup',
    '/projects/hieralytics/': '/build/#hieralytics',
    '/projects/tufts/': '/blog/tufts-hia-ai/',
    '/projects/dataViz/': '/teach/#books',
    '/projects/clVR/': '/blog/contrastive-learning-for-visual/',
    '/projects/informs/': '/blog/informs-talk/',
    '/projects/artifacts/': '/blog/artifacts-mitigation-nlp/',
    '/projects/gesture/': '/blog/gesture-classification/',
    '/projects/rlWorkshop/': '/blog/uw-workshop-ssl/',
    // (/projects/central/, a post the 2024 site hid, has nothing here to lead to: it stays gone)
  }).map(([from, to]) => [from, BASE + to.slice(1)])),   // (the LAN preview's under its base)
  outDir: OUT,
  // the two builds keep their caches apart: a page rendered under one base is never reused under the other
  cacheDir: LAN ? './node_modules/.astro-lan' : './node_modules/.astro',
  build: {
    format: 'directory',
    // every stylesheet a file of its own: the CSP allows style elements from the site only
    inlineStylesheets: 'never',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  // pictures: Astro's sharp service, which makes a picture's two forms, AVIF and a fallback, each no worse than its
  // source, at the steps src/lib/image-choices.json keeps (src/lib/image-service.mjs, src/lib/picture-forms.mjs)
  // (named from the project's root, so the pictures' file names do not depend on where the repository is checked out)
  image: { service: { entrypoint: './src/lib/image-service.mjs' } },
  vite: {
    // nothing inlined as a data: address (KaTeX's smallest fonts were): the CSP allows fonts and pictures from the site only
    build: { assetsInlineLimit: 0 },
    plugins: [liveFigures()],
    // the drafts flag and the build's own date reach the pages through these
    define: {
      'import.meta.env.ZL_DRAFTS': JSON.stringify(DRAFTS ? '1' : ''),
      'import.meta.env.ZL_BUILT': JSON.stringify(new Date().toISOString()),
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, [remarkDialect, { base: BASE }]],
      rehypePlugins: [
        [rehypeKatex, { strict: 'ignore', output: 'html', trust: false }],
        rehypeCode,
        [rehypeArticle, { base: BASE }],
      ],
    }),
    // code is highlighted by our own Shiki step (src/plugins/rehype-code.mjs), which writes no inline style
    syntaxHighlight: false,
  },
  integrations: [
    mdx(),
    sitemap({
      // drafts are never published: none is in the map (nor the 404 page, which the sitemap leaves out by itself)
      filter: (page) => {
        const p = new URL(page).pathname;
        return !DRAFT_SLUGS.some((s) => p.endsWith(`/blog/${s}/`));
      },
    }),
    postMedia({ base: BASE }),
    // every page's scripts' imports asked for at once, not one round trip a step (src/integrations/modulepreload.mjs)
    modulePreload({ base: BASE }),
    // a post's AVIF <img>, made by Astro's image step in its <picture>, made the <source> it is (the speed round's
    // picture policy, 2026-10-16: src/integrations/picture-sources.mjs)
    pictureSources(),
  ],
  // (the Content-Security-Policy is the site's own: src/components/DocHead.astro writes it first in every page's head,
  // with the one hash it needs; Astro's would come after the light's script and carry hashes that match nothing)
});
