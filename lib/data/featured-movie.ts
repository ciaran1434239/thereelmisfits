import { cache } from 'react';
import { supabase } from '@/lib/supabase';

const TMDB_KEY = process.env.TMDB_API_KEY;

// Genre IDs that indicate non-theatrical / streaming-first content.
// Animation (16) is intentionally NOT excluded — major animated theatrical
// releases (Toy Story 5, Pixar, etc.) should be eligible for the hero slot.
const STREAMING_GENRE_IDS = new Set([
  10770, // TV Movie
]);

async function tmdbMovie(id: number) {
  return fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } }
  ).then(r => r.ok ? r.json() : null).catch(() => null);
}

/**
 * Resolves the ID of the current hero film.
 *
 * The film getting the most critic attention RIGHT NOW wins.
 * Each review is weighted by exponential decay: a review posted today = 1.0,
 * 7 days ago = 0.32, 14 days ago = 0.10. So a film with 10 reviews this week
 * always beats one with 20 reviews from last week.
 *
 * Streaming-first content (animation, TV movies) is excluded.
 * Wrapped in React cache() so multiple components share one result per render.
 */
export const getFeaturedMovieId = cache(async (): Promise<number | null> => {
  const now = Date.now();
  const DAY_MS = 86_400_000;

  // Fetch TMDB now_playing (UK) in parallel with recent reviews so we know
  // which films are actually in cinemas right now.
  const [d1, d2, reviewResult] = await Promise.all([
    fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&region=GB&language=en-US&page=1`,
      { cache: 'no-store' }
    ).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&region=GB&language=en-US&page=2`,
      { cache: 'no-store' }
    ).then(r => r.ok ? r.json() : null).catch(() => null),
    supabase
      .from('reviews')
      .select('movie_id, posted_at, movies(id)')
      .not('movie_id', 'is', null)
      .gte('posted_at', new Date(now - 14 * DAY_MS).toISOString())
      .order('posted_at', { ascending: false })
      .limit(500),
  ]);

  const nowPlaying = [
    ...((d1?.results ?? []) as any[]),
    ...((d2?.results ?? []) as any[]),
  ].filter(m => m.poster_path && m.original_language === 'en');

  // Build a map of TMDB release dates for now-playing films so we can boost
  // films that opened THIS week.
  const nowPlayingRelease = new Map<number, number>(
    nowPlaying.map(m => [m.id as number, new Date(m.release_date ?? '').getTime()])
  );

  const recentReviews = reviewResult.data ?? [];
  if (!recentReviews.length) return getFallbackId();

  // Exponential decay: 0.80^ageDays (steeper than the old 0.85)
  //   today = 1.0 · 3 days = 0.51 · 7 days = 0.21 · 14 days = 0.04
  // This ensures a film releasing THIS week always outscores last week's,
  // even if last week's film had more total reviews.
  const recencyScores = new Map<number, number>();
  for (const r of recentReviews as any[]) {
    const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!m?.id) continue;
    const ageDays = (now - new Date(r.posted_at ?? '').getTime()) / DAY_MS;
    const weight = Math.pow(0.80, ageDays);
    recencyScores.set(m.id, (recencyScores.get(m.id) ?? 0) + weight);
  }

  if (!recencyScores.size) return getFallbackId();

  // Score = review recency score × release-week multiplier.
  // Films released in the last 7 days get a 3× boost so the new theatrical
  // release always surfaces above carry-over films from previous weeks.
  const SEVEN_DAYS_MS = 7 * DAY_MS;
  const top20 = [...recencyScores.entries()]
    .map(([id, reviewScore]) => {
      const releaseTime = nowPlayingRelease.get(id);
      const releasedThisWeek = releaseTime && (now - releaseTime) < SEVEN_DAYS_MS;
      return { id, score: reviewScore * (releasedThisWeek ? 3 : 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const candidates = await Promise.all(
    top20.map(async ({ id, score }) => {
      const details = await tmdbMovie(id);
      if (!details?.poster_path) return null;
      const genreIds: number[] = details.genre_ids ?? [];
      if (genreIds.some(g => STREAMING_GENRE_IDS.has(g))) return null;
      return { id, score };
    })
  );

  const valid = candidates.filter(Boolean) as { id: number; score: number }[];
  if (!valid.length) return getFallbackId();

  valid.sort((a, b) => b.score - a.score);
  return valid[0]?.id ?? null;
});

/** Fallback: first movie from the last 100 reviews that has a poster. */
async function getFallbackId(): Promise<number | null> {
  const { data } = await supabase
    .from('reviews')
    .select('movie_id, movies(id)')
    .not('movie_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(100);

  if (!data?.length) return null;

  const seen = new Set<number>();
  const candidates: number[] = [];
  for (const r of data as any[]) {
    const m = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (m?.id && !seen.has(m.id)) { seen.add(m.id); candidates.push(m.id); }
  }

  for (const id of candidates) {
    const details = await tmdbMovie(id);
    if (details?.poster_path) return id;
  }
  return null;
}
