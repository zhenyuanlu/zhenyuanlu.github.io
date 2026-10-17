// The visitor stats (the owner's decision, 2026-10-16): Google Analytics 4, as the old site counted them, with its
// measurement id (content/site.yaml analytics.ga4; DEVELOPMENT.md, "Analytics"), which the head carries on every page of
// the real site (meta zl-ga4: components/DocHead.astro). The home also carries gtag.js's own tag, static, where
// Google Search Console looks for it (asked for at low priority); every other page adds gtag.js itself once it has
// loaded and the browser has an idle moment, so Google's 165 KB, and the ~200ms a phone takes to run it, never come
// between a reader and the page (race's map, a phone's first paint). And the home too, once analytics.verify proves
// the site by Search Console's own tag instead.
// Then the page is counted once, when it is shown: a page the browser made ready before the click (the speculation
// rules' prerender) as it is shown (prerenderingchange), and one it made ready and never showed not at all; a page put
// back from the back/forward cache not again (GA4's own way: nothing is sent at pageshow). No id on the page (the dev
// server, the LAN preview): nothing.
const SRC = 'https://www.googletagmanager.com/gtag/js?id=';
const meta = document.querySelector('meta[name="zl-ga4"]');
const id = meta ? meta.getAttribute('content') : null;
if (id) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  const count = () => { window.gtag('js', new Date()); window.gtag('config', id); };
  const own = () => !!document.querySelector(`script[src^="${SRC}"]`);
  const shown = () => {
    if (own()) { count(); return; }   /* (the home's static tag: counted as it is shown) */
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1));
    const later = () => idle(() => {
      if (!own()) { const s = document.createElement('script'); s.async = true; s.src = SRC + encodeURIComponent(id); document.head.appendChild(s); }
      count();
    }, { timeout: 3000 });
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  };
  if (document.prerendering) document.addEventListener('prerenderingchange', shown, { once: true });
  else shown();
}
