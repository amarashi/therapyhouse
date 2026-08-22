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
 */

import { withBase } from '../lib/base.js';

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

const video = ({ id, title, titleLang, gloss, note, deck, series, seed }) => ({
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

export const volumes = [
  {
    id: 'little-koala',
    kind: 'book',
    title: 'The Little Koala',
    note: 'A koala who cannot say goodbye in the mornings.',
    deck:
      'The story of a little koala who does not want to leave his mother. He explores his own fears, meets a friend who has felt them too, and learns to name them and get past them.',
    audience: 'For children — a bedtime story, or one for a kindergarten shelf',
    facts: [
      { term: 'Written by', value: 'Dr Amelia Shay' },
      { term: 'Illustrated by', value: 'Nafiseh Ebrahiminejad' },
      { term: 'Helps with', value: 'Separation anxiety, fear of sleeping alone, fear of the dark' },
      { term: 'Last page', value: 'Short tips for parents and educators on using the story' },
    ],
    action: {
      label: 'Buy with card',
      href: 'https://checkout.square.site/buy/HKWVROXO2C2SCQXGZVVWEBL2?src=embed',
    },
    cover: withBase('/assets/library/books/koala-cover.webp'),
    /* Real interior spreads: illustration on the verso, story on the recto.
       Four of them, which is exactly the reference's four-leaf book. */
    spreads: [
      { image: withBase('/assets/library/books/koala-spread-1.webp'), label: 'The koala who would not go' },
      { image: withBase('/assets/library/books/koala-spread-2.webp'), label: 'Asking his mother' },
      { image: withBase('/assets/library/books/koala-spread-3.webp'), label: 'The queasy feeling' },
      { image: withBase('/assets/library/books/koala-spread-4.webp'), label: 'Listening for sounds' },
    ],
    color: '#f2b62c',
    foil: '#8a5a12',
    palette: { wall: '#e2d0a8', floor: '#c8b083', light: '#ffe4ad', fill: '#e0e4dc' },
    width: 1.3,
    height: 1.24,
    depth: 0.14,
    seed: 11,
  },
  {
    id: 'what-is-going-on-in-my-head',
    kind: 'book',
    title: 'What Is Going On In My Head',
    note: 'A working book for the therapist and the child to fill in together.',
    deck:
      'Written for therapists who work with children. The book guides the clinician through CBT and ACT techniques so a child can name their own emotions and the thoughts underneath them, a chapter at a time, with practice to take home.',
    audience: 'For clinicians who work with children',
    facts: [
      { term: 'Extent', value: '68 pages, six chapters' },
      { term: 'Structure', value: 'Three phases — insight, therapy, maintenance' },
      { term: 'Size', value: '28 × 21 cm' },
      { term: 'Paper', value: 'Premium heavy stock, lay-flat binding' },
      { term: 'Price', value: '$120' },
    ],
    action: {
      label: 'Email to order',
      href: 'mailto:admin@therapyhouse.com.au?subject=Order%3A%20What%20Is%20Going%20On%20In%20My%20Head',
    },
    cover: withBase('/assets/library/books/head-cover.webp'),
    spreads: [
      { image: withBase('/assets/library/books/head-spread-1.webp'), label: 'The Woop Woop in my head' },
      { image: withBase('/assets/library/books/head-spread-2.webp'), label: 'What is your body doing?' },
    ],
    color: '#1f4f8a',
    foil: '#e0b463',
    palette: { wall: '#d6d2bd', floor: '#bdb295', light: '#ffe8c4', fill: '#d3dfe6' },
    width: 1.46,
    height: 1.15,
    depth: 0.2,
    seed: 23,
  },

  video({
    id: '-MQe65WaRYk',
    title: 'A note on happiness',
    note: 'Dr Amelia, on what happiness is and is not.',
    deck: 'A short talk on happiness — what it actually is, and why chasing it as a constant state is the wrong thing to ask of yourself or of a child.',
    seed: 31,
  }),
  video({
    id: '5oZEYLYYVv0',
    title: 'A welcome message from Dr Amelia',
    note: 'The approaches used here, and who they are for.',
    deck: 'An introduction to Therapy House from Dr Amelia Shay: the approaches the clinic works with, and how a first visit tends to go.',
    seed: 37,
  }),
  video({
    id: '_W046Li7XAs',
    title: 'The Lockdown Challenge',
    series: 'The Lockdown Challenge · 1 of 3',
    note: 'A daily challenge for children stuck at home.',
    deck: "From the Kooky Clinic's daily lockdown challenge — small things for children to do at home when the days have stopped being ordinary.",
    seed: 41,
  }),
  video({
    id: 'nKIlFyBCYIM',
    title: 'The Lockdown Challenge 2',
    series: 'The Lockdown Challenge · 2 of 3',
    note: 'The second in the series.',
    deck: 'The second daily challenge in the series, for children at home.',
    seed: 43,
  }),
  video({
    id: 'jtFkqdkSwMw',
    title: 'The Lockdown Challenge 3',
    series: 'The Lockdown Challenge · 3 of 3',
    note: 'The third in the series.',
    deck: 'The third daily challenge in the series, for children at home.',
    seed: 47,
  }),
  video({
    id: 'RiT7kP-nL_A',
    title: 'There is a magic in stories',
    series: 'There is a magic in stories · 1 of 2',
    note: 'Why reading together does more than teach words.',
    deck: "On shared reading — the thing Dr Amelia's own research keeps landing on as the single most useful thing a parent can do with a child.",
    seed: 53,
  }),
  video({
    id: '-xwW34R1FhA',
    title: 'There is a magic in stories, part two',
    series: 'There is a magic in stories · 2 of 2',
    note: 'More on reading with your child.',
    deck: 'The second part, on how to read with a child rather than at them.',
    seed: 59,
  }),
  video({
    id: 'kU9D2yGPivU',
    title: 'یادگیری زبان برای کودکان دوزبانه',
    titleLang: 'fa',
    gloss: 'Language learning for bilingual children',
    note: 'In Persian — raising a child in two languages.',
    deck: 'In Persian. How children learn two languages at once, and what parents can stop worrying about.',
    seed: 61,
  }),
  video({
    id: 'opuPbYFSiQ0',
    title: 'اشتباهات رایج افراد در صحبت کردن انگلیسی',
    titleLang: 'fa',
    gloss: 'Common mistakes people make speaking English',
    note: 'In Persian — speaking English more confidently.',
    deck: 'In Persian. The mistakes Persian speakers most often make in English, and how to hear them in your own speech.',
    seed: 67,
  }),
];

export const books = volumes.filter((volume) => volume.kind === 'book');
export const videos = volumes.filter((volume) => volume.kind === 'video');
