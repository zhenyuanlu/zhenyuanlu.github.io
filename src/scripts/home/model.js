// The home's data model, pure (the server's renderHomeParts and the browser's mountHome read the same): the data in
// the draft's shapes made whole (the name and its syllables, the sentence, the social marks, the mottos, the five
// doors, the cities, the footer), dates by calendar day, and race's grey line, what comes next (the draft's raceOf).
//
// data (every field optional but the doors and the cities; content/home and content/site.yaml give them):
//   name      { text, syllables: [{ text, py, hz }], hanzi, said, label, suffix } or the name as a string. The
//             syllables are what the name splits into in hand (the draft: zhen · yuan · lu), a space before the last;
//             said is what a screen reader hears as it opens (else their pinyin and the hanzi); label the name's
//             button (else the name, with ", <suffix>"); suffix the small grey word after it ("phd": drawn in
//             lowercase, as the letters are)
//   sentence  the line under the name; its last word keeps the point the line leaves from
//   social    [{ label, href, mark, me }]: shown are those with a mark (github, linkedin, twitter, instagram; from
//             the label where none is given: GitHub, LinkedIn, X or Twitter, Instagram), rel="me" unless me is false
//   mottos    { top: { text }, bottom: { text, by } }: under the marks; at the right of the footer
//   doors     [{ id, word, href, what, next }] x 5: build, teach, see, blog, race (the line is drawn for five);
//             word the lettered word (else id), what its grey line (or line, content/home/doors.yaml's own), next
//             race's address while it names a race (its href when not given). src/schemas/home.ts toDoorsShape's
//             { art, word, href, what } is taken as it is
//   cities    [{ id, name, memory, img: { bw, co } }]: id names the art (art.js); memory the line shown in hand;
//             img the plain icons a reader without script sees (the draft's ../assets/cities/*.png); or bw and
//             color beside the rest, as src/schemas/home.ts toCitiesShape gives them
//   races     { seasons: { '2026': [{ id, name, short, tiny, date, end, results }] } }: race's grey line
//   today     a Date or 'YYYY-MM-DD' (taken at noon): which race is next; the day it is, when not given
//   footer    { from, to, by }: "© from–to · Designed by <by>, made with ♥ and Claude"
//   blink     false: the traveller never blinks (content/site.yaml's home.blink); renderHomeParts writes it on the home
//             (main.flow data-blink="off"), where mountHome reads it
import { nextRace } from '../race/next.js';

export var DAY = 864e5, SOON = 21;
export var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* a date: a Date, or 'YYYY-MM-DD' at its noon; anything else is now */
export function dateOf(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { var d = new Date(v + 'T12:00:00'); return isNaN(d.getTime()) ? null : d; }
  return new Date();
}
/* a race's day: 'YYYY-MM-DD' at local noon (as every race date and ?today= are) */
export function dayOf(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], m[2] - 1, +m[3], 12) : null; }
/* Oct 8–11, Nov 8, Jun 30–Jul 2 */
export function span(a, b) {
  var s = MON[a.getMonth()] + ' ' + a.getDate();
  if (!b || +b === +a) return s;
  return s + '\u2013' + (b.getMonth() === a.getMonth() ? '' : MON[b.getMonth()] + ' ') + b.getDate();
}

/* race's grey line: a race under way ("now: Hyrox Boston"), else the next one ahead in the data, however far ("next:
   B.A.A. Half · Nov 8"), by ?today= or the date. (The owner, 2026-10-13, 26 days before the B.A.A. Half: the line
   named the next race only within SOON days, so the home said "latest: Hyrox Boston · finisher" while the race page
   said "next · in 26 days", and he took it for stale data. The home says what the inner pages say.) doors e2: by
   calendar days, as the inner pages say it: today is its noon (as ?today= and every race date are), a race is under
   way from its first day through its last, the race named is the earliest not yet over, and the days are whole
   calendar days, so the clock change of Nov 1 does not make a race's last day the day after. The race named is
   the race page's #next and the footer's "next:" (race/next.js nextRace: one rule for the three). Round 7
   (2026-10-11): with none ahead, the latest one run within SOON days and what came of it ("latest: Hyrox Boston ·
   finisher"), in the line's grey and with no dot (the red is for what is to come or under way); then its own line
   ("on water, on land"), no dot. races: { seasons }; t: today (a Date). { now, o } | { past, o } | null */
