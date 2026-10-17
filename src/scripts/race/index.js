// The race page's engine: the season map of the draft (design/assets/v2ac/race.js, round 14) as modules, one
// concern each:
//   model.js     the data model: a season's races, venues and sports, the next race, results, medals, clubs, words
//   list.js      the season as plain HTML, printed at build time for readers without script (renderRaceList)
//   layout.js    the placing, pure: the grid, the map's cells, each venue's row and scene, the cards' places
//   render.js    the map drawn on its canvas, and the medals beside words
//   cards.js     the cards, the names and their leaders, the medals' key and the left column
//   timeline.js  the timeline and the clubs row
//   scenes.js    the pixel scenes and the little figure
//   fit.js       the page fitted to one screen
//   input.js     hover, focus, touch and keys: preview and pin
//   page.js      a season's page: its elements and its laying out in order
//   consts.js, util.js, colour.js, art.js   the tables and the pure helpers they share
//   geo.json, acts.json                     the engine's own art: the map's geometry, the pixel scenes
// Its pixel lettering (the title, the counts) is the site's own, scripts/lettering/.
//
// mountRace(root, races, opts) -> { go(season, sub), season(), destroy() }
//   root    the element the page stands in (the race page's <main>). Elements in it marked data-race-static (the
//           list renderRaceList printed, the server's own title) are hidden while the map is up, and shown again
//           by destroy().
//   races   content/race in the draft's shape: { seasons: { '2026': [race, ...], '2025': [...] }, clubs: [...],
//           medley }
//   opts    season   the season shown first ('2025'); the newest when not given (for 'next', the next race's own)
//           sub      what the address names in it, as the draft's #/race/<sub>: a race's id, 'next', a venue's
//                    slug and one of its sports ('boston/run'); nothing pinned when not given
//           today    a Date, or 'YYYY-MM-DD' (taken at noon): its calendar day says what is run and what is next
//                    (next.js: the earliest race not yet over, of every season)
//           stage    () => 'day' | 'dusk' | 'night'; html[data-stage] when not given
//           tokens   () => { ink, grey, bg, line }, the stage's colours; the root's custom properties when not given
//           reduced  a boolean or () => boolean: reduced motion (he arrives at once, the scenes hold still); the
//                    reader's prefers-reduced-motion when not given
//           pan      false: nothing moves by itself at all, as under reduced motion (the site's ?pan=off)
//           on       (name, fn) => off: the frame's 'stage' and 'resize' (the latter after the frame has laid itself
//                    out again); the site's hub (scripts/hub.js) when not given
//           address  (path, { season }) => void: told the address of what is shown, the part after the draft's
//                    #/race ('' or '/2025' for a season, '/<race id>', '/boston/run', '/2025/hartford'), and the
//                    season shown (a race's id alone does not name it); the address is left alone when not given.
//                    The race page (src/pages/race/[...season].astro, scripts/race/client.js) writes it as its own:
//                    /race/ or /race/<year>/, what is pinned after the # (scripts/race/address.js)
//           below    () => px: what the frame keeps under the page (its ring and footer); measured as the draft did
//                    (.ring, .close, footer.if in #inner) when not given
//           zoom     the big-screen engine (phase 5; the draft's window.__zoom); the plain page when not given
//           geo, acts  other art (tests); geo.json and acts.json when not given
//   go       (season, sub): show what an address names now, as opts.season and opts.sub name it (Back, Forward)
//   season   () => the season shown
// Nothing is left behind by destroy(): no listener on the document or the window, no timer, no frame asked for;
// the season pages it made (a page per season shown, kept for the season switch) go with it.
import { on as hubOn, reduced as hubReduced, tok as hubTok } from '../hub.js';
import GEO from './geo.json';
import ACTS from './acts.json';
import { asked, yearsOf, ymd } from './model.js';
import { nextRace } from './next.js';
import { makePage } from './page.js';

export { renderRaceList } from './list.js';

function dateOf(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { var d = new Date(v + 'T12:00:00'); return isNaN(d.getTime()) ? null : d; }
  return new Date();
}

