// lib/types/index.ts
// Single source of truth for the data model.
// When the backend goes live, only the API layer changes — these stay.

export type TitleType = 'movie' | 'tv';

/** Where the title is currently watchable. Drives the home availability filters. */
export type TitleAvailability = 'cinemas' | 'streaming' | 'coming-soon' | 'tv';

export interface Title {
  id: string;
  title: string;
  year: number;
  type: TitleType;
  runtime: string;
  director: string;
  genre: string[];
  /** A 3-tuple of hex colors used to generate poster gradients (fallback when no posterUrl). */
  poster: [string, string, string];
  /**
   * Optional real poster art URL. When wired to TMDB this becomes the standard.
   * If absent, the gradient `poster` is used as a placeholder.
   */
  posterUrl?: string;
  /** Optional list of where the title can be watched right now. */
  availability?: TitleAvailability[];
  synopsis: string;
  /** Whether to feature this title in the home hero. */
  featured?: boolean;
}

export interface Reviewer {
  id: string;
  name: string;
  /** YouTube handle without @. */
  handle: string;
  subs: string;
  tone: string;
  /** Hex color used for the avatar background. */
  color: string;
  verified: boolean;
  avgRuntime: string;
}

export interface Review {
  id: string;
  titleId: string;
  reviewerId: string;
  /** 0–10 score the editor assigns based on the video. */
  score: number;
  /** Binary verdict — drives the consensus engine. */
  recommend: boolean;
  headline: string;
  /** Human-readable relative date, e.g. "3 days ago". */
  date: string;
  /** Runtime as MM:SS or HH:MM:SS. */
  runtime: string;
  /** Display string, e.g. "892K", "1.4M". */
  views: string;
  /** Free-text summary of the verdict. */
  verdict: string;
}

export interface EditorReview {
  titleId: string;
  score: number;
  recommend: boolean;
  headline: string;
  body: string;
  date: string;
}

export interface BoxOfficeRow {
  rank: number;
  title: string;
  weekend: number;
  total: number;
  weeks: number;
  /** Percent change from previous weekend; null if first weekend. */
  change: number | null;
  theaters: number;
  perTheater: number;
  budget: number;
  isNew?: boolean;
}

export interface BoxOffice {
  weekend: string;
  rows: BoxOfficeRow[];
}

export type PostKind = 'Review' | 'Analysis' | 'Opinion' | 'Interview' | 'List';
export type PostSection = 'Reviews' | 'Box Office' | 'Opinion' | 'Features' | 'Lists';

export interface Post {
  id: string;
  kind: PostKind;
  section: PostSection;
  title: string;
  dek: string;
  date: string;
  timeAgo: string;
  readTime: string;
  author: string;
  poster: [string, string, string];
  comments: number;
  excerpt: string;
  /**
   * Long-form article body, as paragraphs. Optional in v0.2 — list-page
   * cards only need title/dek/excerpt. The detail page (`/features/[id]`)
   * falls back to `excerpt` if body is absent.
   */
  body?: string[];
}

export interface NewsItem {
  id: string;
  section: 'Industry' | 'Streaming' | 'Casting' | 'Awards' | 'Box Office';
  title: string;
  timeAgo: string;
  author: string;
  poster: [string, string, string];
  comments: number;
  excerpt?: string;
}

/** Computed from a list of reviews. */
export interface Consensus {
  /** 0–100, the average score scaled. */
  score: number | null;
  /** 0–100, percent of reviews that recommend. The headline number. */
  recPct: number | null;
  recCount: number;
  passCount: number;
  total: number;
}

export interface Verdict {
  label: 'Recommend' | 'Okay' | 'Pass' | 'No Verdict';
  /** Token name from the theme. The component reads the actual color. */
  tone: 'green' | 'gold' | 'red' | 'faint';
}
