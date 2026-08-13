import { supabase } from '@/lib/supabase';
import { Film, MessageSquare, Users } from 'lucide-react';

export async function StatsBar() {
  const [{ count: movieCount }, { count: reviewCount }, { count: channelCount }] = await Promise.all([
    supabase.from('movies').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('creators').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { value: movieCount ?? 0, label: 'Films Reviewed', icon: Film },
    { value: reviewCount ?? 0, label: 'Creator Reviews', icon: MessageSquare },
    { value: channelCount ?? 0, label: 'YouTube Channels', icon: Users },
  ];

  return (
    <div className="flex items-stretch gap-0 mb-14 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
      {stats.map(({ value, label, icon: Icon }, i) => (
        <div
          key={label}
          className={`flex-1 flex items-center gap-4 px-6 py-5 ${i < 2 ? 'border-r border-gray-100' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#E21D1D]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-[950] tracking-tighter text-gray-900 leading-none">
              {value.toLocaleString()}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mt-1">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
