// home: the five doors and the cities on the road (content/home/), checked as the build reads them and turned into
// what the draft's home part says of them (design/home/v2ac-article.html: each door's section, each city's button).
// The name, the sentence, the PhD and the social links are the person's: content/site.yaml. The pixel art (the
// cities' drawings, weather and figures; the traveller; the fader) is the home engine's own, keyed by the ids here.
import { z } from 'astro/zod';
import { ContentError, beside, checkFiles, gather, measure, picture, readList, text, type Entry, type PictureOf } from './common.ts';

export const DIR = 'content/home';
export const FILES = { doors: `${DIR}/doors.yaml`, cities: `${DIR}/cities.yaml` } as const;
/** the site's five pages, the doors' ids */
export const DOOR_IDS = ['build', 'teach', 'see', 'blog', 'race'] as const;
/** the cities the home's engine has art for */
export const CITY_IDS = ['shanghai', 'okinawa', 'austin', 'dallas', 'boston'] as const;

/** a door: its page, and the grey words under its word (race's: what it says while no race is near) */
export const doorEntry = z.strictObject({ id: z.enum(DOOR_IDS), line: text });
export type Door = z.output<typeof doorEntry>;

/** a city on the road: its name, the words in hand, and its icon for a page without script (line art, colour) */
export const cityEntry = z.strictObject({ id: z.enum(CITY_IDS), name: text, memory: text, bw: picture, color: picture });
export type City = z.output<typeof cityEntry>;

export interface Home {
  doors: Entry<Door>[];
  cities: Entry<City>[];
}

/** the two files, checked: every field; the five doors, each once; each city once, its pictures beside the file */
export function readHome(root: string = process.cwd()): Home {
  const problems: string[] = [];
  const doors = gather(problems, () => readList(root, FILES.doors, doorEntry, (d) => d.id));
  const cities = gather(problems, () => readList(root, FILES.cities, cityEntry, (c) => c.id));
  if (!doors || !cities) throw new ContentError(problems);
  const have = new Set(doors.map((e) => e.id));
  const gone = DOOR_IDS.filter((d) => !have.has(d));
  if (gone.length) problems.push(`${FILES.doors}: no door for ${gone.join(', ')} (the home has the five)`);
  problems.push(...checkFiles(root, cities.flatMap((e) => [{ entry: e, field: 'bw', name: e.data.bw }, { entry: e, field: 'color', name: e.data.color }])));
  if (problems.length) throw new ContentError(problems);
  return { doors, cities };
}

/** readHome, and its pictures (src: how a page names a picture file) */
export async function loadHome(root: string = process.cwd(), src?: (file: string) => string): Promise<Home & { picture: PictureOf }> {
  const h = readHome(root);
  return { ...h, picture: await measure(root, h.cities.flatMap((e) => [beside(e.file, e.data.bw), beside(e.file, e.data.color)]), src) };
}

/* ---------- the draft's shapes ---------- */

/** a door's section: data-art, its word, its link, its grey line (.what) */
export interface DraftDoor {
  art: string;
  word: string;
  href: string;
  what: string;
}
/** a city's button: data-city, .nm, .mem, and the two pictures (img.bw, img.co) */
export interface DraftCity {
  id: string;
  name: string;
  memory: string;
  bw: string;
  color: string;
}

/** the doors in the line's order; href: a page's address (its page, /<id>/, under the site's base where the page
 *  gives it: pages/index.astro) */
export function toDoorsShape(list: Door[], href: (id: string) => string = (id) => `/${id}/`): DraftDoor[] {
  return list.map((d) => ({ art: d.id, word: d.id, href: href(d.id), what: d.line }));
}
/** the cities, left to right */
export function toCitiesShape(list: City[], picture: PictureOf): DraftCity[] {
  return list.map((c) => ({ id: c.id, name: c.name, memory: c.memory, bw: picture(beside(FILES.cities, c.bw)).src, color: picture(beside(FILES.cities, c.color)).src }));
}
