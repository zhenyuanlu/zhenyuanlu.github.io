// A tiny event hub the page modules share (the draft's V1K.on / emit): 'resize' (after the frame has laid
// itself out again), 'stage' (the light changed: day, dusk, night), 'frames' (the picture frames were laid out).
const subs = {};
export function on(name, fn) {
  (subs[name] = subs[name] || []).push(fn);
  return () => { subs[name] = (subs[name] || []).filter((f) => f !== fn); };
}
export function emit(name, d) {
  (subs[name] || []).slice().forEach((f) => { try { f(d); } catch (e) { console.error(e); } });
}
const mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const mqPhone = window.matchMedia ? matchMedia('(max-width: 999px)') : { matches: false };
export function reduced() { return mqReduce.matches; }
export function phone() { return mqPhone.matches; }
/** the stage's colours, as the sheet has them now */
export function tok() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d) => cs.getPropertyValue(n).trim() || d;
  return { ink: v('--ink', '#1b1b1b'), grey: v('--grey', '#666666'), bg: v('--bg', '#fcfcfa'), surface: v('--surface', '#f1f1ee'), line: v('--line', '#6b6b6b'), accent: v('--accent', '#a65412'), red: v('--now', '#c8352b') };
}
