import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Fetch TMDB data for a list of IDs in parallel chunks — stays well under rate limits.
async function fetchInChunks<T>(
  ids: number[],
  fetcher: (id: number) => Promise<T | null>,
  chunkSize = 10,
): Promise<Array<{ id: number; result: T | null }>> {
  const out: Array<{ id: number; result: T | null }> = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async id => ({ id, result: await fetcher(id) })),
    );
    out.push(...results);
  }
  return out;
}

export async function GET() {
  const TMDB_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_KEY) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }

  // ── Movies ────────────────────────────────────────────────────────────────────

  const { data: nullMovies } = await supabase
    .from('movies')
    .select('id')
    .is('release_date', null);

  const movieIds = (nullMovies ?? []).map(m => m.id as number);
  console.log(`🎬 ${movieIds.length} movies missing release_date`);

  let moviesUpdated = 0;
  let moviesFailed = 0;

  if (movieIds.length > 0) {
    const movieResults = await fetchInChunks(movieIds, async (id) => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`,
          { cache: 'no-store' },
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.release_date as string | null;
      } catch {
        return null;
      }
    });

    // Batch the Supabase updates
    for (const { id, result } of movieResults) {
      if (result) {
        const { error } = await supabase
          .from('movies')
          .update({ release_date: result })
          .eq('id', id);
        if (error) {
          console.warn(`  ✗ movie ${id}: ${error.message}`);
          moviesFailed++;
        } else {
          moviesUpdated++;
        }
      } else {
        moviesFailed++;
      }
    }
  }

  console.log(`  ✅ movies: ${moviesUpdated} updated, ${moviesFailed} failed/not found`);

  // ── Shows ─────────────────────────────────────────────────────────────────────

  const { data: nullShows } = await supabase
    .from('shows')
    .select('id')
    .is('first_air_date', null);

  const showIds = (nullShows ?? []).map(s => s.id as number);
  console.log(`📺 ${showIds.length} shows missing first_air_date`);

  let showsUpdated = 0;
  let showsFailed = 0;

  if (showIds.length > 0) {
    const showResults = await fetchInChunks(showIds, async (id) => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=en-US`,
          { cache: 'no-store' },
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.first_air_date as string | null;
      } catch {
        return null;
      }
    });

    for (const { id, result } of showResults) {
      if (result) {
        const { error } = await supabase
          .from('shows')
          .update({ first_air_date: result })
          .eq('id', id);
        if (error) {
          console.warn(`  ✗ show ${id}: ${error.message}`);
          showsFailed++;
        } else {
          showsUpdated++;
        }
      } else {
        showsFailed++;
      }
    }
  }

  console.log(`  ✅ shows: ${showsUpdated} updated, ${showsFailed} failed/not found`);

  return NextResponse.json({
    success: true,
    movies: { found: movieIds.length, updated: moviesUpdated, failed: moviesFailed },
    shows: { found: showIds.length, updated: showsUpdated, failed: showsFailed },
  });
}
