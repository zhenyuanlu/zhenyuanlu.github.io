// The site's today: Boston's calendar day, for every page that says what is now, next or running ("now", "next",
// "in N days" on race, the home's race door, every page's footer, "teaching now" on teach). He lives there: a race is
// under way on its day in Boston, wherever the visitor is (by the visitor's own day a race was "now" in China from
// noon the day before, Boston's time). The build takes the same day (pages/index.astro, race/[...season].astro,
// components/Footer.astro). One override for checks: ?today=YYYY-MM-DD, strictly so (a day in the calendar, nothing
// after it); any other ?today= is not heard. Pure and small: every page's footer reads it.
//   bostonDay(d)        a moment's calendar day in Boston, 'YYYY-MM-DD' (the build runs in UTC: at 1am UTC on January
//                       1st Boston is still in the old year)
//   dayOf(s)            'YYYY-MM-DD' as a Date at local noon (a calendar day, as every race date is taken), or null
//                       where it is no day in the calendar
//   todayOf(search, now) the day a page is shown for, a Date at local noon: the ?today= of the address (search,
//                       location.search) where it names a day, else Boston's day at now (the moment it is)
const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });

export function bostonDay(d) {
  var p = FMT.formatToParts(d), v = function (t) { return (p.filter(function (x) { return x.type === t; })[0] || {}).value; };
  return v('year') + '-' + v('month') + '-' + v('day');
}
export function dayOf(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  var d = new Date(+m[1], m[2] - 1, +m[3], 12);
  return d.getFullYear() === +m[1] && d.getMonth() === m[2] - 1 && d.getDate() === +m[3] ? d : null;
}
export function todayOf(search, now) {
  var asked = dayOf(new URLSearchParams(search || '').get('today') || '');
  return asked || dayOf(bostonDay(now || new Date()));
}
