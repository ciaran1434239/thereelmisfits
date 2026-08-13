// data/top-ten.ts
//
// The editor's Top 10. Hand-curated, distinct from the reviewer-driven
// consensus engine — this is the site's voice, not an aggregation.
//
// Each entry references a real Title by id, so we can hyperlink and pull
// the poster + year. The blurb is one sentence, written in editorial
// voice, telling the reader why it's on the list.
//
// When the backend lands, this becomes a CMS-driven list (probably keyed
// off year and editor pick), but the shape of TopTenEntry stays the same.

export interface TopTenEntry {
  /** Position in the list, 1-indexed. */
  rank: number;
  /** Title.id this references — must match an id in /data/titles.ts. */
  titleId: string;
  /** Editor's one-line take. Voice-y, opinionated, not a synopsis. */
  blurb: string;
}

export const topTenOfYear: TopTenEntry[] = [
  {
    rank: 1,
    titleId: 't1',
    blurb:
      'A film that makes the case for ambition. Three and a half hours, and it earns every minute.',
  },
  {
    rank: 2,
    titleId: 't4',
    blurb:
      'Sean Baker hides a gut-punch inside a screwball comedy. The ending will be argued about for years.',
  },
  {
    rank: 3,
    titleId: 't2',
    blurb:
      'Body horror as career critique. The nastiest, smartest provocation of the year.',
  },
  {
    rank: 4,
    titleId: 't7',
    blurb:
      'A locked-room thriller in cardinal red. Believes in plot. Believes in robes.',
  },
  {
    rank: 5,
    titleId: 't5',
    blurb:
      'Eggers reanimates the vampire myth as fever dream. Loud, lush, and properly scared of itself.',
  },
  {
    rank: 6,
    titleId: 't3',
    blurb:
      "Season two doesn't repeat the trick. It builds a new one and dares you to follow.",
  },
  {
    rank: 7,
    titleId: 't6',
    blurb:
      'A comic-book show that mostly forgets it is one. Colin Farrell anchors it without ever winking.',
  },
  {
    rank: 8,
    titleId: 't8',
    blurb:
      'A small-scale sci-fi thriller with a premise it earns and a runtime that respects you.',
  },
];
