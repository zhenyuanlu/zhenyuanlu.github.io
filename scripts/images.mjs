// npm run images: the site built with its pictures made afresh (Astro's picture cache, node_modules/.astro/assets,
// emptied first, so no file made before is reused), measuring every choice src/lib/image-choices.json does not have
// yet (a new picture, one changed, a new width: lib/picture-encode.mjs) even where CI is set (ZL_IMAGES=measure),
// as many pictures at once as the machine has threads, up to 16 (UV_THREADPOOL_SIZE; each file is made on one
// thread); then the choices no file was made at (a picture gone, a width no screen needs any more) left out of the
// file. Drafts are built too (ZL_DRAFTS=1), so a draft's pictures are measured and kept as the preview copy's build
// needs them (its output is no deploy: CI builds without drafts). Any local build measures the few pictures it meets;
// this is for many at once, or after a change to the ladders or the widths. Commit the file it writes, with the
// pictures.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const CHOICES = path.join('src', 'lib', 'image-choices.json');
const USED = path.join('node_modules', '.astro', 'zl-image-choices-used.json');
fs.rmSync(path.join('node_modules', '.astro', 'assets'), { recursive: true, force: true });
fs.rmSync(USED, { force: true });
const env = { ...process.env, ZL_IMAGES: 'measure', ZL_DRAFTS: '1', UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || String(Math.min(16, os.availableParallelism())) };
const r = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', ...process.argv.slice(2)], { stdio: 'inherit', env });
if (r.status === 0 && fs.existsSync(USED) && fs.existsSync(CHOICES)) {
  const used = new Set(JSON.parse(fs.readFileSync(USED, 'utf8')));
  const all = JSON.parse(fs.readFileSync(CHOICES, 'utf8'));
  const keys = Object.keys(all).filter((k) => used.has(k)).sort();
  const gone = Object.keys(all).length - keys.length;
  if (gone) fs.writeFileSync(CHOICES, '{\n' + keys.map((k, i) => `  ${JSON.stringify(k)}: ${JSON.stringify(all[k])}${i < keys.length - 1 ? ',' : ''}`).join('\n') + '\n}\n');
  console.log(`images: ${keys.length} choices in ${CHOICES}${gone ? `, ${gone} no file is made at any more left out` : ''}`);
}
process.exit(r.status == null ? 1 : r.status);
