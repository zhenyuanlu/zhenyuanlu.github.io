// The race page's addresses, the site's own (the draft's #/race/... forms are not kept): a season's page is /race/
// for the current season and /race/<year>/ for every other; what is pinned on it comes after the #: a race by its
// id (#hyrox-boston), a venue by its name (#boston) and one of its sports after that (#boston/hyrox), or the next
// race, whichever it is and whichever season it is in (#next: the home's race door and the footer's "next:",
// next.js). Nothing pinned, nothing after the #.
//
// The current season is the newest season that has begun by the build's day (its year, in Boston): the build
// decides it, so the page, its canonical address, the sitemap and the script always agree. The day the page is
// shown for (Boston's, scripts/today.js) decides only what is run and what is next (the engine's today). Should a new year come before the next build with
// its season's file already there, the season just ended stays at /race/ until then, and the new one is a click
// away, at its own /race/<year>/, which every build writes for every season but the current one.
//
// Pure: the race page's build (src/pages/race/[...season].astro) and its script in the browser (client.js) share it.
import { nextRace } from './next.js';

/** the seasons that have races, newest first (the engine's own order: model.js yearsOf) */
export function seasonsOf(races) {
  var S = (races && races.seasons) || {};
  return Object.keys(S).filter(function (y) { return Array.isArray(S[y]) && S[y].length; }).sort().reverse();
}
/** the current season: the newest that has begun by that year (a number or 'YYYY'); the oldest, where all are later */
export function currentOf(years, year) {
  var n = +year, ok = years.filter(function (y) { return +y <= n; });
  return ok.length ? ok[0] : years[years.length - 1] || null;
}
/** a season's page, under the site's base ('/' or the LAN copy's own) */
export function pathOf(base, y, current) {
  return String(base || '/').replace(/\/?$/, '/') + 'race/' + (y === current ? '' : y + '/');
}
/** the engine's address (opts.address: '', '/2025', '/hyrox-boston', '/2025/hartford', '/boston/hyrox') as what follows
    the # on its season's page: the season itself is the page's path */
export function fragmentOf(p, season) {
  var parts = String(p || '').split('/').filter(Boolean);
  if (parts.length && parts[0] === String(season)) parts.shift();
  return parts.join('/');
}
/** a race's season, by its id (ids are unique across the seasons: content/race) */
export function seasonOfRace(races, id) {
  var S = (races && races.seasons) || {}, years = seasonsOf(races);
  for (var i = 0; i < years.length; i++) if (S[years[i]].some(function (r) { return r.id === id; })) return years[i];
  return null;
}
/* the fragment, as written: decoded, without its # and the slashes round it */
function fragOf(hash) {
  var h = String(hash || '').replace(/^#/, '');
  try { h = decodeURIComponent(h); } catch (e) { /* (a broken escape: as it is) */ }
  return h.replace(/^\/+|\/+$/g, '');
}
/** what an address names: { season, sub }, the season its path names (the current one at /race/) and what to pin in
    it, for mountRace (opts.season, opts.sub) and its go(). At /race/, which names no season, a race's id names its own
    (an address shared one season names the race the next one too), and #next the next race's own (next.js: the
    earliest not yet over on the day o.today, whichever season it is in; the newest season where none is). A fragment
    that names an element of the page (own(f): the skip link's #ip) is the browser's, not the page's: nothing pinned
    for it. o: { base, races, current, own, today } */
export function readAddress(pathname, hash, o) {
  var years = seasonsOf(o.races), base = String(o.base || '/').replace(/\/?$/, '/'), path = String(pathname || '');
  var m = path.indexOf(base + 'race/') === 0 ? /^(\d{4})(?:\/(?:index\.html)?)?$/.exec(path.slice(base.length + 5)) : null;
  var named = !!(m && years.indexOf(m[1]) >= 0), season = named ? m[1] : o.current;
  var sub = fragOf(hash);
  if (sub && o.own && o.own(sub)) sub = '';
  if (!named && sub && sub.indexOf('/') < 0) {
    if (sub === 'next') { var nx = nextRace(o.races, o.today); season = (nx && years.indexOf(nx.season) >= 0 ? nx.season : years[0]) || season; }
    else season = seasonOfRace(o.races, sub) || season;
  }
  return { season: season, sub: sub, named: named };
}
