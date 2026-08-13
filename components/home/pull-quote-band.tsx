import { supabase } from '@/lib/supabase';

export async function PullQuoteBand() {
  const now = Date.now();
  const DAY_MS = 86_400_000;
  const ninetyDaysAgo = new Date(now - 90 * DAY_MS).toISOString();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, snippet, posted_at, movies(id, title), creators(name, avatar_url, channel_url)')
    .not('snippet', 'is', null)
    .not('movie_id', 'is', null)
    .gte('posted_at', ninetyDaysAgo)
    .order('posted_at', { ascending: false })
    .limit(60);

  if (!reviews?.length) return null;

  const eligible = (reviews as any[]).filter((r) => {
    const s = r.snippet?.trim();
    return s && s.length >= 40 && s.length <= 280;
  });

  if (!eligible.length) return null;

  // Weekly rotation
  const weekSeed = Math.floor(now / (7 * DAY_MS));
  const idx = weekSeed % eligible.length;
  const pick = eligible[idx];

  const movie = Array.isArray(pick.movies) ? pick.movies[0] : pick.movies;
  const creator = Array.isArray(pick.creators) ? pick.creators[0] : pick.creators;

  if (!movie || !creator) return null;

  return (
    <div className="w-full relative overflow-hidden rounded-[6px] bg-[#1A1A1A] border-l-4 border-[#C8201F] py-8 px-6 sm:px-10">
      <div className="relative">
        {/* opening quote mark */}
        <div className="font-stencil text-[3.5rem] sm:text-[4.5rem] leading-none text-[#C8201F]/25 mb-1 select-none" aria-hidden>
          &ldquo;
        </div>

        <blockquote className="text-[1rem] sm:text-[1.15rem] font-semibold text-ink leading-relaxed italic max-w-[680px] mb-5">
          {pick.snippet}
        </blockquote>

        <div className="flex items-center gap-3">
          {creator.avatar_url && (
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="w-9 h-9 rounded-full border border-white/15 object-cover shrink-0"
            />
          )}
          <div>
            <p className="text-[0.85rem] font-bold text-ink leading-none">{creator.name}</p>
            <p className="text-[0.75rem] text-subtle mt-0.5">on {movie.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
