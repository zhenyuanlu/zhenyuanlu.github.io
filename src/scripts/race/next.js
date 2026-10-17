// The next race, whichever season's file it is in: the earliest race not yet over by today's calendar day. One rule
// for every place that names it: the race page's #next and its red line (address.js, client.js, model.js), the
// footer's "next:" on every other page (scripts/site.js, components/Footer.astro), and the home's race door and its
// line (scripts/home/model.js raceOf). (The draft looked in the newest season alone, inner.js nextRace and season():
// with next year's file added in the autumn, "next" skipped a race of this year still to come; its home's door
// looked in every season, and so named a race its own #/race/next did not open.)
// Calendar days: today (Boston's, scripts/today.js) and every race date are taken at local noon, so a race is under
// way from the morning of its first day through its last, and the days to it do not gain one across a clock change
// (Nov 1). A race known only by its months (2026-05/06) is never next. Pure and small: no DOM, nothing of the race
// engine; the build and every page's footer share it.
//
// nextRace(races, today) -> { race, season, a, b, now, days } or null
//   races   content/race in the draft's shape, { seasons: { '2026': [race, ...], '2025': [...] } }
//   today   a Date (its calendar day counts); none (null) -> null
//   race    the race itself; season its file's year ('2026'); a and b its first and last day (noon); now true while
//           it is under way; days the calendar days to its first day (0 on it, less on the days after it)
// footerNext(races, today) -> the footer's words beside "Hello from Boston" (the draft's frame, inner.js footer()),
//   from three weeks before the next race and while it is under way: { now, lead, long, tiny, id, season }, as
//   "next: " + "B.A.A. Half, Nov 8" (a phone: "B.A.A. Half"), "now: " + "Hyrox Boston"; else null
// footerData(races, from) -> what the footer carries to the browser (components/Footer.astro): the races not yet over
//   on the day from ('YYYY-MM-DD', the build's in Boston; a visitor's today is never before it), each its days and
//   the names the footer shows, by season; nothing else of a race
import { dayOf } from '../today.js';

export var DAY = 864e5, SOON = 21;
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Oct 8-11, Nov 8, Jun 30-Jul 2, an en dash between (the frame's V1K.span) */
export function span(a, b) {
  var s = MON[a.getMonth()] + ' ' + a.getDate();
  if (!b || +b === +a) return s;
  return s + '–' + (b.getMonth() === a.getMonth() ? '' : MON[b.getMonth()] + ' ') + b.getDate();
}
export function nextRace(races, today) {
  var S = (races && races.seasons) || {}, best = null;
  if (!(today instanceof Date) || isNaN(today.getTime())) return null;
  var t = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  /* (the seasons oldest first, each in its file's order: of two races on one day, the first) */
  Object.keys(S).sort().forEach(function (y) {
    if (!Array.isArray(S[y])) return;
    S[y].forEach(function (r) {
      var a = dayOf(r && r.date), b = dayOf(r && r.end) || a;
      if (!a || +b < +t) return;
      if (!best || +a < +best.a) best = { race: r, season: y, a: a, b: b };
    });
  });
  if (best) { best.now = +t >= +best.a; best.days = Math.round((best.a - t) / DAY); }
  return best;
}
export function footerNext(races, today) {
  var nx = nextRace(races, today);
  if (!nx || !(nx.now || nx.days <= SOON)) return null;
  var r = nx.race, nm = r.short || r.name;
  return { now: nx.now, lead: nx.now ? 'now: ' : 'next: ', long: nm + (nx.now ? '' : ', ' + span(nx.a, nx.b)), tiny: r.tiny || nm, id: r.id, season: nx.season };
}
export function footerData(races, from) {
  var S = (races && races.seasons) || {}, out = {};
  Object.keys(S).sort().forEach(function (y) {
    if (!Array.isArray(S[y])) return;
    var list = S[y].filter(function (r) { return dayOf(r.date) && (r.end || r.date) >= from; }).map(function (r) {
      var nm = r.short || r.name, o = { date: r.date };
      if (r.end) o.end = r.end;
      o.short = nm;
      if (r.tiny && r.tiny !== nm) o.tiny = r.tiny;
      return o;
    });
    if (list.length) out[y] = list;
  });
  return { seasons: out };
}
