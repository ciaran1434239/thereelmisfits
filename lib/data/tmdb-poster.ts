const TMDB_KEY = process.env.TMDB_API_KEY;

export async function fetchPoster(movieId: number, size: 'w154' | 'w342' = 'w154'): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const d = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`, { next: { revalidate: 3600 } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  return d?.poster_path ? `https://image.tmdb.org/t/p/${size}${d.poster_path}` : null;
}

/** Clean film still for cards: backdrop if TMDB has one, otherwise the poster. */
export async function fetchBackdrop(movieId: number): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const d = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`, { next: { revalidate: 3600 } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  if (d?.backdrop_path) return `https://image.tmdb.org/t/p/w780${d.backdrop_path}`;
  if (d?.poster_path) return `https://image.tmdb.org/t/p/w500${d.poster_path}`;
  return null;
}
