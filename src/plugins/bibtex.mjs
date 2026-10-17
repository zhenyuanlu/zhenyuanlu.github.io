// A small BibTeX reader for the posts' refs.bib files: entries in, plain records out
// ({ key, type, title, authors[], venue, year, url }), the shape a reference card and the list at the end of a
// post need. It reads what the posts' files hold (and what Google Scholar, DBLP, ACL Anthology and arXiv write):
// @type{key, field = {braced} | "quoted" | number | macro, ...}, nested braces, # concatenation, @string macros,
// @comment and @preamble skipped; the common LaTeX accents and escapes become Unicode.

const ACCENT = {
  "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', c: 'ć', n: 'ń', s: 'ś', z: 'ź', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý', C: 'Ć', N: 'Ń', S: 'Ś', Z: 'Ź' },
  '`': { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù' },
  '^': { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', A: 'Â', E: 'Ê', I: 'Î', O: 'Ô', U: 'Û' },
  '"': { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', y: 'ÿ', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü' },
  '~': { a: 'ã', n: 'ñ', o: 'õ', A: 'Ã', N: 'Ñ', O: 'Õ' },
  c: { c: 'ç', C: 'Ç', s: 'ş', S: 'Ş' },
  v: { c: 'č', s: 'š', z: 'ž', r: 'ř', e: 'ě', C: 'Č', S: 'Š', Z: 'Ž', R: 'Ř' },
  u: { a: 'ă', g: 'ğ', A: 'Ă', G: 'Ğ' },
  '=': { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' },
  '.': { z: 'ż', Z: 'Ż', I: 'İ' },
  H: { o: 'ő', u: 'ű', O: 'Ő', U: 'Ű' },
};
const SYMBOL = { ss: 'ß', o: 'ø', O: 'Ø', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', l: 'ł', L: 'Ł', i: 'ı', j: 'ȷ' };

/** LaTeX in a field to plain Unicode text. */
export function detex(s) {
  let t = String(s ?? '');
  // accents: \'e, \'{e}, {\'e}, {\'{e}}, \"u, \c{c}, \v{s} ...
  t = t.replace(/\{?\\([`'^"~=.]|[cvuH])\s*\{?\s*([A-Za-z])\s*\}?\}?/g, (m, a, ch) => ACCENT[a]?.[ch] ?? ch);
  t = t.replace(/\{?\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)\b\}?/g, (m, k) => SYMBOL[k] ?? m);
  t = t.replace(/\\([&%$#_{}])/g, '$1');
  t = t.replace(/\\textendash\b\s*/g, '–').replace(/\\textemdash\b\s*/g, '—');
  t = t.replace(/\\(?:emph|textit|textbf|textrm|textsc|mathrm|text)\s*\{([^{}]*)\}/g, '$1');
  t = t.replace(/---/g, '—').replace(/--/g, '–');
  t = t.replace(/~/g, ' ');
  t = t.replace(/[{}]/g, '');
  t = t.replace(/\\\s/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

/** The typesetter's pass over a field's words, as the Markdown has (smartypants) and draft v2t's typo() did (taste
    item 13): curly quotes and apostrophes (TeX's `` and '' too) and an en dash between two years. */
export function typeset(s) {
  let t = String(s ?? '');
  const Q = { lq: '“', rq: '”', ls: '‘', rs: '’', nd: '–' };
  t = t.replace(/``/g, Q.lq).replace(/''/g, Q.rq);
  t = t.replace(/(^|[\s(\[—–-])"(?=\S)/g, `$1${Q.lq}`).replace(/"/g, Q.rq)
    .replace(/(\w)'(\w)/g, `$1${Q.rs}$2`).replace(/(^|[\s(\[—–-])'(?=\S)/g, `$1${Q.ls}`).replace(/'/g, Q.rs);
  return t.replace(/\b((?:19|20)\d\d)-((?:19|20)\d\d)\b/g, `$1${Q.nd}$2`);
}

/** Every entry of a .bib text, its fields raw (as written, braces kept). */
export function parseBibtex(text) {
  const src = String(text ?? '');
  const out = [];
  const strings = { jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June', jul: 'July', aug: 'August', sep: 'September', oct: 'October', nov: 'November', dec: 'December' };
  let i = 0;
  while ((i = src.indexOf('@', i)) >= 0) {
    const head = /^@\s*([A-Za-z]+)\s*([{(])/.exec(src.slice(i));
    if (!head) { i++; continue; }
    const type = head[1].toLowerCase();
    const start = i + head[0].length;
    const j = matchClose(src, start - 1);
    const body = src.slice(start, j);
    i = j + 1;
    if (type === 'comment' || type === 'preamble') continue;
    if (type === 'string') {
      const f = fields(body, strings);
      Object.assign(strings, Object.fromEntries(Object.entries(f).map(([k, v]) => [k.toLowerCase(), v])));
      continue;
    }
    const km = /^\s*([^,\s]+)\s*,/.exec(body);
    if (!km) continue;
    out.push({ type, key: km[1], fields: fields(body.slice(km[0].length), strings) });
  }
  return out;
}

/** the index of the delimiter that closes the one at `at` ({ or (), braces nested, escapes skipped */
function matchClose(src, at) {
  const open = src[at], close = open === '{' ? '}' : ')';
  let depth = 0;
  for (let k = at; k < src.length; k++) {
    const c = src[k];
    if (c === '\\') { k++; continue; }
    if (open === '(') {
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === ')' && depth === 0) return k;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return k; }
  }
  return src.length;
}

function fields(body, strings) {
  const F = {};
  let k = 0;
  const n = body.length;
  const ws = () => { while (k < n && /[\s,]/.test(body[k])) k++; };
  ws();
  while (k < n) {
    const nm = /^([A-Za-z][\w:.+-]*)\s*=\s*/.exec(body.slice(k));
    if (!nm) { k++; ws(); continue; }
    k += nm[0].length;
    const parts = [];
    for (;;) {
      while (k < n && /\s/.test(body[k])) k++;
      if (body[k] === '{') {
        const e = matchClose(body, k);
        parts.push(body.slice(k + 1, e));
        k = e + 1;
      } else if (body[k] === '"') {
        let e = k + 1, d = 0;
        while (e < n && !(body[e] === '"' && d === 0)) { if (body[e] === '{') d++; else if (body[e] === '}') d--; else if (body[e] === '\\') e++; e++; }
        parts.push(body.slice(k + 1, e));
        k = e + 1;
      } else {
        const m = /^[^,#\s}]+/.exec(body.slice(k));
        const w = m ? m[0] : '';
        k += w.length;
        parts.push(/^\d+$/.test(w) ? w : strings[w.toLowerCase()] ?? w);
      }
      while (k < n && /\s/.test(body[k])) k++;
      if (body[k] === '#') { k++; continue; }
      break;
    }
    F[nm[1].toLowerCase()] = parts.join('');
    ws();
  }
  return F;
}

/** "Last, First" or "First Last" to "First Last"; a braced corporate name kept whole */
function person(raw) {
  const a = String(raw).trim();
  if (/^\{[^{}]*\}$/.test(a)) return detex(a);
  const parts = splitTop(a, ',');
  if (parts.length >= 2) return detex(parts.slice(1).join(' ') + ' ' + parts[0]);
  return detex(a);
}
/** split on a separator at brace depth 0 */
function splitTop(s, sep) {
  const out = [];
  let d = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') d++;
    else if (c === '}') d--;
    if (d === 0 && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
function authors(raw) {
  if (!raw) return [];
  const list = splitTop(String(raw).replace(/\s+/g, ' '), ' and ').map(person).filter(Boolean);
  return list.map((x) => (/^others$/i.test(x) ? 'et al.' : x));
}

/** where it appeared, as a reader says it */
function venue(F) {
  let v = detex(F.booktitle || F.journal || '');
  const tell = [F.publisher, F.doi, F.url, F.archiveprefix, F.eprinttype].join(' ');
  if (!v && /arxiv/i.test(tell)) v = 'arXiv';
  if (!v) v = detex(F.howpublished && !/\\url/.test(F.howpublished) ? F.howpublished : '') || detex(F.publisher || '') || detex(F.school || F.institution || '');
  v = v.replace(/^Computer Vision\s*[-–]\s*ECCV (\d{4})\s*[-–].*$/, 'ECCV $1')
    .replace(/^(\d{4}) IEEE Conference on Computer Vision and Pattern Recognition(?: \(CVPR\))?$/, 'CVPR $1')
    .replace(/^Proceedings of the (\d{4}) IEEE International Conference on Computer Vision \(ICCV\)$/, 'ICCV $1')
    .replace(/^arXiv preprint (arXiv:[\w./-]+)$/i, '$1');
  return v;
}
function link(F) {
  let u = detex(F.url || '');
  if (!u && F.doi) u = 'https://doi.org/' + detex(F.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  const ax = /arXiv:([\w./-]+)/i.exec(detex(F.journal || '') + ' ' + detex(F.booktitle || ''));
  if (!u && ax) u = 'https://arxiv.org/abs/' + ax[1];
  if (!u && F.eprint && /arxiv/i.test(F.archiveprefix || F.eprinttype || '')) u = 'https://arxiv.org/abs/' + detex(F.eprint);
  if (!u && F.pdf) u = detex(F.pdf);
  u = u.replace(/%2F/gi, '/');
  return /^https?:\/\//.test(u) ? u : '';
}

/** the plain records a page needs, keyed by the entry's key */
export function bibRecords(text) {
  const out = new Map();
  for (const e of parseBibtex(text)) {
    const F = e.fields;
    const year = parseInt(detex(F.year || ''), 10);
    const rec = { key: e.key, type: e.type, title: typeset(detex(F.title || '')), authors: authors(F.author || F.editor).map(typeset), venue: typeset(venue(F)), year: Number.isFinite(year) ? year : null };
    const u = link(F);
    if (u) rec.url = u;
    out.set(e.key, rec);
  }
  return out;
}
