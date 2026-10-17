// What the hand is (the draft's home script, its first lines): the last pointer pressed, or the keyboard, so a focus
// can be told from a click (kbd: keyboard focus draws what a hover draws; a click's focus does not). The name's,
// the marks', the doors' and the cities' own listeners are in their modules; every one is the mount's (hm.listen),
// and goes with it.

export function installInput(hm) {
  Object.assign(hm, { kbd: kbd });
  hm.pointer = 'mouse';
  hm.listen(window, 'pointerdown', function (e) { hm.pointer = e.pointerType; }, true);
  hm.listen(window, 'keydown', function () { hm.pointer = 'key'; }, true);
  function kbd(el) { try { return el.matches(':focus-visible'); } catch (e) { return hm.pointer === 'key'; } }
}
