import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: list } = await supabase
    .from('charts')
    .select('*, chart_entries(*)')
    .eq('id', parseInt(id))
    .single();

  if (!list) notFound();

  const entries = [...(list.chart_entries ?? [])].sort((a: any, b: any) => a.rank - b.rank);

  return (
    <div className="bg-[#0F0F0F] min-h-screen">

      {/* Hero */}
      <div className="relative w-full h-[320px] sm:h-[420px] overflow-hidden bg-[#111]">
        {list.image_url && (
          <img
            src={list.image_url}
            alt={list.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-[860px] mx-auto px-6 pb-10">
          <h1 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter text-white leading-none mb-3">
            {list.title}
          </h1>
          {list.subtitle && (
            <p className="text-white/60 text-base font-semibold">{list.subtitle}</p>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12">
        <ol className="flex flex-col gap-6">
          {entries.map((entry: any, i: number) => (
            <li key={entry.id} className="flex gap-5 items-start">
              {/* Rank */}
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${
                i === 0 ? 'bg-[#E21D1D] text-white' : 'bg-[#222222] text-[#777777]'
              }`}>
                {entry.rank}
              </div>

              {/* Poster */}
              {entry.poster_url ? (
                <img
                  src={entry.poster_url}
                  alt={entry.title}
                  className="w-16 shrink-0 aspect-[2/3] object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-16 shrink-0 aspect-[2/3] bg-[#222222] rounded-lg" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {entry.movie_id ? (
                    <Link
                      href={`/movie/${entry.movie_id}`}
                      className="text-[18px] font-black text-white hover:text-white transition-colors uppercase italic tracking-tight leading-tight"
                    >
                      {entry.title}
                    </Link>
                  ) : (
                    <span className="text-[18px] font-black text-white uppercase italic tracking-tight leading-tight">
                      {entry.title}
                    </span>
                  )}
                  {entry.year && (
                    <span className="text-sm font-bold text-[#777777]">{entry.year}</span>
                  )}
                </div>
                {entry.quote && (
                  <p className="mt-2 text-sm text-[#AAAAAA] leading-relaxed italic border-l-2 border-[#E21D1D]/40 pl-3">
                    &quot;{entry.quote}&quot;
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