export function raceOf(races, t) {
  var S = (races && races.seasons) || {}, last = null;
  if (!t) return null;
  function oOf(r0, a0, b0) { return { a: a0, b: b0, nm: r0.short || r0.name, tiny: r0.tiny || r0.short || r0.name, id: r0.id, res: r0.results || [] }; }
  var nx = nextRace(races, t);
  if (nx) return { now: nx.now, o: oOf(nx.race, nx.a, nx.b) };   /* under way, or ahead: however far */
  var today = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12);
  function days(a, b) { return Math.round((b - a) / DAY); }   /* noon to noon: whole days, an hour either way */
  Object.keys(S).forEach(function (y) {
    S[y].forEach(function (r0) {
      var a0 = dayOf(r0.date), b0 = dayOf(r0.end) || a0;
      if (!a0) return;   /* no date */
      if (days(b0, today) > 0 && (!last || b0 > last.b)) last = oOf(r0, a0, b0);   /* over: the latest of those */
    });
  });
  return last && days(last.b, today) <= SOON ? { past: true, o: last } : null;
}
/* (what came of a race, in a word: a finisher's medal, else its best place on the podium, else a heat qualified) */
export function raceCame(res) {
  var p = 9, q = false, f = false;
  res.forEach(function (x) { if (x.finisher) f = true; else if (x.qualified) q = true; else if (x.place && x.place < p) p = x.place; });
  return f ? 'finisher' : p <= 3 ? ['1st', '2nd', '3rd'][p - 1] : q ? 'qualified' : '';
}
export function raceText(R, tiny) {
  var nm = tiny ? R.o.tiny : R.o.nm, came = R.past ? raceCame(R.o.res) : '';
  if (R.past) return 'latest: ' + nm + (came ? ' \u00b7 ' + came : '');
  return R.now ? 'now: ' + nm : 'next: ' + nm + ' \u00b7 ' + span(R.o.a, R.o.b);
}
/* the races as the home reads them (raceOf, raceCame): each race's id, names, days and results, by season. The page
   gives the browser these (pages/index.astro, #home-races) and nothing more of a race: its place, crews and notes
   are the race page's */
export var RACE_KEYS = ['id', 'name', 'short', 'tiny', 'date', 'end', 'results'];
export function homeRaces(races) {
  var S = (races && races.seasons) || {}, out = {};
  Object.keys(S).forEach(function (y) {
    out[y] = S[y].map(function (r) {
      var o = {};
      RACE_KEYS.forEach(function (k) { if (r[k] != null) o[k] = r[k]; });
      return o;
    });
  });
  return { seasons: out };
}

/* ---------- the data made whole ---------- */
var MARKS = { github: 'github', linkedin: 'linkedin', x: 'twitter', twitter: 'twitter', instagram: 'instagram' };
function str(v) { return v == null ? '' : String(v); }
export function homeData(d) {
  d = d || {};
  var n = typeof d.name === 'string' ? { text: d.name } : d.name || {};
  var syl = (n.syllables && n.syllables.length ? n.syllables : str(n.text).split(/\s+/).filter(Boolean).map(function (w) { return { text: w }; }))
    .map(function (s) { return { text: str(s.text).toLowerCase(), py: str(s.py), hz: str(s.hz) }; });
  /* (the name as the syllables write it: a space before the last, the draft's "zhenyuan lu") */
  var word = syl.length > 1 ? syl.slice(0, -1).map(function (s) { return s.text; }).join('') + ' ' + syl[syl.length - 1].text : syl.length ? syl[0].text : '';
  var text = str(n.text) || word;
  var suf0 = str(n.suffix != null ? n.suffix : d.suffix), suffix = suf0.toLowerCase();
  var said = n.said != null ? str(n.said) : syl.map(function (s) { return s.py || s.text; }).join(' ') + (n.hanzi ? '; in Chinese ' + n.hanzi : '');
  var label = n.label != null ? str(n.label) : text + (suf0 ? ', ' + suf0 : '');
  var mot = d.mottos || {};
  return {
    name: { text: text, syllables: syl, suffix: suffix, said: said, label: label, hanzi: str(n.hanzi) },
    sentence: str(d.sentence),
    /* what Northeastern wrote about him: the line under the sentence (none: no line) */
    featured: (function (f) {
      var pages = f && f.pages ? f.pages.map(function (p) { return { label: str(p.label), href: str(p.href) }; })
        .filter(function (p) { return p.label && p.href; }) : [];
      return pages.length && f.lead ? { lead: str(f.lead), pages: pages } : null;
    })(d.featured),
    social: (d.social || []).map(function (s) {
      var mark = s.mark || MARKS[str(s.label).toLowerCase()] || '';
      return { label: str(s.label), href: str(s.href), mark: mark, me: s.me !== false };
    }).filter(function (s) { return s.mark && s.href; }),
    mottos: { top: mot.top && mot.top.text ? { text: str(mot.top.text), by: str(mot.top.by) } : null,
      bottom: mot.bottom && mot.bottom.text ? { text: str(mot.bottom.text), by: str(mot.bottom.by) } : null },
    doors: (d.doors || []).map(function (o) {
      var id = str(o.id || o.art || o.word), race = id === 'race' || !!o.next;
      return { id: id, word: str(o.word || id), href: str(o.href), what: str(o.what != null ? o.what : o.line), race: race, next: race ? str(o.next || o.href) : '' };
    }),
    cities: (d.cities || []).map(function (c) {
      var bw = c.img ? c.img.bw : c.bw, co = c.img ? c.img.co : c.color || c.co;
      return { id: str(c.id), name: str(c.name), memory: str(c.memory || c.mem), img: bw && co ? { bw: str(bw), co: str(co) } : null };
    }),
    races: d.races || null,
    today: d.today,
    footer: d.footer || null,
    blink: d.blink !== false
  };
}
