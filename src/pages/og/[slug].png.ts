// /og/<slug>.png: a post's social card, 1200 x 630, made at build time from its cover (Astro's own sharp): the
// cover whole on the day's paper (never larger than its own pixels), under it a hairline, the name in the site's
// pixel lettering at the left and the door's word at the right. A post without a cover uses the site's card.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { posts } from '../../lib/site';
import { wordBits, wordPath } from '../../scripts/lettering/bits.js';

export const getStaticPaths = (async () => {
  const all = await posts();
  return all.filter((p) => p.data.cover).map((p) => ({ params: { slug: p.id }, props: { post: p } }));
}) satisfies GetStaticPaths;

const W = 1200, H = 630, PAD = 96, PAPER = '#fcfcfa', INK = '#1b1b1b', GREY = '#666666', LINE = '#6b6b6b';

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Awaited<ReturnType<typeof posts>>[number] };
  const cover = post.data.cover as unknown as { fsPath?: string; width: number; height: number };
  if (!cover.fsPath) throw new Error(`the cover of ${post.id} has no file path`);
  const box = { w: W - 2 * PAD, h: 336, x: PAD, y: 72 };
  const pic = await sharp(cover.fsPath).resize({ width: box.w, height: box.h, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const m = await sharp(pic).metadata();
  const name = wordBits('zhenyuan lu'), door = wordBits(post.data.kind === 'talk' ? 'build' : 'blog');
  const cell = 4, lineY = 448, baseY = lineY + 44 + (name.S.asc + name.S.x) * cell;
  const nameY = baseY - (name.S.asc + name.S.x) * cell, doorX = W - PAD - door.w * cell;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">` +
    `<rect x="${PAD}" y="${lineY}" width="${W - 2 * PAD}" height="2" fill="${LINE}"/>` +
    `<path transform="translate(${PAD} ${nameY}) scale(${cell})" fill="${INK}" d="${wordPath(name)}"/>` +
    `<path transform="translate(${doorX} ${nameY}) scale(${cell})" fill="${GREY}" d="${wordPath(door)}"/></svg>`;
  const png = await sharp({ create: { width: W, height: H, channels: 3, background: PAPER } })
    .composite([
      { input: pic, left: Math.round(box.x + (box.w - (m.width || 0)) / 2), top: Math.round(box.y + (box.h - (m.height || 0)) / 2) },
      { input: Buffer.from(svg), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
