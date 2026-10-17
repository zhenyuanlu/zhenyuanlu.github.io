// The race engine's tables: the palettes, the little drawings that are not acts.json's (the medals, the sky's
// glyphs, the terrain's marks, him should the data lack him, the season's figures), the occupancy grid's bits and
// the numbers several modules share. Ported from the draft (design/assets/v2ac/race.js); each comment is the
// draft's own. Pure: no DOM.

export var DAY = 864e5;

export var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export var RED = '#c8352b';

/* his own colours, as the home draws him: by day and dusk ink, the scarf and the bib; by night a slate coat with a
   moonlit edge and a cream face, never white. His glasses (letter i) take acts.stand's palettes, else these */
export var SCARF = [196, 56, 27], BIB = [246, 245, 241];

export var NIGHTW = { k: [43, 48, 64], rim: [96, 106, 132], face: [214, 204, 187], e: [19, 20, 24], s: [226, 96, 74], n: [200, 196, 188] };

export var GLASS = { day: '#8a94a6', dusk: '#8f8378', night: '#7d879c' };

/* medals: v7b's flat discs; a finisher's medal (round 5, the owner: Hyrox New York, the B.A.A. 5K and 10K each gave
   one) a quiet slate disc with the same rim; and a ring for a heat that qualified. In that order in a row */
export var MED = { 1: [217, 178, 76], 2: [195, 198, 207], 3: [192, 129, 79], f: [124, 146, 178] }, MEDAL_WORD = { 1: 'gold', 2: 'silver', 3: 'bronze', f: 'finisher' };

/* (by night the finisher's slate, its rim lightened as every disc's is, read as one more silver (round 5's check): there
   it is a deeper blue, its rim a step lighter and 4.7:1 on the night's paper; by day and dusk the slate above) */
export var MED_F_NIGHT = { fill: [66, 98, 160], rim: [96, 128, 190] };

export var MED_RANK = { 1: 1, 2: 2, 3: 3, f: 4, q: 5 };

export var DISC = ['.###.', '#####', '#####', '#####', '.###.'], RING = ['.###.', '#...#', '#...#', '#...#', '.###.'], MED_RIM = 0.4;

/* big screens (2026-10-09, the owner: "yes，scale up，你可以用更好的像素图来表示"): where a cell of the map (or of a medal
   beside words) comes to HD_MIN device pixels or more (a zoomed big screen: the owner's 4K at 175% gives 4), the small
   drawings are drawn from their HD variants instead of in fat cells: twice the detail on half the cells, in the same
   footprint, so nothing that places them moves. Drawn by hand as 2x grids that keep each picture's silhouette, colours
   and character, only finer (smoother curves, a touch more detail; no upscaler): the sports' pictures (acts.json
   iconHD: the dragon boat's oars with their blades and a rounder head, the sled's plates as a stack of rounded plates
   on the horn and its poles slim, the finish tape a thin tape that sags a little, the gantry's posts on feet), him
   standing and walking (acts.json framesHD: the hat's crown and brim rounded, his glasses two round lenses and their
   temples, so they read at last), the medals (DISC2: rounder, the same rim) and the pinned flag (a slim pole with a
   cap, the pennant's edge a straight diagonal). Half a cell is u / 2 device px; an odd cell's two halves differ by
   one, all on whole device pixels */
export var HD_MIN = 4;

export var DISC2 = ['...####...', '.########.', '.########.', '##########', '##########', '##########', '##########', '.########.', '.########.', '...####...'];

export var RING2 = ['...####...', '.########.', '.##....##.', '##......##', '##......##', '##......##', '##......##', '.##....##.', '.########.', '...####...'];

export var PENNANT2 = [8, 7, 6, 5, 4, 3];

/* colours that are not the stage's tokens follow it as v7b graded them: dusk warms, night cools */
export var PAPER = { day: [252, 252, 250], dusk: [243, 236, 227], night: [19, 20, 24] };

export var DUSKC = [255, 170, 92], MOONC = [86, 104, 168], NIGHT_INK = [232, 230, 225];

/* the home's walker, should the data lack him (9 x 13; k coat and hat, e eyes, s scarf) */
export var STAND = ['..kkkkk..', '.kkkkkkk.', 'kkkkkkkkk', '.k.....k.', '.k.e.e.k.', '.k.....k.', '..kkkkk..', '..sssss..', '.k.kkk.k.', '.k.kkk.k.', '...kkk...', '...k.k...', '..kk.kk..'];

export var STRIDE = {
  a: ['..kkkkk..', '.kkkkkkk.', '.kkkkkkkk', '..k....k.', '..k..e.k.', '..k....k.', '...kkkkk.', '.ssss....', 'kk.kkkk..', 'kk.kkk.k.', 'kk.kkk...', '..k...k..', '.kk...kk.'],
  b: ['..kkkkk..', '.kkkkkkk.', '.kkkkkkkk', '..k....k.', '..k..e.k.', '..k....k.', '...kkkkk.', 'sssss....', 'kk.kkkk..', 'kk.kkkk..', 'kk.kkk...', '...kk....', '...kkk...']
};

/* the sky over a scene: SKY rows over its picture, plain glyphs (no rays) that a medal cannot be mistaken for: the
   sun a 7 x 7 disc of pale lemon in the sky's top corner (a medal is a 5 x 5 disc), a low warm sun at dusk, the moon
   at night; a cloud and a puff drawn light with a darker underside (u); an overcast bar; rain and wind go by */
export var SKY = 5;

export var G_SUN = ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'], G_LOW = ['..###..', '.#####.', '#######'];

