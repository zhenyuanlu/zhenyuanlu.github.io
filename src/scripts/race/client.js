// The race page in the browser (src/pages/race/[...season].astro): the engine (index.js, mountRace) over what the
// page printed, its data from the page itself (#race-data), and the page's own addresses (address.js): what the
// address names is opened, what is shown is written back, Back and Forward are followed.
//   the switch to another season       a new entry in the history: /race/ and /race/2025/ are two pages
//   a race or a venue pinned, let go   the same entry, replaced: /race/#hyrox-boston, /race/#boston/run, /race/
//   Back, Forward, a fragment followed (a link to /race/#next on this page)   shown as the address now says
// The day the page is shown for is Boston's (scripts/today.js), or ?today=YYYY-MM-DD where the address names one
// (checks): what is run, what is next, and what #next opens.
// The frame first (scripts/site.js, which every page's foot loads too: the frame on the device grid, the header,
// the lettering, the fader): the map is laid out on the frame as it stands, as the draft laid it out after its
// frame. A module is run once, so the foot's own import of it then finds it run. (Run after the engine, the frame
// moved the column by a fraction of a device pixel at 150% and 175% under a map already snapped to the grid.)
import '../site.js';
import { zoom } from '../wide.js';   /* (the big-screen mode's engine, null where it is off: the map grows as one composition) */
import { mountRace } from './index.js';
import { fragmentOf, pathOf, readAddress } from './address.js';
import { todayOf } from '../today.js';

const box = document.getElementById('race-data');
const main = document.getElementById('ip');
let D = null;
if (box && main) {
  try { D = JSON.parse(box.textContent || ''); } catch (e) { console.error('race: the page’s data does not read', e); }
}
if (D && D.races) start(D);

function start(D) {
  const base = box.getAttribute('data-base') || '/', current = box.getAttribute('data-current'), built = box.getAttribute('data-season');
  const today = todayOf(location.search);
  /* (a fragment that names an element of the page is the browser's own, the skip link's #ip: no race's; the list the
     server printed names each race by its id too (list.js), for a reader without script, and those are the page's.
     #next is the next race on the day the page is shown for, as the engine's own next is: next.js) */
  const own = (f) => { const e = document.getElementById(f); return !!e && !e.closest('[data-race-static]'); };
  const read = () => readAddress(location.pathname, location.hash, { base, races: D.races, current, own, today });
  /* the document's title for a season: the build's words for each (D.labels), then what the head put after this
     page's own (" · Zhenyuan Lu") */
  const labels = D.labels || {}, title0 = document.title;
  const tail = labels[built] && title0.indexOf(labels[built]) === 0 ? title0.slice(labels[built].length) : '';
  const titleOf = (y) => (labels[y] ? labels[y] + tail : title0);
  const A = read();
  let shown = A.season, followed = location.href;
  /* what is shown, written as the address: its season's page, what is pinned after the #; a new entry only where
     the season changed and the address did not change it first (the reader's own switch) */
  function write(p, info) {
    const season = (info && info.season) || shown, frag = fragmentOf(p, season);
    const url = pathOf(base, season, current) + location.search + (frag ? '#' + frag : '');
    const push = season !== shown;
    shown = season;
    if (document.title !== titleOf(season)) document.title = titleOf(season);
    if (url !== location.pathname + location.search + location.hash) {
      try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) { /* a sandbox */ }
    }
    followed = location.href;
  }
  const handle = mountRace(main, D.races, { season: A.season, sub: A.sub, today, address: write, zoom });
  /* the address changed under the page: shown as it says, at once (a fragment followed fires popstate, then
     hashchange: the second finds it followed). The skip link's #ip is the browser's: the page stays as it is */
  function follow() {
    if (location.href === followed) return;
    followed = location.href;
    let f = location.hash.replace(/^#/, '');
    try { f = decodeURIComponent(f); } catch (e) { /* as it is */ }
    if (f && own(f)) return;
    const B = read();
    shown = B.season;
    handle.go(B.season, B.sub);
  }
  addEventListener('popstate', follow);
  addEventListener('hashchange', follow);
}
