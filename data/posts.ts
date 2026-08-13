// data/posts.ts
import type { Post, NewsItem } from '@/lib/types';
import { titles } from './titles';

// Reuse a real title's palette for the first post's hero. The titles array
// is hand-curated and never empty in this fixture, but a fallback keeps
// strict TS happy.
const fallbackPoster: [string, string, string] = ['#1A1A1A', '#3A3A3A', '#7A7A7A'];
const firstTitlePoster = titles[0]?.poster ?? fallbackPoster;

export const posts: Post[] = [
  {
    id: 'p1',
    kind: 'Review',
    section: 'Reviews',
    title: 'The Brutalist might be the rare American film worth its three hours',
    dek: "Brady Corbet has made a movie that argues ambition is its own subject. He's right.",
    date: '4 days ago',
    timeAgo: '4 days ago',
    readTime: '8 min',
    author: 'Ciaran',
    poster: firstTitlePoster,
    comments: 84,
    excerpt:
      "There's a moment about ninety minutes into The Brutalist where the film stops being a story about a man and starts being a story about a building.",
    body: [
      "There's a moment about ninety minutes into The Brutalist where the film stops being a story about a man and starts being a story about a building. László Tóth, the Hungarian-Jewish architect played by Adrien Brody, has been hired by a wealthy industrialist to design a community centre, and we watch him sketch and re-sketch and tear up the sketches and start again. The camera lingers on the drafting table the way another film might linger on a face.",
      "What Brady Corbet has made, across three and a half hours and an intermission, is a film that takes its central metaphor at its word. Architecture is the protagonist's profession, but it is also the film's argument: that ambition is a discipline, that scale is a moral question, and that what survives of a person is what they build.",
      "The film is shot in VistaVision — a format last used commercially in the 1960s — and the choice is not nostalgic. It is structural. VistaVision gives the image a depth that 35mm cannot reach, and Corbet uses that depth to put László in rooms with people who tower over him: producers, patrons, customs officers. The geometry of every frame tells you who has power and who is asking for it.",
      "There are problems. The third act lurches. A late-arriving subplot involving the Vatican feels lifted from a different, more melodramatic film. Felicity Jones, as László's wife, is given a part that the script never quite figures out what to do with. But these are the kinds of problems that come from a film attempting too much, not too little, and I would rather sit through ten Brutalists than another competent two-hour studio drama whose ambitions begin and end with awards consideration.",
      "What I keep returning to is the building. Without spoiling its eventual fate, I will say that the film's final movement complicates everything that has come before — the heroism of artistic vision, the price of patronage, the question of who a thing is for. The Brutalist does not flatter its audience. It does not flatter its protagonist. It is, in the most demanding sense, a serious film about a serious man trying to make a serious thing, and it earns its three and a half hours by refusing, at any point, to be smaller than it needs to be.",
    ],
  },
  {
    id: 'p2',
    kind: 'Analysis',
    section: 'Box Office',
    title: 'How A Real Pain pulled off a $6,180 per-theater opening',
    dek: "Searchlight's slow-rollout playbook is starting to look like the only playbook left.",
    date: '6 days ago',
    timeAgo: '6 days ago',
    readTime: '6 min',
    author: 'Ciaran',
    poster: ['#1A1814', '#3D3A33', '#7A7468'],
    comments: 47,
    excerpt:
      'A Real Pain opened to $6,180 per theater in 2,945 locations this weekend. That number does a lot of work.',
  },
  {
    id: 'p3',
    kind: 'Opinion',
    section: 'Opinion',
    title: "I'm calling it: Mickey 17 is the last gasp of the mid-budget original",
    dek: "Bong Joon-ho got $118 million to make a weird movie. Nobody's going to get that again.",
    date: '8 days ago',
    timeAgo: '8 days ago',
    readTime: '11 min',
    author: 'Ciaran',
    poster: ['#0F1F2A', '#1F4A6B', '#7BA7C9'],
    comments: 312,
    excerpt:
      'Whatever you think of Mickey 17, the more interesting question is what its existence tells us about the last decade of studio filmmaking.',
  },
  {
    id: 'p4',
    kind: 'Interview',
    section: 'Features',
    title: 'An hour with Frame Rate Theory: "I make video essays for the version of me who used to read Cahiers"',
    dek: "The 847K-subscriber channel on long-form, ad reads, and why he won't do a Marvel movie review.",
    date: '12 days ago',
    timeAgo: '12 days ago',
    readTime: '14 min',
    author: 'Ciaran',
    poster: ['#3A2A1F', '#7A5635', '#C9905E'],
    comments: 28,
    excerpt:
      'Frame Rate Theory runs one of the more thoughtful film criticism channels on YouTube.',
  },
];

export const news: NewsItem[] = [
  {
    id: 'n1',
    section: 'Industry',
    title: "WB greenlights Bong Joon-ho's next after Mickey 17 opening",
    timeAgo: '2 hours ago',
    author: 'Wire desk',
    poster: ['#1A1A2A', '#2A3A5A', '#5A7AA8'],
    comments: 18,
    excerpt: 'Sources at the studio confirm a deal in the eight-figure range.',
  },
  {
    id: 'n2',
    section: 'Streaming',
    title: 'A24 inks output deal with Mubi — what it means',
    timeAgo: '5 hours ago',
    author: 'Wire desk',
    poster: ['#0F0F0F', '#3A3A3A', '#888888'],
    comments: 42,
    excerpt: 'The arthouse heavyweight will route most of its catalogue through Mubi after a 90-day theatrical window.',
  },
  {
    id: 'n3',
    section: 'Casting',
    title: "Pattinson reportedly attached to Lynne Ramsay's next",
    timeAgo: '8 hours ago',
    author: 'Wire desk',
    poster: ['#2A1A0F', '#5A3A1F', '#A87A4E'],
    comments: 67,
    excerpt: 'Plot details thin on the ground. The pairing is the news.',
  },
  {
    id: 'n4',
    section: 'Awards',
    title: 'Cannes lineup leaks: Lanthimos, Reichardt, and a debut',
    timeAgo: '11 hours ago',
    author: 'Wire desk',
    poster: ['#3A1A1A', '#7A2A2A', '#C95E5E'],
    comments: 134,
    excerpt: 'The full slate is expected this week, but a leak names ten of the in-competition titles.',
  },
];
