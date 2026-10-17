// The home's own pixel art (the draft's #px block, design/home/v2ac-article.html, less the door pictures, which the
// v2ac doors no longer draw): the five cities' icons in line art and colour, their scenes per stage (a subject,
// the weather round it, the traveller's thing), the weather's sprites, the four marks under the sentence, and the
// stage palettes the artist redid. Merged once, as the draft merged them at its start; each drawing then keeps its
// palettes worked out per stage on itself (colour.js), so a second mount draws from the same objects.
import ART from './art.json';

export var DATA = ART;

/* ---------- the scenes: what a city becomes in hand, per stage ----------
   DATA.scenes[city][stage] = { icon: 'base' | an altIcons key, wx: a wx key | null, act: an acts2 key }, merged
   in from design/assets/pixel/v1f-<city>.json by design/tools/merge-v1f.cjs. v1e's drawings are registered
   here under fixed keys, and a built-in scene (day as in v1e; dusk and night the same drawings in their
   derived colours, Shanghai's food and its xiaolongbao by night) fills whatever is missing */
export var ALTI = DATA.altIcons = DATA.altIcons || {}, WXD = DATA.wx = DATA.wx || {}, ACT2 = DATA.acts2 = DATA.acts2 || {};
(function () {
  function reg(T, k, v) { if (v && !T[k]) T[k] = v; }
  var AL = DATA.alt || {}, AC = DATA.acts || {}, WC = DATA.weather.cities;
  reg(ALTI, 'shanghai-food', AL.shanghai && AL.shanghai.icon);
  reg(ALTI, 'austin-pickup', AL.austin && AL.austin.icon);
  ['shanghai', 'okinawa', 'austin', 'dallas', 'boston'].forEach(function (c) { reg(WXD, c, WC[c]); });
  reg(ACT2, 'shanghai-day', AC.shanghai && AC.shanghai.day);
  reg(ACT2, 'shanghai-night', AC.shanghai && AC.shanghai.night);
  ['okinawa', 'austin', 'dallas', 'boston'].forEach(function (c) { reg(ACT2, c, AC[c]); });
  /* stage palettes for drawings that were already here (a season-based weather takes them per season, or for all) */
  var O = DATA.overrides || {};
  function onto(T, o, keys) { keys.forEach(function (k) { if (o[k]) T[k] = o[k]; }); }
  var PK = ['paletteDusk', 'paletteNight'];
  Object.keys(O.wx || {}).forEach(function (k) {
    var T = WXD[k], o = O.wx[k];
    if (!T) return;
    /* a season the artist redid brings its day palette too (summer's sail is no longer pure white) */
    if (T.seasons) Object.keys(T.seasons).forEach(function (s) { var os = o.seasons && o.seasons[s]; onto(T.seasons[s], os || o, os ? ['palette'].concat(PK) : PK); });
    else onto(T, o, PK);
  });
  Object.keys(O.acts2 || {}).forEach(function (k) { if (ACT2[k]) onto(ACT2[k], O.acts2[k], PK); });
  Object.keys(O.altIcons || {}).forEach(function (k) { if (ALTI[k]) onto(ALTI[k], O.altIcons[k], ['palDusk', 'palNight']); });
})();
var SC0 = {
  shanghai: { day: ['base', 'shanghai', 'shanghai-day'], dusk: ['base', 'shanghai', 'shanghai-day'], night: ['shanghai-food', 'shanghai', 'shanghai-night'] },
  okinawa: ['base', 'okinawa', 'okinawa'], austin: ['austin-pickup', 'austin', 'austin'], dallas: ['base', 'dallas', 'dallas'], boston: ['base', 'boston', 'boston']
};
export function sceneOf(id, sg) {
  var d = SC0[id] || ['base', null, null], s = (DATA.scenes && DATA.scenes[id] && DATA.scenes[id][sg]) || {};
  if (!Array.isArray(d)) d = d[sg];
  return {
    icon: s.icon === 'base' || ALTI[s.icon] ? s.icon : d[0],
    wx: s.wx === null ? null : WXD[s.wx] ? s.wx : d[1],
    act: ACT2[s.act] ? s.act : d[2]
  };
}
/* the cities the art can draw (a city in content/home without art is shown by its name alone) */
export function hasArt(id) { return !!(DATA.icons && DATA.icons[id]); }
