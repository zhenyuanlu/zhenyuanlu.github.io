// race: the seasons (content/race/<year>.yaml), the clubs and the medley's name, checked as the build reads them and
// turned into the shape the race engine takes (src/scripts/race/index.js, mountRace and renderRaceList: the draft's
// content.json races, { seasons: { '2026': [race, ...], '2025': [...] }, clubs: [...], medley }).
// The map (its stops, roads and land) and the pixel scenes are the engine's own art: src/scripts/race/geo.json and
// acts.json, not content. A race is drawn at its lat and lon (at a stop of the map if one is near).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { ContentError, asDay, day, gather, isDay, month, readList, readOne, slugText, text, whereOf, type Entry } from './common.ts';
import { createModel } from '../scripts/race/model.js';
import { slug as venueSlug } from '../scripts/race/util.js';
import { currentOf, seasonsOf } from '../scripts/race/address.js';
import { bostonDay } from '../scripts/today.js';

export const DIR = 'content/race';
export const FILES = { clubs: `${DIR}/clubs.yaml`, medley: `${DIR}/medley.yaml` } as const;
const SEASON = /^(\d{4})\.yaml$/;

/** the sports the engine has pictures for (src/scripts/race/acts.json, sports) */
export const SPORTS = ['run', 'hyrox', 'dragonboat'] as const;
/** the weathers the engine names (src/scripts/race/consts.js, WX_WORD) */
export const WEATHER = ['sun', 'sun-cloud', 'cloud', 'overcast-wind', 'rain'] as const;
/** raced once run (the page counts a race whose day has passed as run in any case); registered or planned before */
export const STATUS = ['raced', 'registered', 'planned'] as const;

const MONTHS = /^(\d{4})-(0[1-9]|1[0-2])\/(0[1-9]|1[0-2])$/;
function isMonths(s: string): boolean {
  const m = MONTHS.exec(s);
  return !!m && m[2] < m[3];
}
/** a race's first day, or (known only by its months) its first month's first day */
export function startOf(date: string): string {
  return isDay(date) ? date : `${date.slice(0, 7)}-01`;
}
/** its day, or while only they are known, its months: 2026-05/06 */
const raceDate = z.preprocess(
  asDay,
  z.string({ error: 'a day, as YYYY-MM-DD, or the months, as YYYY-MM/MM' }).refine((s) => isDay(s) || isMonths(s), 'a day, as YYYY-MM-DD, or the months, as YYYY-MM/MM'),
);

/** a result: a place (and its event), or a finisher's medal, or a qualification */
export const resultEntry = z
  .strictObject({
    /** "500m", "Division C"; "?" while it is not known */
    event: text.optional(),
    place: z.number({ error: 'a place, as 1' }).int().min(1).optional(),
    note: text.optional(),
    finisher: z.boolean().optional(),
    qualified: z.boolean().optional(),
  })
  .refine((r) => r.place !== undefined || !!r.finisher || !!r.qualified, 'a place, finisher: true or qualified: true (the page shows nothing else)');

/** a crew he raced in */
export const crewEntry = z.strictObject({ name: text, note: text.optional(), club: slugText.optional(), division: text.optional() });

/** a race */
export const raceEntry = z
  .strictObject({
    /** its address, /race/#<id> (scripts/race/address.js): unique across the seasons; never the page's next race
     *  (next), a season (a year), an element of the race page (ip, season, race-data, zl-next) or a venue's name
     *  (readRace) */
    id: slugText.refine((s) => s !== 'next' && !/^\d{4}$/.test(s) && !['ip', 'season', 'race-data', 'zl-next'].includes(s), {
      message: 'not next, a year or an element of the race page (ip, season, race-data, zl-next): the address /race/#<id> names those already',
    }),
    date: raceDate,
    /** the last day of a race over several days */
    end: day.optional(),
    /** words for its date, where the page's own would mislead */
    dateLabel: text.optional(),
    sport: z.enum(SPORTS),
    name: text,
    /** shorter names: the home's race line takes short, then tiny where there is little room */
    short: text.optional(),
    tiny: text.optional(),
    place: text,
    /** the river or lake it is raced on */
    water: slugText.optional(),
    lat: z.number({ error: 'a latitude, as 42.355' }).min(-90).max(90),
    lon: z.number({ error: 'a longitude, as -71.066' }).min(-180).max(180),
    /** true: the venue's lat and lon are known only roughly */
    approx: z.boolean().optional(),
    status: z.enum(STATUS),
    results: z.array(resultEntry).optional(),
    note: text.optional(),
    crews: z.array(crewEntry).optional(),
    /** its leg of the series in medley.yaml */
    medley: z.number({ error: 'a leg, 1, 2 or 3' }).int().min(1).max(3).optional(),
    weather: z.enum(WEATHER).optional(),
  })
  .refine((r) => !r.end || (isDay(r.date) && r.end > r.date), { message: 'a later day than date (and date a day)', path: ['end'] });
