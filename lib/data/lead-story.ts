import { supabase } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';
import { getFeaturedMovieId } from '@/lib/data/featured-movie';

export interface ReviewDigest {
  creatorName: string;
  avatarUrl: string | null;
  snippet: string | null;
  creatorHandle: string | null;
}

export interface LeadStoryFilm {
  mode: 'pinned' | 'release' | 'fight' | 'consensus';
  movieId: number;
  movieTitle: string;
  reviewCount: number;
  pctPositive: number;
  headline: string | null;
  proReviews: ReviewDigest[];
  conReviews: ReviewDigest[];
}

// ── Fallback ladder ──────────────────────────────────────────────────────────

async function resolveLeadStory(featuredId: number | null): Promise<LeadStoryFilm | null> {
  // 1. Editorial pin — valid if pinned_until is in the future
  const { data: pin } = await supabase
    .from('editorial_pins')
    .select('*')
    .single();

  if (pin?.movie_id && pin.pinned_until && new Date(pin.pinned_until) > new Date()) {
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title')
      .eq('id', pin.movie_id)
      .single();

    if (movie) {
      const digest = await getReviewDigest(movie.id);
      return {
        mode: 'pinned',
        movieId: movie.id,
        movieTitle: movie.title,
        reviewCount: digest.total,
        pctPositive: digest.pctPositive,
        headline: pin.headline ?? null,
        proReviews: digest.proReviews,
        conReviews: digest.conReviews,
      };
    }
  }

  // 2. The big release of the week
  if (featuredId) {
    const { data: movie } = await supabase.from('movies').select('id, title').eq('id', featuredId).single();
    if (movie) {
      const digest = await getReviewDigest(movie.id);
      if (digest.total > 0) {
        return {
          mode: 'release',
          movieId: movie.id,
          movieTitle: movie.title,
          reviewCount: digest.total,
          pctPositive: digest.pctPositive,
          headline: null,
          proReviews: digest.proReviews,
          conReviews: digest.conReviews,
        };
      }
    }
  }

  // 3. Fight — films with ≥4 reviews in last 7 days, best split
  const fight7 = await findFightFilm(7);
  if (fight7) return fight7;

  // 4. Fight — widen to 14 days
  const fight14 = await findFightFilm(14);
  if (fight14) return fight14;

  // 5. Consensus — most reviewed film in last 14 days
  return findConsensusFilm();
}

async function findFightFilm(windowDays: number): Promise<LeadStoryFilm | null> {
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const { data: rows } = await supabase
    .from('reviews')
    .select('movie_id, recommend, posted_at, movies(id, title)')
    .not('movie_id', 'is', null)
    .not('recommend', 'is', null)
    .gte('posted_at', since);

  if (!rows?.length) return null;

  type FilmBucket = { title: string; latestAt: number; total: number; recs: number };
  const byFilm = new Map<number, FilmBucket>();

  for (const r of rows) {
    if (!r.movie_id) continue;
    const movie = (Array.isArray(r.movies) ? r.movies[0] : r.movies) as { id: number; title: string } | null;
    if (!movie) continue;
    const ts = new Date(r.posted_at).getTime();
    const b = byFilm.get(r.movie_id);
    if (b) { b.total++; if (r.recommend) b.recs++; if (ts > b.latestAt) b.latestAt = ts; }
    else byFilm.set(r.movie_id, { title: movie.title, latestAt: ts, total: 1, recs: r.recommend ? 1 : 0 });
  }

  let best: { movieId: number; title: string; fightScore: number; pctPositive: number; reviewCount: number } | null = null;

  for (const [movieId, b] of byFilm) {
    if (b.total < 4) continue;
    const pct = b.recs / b.total;
    const spread = 1 - Math.abs(pct - 0.5) * 2;
    const daysOld = (Date.now() - b.latestAt) / 86_400_000;
    const recency = daysOld < 3 ? 1.0 : daysOld < 7 ? 0.6 : 0.3;
    const score = spread * Math.log(b.total + 1) * recency;
    if (!best || score > best.fightScore) {
      best = { movieId, title: b.title, fightScore: score, pctPositive: Math.round(pct * 100), reviewCount: b.total };
    }
  }

  if (!best || best.fightScore < 0.15) return null;

  const digest = await getReviewDigest(best.movieId);
  return {
    mode: 'fight',
    movieId: best.movieId,
    movieTitle: best.title,
    reviewCount: best.reviewCount,
    pctPositive: best.pctPositive,
    headline: null,
    proReviews: digest.proReviews,
    conReviews: digest.conReviews,
  };
}

async function findConsensusFilm(): Promise<LeadStoryFilm | null> {
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const { data: rows } = await supabase
    .from('reviews')
    .select('movie_id, recommend, movies(id, title)')
    .not('movie_id', 'is', null)
    .not('recommend', 'is', null)
    .gte('posted_at', since);

  if (!rows?.length) return null;

  const byFilm = new Map<number, { title: string; count: number; recs: number }>();
  for (const r of rows) {
    if (!r.movie_id) continue;
    const movie = (Array.isArray(r.movies) ? r.movies[0] : r.movies) as { id: number; title: string } | null;
    if (!movie) continue;
    const b = byFilm.get(r.movie_id);
    if (b) { b.count++; if (r.recommend) b.recs++; }
    else byFilm.set(r.movie_id, { title: movie.title, count: 1, recs: r.recommend ? 1 : 0 });
  }

  let best: { movieId: number; title: string; count: number; pct: number } | null = null;
  for (const [movieId, b] of byFilm) {
    if (!best || b.count > best.count) {
      best = { movieId, title: b.title, count: b.count, pct: Math.round((b.recs / b.count) * 100) };
    }
  }

  if (!best) return null;

  const digest = await getReviewDigest(best.movieId);
  return {
    mode: 'consensus',
    movieId: best.movieId,
    movieTitle: best.title,
    reviewCount: best.count,
    pctPositive: best.pct,
    headline: null,
    proReviews: digest.proReviews,
    conReviews: digest.conReviews,
  };
}

async function getReviewDigest(movieId: number) {
  const { data } = await supabase
    .from('reviews')
    .select('recommend, snippet, creators(name, avatar_url, handle)')
    .eq('movie_id', movieId)
    .not('recommend', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(300);

  const rows = data ?? [];
  const total = rows.length;
  const recs = rows.filter(r => r.recommend).length;

  const toDigest = (r: typeof rows[0]): ReviewDigest => {
    const c = (Array.isArray(r.creators) ? r.creators[0] : r.creators) as { name?: string; avatar_url?: string; handle?: string } | null;
    return {
      creatorName: c?.name ?? 'Unknown',
      avatarUrl: c?.avatar_url ?? null,
      snippet: r.snippet ?? null,
      creatorHandle: c?.handle ?? null,
    };
  };

  return {
    total,
    pctPositive: total > 0 ? Math.round((recs / total) * 100) : 0,
    proReviews: rows.filter(r => r.recommend).slice(0, 3).map(toDigest),
    conReviews: rows.filter(r => !r.recommend).slice(0, 3).map(toDigest),
  };
}

const cachedLeadStory = unstable_cache(resolveLeadStory, ['lead-story'], { revalidate: 1800 });

export async function getLeadStory(): Promise<LeadStoryFilm | null> {
  const featuredId = await getFeaturedMovieId();
  return cachedLeadStory(featuredId);
}
