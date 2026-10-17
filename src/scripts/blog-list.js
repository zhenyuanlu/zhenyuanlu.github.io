// The blog list's behaviour (the draft v2ac's list(), write.js): the topics and the search, the frames, the
// description cut to the cover's height on a phone. The address keeps both (/blog/?topic=vision&q=words): a topic
// chosen is a step of its own in the history, the words typed replace the entry they are on. Nothing found says so
// in one grey line, with a way back to all. Without script the line is not shown and every post is listed.
import { phone, reduced } from './hub.js';
import { mountFrames, layoutFrames } from './frames.js';

const tl = document.querySelector('.w-time');
const tools = document.querySelector('.w-tools');
if (tl && tools) setup();

function setup() {
  const fl = tools.querySelector('.w-fl'), input = tools.querySelector('.w-find'), clear = tools.querySelector('.w-x');
  const live = document.querySelector('.w-live'), none = tl.querySelector('.w-none');
  const facets = [...fl.querySelectorAll('button[data-f]')].map((b) => b.getAttribute('data-f'));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // a row's tags become buttons: each chooses its topic, as the line does
  tl.querySelectorAll('span.w-tg[data-t]').forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'w-tg'; b.setAttribute('data-t', s.getAttribute('data-t')); b.setAttribute('aria-pressed', 'false');
    b.textContent = s.textContent;
    s.replaceWith(b);
  });
  const items = [...tl.querySelectorAll('.w-it')].map((li) => ({
    li, ts: (li.getAttribute('data-topics') || '').split(' ').filter(Boolean), hay: norm(li.getAttribute('data-hay')),
    cv: li.querySelector('.w-cv'), ds: li.querySelector('.w-ds'), dt: li.querySelector('.w-dt'),
  }));
  mountFrames(tl);

  // the state in the address
  const P = new URLSearchParams(location.search);
  let facet = P.get('topic') || 'all', q = P.get('q') || '';
  if (!facets.includes(facet)) facet = 'all';
  input.value = q;
  function address() {
    const u = new URL(location.href);
    u.search = '';
    if (facet !== 'all') u.searchParams.set('topic', facet);
    if (q.trim()) u.searchParams.set('q', q.trim());
    return u.pathname + u.search + u.hash;
  }
  function sync(push) { try { history[push ? 'pushState' : 'replaceState']({ facet, q }, '', address()); } catch (e) { /* fine */ } }
  sync();

  /* the words as tall as the cover on a phone: the description keeps the lines that fit between its title's line
     and the date (three at most; none, and it is not shown). On a desk the words are one group centred beside the
     cover, nothing cut */
  function clampAll() {
    const ph = phone();
    items.forEach((it) => {
      if (!it.ds || it.li.hidden) return;
      const st = it.ds.style;
      if (!ph) { st.removeProperty('--w-n'); it.ds.classList.remove('w-ds0'); return; }
      let n = 3;
      if (it.cv) {
        const ch = it.cv.getBoundingClientRect().height, lh = parseFloat(getComputedStyle(it.ds).lineHeight) || 20;
        if (!ch) return;
        const room = ch + 10 - it.dt.getBoundingClientRect().height - 4;
        n = Math.max(0, Math.min(3, Math.floor((room + 0.5) / lh)));
      }
      st.setProperty('--w-n', String(Math.max(1, n)));
      it.ds.classList.toggle('w-ds0', n === 0);
    });
  }
  let raf1 = 0;
  const soon = () => { cancelAnimationFrame(raf1); raf1 = requestAnimationFrame(() => { raf1 = requestAnimationFrame(clampAll); }); };

  function apply() {
    const words = norm(q).split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((it) => {
      const ok = (facet === 'all' || it.ts.includes(facet)) && words.every((w) => it.hay.includes(w));
      it.li.hidden = !ok;
      if (ok) shown++;
    });
    fl.querySelectorAll('button[data-f]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === facet)));
    tl.querySelectorAll('button.w-tg[data-t]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === facet)));
    const where = facet === 'all' ? '' : `on ${facet} `;
    none.textContent = '';
    if (!shown) {
      none.appendChild(document.createTextNode(q.trim() ? `Nothing ${where}matches “${q.trim()}”. ` : `Nothing ${where}yet. `));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'w-all'; b.textContent = 'show all';
      none.appendChild(b);
    }
    live.textContent = shown ? `${shown} of ${items.length} shown` : '';
    if (!q && document.activeElement === clear) input.focus({ preventScroll: true });
    clear.hidden = !q;
    layoutFrames();
    clampAll();
    soon();
  }
  apply();

  let swapT = 0;
  function setFacet(id) {
    if (id === facet) return;
    facet = id;
    sync(true);
    if (reduced()) { apply(); return; }
    clearTimeout(swapT);
    tl.classList.add('w-out');
    swapT = setTimeout(() => { apply(); tl.classList.remove('w-out'); }, 160);
  }
  function setQuery(v, keep) { q = v; if (!keep) input.value = v; sync(); apply(); }
  fl.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button[data-f]'); if (b) setFacet(b.getAttribute('data-f')); });
  tl.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-t]');
    if (!b) return;
    const id = b.getAttribute('data-t');
    setFacet(id === facet ? 'all' : id);
  });
  input.addEventListener('input', () => setQuery(input.value, true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); setQuery(''); }
    else if (e.key === 'Enter' && phone()) input.blur();
  });
  clear.addEventListener('click', () => { setQuery(''); input.focus(); });
  none.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('.w-all')) return;
    if (q) setQuery('');
    setFacet('all');
    const b = fl.querySelector('button[data-f="all"]');
    if (b) b.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !q || e.defaultPrevented) return;
    const a = document.activeElement;
    if (a && a !== input && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    setQuery('');
  });
  // Back and Forward through the topics chosen
  addEventListener('popstate', () => {
    const S = new URLSearchParams(location.search);
    facet = S.get('topic') || 'all'; if (!facets.includes(facet)) facet = 'all';
    q = S.get('q') || ''; input.value = q;
    apply();
  });
  // pointing at a topic in the line (or tabbing to it) inks it in every row that names it
  const ink = (id) => tl.querySelectorAll('.w-tg').forEach((s) => s.classList.toggle('w-hi', !!id && s.getAttribute('data-t') === id));
  fl.addEventListener('pointerover', (e) => { const b = e.target.closest && e.target.closest('button[data-f]'); ink(b ? b.getAttribute('data-f') : null); });
  fl.addEventListener('pointerleave', () => ink(null));
  fl.addEventListener('focusin', (e) => { const b = e.target.closest && e.target.closest('button[data-f]'); ink(b ? b.getAttribute('data-f') : null); });
  fl.addEventListener('focusout', () => ink(null));

  addEventListener('resize', () => { clampAll(); soon(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutFrames(); soon(); });

  // back from an entry: the focus returns to its title, where nothing else took it (and that starts nothing)
  tl.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a.w-a, a.w-cv');
    if (a) { try { sessionStorage.setItem('zl-opened', a.getAttribute('href')); } catch (er) { /* none */ } }
  });
  addEventListener('pageshow', () => {
    let back = null;
    try { back = sessionStorage.getItem('zl-opened'); sessionStorage.removeItem('zl-opened'); } catch (er) { /* none */ }
    if (!back) return;
    requestAnimationFrame(() => {
      const a = tl.querySelector(`a.w-a[href="${CSS.escape(back)}"]`);
      if (a && !a.closest('[hidden]') && (!document.activeElement || document.activeElement === document.body)) a.focus({ preventScroll: true });
    });
  });
}
