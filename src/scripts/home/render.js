// The home as plain HTML (the draft's own markup, design/home/v2ac-article.html, with the phd script's suffix written
// in): printed by the server, so a search engine and a reader without script get the whole page, and the engine
// (mountHome) enhances what is there. Pure: a string from the data (model.js homeData). No style attribute and no
// script: the places the draft wrote inline (its page without script at 1440 x 900) are the sheet's (home.css).
//
// renderHomeParts(data, opt) -> { head, tail }: '<svg class="nf">…</svg><main class="flow">…' and '…</main>', cut where
//   the light stands, for the page to print the fader itself between the two, where the draft has it: after the road,
//   before the footer (<Fragment set:html={head} /><Fader /><Fragment set:html={tail} />, pages/index.astro). The name
//   in its syllables (pinyin and hanzi beside each, shown in hand), its suffix, the sentence and the point the line
//   leaves from, the social links (rel="me"), the motto under them, the five doors as links with their grey lines
//   (race's: what comes next, as of opt.today or data.today: the build's day), the cities as a list with the line each
//   says in hand, the traveller's place, the footer and the second motto
// What the engine reads off it: the name's words (made its button, named by data-label; #said's data-say is what it
// says as it opens), race's door (data-href at rest, data-next while it names a race; its line's data-rest when no
// race is near), whether the traveller blinks (main's data-blink="off": data.blink false), and every place in the
// line's units the sheet gives
import { dateOf, homeData, raceOf, raceText } from './model.js';
import { esc } from '../esc.js';

/* the no-script line at 1440 x 900, and the phone's (its doors sit 56 lower): the engine draws them anew */
var LINE_D = 'M304 196 H624 C646 196 660 210 660 232 V376 C660 412 270 583 270 620 V718 C270 738 280 748 300 748 H960';
var LINE_M = 'M184 173 H194 C205 173 214 182 214 193 V413 C214 444 8 444 8 475 V698 C8 712 16 720 30 720 H362';
var HEART = '<span class="hb"><svg viewBox="0 0 9 8" aria-hidden="true"><path d="M2 1h2v1h-2zM5 1h2v1h-2zM1 2h7v2h-7zM2 4h5v1h-5zM3 5h3v1h-3zM4 6h1v1h-1z"/>' +
  '<path class="big" d="M1 0h2v1h-2zM6 0h2v1h-2zM0 1h4v1h-4zM5 1h4v1h-4zM0 2h9v2h-9zM1 4h7v1h-7zM2 5h5v1h-5zM3 6h3v1h-3zM4 7h1v1h-1z"/></svg><span class="sr">love</span></span>';

/* the name: a syllable each (its word, its pinyin, its hanzi), a space before the last; its suffix outside it. Plain
   words in the heading here: the engine makes them the button that splits the name (the draft's a[role=button],
   named data-label), so a page without script has no control that does nothing */
function nameHTML(N) {
  var n = N.syllables.length;
  var tks = N.syllables.map(function (s, i) {
    return (i && i === n - 1 ? ' ' : '') + '<span class="tk"><span class="tx">' + esc(s.text) + '</span>' +
      (s.py ? '<span class="py" aria-hidden="true">' + esc(s.py) + '</span>' : '') +
      (s.hz ? '<span class="hz" lang="zh-Hans" aria-hidden="true">' + esc(s.hz) + '</span>' : '') + '</span>';
  }).join('');
  return '<div class="nmr"><h1 class="name"><span class="say" data-label="' + esc(N.label) + '">' + tks + '</span>' +
    (N.suffix ? '<span class="sfx" aria-hidden="true"><span class="tx">' + esc(N.suffix) + '</span></span>' : '') + '</h1></div>';
}
/* the sentence; its last word holds the point the line leaves from, never apart from it */
function introHTML(s) {
  var t = String(s || '').trim(), i = t.lastIndexOf(' ');
  var head = i < 0 ? '' : t.slice(0, i + 1), last = i < 0 ? t : t.slice(i + 1);
  return '<p class="intro">' + esc(head) + '<span class="nb">' + esc(last) + '<span class="o" aria-hidden="true"></span></span></p>';
}
/* a line that breaks only after its commas (the motto: "Pain is inevitable, / Suffering is a choice.") */
function phrases(t) {
  return String(t).split(/(?<=,)\s+/).map(function (p) { return '<span>' + esc(p) + '</span>'; }).join(' ');
}
/* (race's link as printed is its page, as the draft's markup has it: the engine makes it data-next while the line
   names a race to come or under way; the line itself is printed as of the build's day) */
