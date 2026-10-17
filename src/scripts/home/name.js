// The name (the draft's home script, "the name: zhen · yuan · lu"): at rest simply the name; half a second of resting
// on it (or a click, a tap, Enter or Space) splits it into its syllables, the pinyin over each and the hanzi under,
// and a screen reader is told how it is said. It goes nowhere: there is no about page. Escape, a press elsewhere or
// the focus leaving closes it. Its letters are lettering.js's; the gaps it opens by are whole cells (lettersName).
// The server prints it as words (render.js): the engine makes it the button the draft's a[role=button] was, named by
// its data-label, and says its #said's data-say as it opens.
import { r } from './util.js';

export function installName(hm) {
  var nmr = hm.nmr, reduced = hm.reduced, said = hm.said, say = hm.say;
  var SAID = said.getAttribute('data-say') || hm.saidText;
  say.setAttribute('role', 'button');
  say.tabIndex = 0;
  say.setAttribute('aria-label', say.getAttribute('data-label') || hm.nameLabel || say.textContent);
  Object.assign(hm, { measureName: measureName });
  var nOpen = false, nDwell = 0, nGrace = 0, nSplit = 0;
  function nameSet(on) {
    hm.clear(nDwell); hm.clear(nGrace);
    if (on === nOpen) return;
    nOpen = on;
    hm.clear(nSplit);
    said.textContent = on ? SAID : '';
    if (on) {
      say.classList.add('split');
      void say.offsetWidth;                   /* the syllables become boxes first, then move */
      say.classList.add('open');
    } else {
      say.classList.remove('open');
      nSplit = hm.later(function () { say.classList.remove('split'); }, reduced() ? 0 : 260);
    }
  }
  /* slow on purpose: half a second of resting on it, so the name never competes with the doors */
  hm.listen(say, 'pointerenter', function (e) {
    if (e.pointerType === 'touch') return;
    hm.clear(nGrace);
    if (nOpen) return;
    hm.clear(nDwell);
    nDwell = hm.later(function () { nameSet(true); }, 500);
  });
  hm.listen(say, 'pointerleave', function (e) {
    if (e.pointerType === 'touch') return;
    hm.clear(nDwell);
    if (nOpen && !hm.kbd(say)) nGrace = hm.later(function () { nameSet(false); }, 120);
  });
  hm.listen(say, 'focus', function () { if (hm.kbd(say)) nameSet(true); });
  hm.listen(say, 'blur', function () { nameSet(false); });
  /* a click, a tap, Enter or Space opens or closes the name; it goes nowhere (there is no about page) */
  hm.listen(say, 'click', function (e) { e.preventDefault(); nameSet(!nOpen); });
  hm.listen(say, 'keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nameSet(!nOpen); }
  });
  hm.listen(document, 'keydown', function (e) { if (e.key === 'Escape') nameSet(false); });
  hm.listen(document, 'pointerdown', function (e) { if (nOpen && !say.contains(e.target)) nameSet(false); });
  /* the word space before "lu", in em, so both gaps come out at .5em when the name opens */
  function measureName() {
    if (hm.LS) { hm.lettersName(); return; }       /* the pixel letters open by whole cells */
    if (say.classList.contains('split')) return;
    var t = say.querySelectorAll('.tk'), a = t[1].getBoundingClientRect(), b = t[2].getBoundingClientRect();
    var fs = parseFloat(getComputedStyle(say).fontSize), sp = b.left - a.right;
    if (fs && sp > 0 && sp < fs) say.style.setProperty('--sp', (sp / fs).toFixed(3) + 'em');
    /* how far "lu" moves when the name opens (kept as --shift for anything set beside the name) */
    var spEm = parseFloat(say.style.getPropertyValue('--sp')) || .25;
    nmr.style.setProperty('--shift', r((1 - spEm) * fs) + 'px');
  }
}
