import { Play } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getScoreTier } from '@/lib/utils/score-tier';

async function getFeaturedAnime() {
  const apiKey = process.env.TMDB_API_KEY;

  // Prefer anime that already has reviews on the platform
  const { data: reviewedShows } = await supabase
    .from('reviews')
    .select('show_id, recommend, shows(id, title)')
    .not('show_id', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(200);

  if (reviewedShows?.length) {
    const agg = new Map<number, { total: number; recs: number }>();
    for (const r of reviewedShows as any[]) {
      const show = Array.isArray(r.shows) ? r.shows[0] : r.shows;
      if (!show?.id) continue;
      const e = agg.get(show.id) ?? { total: 0, recs: 0 };
      e.total++;
      if (r.recommend) e.recs++;
      agg.set(show.id, e);
    }

    for (const [id, counts] of agg.entries()) {
      const details = await fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      ).then(r => r.ok ? r.json() : null).catch(() => null);

      const isAnime = details?.genres?.some((g: any) => g.id === 16) &&
        (details?.origin_country?.includes('JP') || details?.original_language === 'ja');

      if (!isAnime || !details?.backdrop_path) continue;

      const recPct = counts.total >= 4 ? Math.round((counts.recs / counts.total) * 100) : null;
      const studio = details.production_companies?.[0]?.name ?? null;
      return { ...details, recPct, total: counts.total, studio };
    }
  }

  // Fall back to TMDB top-rated JP anime when no reviews exist yet
  const topAnime = await fetch(
    `https://api.themoviedb.org/3/discover/tv?with_genres=16&with_origin_country=JP&sort_by=vote_average.desc&vote_count.gte=1000&language=en-US&api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const candidates: any[] = topAnime?.results ?? [];
  for (const show of candidates) {
    if (!show.backdrop_path) continue;
    const details = await fetch(
      `https://api.themoviedb.org/3/tv/${show.id}?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    ).then(r => r.ok ? r.json() : null).catch(() => null);

    if (!details) continue;
    const studio = details.production_companies?.[0]?.name ?? null;
    return { ...details, recPct: null, total: 0, studio };
  }

  return null;
}

export async function AnimeHero() {
  const show = await getFeaturedAnime();
  if (!show?.backdrop_path) return null;

  const backdropUrl = `https://image.tmdb.org/t/p/original${show.backdrop_path}`;
  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w780${show.poster_path}`
    : null;

  const tier = show.recPct !== null ? getScoreTier(show.recPct) : null;
  const scoreColor = tier === 'recommend' ? 'text-[#4ADE80]'
    : tier === 'okay' ? 'text-[#FFC107]'
    : tier === 'pass' ? 'text-[#E21D1D]'
    : 'text-white/30';

  const firstAirYear = show.first_air_date?.substring(0, 4);

  return (
    <div
      className="relative w-full min-h-[480px] lg:min-h-[540px] overflow-hidden"
      style={{
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
      {/* Ambient colour wash from poster */}
      {posterUrl && (
        <img
          src={posterUrl}
          aria-hidden alt=""
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-[70px] opacity-25 pointer-events-none select-none"
        />
      )}

      {/* Cinematic backdrop */}
      <img
        src={backdropUrl}
        aria-hidden alt=""
        className="absolute inset-0 w-full h-full object-cover object-right opacity-80 pointer-events-none select-none"
      />

      {/* Left-to-right text gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #111113 0%, #111113cc 22%, #11111360 40%, transparent 65%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center min-h-[480px] lg:min-h-[540px] px-8 lg:px-14 py-10">
        <div className="flex flex-col gap-5 max-w-[580px]">

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E21D1D]">Featured Anime</span>
            {firstAirYear && (
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                · {firstAirYear}
              </span>
            )}
            {show.studio && (
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
                · {show.studio}
              </span>
            )}
          </div>

          <h1 className="text-[clamp(2.2rem,5vw,4.2rem)] font-[950] tracking-[-0.04em] leading-[0.88] uppercase italic text-white">
            {show.name}
          </h1>

          {show.recPct !== null && (
            <div className="flex items-end gap-7 mt-1">
              <div>
                <p className={`text-[3.2rem] font-black leading-none tracking-tight ${scoreColor}`}>
                  {show.recPct}%
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D1D5DB] mt-1.5">
                  Aggregate score
                </p>
              </div>
              <div className="w-px h-10 bg-white/25 mb-5 shrink-0" />
              <div>
                <p className="text-[3.2rem] font-black leading-none tracking-tight text-white">
                  {show.total}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#D1D5DB] mt-1.5">
                  Reviews
                </p>
              </div>
            </div>
          )}

          {show.overview && (
            <p className="text-[#D1D5DB] text-[13px] leading-relaxed max-w-[420px] line-clamp-3">
              {show.overview}
            </p>
          )}

          <Link
            href={`/show/${show.id}`}
            className="self-start mt-1 inline-flex items-center gap-2.5 border border-white/20 bg-white/[0.06] backdrop-blur-sm text-white/80 px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
          >
            <Play size={12} fill="currentColor" />
            See Reviews
          </Link>

        </div>
      </div>
    </div>
  );
}
