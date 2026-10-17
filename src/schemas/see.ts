// see: the photographs (content/see/<name>.yaml, each beside its photograph <name>.jpg), checked as the build reads
// them and turned into the draft's shape (design/assets/v2ac/content.json: photos). A photograph's name is its
// address (/see/<name>/); its size comes from the file.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { ContentError, beside, checkFiles, day, gather, picture, position, readOne, text, type Entry, type PictureOf } from './common.ts';

export const DIR = 'content/see';
/** the wall's filters (see.js: all, road trip, portrait) */
export const KINDS = ['road trip', 'portrait'] as const;

/** one photograph */
export const photoEntry = z.strictObject({
  title: text,
  /** the day it was taken */
  date: day,
  /** as the caption writes it */
  place: text,
  kind: z.enum(KINDS),
  /** the photograph, beside this file */
  file: picture,
  /** optional: the photograph's text alternative, where its title should not stand for it. Without it the title
      names the photograph for a reader who cannot see it (its page, the viewer, its link preview), as the draft's did */
  alt: text.optional(),
  /** optional: its focus point, "x% y%" (taste item 22, as draft v2t has it): where a frame that must crop it keeps it
      (object-position). The wall shows every photograph whole (the owner: pictures show their whole height), so today
      it only stands ready; without it, the middle */
  focus: position.optional(),
});
export type Photo = z.output<typeof photoEntry>;

const NAME = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.ya?ml$/;

/** every .yaml in content/see/, checked: its fields, its name (lowercase, hyphens), its photograph beside it; and no
 *  photograph without its file */
export function readSee(root: string = process.cwd()): Entry<Photo>[] {
  const dir = path.resolve(root, DIR);
  if (!existsSync(dir)) throw new ContentError([`${DIR}/: the folder is missing`]);
  const names = readdirSync(dir).sort(), problems: string[] = [], out: Entry<Photo>[] = [];
  for (const f of names.filter((n) => /\.ya?ml$/.test(n))) {
    const m = NAME.exec(f);
    if (!m) {
      problems.push(`${DIR}/${f}: a photograph's file is named in lowercase letters, digits and hyphens (its address)`);
      continue;
    }
    const e = gather(problems, () => readOne(root, `${DIR}/${f}`, photoEntry, m[1]));
    if (e) out.push(e);
  }
  const missing = checkFiles(root, out.map((e) => ({ entry: e, field: 'file', name: e.data.file })));
  /* (a photograph no file names, once every file has read and found its own: until then it may be that file's) */
  if (!problems.length && !missing.length) {
    const named = new Set(out.map((e) => beside(e.file, e.data.file)));
    for (const f of names.filter((n) => /\.(?:jpe?g|png|webp|gif|avif)$/i.test(n))) {
      if (!named.has(`${DIR}/${f}`)) problems.push(`${DIR}/${f}: a photograph no .yaml here names`);
    }
  }
  problems.push(...missing);
  if (problems.length) throw new ContentError(problems);
  return out;
}

/* ---------- the draft's shape ---------- */

/** content.json's photos[] */
export interface DraftPhoto {
  title: string;
  date: string;
  place: string;
  file: string;
  w: number;
  h: number;
  kind: string;
}

/** D.photos: oldest first, as the draft lists them; two of one day by name, the later name first, so that the wall
 *  (see.js: newest first, and of one day the later in the list first) hangs them in the order of their names */
export function toPhotosShape(list: Array<{ id: string; data: Photo }>, picture: PictureOf): DraftPhoto[] {
  return [...list]
    .sort((a, b) => (a.data.date < b.data.date ? -1 : a.data.date > b.data.date ? 1 : a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
    .map(({ data: p }) => {
      const f = picture(path.posix.join(DIR, p.file));
      return { title: p.title, date: p.date, place: p.place, file: f.src, w: f.w, h: f.h, kind: p.kind };
    });
}
