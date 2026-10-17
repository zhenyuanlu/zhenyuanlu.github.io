# src/schemas: the shape of build, teach, see, race and home

The content of the five doors lives in `content/<door>/` as YAML, with its pictures beside it. These modules read
it, check it strictly and turn it into the draft's own objects, so the pages and engines ported from the draft
(`design/assets/v2ac/`) take it unchanged. They are plain TypeScript (zod from `astro/zod`, nothing from
`astro:content`): Astro's build runs them, and so does Node (`node file.ts`).

The pages read them in their frontmatter (`read<Door>`, `loadHome`: below); `src/content.config.ts` has the posts
and `site.yaml` alone.

## The content

| Content | File | One entry | Id | Shape (the draft's object) | The draft reads it in |
| --- | --- | --- | --- | --- | --- |
| research | `content/build/research.yaml` | a paper, patent or abstract (the hidden too) | slug of the title | the entries as they are (pages/build.astro) | `build.js` (its `!hidden` ones) |
| software | `content/build/software.yaml` | a piece of software | slug of the title (the card's anchor) | the entries as they are (pages/build.astro) | `build.js` |
| talks | `content/build/talks.yaml` | a talk's place on build | `slug` (its post's folder) | `toBuildTables` → build.js's `PLACE` | `build.js` (the talks themselves are posts with `kind: talk`) |
| courses | `content/teach/courses.yaml` | a course's line and tools | `code` | `toCoursesShape` → `D.courses` | `teach.js` |
| terms | `content/teach/terms.yaml` | a term taught | `slug` | `toTermsShape` → `D.terms` | `teach.js` |
| books | `content/teach/books.yaml` | an open book | slug of the title | `toBooksShape` → `D.books` | `teach.js` |
| photos | `content/see/<name>.yaml` + `<name>.jpg` | a photograph (`alt` optional: the title by default) | the file's name (its address, `/see/<name>/`) | `toPhotosShape` → `D.photos` | `see.js` |
| races | `content/race/<year>.yaml` | a race of that season | `id` (unique across the seasons) | `toRaceShape` → `D.races.seasons` | the race engine (`src/scripts/race/`) |
| clubs | `content/race/clubs.yaml` | a club | `id` | `toRaceShape` → `D.races.clubs` | the race engine |
| medley | `content/race/medley.yaml` | the series' name | `medley` | `toRaceShape` → `D.races.medley` | the race engine |
| doors | `content/home/doors.yaml` | a door: its page and its grey line | `id` | `toDoorsShape` → the home part's five door sections | the home (phase 3) |
| cities | `content/home/cities.yaml` | a city on the road | `id` | `toCitiesShape` → the home part's five city buttons | the home (phase 3) |

`toBuildTables(software, talks, postHref)` also gives build.js's `LINE` (a card's one line, from `line`) and `MORE`
(the "blog" link after PainAttnNet's, from `post`; `postHref` makes its address, `/blog/<slug>/` by default).

## Reading

Each door's module (`build.ts`, `teach.ts`, `see.ts`, `race.ts`, `home.ts`) has:

- the zod schema of an entry (`researchEntry`, `raceEntry`, ...), strict: a field it does not know (a misspelt one)
  is a problem, as are a missing required field, a day not in the calendar, a value not in its list (a sport the
  engine has no pictures for, a link type the page has no word for);
- `read<Door>(root = process.cwd())`: reads the door's files and checks each entry, then what spans entries and files
  (a paper's software is on the shelf, a talk's post exists, every picture is beside its file, every term's course
  is in `courses.yaml`, races in date order within their season and in its year, ids unique, a crew's club in
  `clubs.yaml`, the five doors there). Every problem is reported at once, each with its file and line, in a
  `ContentError`;
- `loadHome(root, src)` (the home has pictures: its cities' icons): `readHome`, then each picture's own size, read
  from the file with sharp. `picture(file)` then gives `{ src, w, h }`; `src` is how a page names the file (by default
  its path from the site's root; give `src` to turn that into an address, as pages/index.astro does with a Vite
  `import.meta.glob`). build and see measure their pictures through Astro's own image step;
- the shape functions (the table above), which keep the file's order (the page's), and output a field only where
  the YAML has it, as the draft did.

YAML is read with `yaml` (the YAML 1.2 core schema: `2026-04-18` stays a string, a duplicate key is a problem).
Astro's own reader makes such a day a `Date`; the schemas take either and give the day as `YYYY-MM-DD`. `yaml` and
`sharp` are what Astro already brings, and both are in `package.json` (`yaml` 2.9.1, the lockfile's).

## How a page reads it

A page calls `read<Door>` (or `loadHome`) in its frontmatter: every check runs, and a problem fails the build with
its file and line. Nothing here is wired into `src/content.config.ts`, which has the posts and `site.yaml` alone.
The race page, for instance:

```ts
import { readRace, raceShapeOf } from '../schemas/race.ts';
import { renderRaceList } from '../scripts/race/list.js';   // the engine's own list, pure (index.js needs a browser)
const races = raceShapeOf(readRace());   // { seasons: { '2026': [...], '2025': [...] }, clubs, medley }
const list = renderRaceList(races, '2026');
```

(The round trip ran `renderRaceList` on these races and on the draft's, both seasons, three days: the same HTML.)

## What differs from the draft, on purpose

Checked by a round trip (every YAML read, checked, shaped, and compared with `content.json`, the page's own
`#v1k-data`, build.js's tables and the home part; pictures by their bytes): nothing else differs.

| | The draft | Here | Why |
| --- | --- | --- | --- |
| Picture sizes (`w`, `h`, `film.w`, `film.h`) | written in `content.json` | read from the file | they are the file's own pixels (all 22 the draft wrote down are); a new picture needs no measuring |
| Picture paths | relative to the draft's page | relative to the YAML file | the picture is beside its YAML; the bytes are the draft's |
| A photograph's file | `../assets/photos/cup_of_water.jpg` | `content/see/old-times.jpg` | named as its YAML is, its address (see.js's slug of its title, so the draft's `#/see/<name>` holds) |
| Software `technologies` | `kotlin`, `Deep Learning`, ... | `Kotlin`, `deep learning`, ... | written as the page shows them (build.js's `TOOL` applied); the page's words are the same |
| build.js's `LINE`, `MORE`, `PLACE` | in the page's code | `line`, `post` (software.yaml), `talks.yaml` | the page's words belong with the content |
| Waycine's `note` | a field | a comment above it | the coordinator's provenance; no page reads it |
| The BMES abstracts' PDF links | `https://zhenyuanlu.com/docs/publications/<name>.pdf` | `/assets/docs/publications/<name>.pdf` | where the files are, and were on the old site (the draft's address has none); they are hidden today |
| Terms' `status` | `past` / `active` | not kept | no page reads it (teach.js reads "teaching now" from the semester) and it is stale (Fall 2024 says active) |
| `terms` order | by slug | by course, then season | the page's order; teach.js groups and sorts them itself |
| Races' `medleyNext` | on the B.A.A. Half | not kept | derived (the series' next leg) and read by nothing |
| `races.note`, `notShown`, `clubsNote`, `seasonNote`, `earlier` | fields | comments in the season and clubs files | the coordinator's notes: `merge-v1k.cjs` keeps all but `earlier` off the page, and nothing reads `earlier` |

Not here, by design: `content.json`'s `write` (the blog's own, `content/blog/`), `about`, `social`, `quotes` and
`mottos` (the person's, `content/site.yaml`; `quotes` is read by no page since r13) and `source`; `doors.json`
(the write and race door pictures, not drawn since v1l: a door in hand has no picture); the home's pixel art (the
cities' drawings, weather and figures, the traveller, the social marks: the home engine's own, keyed by the ids in
`cities.yaml`); the race map and scenes (`src/scripts/race/geo.json`, `acts.json`).

## For the pages that take this (phases 2 to 4)

- **build:** the PDFs `/assets/docs/publications/2015-bmes.pdf`, `2016-bmes.pdf`, `2017-bmes.pdf` are this site's
  own files (`assets/docs/publications/` in the old site, still in this folder); keep them at that address
  (`public/assets/docs/publications/`). Every other link in build and teach is elsewhere, `/courses/`,
  `/python-notebook/`, `/r-comput-viz/` and `/waycine/` included (other repositories' Pages on this domain).
- **build:** the shelf leaves out the software a featured paper names (PainAttnNet); `hidden` entries are not
  drawn, and the draft kept them out of the page's source too.
- **see:** `alt` is optional and defaults to the photograph's title: the title names it for a reader who cannot see
  it, on its page, in the viewer and in its link preview (on the wall its link and caption say the title, and its
  picture's alt is empty). The wall is newest first; two photographs of one day hang in the order of their names
  (`toPhotosShape` keeps the draft's order, oldest first, for see.js). see.js's `AVG` (each photograph's average
  colour, the 3% tint that holds its place) is keyed by the draft's file names: derive it from the file (the
  linear-light mean of its pixels comes within one step of each channel of the draft's for eight of the ten, three
  and four for `hustle_bustle.jpg` and `eyes.jpg`), or carry the table under the new names.
- **home:** the doors' order is also `DOORS` in `src/lib/site.ts` (the ring); keep the two one. The name's
  sounds (`zhèn yuān lù; in Chinese 陆振渊`) are in the home part's markup and script, not in content yet.
- **race:** a season is a file (`2027.yaml` next year, which may come while this year's last races are still ahead:
  the next race is the earliest not yet over in any season's file, `src/scripts/race/next.js`); a race's season is
  its date's year. The engine places a race by its `lat` and `lon` (at a stop of the map if one is near); a race at
  a new place may want a stop in `geo.json`.
