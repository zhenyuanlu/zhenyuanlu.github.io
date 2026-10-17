// /build/'s behaviour (the draft v2ac's build.js, the end of its render): the pictures in hand (scripts/frames.js:
// a wide one travels while its card, face or talk is in hand, Waycine's film plays, a finger drags; a card with no
// link has its picture as the keyboard's stop), the links' signs on whole device pixels, the keyboard's focus
// kept clear of the sticky header, and the landing on a talk's row from its way back. The page reads without it:
// pages/build.astro writes everything.
import { mountFrames, layoutFrames } from '../frames.js';
import { on } from '../hub.js';
import { clearHeader } from '../header.js';
import { snap } from '../lettering/index.js';

const main = document.getElementById('ip');
const shelf = main && main.querySelector('.b-sw');
/* (a page made ready before the click, the speculation rules' prerender after a moment's hover on a talk's way
   back, lands when it is shown: the word of the way back is left by that click, after this script has run) */
if (main && shelf) { setup(); if (document.prerendering) document.addEventListener('prerenderingchange', land, { once: true }); else land(); }

function setup() {
  mountFrames(main);
  /* the signs on whole device pixels: a cell is a whole number of them (--b-px), and each sign starts on one (a 9px
     sign centred on a 20px line starts half a pixel down, and one after a run of words anywhere: snap moves it in
     layout by the fraction, as the lettering's canvases are moved) */
  function grid() {
    if (!shelf.isConnected) return;
    const dpr = window.devicePixelRatio || 1;
    main.style.setProperty('--b-px', (Math.max(1, Math.round(dpr)) / dpr) + 'px');
    /* (a sign in a row of links is a control: in the big-screen mode it stands in the window's px, wide.css .b-lk,
       and is put on the device grid there, lettering's snap) */
    main.querySelectorAll('.b-ic').forEach((sg) => { sg.__ui = !!sg.closest('.b-lk'); snap(sg); });
  }
  grid();
  main.addEventListener('focusin', clearHeader);
  requestAnimationFrame(grid);
  /* the web face moves every word, and so every sign after one: placed again each time a face has come (a face can
     come after fonts.ready has already answered, when its sheet was still on the way) */
  function faces() { grid(); layoutFrames(); }
  const FS = document.fonts;
  if (FS && FS.ready) FS.ready.then(faces);
  if (FS && FS.addEventListener) FS.addEventListener('loadingdone', faces);
  /* (and once more when the frames have been laid out again after a resize or a new scale: the pictures are snapped
     to the device grid then, and what stands after them moves by a fraction) */
  on('resize', grid);
  on('frames', grid);
}

/* the landing on a row from a talk's way back (/build/#<slug>, the article's head): the browser has brought the row
   up under the header by the sheet's scroll margins, as the draft's router did (inner.js land: scrollIntoView); the
   router then gave it the focus, for a link followed (not for an address opened, reloaded or gone back to). So here
   only for the way back just followed in this tab (article.js leaves word of it). The keyboard's mark shows as in
   the draft: where the link was followed by a key; after a pointer, not until a key is pressed (.b-land: a fresh
   page shows the mark for any focus a script gives, where the draft's page, which had just been clicked, did not) */
function land() {
  let L = null;
  try { L = JSON.parse(sessionStorage.getItem('zl-land') || 'null'); sessionStorage.removeItem('zl-land'); } catch (e) { return; }
  if (!L || L.to !== location.pathname + location.hash || !(Date.now() - L.t < 30000)) return;
  let id = location.hash.slice(1);
  try { id = decodeURIComponent(id); } catch (e) { /* as it is */ }
  const t = id ? document.getElementById(id) : null;
  if (!t || !main.contains(t)) return;
  if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
  if (!L.key) {
    const off = () => { t.classList.remove('b-land'); removeEventListener('keydown', off, true); t.removeEventListener('blur', off); };
    t.classList.add('b-land');
    addEventListener('keydown', off, true);
    t.addEventListener('blur', off);
  }
  t.focus({ preventScroll: true });
}

