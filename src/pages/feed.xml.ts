// /feed.xml: the blog as RSS, at the old feed's address. The posts the blog lists (not the talks, not hidden or
// draft posts), newest first, each with its sentence and its topics, dated at noon in Boston on its day.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { absolute, listed, noonInBoston, person, posts, topicsOf } from '../lib/site';

export async function GET(context: APIContext) {
  const me = await person();
  const items = listed(await posts());
  return rss({
    title: `${me.name}: blog`,
    description: me.description,
    site: context.site ?? 'https://zhenyuanlu.com',
    trailingSlash: true,
    items: items.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: noonInBoston(p.data.date),
      link: absolute(`/blog/${p.id}/`),
      categories: topicsOf(p),
    })),
    customData: `<language>en</language><atom:link href="${absolute('/feed.xml')}" rel="self" type="application/rss+xml"/>`,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
  });
}
