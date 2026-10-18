# DESIGN.md -- zhenyuanlu.com

> The site's design. It follows draft v2t, which applied the taste round of 2026-10-16, and the owner's standing rules,
> which win over any taste item. Some parts are still being built in that round: the door pages' parts (build's index,
> its Scholar link, see and race), the frame's focus lines and the footer's type. When this file and the code
> disagree, the code is the place to look first, and this file is corrected in the same change.
>
> The format follows the taste review's item 5:
> - an atmosphere paragraph;
> - one line per token, `**Name** (--var; day, dusk, night) -- role`;
> - rules as `**Rule:** sentence (value)`;
> - the test viewports;
> - a closing Rejected list that names the round.

## Atmosphere

Quiet and orderly, like a clean sheet of paper.

- **Lettering:** the name, the page words and the words on the doors are hand-drawn pixel letters. Each cell is a whole
  number of device pixels, so they are hard-edged and never soft on any screen.
- **Drawings:** the small pictures of cities, doors, books, races and each post's chapters use the same pixels.
- **The home:** everything is on one screen. There is the name and one plain sentence. A road joins the five doors
  (build · teach · see · blog · race) and five cities that mean something to him.
- **Light:** a fader at the top right takes the whole site from day to dusk to night. Paper, ink and drawings change
  colour together.
- **Inner pages:** they stand in a centred 960px frame on twelve columns. Besides the pixel lettering, all text and
  every control is set in Figtree, a quiet sans.
- **Photographs:** they are his own. They have no frames, no text on them and no tint.
- **Motion:** at rest only the heart in the footer beats and the home's walker blinks now and then. Everything else
  moves only in hand, and briefly. Reduced motion stills all of it.

## Light: the fader and its three stages

**Rule:** the fader runs 0 to 100. Day is 0-33, dusk 34-66 and night 67-100. Day to dusk is one continuous blend,
smoothstepped over 0-50. Dusk then deepens a touch up to 66. Dusk to night is the only cut: paper, surface and ink
crossfade for 200 ms (linear) (`:root.xf`).

**Rule:** the light is set before the first paint, by the one inline script whose hash the CSP carries
(`src/scripts/early.js`). The order is the saved position (`localStorage['zl-fade']`), then the system's dark (100),
then the visitor's clock:
- day 06:30-16:59;
- dusk 17:00-18:59, rising from 34 to 66;
- dawn 05:30-06:29, shown as 50;
- night otherwise.

**Rule:** a page never changes its light on its own once it is drawn. Only the fader, or another tab moving it,
changes it.

**Rule:** the phone's browser bar takes the paper's colour at every fader position: the light's script keeps
`<meta name="theme-color">` equal to `--bg`, and makes the tag when the page has none.

**Rule:** a reader without script gets day, or night if the system is dark. These are the static values in
`src/styles/tokens.css`, `--surface` included.

## Colour tokens