export type Race = z.output<typeof raceEntry>;
export type Result = z.output<typeof resultEntry>;
export type Crew = z.output<typeof crewEntry>;

/** a club he races with */
export const clubEntry = z
  .strictObject({
    /** what a crew's club names */
    id: slugText,
    /** as the timeline shows it */
    name: text,
    long: text,
    /** the month he joined, and (none: to now) the month he left */
    from: month,
    to: month.optional(),
    /** true: the month is about */
    approx: z.boolean().optional(),
    /** the words that name the club inside a crew's own name, so a crew's line does not repeat its club */
    aka: z.array(text),
  })
  .refine((c) => !c.to || c.to >= c.from, { message: 'not before from', path: ['to'] });
export type Club = z.output<typeof clubEntry>;

/** the series some runs belong to */
export const medleyEntry = z.strictObject({ name: text });
export type Medley = z.output<typeof medleyEntry>;

export interface RaceContent {
  /** by season (its file's year), in the file's order */
  seasons: Record<string, Entry<Race>[]>;
  clubs: Entry<Club>[];
  medley: Entry<Medley>;
}

/** the folder, checked: every season's races (each in its season's year, in date order, its id unique across the
 *  seasons and no venue's name, its crews' clubs in clubs.yaml, a medley's leg once a season), the clubs and the
 *  medley. now: the moment the current season is told by (the build's) */
export function readRace(root: string = process.cwd(), now: Date = new Date()): RaceContent {
  const dir = path.resolve(root, DIR);
  if (!existsSync(dir)) throw new ContentError([`${DIR}/: the folder is missing`]);
  const problems: string[] = [], seasons: Record<string, Entry<Race>[]> = {};
  const names = readdirSync(dir).sort();
  for (const f of names.filter((n) => /\.ya?ml$/.test(n))) {
    const m = SEASON.exec(f);
    if (m) {
      const list = gather(problems, () => readList(root, `${DIR}/${f}`, raceEntry, (r) => r.id));
      if (list) seasons[m[1]] = list;
    } else if (`${DIR}/${f}` !== FILES.clubs && `${DIR}/${f}` !== FILES.medley) {
      problems.push(`${DIR}/${f}: not a season (<year>.yaml), clubs.yaml or medley.yaml`);
    }
  }
  if (!Object.keys(seasons).length && !problems.length) problems.push(`${DIR}/: no season (<year>.yaml)`);
  const clubsRead = gather(problems, () => readList(root, FILES.clubs, clubEntry, (c) => c.id)), clubs = clubsRead || [];
  const medley = gather(problems, () => readOne(root, FILES.medley, medleyEntry, 'medley'));
  const clubIds = new Set(clubs.map((e) => e.id)), seen = new Map<string, string>();
  for (const [y, list] of Object.entries(seasons)) {
    let last = '';
    const legs = new Map<number, string>();
    for (const e of list) {
      const r = e.data, where = whereOf(e);
      if (r.date.slice(0, 4) !== y) problems.push(`${where}: date: ${r.date} is not in the ${y} season`);
      if (startOf(r.date) < last) problems.push(`${where}: date: ${r.date} comes before the race above it (the file keeps the season's order)`);
      last = startOf(r.date);
      if (seen.has(e.id)) problems.push(`${where}: id: "${e.id}" is in ${seen.get(e.id)} too (an id is an address: one race)`);
      seen.set(e.id, e.file);
      for (const c of r.crews || []) if (clubsRead && c.club && !clubIds.has(c.club)) problems.push(`${where}: crews: club: "${c.club}" is not an id in ${FILES.clubs}`);
      if (r.medley !== undefined) {
        if (legs.has(r.medley)) problems.push(`${where}: medley: leg ${r.medley} is ${legs.get(r.medley)}'s already`);
        legs.set(r.medley, e.id);
      }
    }
  }
  if (!problems.length && medley) venueNames(root, seasons, clubs, medley, problems, now);
  if (problems.length || !medley) throw new ContentError(problems);
  return { seasons, clubs, medley };
}

