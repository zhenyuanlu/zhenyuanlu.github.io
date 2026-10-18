// An article's behaviour (the draft v2ac's article(), write.js): what the server wrote reads without it.
//   the rail: the entry being read is marked; the rail steps aside while a block wider than the text passes under it
//   the cards: a citation's (what the source is) or a footnote's (the note itself), by the pointer, the keyboard's
//     focus, or a finger's tap; Escape closes it; a click on the mark goes to its place in the list at the end
//   share: one button, its menu (copy link with a fallback for plain http, X, LinkedIn, Facebook, email, and the
//     device's own sheet where there is one); copy: a code block or the post's citation
//   measures for the widths beyond the measure; formulas set smaller on a phone until they fit, else they scroll
//   live figures (scripts/live.js) and animations that wait for play
import { on, phone, reduced } from './hub.js';
import { snap } from './lettering/index.js';
import { zoom } from './wide.js';
import { mountLive } from './live.js';
import { arrowSvg } from '../lib/arrows.mjs';

const art = document.querySelector('.a-art');
if (art) setup(art);

function setup(art) {
  const card = art.querySelector('.a-card');
  const live = art.querySelector('p.sr[role="status"]');
  const rail = art.querySelector('.a-rail');
  const toc = rail && rail.querySelector('.a-toc');
  const body = art.querySelector('.w-body');

  /* ---- measures for the sheet: device px a page px (pictures never past their own pixels), the window's width,
     how far the text's column stands from the window's left (a .a-win block reaches the window's edges) ---- */
  let wides = [];
  function measures() {
    art.style.setProperty('--a-dpr', String(window.devicePixelRatio || 1));
    held();
    const br = document.body.getBoundingClientRect(), tl = body ? body.getBoundingClientRect().left : br.left;
    art.style.setProperty('--a-vw', br.width + 'px');
    art.style.setProperty('--a-winl', (tl - br.left) + 'px');
    const rr = rail ? rail.getBoundingClientRect() : null;
    wides = !body || !rr || !rr.width ? [] : [...body.children].filter((k) => k.getBoundingClientRect().right > rr.left - 8);
    backPlace();
  }
  /* (the big-screen mode: the way back is a control, a box zoomed back to the window's px, wide.css .w-door, but
     it stands in the zoomed page, whose px come out a fraction off the window's: 91.41 for the plain page's 91 at
     100%, so its arrow, an antialiased drawing, was drawn a fraction lower than there. It is moved to the whole px
     of the window the plain page gives it, in its own px, and its word, a pixel drawing, is put on the grid again) */
  const backEl = art.querySelector('.a-head > .a-bk2');
  function backPlace() {
    if (!backEl) return;
    backEl.style.top = '';
    if (!(zoom && zoom.k > 1)) return;
    const y = zoom.rawRect(backEl).top + window.scrollY * zoom.z, dy = Math.round((Math.round(y) - y) * 64) / 64;
    if (dy) backEl.style.top = dy + 'px';
    backEl.querySelectorAll('canvas').forEach((cv) => snap(cv));
  }
  /* (a phone: of two files near a picture's need Chrome may take the narrower, and the sheet, which knows only the
     largest, would draw it past the pixels of the one it took. There each picture is held to the width of the file
     it took, in the screen's device pixels, once that file is known (its srcset's own width for it), and again
     when one comes and at a new size: smaller, never soft, and whole, its shape keeping its height. A desk keeps
     the sheet's width) */
  const pics = [...art.querySelectorAll('.w-cover img, .w-fig img')];
  function fileW(img) {
    const u = img.currentSrc, pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
    if (!u) return 0;
    for (const set of [img.srcset, ...(pic ? [...pic.querySelectorAll('source')].map((s) => s.srcset) : [])]) {
      for (const c of (set || '').split(',')) {
        const [src, d] = c.trim().split(/\s+/);
        if (src && /^\d+w$/.test(d || '') && new URL(src, location.href).href === u) return parseInt(d, 10);
      }
    }
    return 0;
  }
  function held() {
    const dpr = window.devicePixelRatio || 1, ph = phone();
    pics.forEach((img) => {
      const fw = ph ? fileW(img) : 0, v = fw ? `min(100%, ${Math.floor((fw / dpr) * 64) / 64}px)` : '';
      if ((img.__held || '') !== v) { img.__held = v; img.style.maxWidth = v; }
    });
  }
  pics.forEach((img) => img.addEventListener('load', held));
  measures();

  /* ---- formulas: a desk's scroll in their own box (and a keyboard stop where there is something to scroll); on a
     phone each is set smaller until it fits, never below 15px: a longer one scrolls in its box there too ---- */
  function fitMath() {
    art.querySelectorAll('.a-eq-s').forEach((m) => {
      m.style.fontSize = '';
      if (phone()) {
        for (let k = 0; k < 3 && m.scrollWidth > m.clientWidth + 1; k++) {
          const f = parseFloat(getComputedStyle(m).fontSize);
          m.style.fontSize = Math.max(15, Math.floor(f * m.clientWidth / m.scrollWidth * 10) / 10) + 'px';
        }
      }
      const over = m.scrollWidth > m.clientWidth + 1;
      if (over) { m.setAttribute('tabindex', '0'); m.setAttribute('role', 'group'); m.setAttribute('aria-label', 'formula, scrolls sideways'); }
      else { m.removeAttribute('tabindex'); m.removeAttribute('role'); m.removeAttribute('aria-label'); }
    });
  }
  fitMath();

  /* ---- the small pixel signs (share, play) on whole device pixels ---- */
  function signs() {
    const dpr = window.devicePixelRatio || 1;
    art.style.setProperty('--b-px', (Math.max(1, Math.round(dpr)) / dpr) + 'px');
    /* (a sign in a row of links, share's and the post's own, is a control: in the big-screen mode it stands in the
       window's px, wide.css .b-lk, and is put on the device grid there, lettering's snap) */
    art.querySelectorAll('.b-ic').forEach((sg) => { sg.__ui = !!sg.closest('.b-lk'); snap(sg); });
  }
  signs();
  requestAnimationFrame(signs);

  /* ---- live figures, and the animations that wait for play ---- */
  const lives = [...art.querySelectorAll('.a-live')].map(mountLive).filter(Boolean);
  const anims = [...art.querySelectorAll('.a-anim')].map(mountAnim).filter(Boolean);

  /* ---- the contents: the entry being read, marked; a wide block passing under the rail takes it out of its way ---- */
  const entries = [...art.querySelectorAll('.a-rail .a-te')], folded = [...art.querySelectorAll('.a-tocf .a-te')];
  const targets = entries.map((a) => document.getElementById(decodeURIComponent((a.getAttribute('href') || '').slice(1))));
  let spyRaf = 0, curI = -2;
  const headerBottom = () => { const hd = document.querySelector('.ih'); return hd ? hd.getBoundingClientRect().bottom : 0; };
  function spy() {
    spyRaf = 0;
    const line = headerBottom() + Math.min(160, window.innerHeight * 0.2);
    let k = -1;
    targets.forEach((t, j) => { if (t && t.getBoundingClientRect().top <= line) k = j; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2 && targets.length) {
      const lastT = targets[targets.length - 1];
      if (lastT && lastT.getBoundingClientRect().top < window.innerHeight) k = targets.length - 1;
    }
    if (k !== curI) {
      curI = k;
      [entries, folded].forEach((list) => list.forEach((a, j) => { if (j === k) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }));
    }
    if (toc) {
      const r = toc.getBoundingClientRect();
      const away = wides.some((w) => { const b = w.getBoundingClientRect(); return b.bottom > r.top - 8 && b.top < r.bottom + 8; });
      rail.classList.toggle('a-away', away);
    }
  }
  const spySoon = () => { if (!spyRaf) spyRaf = requestAnimationFrame(spy); };
  addEventListener('scroll', spySoon, { passive: true });
  spySoon();

  /* ---- a place in the article (a contents' entry, a pointer, a mark, a way back): the browser scrolls to it, just
     under the header (scroll-padding), and the place takes the focus; the folded contents close on a phone ---- */
  art.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const t = document.getElementById(id);
    if (!t) return;
    if (markOf(a) === a && (lastPtr === 'touch' || lastPtr === 'pen')) {   // a finger: the card first
      e.preventDefault();
      if (cardFor === a && !card.hidden) hideCard(); else showCard(a, true);
      return;
    }
    hideCard();
    requestAnimationFrame(() => {
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
      spySoon();
    });
    const fd = a.closest('.a-tocf');
    if (fd && phone()) fd.open = false;
  });

  /* ---- a talk's way back (the head's word, to its row in build's talks, /build/#<slug>): followed in this tab, it
     leaves word of it and of how (a key, or a pointer) for build's landing (scripts/build/index.js), which gives the
     row the focus as the draft's router did for a link followed (inner.js land) ---- */
  const back = art.querySelector('.a-bk2[href*="#"]');
  if (back) back.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    try {
      const u = new URL(back.href);
      sessionStorage.setItem('zl-land', JSON.stringify({ to: u.pathname + u.hash, key: e.detail === 0, t: Date.now() }));
    } catch (err) { /* (storage refused: the row is landed on unfocused, as an address opened) */ }
  });

  /* ---- a phone: a card or the share menu opened past the window's foot brings itself in, the page scrolled by as
     much as it runs past (smoothly; at once under reduced motion), never so far that its head (a card's mark, the
     menu's first word) goes under the header: a finger's scroll from off it would close it ---- */
  function bring(top, bottom) {
    const over = Math.min(bottom + 12 - window.innerHeight, top - headerBottom() - 8);
    if (over > 0) window.scrollBy({ top: over, behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ---- a mark's card: a source (a citation) or the note itself (a footnote), on paper with a hairline; one a
     finger or the keyboard opens (near) is brought in on a phone, one a pointer's hover opens is not ---- */
  let lastPtr = 'mouse', cardFor = null, cardT = 0;
  const markOf = (t) => (t && t.closest ? t.closest('.a-cm, .a-fm a') : null);
  /* (a mark's place: on a phone its box less the room a finger is given round it, article.css, a padding its
     margin takes back, so its card stands 8px from its figures as before; on a desk its box) */
  function placeOf(a) {
    const r = a.getBoundingClientRect();
    if (!phone()) return r;
    const cs = getComputedStyle(a), m = (k) => parseFloat(cs[k]) || 0;
    return { left: r.left - m('marginLeft'), top: r.top - m('marginTop'), bottom: r.bottom + m('marginBottom') };
  }
  function showCard(a, near) {
    clearTimeout(cardT);
    const fn = a.getAttribute('data-fn');
    card.textContent = '';
    if (fn) {
      const li = document.getElementById('fn-' + fn), rb = li && li.querySelector('.a-rb');
      if (!rb) return;
      const p = document.createElement('div');
      p.className = 'a-nt';
      const n = document.createElement('span');
      n.className = 'a-rn num'; n.textContent = fn;
      p.appendChild(n);
      [...rb.childNodes].forEach((c) => { if (!(c.nodeType === 1 && c.classList.contains('a-back'))) p.appendChild(c.cloneNode(true)); });
      card.appendChild(p);
    } else {
      const n = a.getAttribute('data-ref'), li = document.getElementById('ref-' + n);
      if (!li) return;
      const add = (cls, text, child) => { const p = document.createElement('p'); p.className = cls; if (child) p.appendChild(child); if (text) p.appendChild(document.createTextNode(text)); card.appendChild(p); return p; };
      const num = document.createElement('span');
      num.className = 'a-rn num'; num.textContent = n;
      add('a-rt', li.querySelector('.a-rt')?.textContent || '', num);
      add('a-ra', li.getAttribute('data-short') || '');
      add('a-ra', li.querySelector('.a-rv')?.textContent || '');
      const ru = li.querySelector('.a-ru');
      if (ru) {
        const link = ru.cloneNode(true);
        link.textContent = ru.textContent + ' ';
        link.insertAdjacentHTML('beforeend', arrowSvg('r'));   /* (the arrow drawn, as every arrow of the site: lib/arrows.mjs) */
        add('a-cl', '', link);
      }
    }
    card.classList.toggle('a-cn', !!fn);
    card.hidden = false;
    if (cardFor && cardFor !== a) cardFor.removeAttribute('aria-describedby');
    cardFor = a;
    a.setAttribute('aria-describedby', 'a-card');
    const ar = art.getBoundingClientRect(), mr = placeOf(a), cw = card.offsetWidth, ch = card.offsetHeight;
    const left = Math.max(0, Math.min(ar.width - cw, mr.left - ar.left - 16));
    let topY = mr.bottom - ar.top + 8;
    if (mr.bottom + 8 + ch > window.innerHeight - 8 && mr.top - ch - 8 > headerBottom()) topY = mr.top - ar.top - ch - 8;
    card.style.left = left + 'px'; card.style.top = topY + 'px';
    if (near && phone()) bring(Math.min(mr.top, ar.top + topY), ar.top + topY + ch);
  }
  function hideCard() {
    clearTimeout(cardT);
    card.hidden = true;
    if (cardFor) cardFor.removeAttribute('aria-describedby');
    cardFor = null;
  }
  const hideSoon = () => { clearTimeout(cardT); cardT = setTimeout(hideCard, 180); };
  document.addEventListener('pointerdown', (e) => {
    lastPtr = e.pointerType || 'mouse';
    if (lastPtr === 'touch' && !card.hidden && !(e.target.closest && (e.target.closest('.a-card') || markOf(e.target)))) hideCard();
  }, true);
  art.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const a = markOf(e.target);
    if (a) { clearTimeout(cardT); if (cardFor !== a || card.hidden) cardT = setTimeout(() => showCard(a), 60); return; }
    if (e.target.closest && e.target.closest('.a-card')) clearTimeout(cardT);
  });
  art.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'touch') return;
    const from = markOf(e.target) || (e.target.closest && e.target.closest('.a-card'));
    const to = e.relatedTarget && e.relatedTarget.closest ? (markOf(e.relatedTarget) || e.relatedTarget.closest('.a-card')) : null;
    if (from && !to) hideSoon();
  });
  art.addEventListener('focusin', (e) => {
    const a = markOf(e.target);
    if (a && a.matches(':focus-visible')) showCard(a, true);
    else if (!(e.target.closest && e.target.closest('.a-card'))) hideCard();
  });
  art.addEventListener('focusout', (e) => {
    const to = e.relatedTarget;
    if (!card.hidden && !(to && to.closest && (to.closest('.a-card') || markOf(to)))) hideSoon();
  });

  /* ---- share: the button opens its menu; Escape, a click outside it, the focus leaving it or a choice close it;
     by the keyboard the first word takes the focus and the arrows go up and down ---- */
  const shBox = art.querySelector('.a-share'), shBtn = shBox.querySelector('.a-sh'), shMenu = shBox.querySelector('.a-shm'), shWord = shBox.querySelector('.a-shw');
  const shMore = shMenu.querySelector('[data-share="more"]');
  if (shMore && navigator.share) shMore.parentNode.hidden = false;
  const shItems = () => [...shMenu.querySelectorAll('.a-shi')].filter((x) => !x.closest('[hidden]'));
  function shOpen(keys) {
    shMenu.hidden = false; shBtn.setAttribute('aria-expanded', 'true');
    if (keys) { const f = shItems()[0]; if (f) f.focus(); }
    /* (a phone: brought in when it opens past the window's foot; measured by its place under the button, not its
       box, which starts its 4px slide) */
    if (phone()) { const t = shBox.getBoundingClientRect().top + shMenu.offsetTop; bring(t, t + shMenu.offsetHeight); }
  }
  function shClose(back) { if (shMenu.hidden) return; shMenu.hidden = true; shBtn.setAttribute('aria-expanded', 'false'); if (back) shBtn.focus(); }
  function copyLink() {
    const s = location.origin + location.pathname;
    if (!shBtn.style.minWidth) shBtn.style.minWidth = shBtn.getBoundingClientRect().width + 'px';
    copyText(s).then(() => { shWord.textContent = 'link copied'; shBtn.classList.add('a-copied'); live.textContent = 'link copied'; },
      () => { shWord.textContent = 'not copied'; live.textContent = 'the link was not copied'; }).then(() => {
      clearTimeout(shBtn.__t);
      shBtn.__t = setTimeout(() => { shWord.textContent = 'share'; shBtn.classList.remove('a-copied'); live.textContent = ''; }, 1800);
    });
  }
  shBtn.addEventListener('click', (e) => { if (shMenu.hidden) shOpen(e.detail === 0); else shClose(false); });
  shMenu.addEventListener('click', (e) => {
    const it = e.target.closest && e.target.closest('.a-shi');
    if (!it) return;
    const id = it.getAttribute('data-share');
    if (id === 'copy') { copyLink(); shClose(true); }
    else if (id === 'more') {
      shClose(true);
      const canon = document.querySelector('link[rel="canonical"]');
      try { navigator.share({ title: document.querySelector('.w-h')?.textContent || document.title, url: canon ? canon.href : location.href }).catch(() => {}); } catch (er) { /* refused */ }
    } else setTimeout(() => shClose(false), 0);
  });
  shBox.addEventListener('keydown', (e) => {
    if (shMenu.hidden || !/^(ArrowDown|ArrowUp|Home|End)$/.test(e.key)) return;
    const L = shItems(), i = L.indexOf(document.activeElement);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? L.length - 1 : e.key === 'ArrowDown' ? (i + 1) % L.length : i < 0 ? L.length - 1 : (i - 1 + L.length) % L.length;
    e.preventDefault();
    if (L[j]) L[j].focus();
  });
  shBox.addEventListener('focusout', (e) => { const to = e.relatedTarget; if (to && !shBox.contains(to)) shClose(false); });
  document.addEventListener('pointerdown', (e) => { if (!shMenu.hidden && !(e.target.closest && e.target.closest('.a-share'))) shClose(false); }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!shMenu.hidden) { e.preventDefault(); shClose(shBox.contains(document.activeElement) || document.activeElement === document.body); return; }
    if (!card.hidden) { const a = cardFor; hideCard(); if (a && document.activeElement && card.contains(document.activeElement)) a.focus(); }
  });

  /* ---- copy: a code block, the post's citation. The word says "copied" for a moment, in the accent ---- */
  art.querySelectorAll('.a-copy').forEach((b) => { b.hidden = false; });
  art.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.a-copy');
    if (!b) return;
    const pre = b.closest('.a-code').querySelector('pre');
    const s = [...pre.querySelectorAll('.a-ln')].map((l) => l.textContent.replace(/^ $/, '')).join('\n') || pre.textContent;
    const word = b.getAttribute('data-word') || b.textContent;
    b.setAttribute('data-word', word);
    if (!b.style.minWidth) b.style.minWidth = b.getBoundingClientRect().width + 'px';
    copyText(s).then(() => { b.textContent = 'copied'; b.classList.add('a-copied'); live.textContent = 'copied'; },
      () => { b.textContent = 'not copied'; live.textContent = 'not copied'; }).then(() => {
      clearTimeout(b.__t);
      b.__t = setTimeout(() => { b.textContent = word; b.classList.remove('a-copied'); live.textContent = ''; }, 1600);
    });
  });

  /* ---- a new width, a new scale, a new light. The share menu stays open where it is (it hangs from its button, so it
     moves with it: a phone's toolbar, a zoom or a turned screen does not take it away, nor the focus in it); a card
     placed for the old layout goes, and the focus it held goes back to its mark ---- */
  let rz = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      measures(); fitMath(); signs(); lives.forEach((l) => l.size());
      if (!card.hidden) { const a = cardFor, inCard = card.contains(document.activeElement); hideCard(); if (a && inCard) a.focus({ preventScroll: true }); }
      spySoon();
    });
  });
  on('stage', () => lives.forEach((l) => l.draw()));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measures(); fitMath(); signs(); lives.forEach((l) => l.size()); spySoon(); });
  addEventListener('load', () => { measures(); spySoon(); });
  void anims;
}

