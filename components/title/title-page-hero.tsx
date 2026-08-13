import { Share2, Bookmark, Calendar, User, DollarSign, Clock } from 'lucide-react';
import type { Title, Consensus } from '@/lib/types';

interface TitlePageHeroProps {
  title: Title;
  consensus: Consensus;
}

export function TitlePageHero({ title, consensus }: TitlePageHeroProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. THE POSTER: High-res dummy image */}
      <div className="w-full aspect-[2/3] rounded-2xl shadow-xl border border-[#2A2A2A] overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop`}
          alt={title.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. THE NEW INFO BOX: No Verdict, just Data */}
      <div className="bg-[#181818] rounded-2xl border border-[#2A2A2A] p-8">
        <p className="text-[11px] font-bold text-[#777777] uppercase tracking-widest mb-1">
          What <span className="text-white underline decoration-[#FF0000] decoration-2 underline-offset-4">they said</span> about
        </p>
        <h3 className="text-xl font-black text-white leading-tight mb-6">
          {title.title}
        </h3>

        <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-3 text-sm text-[#D4D4D4]">
            <Calendar size={16} className="text-[#777777]" />
            <span className="font-bold">Released:</span> {title.year}
          </div>
          <div className="flex items-center gap-3 text-sm text-[#D4D4D4]">
            <User size={16} className="text-[#777777]" />
            <span className="font-bold">Cast:</span> Adrien Brody, Felicity Jones
          </div>
          <div className="flex items-center gap-3 text-sm text-[#D4D4D4]">
            <DollarSign size={16} className="text-[#777777]" />
            <span className="font-bold">Box Office:</span> $12.4M (Limited)
          </div>
          <div className="flex items-center gap-3 text-sm text-[#D4D4D4]">
            <Clock size={16} className="text-[#777777]" />
            <span className="font-bold">Runtime:</span> 215 min
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <button className="flex items-center justify-center gap-2 py-2.5 border border-[#2A2A2A] rounded-lg text-[11px] font-bold uppercase text-[#999999] hover:bg-[#1E1E1E] hover:text-white transition-colors">
            <Share2 size={14} /> Share
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 border border-[#2A2A2A] rounded-lg text-[11px] font-bold uppercase text-[#999999] hover:bg-[#1E1E1E] hover:text-white transition-colors">
            <Bookmark size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
