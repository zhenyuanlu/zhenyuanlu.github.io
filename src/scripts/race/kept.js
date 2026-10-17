// The race map's choices kept for the next time the same map is laid out (the speed round, 2026-10-16). The placing's
// search (layout.js solve: each venue's row and its scene's room, chosen in turn, polished, then tried again in other
// orders) is what laying the map out costs most: 45 of 90ms on his screen, 380 of 590ms on a phone four times slower.
// It is deterministic: the same map (layout.js solveKey: everything the search reads) and the same places to keep off
// give the same choice. So the choice is written down, by that key, and a map laid out again with the same key (the
// window back at a size it had, the other season and back, a reload, Back to a page the browser did not keep, a visit
// another day) takes it without searching, and every pixel is what the search would have made.
// localStorage, under this engine's own name: the engine's built file's name, which the build hashes from its
// content and its imports' (any change to the placing, fit.js's or the lettering's included), and the page's
// stylesheets' names, hashed the same way (a sheet that changes what is measured). A choice another engine wrote is
// never taken, and is let go of at the next write; at most KEEP choices, the oldest let go. Every read and write in
// try/catch, and a choice that does not fit the map as it stands (layout.js choiceBack) is searched for again: a
// browser that refuses storage (or is full, or holds anything else there) lays the map out as ever, by searching.
const NS = 'zl-race-choice:';
const KEEP = 24;
const ENGINE = (() => {
  let js = '', css = '';
  try { js = new URL(import.meta.url).pathname.replace(/^.*\//, ''); } catch (e) { /* (no module address: js '') */ }
  try { css = [].map.call(document.querySelectorAll('link[rel~="stylesheet"][href]'), (l) => l.getAttribute('href').replace(/^.*\//, '')).sort().join(','); } catch (e) { /* (none read) */ }
  return js + '|' + css;
})();

/** cyrb53: a 53-bit hash of a string (the storage's own key; the whole key is kept and compared, so a clash is harmless) */
function h53(s) {
  let a = 0xdeadbeef, b = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
}

/** the choice kept for this key by this engine, or null */
export function choiceGet(key) {
  try {
    const raw = localStorage.getItem(NS + h53(ENGINE + '|' + key));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && v.e === ENGINE && v.k === key ? v : null;
  } catch (e) { return null; }
}

/** a choice written down for this key; the oldest let go past KEEP, and any of another engine's */
export function choiceSet(key, rec) {
  try {
    localStorage.setItem(NS + h53(ENGINE + '|' + key), JSON.stringify(Object.assign({ e: ENGINE, k: key, t: Date.now() }, rec)));
    const mine = [];
    for (let i = 0; i < localStorage.length; i++) {
      const id = localStorage.key(i);
      if (!id || id.indexOf(NS) !== 0) continue;
      let v = null;
      try { v = JSON.parse(localStorage.getItem(id) || 'null'); } catch (e) { v = null; }
      if (!v || v.e !== ENGINE) mine.push([id, -1]); else mine.push([id, v.t || 0]);
    }
    const old = mine.filter((x) => x[1] < 0).concat(mine.filter((x) => x[1] >= 0).sort((x, y) => x[1] - y[1]).slice(0, Math.max(0, mine.filter((x) => x[1] >= 0).length - KEEP)));
    old.forEach((x) => localStorage.removeItem(x[0]));
  } catch (e) { /* no storage, or full: nothing kept */ }
}
