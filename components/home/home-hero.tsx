import { Play } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';
import { getFeaturedMovieId } from '@/lib/data/featured-movie';

async function getFeaturedMovie() {
  const apiKey = process.env.TMDB_API_KEY;

  // Resolve featured movie ID via shared cached function (deduplicates with page.tsx call)
  const movieId = await getFeaturedMovieId();
  if (!movieId) return null;

  const details = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  ).then(res => res.ok ? res.json() : null).catch(() => null);

  if (!details?.poster_path) return null;

  const { data: movieReviews } = await supabase
    .from('reviews')
    .select('recommend')
    .eq('movie_id', movieId);

  const total  = movieReviews?.length ?? 0;
  const scored = (movieReviews ?? []).filter(r => r.recommend !== null).length;
  const recs   = (movieReviews ?? []).filter(r => r.recommend === true).length;
  const recPct = scored >= 4 ? Math.round((recs / scored) * 100) : null;

  const { data: topReviews } = await supabase
    .from('reviews')
    .select('id, recommend, creators(id, name, avatar_url)')
    .eq('movie_id', movieId)
    .not('recommend', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(4);

  return { ...details, recPct, total, topReviews: topReviews ?? [] };
}

export async function HomeHero() {
  const movie = await getFeaturedMovie();
  if (!movie?.poster_path) return null;

  const posterUrl = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  const scoreColor = movie.recPct !== null ? 'text-[#C8201F]' : 'text-white/30';

  return (
    <div
      className="relative w-full min-h-[480px] lg:min-h-[540px] overflow-hidden"
      style={{
        // mask-image feathers all four edges seamlessly into the page bg
        maskImage: [
          'linear-gradient(to right,  transparent 0%, black 7%, black 87%, transparent 100%)',
          'linear-gradient(to bottom, transparent 0%, black 5%, black 88%, transparent 100%)',
        ].join(', '),
        maskComposite: 'intersect',
        WebkitMaskImage: [
          'linear-gradient(to right,  transparent 0%, black 7%, black 87%, transparent 100%)',
          'linear-gradient(to bottom, transparent 0%, black 5%, black 88%, transparent 100%)',
        ].join(', '),
        WebkitMaskComposite: 'destination-in',
      }}
    >

      {/* ── Ambient colour wash — blurred poster as bias light ── */}
      <img
        src={posterUrl}
        aria-hidden
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-[70px] opacity-25 pointer-events-none select-none"
      />

      {/* ── Cinematic backdrop — full colour, right-weighted ── */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          aria-hidden
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-right opacity-80 pointer-events-none select-none"
        />
      )}

      {/* ── Gradient: strong left column, bottom fade for critic strip legibility ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to right, #111111 0%, #111111ee 28%, #11111199 48%, transparent 70%)',
            'linear-gradient(to top, #111111cc 0%, transparent 35%)',
          ].join(', '),
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-center min-h-[480px] lg:min-h-[540px] px-8 lg:px-14 py-10">
        <div className="flex flex-col gap-5 max-w-[580px]">

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E21D1D]">The Big Release</span>
            {movie.release_date && (
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                · {movie.release_date.substring(0, 4)}
              </span>
            )}
          </div>

          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-[950] tracking-[-0.04em] leading-[0.88] uppercase italic text-white">
            {movie.title}
          </h1>

          {movie.recPct !== null && (
            <div className="flex items-end gap-7 mt-1">
              <div>
                <p className={`text-[3.2rem] font-black leading-none tracking-tight ${scoreColor}`}>
                  {movie.recPct}%
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D1D5DB] mt-1.5">
                  Aggregate score
                </p>
              </div>
              <div className="w-px h-10 bg-white/25 mb-5 shrink-0" />
              <div>
                <p className="text-[3.2rem] font-black leading-none tracking-tight text-white">
                  {movie.total}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D1D5DB] mt-1.5">
                  Reviews
                </p>
              </div>
            </div>
          )}

          {movie.overview && (
            <p className="text-[#D1D5DB] text-[13px] leading-relaxed max-w-[420px] line-clamp-3">
              {movie.overview}
            </p>
          )}

          <Link
            href={`/movie/${movie.id}`}
            className="btn-primary self-start mt-1"
          >
            <Play size={12} fill="currentColor" />
            See Reviews
          </Link>

        </div>
      </div>

      {/* ── Inline critic strip — bottom of hero, shows same film ── */}
      {movie.topReviews.length > 0 && (
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
          <div className="px-8 lg:px-14 pb-4 flex items-center gap-3">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pointer-events-auto">
              {movie.topReviews.map((r: any) => {
                const creator = Array.isArray(r.creators) ? r.creators[0] : r.creators;
                if (!creator) return null;
                return (
                  <div
                    key={r.id}
                    className="flex-none flex items-center gap-2 bg-white/[0.15] border border-white/[0.15] rounded-lg px-2.5 py-1.5"
                  >
                    <AvatarImg
                      src={creator.avatar_url}
                      name={creator.name || '?'}
                      className="w-5 h-5 shrink-0"
                    />
                    <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">{creator.name}</span>
                    <span className={`text-[9px] font-black shrink-0 ${r.recommend ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                      {r.recommend ? '✓' : '✗'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
