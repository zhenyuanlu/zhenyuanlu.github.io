// Words made safe to put into HTML: & < > " as their entities (the draft's V1K.esc). The race engine's (race/util.js)
// and the home's server render (home/render.js) share it.
export function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
