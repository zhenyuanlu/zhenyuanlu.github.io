// The home's engine: the home of the draft (design/home/v2ac-article.html, its own part: the style and script outside
// the blocks the build tools inline) as modules, one concern each:
//   model.js     the data model: the name, the sentence, the marks, the mottos, the doors, the cities, dates, and
//                race's grey line (what comes next, by the races and today)
//   render.js    the home as plain HTML, printed at build time for readers without script (renderHomeParts)
//   art.js       the engine's own pixel art (art.json): the cities' icons and scenes, the weather, the marks
//   light.js     the stage's ink, grey and paper from the fader; every drawing repainted as the light moves
//   fit.js       the one screen: where the road is, the doors chained above it, the layout in order
//   path.js      the line from the sentence's point down past the doors into the road, on whole device pixels
//   name.js      the name splitting into its syllables in hand
//   marks.js     the four marks under the sentence
//   lettering.js the pixel letters: the name, its suffix, the cells of every drawing (the site's lettering/)
//   doors.js     the five doors, their hover, their bead, race's line and red dot
//   cities.js    the cities' icons warming in hand and cooling back
//   figure.js    the little figure on the road, his walk and his city's thing
//   weather.js   the weather round the city he reaches
//   input.js     the pointer or the keyboard
//   colour.js, util.js   the pure helpers they share
//
// mountHome(root, data, opts) -> { destroy(), layout(), shown() }
//   root    the home printed by renderHomeParts (its main.flow, or an element holding it)
//   data    the home's data in the draft's shapes (model.js says them; renderHomeParts takes the same): mountHome reads
//           the races and today; everything else is in the page already (the name's label and spoken line too)
//   opts    today    a Date or 'YYYY-MM-DD' (taken at noon): which race is next (data.today; else the day it is)
//           reduced  a boolean or () => boolean: reduced motion; the reader's prefers-reduced-motion when not given
//           fade     () => 0..100, the fader's place as the home is mounted (the page's own fader, .fader input; else
//                    the early script's window.__fade.v); then each 'zl:stage' (scripts/fader.js) says it
//           colours  (v) => { ink, grey, ... }, the stage's colours at a place; window.__fade.colours when not given
//           zoom     the big-screen engine (phase 5; the draft's window.__zoom); the plain page when not given
//           blink    false: the figure never blinks (the draft's figure blinks now and then, standing); when not
//                    given, the page says (main.flow data-blink="off", renderHomeParts's, from data.blink)
//   destroy  every listener, timer and frame of the mount gone; the home as the server printed it again
//   layout   lay the home out again (the window or its type changed without an event the home hears)
//   shown    the home shown again after being out of sight: laid out, the keyboard's door focused again
// Nothing is left behind by destroy(): no listener on the document or the window, no timer, no frame asked for. The
// frame's own (html[data-grid], --dwx: scripts/site.js sets them on every page) stay as they are.
import { reduced as hubReduced, phone as hubPhone } from '../hub.js';
import { ACT2, ALTI, DATA, WXD, sceneOf } from './art.js';
import { dateOf, homeData } from './model.js';
import { installLight } from './light.js';
import { installInput } from './input.js';
import { installFit } from './fit.js';
import { installPath } from './path.js';
import { installName } from './name.js';
import { installMarks } from './marks.js';
import { installLettering } from './lettering.js';
import { installDoors } from './doors.js';
import { installCities } from './cities.js';
import { installFigure } from './figure.js';
import { installWeather } from './weather.js';

export { renderHomeParts } from './render.js';
export { homeData } from './model.js';

/* the mount's life: its listeners, frames and timers, each taken back by kill() */
function life() {
  var L = { dead: false, offs: [], rafs: new Set(), tms: new Set() };
  L.listen = function (t, type, fn, o) { t.addEventListener(type, fn, o); L.offs.push(function () { t.removeEventListener(type, fn, o); }); };
  L.raf = function (fn) {
    var id = requestAnimationFrame(function (now) { L.rafs.delete(id); if (!L.dead) fn(now); });
    L.rafs.add(id);
    return id;
  };
  L.caf = function (id) { if (id) { cancelAnimationFrame(id); L.rafs.delete(id); } };
  L.later = function (fn, ms) {
    var id = setTimeout(function () { L.tms.delete(id); if (!L.dead) fn(); }, ms);
    L.tms.add(id);
    return id;
  };
  L.clear = function (id) { if (id) { clearTimeout(id); L.tms.delete(id); } };
  L.kill = function () {
    L.dead = true;
    L.offs.forEach(function (f) { f(); });
    L.offs = [];
    L.rafs.forEach(function (id) { cancelAnimationFrame(id); });
    L.tms.forEach(function (id) { clearTimeout(id); });
    L.rafs.clear(); L.tms.clear();
  };
  return L;
}

