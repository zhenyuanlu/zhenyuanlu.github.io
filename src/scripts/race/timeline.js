// The race page's timeline and clubs row: one line under the map, January to December of the season shown, the
// year so far solid and what is left dotted, today a short red stroke; every race a mark at its date, one shape a
// sport; the months under the line; his clubs over it at the months he joined, each a button that shows how long he
// has been with it. Ported from the draft (design/assets/v2ac/race.js); each comment is the draft's own. The months'
// and the clubs' places are set as properties, not as style attributes in the markup (no inline style under the
// site's content security policy).
import { DAY, MON, MONTHS, RED } from './consts.js';
import { dayOfYear, daysIn, low } from './util.js';

export function installTimeline(pg) {
  var E = pg.E, S = pg.S, moEl = pg.moEl, t = pg.t, tcv = pg.tcv, tlEl = pg.tlEl, tpxEl = pg.tpxEl;
  /* ---------- the timeline: one line, Jan to Dec of the season shown, across the column (under the map alone where
     the column's words reach down beside it). The year so far solid, what is left of it dotted, and today a short
     red stroke across the line. Each race a small mark on the line at its date, a hair of paper round it, each sport
     its own (round 5, the owner: "timeline上不同运动的点是不是不一样？一个运动是一个样？"; three sets tried at the line's own
     scale, these kept): the dragon boat a bar (3 x 7 px), Hyrox a square (5 x 5), the run a dot (5 across); grey once
     raced, lighter while to come, bigger and in ink while it is in hand or pointed at, red for the next race. A race
     known only by its months is its mark's outline at their middle (its card says "May or June 2026"). The months
     under the line. His clubs ride on the line by the short names he gave them (round 5: "wolfpack (WRC)", "Tsinghua
     DB/QQFB", "BBB (Boston-Based Bao)"; no other name on hover): a hair rising from it at the month he joined, the
     name beside it; a club he was in before the season began named at the line's start with when he joined. A club
     pointed at, or reached by Tab, shows how long he has been with it: its stretch of the line, from the month he
     joined (or the season's start) to today (or the season's end), drawn in ink and thicker, with its races' marks,
     while the rest of the line, the other marks and the other clubs step back. r13 (the owner, 2026-10-15: "bbb的时间
     可以到8月份结束"): a club may end (content.json races.clubs[].to, a month as its from is; none: to now). Its stretch
     then stops at that month's end, its words say "from ... to August 2026", and a season after it does not show it ---------- */
  var TL = { a0: 0, a1: 0, ay: 22, fy: 2, words: [] };
  var TL_MARK = { dragonboat: 'bar', hyrox: 'sq', run: 'dot' };
  function tlHeight() { var n = pg.narrow(); TL.fy = n ? 0 : 1; TL.two = n && tlTwo(); TL.ay = (n ? 20 : 22) + (TL.two ? 14 : 0); return TL.ay + 6 + 14 + 1; }
  /* (a phone's line too short for the club he was in before the season and the next one's flag side by side, its name
     reaching the next flag's hair: the clubs on two rows, that one over the others, round 5's longer names) */
  function tlTwo() {
    var F = flagsOf();
    if (F.length < 2 || !F[0].start) return false;
    var yr = +S.year, x = dayOfYear(new Date(yr, F[1].m, 1, 12)) / daysIn(yr) * pg.main.clientWidth;
    var e = pg.el('span', 'r-fl', E(F[0].ks.map(function (k) { return k.c.name || k.c.id; }).join(' · ')));
    e.style.visibility = 'hidden';
    moEl.appendChild(e);
    var w = e.offsetWidth;
    moEl.removeChild(e);
    return w > x - 6;
  }
  function flagTop(f) { return TL.two && !f.start ? TL.fy + 14 : TL.fy; }
  function tlFrame() { TL.a0 = 0; TL.a1 = pg.L.TW; }
  function tlX(d, yr) { return TL.a0 + dayOfYear(d) / daysIn(yr) * (TL.a1 - TL.a0); }
  function upRace(R) {
    function on(s) { return s && (s.R ? s.R === R : s.slot ? s.slot === R.slot : s.P === R.p); }
    return on(pg.shown()) || on(S.hover && S.hover.sel);
  }
  function flagsOf() {
    var yr = +S.year, before = [], by = {}, out = [];
    S.clubs.forEach(function (k) {
      if (k.from.getFullYear() < yr) before.push(k);
      else { var m = k.from.getMonth(); (by[m] = by[m] || []).push(k); }
    });
    if (before.length) out.push({ start: true, ks: before });
    Object.keys(by).sort(function (a, b) { return a - b; }).forEach(function (m) { out.push({ m: +m, ks: by[m] }); });
    return out;
  }
  /* a mark's cells in device px (w x h, row by row): the bar 3 x 7 css px (3 x 11 in hand), the square 5 (7), the
     dot 5 across (7), at the screen's pixel ratio; hollow: its outline, a device pixel or more wide */
  var MARKS = {};
  function markMask(kind, up, hollow, dpr) {
    var key = [kind, up ? 1 : 0, hollow ? 1 : 0, dpr].join(':'), M = MARKS[key];
    if (M) return M;
    var one = Math.max(1, Math.round(dpr)), w, h, i, j, bits;
    if (kind === 'sq' || kind === 'dot') w = h = Math.round((up ? 7 : 5) * dpr);
    else { w = Math.max(3, Math.round(3 * dpr)); h = Math.round((up ? 10 : 6) * dpr) + one; }
    bits = new Uint8Array(w * h);
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      if (kind !== 'dot') { bits[j * w + i] = 1; continue; }
      var dx = i + 0.5 - w / 2, dy = j + 0.5 - h / 2;
      bits[j * w + i] = dx * dx + dy * dy <= (w / 2) * (w / 2) ? 1 : 0;
    }
    if (hollow) {
      var out = new Uint8Array(w * h);
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
        if (!bits[j * w + i]) continue;
        var edge = false;
        for (var d = 1; d <= one && !edge; d++) [[d, 0], [-d, 0], [0, d], [0, -d]].forEach(function (q) { var X = i + q[0], Y = j + q[1]; if (X < 0 || Y < 0 || X >= w || Y >= h || !bits[Y * w + X]) edge = true; });
        out[j * w + i] = edge ? 1 : 0;
      }
      bits = out;
    }
    return (MARKS[key] = { w: w, h: h, bits: bits });
  }
  function drawTimeline() {
    if (!pg.L) return;
    tlFrame();
    var dpr = pg.L.dpr, rd = pg.realDPR(), Wc = pg.L.TW, Ht = tlHeight(), c = tcv.getContext('2d'), K = pg.colours(), yr = +S.year;
    /* (n device px, in the window's 64ths at the screen's own ratio: zoomed, as the map's exact()) */
    function ex(n0) { for (var n = n0, k = 0; k < 64 && n > 1; k++, n--) { var v = n * 64 / rd; if (Math.abs(v - Math.round(v)) < 1e-6) return n; } return Math.max(1, n0); }
    tcv.width = ex(Math.round(Wc * dpr)); tcv.height = ex(Math.round(Ht * dpr));
    tcv.style.width = (tcv.width / dpr) + 'px'; tcv.style.height = (tcv.height / dpr) + 'px'; tcv.style.left = '0px';
    var one = Math.max(1, Math.round(dpr)), W1 = tcv.width;
    function X(v) { return Math.round(v * dpr); }
    function Yp(v) { return Math.round(v * dpr); }
    c.clearRect(0, 0, tcv.width, tcv.height);
    var Ya = Yp(TL.ay);
    var now = t && t.getFullYear() === yr ? tlX(t, yr) : t && t.getFullYear() > yr ? TL.a1 : TL.a0, xn = Math.min(W1, X(now));
    /* (a club pointed at: its stretch, from the month he joined or the season's start to today or the season's end) */
    var ck = S.club ? S.clubs.filter(function (k) { return k.c.id === S.club; })[0] : null, sx0 = 0, sx1 = 0;
    if (ck) {
      sx0 = ck.from.getFullYear() < yr ? TL.a0 : tlX(ck.from, yr);
      /* (to today, or to the end of the month it ended in: r13) */
      var sxe = !ck.to || ck.to.getFullYear() > yr ? TL.a1 : tlX(new Date(yr, ck.to.getMonth() + 1, 1, 12), yr);
      sx1 = Math.max(sx0, Math.min(TL.a1, now, sxe));
    }
    c.fillStyle = ck ? K.faint : K.hair;
    c.fillRect(X(TL.a0), Ya, Math.max(0, xn - X(TL.a0)), one);
    for (var x = xn + 2 * one; x < Math.min(W1, X(TL.a1)); x += 3 * one) c.fillRect(x, Ya, one, one);
    for (var m = 1; m < 12; m++) c.fillRect(X(tlX(new Date(yr, m, 1, 12), yr)), Ya + one, one, Yp(2));
    if (ck && X(sx1) > X(sx0)) { c.fillStyle = K.inkC; c.fillRect(X(sx0), Ya - Math.round(one / 2), X(sx1) - X(sx0), 2 * one); }
    var upC = {};
    S.races.forEach(function (R) { if (upRace(R)) (R.clubs || []).forEach(function (id) { upC[id] = 1; }); });
    if (S.club) upC[S.club] = 1;
    (S.flags || []).forEach(function (f) {
      if (f.x == null || f.hid || f.bare) return;
      var on = f.ks.some(function (k) { return upC[k.c.id]; }), top = Yp(flagTop(f) + 4), xf = Math.min(W1 - one, X(f.x));
      c.fillStyle = on ? K.inkC : ck ? K.faint : K.club;
      if (f.ks.every(function (k) { return k.approx; })) { for (var y = Ya - 2 * one; y >= top; y -= 2 * one) c.fillRect(xf, y, one, one); }
      else c.fillRect(xf, top, one, Ya - top);
    });
    moEl.classList.toggle('r-ck', !!ck);
    [].forEach.call(moEl.querySelectorAll('.r-fc'), function (e) { e.classList.toggle('on', !!upC[e.getAttribute('data-c')]); e.setAttribute('aria-pressed', ck && ck.c.id === e.getAttribute('data-c') ? 'true' : 'false'); });
    [].forEach.call(moEl.querySelectorAll('.r-fl'), function (e) { e.classList.toggle('on', !!ck && !!e.querySelector('.r-fc[data-c="' + ck.c.id + '"]')); });
    /* the races, each with a hair of paper round it; the one in hand or pointed at last, on top */
    var marks = [], list = S.races.filter(function (R) { R.tm = []; return R.w.a && R.w.a.getFullYear() === yr; });
    list.sort(function (a, b) { return (upRace(a) ? 1 : 0) - (upRace(b) ? 1 : 0); });
    list.forEach(function (R) {
      var up = upRace(R), lit = !up && S.club && (R.clubs || []).indexOf(S.club) >= 0, dim = !up && S.club && !lit, kind = TL_MARK[R.r.sport] || 'bar';
      var mid = (tlX(R.w.a, yr) + tlX(new Date(+R.w.b + DAY), yr)) / 2, M = markMask(kind, up, R.w.approx, dpr);
      var xa = X(mid) - Math.floor(M.w / 2), ya = Ya + Math.floor(one / 2) - Math.floor(M.h / 2);
      R.tm.push({ x0: xa / dpr, x1: (xa + M.w) / dpr, y: TL.ay });
      marks.push([R.r.id, Math.round(xa / dpr), Math.round((xa + M.w) / dpr), TL.ay, kind + (R.w.approx ? ' hollow' : '')]);
      c.clearRect(xa - one, ya - one, M.w + 2 * one, M.h + 2 * one);
      c.fillStyle = pg.isNext(R) ? RED : up || lit ? K.inkC : dim ? K.faint : pg.done(R) ? K.greyC : K.light;
      for (var j = 0; j < M.h; j++) for (var i = 0, i0 = -1; i <= M.w; i++) {
        var on = i < M.w && M.bits[j * M.w + i];
        if (on && i0 < 0) i0 = i;
        if (!on && i0 >= 0) { c.fillRect(xa + i0, ya + j, i - i0, 1); i0 = -1; }
      }
    });
    if (t && t.getFullYear() === yr) {
      var nr = S.races.filter(pg.isNext)[0], near = nr && nr.tm[0] && nr.tm[0].x0 - now < 16 && nr.tm[0].x1 > now - 4;
      if (!near) { c.clearRect(xn - one, Ya - Yp(3), 3 * one, Yp(6) + one); c.fillStyle = RED; c.fillRect(xn, Ya - Yp(3), one, Yp(6) + one); }
    }
    tlEl.setAttribute('data-marks', JSON.stringify(marks));
    tlEl.setAttribute('data-club', ck ? JSON.stringify({ c: ck.c.id, x: [Math.round(sx0), Math.round(sx1)] }) : '');
  }
  /* the months under the line, and the clubs over it: each club's name a button (Tab reaches it; pointed at or
     focused its stretch shows; on a touch screen a tap holds it), its since-date after it where the line allows */
  function clubLabel(k) {
    var n = 0;
    S.races.forEach(function (R) { if ((R.clubs || []).indexOf(k.c.id) >= 0 && pg.done(R)) n++; });
    return (k.c.long || k.c.name) + (k.to ? ', from ' + pg.clubWhen(k) : ', since ' + (k.approx ? 'about ' : '') + MONTHS[k.from.getMonth()] + ' ' + k.from.getFullYear()) + (n ? ', ' + n + (n === 1 ? ' race' : ' races') + ' this season' : '');
  }
  function timelineWords() {
    /* the words are written anew, on a resize too (fit.js relayout: a phone's address bar coming or going), and a
       club's name that had the focus has it again, its mark with it (the 2026-10-16 review: Wolfpack's, on a phone,
       went to the page's body, and the mark with it) */
    var fe = document.activeElement, had = fe && moEl.contains(fe) && fe.classList.contains('r-fc') ? fe.getAttribute('data-c') : null;
    tlFrame();
    var yr = +S.year;
    S.flags = flagsOf();
    moEl.innerHTML = MON.map(function (m, i) {
      var a = tlX(new Date(yr, i, 1, 12), yr), b = i < 11 ? tlX(new Date(yr, i + 1, 1, 12), yr) : TL.a1;
      return '<span class="r-mn" aria-hidden="true" data-x="' + Math.round((a + b) / 2) + '">' + low(m) + '</span>';
    }).join('') + S.flags.map(function (f, i) {
      f.x = f.start ? null : Math.round(tlX(new Date(yr, f.m, 1, 12), yr));
      return '<span class="r-fl" data-f="' + i + '">' +
        f.ks.map(function (k) { return '<button type="button" class="r-fc" data-c="' + E(k.c.id) + '" aria-label="' + E(clubLabel(k)) + '" aria-pressed="false"></button>'; }).join('<span class="r-fs" aria-hidden="true"> · </span>') +
        (f.start && f.ks.length === 1 ? '<span class="r-fd" aria-hidden="true"></span>' : '') + '</span>';
    }).join('');
    /* (their places as properties: a month at the middle of its stretch of the line, a club's row over it) */
    [].forEach.call(moEl.querySelectorAll('.r-mn'), function (e) { e.style.left = e.getAttribute('data-x') + 'px'; e.style.top = (TL.ay + 5) + 'px'; e.removeAttribute('data-x'); });
    [].forEach.call(moEl.querySelectorAll('.r-fl'), function (e, i) { e.style.top = flagTop(S.flags[i]) + 'px'; });
    flagFit();
    if (had) [].some.call(moEl.querySelectorAll('.r-fc'), function (e) { if (e.getAttribute('data-c') !== had) return false; e.focus({ preventScroll: true }); return true; });
  }
  function flagFit() {
    var spans = moEl.querySelectorAll('.r-fl'), has = {};
    TL.words = [];
    if (!spans.length) return;
    S.races.forEach(function (R) { (R.clubs || []).forEach(function (id) { has[id] = 1; }); });
    [].forEach.call(moEl.querySelectorAll('.r-fc'), function (e) {
      var id = e.getAttribute('data-c'), k = pg.clubOf(id) || { id: id };
      e.textContent = k.name || id;
    });
    S.flags.forEach(function (f, i) {
      var e = spans[i];
      f.hid = false; e.style.visibility = '';
      e.style.left = (f.start ? TL.a0 : f.x + 4) + 'px';
      var d = e.querySelector('.r-fd');
      if (d) {
        var k0 = f.ks[0], nx = S.flags[i + 1], lim = nx && !TL.two ? nx.x - 10 : TL.a1, mo = low(MON[k0.from.getMonth()]), yr = k0.from.getFullYear();
        var forms = [' · since ' + mo + ' ' + yr, ' · since ' + yr, ' · ' + yr, ' · ’' + String(yr).slice(2), ''];
        for (var j = 0; j < forms.length; j++) { d.textContent = forms[j]; if (e.offsetLeft + e.offsetWidth <= lim) break; }
      }
      var w = e.offsetWidth;
      f.bare = false;
      if (!f.start && f.x + 4 + w > TL.a1) {
        if (f.x - 4 - w >= TL.a0) e.style.left = (f.x - 4 - w) + 'px';
        else { e.style.left = Math.max(TL.a0, TL.a1 - w) + 'px'; f.bare = true; }
      }
    });
    var tr0 = tpxEl.getBoundingClientRect();
    [].forEach.call(moEl.querySelectorAll('.r-fc'), function (e) {
      var r = e.getBoundingClientRect(), id = e.getAttribute('data-c');
      TL.words.push({ c: id, inert: !has[id], x0: r.left - tr0.left, y0: r.top - tr0.top, x1: r.right - tr0.left, y1: r.bottom - tr0.top });
    });
  }
  function clubAt(p) {
    for (var i = 0; i < TL.words.length; i++) { var w = TL.words[i]; if (p[0] >= w.x0 - 3 && p[0] < w.x1 + 3 && p[1] >= w.y0 - 3 && p[1] < w.y1 + 3) return w; }
    return null;
  }
  /* the race whose mark is nearest */
  function nearMark(e, reach) {
    var p = pg.local(e, tpxEl), best = null, bd = reach;
    S.races.forEach(function (R) {
      (R.tm || []).forEach(function (m) {
        var d = Math.max(m.x0 - p[0], 0, p[0] - m.x1) + Math.abs(p[1] - m.y) * 0.8;
        if (d < bd) { bd = d; best = R; }
      });
    });
    return best;
  }
  function markTarget(R) { return R && R.p ? { key: 'r' + S.races.indexOf(R), sel: { P: R.p, slot: R.slot, R: R } } : null; }
  /* a club pointed at, focused or tapped: its stretch of the line and its races (the venues it raced at in ink on the
     map); also a club he raced none of the season's races with, its stretch alone */
  function clubTo(id) {
    if (S.club === id) return;
    S.club = id;
    S.PL.forEach(function (P) { if (P.lab) P.lab.classList.toggle('cl', !!id && P.races.some(function (R) { return (R.clubs || []).indexOf(id) >= 0; })); });
    drawTimeline();
  }
  Object.assign(pg, { TL: TL, clubAt: clubAt, clubTo: clubTo, drawTimeline: drawTimeline, markTarget: markTarget, nearMark: nearMark, timelineWords: timelineWords, tlHeight: tlHeight });
}
