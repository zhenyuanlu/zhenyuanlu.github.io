# zhenyuanlu.com

The personal site of Zhenyuan Lu, built with [Astro](https://astro.build) from the files in `content/`.
Branch `v3` is the new site; `main` is the live one until the new site is merged (phase 5 of the rebuild).

Every page is built (October 2026): the home, build, teach, see and a page for each photograph, the blog and its
posts, race with a page for each season, and the 404 page. Each reads without script; the script draws what is
drawn (the pixel lettering, the light, the home's line and cities, race's map).

## Every day

| To | Run |
| --- | --- |
| See the site while writing (it reloads as you save) | `npm run dev`, then open the address it prints (`http://localhost:4321/blog/`) |
| Start a new post | `npm run new:post "The post's title"` |
| Build the site as it will be published | `npm run build` (into `dist/`), then `npm run preview` to look at it |
| Build a preview copy for another machine at home | `npm run build:lan` (see [A preview copy](#a-preview-copy)) |
| Check everything before a commit | `npm run check` |
| Check the live site after a deploy | `bash scripts/verify-live.sh` (see [After a deploy](#after-a-deploy)) |

The first time (or after a `git pull` that changed `package-lock.json`): `npm ci`. The Node version is in `.nvmrc`.

## Where the content lives

Everything written is in `content/`, as Markdown and YAML with its pictures beside it. Each YAML file says at its top
how to add an entry; `npm run check` stops, naming the file and the line, at anything it cannot read.

| Page | Folder | What is there |
| --- | --- | --- |
| the blog, `/blog/` | `content/blog/<slug>/` | one folder a post: `index.md`, its pictures and videos, `refs.bib` ([Write a post](#write-a-post)) |
| build, `/build/` | `content/build/` | `research.yaml` (papers, patents, abstracts), `software.yaml` (the shelf), `talks.yaml` (each talk's place; a talk itself is a post with `kind: talk`), `img/` |
| teach, `/teach/` | `content/teach/` | `courses.yaml`, `terms.yaml` (every term taught), `books.yaml` |
| see, `/see/` | `content/see/` | one photograph a pair: `<name>.jpg` and `<name>.yaml` (its title, which also names it for a reader who cannot see it, its day, place and kind); its page is `/see/<name>/`. Give a file at least 600px wide (more is fine): the wall draws every photograph at one width, its column's, and a narrower file is drawn past its own pixels there (a 400px one at 1.26x on a phone at 3x, 1.5x on a desk at 2x) |
| race, `/race/` | `content/race/` | one file a season, `<year>.yaml` (`2027.yaml` next year), `clubs.yaml`, `medley.yaml` |
| the home, `/` | `content/home/` | `doors.yaml` (the five doors and their lines), `cities.yaml` (the road's cities), `img/` |
| every page | `content/site.yaml` | the name, the sentence under it, the line under that (`featured`: what Northeastern wrote about him), his photograph for search engines only (`photo`: a .jpg in `public/` and its pixels; no page shows it), the social links (ORCID and Wikidata among them, for search engines only), the mottos, where he is (the footer's "Hello from") |

## Race's addresses

`/race/` is the current season: the newest that has begun by the day of the build (in Boston), so a new year's
page turns at the first build of that year. Every other season is `/race/<year>/`. What is pinned on the map follows
the `#`: a race by its id (`/race/#hyrox-boston`), a venue by its name (`#boston`) and one of its sports after it
(`#boston/hyrox`), or the next race, whichever it is (`#next`). The next race is the earliest not yet over, in any
season's file; the home's race door and every page's footer ("next: B.A.A. Half, Nov 8 →", from three weeks before
it) lead to it. A race of another season opens at its own season's page (`/race/2025/#hartford-2025`). The page
writes back what is pinned as the visitor pins it. A race's id is never `next`, a year, the name of a venue on the
map but its own (where it is that venue's only race), or one of the race page's own ids (`ip`, `season`,
`race-data`, `zl-next`): the build stops, naming the file and the line. Without script `/race/#<id>` lands on the
race in the printed list.

"Today", for what is run, what is next and the term being taught, is Boston's calendar day wherever the visitor is
(`src/scripts/today.js`). `?today=YYYY-MM-DD` on any page shows it as on that day, for checking; anything else after
`?today=` is not heard.

## Write a post

1. `npm run new:post "My new post"` makes `content/blog/my-new-post/index.md`. The folder's name is the post's
   address, `/blog/my-new-post/`: keep it once the post is out.
2. Fill in the lines at the top (the *front matter*). Three are required; the template lists every other one,
   commented out, with an example:

   | Field | What it does | Example |
   | --- | --- | --- |
   | `title` | required: the post's title | `title: My new post` |
   | `description` | required: one sentence; the list, the head, search engines | `description: What it is about.` |
   | `date` | required: the day it is published | `date: 2026-10-20` |
   | `updated` | the day it was last changed | `updated: 2026-11-02` |
   | `authors` | who wrote it (`name`, and `affiliation` or `url`); you, by default | `authors: [{ name: Zhenyuan Lu, affiliation: Northeastern University }]` |
   | `topics` | the blog's tags: vision, language, signals, health, self-supervised, transformers, augmentation, or a new one | `topics: [vision, self-supervised]` |
   | `cover` | a picture beside the post: the list's frame, the head, the social card | `cover: ./cover.webp` |
   | `coverAlt` | the cover's words for a reader who cannot see it, and the social card's | `coverAlt: A diagram of the model's two branches.` |
   | `coverCaption` | under the cover; it may cite, `[@key]` | `coverCaption: The framework, after SimCLR [@chen2020].` |
   | `coverLabel` | numbers the cover as a figure, to point to it with `@fig:…` | `coverLabel: fig:framework` |
   | `coverWidth` | the cover's width: `text` (the default), `wide`, `full` or `screen` | `coverWidth: full` |
   | `coverVideo` | a video beside the post, shown in the head with the cover as its still; it plays when asked | `coverVideo: ./clip.mp4` |
   | `listCover` | the picture the list's frame shows instead of the cover | `listCover: ./frame.webp` |
   | `listFilm` | a short film the list's frame plays while its row is in hand | `listFilm: ./loop.mp4` |
   | `listPos` | where the list's frame rests on a picture wider than it (left, top) | `listPos: 0% 50%` |
   | `bibliography` | a BibTeX file beside the post, for `[@key]` | `bibliography: ./refs.bib` |
   | `links` | the post's own links under the byline, in this order: `kind` (paper, arxiv, pdf, code, slides, patent, data, video, web), `href` (`https://…` or `/…` on this site), `label` (the word shown, if not the kind's) | `links: [{ kind: arxiv, href: "https://arxiv.org/abs/2210.03163" }]` |
   | `cite` | "Cite this post", when it is not to be made from the title and the date (see [Cite](#cite)) | `cite: { text: "Lu, Z. (2026)…", bibtex: "@misc{…}" }` |
   | `kind` | `talk` for a talk: build lists it, not the blog; its page is here all the same, and its way back leads to its card on build | `kind: talk` |
   | `where` | a talk's place, in its byline | `where: Snell Library, Boston, MA` |
   | `toc` | the contents, from the `##` and `###` headings (on by default) | `toc: false` |
   | `hidden` | off the blog's list and the feed; its address still works | `hidden: true` |
   | `draft` | while true, only `npm run dev` and the preview copy show it | `draft: true` |

   A post without a title, a description or a date, or whose pictures or videos are not beside it, stops the
   build with a message that names the file.
3. Write the text in Markdown under the front matter. `##` starts a section (it gets a rule above it, its own
   link, and an entry in the contents), `###` a smaller one.
4. When it is ready, set `draft: false` (or delete the line), run `npm run check`, commit, push.

The whole format, every part shown once with the Markdown that makes it, is the *format guide*: run
`npm run dev` and open `/blog/format-guide/` (it is a draft: never on the real site). In short:

| Part | Write |
| --- | --- |
| a picture | put the file beside `index.md`; `![What it shows](./photo.jpg "Its caption."){#fig:photo}` |
| its width | add `.wide`, `.full` or `.screen` in the braces: `{#fig:photo .full}` |
| point to it | `@fig:photo` (it becomes "Figure 3", a link) |
| no number | `{-}`; a small picture held to a share of its width: `{max=60%}` |
| a video | `![What it shows](./clip.mp4 "Its caption.")` (`.mp4` or `.webm`): controls, plays only when asked |
| an animated gif | `![What it shows](./loop.gif "Its caption.")`: its first frame until play is pressed |
| a YouTube video | `![the video on YouTube](https://www.youtube.com/watch?v=…)`: a link out; nothing of YouTube loads |
| a citation | `[@key]`, `[@key1; @key2]`, or with words and a place, `[see @key, p. 3]`; the keys of `refs.bib` |
| a footnote | `text[^idea]` and, on a line of its own, `[^idea]: The note.` |
| a formula | `$x^2$` in a sentence; `$$ … $$ {#eq:loss}` on its own line (numbered), then `@eq:loss` |
| a dollar sign | `\$`: `It costs \$5.` (a bare `$` starts a formula) |
| a table's caption | the line after the table: `Table: What it shows. {#tbl:results}`, then `@tbl:results` |
| a call-out | `:::note` (or `:::tip`, `:::caution`, `:::aside`), the text, then `:::` on a line of its own |
| code | a fenced block with its language; ```` ```python {4-5} ```` marks lines 4 and 5 |
| a note to yourself | `<!-- … -->`: it stays in the file and never reaches the page |
| a live figure | in an `index.mdx` post: `<LiveFigure name="sine" caption="…" />` and `sine.live.js` beside it |

In an `.mdx` post, write the braces of `{#fig:x}` with a backslash, `\{#fig:x\}` (MDX reads a bare brace as code).
The words in `![…]` are what a reader who cannot see the picture hears: write them for every picture and video.
Brackets that hold an `@` and do not read as a citation (two sources without a `;`, a key the `.bib` does not
have) stop the build with the file and the line.

## Add a picture

Put the file (`.jpg`, `.png`, `.webp`, `.gif`) in the post's folder and write `![…](./file.jpg "Caption.")`.
The build makes it in the widths the site's screens need, up to its own: on every screen it is checked on (a desk at
100% to 200%, the big-screen mode's steps among them, a tablet, a phone at 2x and 3x) the file a browser takes is at
least as wide as the picture is drawn there (a `srcset`, with the width it
takes on the page in `sizes`), in two forms: AVIF for the browsers that show it, and a fallback every browser shows
(JPEG for a photograph, WebP for the rest; a PNG, a GIF or pixel art lossless in both). Neither is visibly worse than
the file you gave: each is made at the lightest setting whose result stays within 42 dB PSNR and 0.98 SSIM of it in
every 32px square, measured once, by the first build that meets the picture on your machine, and kept in
`src/lib/image-choices.json`. Commit that file with the picture. The deploy never measures: a picture missing from
it stops the deploy, naming the picture, and `npm run images` on your machine adds it. A picture is never drawn larger than its own pixels, counted in the screen's device pixels
(a 437px picture stands 437 device pixels wide: 146 CSS px on a phone at 3x), but on see's wall, where every
photograph is its column's width and a file under 600px wide is drawn past its pixels ([DESIGN.md](DESIGN.md)).
The big-screen mode's larger places are in `sizes` as window sizes, so a window that large takes the mode's file
even where the mode stays off (Safari, a touch desktop, `?wide=off`): the picture is drawn at its plain size from more pixels, more bytes and the same look
(a cover at 2560 x 1440: a file for 1440px drawn at 960px). Large originals are fine. Videos
(`.mp4`, `.webm`) are copied as they are, so keep them small (under a few MB); the build reads their size from the
file, and stops, naming it, if it cannot.

## Cite

Put the post's sources in a BibTeX file beside it (Google Scholar, arXiv, ACL Anthology and DBLP all export
BibTeX) and name it in the front matter, `bibliography: ./refs.bib`. Cite with the entry's key: `[@chen2020]`.
Each source gets a number the first time it is cited; the card in the text and the list at the end come from the
file. A key the file does not have stops the build. "Cite this post" at the end is made from the title and the
date, or say it yourself:

```yaml
cite:
  text: "Lu, Z. (2022) ‘…’. arXiv."    # optional
  bibtex: |
    @article{lu2022brief, … }
```

## Preview and build

- `npm run dev` shows drafts and reloads as you write. (After changing anything in `src/plugins/`, or adding a
  new `.live.js`, restart it.) A draft's live-figure code stays out of the real site's files too.
- `npm run build` writes the real site into `dist/`; drafts are left out of it, and of the list, the feed and the
  sitemap. `npm run preview` serves `dist/` locally.
- `npm run images` builds the site with its pictures made afresh (their cache emptied first) and measures the forms
  of every picture `src/lib/image-choices.json` does not have yet (a new picture, a changed one, a new width; any
  local build measures the few it meets, this one is for many at once, on all the machine's threads): commit the
  file it writes with the pictures.
- `npm run check` runs `astro check`, builds afresh and checks the result (`scripts/check-dist.mjs`): every internal
  link and `#place`; every old address (see [The old addresses](#the-old-addresses)), and nothing built where
  another repository's site is served; every page's HTML (html-validate); the Content-Security-Policy (first in the
  head, and its hashes exactly the page's inline scripts'); the structured data (a Person on every page, his
  photograph a file of the site with the pixels its data says, a BlogPosting on a post, an Event on a talk, and on
  the home alone a ProfilePage about the Person and a WebSite with its name and canonical address, the name a search
  result shows above the site); the pictures (each in its two forms, AVIF in a `<source>` and its
  fallback in the `<img>`, with the same sizes and widest width, no file as heavy as a wider one, and on every screen
  the site is checked on the file Chrome takes at least as wide as the picture is drawn there); the feed, the
  sitemap, `robots.txt`, `CNAME` and `security.txt` (not expired); and that no draft is in the build.
  `.htmlvalidate.json` relaxes six rules, because the site uses them on purpose: inline `style` attributes (a
  figure's own size, KaTeX's layout), long titles, and four of Astro's own ways of writing HTML (trailing spaces,
  `<meta …>` without a slash, empty and boolean attributes).
- Publishing: pushing to `main` builds and deploys the site (`.github/workflows/deploy.yml`: `npm ci`, an audit of
  the packages the site runs on that fails on high or critical advisories, `npm run check`, then GitHub Pages).
  Pull requests to `main` are built and checked, never deployed.

### After a deploy

`bash scripts/verify-live.sh` (in Git Bash) checks the live site as a reader and a search engine meet it: every old
address answers as the new site means it to, with its own page or file or with a redirect page to its new place;
the doors, the feed, the sitemaps, `robots.txt` and `CNAME` answer; an unknown address, and each address let go, gets
the 404 page; `http://` goes to `https://`, and the other repositories' sites still answer at their addresses; and a
first look at each page's time to its first byte. It only reads (GET and HEAD requests), writes nothing anywhere,
and exits 0 when everything holds. GitHub's CDN keeps a page up to 10 minutes, so run it 10 minutes after the deploy
has finished, or again if a page still shows the old site. `bash scripts/verify-live.sh http://127.0.0.1:PORT`
checks a local copy of the build the same way (without HTTPS and the other repositories' addresses).

### The old addresses

Every address the old site answers (the live Jekyll site's sitemap, and the 2024 site's `/projects/<name>/` but the
one it had hidden, `/projects/central/`, which is let go) answers in the new one: with its own page or file at the
same address (the home, the blog and its posts, the PDFs under `/assets/`, the feed, the sitemap, `robots.txt`,
`CNAME`, the 404 page), or with a redirect page to its new place: at once, `noindex`, its canonical the new place,
one step and never a chain. The `/projects/<name>/` pages are `astro.config.mjs`'s `redirects`. The Jekyll site's
copies of the posts, `/_blog/<kind>/<date>-<slug>.html` (in its sitemap too), are the pages of `public/_blog/`, each
a redirect page that leads to its post by a relative address, so the preview copy's base keeps them. The old home's
sections (`/#software`, `/#publications`, `/#blog`, `/#courses`) are followed by the home's script
(`src/scripts/home/old-anchors.js`). `scripts/check-dist.mjs` holds the build to all of it (its `LEGACY` list, and
the old home's sections against that script's own), and checks that nothing is built where other repositories'
GitHub Pages sites are served on this domain (`/courses/`, `/teachings/`, `/artLife/`, `/python-notebook/`,
`/r-comput-viz/`, `/waycine/`), in any letter case. To move an old address, or keep another: change its redirect (in
`astro.config.mjs` or `public/_blog/`), check-dist's `LEGACY` list and `scripts/verify-live.sh`'s list together.

### Speed budget

The last step of `npm run check`, `scripts/check-budget.mjs`, adds up what each built page costs a reader who opens
it: its HTML, stylesheets, scripts (with every module they import), preloaded fonts and pictures, as four
screens take them (a phone, his screen and the big-screen mode's two), in bytes as GitHub Pages sends them and in requests. Nothing is timed, so it says the same on every
run. It names the page, the kind and the overrun when a page goes over its row of the `BUDGET` table at the top of
that file: a failure, in a local `npm run check` as in the deploy (`.github/workflows/deploy.yml`);
`ZL_BUDGET=warn` lists the overruns without failing, for work that is still moving a page. It always fails when a
page asks another origin for anything (the visitor stats' one tag aside: "Analytics", below), serves a picture wider
than its place can show, leaves a module it imports out of its preloads, or has no speculation rules hashed in its
CSP.

- A page that grew for a good reason (a new post with many pictures, a font the owner chose): raise its kind's
  numbers in `BUDGET`, about a tenth over the new size, and say why in the commit. Do not raise a row to make a
  mistake pass (a picture too large, a script left in).
- A picture is never made worse than its source to fit a budget: where a page is over for its picture's own
  detail, raise its row and say why beside it in the table.
- Before pushing: `ZL_BUDGET=strict npm run check` checks as the deploy will, pictures too: it measures no picture,
  so one whose choice `src/lib/image-choices.json` lacks fails here as it would there.

### Analytics

The visitor stats are Google Analytics 4, as on the old site, with the same measurement id, so the numbers carry on.
Search Console sees the site is his by its own HTML tag on the home (`analytics.verify`, set since 2026-10-21), not by
the GA tag: an account that can edit the GA property can no longer verify as an owner through it.

- What loads: Google's `gtag.js` from `www.googletagmanager.com`, set going by `src/scripts/ga.js`. Every page, the
  home too while `analytics.verify` is set, adds it itself once the page has loaded and the browser is idle, so it
  never holds up what a reader sees (race's map, a phone's first paint). With `analytics.verify` empty the home has
  the tag static in the head instead, as Search Console then looks for it (asked for at low priority). A page is counted once, when it is shown: one the browser made ready before a click and
  never showed is not counted, and one put back by Back is not counted again. A visit that leaves another page
  within its first second or two is not counted. No cookie banner, as before.
- What else counts as a page: GA4's own default for a web stream, "Page changes based on browser history events"
  (its enhanced measurement, under page views), counts a page view each time a page writes a new address of its own
  without loading another: see's viewer as it opens a photograph or steps to the next (`/see/<name>/`), race as it
  turns to another season (`/race/<year>/`), the blog's list as its topic or its search changes. To count only the
  pages opened, untick it in GA4 (Admin, Data streams, the site's stream, Enhanced measurement).
- Where it goes: the counts go to Google's collection hosts (`*.google-analytics.com`, `*.analytics.google.com`,
  `*.googletagmanager.com`). The Content-Security-Policy lets in those and the one script, nothing else
  (`src/integrations/csp.mjs`), and `npm run check` fails on any other origin. Google signals, if it is ever turned
  on in GA4, sends to Google's advertising hosts as well (`doubleclick.net`'s and `google.com`'s among them; Google's
  guide to a Content-Security-Policy for its tags lists them): the browser refuses those until they are added in
  `src/integrations/csp.mjs` (`GA_HOSTS`, the one list the policy's `img-src` and `connect-src` and `npm run check`
  all take them from).
- What it costs: `gtag.js` is about 165 KB compressed on a first visit (Google's file, cached by the browser for a
  while after), counted on its own line by the speed budget, not in the pages' numbers. No page loses anything
  measurable now; with `analytics.verify` empty, the home's static tag makes a phone's first paint about 70-80 ms
  later.
- The id: `analytics.ga4` in `content/site.yaml`. Change it there; take the `analytics:` block out and no page
  has it. The dev server and the LAN preview never load it.
- Search Console's own proof (`analytics.verify`, set since 2026-10-21): in Search Console, open Settings, then
  Ownership verification, then "HTML tag", and copy the `content="…"` of the tag it shows into `verify:`. The home
  then carries that tag instead of gtag.js's own, and loads gtag.js after it has loaded, as the other pages do. Once
  it is live, press Verify there. Left empty, the home's gtag.js tag is what proves the site is his, for every account
  that can edit the GA property.

### A preview copy

`npm run build:lan` builds the same site, drafts included, under another base address, into a folder outside this
repository that a web server on this machine serves, so a phone or another screen at home can look at it. Both
come from `lan.local.json` beside `package.json`, a file of this machine's own that git ignores; copy
`lan.example.json` to it and set them:

```json
{ "base": "/preview/v3/", "out": "../preview/v3", "url": "http://this-machine.local/preview/v3/" }
```

`base` is the address's path, `out` the folder (from this repository), `url` where to look (only for the message
at the end). `ZL_LAN_BASE` and `ZL_LAN_OUT` in the environment do the same. The build clears that folder and
nothing else, and only if it is outside the repository and empty or a copy it wrote before.

## Where things are

```
content/            everything written (Where the content lives, above)
src/content.config.ts   the shape of the posts and of site.yaml
src/schemas/        the shape of build, teach, see, race and home, read and checked by their pages (its README.md)
src/pages/          the addresses: / (index), /build/, /teach/, /see/ and /see/<name>/, /blog/ and /blog/<slug>/,
                    /race/ and /race/<year>/ (race/[...season]), 404, /feed.xml, /og/<slug>.png (social cards),
                    /build/<name>.webp (a card's film)
src/layouts/        Base.astro: every page's frame (the head, the header, the ring, the footer); Home.astro: the home's
src/components/     DocHead (the head every page opens with: the CSP first, the light's script, then Head: title,
                    description, cards, structured data), Header, Fader, Footer, Ring, TitleBlock, Article, Frame
                    (a picture frame), PixelWord, LiveFigure, SignLink
src/plugins/        the Markdown dialect (remark-dialect.mjs, rehype-article.mjs), code (rehype-code.mjs), BibTeX
src/lib/            site.ts (the person, addresses, dates), media.ts and video-size.mjs (videos), picture.mjs
                    (pictures' widths), picture-forms.mjs, picture-encode.mjs, likeness(-core).mjs and image-service.mjs
                    (their two forms, each no worse than its source; image-choices.json, the step each file is made
                    at), signs.ts (the links' pixel signs), drafts.mjs
src/scripts/        the browser's part: site.js (every page's: the frame, the footer's next race), early.js (the light,
                    before the first paint), today.js (the site's today), lettering/ (the pixel words), fader, frames,
                    hub, esc, header (focus kept clear of the header), blog-list, article, live, and each page's own:
                    home/, build/, teach/, see/ (its viewer's paper and hand in view.js), race/ (the season map;
                    next.js, the next race), notfound/
src/styles/         tokens.css (paper, ink, accent per light), frame.css (every page), and one sheet a page
src/integrations/   post-media.mjs (videos and gifs beside their posts), csp.mjs (the Content-Security-Policy's rules),
                    picture-sources.mjs (a post picture's AVIF <source>)
public/             CNAME, robots.txt, icons, manifest, social card, .well-known/security.txt, the old site's
                    PDFs at their old addresses (/assets/docs/publications/, /assets/images/…), and _blog/ (the
                    Jekyll site's addresses of the posts, as redirect pages: The old addresses)
scripts/            new-post (and its template), build-lan, images (measures new pictures' forms), check-dist,
                    check-budget, make-icons (redraws the icons and the card), verify-live.sh (the live site,
                    read after a deploy)
```

The pixel lettering for a page's own script: `import { drawWord } from '../scripts/lettering/index.js'` and
`drawWord('race', { size: 36, ui: true })` gives a canvas of the word, 36 CSS px tall at 100%, fitted to the
screen's device pixels and repainted when the light changes (`size` is its nominal height; the door set,
`set: 'door'`, is 23 rows). `components/PixelWord.astro` writes the same word as an SVG for the server.

## Security

Every built page carries a Content-Security-Policy in a `<meta>` (GitHub Pages sends no headers of ours), the
first element of its head after the charset, so it governs everything after it (`components/DocHead.astro` writes
it for every page, the home's too; `integrations/csp.mjs` has its rules): everything from this site only (but the
visitor stats' one script and their hosts, on the real site's pages: Analytics, above), scripts as files (two inline
blocks are allowed, each by its hash, and no other hash is listed: the script that sets the light before the first
paint, and the speculation rules, which the browser reads and never runs; a page's data for its own script, as the
footer's races, is a JSON block, which never runs either), no `eval`, no frames, no forms, no plugins; style
attributes are allowed (KaTeX's layout and a figure's own size need them), inline style elements are not (every
stylesheet is a file). `npm run dev` writes its own styles into the page, so the policy is in the built site only.
External links open without the referrer.
`/.well-known/security.txt` (`public/.well-known/`) says how to report a problem. It expires on 2027-10-15: renew
it before then by moving its `Expires` line on (a year, say). Once that day has passed, `npm run check` fails on it,
and so does every deploy, until it is renewed.
