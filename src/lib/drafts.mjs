// The posts whose front matter says `draft: true`, read the way the build reads it (Astro's own front matter
// parser), not by a pattern in the text: astro.config.mjs keeps them out of the sitemap and the real site's live
// figures, and scripts/check-dist.mjs makes sure none of them is in a production build.
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';

/** @param {string} blogDir content/blog @returns {string[]} the drafts' folder names (their slugs) */
export function draftSlugs(blogDir) {
  const out = [];
  for (const d of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = ['index.md', 'index.mdx'].map((n) => path.join(blogDir, d.name, n)).find((p) => fs.existsSync(p));
    if (!file) continue;
    let front;
    try { front = parseFrontmatter(fs.readFileSync(file, 'utf8')).frontmatter; }
    catch (e) { throw new Error(`the front matter of ${path.relative(process.cwd(), file)} does not read: ${e.message}`); }
    if (front && front.draft === true) out.push(d.name);
  }
  return out;
}
