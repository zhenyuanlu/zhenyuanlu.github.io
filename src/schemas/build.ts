// build: research, software and talks (content/build/), checked as the build reads them (pages/build.astro takes
// them as they are), and the tables the draft's build.js kept in its code (design/assets/v2ac/pages/build.js): LINE,
// a card's one line; MORE, the write-up beside PainAttnNet; PLACE, a talk's place.
import { z } from 'astro/zod';
import {
  ContentError, checkFiles, gather, hasPost, links, picture, position, readList, slug, slugText, text,
  whereOf, year, type Entry,
} from './common.ts';

export const DIR = 'content/build';
export const FILES = { research: `${DIR}/research.yaml`, software: `${DIR}/software.yaml`, talks: `${DIR}/talks.yaml` } as const;

/** a paper, a patent or an abstract */
export const researchEntry = z
  .strictObject({
    title: text,
    year,
    venue: text,
    kind: z.enum(['paper', 'patent', 'abstract']),
    /** featured: pinned on top, with the software it names; more: kept off the page for now, to come back */
    tier: z.enum(['featured', 'more']).optional(),
    /** the software it stands with: a title in software.yaml */
    software: text.optional(),
    authors: z.array(text).min(1),
    /** (patent and pdf: kept for the hidden patents; the page has no word for them, so a shown entry may not have one) */
    links: links(['paper', 'arxiv', 'github', 'data', 'patent', 'pdf']),
    /** true: not on the page (and not in its source) */
    hidden: z.boolean().optional(),
    img: picture.optional(),
    alt: text.optional(),
  })
  .refine((r) => !r.img === !r.alt, { message: 'a picture and its alt text go together', path: ['alt'] })
  .refine((r) => r.hidden === true || !r.links.some((l) => l.type === 'patent' || l.type === 'pdf'), {
    message: 'a patent or pdf link on an entry the page shows: the page has no word for it (pages/build.astro WORD, as the draft had none), so it would not be shown; keep the entry hidden: true, or give the page a word for it',
    path: ['links'],
  });
export type Research = z.output<typeof researchEntry>;

/** a piece of software on the shelf */
export const softwareEntry = z
  .strictObject({
    title: text,
    year,
    /** the one line its card shows (the draft's build.js LINE); description where there is none */
    line: text.optional(),
    description: text.optional(),
    status: z.enum(['active', 'archived']).optional(),
    version: z.string().regex(/^\d+(\.\d+)*$/, 'a version, as 1.0.0').optional(),
    tier: z.enum(['featured']).optional(),
    /** as the page writes them */
    technologies: z.array(text),
    links: links(['github', 'app', 'paper', 'arxiv', 'data']),
    /** a post of this blog that tells more, by its folder under content/blog/ (the draft's build.js MORE) */
    post: slugText.optional(),
    img: picture.optional(),
    alt: text.optional(),
    /** where a wide picture rests and where it travels to while its card is in hand */
    pos: position.optional(),
    to: position.optional(),
    /** mark: a logo, small and whole; whole: never cut */
    fit: z.enum(['mark', 'whole']).optional(),
    /** a moving picture, played while its card is in hand; img is its still */
    film: picture.optional(),
  })
  .refine((s) => !!(s.line || s.description), { message: 'a line (or a description) for its card', path: ['line'] })
  .refine((s) => !s.img === !s.alt, { message: 'a picture and its alt text go together', path: ['alt'] })
  .refine((s) => !s.film || !!s.img, { message: 'a film needs its still, img', path: ['film'] });
export type Software = z.output<typeof softwareEntry>;

/** a talk's place as build shows it; the talk itself is a post with kind: talk */
export const talkEntry = z.strictObject({ slug: slugText, where: text });
export type Talk = z.output<typeof talkEntry>;

export interface Build {
  research: Entry<Research>[];
  software: Entry<Software>[];
  talks: Entry<Talk>[];
}

/** the three files, checked: every field, the software a paper names, the posts named, the pictures beside them */
export function readBuild(root: string = process.cwd()): Build {
  const problems: string[] = [];
  const research = gather(problems, () => readList(root, FILES.research, researchEntry, (r) => slug(r.title)));
  const software = gather(problems, () => readList(root, FILES.software, softwareEntry, (s) => slug(s.title)));
  const talks = gather(problems, () => readList(root, FILES.talks, talkEntry, (t) => t.slug));
  if (!research || !software || !talks) throw new ContentError(problems);
  const titles = new Set(software.map((e) => e.data.title));
  for (const e of research) {
    if (e.data.software && !titles.has(e.data.software)) problems.push(`${whereOf(e)}: software: "${e.data.software}" is not a title in ${FILES.software}`);
  }
  for (const e of software) if (e.data.post && !hasPost(root, e.data.post)) problems.push(`${whereOf(e)}: post: content/blog/${e.data.post}/ is not there`);
  for (const e of talks) if (!hasPost(root, e.data.slug)) problems.push(`${whereOf(e)}: slug: content/blog/${e.data.slug}/ is not there`);
  problems.push(...checkFiles(root, [
    ...research.map((e) => ({ entry: e, field: 'img', name: e.data.img })),
    ...software.flatMap((e) => [{ entry: e, field: 'img', name: e.data.img }, { entry: e, field: 'film', name: e.data.film }]),
  ]));
  if (problems.length) throw new ContentError(problems);
  return { research, software, talks };
}

/* ---------- the draft's tables ---------- */

/** the tables build.js kept in its code: a card's line, the links after a software's own, a talk's place */
export interface BuildTables {
  LINE: Record<string, string>;
  MORE: Record<string, Array<{ href: string; word: string; sign: string }>>;
  PLACE: Record<string, string>;
}

/** build.js's LINE, MORE and PLACE. postHref: a post's address (its page, /blog/<slug>/, under the site's base where
 *  the page gives it: pages/build.astro) */
export function toBuildTables(software: Software[], talks: Talk[], postHref: (postSlug: string) => string = (p) => `/blog/${p}/`): BuildTables {
  const t: BuildTables = { LINE: {}, MORE: {}, PLACE: {} };
  for (const s of software) {
    if (s.line) t.LINE[s.title] = s.line;
    if (s.post) t.MORE[s.title] = [{ href: postHref(s.post), word: 'blog', sign: 'pencil' }];
  }
  for (const k of talks) t.PLACE[k.slug] = k.where;
  return t;
}
