// npm run build:lan: a preview copy of the site for another machine at home (a phone, a second screen), drafts
// included (the format guide). It is the same site under another base, written into a folder outside this
// repository that a web server on this machine serves. Both come from lan.local.json beside package.json, a file
// of this machine's own that git ignores (lan.example.json shows its shape), or from ZL_LAN_BASE and ZL_LAN_OUT:
//   { "base": "/preview/v3/", "out": "../preview/v3", "url": "http://<this machine>/preview/v3/" }
// base: the address's path, as /a/b/; out: the folder, from this repository; url: where to look, for the message.
// Only that folder is cleared, and only if it is outside the repository and is empty or a copy this script wrote.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = path.join(ROOT, 'lan.local.json');
const MARK = '.zl-preview';   // left in the folder by every build, so a later one knows it may clear it

function fail(msg) { console.error(`build:lan: ${msg}`); process.exit(1); }
let conf = {};
if (fs.existsSync(LOCAL)) {
  try { conf = JSON.parse(fs.readFileSync(LOCAL, 'utf8')); } catch (e) { fail(`lan.local.json does not read as JSON: ${e.message}`); }
}
const base = process.env.ZL_LAN_BASE || conf.base;
const outRel = process.env.ZL_LAN_OUT || conf.out;
if (!base || !outRel) fail('no base and output folder: copy lan.example.json to lan.local.json and set them (or ZL_LAN_BASE and ZL_LAN_OUT)');
if (!/^\/(?:[\w.~-]+\/)+$/.test(base)) fail(`the base ${JSON.stringify(base)} is not a path of its own, as /preview/v3/`);
const OUT = path.resolve(ROOT, outRel);

// the folder must be outside the repository, not above it, not a drive's root, and empty or an earlier copy
const inside = (a, b) => { const r = path.relative(a, b); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };
if (inside(ROOT, OUT)) fail(`refusing to write into ${OUT}: it is inside the repository`);
if (inside(OUT, ROOT)) fail(`refusing to clear ${OUT}: the repository is inside it`);
if (path.parse(OUT).root === OUT) fail(`refusing to clear ${OUT}: a drive's root`);
if (fs.existsSync(OUT)) {
  const names = fs.readdirSync(OUT);
  const earlier = names.includes(MARK) || (names.includes('_astro') && names.includes('404.html'));
  if (names.length && !earlier) fail(`refusing to clear ${OUT}: it holds files that are not a copy of this site`);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const astro = path.join(ROOT, 'node_modules', 'astro', 'bin', 'astro.mjs');
// (--force: the content is rendered afresh, so the preview never shows a page rendered before a change to src/plugins)
const r = spawnSync(process.execPath, [astro, 'build', '--force'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ZL_LAN: '1', ZL_BASE: base, ZL_OUT: OUT } });
if (r.status !== 0) process.exit(r.status ?? 1);
fs.writeFileSync(path.join(OUT, MARK), 'A preview copy of the site, written by npm run build:lan; the next one clears this folder.\n');
console.log(`LAN preview written to ${OUT}${conf.url ? `, seen at ${conf.url}` : ''}`);
