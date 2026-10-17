// npm run new:post "Title": a new post folder, content/blog/<slug>/index.md, from scripts/templates/post.md.
// The slug is the title in lower case, words joined by hyphens; it is the post's address (/blog/<slug>/) and
// never changes once published. The new post is a draft: it shows in dev and on the LAN copy, not on the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new:post "The post\'s title"');
  process.exit(1);
}
const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
if (!slug) { console.error('The title gives no address: use some letters or figures.'); process.exit(1); }
const dir = path.join(ROOT, 'content', 'blog', slug);
if (fs.existsSync(dir)) { console.error(`content/blog/${slug}/ is there already.`); process.exit(1); }
const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yamlTitle = /[:#'"{}[\],&*?|<>=!%@`]/.test(title) ? JSON.stringify(title) : title;
const text = fs.readFileSync(path.join(ROOT, 'scripts', 'templates', 'post.md'), 'utf8')
  .replaceAll('{{title}}', yamlTitle).replaceAll('{{date}}', date);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.md'), text);
console.log(`content/blog/${slug}/index.md written (a draft). Put its pictures beside it, then: npm run dev`);