function doorHTML(d, i, R) {
  var lower = i >= 2, race = d.race;
  var line = race && R ? raceText(R, false) : d.what;
  return '<section class="p door ' + (lower ? 'v' : 'l') + '" data-art="' + esc(d.id) + '"><canvas class="st" aria-hidden="true"></canvas>' +
    '<div class="db"><h2><a href="' + esc(d.href) + '"' + (race ? ' data-href="' + esc(d.href) + '" data-next="' + esc(d.next) + '"' : '') + '><span class="tx">' + esc(d.word) + '</span></a></h2>' +
    '<p class="what"' + (race ? ' data-rest="' + esc(d.what) + '"' : '') + '>' + esc(line) + '</p></div></section>';
}
function cityHTML(c) {
  var im = c.img && c.img.bw && c.img.co ? '<img class="bw" src="' + esc(c.img.bw) + '" alt="" loading="lazy"><img class="co" src="' + esc(c.img.co) + '" alt="" loading="lazy">' : '';
  return '<li class="p city"><canvas class="wx" aria-hidden="true"></canvas><button class="c" type="button" data-city="' + esc(c.id) + '">' +
    '<span class="ic" aria-hidden="true">' + im + '<canvas width="28" height="28"></canvas></span><span class="nm">' + esc(c.name) + '</span>' +
    (c.memory ? '<span class="mem">' + esc(c.memory) + '</span>' : '') + '</button></li>';
}
export function renderHomeParts(data, opt) {
  opt = opt || {};
  var D = homeData(data), today = dateOf(opt.today || D.today), R = raceOf(D.races, today), M = D.mottos, ft = D.footer;
  var head =
    /* no-script only, at night: the colour icons' near-black outlines are redrawn in the light ink */
    '<svg class="nf" width="0" height="0" aria-hidden="true" focusable="false"><filter id="night-ink" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
    '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.3 -.59 -.11 0 1" result="dark"/>' +
    '<feComponentTransfer in="dark" result="mask"><feFuncA type="linear" slope="14" intercept="-9.4"/></feComponentTransfer>' +
    '<feFlood flood-color="#e8e6e1"/><feComposite in2="mask" operator="in"/><feComposite in2="SourceAlpha" operator="in" result="lines"/>' +
    '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="lines"/></feMerge></filter></svg>\n' +
    '<main class="flow"' + (D.blink ? '' : ' data-blink="off"') + '>\n' +
    '<svg class="d" viewBox="0 0 960 900" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="line" d="' + LINE_D + '"/></svg>\n' +
    '<svg class="m" viewBox="0 0 350 844" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="line" d="' + LINE_M + '"/></svg>\n' +
    '<header class="p hero">\n' + nameHTML(D.name) + '\n' +
    '<p class="sr" id="said" aria-live="polite" data-say="' + esc(D.name.said) + '"></p>\n' + introHTML(D.sentence) + '\n' +
    '<nav class="soc" aria-label="elsewhere">' + D.social.map(function (s) {
      return '<a href="' + esc(s.href) + '"' + (s.me ? ' rel="me"' : '') + ' data-mark="' + esc(s.mark) + '"><canvas aria-hidden="true"></canvas><span class="sr">' + esc(s.label) + '</span></a>';
    }).join('') + '</nav>\n' +
    (M.top ? '<p class="mot">' + phrases(M.top.text) + '</p>\n' : '') +
    '</header>\n' +
    D.doors.map(function (d, i) { return doorHTML(d, i, R); }).join('\n') + '\n' +
    '<ol class="road" aria-label="The cities so far">' + D.cities.map(cityHTML).join('') + '</ol>\n' +
    /* the traveller stands on the level road; his place is the script's */
    '<div class="p walk" aria-hidden="true"><canvas class="prints"></canvas><canvas class="walker" width="9" height="13"></canvas></div>\n';
  var tail =
    (ft ? '<p class="foot"><span class="fa">\u00a9 ' + esc(ft.from) + '\u2013' + esc(ft.to) + ' \u00b7 </span><span class="fb">Designed by ' + esc(ft.by) + ', made with ' + HEART + ' and Claude</span></p>\n' : '') +
    (M.bottom ? '<p class="foot fmh"><span class="fmq">' + esc(M.bottom.text) + '</span>' + (M.bottom.by ? ' <span class="fmb">\u2014 ' + esc(M.bottom.by) + '</span>' : '') + '</p>\n' : '') +
    '</main>';
  return { head: head, tail: tail };
}