Colours go only through role tokens. A component never writes a raw hex. The exceptions are the pixel drawings' own
palettes (cities, doors, books, race scenes, the fader's sun and moon), which are art and not roles.

The dusk values are at 50. At 66 the paper and the surface deepen once more (they are given in brackets).

- **Paper** (--bg; #fcfcfa, #f3ece3 [#eee5da], #131418) -- the page's ground. By day it is near-white, at dusk a warm
  cream (the hour's light, not the brand), at night a cool black. theme-color follows it.
- **Surface** (--surface; #f1f1ee, #e9e1d6 [#e4dace], #1e1f24) -- one tone step off the paper: about 3.8 L* darker
  by day and at dusk, 5.5 L* lighter at night. It is the ground of every panel:
  - footnote and citation cards;
  - code;
  - the folded contents;
  - the share menu;
  - call-outs;
  - the index table's odd rows and the year bar;
  - a picture's place before it loads;
  - the tone that marks a focused mark or control.
- **Ink** (--ink; #1b1b1b, #1d1a18, #e8e6e1) -- text and titles. It is also the outline of every pixel word and
  pixel drawing.
- **Muted** (--muted = --grey; #666666, #675d55, #8f9096) -- dates, tags, table heads, captions, references and
  labels. It sets the secondary order by a softer ink at the same weight, never by a smaller size.
- **Line** (--line; #6b6b6b, #a8733f, #8f8f8f) -- the home's road (amber at dusk), the 404's road, the header's
  faint rule once the page is under it, and the section rules (at 50%). Dusk's #a8733f holds 3:1 against dusk's
  deepest paper.
- **Accent** (--accent; #a65412, #96490d, #f0a860) -- a burnt orange. It has one job: a clickable word in running text
  (links, citation and footnote marks, the DOI, build's Scholar link). Build's and a post's action links take it in
  hand. The selection may also use it.
- **Now** (--now = --red; #c8352b in every stage) -- only for what is happening now:
  - this term's course;
  - today and the next race on race's timeline;
  - the footer's heart.

  Its hue (about 4°) is kept well away from the accent's (about 27°).
- **Plate** (--plate; #ffffff) -- the white a picture stands on at night (it is not dimmed; see Photographs).

**Rule:** the day-to-dusk blend mixes each token separately: paper, surface, ink, grey, line and accent.

### Contrast

**Rule:** text holds 4.5:1 and a graphic 3:1, on the paper and on the surface, at fader positions 0, 25, 50, 66 and
100. Running text aims at 7:1. Where it falls short (quotations, asides and call-out labels are grey at about 5:1)
the check warns and does not fail.

| Position | Grey on paper / surface | Accent on paper / surface | Line on paper | Ink on surface |
| --- | --- | --- | --- | --- |
| 0 day | 5.59 / 5.07 | 5.24 / 4.76 | 5.19 | 15.2 |
| 25 | 5.50 / 4.98 | 5.36 / 4.85 | 4.28 | 14.2 |
| 50 dusk | 5.47 / 4.95 | 5.50 / 4.98 | 3.45 | 13.4 |
| 66 dusk, deepest | 5.15 / 4.65 | 5.18 / 4.67 | 3.25 | 12.5 |
| 100 night | 5.78 / 5.17 | 9.18 / 8.20 | 5.69 | 13.2 |

**Rule:** at dusk the ink is switched, not blended through grey. Dusk's ink is its own (#1d1a18) from 34 to 66.

**Rule:** a separator in a caption (see's "|") is the grey itself, never a fraction of it.

## Type

**Families:**
- **Figtree** 400 and 500, served from the site, for all text and every control.
- **Arrows** (← → ↑) are drawn, not set (`src/lib/arrows.mjs`): Figtree has no ← or →, and each system draws its own,
  so the site draws one. Each is a small SVG the size and colour of its line's letters, hidden from screen readers.
- Code uses the system monospace stack.
- Formulas use KaTeX's fonts, set at build time.
- The hanzi under the name use Noto Serif SC, else the system's serif.

**Rule:** at most six font sizes on a page (the article uses five), and steps far enough apart to read as steps.
Nothing is under 13px.

**The exceptions:**
- A race map under 1000px wide keeps its key and months at 11px, and its place names too on a phone's map (race's
  stacked layout). Between 700 and 999px wide, where the map stands beside the column as on a desk, the names keep
  12px (11px on a crowded map): at 11px, 778 × 777 at 125% lost its map from 640 × 464 to 352 × 256. At 13px, and at
  12px, a phone's names leave the map, cross its roads and cut a row off (race's audit at 360 × 740 and 375 × 812).
- A small desktop race map's cards (a map under 600px tall, `.r-cmp`) keep 11px, their venue 12px. At 13px they found
  no place by their venues and went to the column (the fit sweep, 2026-10-16: 8 cards at 815 × 818, where the map fell
  from 740 × 530 to 492 × 354; one at 768 × 1024, 785 × 1095, 805 × 830, 863 × 1107 and 1090 × 704).
- Under 1000px race's season counts keep v2ac's one row, their words at 12px (11px on a phone). From 1000px they stand
  as a figure track, two rows of two, each figure right-aligned in its column (taste item 41, a "try"). Under 1000px
  the track's taller box cost the map: at 751 × 676 the counts lay on its roads, and at 778 × 777 (125%) the map fell
  from 640 × 464 to 464 × 336, with 7 cards in the column (the fit sweep, 2026-10-16).
- Race's timeline under 1000px keeps its club names at 11px, with its months: at 13px they run past a 390px screen
  (the phone round's audit, 2026-10-17).
- The home's five city names, and a city's memory with them, keep 13px down to 360px wide (9.5px apart there). Under
  360px the floor yields to their spacing, as on race's phone map: 12px, and 11px under 340 (at 13px they close to
  5.7px at 340 and 1.8px at 320). This is draft v2t's rule, measured again on the site (the phone round, 2026-10-17).
- The lateral-flow post's title is 107 characters and is kept whole. At its size it takes three lines on a desk and
  four on a phone, past the line budget of two and three.
- Code in the words of an article's table, caption or aside is .84em of their 15px on a desk: 12.6px, under the floor.
  A phone sets it at 13px; the desk keeps it as it is until a round that may change the desk.

**The scale.** Desk is 1000px and wider. Phone is under 1000px.

| Desk | Phone | Job |
| --- | --- | --- |
| 42 / 48 | 31 / 36 | an article's title, up to 60 characters |
| 30 / 38 | 24 / 31 | a title over 60 characters: one step down, two lines on a desk (a phone under 375px wide 22 / 29, under 360 20 / 26: three lines down to 320) |
| 22 / 30 | 20 / 28 | an article's h2; the dek under the title (22 / 31, phone 20 / 28) |
| 18 / 30 | 17 / 28 | an article's text (632px, about 75 characters a line); h3-h5 |
| 18 / 26-28 | 17 / 25-26 | a page's lede; the ring of doors; the blog list's titles; build's featured title; older and newer |
| 16 / 24 | 16 / 24 | build's and teach's entries (shelf names, courses, books, the index table) |
| 15 / 23 | 15 / 23 | what is small in a text: captions, cards, code, tables, references, the foot's parts and its titles on a desk (15 / 22, 500), asides (15 / 24), the list's description (15 / 22); the header's arrow; the skip link |
| 13 / 20 | 13 / 20 | the small words: dates, tags, table heads, the byline, the rail, labels, see's captions, the footer, the code's head, a footnote's number, the home's door words and footer, race's map words, key, months and counts (see the exceptions) |

The home has its own three: 17, 14 and 13, and on a phone 16 and 13.

**Rule:** a heading never hyphenates. A list title and an article's headings are balanced, so that no single word
stands alone on the last line.

**Rule:** the space above a heading is at least twice the space under it. An h2 has 64px of space and 26px of
padding above, and 10px below (on a phone 52 + 20 above).

**Rule:** figures are tabular wherever they line up (`.num`):
- dates;
- years;
- race's counts;
- reading time;
- references' numbers.

**Rule:** curly quotes and apostrophes; an en dash between two years; a no-break space between a figure and its
unit (42.2 km, 10 min). This is all done at build time:
- the Markdown goes through smartypants;
- `.bib` fields get the same pass (`src/plugins/bibtex.mjs` typeset);
- the reading time's "min" is joined to its number.

**Rule:** the pixel lettering is drawn, not set. Its cell is 2px (an inner page's word uses 1.99, so a half rounds
down), always in whole device pixels. A control's word is the same size at every screen scale from 100% to 175%.

**Rule:** these are one size and in one place on every screen:
- the fader;
- the header's name;
- an inner page's title;
- the footer;
- the tags.

## Spacing and grid

**Rule:** the desk frame is a centred 960px (`--cw: min(960px, 100vw - 64px)`). It has 12 columns of 58px with
24px gutters: 12 × 58 + 11 × 24 = 960.

**Rule:** an article takes 8 columns, 632px, for its head and text. The 9th column is air, and the contents' rail
takes the last 3 (222px). The byline and the foot use all twelve. On an inner page the label column is 3 (222px) and
the body 9 (714px). There are two or three alignment lines a page.

**Rule:** under 1000px there is one column. It is 20px from each edge, with a 16px gutter, and at most 520px wide.
The label moves above its content.

**Rule:** a big screen gets a wider frame, not bigger controls. This is the big-screen mode, on at launch on every
page. From a window of 1800 × 968 CSS px the frame is 1080px wide; from 2000 × 1075 it is 1200px, from 2200 × 1183
1320px and from 2400 × 1290 1440px. The home, race and the 404 page grow with the frame. A reading page (build,
teach, see, the blog, an article, a photograph's page) widens its twelve columns and sets its text one small step
larger: 1.0625×, and 1.125× from 2200 × 1183. An article keeps its 632px measure. The header, the footer, the fader,
the page's pixel word, the tags and the link rows stay as they are at 960, and no picture grows past its device
pixels. The mode is off where nothing can hover (a phone, a tablet), in Safari, in print and with `?wide=off`
(`src/scripts/early.js`, `src/scripts/wide.js`, `src/styles/wide.css`).

**The vertical steps:**
- **Header:** 61px (47px on a phone, 41px under 375px).
- **Title block:** 40px from the header (13px on a phone).
- **Sections:** 96px apart (64px on a phone). After a page's title there is 56px (40px on a phone).
- **Doors before and after:** 120px above (80px on a phone).
- **Footer:** 32px above, 48px below. On a desk it is one line at every width from 1000px and at every scale; between
  1000 and 1023px, where the column is under 960px, who made it is set .005em closer to keep that line at 150%.
- **Article:** its text starts 40px after the head (28px on a phone), with 18px between paragraphs (16px). Figures
  have 32px around them. The foot starts 72px after the text, 44px under its hairline, and its parts are 40px apart
  (on a phone 56px after the text and 48px apart).
- **Blog list:** rows are 48px apart (40px on a phone).

## Shape and lines

**Rule:** corners are square. The one exception is a cover: the two corners away from its words are rounded, 10px
(`--pf-r`).

**Rule:** there are no shadows and no gradients.

**Rule:** a panel is one tone step (`--surface`), with no hairline round it. A panel is never put inside a panel.

**Rule:** no box marks a chosen or focused thing. A chosen topic, filter or tab is a deeper tone with ink words (a
chosen topic: 16% ink). Keyboard focus is a line, a tone or the dots, never an outline round the thing.

**Rule:** 1px lines are kept for a few uses only:
- the section rule over an article's h2 (Distill's way; the line at 50%);
- the two lines round the byline, and the one over the foot;
- the header's faint rule once the page is under it (30%);
- the roads.

A data table has no rules: its rows alternate by a tone step. In forced colours every panel gets a 1px CanvasText
border.

## Pixel art, signs and the one motif

**Rule:** there is one graphic language: one pixel scale, one palette per drawing, one outline rule, three levels of
detail, and light as flat tone steps. A drawing that reads as a placeholder icon at its full size is unfinished.

**Rule:** a pixel picture is never scaled in motion. In hand it moves by 1px or changes colour.

**Rule:** the whole device pixel is the site's one motif, and it is carried into the small things:
- **Signs:** link signs are 9 × 9 cells, in the word's colour. Their cell is a whole number of device pixels, and
  each sign starts on one.
- **Heart:** the footer's heart is 7 × 6 cells, with a 9 × 8 beat. Its cells are whole device pixels from the first
  paint (the head's script sets them, with the frame's grid), so nothing in the footer moves when the page's script
  runs.
- **Chapter pictures:** each article chapter after the first opens with the post's own small pixel picture, drawn from
  its subject, in grey, with a 2px cell. It stands with its foot on the section's rule. The rows are the post's
  front matter (`motif`). A post without them gets three dots; a talk gets a speech bubble.
- **Index marks:** each work in build's year bar has a 2 × 2 mark.

**Rule:** a pixel picture is drawn by the server as an SVG of whole cells. That is what a reader without script sees.
The page's script puts a canvas of whole device pixels in its place. The picture's box keeps the drawing's height,
so a canvas a little taller at 125% or 175% grows into the air above it and nothing below moves.

## Photographs and pictures

**Rule:** no frames, no text on a photograph and no tint. A caption gives the title, place and year, or nothing.

**Rule (the owner's):** a photograph's text alternative is its title. It is empty where the title is already the same
link's visible text. There are no descriptions.

**Rule (the owner's):** no picture is ever drawn past its device pixels. It stays sharp, even when that makes it
smaller on a high-density screen (his choice "B"). On a phone an article's picture is held to the file the browser
took (Chrome may take the narrower of two near its need, at 320 and 340px wide and held sideways), once that file is
known (`src/scripts/article.js`).

**Rule (the owner's):** pictures show their whole height, and nothing is lost against the source. The see wall keeps
every photograph whole, even the one that is not 2:3, 3:2 or 1:1.

**Rule:** before it loads, an article's picture holds its place in the surface. See's wall and the frames keep v2t's
placeholders, not the surface: a frame is the paper (a white plate at night), and a photograph's place on the wall
is the paper with a 3% breath of its own colour. Width and height are always set. Only the page's main
picture asks for high priority (`fetchpriority="high"`, an article's cover), and none above the fold is lazy.

**Rule:** a picture comes in the widths a screen may ask for, up to its own file's width, and never larger
(`src/lib/picture.mjs`).

**Rule:** at night a photograph or figure is untouched. It stands on the white plate (`--plate`) with no dimming.
By day and at dusk a cover is multiplied into the paper.

**Rule:** a moving cover plays only while its row is in hand. A live figure plays only when asked. Reduced motion
shows the still.

**Rule:** a picture frame (a cover, build's shelf and featured work) never stays a blank plate. Without script it
shows its picture as tall as the frame, from its rest. A mark is held small and whole, and a picture that must not be
cut is shown whole. If the page's script runs but the frames' never does (a module blocked or failed), each frame
shows its picture the same way after 3 s. Frames laid out in time never do, so nothing moves as a page opens.
A frame's picture is asked for as the frame comes near the window, except in the first view (build's featured
figure, the blog's first four rows), which has its picture from the first style. A waiting picture comes in at once
without script, and with the 3 s fallback when the frames' script fails.

## Long-form: the article

**The head:**
- the way back, "← blog" in the door lettering (a talk's way back goes to build);
- the title (one step down past 60 characters) and the dek.

**The byline:** it sits between two hairlines on the frame's twelve columns, as Distill's does. Small grey labels
(13px) stand over their values:
- authors, in columns 1-2;
- affiliations, in 3-4, a line each, level with its author, when any author has one (a talk's place stands there when
  none has);
- published, in 5-6, with "updated" as a second line;
- the DOI (front matter `doi`) or else the reading time, in 7-8;
- topics, as the list's tags, in 9-11;
- share, in 12.

On a phone it takes two columns: authors beside their affiliations, the day beside the DOI or the reading time, then
the topics and share.

**The contents:** a rail in the last three columns that marks the section being read, in ink with the home's 5px
point. It ends with the text. On a phone it is a folded "Contents" panel.

**The text:**
- 632px at 18 / 30, three widths beyond the measure (wide, full, window);
- figures numbered and centred, never past their own pixels;
- formulas in their own box, which scrolls sideways when a formula is longer (a phone first sets a long one smaller,
  never under 15px);
- code on a surface with a 13px head (language and "copy");
- call-outs as a surface with a small grey label.

**Rule:** a link in running text keeps a 1px underline at rest, set .18em under the letters in half its own colour.
In hand the word and its line take the ink, and keyboard focus makes the line 2px. No underline is ever added on
hover. Citation and footnote marks are never underlined, at rest or in hand. A heading's own mark and the ways back
are not underlined either.

**Rule:** a footnote or citation card grows from its mark: opacity and a 4px slide, 240 ms, ease-out. It appears at
once under reduced motion.

**The foot** is a band of its own after the text, under a hairline across the frame (Distill's appendix). On a desk
each part's title (15px, 500, ink) stands in columns 1-2 and its content in 3-10. On a phone the titles stand over
their parts. In order:
- the author's own end sections, such as acknowledgements: a block `:::appendix Title` in the Markdown, written
  anywhere and set here;
- footnotes, each with its way back;
- references, each with its way back;
- updates (front matter `updates: [{date, note}]`);
- "Cite this post" (BibTeX, with the DOI when there is one).

Older is at the left and newer at the right.

**Rule:** a post's page carries Google Scholar's tags: `citation_title`, each `citation_author`,
`citation_publication_date`, and `citation_doi` and `citation_pdf_url` where the post has them, plus one
`citation_reference` for each source it cites.

**Rule:** a printed article is black on white. Each link's address follows it, and the pages are numbered
("3 / 7", bottom right).

## Links, focus and selection

**Rule:** outside running text a link is ink or grey, and in hand it brightens. Build's and a post's action links
are ink at rest and the accent in hand. A link in words outside the text is underlined at rest in the accent, like
build's "All papers on Google Scholar" and the byline's DOI.

**Rule:** keyboard focus is never a box:
- a link: its line, 2px in running text;
- a button or summary: a line under it;
- a row: the home's point;
- a mark or a scrolling box: a tone of the surface under it;
- a chosen-capable tag: a 2px line along its foot.

**Rule:** the selection is the accent at 26%.

**Rule:** in hand means a pointer resting, so only a screen that can hover has it (`@media (hover: hover)`, every
mouse and trackpad). A touch browser keeps `:hover` on the last thing tapped, which then looked still chosen or still
in hand; there a tap leaves the look at rest, and the keyboard's focus and every state (chosen, open, pressed, copied,
current) keep their own. Where nothing can hover, a tap draws no box of the browser's either (no tap highlight)
(the phone round, 2026-10-17).

**Rule:** on a touch phone a target is at least 24px each way (WCAG 2.5.8) and aims at 44px: a padding its margin takes
back, so nothing it stands among moves. A row that opens one page opens it from anywhere on the row (the blog list,
build's talks and index), and its tags and links keep their own taps. One costs room: race's dock, under a phone's map,
writes a venue's sports and a sport's races as lines a finger pins, each at least 24px tall; at 320 × 568 the held dock
is then 9px taller: 2025's map a step smaller (243 × 174, against 256 × 184), and the current season's page 13px further
past the window (19px, against 6).

**Rule:** on a touch phone see's viewer is a step of its own in the history: the phone's Back (iOS's swipe from the
left edge) closes it and stays on the wall; a photograph's page steps to the one before or after in its own place,
so Back leaves the photographs at once. A desk, and a window under 1000px in a mouse's hand, keep the history as it
was: the wall's viewer one entry that follows the photograph, a photograph's page an entry a step.

**Rule:** no CV link and no email address on any page. An article's "share by email" opens the reader's own mail
and shows no address. The home's four profile marks stay: GitHub, LinkedIn, X and Instagram.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| **Press** (--t-press) | 140 ms, `steps(2)` for an arrow | a button pressed; an arrow's 3-4px step toward where it leads |
| **Hover** (--t-hover) | 180 ms | a link's or a word's colour in hand, the point beside a row, a card on race's map |
| **Interface** (--t-ui) | 240 ms | a menu, a footnote or citation card |
| **Ease** (--ease-out) | `cubic-bezier(.22, 1, .36, 1)` | every transition above; never ease-in |

**Rule:** all motion is inside `prefers-reduced-motion: no-preference`, so the reduced state is the finished state.
Colour and opacity may still change. Travel, scale and loops go. A net under every inner page
(`src/styles/tokens.css`) sets each transition to colour and opacity only, and each animation to one run of zero
length.

**Rule:** nothing moves at rest but two things: the footer's heart, which goes lub-dub once every 1.2 s, in steps, not
fades, and the home's walker, who blinks now and then while he stands (`content/site.yaml`, `home.blink`; not in a
hidden tab). Both are still under reduced motion. Everything else moves only in hand: a cover plays while the
pointer is on it. (The owner lifted this rule on 2026-10-16 and brought it back on 2026-10-17, "规则不取消了，恢复",
keeping the blink.) The red "now" mark never pulses.

**Rule:** a few timings are the owner's own and are not on the tokens:
- the home's doors (the word inks in .05 s and fades in .15 s);
- the name's split (.2 s and .26 s);
- the cut from dusk to night (200 ms);
- a cover's travel in hand (1.5 s);
- see's wall appearing as it comes into view (1.2 s, 1 s and .8 s, one after another);
- the page-to-page cross-fade (`@view-transition`, .15 s).

**Rule:** in hand nothing lifts. see's photographs do not rise, and their caption takes the ink instead. Teach's
books do not jump.

## Test viewports

- every round: 1440 × 900 and 390 × 844;
- laptops: 1366 × 768, and 1366 × 540 (short, which gives race's tight layout);
- scales: 1536 × 864 at 125%, 1707 × 1067 at 150%, 2194 × 1100 and 2560 × 1440 at 175% (his screen);
- phones: 360 × 740, 375 × 812, 390 × 844, 430 × 932 (3×), touch-emulated; narrow: 340 × 740 and 320 × 640; held
  sideways: 844 × 390 and 750 × 340; the browser's own windows (bars shown): 360 × 672, 375 × 635, 390 × 664;
  tablet: 768 × 1024;
- each at fader 0, 25, 50, 66 and 100, and once with reduced motion.

## Checks

**Rule:** every must-have has a check that fails. `check-taste` runs on every built page, by its real address, at the
sizes and stages above. It checks:
- the number of sizes;
- the 13px floor;
- contrast at every fader position;
- covered text;
- line budgets and measure;
- the fonts that really painted;
- motion, normal and reduced;
- sideways overflow;
- broken images;
- default link colours;
- theme-color;
- console errors.

Its exceptions are kept, and they are warnings only:
- race under 1000px (the map's key, months and names at 11 or 12px, the season counts at 12 or 11px, the timeline's
  club names at 11px), and the small desktop race map's cards (11px, their venue 12px);
- the home's city names under 360px wide (12px, 11px under 340);
- a desk's code in an article's table, caption or aside (12.6px);
- running text under 7:1;
- the beating heart;
- a formula's own scroller;
- the lateral-flow post's title lines.

## Rejected

Layout and structure:
- a formal, severe academic layout (first concepts, 2026-09-28);
- busy decoration with many elements (round 1, expressive, 2026-09-28);
- an about page (v1k inner pages, 2026-10-05);
- a header that competes with the page's word, or door names in the header (v1k's two inner-page reviews, 2026-10-05);
- mentors' names (inner pages and doors, 2026-10-05);
- a regular photo grid (v1k's second review, 2026-10-05);
- photo numbers and topic counts (v1k inner pages, 2026-10-05);
- a blog of big covers, like project pages (after v2a's fifth look, 2026-10-09);
- the whole site scaled up on big screens, and a large fader (round 7, 2026-10-11);
- layout D, stretched across the full width (wide-screen prototypes, 2026-10-12);
- the "blog" word and a motto over an article (v2ac review, 2026-10-15).

Type and lines:
- an underline under the name (v1c, 2026-10-01);
- outlined serif lettering (v1e, 2026-10-01);
- vector type that only imitates pixels, such as Pixelify Sans (v1f, 2026-10-01);
- an underline that appears under the pointer, anywhere (v1h, 2026-10-02; again in v1k's inner pages, 2026-10-05);
- the words "post" and "write-up" (round 7, 2026-10-11);
- a large inner page title (round 7, 2026-10-11);
- a rule over the footer, and an empty band under race's timeline (v2a race, third look, 2026-10-06);
- a box round a chosen or focused thing (the taste round, 2026-10-16).

Colour and light:
- rain (v1d, 2026-10-01);
- street lamps (v1e, 2026-10-01);
- door pictures on white plates (v1e, 2026-10-01);
- the traveller turned white at night (v1g, 2026-10-02);
- many colours, rays and twinkling in the fader's glyphs (v1h, 2026-10-02);
- an accent that follows the season (r14, 2026-10-15).

Motion and interaction:
- pixel pictures fading in slowly (v1c, 2026-10-01);
- a red line popping up under the pointer (door option E, 2026-10-06);
- club names unfolding under the pointer (v2a's fifth look, 2026-10-07);
- a scene taking a still picture's place, which reads as a stutter (v2a's fourth look, 2026-10-07);
- pictures moving in two directions (round 7, 2026-10-11);
- pictures following the pointer (v2ab's second look, 2026-10-11);
- a book that jumps under the pointer (v2ac review, 2026-10-15).

Pixel art and content:
- years under the cities (v1e, 2026-10-01);
- large food drawings (v1f, 2026-10-01);
- things hanging in the plane tree (v1h, 2026-10-02);
- a ten-seat dragon boat's head, and a race list (v1l, 2026-10-05);
- trees along the road (v1l race, 2026-10-05);
- four timelines, three clubs and an axis (v2a race, third look, 2026-10-06);
- a sled push with arms too long, twice (v2a race, third look, 2026-10-06);
- highways knotted around New York (v2a's fourth look, 2026-10-07);
- books drawn open (v2ab's second look, 2026-10-11);
- a dragon head that reads as a bird (v2ac review, 2026-10-15).

From the taste review itself, not borrowed:
- a minimum of moving elements, and scroll or load entrances;
- four or more photographs and "full" screens;
- a call-to-action on the first screen;
- bans on hairlines, monospace and numbering;
- full-width colour fields and viewport-sized type;
- a random direction or dials;
- cropping a photograph to a shape (it would cut his picture's height).
