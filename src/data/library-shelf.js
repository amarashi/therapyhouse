/* The volumes that stand on the library shelf.
 *
 * Two books the clinic actually sells and nine videos Dr Amelia actually
 * published. Every field here is sourced — the covers and interior spreads are
 * the real scans from therapyhouse.com.au/products/, the video thumbnails are
 * the real YouTube stills, and the facts under each title are the ones the
 * product page states. Nothing about a binding, a page count or an edition is
 * invented; where the clinic has not published a fact, the row is absent
 * rather than filled in.
 *
 * Shape is shared by the server (which renders the whole list as readable HTML
 * before any script runs) and the WebGL renderer (which reads the geometry and
 * palette fields). One record, two consumers — so a volume can never appear on
 * the shelf without also appearing in the list a visitor gets with JS off.
 *
 * The words — titles, notes, decks, facts, the buy link, spread captions — are
 * in library-shelf.json, which clinic staff edit in Pages CMS (issue #94). The
 * shapes, colours and seeds stay here, and the two are joined by `id`. The
 * shelf follows the order of the JSON; a volume there with no shape here
 * throws, because a new book needs its size and colours chosen by hand. The
 * JSON is read with a JSON module import so that both Vite and `node --test`
 * load it the same way.
 */

import { withBase } from '../lib/base.js';
import shelfText from './library-shelf.json' with { type: 'json' };

/* Four videos on the live site are Dr Amelia's Persian-language personal
 * channel content — three on dating and one on women and sexuality. They are
 * real and they are hers, but a parent browsing a child-psychology library is
 * not who they were made for, so they are not on the shelf. The channel link
 * at the end of the shelf reaches them.
 *
 * A fifth, the Theory of Mind interview (ovUEyzBagPo), was on the live site's
 * videos page and has since been deleted from YouTube. It is dropped rather
 * than shipped as a dead embed.
 */
export const youtubeChannel =
  'https://www.youtube.com/channel/UC-8M9aKkmwGgPoTqopgC-3A/videos';

/* World units. A picture book is nearly square, the therapists' manual is
 * landscape at 28 × 21 cm, and a video case is the slim upright among them —
 * the three silhouettes are what make the shelf read as a real shelf rather
 * than a row of identical rectangles. */
const VIDEO_CASE = { width: 0.92, height: 1.38, depth: 0.1 };

/* Warm palettes only. The reference re-lights its room to each volume's
 * colours, and that move is kept — but the range runs honey to sage to dusk,
 * never the reference's near-black, because this house is lamplit. */
const videoPalette = {
  wall: '#dbcbab',
  floor: '#c2ab88',
  light: '#ffe8c2',
  fill: '#d8e3e7',
};

/* The shape of each book, by id. `cover` and each spread `id` in the JSON
   name a file in /assets/library/books/. */
const bookShapes = {
  'little-koala': {
    cover: 'koala-cover',
    color: '#f2b62c',
    foil: '#8a5a12',
    palette: { wall: '#e2d0a8', floor: '#c8b083', light: '#ffe4ad', fill: '#e0e4dc' },
    width: 1.3,
    height: 1.24,
    depth: 0.14,
    seed: 11,
  },
  'what-is-going-on-in-my-head': {
    cover: 'head-cover',
    color: '#1f4f8a',
    foil: '#e0b463',
    palette: { wall: '#d6d2bd', floor: '#bdb295', light: '#ffe8c4', fill: '#d3dfe6' },
    width: 1.46,
    height: 1.15,
    depth: 0.2,
    seed: 23,
  },
};

/* Videos all share one case; only the seed differs. The id is the YouTube id. */
const videoSeeds = {
  '-MQe65WaRYk': 31,
  '5oZEYLYYVv0': 37,
  _W046Li7XAs: 41,
  nKIlFyBCYIM: 43,
  jtFkqdkSwMw: 47,
  'RiT7kP-nL_A': 53,
  '-xwW34R1FhA': 59,
  kU9D2yGPivU: 61,
  opuPbYFSiQ0: 67,
};

const bookImage = (name) => withBase(`/assets/library/books/${name}.webp`);

const book = (text, shape) => ({
  id: text.id,
  kind: 'book',
  title: text.title,
  note: text.note,
  deck: text.deck,
  audience: text.audience,
  facts: text.facts,
  action: text.action,
  cover: bookImage(shape.cover),
  /* Real interior spreads: illustration on the verso, story on the recto.
     The koala has four of them, which is exactly the reference's four-leaf book. */
  spreads: (text.spreads ?? []).map(({ id, label }) => ({ image: bookImage(id), label })),
  color: shape.color,
  foil: shape.foil,
  palette: shape.palette,
  width: shape.width,
  height: shape.height,
  depth: shape.depth,
  seed: shape.seed,
});

const video = ({ id, title, titleLang, gloss, note, deck, series }, seed) => ({
  id,
  kind: 'video',
  title,
  titleLang,
  gloss,
  note,
  deck,
  series,
  seed,
  href: `https://www.youtube.com/watch?v=${id}`,
  thumbnail: withBase(`/assets/library/videos/${id}.webp`),
  /* Hedge green cloth, candle gold foil — the two committed colours, used on
     an object rather than on a page. */
  color: '#234f2f',
  foil: '#ffd254',
  palette: videoPalette,
  ...VIDEO_CASE,
});

export const volumes = shelfText.volumes.map((text) => {
  if (bookShapes[text.id]) return book(text, bookShapes[text.id]);
  if (videoSeeds[text.id] !== undefined) return video(text, videoSeeds[text.id]);
  throw new Error(`library-shelf.json lists "${text.id}", which has no shape in library-shelf.js`);
});

export const books = volumes.filter((volume) => volume.kind === 'book');
export const videos = volumes.filter((volume) => volume.kind === 'video');
