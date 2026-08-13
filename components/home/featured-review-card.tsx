import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { badgeBg } from '@/lib/utils/score-tier';
import { AvatarImg } from '@/components/ui/avatar-img';

function isGoodSnippet(s: string): boolean {
  if (s.length < 60) return false;
  if (/^[-─═\s*•]+$/.test(s)) return false;
  if (/^[-─═]{3}/.test(s)) return false;
  if (/https?:\/\//.test(s)) return false;
  return true;
}

export async function FeaturedReviewCard({ excludeMovieId }: { excludeMovieId?: number }) {
  const now = Date.now();
  const DAY_MS = 86_400_000;
  // Only look at reviews from the last 60 days so a film that dominated coverage
  // at launch doesn't stay here indefinitely.
  const sixtyDaysAgo = new Date(now - 60 * DAY_MS).toISOString();
  const ninetyDaysAgo = now - 90 * DAY_MS;

  const { data: reviews } = await supabase
    .from('reviews')
    .select('movie_id, recommend, snippet, movies(id, title, backdrop_path, release_date), creators(id, name, avatar_url)')
    .not('movies', 'is', null)
    .gte('posted_at', sixtyDaysAgo);

  if (!reviews?.length) return null;

  // Aggregate to find the most-reviewed recent movie
  const MIN_REVIEWS = 4;

  const movieMap = new Map<number, {
    movie: any;
    total: number;
    scored: number;
    recs: number;
    creators: any[];
    snippets: string[];
  }>();

  for (const r of reviews as any[]) {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies;
    if (!movie?.backdrop_path) continue;
    const existing = movieMap.get(movie.id) ?? { movie, total: 0, scored: 0, recs: 0, creators: [], snippets: [] };
    existing.total++;
    if (r.recommend !== null) existing.scored++;
    if (r.recommend === true) existing.recs++;
    if (r.creators) existing.creators.push(r.creators);
    if (r.snippet && isGoodSnippet(r.snippet)) existing.snippets.push(r.snippet);
    movieMap.set(movie.id, existing);
  }

  const candidates = Array.from(movieMap.values())
    .filter(m => {
      if (m.total < 1) return false;
      // Exclude the hero film so the two sections never show the same title.
      if (excludeMovieId && m.movie.id === excludeMovieId) return false;
      // Exclude films released more than 90 days ago so older titles don't
      // dominate just because they accumulated reviews over a longer period.
      const releaseDate = m.movie.release_date;
      if (releaseDate && new Date(releaseDate).getTime() < ninetyDaysAgo) return false;
      return true;
    })
    .sort((a, b) => b.total - a.total || b.snippets.length - a.snippets.length);

  if (!candidates.length) return null;

  const featured = candidates[0]!;
  const { movie, total, scored, recs, creators, snippets } = featured;
  const pct = scored >= MIN_REVIEWS ? Math.round((recs / scored) * 100) : null;
  const snippet = snippets[0];
  const uniqueCreators = (creators as any[]).filter((c: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === c.id) === i).slice(0, 4);

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group relative block w-full overflow-hidden aspect-[21/9] sm:aspect-[3/1]"
    >
      {/* Backdrop */}
      <img
        src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />

      {/* Left-to-right text gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
      {/* Top fade — bleeds into page background */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0D0D0D] to-transparent" />
      {/* Bottom fade — dissolves into page background */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0D0D0D] to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-10 max-w-[600px]">

        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">Most Discussed</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white leading-tight mb-3 group-hover:text-white transition-colors">
          {movie.title}
        </h2>

        {/* Score + avatars */}
        <div className="flex items-center gap-4 mb-4">
          {pct !== null && (
            <span className={`text-2xl font-black ${pct >= 75 ? 'text-[#2BA640]' : pct >= 50 ? 'text-[#D97706]' : 'text-[#E21D1D]'}`}>
              {pct}%
            </span>
          )}
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
            {total} {total === 1 ? 'review' : 'reviews'}
          </span>
          <div className="flex -space-x-2">
            {uniqueCreators.map((c: any) => (
              <div key={c.id} className="h-6 w-6 rounded-full border-2 border-white/20 overflow-hidden bg-white/10">
                <AvatarImg
                  src={c.avatar_url}
                  name={c.name}
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Snippet */}
        {snippet && (
          <p className="text-[13px] text-white/70 leading-relaxed italic line-clamp-2 mb-4 border-l-2 border-white/20 pl-3">
            "{snippet}"
          </p>
        )}

        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
          Read all reviews <ArrowUpRight size={11} />
        </span>
      </div>
    </Link>
  );
}
