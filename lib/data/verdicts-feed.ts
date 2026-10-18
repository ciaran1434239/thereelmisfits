import { supabase } from '@/lib/supabase';

export interface VerdictItem {
  reviewId: string;
  youtubeVideoId: string | null;
  postedAt: string;
  snippet: string | null;
  verdictShort: string | null;
  score: number | null;
  recommend: boolean;
  movieId: number;
  movieTitle: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string | null;
  creatorAvatarUrl: string | null;
  criticCount: number;
  recCount: number;
}

export type VerdictFilter = 'all' | 'recommend' | 'skip' | `channel:${string}`;

export interface PosterFilm {
  movieId: number;
  movieTitle: string;
  reviewCount: number;
  pctPositive: number;
}

// ── Verdict feed — widens window until ≥12 results ──────────────────────────

export async function getVerdictsFeed(
  filter: VerdictFilter = 'all',
  limit = 24,
  excludeMovieIds: number[] = [],
): Promise<VerdictItem[]> {
  // One entry per movie (its latest verdict). Widen the window until there are enough movies.
  for (const days of [7, 30, 365, null]) {
    const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null;
    const rows = await fetchVerdicts(since, filter, 400);
    const items = groupByMovie(rows).filter(v => !excludeMovieIds.includes(v.movieId));
    if (items.length >= Math.min(limit, 12) || days === null) return items.slice(0, limit);
  }
  return [];
}

function groupByMovie(rows: VerdictItem[]): VerdictItem[] {
  const byMovie = new Map<number, VerdictItem>();
  for (const r of rows) {
    const g = byMovie.get(r.movieId);
    if (g) {
      g.criticCount += 1;
      g.recCount += r.recommend ? 1 : 0;
    } else {
      byMovie.set(r.movieId, { ...r, criticCount: 1, recCount: r.recommend ? 1 : 0 });
    }
  }
  return [...byMovie.values()];
}

async function fetchVerdicts(since: string | null, filter: VerdictFilter, limit: number): Promise<VerdictItem[]> {
  let query = supabase
    .from('reviews')
    .select('id, youtube_video_id, posted_at, snippet, score, recommend, movie_id, movies(id, title), creators(id, name, handle, avatar_url)')
    .not('recommend', 'is', null)
    .not('movie_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (since) query = (query as any).gte('posted_at', since);
  if (filter === 'recommend') query = (query as any).eq('recommend', true);
  if (filter === 'skip')      query = (query as any).eq('recommend', false);
  if (filter.startsWith('channel:')) {
    query = (query as any).eq('creator_id', filter.slice(8));
  }

  const { data } = await query;
  return (data ?? []).map(r => mapRow(r as any));
}

function mapRow(r: any): VerdictItem {
  const movie   = Array.isArray(r.movies)   ? r.movies[0]   : r.movies;
  const creator = Array.isArray(r.creators) ? r.creators[0] : r.creators;
  return {
    reviewId:        String(r.id),
    youtubeVideoId:  r.youtube_video_id ?? null,
    postedAt:        r.posted_at,
    snippet:         r.snippet          ?? null,
    verdictShort:    r.verdict_short    ?? null,
    score:           r.score         ?? null,
    recommend:       !!r.recommend,
    movieId:         r.movie_id,
    movieTitle:      movie?.title    ?? 'Unknown',
    creatorId:       String(creator?.id ?? ''),
    creatorName:     creator?.name   ?? 'Unknown',
    creatorHandle:   creator?.handle ?? null,
    creatorAvatarUrl:creator?.avatar_url ?? null,
    criticCount:     1,
    recCount:        r.recommend ? 1 : 0,
  };
}

// ── Poster rail — 6 most-reviewed films in last 30 days ─────────────────────

export async function getPosterRailFilms(limit = 6): Promise<PosterFilm[]> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const { data } = await supabase
    .from('reviews')
    .select('movie_id, recommend, movies(id, title)')
    .not('movie_id', 'is', null)
    .not('recommend', 'is', null)
    .gte('posted_at', since);

  if (!data?.length) return [];

  const byFilm = new Map<number, { title: string; count: number; recs: number }>();
  for (const r of data) {
    if (!r.movie_id) continue;
    const movie = (Array.isArray(r.movies) ? r.movies[0] : r.movies) as { title?: string } | null;
    const b = byFilm.get(r.movie_id);
    if (b) { b.count++; if (r.recommend) b.recs++; }
    else byFilm.set(r.movie_id, { title: movie?.title ?? 'Unknown', count: 1, recs: r.recommend ? 1 : 0 });
  }

  return [...byFilm.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([movieId, b]) => ({
      movieId,
      movieTitle: b.title,
      reviewCount: b.count,
      pctPositive: Math.round((b.recs / b.count) * 100),
    }));
}