/* the clipboard where the page may use it; the old way where it may not (a plain http address, as the LAN copy's) */
async function copyText(s) {
  function old() {
    const ta = document.createElement('textarea'), was = document.activeElement;
    let ok = false;
    ta.value = s; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.left = '0'; ta.style.top = '0'; ta.style.width = '1px'; ta.style.height = '1px'; ta.style.opacity = '0'; ta.style.pointerEvents = 'none';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    if (was && was.focus) was.focus({ preventScroll: true });
    return ok ? Promise.resolve() : Promise.reject(new Error('copy'));
  }
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    try { await navigator.clipboard.writeText(s); return; } catch (e) { /* refused: the old way */ }
  }
  return old();
}

/* an animation that waits for play (a .gif in a post): its first frame stands until he presses play; pause brings
   the still back. Under reduced motion there is no play */
function mountAnim(fig) {
  const img = fig.querySelector('img'), k = fig.querySelector('.a-live-k'), btn = k && k.querySelector('.a-play');
  const src = fig.getAttribute('data-anim');
  if (!img || !btn || !src || reduced()) return null;
  const still = img.getAttribute('src');
  k.hidden = false;
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'pause the animation' : 'play the animation');
    btn.querySelector('.a-pw').textContent = on ? 'pause' : 'play';
    fig.classList.toggle('a-on', on);
    img.src = on ? `${src}#${Date.now()}` : still;
  });
  return { stop() {} };
}
