export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ListOrdered, Archive } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'The Lists · The Reel Misfits',
  description: 'The definitive lists, according to us.',
};

export default async function ChartsPage() {
  const { data: featuredChart } = await supabase
    .from('charts')
    .select('*, chart_entries(*)')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  const { data: archiveCharts } = await supabase
    .from('charts')
    .select('id, title, subtitle, image_url, published_at')
    .eq('is_featured', false)
    .order('published_at', { ascending: false });

  const topTenList = ((featuredChart?.chart_entries ?? []) as any[])
    .sort((a, b) => a.rank - b.rank);

  const archive = (archiveCharts ?? []) as any[];

  return (
    <div className="min-h-screen flex flex-col pb-24 scroll-smooth">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-12 flex-1 flex flex-col">

        <header className="mb-12 border-b border-[#333333] pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#777777]">Lists To Argue Over</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-tighter text-white leading-none">
              THE <span className="text-[#E21D1D]">LISTS</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[#999999] max-w-sm leading-relaxed md:text-right">
              Because everyone has a better list
            </p>
          </div>
        </header>

        {!featuredChart ? (
          <div className="py-24 border-2 border-dashed border-[#333333] rounded-3xl text-center mb-16">
            <p className="text-sm font-black uppercase tracking-widest text-[#777777] mb-2">No featured chart yet</p>
            <p className="text-xs text-[#777777]">
              Add a row to <code className="bg-[#1E1E1E] px-1 rounded">charts</code> with <code className="bg-[#1E1E1E] px-1 rounded">is_featured = true</code>, then add its movies to <code className="bg-[#1E1E1E] px-1 rounded">chart_entries</code>.
            </p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div
              className="relative w-full h-[60vh] min-h-[400px] rounded-3xl overflow-hidden mb-16 shadow-2xl bg-cover bg-center group bg-[#181818]"
              style={{ backgroundImage: featuredChart.image_url ? `url('${featuredChart.image_url}')` : undefined }}
            >
              <div className="absolute inset-0 bg-black/50 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                <div className="bg-[#E21D1D] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded w-max mb-4">
                  Featured List
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-[950] text-white uppercase italic tracking-tight leading-[0.9] mb-4">
                  {featuredChart.title}
                </h2>
                {featuredChart.subtitle && (
                  <p className="text-[#D4D4D4] font-bold max-w-xl text-sm md:text-base uppercase tracking-wider mb-6 drop-shadow-md">
                    {featuredChart.subtitle}
                  </p>
                )}
                <a href="#the-list" className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest hover:gap-4 transition-all w-max cursor-pointer drop-shadow-md">
                  See the Rankings <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* List */}
            <div className="grid lg:grid-cols-3 gap-16 mb-24">
              <div className="lg:col-span-2">
                <div id="the-list" className="flex items-center gap-3 mb-8 scroll-mt-8">
                  <ListOrdered className="text-[#E21D1D]" size={28} />
                  <h2 className="text-3xl font-[900] uppercase tracking-tight text-white">
                    {featuredChart.title}
                  </h2>
                </div>

                {topTenList.length === 0 ? (
                  <p className="text-sm font-bold text-[#777777] uppercase tracking-widest py-12">
                    Add entries to <code className="bg-[#1E1E1E] px-1 rounded">chart_entries</code> in Supabase.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {topTenList.map((item: any, index: number) => (
                      <Link
                        key={item.id}
                        href={item.movie_id ? `/movie/${item.movie_id}` : '#'}
                        className="group flex items-center gap-4 sm:gap-6 bg-[#181818] p-4 rounded-2xl border border-[#2A2A2A] hover:border-[#333333] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      >
                        <div className="w-12 sm:w-16 text-center shrink-0">
                          <span className="text-4xl sm:text-5xl font-[950] text-[#333333] group-hover:text-white transition-colors tracking-tighter">
                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </span>
                        </div>
                        <div className="w-16 sm:w-20 shrink-0 aspect-[2/3] bg-[#222222] rounded-lg overflow-hidden shadow-inner">
                          {item.poster_url && (
                            <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 py-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-lg font-[900] uppercase tracking-tight text-white group-hover:text-white transition-colors leading-tight mb-1 truncate">
                            {item.title}
                          </h3>
                          {item.year && (
                            <div className="text-[11px] font-bold text-[#999999] uppercase tracking-widest mb-2">
                              {item.year}
                            </div>
                          )}
                          {item.quote && (
                            <p className="text-[11px] sm:text-xs font-medium text-[#AAAAAA] italic border-l-2 border-[#E21D1D]/30 pl-3 py-1 my-1.5 group-hover:border-white/30 group-hover:text-[#D4D4D4] transition-colors leading-relaxed">
                              &quot;{item.quote}&quot;
                            </p>
                          )}
                          {(item.rec_pct != null || item.review_count > 0) && (
                            <div className="flex items-center gap-3 mt-2">
                              {item.rec_pct != null && (
                                <div className={cn(
                                  'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm',
                                  item.rec_pct >= 75 ? 'bg-green-100 text-green-800' : item.rec_pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                )}>
                                  {item.rec_pct}% REC
                                </div>
                              )}
                              {item.review_count > 0 && (
                                <div className="text-[10px] font-bold text-[#777777] uppercase tracking-widest">
                                  {item.review_count} Reviews
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Archive */}
        <div className="border-t-2 border-[#2A2A2A] pt-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Archive className="text-[#E21D1D]" size={24} />
                <h2 className="text-3xl font-[900] uppercase tracking-tight text-white">The Archive</h2>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#999999]">Every list we&apos;ve ever published.</p>
            </div>
          </div>

          {archive.length === 0 ? (
            <p className="text-sm font-bold text-[#777777] uppercase tracking-widest py-12 text-center">
              Previous charts will appear here as you publish them.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {archive.map((chart: any, i: number) => (
                <div key={chart.id} className={cn(
                  'group block p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden',
                  i % 2 === 0 ? 'bg-[#181818]' : 'bg-[#1E1E1E]'
                )}>
                  <div className="relative z-10 flex flex-col h-full justify-between min-h-[160px]">
                    <h3 className="text-xl font-[900] uppercase tracking-tight text-white mb-2 pr-4 leading-snug group-hover:text-white transition-colors">
                      {chart.title}
                    </h3>
                    {chart.subtitle && (
                      <p className="text-[13px] font-medium text-[#999999] line-clamp-2 pr-2 mb-4 leading-snug">
                        {chart.subtitle}
                      </p>
                    )}
                    <div className="flex items-end justify-between mt-auto">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#777777]">
                        {new Date(chart.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <ArrowRight size={16} className="text-[#777777] group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
