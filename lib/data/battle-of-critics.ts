/**
 * Battle of the Critics — pair selection with 48-hour rotation.
 *
 * Uses Next.js `unstable_cache` to lock in the displayed pairs for 48 hours
 * across all page requests. On each cache miss the algorithm:
 *   1. Reads `verdict_matchups.featured_at` to know which pairs were shown
 *      most recently (fairness / round-robin).
 *   2. Builds every valid candidate pair from the 500 most recent reviews.
 *   3. Sorts candidates: never-featured first, then least-recently-featured.
 *   4. Takes the top 2.
 *   5. Writes `featured_at = now` for those 2 rows so the next rotation
 *      will skip them.
 *
 * The `featured_at` column must exist on `verdict_matchups`:
 *   ALTER TABLE verdict_matchups ADD COLUMN IF NOT EXISTS featured_at timestamptz DEFAULT NULL;
 */

import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';

// ─── snippet safety ───────────────────────────────────────────────────────────

/**
 * Return the AI-extracted verdict snippet if it's a genuine review quote.
 * Returns '' if null, too short, or clearly promo / channel-description text.
 */
function safeSnippet(snippet: string | null | undefined): string {
  if (!snippet) return '';
  const s = snippet.trim();
  if (s.length < 20) return '';
  if (/https?:\/\/|www\.|\.com\b|\.co\b|\.org\b/i.test(s)) return '';
  if (s.endsWith(':')) return '';
  const PROMO =
    /\b(tip\s+link|link\s+in\s+(the\s+)?bio|in\s+the\s+description|our\s+website|their\s+website|my\s+website|our\s+channel|the\s+channel|visit\s+(our|their|my|the)\s+\w+|send\s+in\s+(a|your)|sign\s+up|join\s+(our|the|us|me)|patreon|merch|subscribe|check\s+out|follow\s+(us|me)|get\s+your|shop\s+now|use\s+code|discount|coupon|affiliate|instagram|facebook|twitter|tiktok|youtube\s+channel|support\s+(the|us|me))\b/i;
  if (PROMO.test(s)) return '';
  const STARTS =
    /^(get\s+|check\s+out|visit\s+|send\s+|sign\s+up|join\s+|follow\s+|subscribe|support\s+)/i;
  if (STARTS.test(s)) return '';
  return s.slice(0, 140);
}

// ─── types ────────────────────────────────────────────────────────────────────

export interface BattleCreator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
}

export interface BattleSide {
  snippet: string;
  creators: BattleCreator;
}

export interface BattlePair {
  movieId: number;
  movieTitle: string;
  proPercent: number;
  conPercent: number;
  totalReviews: number;
  pro: BattleSide;
  con: BattleSide;
  posterPath: string | null;
}

// ─── core computation (runs at most once per 48 hours) ───────────────────────