/** no race's id is a venue's name (its venue's on the map, as the engine names it: geo.json's places, else its place's
 *  first part) where /race/#<name> would open the race, not the venue: /race/ is the current season's page, and an id
 *  there is looked for in every season before a venue's name is (scripts/race/address.js, model.js asked). So no id
 *  is the name of a venue of the current season or a later one (each the current one in its turn), but its own
 *  venue's, where it is that venue's only race, which names the same place. An earlier season's venues are named on
 *  that season's own page, /race/<year>/, where only its own races' ids are looked for */
function venueNames(root: string, seasons: Record<string, Entry<Race>[]>, clubs: Entry<Club>[], medley: Entry<Medley>, problems: string[], now: Date): void {
  const geo = JSON.parse(readFileSync(path.resolve(root, 'src/scripts/race/geo.json'), 'utf8'));
  const shape = raceShapeOf({ seasons, clubs, medley });
  const M = createModel(shape, null, { geo, acts: {} }), current = currentOf(seasonsOf(shape), bostonDay(now).slice(0, 4)) || '';
  const venues: { year: string; name: string; ids: string[] }[] = [];
  for (const y of Object.keys(shape.seasons).filter((s) => s >= current)) {
    for (const P of M.model(y).PL as { name: string; races: { r: { id: string } }[] }[]) venues.push({ year: y, name: P.name, ids: P.races.map((R) => R.r.id) });
  }
  for (const [y, list] of Object.entries(seasons)) {
    for (const e of list) {
      const hit = venues.find((v) => venueSlug(v.name) === e.id && !(v.year === y && v.ids.length === 1 && v.ids[0] === e.id));
      if (hit) problems.push(`${whereOf(e)}: id: "${e.id}" is the name of ${hit.year}'s venue "${hit.name}" on the map: /race/#${e.id} would open this race, not that venue (give it an id of its own, as hartford-2025)`);
    }
  }
}

/* ---------- the engine's shape ---------- */

export interface DraftRace {
  id: string;
  date: string;
  end?: string;
  dateLabel?: string;
  sport: string;
  name: string;
  short?: string;
  tiny?: string;
  place: string;
  water?: string;
  lat: number;
  lon: number;
  approx?: boolean;
  status: string;
  results?: Result[];
  note?: string;
  crews?: Crew[];
  medley?: number;
  weather?: string;
}
export interface DraftClub {
  id: string;
  name: string;
  long: string;
  from: string;
  to?: string;
  approx?: boolean;
  aka: string[];
}
/** what mountRace and renderRaceList take */
export interface DraftRaces {
  seasons: Record<string, DraftRace[]>;
  clubs: DraftClub[];
  medley: string;
}

function copy<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, Array.isArray(v) ? v.map((x) => (x && typeof x === 'object' ? copy(x) : x)) : v])) as T;
}

/** the races (any order of seasons; a season's races in its file's order), the clubs and the medley as the engine
 *  takes them: a race's season is its date's year */
export function toRaceShape(races: Race[], clubs: Club[], medley: Medley): DraftRaces {
  const seasons: Record<string, DraftRace[]> = {};
  for (const r of races) (seasons[r.date.slice(0, 4)] ||= []).push(copy(r) as DraftRace);
  return { seasons, clubs: clubs.map((c) => copy(c) as DraftClub), medley: medley.name };
}
/** toRaceShape from readRace */
export function raceShapeOf(rc: RaceContent): DraftRaces {
  return toRaceShape(Object.values(rc.seasons).flat().map((e) => e.data), rc.clubs.map((e) => e.data), rc.medley.data);
}
