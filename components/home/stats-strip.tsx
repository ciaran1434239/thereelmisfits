import { supabase } from '@/lib/supabase';

export async function StatsStrip() {
  const [reviewsRes, moviesRes, showsRes, creatorsRes] = await Promise.all([
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('movies').select('id', { count: 'exact', head: true }),
    supabase.from('shows').select('id', { count: 'exact', head: true }),
    supabase.from('creators').select('id', { count: 'exact', head: true }),
  ]);

  const reviews  = reviewsRes.count ?? 0;
  const titles   = (moviesRes.count ?? 0) + (showsRes.count ?? 0);
  const critics  = creatorsRes.count ?? 0;

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : String(n);

  const stats = [
    { value: fmt(reviews),  label: 'Reviews indexed' },
    { value: fmt(titles),   label: 'Films & shows' },
    { value: String(critics), label: 'YouTube critics' },
    { value: '100%',         label: 'Independent voices' },
  ];

  return (
    <div
      className="w-full bg-[#1A1A1A] py-6"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center justify-center py-2 px-4 text-center ${
                i < stats.length - 1 ? 'md:border-r border-white/[0.08]' : ''
              }`}
            >
              <span className="text-[2.5rem] sm:text-[3rem] font-black text-white leading-none tracking-tighter">
                {s.value}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/35 mt-1.5">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