export function mountHome(root, data, opts) {
  opts = opts || {};
  var flow = root && root.matches && root.matches('.flow') ? root : root && root.querySelector('.flow');
  if (!flow) throw new Error('mountHome: no .flow in the root (render it with renderHomeParts)');
  var D = homeData(data);
  /* what the server printed, put back by destroy() (the engine draws into it in place): a copy of it, made before
     anything is drawn, less what stands in the home but is not the home's (the light, .fader: scripts/fader.js's own
     element, which keeps its place and its listeners) */
  /* (the speed round, 2026-10-16: the copy is made in a document of its own, which loads nothing. Made in the page's,
     its pictures were fetched at once, lazy or not, being in no layout to wait for: the cities' ten plain icons, 259 KB
     the drawn home never shows (on a phone's first visit, as its map came up). They load only if the copy is put back) */
  var kept = [].filter.call(flow.children, function (el) { return el.matches('.fader'); });
  var inert = document.implementation.createHTMLDocument('');
  var printed = { copy: inert.createDocumentFragment(), cls: flow.getAttribute('class'), style: flow.getAttribute('style') };
  [].forEach.call(flow.childNodes, function (n) { printed.copy.appendChild(kept.indexOf(n) >= 0 ? inert.createComment('kept') : inert.importNode(n, true)); });
  var F0 = window.__fade || {}, red = opts.reduced;
  var hm = life();
  hm.root = document.documentElement;
  hm.flow = flow;
  hm.reduced = function () { return typeof red === 'function' ? !!red() : red != null ? !!red : hubReduced(); };
  hm.phone = hubPhone;
  hm.zoom = opts.zoom || null;
  /* (the page says it too: renderHomeParts writes data-blink="off" where the data says he never blinks) */
  hm.blink = opts.blink != null ? opts.blink : flow.getAttribute('data-blink') === 'off' ? false : undefined;
  /* the light: the early script's colours per place on the fader (scripts/early.js), and where the fader stands */
  hm.F = { colours: opts.colours || F0.colours, stage: F0.stage || function (v) { return v <= 33 ? 'day' : v <= 66 ? 'dusk' : 'night'; } };
  if (!hm.F.colours) throw new Error('mountHome: no colours of the light (the early script, window.__fade)');
  hm.fv = (function () {
    var v = opts.fade ? opts.fade() : NaN, inp = isFinite(v) ? null : document.querySelector('.fader input[type="range"]');
    if (inp && inp.value !== '' && isFinite(+inp.value)) v = +inp.value;
    if (!isFinite(v)) v = isFinite(F0.v) ? F0.v : 0;
    return Math.max(0, Math.min(100, Math.round(v)));
  })();
  hm.stage = hm.F.stage(hm.fv);
  /* the data the engine reads: race's line, the name's spoken line */
  hm.races = D.races;
  hm.today = function () { return dateOf(opts.today || D.today); };
  hm.saidText = D.name.said;   /* (the page's own, #said's data-say and the name's data-label, come first: name.js) */
  hm.nameLabel = D.name.label;
  /* the art */
  hm.DATA = DATA; hm.ALTI = ALTI; hm.WXD = WXD; hm.ACT2 = ACT2; hm.sceneOf = sceneOf;
  /* the home's elements (render.js) */
  function q(s) { return flow.querySelector(s); }
  hm.dot = q('.o');
  hm.lineD = q('svg.d .line');
  hm.lineM = q('svg.m .line');
  hm.marks = q('.soc');
  hm.doorSecs = [].slice.call(flow.querySelectorAll('.door'));
  hm.roadEls = [].slice.call(flow.querySelectorAll('.city, .walk'));
  hm.say = q('.say');
  hm.said = q('#said');
  hm.nmr = q('.nmr');
  hm.walkEl = q('.walk');
  if (!hm.dot || !hm.lineD || !hm.lineM || !hm.marks || !hm.say || !hm.said || !hm.nmr || !hm.walkEl || hm.doorSecs.length !== 5) {
    throw new Error('mountHome: the home is not as renderHomeParts prints it (five doors, the name, the line, the road)');
  }
  var gone = false;
  /* everything of the mount taken back, and the home as the server printed it (the copy's nodes, the light back in
     its place; no markup is parsed again, so no style attribute is) */
  function undo() {
    gone = true;
    hm.kill();
    if (hm.dprOff) hm.dprOff();
    var back = document.adoptNode(printed.copy);   /* (into the page first, the light's own element never out of it) */
    [].slice.call(back.childNodes).forEach(function (n) { if (n.nodeType === 8 && n.data === 'kept') back.replaceChild(kept.shift(), n); });
    flow.replaceChildren(back);
    if (printed.style == null) flow.removeAttribute('style'); else flow.style.cssText = printed.style;
    if (printed.cls == null) flow.removeAttribute('class'); else flow.className = printed.cls;
    flow.removeAttribute('data-live');
  }
  try {
    /* (the mark the sheet waits for before it shows the home: home.css) */
    flow.setAttribute('data-live', '');
    installLight(hm);
    installInput(hm);
    installFit(hm);
    installPath(hm);
    installName(hm);
    installMarks(hm);
    installLettering(hm);
    installDoors(hm);
    installCities(hm);
    installFigure(hm);
    installWeather(hm);
    /* the light moved: scripts/fader.js tells every page, the place it is at in detail.v */
    hm.listen(document, 'zl:stage', function (e) {
      var v = e && e.detail && isFinite(e.detail.v) ? +e.detail.v : NaN;
      if (!isFinite(v)) { var inp = document.querySelector('.fader input[type="range"]'); v = inp ? +inp.value : hm.fv; }
      hm.light(v);
    });
    /* the start, as the draft's: the cities' first drawing, the figure standing, the letters, the layout, the doors */
    hm.paperC = hm.paper();
    hm.cities.forEach(function (st) { st.wx.width = hm.BW; st.wx.height = hm.BH; hm.paint(st); });
    hm.frame('idle');
    hm.blinkLater();
    hm.lettersPaint();
    hm.layout();
    hm.doorsPaint();
    hm.arm();
  } catch (e) {
    /* (a mount that fails leaves nothing behind either: the page as printed, shown, as without script) */
    undo();
    throw e;
  }
  return {
    destroy: function () { if (!gone) undo(); },
    layout: function () { if (!gone) hm.layout(); },
    shown: function () { if (!gone) { hm.layout(); hm.doorsBack(); } }
  };
}
