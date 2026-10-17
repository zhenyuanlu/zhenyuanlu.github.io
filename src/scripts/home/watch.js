// The home's own net (F4; the speed round, 2026-10-16): a file of its own (layouts/Home.astro), so it runs whether
// the engine's does or not. Once the page has loaded the engine has either set the home on its line (main.flow
// data-live) or not started: its file did not come, or it threw (page.js says so itself). Not started, the page takes
// the look it has for a reader without script (html without its js class: home.css's html:not(.js) rules): the
// cities' plain icons, the marks' names, the footer line, the home shown. Where no module runs at all (this file
// blocked or failed with the others), the sheet is the net by itself: from 2s it shows the home in that same look
// (home.css, zl-home-show and the rules after it), but for a city's colour icon in hand.
const flow = document.querySelector('main.flow');
const plain = () => { if (flow && !flow.hasAttribute('data-live')) document.documentElement.classList.remove('js'); };
if (flow) { if (document.readyState === 'complete') plain(); else addEventListener('load', plain, { once: true }); }
