import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TMDB_KEY = process.env.TMDB_API_KEY;

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: list } = await supabase
    .from('charts')
    .select('*, chart_entries(*)')
    .eq('id', parseInt(id))
    .single();

  if (!list || list.status === 'draft') notFound();

  const rawEntries = [...(list.chart_entries ?? [])].sort((a: any, b: any) => a.rank - b.rank);

  // For entries that have a movie_id but no stored poster_url, fetch from TMDB by ID.
  // This fixes cases where the poster_url column was never populated (e.g. Backrooms, Mandalorian).
  const missingPosterIds = rawEntries
    .filter((e: any) => !e.custom_image_url && !e.poster_url && e.movie_id)
    .map((e: any) => e.movie_id as number);

  const tmdbPosterMap = new Map<number, string>();
  if (missingPosterIds.length && TMDB_KEY) {
    await Promise.all(
      missingPosterIds.map(movieId =>
        fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`, { next: { revalidate: 86400 } })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.poster_path) tmdbPosterMap.set(movieId, `https://image.tmdb.org/t/p/w185${d.poster_path}`); })
          .catch(() => {})
      )
    );
  }

  const entries = rawEntries.map((e: any) => ({
    ...e,
    poster_url: e.poster_url ?? (e.movie_id ? tmdbPosterMap.get(e.movie_id) ?? null : null),
  }));

  const publishedDate = list.published_at
    ? new Date(list.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 380 }}>
        {list.image_url ? (
          <img
            src={list.image_url}
            alt={list.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#111]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent" />

        {/* Breadcrumb */}
        <div className="relative z-10 max-w-[860px] mx-auto px-6 pt-8">
          <Link
            href="/ranked"
            className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            ← Ranked
          </Link>
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[860px] mx-auto px-6 pb-10">
            {/* Category pills */}
            {list.category_tags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {list.category_tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm"
                    style={{ background: '#C8201F', color: 'white' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-black uppercase tracking-tight text-white leading-none mb-2">
              {list.title}
            </h1>
            {list.subtitle && (
              <p className="text-white/50 text-[15px] font-semibold mb-2">{list.subtitle}</p>
            )}
            {publishedDate && (
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25">{publishedDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Entries ──────────────────────────────────────────────── */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12">
        <ol className="flex flex-col">
          {entries.map((entry: any, i: number) => {
            const isFirst = i === 0;
            return (
              <li
                key={entry.id}
                className="flex gap-5 items-start py-6"
                style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                {/* Rank */}
                <div
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-black text-[15px]"
                  style={{ background: isFirst ? '#C8201F' : '#1a1a1a', color: isFirst ? 'white' : 'rgba(255,255,255,0.4)' }}
                >
                  {entry.rank}
                </div>

                {/* Custom artwork (character image) */}
                {entry.custom_image_url && (
                  <img
                    src={entry.custom_image_url}
                    alt=""
                    className="shrink-0 rounded-lg object-cover shadow-md"
                    style={{ width: 64, height: 96 }}
                  />
                )}

                {/* Film poster fallback */}
                {!entry.custom_image_url && entry.poster_url && (
                  <img
                    src={entry.poster_url}
                    alt={entry.title}
                    className="shrink-0 rounded-lg object-cover shadow-md"
                    style={{ width: 56, height: 84 }}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    {entry.movie_id ? (
                      <Link
                        href={`/movie/${entry.movie_id}`}
                        className="text-[18px] font-black text-white hover:text-[#C8201F] transition-colors uppercase tracking-tight leading-tight"
                      >
                        {entry.title}
                      </Link>
                    ) : (
                      <span className="text-[18px] font-black text-white uppercase tracking-tight leading-tight">
                        {entry.title}
                      </span>
                    )}
                    {entry.year && (
                      <span className="text-[12px] font-bold text-white/30 shrink-0">{entry.year}</span>
                    )}
                  </div>
                  {entry.quote && (
                    <p className="text-[14px] text-white/60 leading-relaxed border-l-2 border-[#C8201F]/40 pl-3 italic">
                      {entry.quote}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
