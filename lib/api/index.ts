// lib/api/index.ts
//
// The data-access layer.
//
// All components consume data through these async functions.
// Today they wrap in-memory mock data; tomorrow they hit Supabase / Postgres /
// the YouTube ingestion pipeline. Component code does not change.
//
// Convention: functions are named `getX`, `getXById`, `listX`, `listXBy...`.
// Every function returns a Promise so the consumer pattern is consistent
// regardless of whether the backend is local or remote.

import { supabase } from '../supabase'; // <--- NEW: The Supabase connection

import type {
  Title,
  Reviewer,
  Review,
  EditorReview,
  BoxOffice,
  Post,
  NewsItem,
  Consensus,
} from '@/lib/types';

import { titles } from '@/data/titles';
import { reviewers } from '@/data/reviewers';
import { reviews } from '@/data/reviews';
import { editorReviews } from '@/data/editor-reviews';
import { boxOffice } from '@/data/box-office';
import { posts, news } from '@/data/posts';

import { computeConsensus } from '@/lib/utils/consensus';

// In dev we add a small artificial delay so loading states are visible.
// This is a no-op in production builds.
async function maybeDelay<T>(value: T): Promise<T> {
  if (process.env.NODE_ENV !== 'production' && process.env.MOCK_API_DELAY_MS) {
    const ms = parseInt(process.env.MOCK_API_DELAY_MS, 10);
    await new Promise((r) => setTimeout(r, ms));
  }
  return value;
}

// ---------- Titles ----------

export async function listTitles(): Promise<Title[]> {
  return maybeDelay([...titles]);
}

export async function getTitleById(id: string): Promise<Title | null> {
  return maybeDelay(titles.find((t) => t.id === id) ?? null);
}

export async function getFeaturedTitle(): Promise<Title | null> {
  return maybeDelay(titles.find((t) => t.featured) ?? titles[0] ?? null);
}

/**
 * Featured titles for the home hero, in display order.
 */
export async function listFeaturedTitles(count = 3): Promise<Title[]> {
  const explicit = titles.filter((t) => t.featured);
  if (explicit.length >= count) return maybeDelay(explicit.slice(0, count));

  const reviewCounts = new Map<string, number>();
  for (const r of reviews) {
    reviewCounts.set(r.titleId, (reviewCounts.get(r.titleId) ?? 0) + 1);
  }
  const fillers = titles
    .filter((t) => !t.featured)
    .sort((a, b) => (reviewCounts.get(b.id) ?? 0) - (reviewCounts.get(a.id) ?? 0));

  return maybeDelay([...explicit, ...fillers].slice(0, count));
}

export async function listTitlesByType(type: 'movie' | 'tv'): Promise<Title[]> {
  return maybeDelay(titles.filter((t) => t.type === type));
}

// ---------- Reviewers ----------

export async function listReviewers(): Promise<Reviewer[]> {
  return maybeDelay([...reviewers]);
}

export async function getReviewerById(id: string): Promise<Reviewer | null> {
  return maybeDelay(reviewers.find((r) => r.id === id) ?? null);
}

export async function getReviewerByHandle(handle: string): Promise<Reviewer | null> {
  return maybeDelay(reviewers.find((r) => r.handle === handle) ?? null);
}

// ---------- Reviews ----------

// NEW: Real Supabase fetch for the Vertical Slice!
export async function getRecentReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      movies (title, backdrop_path, consensus_score),
      creators (name, handle, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data;
}

export async function listReviewsForTitle(titleId: string): Promise<Review[]> {
  return maybeDelay(reviews.filter((r) => r.titleId === titleId));
}

export async function listReviewsByReviewer(reviewerId: string): Promise<Review[]> {
  return maybeDelay(reviews.filter((r) => r.reviewerId === reviewerId));
}

export async function listRecentReviews(limit = 12): Promise<Review[]> {
  return maybeDelay(reviews.slice(0, limit));
}

export async function listRecentReviewsByTitle(limit = 12): Promise<Review[]> {
  const byTitle = new Map<string, Review>();
  for (const r of reviews) {
    const existing = byTitle.get(r.titleId);
    if (!existing || r.score > existing.score) {
      byTitle.set(r.titleId, r);
    }
  }
  return maybeDelay(Array.from(byTitle.values()).slice(0, limit));
}

// ---------- Editor reviews (Ciaran's own takes) ----------

export async function getEditorReviewForTitle(titleId: string): Promise<EditorReview | null> {
  return maybeDelay(editorReviews.find((r) => r.titleId === titleId) ?? null);
}

export async function listEditorReviews(): Promise<EditorReview[]> {
  return maybeDelay([...editorReviews]);
}

// ---------- Consensus (computed; here for convenience) ----------

export async function getConsensusForTitle(titleId: string): Promise<Consensus> {
  const titleReviews = await listReviewsForTitle(titleId);
  return computeConsensus(titleReviews);
}

// ---------- Box office ----------

export async function getBoxOffice(): Promise<BoxOffice> {
  return maybeDelay(boxOffice);
}

// ---------- Editorial / posts ----------

export async function listPosts(): Promise<Post[]> {
  return maybeDelay([...posts]);
}

export async function getPostById(id: string): Promise<Post | null> {
  return maybeDelay(posts.find((p) => p.id === id) ?? null);
}

// ---------- News ----------

export async function listNews(limit?: number): Promise<NewsItem[]> {
  return maybeDelay(limit ? news.slice(0, limit) : [...news]);
}

// ---------- Top 10 ----------

import { topTenOfYear, type TopTenEntry } from '@/data/top-ten';

export async function listTopTen(): Promise<
  Array<{ rank: number; blurb: string; title: Title }>
> {
  const joined = topTenOfYear
    .map((entry: TopTenEntry) => {
      const title = titles.find((t) => t.id === entry.titleId);
      if (!title) return null;
      return { rank: entry.rank, blurb: entry.blurb, title };
    })
    .filter((x): x is { rank: number; blurb: string; title: Title } => x !== null)
    .sort((a, b) => a.rank - b.rank);
  return maybeDelay(joined);
}