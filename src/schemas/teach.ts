// teach: courses, their terms and the open books (content/teach/), checked as the build reads them and turned into
// the draft's shapes (design/assets/v2ac/content.json: courses, terms, books). The covers and the tallies are drawn by
// the page itself; there are no pictures here.
import { z } from 'astro/zod';
import { ContentError, address, gather, links, readList, slug, text, whereOf, type Entry } from './common.ts';

export const DIR = 'content/teach';
export const FILES = { courses: `${DIR}/courses.yaml`, terms: `${DIR}/terms.yaml`, books: `${DIR}/books.yaml` } as const;

const code = z.string({ error: 'a course code, as IE6600' }).regex(/^[A-Z]{2,4}\d{4}$/, 'a course code, as IE6600');

/** what the margin says of a course */
export const courseEntry = z.strictObject({ code, line: text, tools: z.array(text) });
export type Course = z.output<typeof courseEntry>;

/** a term taught: a book in its course's tally; the latest term's url is the course's link */
export const termEntry = z.strictObject({
  slug: z.string({ error: 'as ie6600_bos_fa20' }).regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'as ie6600_bos_fa20'),
  code,
  title: text,
  campus: text,
  /** the page reads its season and year (and from them, "teaching now"): any other form would drop the term */
  semester: z.string({ error: 'as "Fall 2026"' }).regex(/^(Spring|Summer|Fall) \d{4}$/, 'Spring, Summer or Fall, then the year: "Fall 2026"'),
  url: address,
});
export type Term = z.output<typeof termEntry>;

/** an open book: its cover is drawn by the page from its title */
export const bookEntry = z.strictObject({ title: text, topics: z.array(text), links: links(['website', 'github', 'pdf']) });
export type Book = z.output<typeof bookEntry>;

export interface Teach {
  courses: Entry<Course>[];
  terms: Entry<Term>[];
  books: Entry<Book>[];
}

/** the three files, checked: every field; each term's course in courses.yaml and each course with a term; one title
 *  a course (the page names a course by its first term's title) */
export function readTeach(root: string = process.cwd()): Teach {
  const problems: string[] = [];
  const courses = gather(problems, () => readList(root, FILES.courses, courseEntry, (c) => c.code));
  const terms = gather(problems, () => readList(root, FILES.terms, termEntry, (t) => t.slug));
  const books = gather(problems, () => readList(root, FILES.books, bookEntry, (b) => slug(b.title)));
  if (!courses || !terms || !books) throw new ContentError(problems);
  const codes = new Set(courses.map((e) => e.id)), titles = new Map<string, Entry<Term>>();
  for (const e of terms) {
    const where = whereOf(e), first = titles.get(e.data.code);
    if (!codes.has(e.data.code)) problems.push(`${where}: code: ${e.data.code} is not a course in ${FILES.courses}`);
    if (first && first.data.title !== e.data.title) problems.push(`${where}: title: "${e.data.title}", but ${first.id} (line ${first.line}) calls ${e.data.code} "${first.data.title}"`);
    if (!first) titles.set(e.data.code, e);
  }
  for (const e of courses) if (!titles.has(e.id)) problems.push(`${whereOf(e)}: no term in ${FILES.terms}, so the page would not show it`);
  if (problems.length) throw new ContentError(problems);
  return { courses, terms, books };
}

/* ---------- the draft's shapes ---------- */

export type DraftCourses = Record<string, { line: string; tools: string[] }>;
export interface DraftTerm {
  slug: string;
  code: string;
  title: string;
  campus: string;
  semester: string;
  url: string;
}
export interface DraftBook {
  title: string;
  topics: string[];
  links: Array<{ type: string; href: string }>;
}

/** D.courses: a course's line and tools by its code */
export function toCoursesShape(list: Course[]): DraftCourses {
  return Object.fromEntries(list.map((c) => [c.code, { line: c.line, tools: [...c.tools] }]));
}
/** D.terms, in the file's order (the page groups them by course and sorts them by season itself) */
export function toTermsShape(list: Term[]): DraftTerm[] {
  return list.map((t) => ({ slug: t.slug, code: t.code, title: t.title, campus: t.campus, semester: t.semester, url: t.url }));
}
/** D.books, in the file's order */
export function toBooksShape(list: Book[]): DraftBook[] {
  return list.map((b) => ({ title: b.title, topics: [...b.topics], links: b.links.map((l) => ({ type: l.type, href: l.href })) }));
}
