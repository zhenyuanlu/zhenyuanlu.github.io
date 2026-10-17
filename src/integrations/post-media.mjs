// The files beside a post that Astro's image step does not take: videos (.mp4, .webm) and animated pictures
// (.gif, with the still they wait on), served at the post's own address, /blog/<slug>/<file>.
// Build: copied into the output once the pages are written (and each gif's first frame written beside it as
// <name>.still.webp). Dev: served from content/ as they are asked for. Also: the old sitemap address
// (/sitemap.xml) answers with the map Astro writes (/sitemap-index.xml), so search engines that know the old
// address keep finding it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const MEDIA = /\.(mp4|webm|m4v|gif)$/i;
const TYPES = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.gif': 'image/gif', '.webp': 'image/webp' };

async function still(gif) {
  /* (lossless: no picture worse than its source, the speed round's picture policy, 2026-10-16) */
  return sharp(gif, { pages: 1 }).webp({ lossless: true, effort: 6 }).toBuffer();
}

export function postMedia({ base = '/' } = {}) {
  let root = null;
  const blogDir = () => path.join(root, 'content', 'blog');
  return {
    name: 'zl-post-media',
    hooks: {
      'astro:config:done': ({ config }) => { root = fileURLToPath(config.root); },
      'astro:server:setup': ({ server }) => {
        const prefix = `${base}blog/`;
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = decodeURI((req.url || '').split('?')[0]);
            if (!url.startsWith(prefix)) return next();
            const [slug, name, ...rest] = url.slice(prefix.length).split('/');
            if (!slug || !name || rest.length) return next();
            const stillOf = /^(.+)\.still\.webp$/.exec(name);
            const src = path.join(blogDir(), slug, stillOf ? `${stillOf[1]}.gif` : name);
            if (!src.startsWith(blogDir()) || !(stillOf || MEDIA.test(name)) || !fs.existsSync(src)) return next();
            const body = stillOf ? await still(src) : fs.readFileSync(src);
            res.setHeader('Content-Type', TYPES[path.extname(stillOf ? name : src).toLowerCase()] || 'application/octet-stream');
            res.setHeader('Content-Length', body.length);
            res.end(body);
          } catch (e) { next(e); }
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        let n = 0;
        for (const slug of fs.readdirSync(blogDir())) {
          const from = path.join(blogDir(), slug);
          const to = path.join(out, 'blog', slug);
          if (!fs.statSync(from).isDirectory() || !fs.existsSync(to)) continue;   // (a draft not built: nothing to copy)
          for (const name of fs.readdirSync(from)) {
            if (!MEDIA.test(name)) continue;
            fs.copyFileSync(path.join(from, name), path.join(to, name));
            n++;
            if (/\.gif$/i.test(name)) { fs.writeFileSync(path.join(to, name.replace(/\.gif$/i, '.still.webp')), await still(path.join(from, name))); n++; }
          }
        }
        const idx = path.join(out, 'sitemap-index.xml');
        if (fs.existsSync(idx)) fs.copyFileSync(idx, path.join(out, 'sitemap.xml'));
        logger.info(`post media: ${n} files copied beside their posts; /sitemap.xml mirrors /sitemap-index.xml`);
      },
    },
  };
}
