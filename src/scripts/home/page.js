// The home page's script (layouts/Home.astro): every page's own first (../site.js: the fader, the frame on the device
// grid, the footer's heart), then the home's engine on the home the server printed (pages/index.astro), given what
// only the page knows: the races for race's grey line (#home-races, model.js homeRaces) and the day, Boston's, or the
// address's ?today=YYYY-MM-DD where it names one (the home on another day, as the draft could show it): today.js.
// The home lets its door go as the page goes, and gives the keyboard's door the focus again when Back brings the page
// back from the browser's cache (doors.js); the light another page set meanwhile comes with it (fader.js).
// An address that names one of the old home's sections (/#publications, ...) goes on to its page instead, and the
// engine is never started (old-anchors.js).
import '../site.js';
import { zoom } from '../wide.js';   /* (the big-screen mode's engine, null where it is off: the home grows as one composition) */
import { mountHome } from './index.js';
import { todayOf } from '../today.js';
import { followOldAnchor } from './old-anchors.js';

const flow = document.querySelector('main.flow');
let races = null;
try { races = JSON.parse(document.getElementById('home-races').textContent); } catch (e) { /* none: race's line keeps its own words */ }
/* (a mount that fails, F4: mountHome puts the home back as printed, and the page takes, at once, the look it has for
   a reader without script: the cities' plain icons, the marks' names, the footer line, none left blank for a drawing
   that never came; watch.js does the same where this file never ran) */
if (flow && !followOldAnchor()) {
  try { mountHome(flow, { races }, { today: todayOf(location.search), zoom }); } catch (e) { document.documentElement.classList.remove('js'); console.error('home: the engine could not start; the home stays as printed', e); }
}
