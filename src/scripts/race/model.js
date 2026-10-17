// The race engine's data model: a season's races in date order, their venues (the map's stops) and each venue's
// sports (slots), the next race, what has been run (by today's calendar day), results, medals, crews and clubs in
// words, the season's counts, and the highways a season reveals on the map. Ported from the draft
// (design/assets/v2ac/race.js, makePage's model; the frame's own date helpers from inner.js, now next.js's). Pure: no
// DOM, so the list printed at build time (list.js) uses it too. The next race is next.js's, of every season.
//
// createModel(races, today, { geo, acts }) -> the model: races is content/race in the draft's shape
// ({ seasons: { '2026': [race, ...], ... }, clubs: [...], medley }), today a Date (its calendar day counts), geo
// and acts the engine's own art (geo.json, acts.json). A model is made per season page: nodeFor adds a stop of its
// own for a race the map has none for, as the draft did per page.
import { maskOf, skyFit } from './art.js';
import { DAY, MEDAL_WORD, MON, MONTHS, SPORT_WORD, WX_WORD } from './consts.js';
import { byMedal, cap, low, ord, polyLen } from './util.js';
import { nextRace as nextOf, span } from './next.js';
import { dayOf as day } from '../today.js';

export function yearsOf(SEAS) { return Object.keys(SEAS).filter(function (y) { return Array.isArray(SEAS[y]) && SEAS[y].length; }).sort().reverse(); }
export function ymd(d) { return d ? d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() : ''; }
/* what an address names: its season (#/race/2025: that one; a race's id: its own, the newest first; the next race,
   #/race/next: its own, nextYear, next.js's season of it; else the newest), and in it a race, a venue (and one of
   its sports), or the next race */
export function asked(SEAS, YEARS, sub, nextYear) {
  var parts = String(sub || '').split('/').filter(Boolean), want = null, wantV = null, y0 = YEARS[0] || null, named = false;
  if (parts.length && SEAS[parts[0]]) { y0 = parts.shift(); named = true; }
  if (!named && parts[0] === 'next' && nextYear && SEAS[nextYear]) y0 = String(nextYear);
  if (parts.length === 1 && parts[0] !== 'next') (named ? [y0] : YEARS).some(function (y) { return (SEAS[y] || []).some(function (r) { if (r.id !== parts[0]) return false; y0 = y; want = r; return true; }); });
  if (!want && parts.length && parts[0] !== 'next') wantV = { v: parts[0], s: parts[1] || null };
  return { year: y0, want: want, wantV: wantV, next: parts[0] === 'next' };
}

/* a calendar day at noon (the frame's V1K.day: today.js's): every race date and today are taken so; Oct 8-11, Nov 8,
   Jun 30-Jul 2, an en dash between (the frame's V1K.span: next.js's) */
export { day, span };

