import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Returns true only if `q` matches at the start of any word in `title`.
// A "word" begins at the start of the string or after a whitespace, hyphen,
// colon, apostrophe, or opening parenthesis — not mid-word (e.g. "M.Sc" won't
// match "scr" because the period is not a word boundary here).
function matchesWordBoundary(title: string, q: string): boolean {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[\\s\\-:'(])${escaped}`, 'i').test(title);
}

// GET /api/search?q=scream
// Searches TMDB (comprehensive) and annotates results that already have reviews in DB.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  // Require at least 3 characters to avoid noise on very short queries
  if (q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const TMDB_KEY = process.env.TMDB_API_KEY;

  // Query TMDB multi-search and local DB simultaneously
  const [tmdbRes, { data: localMovies }, { data: localShows }] = await Promise.all([
    fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,
      { next: { revalidate: 60 } }
    ).then(r => r.ok ? r.json() : null).catch(() => null),
    supabase.from('movies').select('id').ilike('title', `%${q}%`).limit(50),
    supabase.from('shows').select('id').ilike('title', `%${q}%`).limit(50),
  ]);

  const localMovieIds = new Set((localMovies ?? []).map(m => m.id));
  const localShowIds  = new Set((localShows  ?? []).map(s => s.id));

  const tmdbItems: any[] = tmdbRes?.results ?? [];

  const results = tmdbItems
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    .filter(item => item.title || item.name)
    // Only keep results where the query matches the start of a word in the title.
    // This eliminates mid-word matches like "M.Sc" when searching "scr".
    .filter(item => matchesWordBoundary(item.title ?? item.name ?? '', q))
    .map((item, tmdbIndex) => {
      const isMovie = item.media_type === 'movie';
      const id = item.id;
      const title = isMovie ? item.title : item.name;
      const hasReviews = isMovie ? localMovieIds.has(id) : localShowIds.has(id);
      // Popularity signal: TMDB returns results in relevance+popularity order.
      // We preserve that ordering as a fractional bonus so high-popularity
      // titles break ties within the same bucket.
      const popularityBonus = 1 / (tmdbIndex + 1);
      // Score: reviewed content outranks unreviewed; movies outrank TV within each tier.
      const score = (hasReviews ? 10 : 0) + (isMovie ? 3 : 1) + popularityBonus;
      return {
        id,
        title,
        type: isMovie ? 'movie' as const : 'tv' as const,
        poster_path: item.poster_path ?? null,
        href: isMovie ? `/movie/${id}` : `/show/${id}`,
        hasReviews,
        year: (isMovie ? item.release_date : item.first_air_date)?.substring(0, 4) ?? null,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ score: _score, ...rest }) => rest); // strip internal field

  return NextResponse.json({ results });
}
