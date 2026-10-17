// Keyboard focus never rests under the sticky header: a focusin listener for a page's main, which build, teach and
// see's wall share (the draft wrote it into each of the three, pages/build.js, see.js, teach.js clearHeader). Chrome
// leaves alone an element that is inside the window but under the header (moving up the page), so once it has
// settled, it is brought down below the header. A module of its own, so the frame's script, which every page loads,
// does not carry it.
export function clearHeader(e) {
  const el = e.target;
  if (!el.matches || !el.matches(':focus-visible')) return;
  requestAnimationFrame(() => {
    const hd = document.querySelector('.ih');
    if (!hd || document.activeElement !== el) return;
    const hb = hd.getBoundingClientRect().bottom, r = el.getBoundingClientRect();
    if (r.top < hb + 8) window.scrollBy(0, r.top - hb - 24);
  });
}