export async function computePairs(): Promise<BattlePair[]> {
  const TMDB_KEY = process.env.TMDB_API_KEY;

  // 1. Fetch all known matchups so we can sort by how recently each was featured
  const { data: matchupHistory } = await supabase
    .from('verdict_matchups')
    .select('movie_id, pro_creator_id, con_creator_id, featured_at');

  // Map  "movieId:proId:conId"  →  last featured ISO string (or null)
  const featuredAt = new Map<string, string | null>(
    (matchupHistory ?? []).map((m: any) => [
      `${m.movie_id}:${m.pro_creator_id}:${m.con_creator_id}`,
      m.featured_at ?? null,
    ])
  );

  // 2. Fetch the 500 most recent reviews with snippets + creators
  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      'id, movie_id, recommend, posted_at, snippet, creator_id, ' +
        'creators(id, name, handle, avatar_url), movies(id, title)'
    )
    .not('movie_id', 'is', null)
    .not('recommend', 'is', null)
    .not('creator_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(500);

  if (!reviews?.length) return [];

  // 3. Pass 1 — aggregate pro/con counts per movie (no avatar filter)
  const aggMap = new Map<number, { movieTitle: string; pros: number; cons: number }>();
  for (const r of reviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie) continue;
    const e = aggMap.get(movie.id) ?? { movieTitle: movie.title ?? '', pros: 0, cons: 0 };
    if (r.recommend) e.pros++; else e.cons++;
    aggMap.set(movie.id, e);
  }

  // 4. Pass 2 — collect avatar-having reviews per movie
  const withAvatarByMovie = new Map<number, { pros: any[]; cons: any[] }>();
  for (const r of reviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie) continue;
    const creator = Array.isArray(r.creators) ? r.creators[0] : r.creators;
    if (!creator?.avatar_url) continue;
    const entry = withAvatarByMovie.get(movie.id) ?? { pros: [], cons: [] };
    entry[r.recommend ? 'pros' : 'cons'].push({ ...r, creators: creator });
    withAvatarByMovie.set(movie.id, entry);
  }

  // 5. Build ALL valid candidate pairs (not just the first 2)
  type RawPair = {
    movieId: number;
    movieTitle: string;
    proPercent: number;
    conPercent: number;
    totalReviews: number;
    pro: any;
    con: any;
  };

  const candidates: RawPair[] = [];

  for (const [movieId, { pros, cons }] of withAvatarByMovie) {
    if (!pros.length || !cons.length) continue;

    const agg = aggMap.get(movieId);
    if (!agg) continue;
    const total = agg.pros + agg.cons;
    if (total < 4) continue;

    // Both sides must have a valid, non-promo snippet
    const prosWithQuotes = pros.filter((r: any) => safeSnippet(r.snippet).length > 0);
    const consWithQuotes = cons.filter((r: any) => safeSnippet(r.snippet).length > 0);
    if (!prosWithQuotes.length || !consWithQuotes.length) continue;

    const pro = prosWithQuotes[0];
    // Ensure the con critic is a different person
    const con = consWithQuotes.find((c: any) => c.creators?.id !== pro.creators?.id);
    if (!con) continue;

    const proPercent = Math.round((agg.pros / total) * 100);
    candidates.push({
      movieId,
      movieTitle: agg.movieTitle,
      proPercent,
      conPercent: 100 - proPercent,
      totalReviews: total,
      pro,
      con,
    });
  }

  if (!candidates.length) return [];

  // 6. Sort: never-featured first, then least-recently-featured (round-robin)
  candidates.sort((a, b) => {
    const ak = `${a.movieId}:${a.pro.creators?.id}:${a.con.creators?.id}`;
    const bk = `${b.movieId}:${b.pro.creators?.id}:${b.con.creators?.id}`;
    const aT = featuredAt.get(ak) ?? null;
    const bT = featuredAt.get(bk) ?? null;
    // null (never shown) sorts before any real timestamp
    if (!aT && !bT) return 0;
    if (!aT) return -1;
    if (!bT) return 1;
    return aT < bT ? -1 : 1;
  });

  // 7. Take the 2 pairs most due for rotation
  const selected = candidates.slice(0, 2);

  // 8. Enrich with TMDB poster data
  const enriched: BattlePair[] = await Promise.all(
    selected.map(async pair => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${pair.movieId}?api_key=${TMDB_KEY}`,
        { next: { revalidate: 86400 } } as any
      )
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null);

      return {
        movieId: pair.movieId,
        movieTitle: pair.movieTitle,
        proPercent: pair.proPercent,
        conPercent: pair.conPercent,
        totalReviews: pair.totalReviews,
        pro: {
          snippet: safeSnippet(pair.pro.snippet),
          creators: pair.pro.creators as BattleCreator,
        },
        con: {
          snippet: safeSnippet(pair.con.snippet),
          creators: pair.con.creators as BattleCreator,
        },
        posterPath: res?.poster_path ?? null,
      };
    })
  );

  // 9. Stamp `featured_at` on the selected rows so the NEXT rotation skips them.
  //    Awaited so the write completes before the result is cached.
  await Promise.all(
    selected.map(pair =>
      supabase
        .from('verdict_matchups')
        .upsert(
          {
            movie_id: pair.movieId,
            pro_creator_id: pair.pro.creators?.id,
            con_creator_id: pair.con.creators?.id,
            featured_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'movie_id,pro_creator_id,con_creator_id' }
        )
    )
  ).catch(() => null);

  return enriched;
}

// ─── public API — cached for 48 hours across all requests ────────────────────

export const getBattleOfCriticsPairs = unstable_cache(
  computePairs,
  ['battle-of-critics-pairs'],
  { revalidate: 48 * 60 * 60 } // 172 800 s
);