export var G_MOON = ['.##..', '##...', '##...', '##..#', '.###.'];

export var G_CLOUD = ['..##...', '.#####.', '#######', '.uuuuu.'], G_PUFF = ['.##.', '####', 'uuuu'];

export var G_OVER = ['.##...###...##..##...###...##...', '################################', 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu'];

export var WXC = {
  sun: { day: '#f7d36a', dusk: '#e2693a', night: '#efdc9c' },
  cloud: { day: '#dfe3e9', dusk: '#e2d6cc', night: '#343b4b' },
  under: { day: '#939cab', dusk: '#a3948b', night: '#5d667c' },
  rain: { day: '#7f9cbc', dusk: '#8d8aa2', night: '#62769a' },
  wind: { day: '#8e97a5', dusk: '#9a8d84', night: '#6b748a' }
};

export var WX_WORD = { sun: 'sunny', 'sun-cloud': 'sun and clouds', cloud: 'cloudy', 'overcast-wind': 'overcast and windy', rain: 'rain' };

/* terrain, a whisper: a few marks on the real ranges (a peak, a ridgeline), the lakes, a faint stipple */
export var T_GLYPH = { peak: ['...#...', '..#.#..', '.#...#.', '#.....#'], ridge: ['..#.....#..', '.#.#...#.#.', '#...#.#...#'] };

export var LAKE = ['#8db6d6', { day: 0.46, dusk: 0.46, night: 0.22 }];

/* the occupancy grid's bits (FLAG: a stop's flag with a cell of paper round it) */
export var COAST = 1, BORDER = 2, ROAD = 4, STOP = 8, TERR = 16, LAB = 32, BOX = 64, MAN = 128, FLAG = 256;

export var SPORT_WORD = { dragonboat: 'dragon boat', hyrox: 'Hyrox', run: 'run' };

/* a short screen (CSS px tall): the only kind on which the map's names may take the smaller size */
export var SHORT = 640;

/* a room is its own venue's when every other venue's stop and row lie at least this many cells further from it than
   its own (and twice as far, and OTHER_PX at least: roomNeed) */
export var NEAR = 2;

/* a highway: two cells across (2026-10-07, "高速的路线可以粗一点，这样显眼"; inner-v8's dark road with a dashed centre was
   tried beside it and read busier at 1x) */
export var BRUSH = [[0, 0], [1, 0], [0, 1], [1, 1]];

/* his flag at a race pinned: inner-v7b's, a pole over the stop's corner and a pennant beside its top; up as soon as
   the race is pinned, in FLAG_UP ms, its pennant on the pole's top from the first frame, and down in FLAG_DOWN (round
   5, the owner: "红旗是点击后马上显示"); down at once while another venue is pointed at (flagSync) */
export var FLAG_H = 7, PENNANT = [4, 3, 2], FLAG_UP = 140, FLAG_DOWN = 120;

/* the season's counts: the home lettering's figures (inner-v8's, 8 x 14 cells; two cells between figures) */
export var DIGITS = {
  0: '..####.. .######. ###..### ##....## ##....## ##....## ##....## ##....## ##....## ##....## ##....## ###..### .######. ..####..',
  1: '..###... .####... ##.##... ...##... ...##... ...##... ...##... ...##... ...##... ...##... ...##... ...##... ######## ########',
  2: '..####.. .######. ###..### ##....## ......## .....### ....###. ...###.. ..###... .###.... ###..... ##...... ######## ########',
  3: '#######. ######## ......## ......## ......## .....### ..###### ..###### .....### ......## ......## .....### ######## #######.',
  4: '....###. ...####. ..##.##. .##..##. ##...##. ##...##. ##...##. ######## ######## .....##. .....##. .....##. .....##. .....##.',
  5: '######## ######## ##...... ##...... ##...... #######. ######## .....### ......## ......## ......## .....### #######. ######..',
  6: '..###### .####### ###..... ##...... ##...... ##...... #######. ######## ###..### ##....## ##....## ###..### .######. ..####..',
  7: '######## ######## ......## .....### .....##. ....###. ....##.. ...###.. ...##... ..###... ..##.... ..##.... ..##.... ..##....',
  8: '..####.. .######. ###..### ##....## ###..### .######. .######. ###..### ##....## ##....## ##....## ###..### .######. ..####..',
  9: '..####.. .######. ###..### ##....## ##....## ###..### .####### ..###### ......## ......## ......## .....### .######. .#####..'
};

/* the scene's fade in and out, ms; the card's is in race.css */
export var FADE = 200;

/* the grid on a large screen (BIG css px wide or more: cells up to 3 css px; a coarser grid taken only where its map
   is COARSER wider), and the cell (BIGCS css px or more) from which the map's words take a size larger (race.js pickGrid, fit) */
export var BIG = 2200, COARSER = 1.1, BIGCS = 2.6;

/* where a card may lie, once the map is laid out (integral images, in cells, the grid running on left of the map
   over the column's blank paper where the stage is wider than the map): never within a cell of a road, a stop, a
   flag's place, a row (its name, pictures and medals, also where they reach left of the map), a leader, him at home
   or the key; never within 40px of the column's words nor on their lines within 120px (blocked). The coast and the
   lakes under it cost much (COASTC a cell), another venue's room a little */
/* (REACH in cells' px: a card drawn in to its words may stand a cell further, 24px as shown) */
export var COASTC = 24, REACH = 22, CMP_H = 600, CARDC = 600, CARDC_ROW = 40, APART = 20, REPAIR = 250, ROWGAP = 14, ROWGAP2 = 32, AVOID = 600, TRIES = 1, RETRIES = 2;
