import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface FeaturesRowProps {
  title?: string;
  subtitle?: string;
}

export async function FeaturesRow({
  title = "The Deep Dives",
  subtitle = "Must-Watch YouTube Essays",
}: FeaturesRowProps) {
  const { data: videos } = await supabase
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, published_at, creators(name)')
    .eq('type', 'deep_dive')
    .order('published_at', { ascending: false })
    .limit(4);

  const items = (videos || []) as any[];

  if (items.length === 0) {
    return (
      <section className="w-full">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</h2>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{subtitle}</p>
          </div>
        </div>
        <div className="py-10 border-2 border-dashed border-gray-100 rounded-xl text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">No videos yet — run /api/sync-videos</span>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</h2>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((v) => {
          const creatorName = Array.isArray(v.creators) ? v.creators[0]?.name : v.creators?.name;
          return (
            <a
              key={v.id}
              href={`https://youtube.com/watch?v=${v.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block cursor-pointer"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3">
                {v.thumbnail_url ? (
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200" />
                )}
                <div className="absolute top-2 left-2 bg-white/10 border border-white/15 text-[9px] text-white/50 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest">
                  Essay
                </div>
              </div>
              <h3 className="text-[13px] font-black uppercase italic leading-tight mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
                {v.title}
              </h3>
              {creatorName && (
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  By {creatorName}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
