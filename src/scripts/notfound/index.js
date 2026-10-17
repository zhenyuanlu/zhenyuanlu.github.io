// The 404 page's traveller (the draft v2ac's 404.js): he stands still at the end of the page's closing line, where
// the road stops (stand.json: the race's standing act, drawn by another hand). He is drawn the home's way: by day and
// dusk his ink and the red scarf; by night a dark slate coat with a moonlit edge, a cream face and the warmer scarf,
// never white. Cells of 2 CSS px in whole device pixels; where a cell comes to 4 device px or more, his HD drawing in
// half cells. Without script he is simply not there.
import STAND from './stand.json';
import { on, tok } from '../hub.js';
import { zoom } from '../wide.js';

const DAY = { s: '#c4381b' };
const NIGHT = { k: '#2b3040', rim: '#606a84', face: '#d6ccbb', e: '#131418', s: '#e2604a' };

const road = document.querySelector('#inner .close');
const rows = STAND && STAND.frames && (STAND.frames.stand || STAND.frames[STAND.still]);
if (road && Array.isArray(rows) && rows.length) setup();

/* his face: the empty cells his eyes reach without leaving the drawing (none if they reach its edge) */
function faceOf(R) {
  const h = R.length, w = R[0].length, seen = {}, todo = [], F = {};
  let leak = false;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (R[j][i] === 'e') todo.push(j * w + i);
  while (todo.length) {
    const k = todo.pop(), x = k % w, y = (k - x) / w;
    if (seen[k]) continue;
    seen[k] = true;
    if (R[y][x] === '.') F[k] = true;
    for (let d = 0; d < 4; d++) {
      const a = x + [1, -1, 0, 0][d], b = y + [0, 0, 1, -1][d];
      if (a < 0 || b < 0 || a >= w || b >= h) { leak = true; continue; }
      if (R[b][a] === '.' && !seen[b * w + a]) todo.push(b * w + a);
    }
  }
  return leak ? {} : F;
}
function stage() { return document.documentElement.getAttribute('data-stage') || 'day'; }

function draw(cv) {
  const A = STAND, h = rows.length, w = rows[0].length;
  const dpr = window.devicePixelRatio || 1;
  let cd = Math.max(1, Math.round(2 * dpr));
  /* (the big-screen mode: he grows from his cell on the plain page, as the home's name does: scripts/wide.js grow()) */
  if (zoom && zoom.k > 1 && zoom.grow) cd = zoom.grow(Math.max(1, Math.round(2 * zoom.dpr())), cd);
  cv.width = w * cd; cv.height = h * cd;
  cv.style.width = (w * cd / dpr) + 'px'; cv.style.height = (h * cd / dpr) + 'px';
  const c = cv.getContext('2d'), st = stage(), night = st === 'night', ink = tok().ink;
  const pal = (night ? (A.paletteNight || A.paletteDark) : st === 'dusk' ? (A.paletteDusk || A.palette) : A.palette) || {};
  const F = night ? faceOf(rows) : {};
  const open = (a, b) => a < 0 || b < 0 || a >= w || b >= h || (rows[b][a] === '.' && !F[b * w + a]);
  c.clearRect(0, 0, cv.width, cv.height);
  /* where a cell comes to 4 device px or more, his HD drawing in half cells, his face by night the 1x drawing's */
  const HD = cd >= 4 && A.framesHD && (A.framesHD.stand || A.framesHD[A.still]);
  if (HD && HD.length === 2 * h && HD.every((r) => r.length === 2 * w)) {
    const face2 = (a, b) => HD[b][a] === '.' && !!F[(b >> 1) * w + (a >> 1)];
    const open2 = (a, b) => a < 0 || b < 0 || a >= 2 * w || b >= 2 * h || (HD[b][a] === '.' && !face2(a, b));
    for (let y2 = 0; y2 < 2 * h; y2++) for (let x2 = 0; x2 < 2 * w; x2++) {
      const c2 = HD[y2][x2];
      let k2 = null;
      if (c2 === '.') { if (night && face2(x2, y2)) k2 = NIGHT.face; }
      else if (!night) k2 = c2 === 'k' || c2 === 'e' ? ink : c2 === 's' ? DAY.s : pal[c2];
      else if (c2 === 'k') k2 = open2(x2 - 1, y2) || open2(x2 + 1, y2) || open2(x2, y2 - 1) || open2(x2, y2 + 1) ? NIGHT.rim : NIGHT.k;
      else k2 = c2 === 'e' ? NIGHT.e : c2 === 's' ? NIGHT.s : pal[c2];
      if (!k2) continue;
      const X0 = Math.floor(x2 * cd / 2), Y0 = Math.floor(y2 * cd / 2);
      c.fillStyle = k2; c.fillRect(X0, Y0, Math.floor((x2 + 1) * cd / 2) - X0, Math.floor((y2 + 1) * cd / 2) - Y0);
    }
    return;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    let col = null;
    if (ch === '.') { if (F[y * w + x]) col = NIGHT.face; }
    else if (!night) col = ch === 'k' || ch === 'e' ? ink : ch === 's' ? DAY.s : pal[ch];
    else if (ch === 'k') col = open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1) ? NIGHT.rim : NIGHT.k;
    else col = ch === 'e' ? NIGHT.e : ch === 's' ? NIGHT.s : pal[ch];
    if (col) { c.fillStyle = col; c.fillRect(x * cd, y * cd, cd, cd); }
  }
}

/* his cells on whole device pixels wherever the line falls (a sub-pixel shift, never a resample), by his own place:
   it goes into his margins (he stands by right and bottom: notfound.css) */
function snap(cv) {
  if (!cv.isConnected) return;
  const s = cv.style;
  s.transform = ''; s.marginRight = s.marginBottom = '0px';
  const dpr = window.devicePixelRatio || 1, r = cv.getBoundingClientRect();
  const x = (r.left + window.scrollX) * dpr, y = (r.top + window.scrollY) * dpr;
  const dx = (Math.round(x) - x) / dpr, dy = (Math.round(y) - y) / dpr;
  s.marginRight = -dx + 'px'; s.marginBottom = -dy + 'px';
}

function setup() {
  const cv = document.createElement('canvas');
  cv.className = 'n-trav';
  cv.setAttribute('aria-hidden', 'true');
  road.appendChild(cv);
  draw(cv);
  requestAnimationFrame(() => snap(cv));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => snap(cv));
  on('stage', () => draw(cv));
  on('resize', () => { draw(cv); snap(cv); });
}
