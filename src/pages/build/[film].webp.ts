// /build/<name>.webp: a software's film (content/build/software.yaml, film: an animated picture its card plays while
// in hand, over its still), served as it is, byte for byte. Astro's image step would encode it again: larger
// (1.12 MB for 1.04 MB, Waycine's) and with a second loss. Fetched only once its card is first in hand
// (scripts/frames.js).
import fs from 'node:fs';
import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { readBuild } from '../../schemas/build.ts';
import { beside } from '../../schemas/common.ts';

export const getStaticPaths = (() => {
  return readBuild().software.flatMap((e) => {
    if (!e.data.film) return [];
    const file = beside(e.file, e.data.film);
    if (!/\.webp$/i.test(file)) throw new Error(`${e.file}: film: ${e.data.film}: a film is an animated .webp for now (scripts/frames.js plays it while its card is in hand)`);
    return [{ params: { film: path.basename(file, path.extname(file)) }, props: { file } }];
  });
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const body = fs.readFileSync(path.resolve(process.cwd(), String(props.file)));
  return new Response(body, { headers: { 'Content-Type': 'image/webp' } });
};