export function createModel(races, today, assets) {
  var D = { races: races || {}, geo: (assets && assets.geo) || {}, acts: (assets && assets.acts) || {} }, RD = D.races || {}, SEAS = RD.seasons || {};
  /* today as a calendar day: noon, as ?today= and every race date are; days to the next race counted in calendar
     days, so a clock change (Nov 1) between does not add one */
  var t = today ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12) : null;
  var G = D.geo || {}, ACTS = D.acts || {}, SPORTS = ACTS.sports || {};
  var CLUBS = (RD.clubs || []).filter(function (c) { return c && c.id; });
  var YEARS = Object.keys(SEAS).filter(function (y) { return Array.isArray(SEAS[y]) && SEAS[y].length; }).sort().reverse();
  /* the next race (or the one under way), with how far it is and its season; null when none or no date: of every
     season, the earliest not yet over (next.js; the draft's frame looked in the newest season alone) */
  var LATEST = YEARS[0] || null, NX = nextOf(RD, t);
  var GW = G.w || 400, GH = G.h || 287, PJ = G.proj || null;
  var NODES = {}, EDGES = [];
  Object.keys(G.nodes || {}).forEach(function (k) { NODES[k] = G.nodes[k].slice(); });
  (G.edges || []).forEach(function (e) { if (NODES[e.a] && NODES[e.b] && e.pts && e.pts.length > 1) EDGES.push({ a: e.a, b: e.b, pts: e.pts, len: polyLen(e.pts) }); });
  var HOMEN = NODES[G.home] ? G.home : null;
  /* the land at map7's own cells (row runs "x0-x1 x2-x3"); without it every cell is land */
  var LAND7 = null;
  if (Array.isArray(G.land) && G.land.length === GH) {
    LAND7 = new Uint8Array(GW * GH);
    G.land.forEach(function (row, y) {
      String(row || '').split(/\s+/).forEach(function (r) { var m = /^(\d+)-(\d+)$/.exec(r); if (m) for (var x = +m[1]; x <= +m[2] && x < GW; x++) LAND7[y * GW + x] = 1; });
    });
  }
  function proj(ll) { return PJ ? [(ll[0] - PJ.lon0) * PJ.kx, (PJ.lat1 - ll[1]) * PJ.ky] : null; }
  var TERRAIN = G.terrain || {};
  function when(r, year) {
    var s = String(r.date || ''), m, a = null, b = null, approx = false, label, long;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { a = day(s); b = day(r.end) || a; if (b < a) b = a; }
    else if ((m = /^(\d{4})-(\d{2})\/(\d{2})$/.exec(s))) { a = new Date(+m[1], +m[2] - 1, 1, 12); b = new Date(+m[1], +m[3], 0, 12); approx = true; }
    if (a && !approx) {
      label = r.dateLabel || span(a, b);
      long = MONTHS[a.getMonth()] + ' ' + a.getDate() + (+b !== +a ? ' to ' + (b.getMonth() !== a.getMonth() ? MONTHS[b.getMonth()] + ' ' : '') + b.getDate() : '') + ', ' + a.getFullYear();
    } else if (a) {
      label = r.dateLabel || MON[a.getMonth()] + '/' + MON[b.getMonth()];
      long = MONTHS[a.getMonth()] + ' or ' + MONTHS[b.getMonth()] + ' ' + a.getFullYear();
    } else {
      label = r.dateLabel || String(year);
      long = String(year) + ', date not yet known';
    }
    return { a: a, b: b, approx: approx, label: label, long: long };
  }
  /* already run: by its date where the date is known (its last day before today: ?today=2026-04-17 counts none of
     2026's races, the B.A.A. 5K tomorrow; round 5's check counted ten), else (a race known only by its months, today
     within them; one with no date) by its status */
  function done(R) {
    if (t && R.w.a) {
      if (+R.w.b + DAY - 1 < +t) return true;
      if (!R.w.approx || +t < +R.w.a) return false;
    }
    return R.r.status === 'raced';
  }
  /* (the next race is one race of one season, NX.season: no race of any other season is it) */
  function isNext(R) { return !!(NX && NX.race === R.r); }
  function statusOf(R) {
    if (isNext(R)) {
      var d = NX.days <= 1 ? 'tomorrow' : 'in ' + NX.days + ' days';
      return NX.now ? { red: true, text: 'now', say: 'happening now' } : { red: true, text: 'next · ' + d, say: 'the next race, ' + d };
    }
    if (!done(R)) return { red: false, text: 'to come', say: 'still to come' };
    return null;
  }
  /* the result in words: "500m 2nd", "1st, Division C", "2km qualified", "finisher"; a heat whose event is not known
     by its place alone, "1st" (never "?"; round 5: Hartford 2025 showed a gold disc alone), and several such heats of
     one place counted, "1st ×2 · 3rd ×3" (sr: for a screen reader, "1st, twice") */
  var TIMES = { 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times' };
  function resultWords(R, sr) {
    var out = [], by = {};
    (R.r.results || []).forEach(function (x) {
      var ev = x.event && x.event !== '?' ? x.event : '', s;
      if (x.finisher) s = ev ? ev + ' finisher' : 'finisher';
      else if (x.qualified) s = ev ? ev + ' qualified' : 'qualified';
      else if (!x.place) return;
      else if (!ev && !x.note) {
        if (by[x.place]) { by[x.place].n++; return; }
        out.push(by[x.place] = { place: x.place, n: 1 });
        return;
      } else s = !ev ? ord(x.place) : /^\d+(\.\d+)?\s*(m|km|k|mi)$/i.test(ev) ? ev + ' ' + ord(x.place) : ord(x.place) + ', ' + ev;
      out.push(x.note ? s + ', ' + x.note : s);
    });
    return out.map(function (o) {
      if (typeof o === 'string') return o;
      return ord(o.place) + (o.n < 2 ? '' : sr ? ', ' + (TIMES[o.n] || o.n + ' times') : ' ×' + o.n);
    }).join(' · ');
  }
  function medalsOf(R) {
    if (!done(R)) return [];
    var res = R.r.results || [], list = res.filter(function (x) { return x.place && x.place <= 3; }).map(function (x) { return x.place; });
    res.forEach(function (x) { if (x.finisher) list.push('f'); });
    if (res.some(function (x) { return x.qualified; })) list.push('q');
    return list.sort(byMedal);
  }
  function medalWords(list) {
    var m = list.filter(function (x) { return x !== 'q'; }).map(function (x) { return MEDAL_WORD[x]; });
    return m.length ? (m.length === 1 ? 'A ' + m[0] + ' medal' : 'Medals: ' + m.join(', ')) : '';
  }
  /* the medley's legs in words, not numbers: "B.A.A. Distance Medley · last leg" */
  var LEG = { 1: 'first leg', 2: 'second leg', 3: 'last leg' };
  function medleyWords(R) { return R.r.medley ? (RD.medley || 'Distance Medley') + ' · ' + (LEG[R.r.medley] || 'a leg') : ''; }
  function clubOf(id) { return CLUBS.filter(function (c) { return c.id === id; })[0] || null; }
  /* a crew in words (its parts, joined by middle dots as items), its club named (by the short name the timeline gives
     it, round 5: "wolfpack (WRC)", "Tsinghua DB/QQFB", "BBB (Boston-Based Bao)") only when the crew's own name does not
     already say it (any of the club's aka: QingQing Fast Boat is Tsinghua's QQFB): "QingQing Fast Boat · mixed",
     "22 Wolves (WRC × Catch22) · open", "THAA Tsinghua" */
  function clubWord(k) { return k.name || k.id; }
  function saysClub(c, k) {
    var s = low(c.name + ' ' + (c.note || '')), ab = /\(([^)]+)\)/.exec(k.long || '');
    return [k.name || k.id, ab && ab[1]].concat(k.aka || []).some(function (w) { return w && s.indexOf(low(w)) >= 0; });
  }
  function crewParts(c) {
    var k = c.club && clubOf(c.club);
    return [c.name + (c.note ? ' (' + c.note + ')' : ''), k && !saysClub(c, k) ? clubWord(k) : '', c.division || ''].filter(Boolean);
  }
  function crewSay(c) { var k = c.club && clubOf(c.club), kw = k && !saysClub(c, k) ? k.long || k.name : ''; return c.name + (c.note ? ', ' + c.note : '') + (c.division || kw ? ' (' + [c.division, kw].filter(Boolean).join(', ') + ')' : ''); }
  function crewsOf(R) { return (R.r.crews || []).filter(function (c) { return c && c.name; }); }
  function sportWord(sl) { return sl.races.every(function (R) { return R.r.medley; }) && RD.medley ? RD.medley : SPORT_WORD[sl.sport] || sl.sport; }
  function wxOf(R) { return R && done(R) && WX_WORD[R.r.weather] ? R.r.weather : null; }
  /* one race in sentences: the buttons' names and the list for screen readers */
  function told(R) {
    var st = statusOf(R), cr = crewsOf(R);
    return [R.r.name, R.r.place, R.w.long, st ? cap(st.say) : '', done(R) ? cap(resultWords(R, true).split(' · ').join('; ')) : '', medalWords(R.md || []),
      cr.length ? 'With ' + cr.map(crewSay).join(' and ') : '', medleyWords(R).replace(' · ', ', '), wxOf(R) ? cap(WX_WORD[wxOf(R)]) : ''].filter(Boolean).join('. ') + '.';
  }
  /* (a sport's races at a venue, each with its state or, run, its result: "B.A.A. 5K, April 18, 2026, finisher"; round
     5's third look: the medley's picture named its legs run without it) */
  function toldSlot(sl) {
    if (sl.races.length === 1) return told(sl.races[0]);
    return cap(sportWord(sl)) + ' at ' + cap(sl.P.name) + ': ' + sl.races.map(function (R) {
      var st = statusOf(R), res = !st && done(R) ? resultWords(R, true).split(' · ').join(', ') : '';
      return R.r.name + ', ' + R.w.long + (st ? ', ' + st.say : '') + (res ? ', ' + res : '');
    }).join('; ') + '.';
  }
  function toldVenue(P) {
    if (!P.multi) return toldSlot(P.slots[0]);
    return cap(P.name) + ': ' + P.slots.map(function (sl) { return sportWord(sl) + ', ' + sl.races.map(function (R) { return R.w.label; }).join(' and '); }).join('; ') + '.';
  }
  /* the stops: every race at a stop of the map (geo.races; else the nearest within 12 cells; else one of its own,
     joined to the nearest by a straight road) */
  function nodeFor(r) {
    var g = G.races && G.races[r.id];
    if (g && NODES[g]) return g;
    if (!PJ || typeof r.lat !== 'number' || typeof r.lon !== 'number') return null;
    var p = proj([r.lon, r.lat]);
    if (p[0] < 0 || p[1] < 0 || p[0] > GW - 1 || p[1] > GH - 1) return null;
    var best = null, bd = Infinity;
    Object.keys(NODES).forEach(function (k) { var d = Math.hypot(NODES[k][0] - p[0], NODES[k][1] - p[1]); if (d < bd) { bd = d; best = k; } });
    if (best && bd < 12) return best;
    var id = '@' + r.id;
    if (!NODES[id]) { NODES[id] = p; if (best) EDGES.push({ a: id, b: best, pts: [p, NODES[best]], len: Math.hypot(p[0] - NODES[best][0], p[1] - NODES[best][1]) }); }
    return id;
  }
  function nameOf(n, r) { return (G.places && G.places[n]) || low(String(r.place || r.name || '').split(',')[0].trim()); }
  function actFor(sport) { var k = SPORTS[sport], A = k && ACTS[k]; return A && A.frames && A.ax != null ? A : null; }
  /* the roads a season reveals: from home, the shortest way to each of its venues (their union), and the
     highways joining the junctions on them */
  function reveal(targets) {
    var on = {};
    if (!HOMEN) { EDGES.forEach(function (e, i) { on[i] = 1; }); return on; }
    var adj = {}, dist = {}, prev = {}, Q = Object.keys(NODES);
    EDGES.forEach(function (e, i) {
      (adj[e.a] = adj[e.a] || []).push({ to: e.b, i: i, len: e.len });
      (adj[e.b] = adj[e.b] || []).push({ to: e.a, i: i, len: e.len });
    });
    Q.forEach(function (k) { dist[k] = Infinity; });
    dist[HOMEN] = 0;
    while (Q.length) {
      Q.sort(function (x, y) { return dist[x] - dist[y]; });
      var u = Q.shift();
      if (dist[u] === Infinity) break;
      (adj[u] || []).forEach(function (n) { var d = dist[u] + n.len; if (d < dist[n.to]) { dist[n.to] = d; prev[n.to] = { u: u, i: n.i }; } });
    }
    targets.forEach(function (k) { while (prev[k]) { on[prev[k].i] = 1; k = prev[k].u; } });
    var at = {};
    EDGES.forEach(function (e, i) { if (on[i]) { at[e.a] = 1; at[e.b] = 1; } });
    EDGES.forEach(function (e, i) { if (at[e.a] && at[e.b]) on[i] = 1; });
    return on;
  }
  /* a season's races in date order, its venues (stops) and each venue's sports (slots) */
  /* (in steps where the page is made ready out of sight, a venue a step: its scenes' shapes and the sky each needs
     are worked out here, 5 to 10ms for a season's eight venues. model runs them in one go) */
  function model(y) { var g = modelSteps(y), r = g.next(); while (!r.done) r = g.next(); return r.value; }
  function* modelSteps(y) {
    var list = (SEAS[y] || []).map(function (r, i) { return { r: r, w: when(r, y), i: i }; });
    list.sort(function (a, b) { var A = a.w.a ? +a.w.a : Infinity, B = b.w.a ? +b.w.a : Infinity; return A - B || a.i - b.i; });
    var by = {}, PL = [];
    list.forEach(function (R) {
      R.md = medalsOf(R);
      var n = nodeFor(R.r);
      if (n == null) { R.p = null; R.slot = null; return; }
      var P = by[n];
      if (!P) { P = by[n] = { node: n, races: [], slots: [], name: nameOf(n, R.r) }; PL.push(P); }
      P.races.push(R); R.p = P;
      var sp = R.r.sport || 'other', sl = P.slots.filter(function (x) { return x.sport === sp; })[0];
      if (!sl) { sl = { P: P, sport: sp, A: actFor(sp), races: [] }; P.slots.push(sl); }
      sl.races.push(R); R.slot = sl;
    });
    for (var pn = 0; pn < PL.length; pn++) {
      var P = PL[pn];
      yield;
      P.multi = P.slots.length > 1;
      P.md = [];
      P.races.forEach(function (R) { P.md = P.md.concat(R.md); });
      P.md.sort(byMedal);
      P.hasNext = P.races.some(isNext);
      /* its room: as wide as its widest scene, as tall as its tallest with the sky each needs over it */
      P.rw = 0; P.rh = 0;
      P.slots.forEach(function (sl) { if (sl.A) P.rw = Math.max(P.rw, maskOf(sl.A).w); });
      P.slots.forEach(function (sl) {
        sl.sky = null;
        if (!sl.A) return;
        var wxs = [];
        sl.races.forEach(function (R) { var w = wxOf(R); if (w && wxs.indexOf(w) < 0) wxs.push(w); });
        sl.sky = sl.skyFit = skyFit(sl.A, P.rw, wxs);
        P.rh = Math.max(P.rh, maskOf(sl.A).h + sl.sky.S);
      });
    }
    return { races: list, PL: PL };
  }
  /* (the season's races in date order with their medals, as modelSteps begins: for the list printed at build time) */
  function racesOf(y) {
    var list = (SEAS[y] || []).map(function (r, i) { return { r: r, w: when(r, y), i: i }; });
    list.sort(function (a, b) { var A = a.w.a ? +a.w.a : Infinity, B = b.w.a ? +b.w.a : Infinity; return A - B || a.i - b.i; });
    list.forEach(function (R) { R.md = medalsOf(R); });
    return list;
  }
  /* the season's counts (inner-v8's row), only of the races already run (2026-10-07, the owner: "只算已经比完的"): those
     on the map, their states, the months they were in (a race known only by its months adds one only when none of them
     is already counted), their medals (the finishers' too) */
  function countsOf(races) {
    var st = {}, mo = {}, md = 0, loose = [];
    races = races.filter(function (R) { return R.p && done(R); });
    races.forEach(function (R) {
      var m = /,\s*([A-Z]{2})\s*$/.exec(R.r.place || '');
      if (m) st[m[1]] = 1;
      if (R.w.a && !R.w.approx) mo[R.w.a.getMonth()] = 1;
      else if (R.w.a) loose.push(R.w);
      md += (R.md || []).filter(function (x) { return x !== 'q'; }).length;
    });
    loose.forEach(function (w) {
      for (var k = w.a.getMonth(); k <= w.b.getMonth(); k++) if (mo[k]) return;
      mo[w.a.getMonth()] = 1;
    });
    /* (a season none of whose races is run yet (?today before its first) shows no counts: no row of noughts) */
    if (!races.length) return [];
    var out = [[races.length, 'races'], [Object.keys(st).length, 'states'], [Object.keys(mo).length, 'months']];
    /* (a season whose results are not yet in tells no medals rather than none) */
    if (md) out.push([md, 'medals']);
    return out;
  }
  /* a place in a card: its first part and its state ("Connecticut River, MA", "Rockland Lake, NY", "Hartford, CT") */
  function shortPlace(s) { var p = String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); return p.length > 2 ? p[0] + ', ' + p[p.length - 1] : p.join(', '); }
  /* the races of one sport at one venue (B.A.A.'s medley: the 5K and the 10K run, the Half to come) */
  function shortOf(R, list) {
    var names = list.map(function (x) { return String(x.r.name || ''); }), p = names[0] || '';
    names.forEach(function (n) { while (p && n.indexOf(p) !== 0) p = p.slice(0, -1); });
    p = p.replace(/\S*$/, '');
    var s = String(R.r.name || '').slice(p.length).trim();
    return s || R.r.name;
  }
  function clubRows(y) {
    var yr = +y, out = [];
    CLUBS.forEach(function (c) {
      var m = /^(\d{4})-(\d{2})$/.exec(c.from || ''), e = /^(\d{4})-(\d{2})$/.exec(c.to || '');
      if (!m || +m[1] > yr || (e && +e[1] < yr)) return;
      out.push({ c: c, from: new Date(+m[1], +m[2] - 1, 1, 12), to: e ? new Date(+e[1], +e[2], 0, 12) : null, approx: !!c.approx });
    });
    return out;
  }
  /* a club's time in words: "about April 2026 to August 2026", "September 2025 to now" */
  function clubWhen(k) {
    return (k.approx ? 'about ' : '') + MONTHS[k.from.getMonth()] + ' ' + k.from.getFullYear() + ' to ' + (k.to ? MONTHS[k.to.getMonth()] + ' ' + k.to.getFullYear() : 'now');
  }
  return { D: D, RD: RD, SEAS: SEAS, t: t, G: G, ACTS: ACTS, SPORTS: SPORTS, CLUBS: CLUBS, YEARS: YEARS, LATEST: LATEST, NX: NX, GW: GW, GH: GH, PJ: PJ,
    NODES: NODES, EDGES: EDGES, HOMEN: HOMEN, LAND7: LAND7, proj: proj, TERRAIN: TERRAIN,
    when: when, done: done, isNext: isNext, statusOf: statusOf, resultWords: resultWords, medalsOf: medalsOf, medalWords: medalWords, medleyWords: medleyWords,
    clubOf: clubOf, crewParts: crewParts, crewSay: crewSay, crewsOf: crewsOf, sportWord: sportWord, wxOf: wxOf, told: told, toldSlot: toldSlot, toldVenue: toldVenue,
    nodeFor: nodeFor, nameOf: nameOf, actFor: actFor, reveal: reveal, model: model, modelSteps: modelSteps, racesOf: racesOf, countsOf: countsOf,
    shortPlace: shortPlace, shortOf: shortOf, clubRows: clubRows, clubWhen: clubWhen };
}
