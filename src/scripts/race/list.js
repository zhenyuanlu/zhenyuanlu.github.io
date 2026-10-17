// A season's races as plain HTML (renderRaceList), printed by the race page at build time: what a reader without
// script and a search engine get, under the page's title. The engine hides it while the map is up (it carries
// data-race-static) and keeps its own list for screen readers. The same words as the engine's (model.js): each race
// its date, name, place, crews, and, once run, its result and medals; a club's time with it. And the same races as
// structured data (raceEvents): a schema.org SportsEvent each, with its day, its place, its sport, him (or the crew
// he raced in) and the same words. Pure: no DOM, so the Astro page imports this file alone in its frontmatter
// (index.js needs a browser).
//
// renderRaceList(races, season, { today }) -> HTML: races is content/race in the draft's shape, season '2026' (the
// newest when not given), today a Date or 'YYYY-MM-DD' (what counts as run: the build's own day by default). Each
// race's item carries its id, so /race/#<id> lands on it without script too (with script the engine pins it).
// raceEvents(races, season, { today, page, person }) -> [SportsEvent]: page the season page's canonical address
// (each race is page#<id>), person the JSON-LD node that names him ({ '@id', '@type', name }).
// footerNext(races, today) -> the footer's "next: ..." words, or null: next.js's (the footer's, every inner page's).
import { createModel } from './model.js';
import { esc as E } from './util.js';

function dateOf(v) {
  if (v instanceof Date) return v;
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? new Date(+m[1], m[2] - 1, +m[3], 12) : new Date();
}
/* a race's date for <time datetime>: its day, or its first month where only its months are known */
function stamp(R) {
  var s = String(R.r.date || ''), m = /^(\d{4})-(\d{2})/.exec(s);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : m ? m[1] + '-' + m[2] : '';
}
function seasonOf(M, season) { return season && M.SEAS[season] ? String(season) : M.LATEST; }
/* what is said of a race after its date, name and place: its result, its medals, its crews, its leg of the medley,
   or that it is still to come */
function moreOf(M, R) {
  var done = M.done(R), res = done ? M.resultWords(R, true).split(' · ').join('; ') : '', md = M.medalWords(R.md || []), cr = M.crewsOf(R);
  return [res ? res.charAt(0).toUpperCase() + res.slice(1) : '', md, cr.length ? 'With ' + cr.map(M.crewSay).join(' and ') : '', M.medleyWords(R).replace(' · ', ', '), done ? '' : 'To come'].filter(Boolean);
}
export function renderRaceList(races, season, opts) {
  var M = createModel(races || {}, dateOf(opts && opts.today)), y = seasonOf(M, season);
  if (!y) return '';
  var id = 'r-static-' + E(y), list = M.racesOf(y), clubs = M.clubRows(y);
  var h = '<section class="r-static" data-race-static aria-labelledby="' + id + '"><h2 id="' + id + '">The ' + E(y) + ' season</h2><ol>';
  list.forEach(function (R) {
    var dt = stamp(R), more = moreOf(M, R);
    h += '<li data-race="' + E(R.r.id || '') + '"' + (R.r.id ? ' id="' + E(R.r.id) + '"' : '') + '>' + (dt ? '<time datetime="' + dt + '">' + E(R.w.long) + '</time>' : '<span>' + E(R.w.long) + '</span>') +
      ' · <strong>' + E(R.r.name) + '</strong>' + (R.r.place ? ' · ' + E(R.r.place) : '') +
      (more.length ? '<br>' + E(more.join('. ') + '.') : '') + '</li>';
  });
  h += '</ol>';
  if (clubs.length) h += '<p>' + E('Clubs: ' + clubs.map(function (k) { return (k.c.long || k.c.name) + ' from ' + M.clubWhen(k); }).join('; ') + '.') + '</p>';
  return h + '</section>';
}
/* the footer's words beside "Hello from Boston" (the draft's frame, inner.js footer()): next.js's, which the footer's
   own script (scripts/site.js) reads for the visitor's day */
export { footerNext } from './next.js';
/* (schema.org's words for the sports: content/race's sport) */
var SPORT_NAME = { run: 'Running', hyrox: 'Hyrox', dragonboat: 'Dragon boat racing' };
export function raceEvents(races, season, opts) {
  var o = opts || {}, M = createModel(races || {}, dateOf(o.today)), y = seasonOf(M, season), page = String(o.page || '');
  if (!y) return [];
  return M.racesOf(y).map(function (R) {
    var r = R.r, dt = stamp(R), at = page + '#' + r.id, more = moreOf(M, R), crews = M.crewsOf(R);
    var ev = { '@type': 'SportsEvent', '@id': at, name: r.name, url: at, sport: SPORT_NAME[r.sport] || r.sport };
    if (dt) ev.startDate = dt;
    if (r.end) ev.endDate = r.end;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) ev.endDate = dt;
    ev.eventStatus = 'https://schema.org/EventScheduled';
    ev.eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode';
    ev.location = { '@type': 'Place', name: r.place, address: r.place };
    if (typeof r.lat === 'number' && typeof r.lon === 'number') ev.location.geo = { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lon };
    /* he raced it: alone, or in a crew (a team he was an athlete of) */
    if (o.person) ev.competitor = crews.length ? crews.map(function (c) { return { '@type': 'SportsTeam', name: c.name, athlete: o.person }; }) : o.person;
    if (more.length) ev.description = more.join('. ') + '.';
    return ev;
  });
}