export function mountRace(root, races, opts) {
  opts = opts || {};
  races = races || {};
  var today = dateOf(opts.today), dead = false, shown = null, kept = {}, red = opts.reduced;
  var host = {
    races: races, assets: { geo: opts.geo || GEO, acts: opts.acts || ACTS },
    tok: opts.tokens || hubTok,
    stage: opts.stage || function () { return document.documentElement.getAttribute('data-stage') || 'day'; },
    still: function () { return opts.pan === false || (typeof red === 'function' ? !!red() : red != null ? !!red : hubReduced()); },
    on: opts.on || hubOn, address: opts.address || null, zoom: opts.zoom || null, belowOf: opts.below || null,
    /* a season's page made already for this day and these races (the draft's KEPT, here the mount's own) */
    kept: function (y, day) { var I = y ? kept[y] : null; return I && I.day === day && I.data === races ? I : null; },
    keep: function (y, I) { kept[y] = I; },
    shown: function (J) { shown = J; }
  };
  /* (what the server printed for readers without script: out of sight while the map is up; shown again, at once,
     when the map goes: race.css .r-back ends its wait) */
  var statics = [].slice.call(root.querySelectorAll('[data-race-static]')).filter(function (e) { return !e.hidden; });
  statics.forEach(function (e) { e.hidden = true; });
  function unhide() { statics.forEach(function (e) { e.hidden = false; e.classList.add('r-back'); }); }
  /* (the map that could not be made, as it is made or as it lands (a canvas with no drawing context, a throw in the
     placing): every season's page made so far let go of, the half-made one taken off, what the server printed put
     back; the mount is let go of, and what it was asked after does nothing) */
  host.fail = function (e) {
    if (dead) return;
    dead = true;
    prepDrop(); clearTimeout(prepT);
    console.error('race: the map could not be made; the season stays as the page printed it', e);
    var pages = Object.keys(kept).map(function (y) { return kept[y]; });
    if (shown && pages.indexOf(shown) < 0) pages.push(shown);
    pages.forEach(function (I) { try { I.destroy(); } catch (x) { /* (half made: taken off below) */ } });
    kept = {}; shown = null;
    [].slice.call(root.querySelectorAll('.r-sea')).forEach(function (el) { el.remove(); });
    unhide();
  };
  /* (#/race/next with no season named: the next race's own season, next.js) */
  var SEAS = races.seasons || {}, YEARS = yearsOf(SEAS), DKEY = ymd(today), sub = [opts.season, opts.sub].filter(Boolean).join('/');
  var NXY = (nextRace(races, today) || {}).season || null;
  try { shown = makePage(root, { sub: sub, today: today }, asked(SEAS, YEARS, sub, NXY), DKEY, host); } catch (e) { host.fail(e); }

  /* ---- the other season made ready out of sight (the speed round, 2026-10-16) ----
     The switch to a season not yet shown made its page there and then: one task of 0.15 to 0.6s on a phone four times
     slower (2026: 0.6s), the press unanswered meanwhile. Once the season shown is up, painted and at rest, its
     neighbour in the switch is made in a box where the page shown stands, out of sight (page.js ctx.prep: the same
     sheet, the same width, the same place on the page, so it is measured and laid out as it will be shown), a few ms
     at a time in the browser's idle moments: a step is begun only where what it says it takes (its "yield 4", times
     the most this machine has yet been slower than a step said; a step that says nothing, 1ms) fits in what is left
     of the moment, 8ms at most, or, a step longer than that, at the head of a moment the browser says is whole; none
     while a pointer is down, none between his event and the frame that answers it, and none for 300ms after it (a
     second tap or key, which mostly follows within that, finds nothing running). Not drawn there (page.js):
     the switch draws it as it puts it up. The switch then puts it up as it
     puts up a season it kept. Dropped (and begun again later) where the window, the screen's scale or the type
     change under it, or another season is put up; the switch pressed before it is made makes the season as ever. */
  var prep = null, prepDown = false, prepOwed = false, prepRaf = 0, prepT = 0, prepF = 1, prepLast = -1e9, PREP_SLICE = 8, PREP_QUIET = 300;
  var HEAR = ['pointerdown', 'pointerup', 'pointercancel', 'keydown', 'wheel', 'touchstart', 'scroll'];
  var idle = window.requestIdleCallback ? function (f) { return requestIdleCallback(f, { timeout: 2000 }); } : function (f) { return setTimeout(function () { f({ timeRemaining: function () { return PREP_SLICE; }, didTimeout: false }); }, 50); };
  var unidle = window.cancelIdleCallback ? cancelIdleCallback : clearTimeout;
  function prepKey() { return [window.innerWidth, window.innerHeight, document.documentElement.clientWidth, window.devicePixelRatio || 1, document.fonts ? document.fonts.status : ''].join('|'); }
  /* (the season to make: the switch's neighbour of the one shown, not kept already) */
  function prepWhich() {
    if (!shown || YEARS.length < 2) return null;
    var i = YEARS.indexOf(shown.year);
    return [YEARS[i + 1], YEARS[i - 1]].filter(function (y) { return y && !host.kept(y, DKEY); })[0] || null;
  }
  /* (his event: a pointer down until it is up; any other, until the frame that answers it) */
  function prepHear(e) {
    if (e.type === 'pointerdown' || e.type === 'touchstart') prepDown = true;
    else if (e.type === 'pointerup' || e.type === 'pointercancel') prepDown = false;
    prepOwed = true; prepLast = performance.now();
    if (!prepRaf) prepRaf = requestAnimationFrame(function () { prepRaf = 0; prepOwed = false; if (prep && !prepDown && !prep.idle && !prep.t) prep.idle = idle(prepSlice); });
  }
  function prepLater(ms) {
    clearTimeout(prepT);
    prepT = setTimeout(function () {
      prepT = 0;
      if (dead || prep || !shown || !prepWhich()) return;
      if (document.prerendering) { document.addEventListener('prerenderingchange', function () { prepLater(400); }, { once: true }); return; }
      if (!shown.ready || document.readyState !== 'complete' || document.hidden || (document.fonts && document.fonts.status !== 'loaded')) { prepLater(400); return; }
      /* (the map up and its first frames painted: two frames, then an idle moment) */
      requestAnimationFrame(function () { requestAnimationFrame(function () { idle(prepStart); }); });
    }, ms);
  }
  function prepStart() {
    var y = prepWhich(), cur = root.querySelector(':scope > .r-sea');
    if (dead || prep || !y || !cur || !shown.ready) return;
    var cs = getComputedStyle(cur), r = cur.getBoundingClientRect(), ml = parseFloat(cs.marginLeft) || 0, mt = parseFloat(cs.marginTop) || 0;
    var box = document.createElement('div');
    box.className = 'r-prep';
    box.setAttribute('aria-hidden', 'true');
    box.inert = true;
    box.style.cssText = 'position:absolute;left:0;top:0;width:' + (r.width + ml + (parseFloat(cs.marginRight) || 0)) + 'px;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
    root.appendChild(box);
    /* (the box where the page shown stands, its margins round it, whatever box it is placed in) */
    var b = box.getBoundingClientRect();
    box.style.left = (r.left - ml - b.left) + 'px'; box.style.top = (r.top - mt - b.top) + 'px';
    var J = null;
    try { J = makePage(root, { sub: y, today: today, prep: box }, asked(SEAS, YEARS, y), DKEY, host); } catch (e) { J = null; }
    if (!J || !J.steps) { if (J) try { J.destroy(); } catch (x) { /* (half made) */ } box.remove(); return; }
    prep = { y: y, J: J, box: box, key: prepKey(), idle: 0, t: 0 };
    HEAR.forEach(function (n) { addEventListener(n, prepHear, { capture: true, passive: true }); });
    prep.idle = idle(prepSlice);
  }
  function prepSlice(dl) {
    var p = prep;
    if (!p) return;
    p.idle = 0;
    if (prepDown || prepOwed) return;   /* (asked for again by the frame after his event: prepHear) */
    var quiet = PREP_QUIET - (performance.now() - prepLast);
    if (quiet > 0) { p.t = setTimeout(function () { p.t = 0; if (prep === p && !p.idle) p.idle = idle(prepSlice); }, quiet); return; }
    if (prepKey() !== p.key) { prepDrop(); prepLater(3000); return; }   /* (the window changed under it: begun again 3s later, a phone turned or a window dragged mostly done by then) */
    var t0 = performance.now(), left = Math.min(PREP_SLICE, dl.timeRemaining()), said = p.said || 0, plain = p.plain !== false, first = true;
    for (;;) {
      /* (a step begun only where it should end inside the slice, 8ms at most of the moment; the first of a slice also
         where the moment says it has room for it, or the moment is a whole one (50ms: nothing else is due), where a
         step longer than any slice runs, at the head of it) */
      var want = plain ? 1 : said * prepF;
      if (!first && performance.now() - t0 + want > left) break;
      if (first && want > left && want > dl.timeRemaining() && dl.timeRemaining() < 49) break;
      if (navigator.scheduling && navigator.scheduling.isInputPending && navigator.scheduling.isInputPending()) break;
      var s0 = performance.now(), r;
      try { r = p.J.steps.next(); } catch (e) { prepDrop(); return; }   /* (a throw: dropped; the switch makes the season as ever) */
      var took = performance.now() - s0;
      if (!plain && said > 0) prepF = Math.min(16, Math.max(prepF, took / said));
      first = false;
      if (r.done) { prepEnd(); return; }
      plain = typeof r.value !== 'number';
      said = plain ? 1 : r.value;
    }
    p.said = said; p.plain = plain;
    p.idle = idle(prepSlice);
  }
  function prepOff() {
    var p = prep;
    if (!p) return null;
    prep = null;
    if (p.idle) unidle(p.idle);
    clearTimeout(p.t);
    HEAR.forEach(function (n) { removeEventListener(n, prepHear, { capture: true, passive: true }); });
    if (prepRaf) { cancelAnimationFrame(prepRaf); prepRaf = 0; }
    prepOwed = false; prepDown = false;
    if (p.box.parentNode) p.box.parentNode.removeChild(p.box);
    return p;
  }
  /* (made: kept already by its last step, page.js; then the next, if any) */
  function prepEnd() { prepOff(); prepLater(400); }
  /* (let go of half made: its steps ended (setYear's own tidying), the page taken off) */
  function prepDrop() {
    var p = prepOff();
    if (!p) return;
    try { p.J.steps.return(); } catch (e) { /* (half made) */ }
    try { p.J.destroy(); } catch (e) { /* (half made) */ }
  }
  host.shown = function (J) { prepDrop(); shown = J; prepLater(400); };
  if (shown) prepLater(400);
  return {
    /* what the address names now (Back, Forward, a fragment followed): that season's page put up as the switch puts
       it up (kept, or made the first time), or this one put up again, and what it names pinned at once, as an
       address opened (the draft's router did the same on every change of its hash). The focus is left where it
       is; a change of season is said */
    go: function (season, sub2) {
      if (dead || !shown) return;
      prepDrop();
      var A = asked(SEAS, YEARS, [season, sub2].filter(Boolean).join('/'), NXY);
      if (!A.year) return;
      var was = shown.year, J = host.kept(A.year, DKEY);
      shown.away();
      try { if (J) J.wake(root, A); else J = makePage(root, { sub: A.year, today: today }, A, DKEY, host); } catch (e) { host.fail(e); return; }
      shown = J;
      prepLater(400);
      if (J.year !== was && J.say) J.say('The ' + J.year + ' season');
    },
    /* the season shown */
    season: function () { return shown ? shown.year : null; },
    destroy: function () {
      if (dead) return;
      dead = true;
      prepDrop(); clearTimeout(prepT);
      Object.keys(kept).forEach(function (y) { if (kept[y] !== shown) kept[y].destroy(); });
      if (shown) shown.destroy();
      kept = {}; shown = null;
      unhide();
    }
  };
}
