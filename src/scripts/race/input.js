// The race page's input: what the reader points at, focuses, taps or presses, and what it chooses. A name, a sport's
// picture, the card or a mark on the timeline pointed at is previewed after a breath; a click, a tap or Enter pins it
// (its address said through opts.address); Esc, a click on the empty map or the pinned one again lets it go; the
// arrows move between the map's buttons; a club pointed at or focused shows its stretch of the line. The frame's
// stage and resize are heard while the page is shown (arm / disarm). Ported from the draft
// (design/assets/v2ac/race.js); each comment is the draft's own.
import { cap, pad, slug, unite } from './util.js';

export function installInput(pg) {
  var LATEST = pg.LATEST, S = pg.S, mapEl = pg.mapEl, moEl = pg.moEl, pxEl = pg.pxEl, sayEl = pg.sayEl, sea = pg.sea, tlEl = pg.tlEl, tpxEl = pg.tpxEl, yearsEl = pg.yearsEl;
  /* a button: a click, a tap or Enter pins what it stands for; the keyboard's focus previews it, as the pointer does */
  function wire(b, sel) {
    S.btns.push(b);
    b.addEventListener('click', function (e) { e.stopPropagation(); pin(sel(), true); });
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) { clearTimeout(S.leaveT); preview(sel()); } });
    b.addEventListener('blur', function (e) {
      var to = e.relatedTarget;
      if (to && to.closest && to.closest('.r-labs')) return;
      clearTimeout(S.leaveT);
      S.leaveT = setTimeout(function () { if (!S.hover) endPreview(); }, 60);
    });
    b.addEventListener('keydown', function (e) {
      /* (Shift+Tab out of the map's first button while what it previews has taken the column: the column at rest
         again before the focus moves, so it goes back to the next line, not past it (round 5's third look, 1366 x
         610: Boston's details held the column and the focus skipped to the season switch)) */
      if (e.key === 'Tab' && e.shiftKey && S.prev && pg.inCol(S.prev) && S.btns.filter(function (x) { return !x.hidden; })[0] === b) { clearTimeout(S.leaveT); endPreview(); return; }
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      var j = S.btns.indexOf(b) + d;
      while (j >= 0 && j < S.btns.length && S.btns[j].hidden) j += d;
      if (j >= 0 && j < S.btns.length) { e.preventDefault(); S.btns[j].focus(); }
    });
  }
  /* ---------- choosing: a preview (pointed at, or the keyboard's focus) and a pin (a click, a tap, Enter) ---------- */
  function here() { return S.at || (pg.L && pg.L.homeP) || null; }
  function same(a, b) { return !!(a && b && a.P === b.P && a.slot === b.slot && a.R === b.R); }
  function shown() { return S.prev || S.pin; }
  /* what is shown changed: the names, the stops and pictures, the card (or the column), the timeline, the address;
     and he goes there (with nothing at hand, the scene ends and he stays where he is) */
  function show() {
    styleOn(); pg.drawBase(); pg.showHand(); pg.showCard(); pg.drawTimeline(); syncUrl(); pg.flagSync();
    if (!pg.L) return;
    var s = shown();
    /* (nothing at hand: the scene fades, and a walk under way ends where it was going; he stays there) */
    if (!s) { pg.endAct(); if (!S.trip) pg.drawMan(); return; }
    if (S.trip && S.trip.P === s.P) return;
    if (!S.trip && here() === s.P) { pg.settle(s); return; }
    pg.walkTo(s.P);
  }
  function preview(sel) {
    clearTimeout(S.leaveT);
    if (!sel || !sel.P) return;
    var nv = same(sel, S.pin) ? null : sel;
    if (same(nv, S.prev) || (!nv && !S.prev)) return;
    S.prev = nv;
    show();
  }
  function endPreview() {
    if (!S.prev) return;
    S.prev = null;
    show();
  }
  function pin(sel, fromUser) {
    clearTimeout(S.dwell); clearTimeout(S.leaveT);
    if (!sel || !sel.P) return;
    if (same(sel, S.pin) && fromUser) { unpin(); return; }
    S.pin = sel; S.prev = null;
    show();
    if (fromUser) sayEl.textContent = 'Pinned: ' + (sel.R ? sel.R.r.name : sel.slot && sel.slot.races.length === 1 ? sel.slot.races[0].r.name : cap(sel.P.name));
  }
  function unpin() {
    clearTimeout(S.dwell); clearTimeout(S.leaveT);
    if (!S.pin) { endPreview(); return; }
    S.pin = null; S.prev = null;
    show();
    sayEl.textContent = 'Let go';
  }
  function seasonHash() { return '#/race' + (S.year === LATEST ? '' : '/' + S.year); }
  function pinnedRace() { var p = S.pin; if (!p) return null; if (p.R) return p.R; return p.slot && p.slot.races.length === 1 ? p.slot.races[0] : null; }
  function pinHash() {
    var p = S.pin, R = pinnedRace();
    if (!p) return seasonHash();
    if (R && R.r.id) return '#/race/' + R.r.id;
    return seasonHash() + '/' + slug(p.P.name) + (p.slot ? '/' + p.slot.sport : '');
  }
  /* (the address is the page's to write: opts.address is told the part after #/race, as the draft's hash has it:
     '' or '/2025' for the season, '/<race id>' for a race, '/boston/run' or '/2025/hartford' for a venue and a sport;
     and the season shown, which a race's id alone does not say) */
  function syncUrl() {
    if (pg.address) pg.address(pinHash().slice(6), { season: S.year });
  }
  /* the pointer on a target (map or timeline): after a breath it is previewed; off every target, the preview ends
     a moment later (so the pointer may cross the paper between a name and its card) */
  function point(T) {
    if ((T && S.hover && T.key === S.hover.key) || (!T && !S.hover)) return;
    clearTimeout(S.dwell); clearTimeout(S.leaveT);
    S.hover = T;
    styleHover(); pg.flagSync();
    if (!T) { S.leaveT = setTimeout(function () { if (!S.hover) endPreview(); }, 280); return; }
    if (same(T.sel, shown())) return;
    S.dwell = setTimeout(function () { if (S.hover === T) preview(T.sel); }, 160);
  }
  function inHand(P) { var s = shown(); return !!(s && s.P === P) || !!(S.pin && S.pin.P === P); }
  function styleOn() {
    S.PL.forEach(function (P) {
      if (P.lab) P.lab.classList.toggle('on', inHand(P));
      P.slots.forEach(function (sl) { if (sl.btn) sl.btn.classList.toggle('on', !!(shown() && shown().slot === sl)); });
    });
  }
  function styleHover() {
    S.PL.forEach(function (P) { if (P.lab) P.lab.classList.toggle('hov', !!(S.hover && S.hover.sel && S.hover.sel.P === P)); });
    /* (the pictures answer the pointer at once, as the names do) */
    pg.drawBase(); pg.drawTimeline();
  }
  /* ---------- events ---------- */
  /* what a point of the map is on, as a click finds it: the card shown (it holds what is at hand), the buttons
     themselves (a sport's button, a name), exactly their boxes; then the room of the scene playing; then a picture
     without a button (a venue of one sport) within a cell; else a name or a stop within reach (CSS px) */
  function targetAt(px0, py0, reach) {
    var cs = pg.L.cs, best = null, bd = reach, bp = cs + 1e-6, pick = null, i, j, P, sl;
    function dist(b) { var dx = Math.max(b.x0 - px0, 0, px0 - b.x1), dy = Math.max(b.y0 - py0, 0, py0 - b.y1); return Math.sqrt(dx * dx + dy * dy); }
    function inside(b) { return !!b && px0 >= b.x0 && px0 < b.x1 && py0 >= b.y0 && py0 < b.y1; }
    function slotT(P, sl, i, j) { return { key: 's' + i + '.' + j, sel: P.multi ? { P: P, slot: sl, R: null } : pg.venueSel(P) }; }
    if (S.card && shown()) {
      var r = S.card.el.getBoundingClientRect(), pr = pxEl.getBoundingClientRect();
      if (inside({ x0: r.left - pr.left - cs, y0: r.top - pr.top - cs, x1: r.right - pr.left + cs, y1: r.bottom - pr.top + cs })) return { key: 'card', sel: shown(), card: true };
    }
    for (i = S.PL.length - 1; i >= 0; i--) {
      P = S.PL[i];
      for (j = P.slots.length - 1; j >= 0; j--) { sl = P.slots[j]; if (sl.btn && !sl.btn.hidden && inside(sl.btnBox)) return slotT(P, sl, i, j); }
      if (P.labBox && inside(P.labBox)) return { key: 'v' + i, sel: pg.venueSel(P) };
    }
    if (S.act && S.act.slot.P.room) {
      var rm = S.act.slot.P.room, ai = S.PL.indexOf(S.act.slot.P), aj = S.act.slot.P.slots.indexOf(S.act.slot);
      if (inside({ x0: rm.x0 * cs, y0: rm.y0 * cs, x1: rm.x1 * cs, y1: rm.y1 * cs })) return { key: 'room', sel: shown() && shown().P === S.act.slot.P ? shown() : slotT(S.act.slot.P, S.act.slot, ai, aj).sel };
    }
    for (i = 0; i < S.PL.length; i++) {
      P = S.PL[i];
      for (j = 0; j < P.slots.length; j++) {
        sl = P.slots[j];
        var b = sl.pic, d = Infinity;
        if (sl.btn || !b) continue;
        d = dist(sl.tap || { x0: b.x0 * cs, y0: b.y0 * cs, x1: b.x1 * cs, y1: b.y1 * cs });
        if (d < bp) { bp = d; pick = slotT(P, sl, i, j); }
      }
    }
    if (pick) return pick;
    S.PL.forEach(function (P, i) {
      var d = P.labBox ? dist(P.labBox) : Infinity, q = P.sq;
      d = Math.min(d, dist({ x0: q.x0 * cs, y0: q.y0 * cs, x1: (q.x1 + 1) * cs, y1: (q.y1 + 1) * cs }));
      if (P.mdAt) d = Math.min(d, dist({ x0: P.mdAt.x * cs, y0: P.mdAt.y * cs, x1: (P.mdAt.x + P.md.length * 6 - 1) * cs, y1: (P.mdAt.y + 5) * cs }));
      if (d < bd) { bd = d; best = { key: 'v' + i, sel: pg.venueSel(P) }; }
    });
    if (best) return best;
    /* the way from a venue to its card: while a card is shown, the pointer crossing the paper between its venue's row
       (or its scene) and it keeps it, at any pace (the box round the row and the card, and round the scene and it) */
    if (S.card && shown() && shown().P.LB) {
      var sP = shown().P, cb = S.card.b, cpx = { x0: cb.x0 * cs, y0: cb.y0 * cs, x1: cb.x1 * cs, y1: cb.y1 * cs };
      var ways = [sP.LB].concat(sP.room && S.act && S.act.slot.P === sP ? [sP.room] : []).map(function (b) { return pad(unite(cpx, { x0: b.x0 * cs, y0: b.y0 * cs, x1: b.x1 * cs, y1: b.y1 * cs }), 4); });
      if (ways.some(inside)) return { key: 'card', sel: shown(), card: true };
    }
    return null;
  }
  /* (in the browser's own 64ths of a px, as it hit-tests the buttons, so a hover and a click on a box's very edge agree;
     zoomed, 64ths of the window's px, which are z of the page's) */
  function local(e, el) { var r = el.getBoundingClientRect(), q = 64 * pg.ZM(); return [Math.round((e.clientX - r.left) * q) / q, Math.round((e.clientY - r.top) * q) / q]; }
  /* Esc lets go; a map button the pointer had focused is let go of too (no ring is left round a name) */
  function onKey(e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    var a = document.activeElement;
    if (sea.classList.contains('r-ptr') && a && a !== document.body && sea.contains(a) && a.matches('button')) a.blur();
    if (S.pin || S.prev) unpin();
  }
  /* the keyboard's ring round the map's buttons, the switch and the next line only after Tab or the arrows: a click
     focuses a button without one (race.css, .r-ptr), a key that is not a way of moving does not bring one */
  function onRingKey(e) { if (e.key === 'Tab' || /^Arrow/.test(e.key)) sea.classList.remove('r-ptr'); }
  /* the stage: at once, then every frame while the paper and ink cross-fade, then once more when they settle */
  /* (the speed round, 2026-10-16: drawn in the frame that shows it, once a frame, and every frame for 320ms only
     while the paper and ink cross-fade (html.xf, the cut at night: fader.js; tokens.css). It was drawn at the stage's
     word and again in that frame's own callback, and every frame for 320ms after each word, cut or not: a light moved
     day to dusk, whose colours change at once, was drawn about forty times the same, 18ms a time on a phone four times
     slower, as the lettering tells the pages twice, at the word and once its colours settle. The same pixels in the
     same frames: a frame's callbacks run before it is drawn) */
  function onStage() {
    cancelAnimationFrame(S.xf);
    var t0 = performance.now(), fading = document.documentElement.classList.contains('xf');
    S.xf = requestAnimationFrame(function f(now) { pg.paint(); S.xf = fading && now - t0 < 320 ? requestAnimationFrame(f) : 0; });
  }
  /* (the keys, the stage and the window's size: heard while the page is shown) */
  var offs = [];
  function arm() {
    document.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onRingKey, true);
    offs = [pg.on('stage', onStage), pg.on('resize', pg.onResize)];
  }
  function disarm() {
    pg.stopMotion(); clearTimeout(S.dwell); clearTimeout(S.leaveT); cancelAnimationFrame(S.xf);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keydown', onRingKey, true);
    offs.forEach(function (off) { off(); }); offs = [];
  }
  /* the map's, the timeline's, the clubs' and the season switch's own listeners, on the page's own elements (made with
     the page, they go with it) */
  function listen() {
    mapEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !pg.L) return;
      var bt = e.target && e.target.closest ? e.target.closest('button.r-lab, button.r-ic') : null;
      var p = local(e, pxEl), T = bt && bt.tgt ? bt.tgt() : targetAt(p[0], p[1], pg.L.phone ? 20 : 8);
      mapEl.style.cursor = T && !T.card ? 'pointer' : '';
      point(T);
    });
    mapEl.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') point(null); });
    mapEl.addEventListener('click', function (e) {
      if (!pg.L || (e.target.closest && e.target.closest('button'))) return;
      var p = local(e, pxEl), touch = e.pointerType === 'touch' || pg.L.phone, T = targetAt(p[0], p[1], touch ? 20 : 8);
      if (T && T.card) { if (S.prev) pin(S.prev, false); return; }
      if (T) pin(T.sel, true); else unpin();
    });
    tlEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !pg.L) return;
      var w = pg.clubAt(local(e, tpxEl)), fc = document.activeElement && document.activeElement.closest && document.activeElement.closest('.r-fc');
      pg.clubTo(w ? w.c : fc && moEl.contains(fc) ? fc.getAttribute('data-c') : null);
      if (w) { tlEl.style.cursor = ''; point(null); return; }
      var R = pg.nearMark(e, 8);
      tlEl.style.cursor = R ? 'pointer' : '';
      point(pg.markTarget(R));
    });
    tlEl.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      var fc = document.activeElement && document.activeElement.closest && document.activeElement.closest('.r-fc');
      pg.clubTo(fc && moEl.contains(fc) ? fc.getAttribute('data-c') : null);
      point(null);
    });
    tlEl.addEventListener('click', function (e) {
      if (!pg.L) return;
      /* (Enter or Space on a club's name, reached by Tab: its stretch, as its focus shows it) */
      var kb = e.target.closest && e.target.closest('.r-fc');
      if (kb && !e.detail) { pg.clubTo(kb.getAttribute('data-c')); return; }
      var lp = local(e, tpxEl), touch = e.pointerType === 'touch' || pg.L.phone, w = pg.clubAt(lp), R = pg.nearMark(e, touch ? 16 : 8);
      /* (a finger on the line by a mark: the mark, though a club's name above it reaches down that far for a finger) */
      if (w && R && touch && lp[1] >= pg.TL.ay - 5 && !(lp[0] >= w.x0 + 6 && lp[0] < w.x1 - 6 && lp[1] < w.y1 - 15)) w = null;
      if (w) { if (touch) pg.clubTo(S.club === w.c ? null : w.c); return; }
      var T = pg.markTarget(R);
      if (T) pin(T.sel, true);
    });
    moEl.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('.r-fc'); if (b) pg.clubTo(b.getAttribute('data-c')); });
    moEl.addEventListener('focusout', function (e) {
      var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.r-fc');
      if (!to) pg.clubTo(null);
    });
    if (yearsEl) yearsEl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button.r-y');
      if (!b || b.getAttribute('data-y') === S.year) return;
      pg.swap(b.getAttribute('data-y'));
    });
    sea.addEventListener('pointerdown', function () { sea.classList.add('r-ptr'); }, true);
  }
  Object.assign(pg, { listen: listen, unpin: unpin, arm: arm, disarm: disarm, endPreview: endPreview, here: here, inHand: inHand, local: local, pin: pin, point: point, preview: preview, shown: shown, styleOn: styleOn, syncUrl: syncUrl, wire: wire });
}
