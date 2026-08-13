import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';

export default async function ChannelsPage() {
  const { data: creators } = await supabase
    .from('creators')
    .select('id, name, handle, avatar_url')
    .order('name');

  const { data: reviewCounts } = await supabase
    .from('reviews')
    .select('creator_id');

  const countMap = new Map<string, number>();
  for (const r of reviewCounts || []) {
    countMap.set(r.creator_id, (countMap.get(r.creator_id) ?? 0) + 1);
  }

  const channels = (creators || []).map(c => ({
    ...c,
    reviewCount: countMap.get(c.id) ?? 0,
  }));

  return (
    <div className="min-h-screen">
    <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10">
      <div className="border-b-2 border-[#333333] pb-4 mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">YouTube Critics</h1>
        <p className="text-sm font-bold text-[#777777] uppercase tracking-widest mt-1">
          {channels.length} channels tracked on TheySaid
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/channel/${channel.handle || channel.id}`}
            className="flex items-center gap-4 p-4 bg-[#181818] border border-[#2A2A2A] rounded-xl hover:border-white/30 hover:shadow-sm transition-all group"
          >
            <AvatarImg src={channel.avatar_url} name={channel.name} className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-white group-hover:text-white transition-colors truncate">
                {channel.name}
              </p>
              <p className="text-[11px] font-bold text-[#777777] uppercase tracking-widest mt-0.5">
                {channel.reviewCount} {channel.reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </div>
  );
}
