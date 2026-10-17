// The Content-Security-Policy every built page carries in a <meta> (GitHub Pages sets no headers of ours).
// components/DocHead.astro (every page's head: layouts/Base.astro's and layouts/Home.astro's) writes it as the head's
// first element after the charset, so it governs all that follows, and
// adds the script and style rules: scripts are files from this site plus the light's one inline script, by its hash;
// stylesheets are files; style attributes are allowed. These are the rest. Nothing is loaded from another site but
// the visitor stats' own (below): the fonts, KaTeX and every picture are served from this one. (frame-ancestors,
// report-uri and sandbox cannot be set by a <meta>, so they are not here.)
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self'",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
];
// The visitor stats (Google Analytics 4, gtag.js; the owner's decision, 2026-10-16: DEVELOPMENT.md, "Analytics"), on the
// real site's pages where content/site.yaml names its measurement id: the one other origin a page loads a script from
// (DocHead adds it to script-src), and the hosts its counts go to (connect-src: its requests and beacons; img-src:
// the pixel it falls back to). Nothing broader; scripts/check-dist.mjs and check-budget.mjs allow these alone, and
// only for that tag.
export const GA_SCRIPT = 'https://www.googletagmanager.com';
export const GA_HOSTS = ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'];
/** the directives above, with the visitor stats' hosts where a page has the stats' tag (ga) */
export function cspDirectives({ ga = false } = {}) {
  return CSP_DIRECTIVES.map((d) => (ga && /^(img-src|connect-src) /.test(d) ? `${d} ${GA_HOSTS.join(' ')}` : d));
}
