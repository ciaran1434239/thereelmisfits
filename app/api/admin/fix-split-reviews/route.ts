import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * One-time fix: find all reviews stored under shows whose title is a variant of
 * the target movie title (e.g. "Star Wars: The Mandalorian and Grogu | A Special Look")
 * and reclassify them to the correct movie_id.
 *
 * GET /api/admin/fix-split-reviews?movie_id=1228710&dry_run=true
 * GET /api/admin/fix-split-reviews?movie_id=1228710
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const movieId = parseInt(url.searchParams.get('movie_id') ?? '0');
  const dryRun = url.searchParams.get('dry_run') !== 'false';

  if (!movieId) {
    return NextResponse.json({ error: 'movie_id required' }, { status: 400 });
  }

  // Get the canonical movie title
  const { data: movie, error: movieErr } = await supabase
    .from('movies')
    .select('id, title')
    .eq('id', movieId)
    .single();

  if (movieErr || !movie) {
    return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
  }

  const normMovie = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Find all shows whose normalised title starts with the movie's normalised title
  const { data: shows } = await supabase
    .from('shows')
    .select('id, title');

  const matchingShows = (shows ?? []).filter(s => {
    const normShow = s.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normShow !== normMovie &&
      normShow.length >= 10 &&
      normMovie.length >= 10 &&
      (normShow.startsWith(normMovie) || normMovie.startsWith(normShow));
  });

  if (!matchingShows.length) {
    return NextResponse.json({ message: 'No matching shows found', movie: movie.title });
  }

  // Get all reviews for those shows
  const showIds = matchingShows.map(s => s.id);
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, title, creators(name)')
    .in('show_id', showIds);

  if (!reviews?.length) {
    return NextResponse.json({
      message: 'Matching shows found but no reviews to move',
      matchingShows: matchingShows.map(s => s.title),
    });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      movie: movie.title,
      matchingShows: matchingShows.map(s => s.title),
      reviewsToMove: reviews.map(r => ({
        id: r.id,
        title: r.title,
        creator: (r.creators as any)?.name,
      })),
      hint: 'Add ?dry_run=false to actually apply the fix',
    });
  }

  // Move all reviews to the correct movie
  const { error: updateErr } = await supabase
    .from('reviews')
    .update({ movie_id: movieId, show_id: null, season_number: null })
    .in('id', reviews.map(r => r.id));

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    movie: movie.title,
    moved: reviews.length,
    fromShows: matchingShows.map(s => s.title),
    reviews: reviews.map(r => ({ id: r.id, creator: (r.creators as any)?.name })),
  });
}
