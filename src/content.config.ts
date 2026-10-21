// The shape of everything in content/, checked at every build: a post without a title, a description or a
// date, a cover that is not beside it, a link that is not a link, fails the build with the file's name.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LINK_KINDS, type LinkKind } from './lib/signs';

const WIDTHS = ['text', 'wide', 'full', 'screen'] as const;
const KINDS = Object.keys(LINK_KINDS) as [LinkKind, ...LinkKind[]];
/** the home's marks for the social links (the pixel marks the home engine has: src/scripts/home/art.json, social.glyphs) */
const MARKS = ['github', 'linkedin', 'twitter', 'instagram'] as const;

const blog = defineCollection({
  // one folder a post: content/blog/<slug>/index.md (or .mdx); the folder's name is the address
  loader: glob({ pattern: '*/index.{md,mdx}', base: './content/blog', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      authors: z
        .array(z.object({ name: z.string().min(1), affiliation: z.string().optional(), url: z.url({ protocol: /^https?$/ }).optional() }))
        .min(1)
        .default([{ name: 'Zhenyuan Lu' }]),
      topics: z.array(z.string().min(1)).default([]),
      // a talk is listed with build's research (phase 2), not on the blog; its page lives here all the same
      kind: z.enum(['post', 'talk']).default('post'),
      where: z.string().optional(),
      // the cover: the list's frame, the article's head, the social card
      cover: image().optional(),
      coverAlt: z.string().default(''),
      coverCaption: z.string().optional(),
      coverLabel: z.string().optional(),
      coverWidth: z.enum(WIDTHS).default('text'),
      coverVideo: z.string().regex(/^\.\/[^/]+\.(mp4|webm)$/i, 'a video file beside the post, as ./name.mp4').optional(),
      // what the list's frame shows instead of the cover, and the short film it plays in hand
      listCover: image().optional(),
      listFilm: z.string().regex(/^\.\/[^/]+\.(mp4|webm)$/i, 'a video file beside the post, as ./name.mp4').optional(),
      listPos: z.string().regex(/^\d{1,3}% \d{1,3}%$/, 'as "0% 50%"').optional(),
      bibliography: z.string().regex(/^\.\/[^/]+\.bib$/, 'a .bib file beside the post, as ./refs.bib').optional(),
      // the post's own links under its byline (the paper, its PDF, the code, the slides…), in the order written
      links: z
        .array(z.object({
          kind: z.enum(KINDS),
          href: z.string().refine((s) => /^https?:\/\/[^\s/]+\.[^\s]+$/.test(s) || /^\/(?!\/)\S*$/.test(s), 'a web address (https://…) or an address on this site (/…)'),
          label: z.string().min(1).optional(),
        }))
        .default([]),
      cite: z.object({ text: z.string().optional(), bibtex: z.string().min(1) }).optional(),
      // the post's DOI (10.xxxx/…), shown in the byline, in "Cite this post" and to Google Scholar
      doi: z.string().regex(/^10\.\d{4,9}\/\S+$/, 'a DOI, as 10.48550/arXiv.2210.03163').optional(),
      // what changed after it was published, newest last: the foot's "Updates", before "Cite this post"
      updates: z.array(z.object({ date: z.coerce.date(), note: z.string().min(1) })).default([]),
      // the post's own small pixel picture, drawn from its subject, on the rule over each chapter after the first:
      // rows of '#' (a cell) and '.' (none), as long as each other; none given: three dots (a talk: a speech bubble)
      motif: z
        .array(z.string().regex(/^[#.]+$/, "a row of '#' and '.'"))
        .min(1).max(16)
        .refine((rows) => rows.every((r) => r.length === rows[0].length && r.length <= 32), 'rows of one length, 32 cells at most')
        .optional(),
      toc: z.boolean().default(true),
      // a draft builds in dev and in the LAN preview only; hidden posts are off the list and the feed
      draft: z.boolean().default(false),
      hidden: z.boolean().default(false),
    }),
});

const site = defineCollection({
  loader: file('./content/site.yaml'),
  schema: z.object({
    name: z.string().min(1),
    suffix: z.string().optional(),
    // the name as the home splits it in hand: each syllable's letters, its pinyin, its character; and the name in
    // Chinese (family name first), the same characters (checked below)
    syllables: z
      .array(z.strictObject({
        text: z.string().regex(/^[a-z]+$/, 'lowercase letters, as zhen'),
        py: z.string().min(1),
        hz: z.string().regex(/^\p{Script=Han}$/u, 'one Chinese character'),
      }))
      .min(1),
    hanzi: z.string().regex(/^\p{Script=Han}+$/u, 'the name in Chinese characters'),
    sentence: z.string().min(1),
    // within 160 letters: what a search result shows (components/Head.astro cuts a longer one)
    description: z.string().min(1).max(160, 'at most 160 letters: a search result shows about that many'),
    // what he works on: the structured data's knowsAbout
    areas: z.array(z.string().min(1)).default([]),
    location: z.string().min(1),
    started: z.number().int(),
    // mark: the home's pixel mark for the link (the home engine's art has these four); without one it is not on the home
    social: z.array(z.object({ label: z.string(), href: z.url({ protocol: /^(https?|mailto)$/ }), me: z.boolean().default(true), mark: z.enum(MARKS).optional() })),
    // what Northeastern wrote about him: the home's line under the sentence; a profile is the structured data's sameAs,
    // a story its subjectOf (components/Head.astro)
    featured: z.strictObject({
      lead: z.string().min(1),
      pages: z.array(z.strictObject({
        label: z.string().min(1),
        href: z.url({ protocol: /^https$/ }),
        kind: z.enum(['profile', 'story']),
        title: z.string().min(1).optional(),
        date: z.coerce.date().optional(),
      })).min(1),
    }).optional(),
    mottos: z.object({
      top: z.object({ text: z.string(), by: z.string().optional() }),
      bottom: z.object({ text: z.string(), by: z.string().optional() }),
    }),
    // the home: blink, the traveller on the road blinks now and then while he stands
    home: z.strictObject({ blink: z.boolean().default(true) }).default({ blink: true }),
    // the visitor stats: Google Analytics 4's measurement id (G- and its letters and figures), on the real site's pages
    // only (components/DocHead.astro); none: no tag on any page (DEVELOPMENT.md, "Analytics")
    analytics: z.strictObject({
      ga4: z.string().regex(/^G-[A-Z0-9]{4,12}$/, 'a GA4 measurement id: G- and its letters and figures'),
      // Search Console's verification tag's content, or empty (DEVELOPMENT.md, "Analytics")
      verify: z.union([z.literal(''), z.string().regex(/^[A-Za-z0-9_-]{10,100}$/, "the content of Search Console's HTML tag")]).default(''),
    }).optional(),
  }).superRefine((s, ctx) => {
    const spelt = s.syllables.map((x) => x.text).join('');
    if (spelt !== s.name.toLowerCase().replace(/[^a-z]/g, '')) ctx.addIssue({ code: 'custom', path: ['syllables'], message: `they spell "${spelt}": not the name, ${s.name}` });
    const chars = (t: string[]) => [...t].sort().join('');
    if (chars([...s.hanzi]) !== chars(s.syllables.map((x) => x.hz))) ctx.addIssue({ code: 'custom', path: ['hanzi'], message: `not the syllables' characters (${s.syllables.map((x) => x.hz).join('')})` });
    const marks = s.social.flatMap((x) => (x.mark ? [x.mark] : []));
    if (new Set(marks).size !== marks.length) ctx.addIssue({ code: 'custom', path: ['social'], message: 'a mark is on two links' });
  }),
});

export const collections = { blog, site };
