import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// TMDB genre IDs
const GENRES = {
  horror: 27,
  comedy: 35,
  action: 28,
  romance: 10749,
  family: 10751,
  thriller: 53,
};

interface SeasonConfig {
  title: string;
  subtitle: string;
  emoji: string;
  genreId: number;
  keywords?: string; // TMDB keyword IDs
}

function getSeason(month: number): SeasonConfig | null {
  if (month === 9 || month === 10) {
    return {
      title: 'Halloween Picks',
      subtitle: 'The scariest films reviewed by creators',
      emoji: '🎃',
      genreId: GENRES.horror,
    };
  }
  if (month === 11 || month === 12) {
    return {
      title: 'Christmas & Holiday',
      subtitle: 'Festive films worth your time',
      emoji: '🎄',
      genreId: GENRES.family,
      keywords: '207317', // christmas keyword on TMDB
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      title: 'Summer Blockbusters',
      subtitle: 'The big films of the season',
      emoji: '☀️',
      genreId: GENRES.action,
    };
  }
  if (month === 1 || month === 2) {
    return {
      title: 'Awards Season',
      subtitle: 'The films the critics are talking about',
      emoji: '🏆',
      genreId: GENRES.thriller,
    };
  }
  // Spring (March–May) — drama season
  return {
    title: 'Spring Picks',
    subtitle: 'Drama and romance worth watching',
    emoji: '🌸',
    genreId: GENRES.romance,
  };
}

async function getSeasonalMovies(genreId: number, keywords?: string) {
  const TMDB_KEY = process.env.TMDB_API_KEY;
  const params = new URLSearchParams({
    api_key: TMDB_KEY!,
    with_genres: String(genreId),
    sort_by: 'vote_count.desc',
    'vote_average.gte': '6.5',
    'vote_count.gte': '1000',
    language: 'en-US',
    page: '1',
  });
  if (keywords) params.set('with_keywords', keywords);

  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?${params}`,
    { next: { revalidate: 86400 } }
  );
  const data = res.ok ? await res.json() : null;
  return (data?.results ?? []).filter((m: any) => m.poster_path).slice(0, 7);
}

export async function SeasonalRow() {
  const month = new Date().getMonth() + 1; // 1-12
  const season = getSeason(month)!;

  const movies = await getSeasonalMovies(season.genreId, season.keywords);
  if (!movies.length) return null;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-red rounded-full" />
          <div>
            <h2 className="text-[16px] font-black uppercase tracking-[0.1em] text-ink">{season.title}</h2>
            <p className="text-[12px] font-semibold text-[#999999] mt-0.5">{season.subtitle}</p>
          </div>
        </div>
        <Link href="/reviews" className="flex items-center gap-1.5 text-[12px] font-bold text-[#777777] hover:text-white transition-colors">
          All reviews <ArrowRight size={11} />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-x-3">
        {movies.map((movie: any) => (
          <Link key={movie.id} href={`/movie/${movie.id}`} className="group flex flex-col">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#222222] mb-2 shadow-sm">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <span className="text-[9px] text-[#777777] font-bold uppercase text-center">{movie.title}</span>
                </div>
              )}
            </div>
            <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-white transition-colors">
              {movie.title}
            </p>
            <p className="text-[12px] text-[#777777] mt-0.5">
              {movie.release_date?.substring(0, 4)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
