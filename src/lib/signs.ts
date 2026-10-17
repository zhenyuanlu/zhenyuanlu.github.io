// The small pixel signs that stand before a link's word (the draft v2ac's build page, build.js SIGNS, which this
// copies; the article head's links use them now, the build page in phase 2): 9 x 9 cells each, '#' a cell drawn,
// drawn as an SVG path of whole cells and set on whole device pixels in the browser (lettering/index.js snap).
export const SIGNS = {
  // the draft's own
  code:   '......... ......... ..#...#.. .#.....#. #.......# .#.....#. ..#...#.. ......... .........',
  page:   '.#####... .#...##.. .#...#.#. .#...###. .#.....#. .#.###.#. .#.....#. .#.....#. .#######.',
  box:    '......... ######### #.......# ######### .#.....#. .#.###.#. .#.....#. .#######. .........',
  table:  '......... .#######. .#..#..#. .#..#..#. .#######. .#..#..#. .#..#..#. .#######. .........',
  pencil: '......##. .....#..# ....#..#. ...#..#.. ..#..#... .#..#.... .#.#..... .##...... .........',
  lines:  '......... ......... .#######. ......... .#######. ......... .#####... ......... .........',
  app:    '######### #.......# #..#....# #..##...# #..###..# #..##...# #..#....# #.......# #########',
  // new with the article's links (2026-10-16), drawn the same way: a screen on its stand, a seal with its ribbons,
  // a film camera, a globe
  slides: '######### #.......# #.......# #.......# #.......# ######### ....#.... ...#.#... ..#...#..',
  patent: '...###... ..#...#.. .#..#..#. .#.###.#. .#..#..#. ..#...#.. ...###... ..##.##.. .##...##.',
  video:  '......... ######... #....#..# #....#.## #....#### #....#.## #....#..# ######... .........',
  web:    '...###... .##.#.##. .#..#..#. #...#...# ######### #...#...# .#..#..#. .##.#.##. ...###...',
} as const;
export type Sign = keyof typeof SIGNS;

/** a sign's cells as one SVG path (each row's runs of cells as one rectangle), for viewBox="0 0 9 9" */
export function signPath(name: Sign): string {
  let d = '';
  SIGNS[name].split(' ').forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      if (r[x] !== '#') continue;
      const x0 = x;
      while (x + 1 < r.length && r[x + 1] === '#') x++;
      d += `M${x0} ${y}h${x - x0 + 1}v1h-${x - x0 + 1}z`;
    }
  });
  return d;
}

/** the kinds of link a post may list under its byline (front matter `links`): the word shown and its sign */
export const LINK_KINDS = {
  paper: { word: 'paper', sign: 'page' },
  arxiv: { word: 'arXiv', sign: 'box' },
  pdf: { word: 'pdf', sign: 'page' },
  code: { word: 'code', sign: 'code' },
  slides: { word: 'slides', sign: 'slides' },
  patent: { word: 'patent', sign: 'patent' },
  data: { word: 'data', sign: 'table' },
  video: { word: 'video', sign: 'video' },
  web: { word: 'web', sign: 'web' },
} as const satisfies Record<string, { word: string; sign: Sign }>;
export type LinkKind = keyof typeof LINK_KINDS;
