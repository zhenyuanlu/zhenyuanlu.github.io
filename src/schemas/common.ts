// What the content folders build, teach, see, race and home share: the YAML reader, whose every problem names the
// file and the line; the small field shapes (a day, a month, a picture beside the file, an address, a link); the
// pictures' own sizes (README.md here).
// Plain TypeScript: it runs in Astro's build and under Node alike (nothing from astro:content).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { LineCounter, isMap, isSeq, parseDocument } from 'yaml';

/** what is wrong in content/: one line a problem, each with its file and line */
export class ContentError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(problems.length === 1 ? problems[0] : `${problems.length} problems in content/:\n  ${problems.join('\n  ')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

/* ---------- the field shapes ---------- */

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Astro's own YAML reader makes 2026-04-18 a Date: back to the day it names (the reader here leaves it a string) */
export function asDay(v: unknown): unknown {
  return v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : v;
}
export function isDay(s: string): boolean {
  const d = new Date(`${s}T00:00:00Z`);
  return DAY.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
/** a day, as YYYY-MM-DD */
export const day = z.preprocess(asDay, z.string({ error: 'a day, as YYYY-MM-DD' }).refine(isDay, 'a day, as YYYY-MM-DD'));
/** a month, as YYYY-MM */
export const month = z.string({ error: 'a month, as YYYY-MM' }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'a month, as YYYY-MM');
/** words (a string with something in it) */
export const text = z.string({ error: 'words' }).min(1, 'empty');
/** a year */
export const year = z.number({ error: 'a year, as 2026' }).int('a year, as 2026').min(1990).max(2100);
/** a name that is part of an address: lowercase letters, digits and hyphens */
export const slugText = z.string({ error: 'a name such as hyrox-boston' }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits and hyphens, as hyrox-boston');
/** where a wide picture rests in its frame, and where it travels to: "0% 50%" */
export const position = z.string({ error: 'as "0% 50%"' }).regex(/^\d{1,3}% \d{1,3}%$/, 'as "0% 50%"');

const PICTURE = /^\.\/(?:[\w-][\w.-]*\/)*[\w-][\w.-]*\.(?:webp|png|jpe?g|gif|avif)$/i;
/** a picture beside the YAML file, named from it: ./name.jpg or ./img/name.webp (never outside its folder) */
export const picture = z.string({ error: 'a picture beside this file, as ./img/name.webp' }).regex(PICTURE, 'a picture beside this file, as ./img/name.webp');

function isAddress(s: string): boolean {
  if (/^\/(?!\/)\S*$/.test(s)) return true;   // a path on this site: the build puts its base in front
  if (/\s/.test(s)) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
/** an address: https://… elsewhere, or /… on this site */
export const address = z.string({ error: 'an address' }).refine(isAddress, 'an address: https://… or a path on this site, /…');

/** a list of links, each { type, href }, its type one of these */
export function links<const T extends readonly [string, ...string[]]>(types: T) {
  return z.array(z.strictObject({ type: z.enum(types), href: address }));
}

/** the draft's slug: lowercase, every run of other characters one hyphen (build's anchors, see's addresses) */
export function slug(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ---------- reading ---------- */

export interface Source {
  /** the file from the site's root, with forward slashes: content/build/research.yaml */
  rel: string;
  /** the parsed YAML: strings stay strings, 2026-04-18 too */
  data: unknown;
  /** the line of a list's n-th entry, or of a map's key, for the messages (0: not known) */
  line: (at: number | string) => number;
}

/** one YAML file, read strictly: a duplicate key or a bad indent is a problem with its line, as a wrong field is */
export function readYaml(root: string, rel: string): Source {
  const file = path.resolve(root, rel);
  if (!existsSync(file)) throw new ContentError([`${rel}: the file is missing`]);
  const counter = new LineCounter();
  const doc = parseDocument(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''), { schema: 'core', uniqueKeys: true, lineCounter: counter });
  const bad = [...doc.errors, ...doc.warnings];   // the first one: those after it mostly follow from it
  if (bad.length) {
    const e = bad[0], at = e.linePos?.[0], more = bad.length > 1 ? ` (and ${bad.length - 1} more after it)` : '';
    const what = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '');
    throw new ContentError([`${rel}:${at ? `${at.line}:${at.col}` : 0}: ${what}${more}`]);
  }
  const top = doc.contents;
  type Ranged = { range?: [number, number, number] | null } | null | undefined;
  function line(at: number | string): number {
    let node: Ranged = null;
    if (isSeq(top) && typeof at === 'number') node = top.items[at] as Ranged;
    else if (isMap(top)) node = top.items.find((p) => (p.key as { value?: unknown } | null)?.value === at)?.key as Ranged;
    return node?.range ? counter.linePos(node.range[0]).line : 0;
  }
  return { rel, data: doc.toJS(), line };
}

/** an entry as read: its id (unique in its collection), its line, its checked data */
export interface Entry<T> {
  id: string;
  /** the file it is in, from the site's root */
  file: string;
  line: number;
  data: T;
}

function valueAt(raw: unknown, at: PropertyKey[]): unknown {
  return at.reduce<unknown>((v, k) => (v != null && typeof v === 'object' ? (v as Record<PropertyKey, unknown>)[k] : undefined), raw);
}
/** zod's issues as lines: the field, then what is wrong ("missing" for a field not there) */
export function issueLines(where: string, raw: unknown, error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const at = i.path.length ? `${i.path.join('.')}: ` : '';
    const missing = i.code === 'invalid_type' && i.path.length > 0 && valueAt(raw, i.path) === undefined;
    return `${where}: ${at}${missing ? 'missing' : i.message}`;
  });
}
function labelOf(raw: unknown, n: number): string {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const name = [o.id, o.slug, o.code, o.title].find((v) => typeof v === 'string' && v);
  return name ? `"${String(name).slice(0, 48)}"` : `entry ${n + 1}`;
}

/** a file that is a list of entries, each checked by schema and named by idOf (two of one id are a problem) */
export function readList<S extends z.ZodType>(root: string, rel: string, schema: S, idOf: (data: z.output<S>, n: number) => string): Entry<z.output<S>>[] {
  const src = readYaml(root, rel);
  if (!Array.isArray(src.data)) throw new ContentError([`${rel}: a list of entries, each beginning with "- "`]);
  const problems: string[] = [], out: Entry<z.output<S>>[] = [], seen = new Map<string, number>();
  src.data.forEach((raw: unknown, n: number) => {
    const line = src.line(n), where = `${rel}:${line} (${labelOf(raw, n)})`;
    const r = schema.safeParse(raw);
    if (!r.success) {
      problems.push(...issueLines(where, raw, r.error));
      return;
    }
    const id = idOf(r.data, n);
    if (!id) problems.push(`${where}: no name to know it by`);
    else if (seen.has(id)) problems.push(`${where}: "${id}" again (first at line ${seen.get(id)})`);
    seen.set(id, line);
    out.push({ id, file: rel, line, data: r.data });
  });
  if (problems.length) throw new ContentError(problems);
  return out;
}

/** a read whose problems join the list (null if it had any), so that one run tells every file's problems */
export function gather<T>(problems: string[], read: () => T): T | null {
  try {
    return read();
  } catch (e) {
    if (!(e instanceof ContentError)) throw e;
    problems.push(...e.problems);
    return null;
  }
}

/** a file that is one entry */
export function readOne<S extends z.ZodType>(root: string, rel: string, schema: S, id: string): Entry<z.output<S>> {
  const src = readYaml(root, rel), r = schema.safeParse(src.data);
  if (!r.success) throw new ContentError(issueLines(`${rel}`, src.data, r.error));
  return { id, file: rel, line: 1, data: r.data };
}

/** where an entry is, for a message: its file, its line, its id (cut short) */
export function whereOf(e: Entry<unknown>): string {
  return `${e.file}${e.line ? `:${e.line}` : ''} ("${e.id.length > 48 ? `${e.id.slice(0, 47)}…` : e.id}")`;
}

/** a file named in an entry, from the site's root (picture: ./img/x.webp in content/build/research.yaml gives
 *  content/build/img/x.webp) */
export function beside(rel: string, name: string): string {
  return path.posix.join(path.posix.dirname(rel), name);
}
/** the files these entries name, each beside its YAML; a missing one is a problem with the entry's line */
export function checkFiles(root: string, named: Array<{ entry: Entry<unknown>; field: string; name: string | undefined }>): string[] {
  const problems: string[] = [];
  for (const { entry, field, name } of named) {
    if (!name) continue;
    if (!existsSync(path.resolve(root, beside(entry.file, name)))) problems.push(`${whereOf(entry)}: ${field}: ${name} is not there`);
  }
  return problems;
}
/** a post of the blog, by its folder: content/blog/<slug>/index.md or index.mdx */
export function hasPost(root: string, postSlug: string): boolean {
  return ['index.md', 'index.mdx'].some((f) => existsSync(path.resolve(root, 'content/blog', postSlug, f)));
}

/* ---------- pictures ---------- */

/** a picture as a page uses it: where it is served (src) and its own pixels (an animated one: a frame's) */
export interface Picture {
  src: string;
  w: number;
  h: number;
}
/** a picture by its path from the site's root: content/build/img/haybeat.webp */
export type PictureOf = (file: string) => Picture;

/** each picture's own pixels, read with sharp (the draft wrote them down by hand; here they come from the file).
 *  src says how a page names a file: by default its path from the site's root */
export async function measure(root: string, files: Iterable<string>, src: (file: string) => string = (f) => f): Promise<PictureOf> {
  const { default: sharp } = await import('sharp');
  const sizes = new Map<string, Picture>(), problems: string[] = [];
  for (const f of new Set(files)) {
    try {
      const m = await sharp(path.resolve(root, f), { animated: true }).metadata();
      if (!m.width || !m.height) throw new Error('no size');
      sizes.set(f, { src: src(f), w: m.width, h: m.pageHeight ?? m.height });
    } catch (e) {
      problems.push(`${f}: not a picture that can be read (${(e as Error).message})`);
    }
  }
  if (problems.length) throw new ContentError(problems);
  return (f) => {
    const p = sizes.get(f);
    if (!p) throw new ContentError([`${f}: a picture that was not measured`]);
    return p;
  };
}
