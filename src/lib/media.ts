// Media helpers for the pages (server side): a video's size from its file, a post's file address.
import fs from 'node:fs';
import path from 'node:path';
import { url } from './site';

/** a video's width and height, read from its file (MP4 or WebM: lib/video-size.mjs, shared with the Markdown step);
    a file it cannot read stops the build with its name */
export { videoSize } from './video-size.mjs';

/** the folder of a post's files on disk */
export function postDir(slug: string): string {
  return path.join(process.cwd(), 'content', 'blog', slug);
}
/** a file beside the post ("./name.mp4") as its address on the site (served by integrations/post-media.mjs) */
export function postFileUrl(slug: string, rel: string): string {
  const name = rel.replace(/^\.\//, '');
  const file = path.join(postDir(slug), name);
  if (!fs.existsSync(file)) throw new Error(`${rel} is not beside the post ${slug}`);
  return url(`/blog/${slug}/${name}`);
}
