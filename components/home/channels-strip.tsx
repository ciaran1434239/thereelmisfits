import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';

export async function ChannelsStrip() {
  const { data: creators } = await supabase
    .from('creators')
    .select('id, name, handle, avatar_url')
    .order('name');

  const channels = creators || [];

  if (!channels.length) return null;

  return (
    <div className="w-full border-t border-[#333333] pt-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-black uppercase tracking-[0.1em] text-ink">
          The Critics
        </h3>
        <Link href="/channels" className="flex items-center gap-1.5 text-[12px] font-bold text-[#777777] hover:text-white transition-colors">
          All {channels.length} channels <ArrowRight size={11} />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/channel/${channel.handle || channel.id}`}
            className="flex items-center gap-2 group bg-[#181818] border border-[#2A2A2A] rounded-full px-3 py-1.5 hover:border-white/30 hover:shadow-sm transition-all"
          >
            <AvatarImg src={channel.avatar_url} name={channel.name} className="w-5 h-5" />
            <span className="text-[12px] font-bold text-[#D4D4D4] group-hover:text-white transition-colors whitespace-nowrap">
              {channel.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
