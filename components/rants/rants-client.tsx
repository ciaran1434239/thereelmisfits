'use client';

import { useState } from 'react';
import { Play, Flame, Star, MessageSquareWarning, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RantVideo {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  type: 'rant' | 'rave';
  creators: { name: string } | null;
}

interface Props {
  videos: RantVideo[];
}

export function RantsClient({ videos }: Props) {
  const [filter, setFilter] = useState<'all' | 'rant' | 'rave'>('all');
  const [activeVideo, setActiveVideo] = useState<RantVideo | null>(null);

  const filtered = videos.filter(v => filter === 'all' || v.type === filter);

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-12 flex-1">

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquareWarning className="text-[#E21D1D]" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">The Creator Feed</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-tighter text-gray-900 leading-none">
                RANTS & <span className="text-[#E21D1D]">RAVES</span>
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-3 max-w-md leading-relaxed">
                The loudest opinions, sharpest takedowns, and deepest dives on YouTube
              </p>
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-xl self-start md:self-end">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="The Full Feed" />
              <FilterButton
                active={filter === 'rant'}
                onClick={() => setFilter('rant')}
                label="Rants 😡"
                activeClass="bg-[#E21D1D] text-white shadow-md"
              />
              <FilterButton
                active={filter === 'rave'}
                onClick={() => setFilter('rave')}
                label="Raves 🤯"
                activeClass="bg-green-600 text-white shadow-md shadow-green-500/20"
              />
            </div>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              {videos.length === 0
                ? 'Run /api/sync-videos to populate rants & raves'
                : 'No videos in this category yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group flex flex-col text-left focus:outline-none"
              >
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-4 shadow-lg">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/10 transition-colors duration-300 transform group-hover:scale-110 shadow-xl">
                      <Play fill="white" className="text-white ml-1" size={24} />
                    </div>
                  </div>
                  <div className={cn(
                    'absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-lg flex items-center gap-1.5',
                    video.type === 'rant' ? 'bg-[#E21D1D] text-white' : 'bg-green-500 text-white'
                  )}>
                    {video.type === 'rant' ? <Flame size={12} /> : <Star size={12} />}
                    {video.type === 'rant' ? 'Rant' : 'Rave'}
                  </div>
                </div>

                <div className="flex flex-col flex-1 w-full">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    {video.creators?.name}
                  </span>
                  <h3 className="text-lg font-[900] uppercase tracking-tight text-gray-900 leading-snug group-hover:text-white transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setActiveVideo(null)}
          />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-50 w-10 h-10 bg-black/50 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Close video"
            >
              <X size={20} />
            </button>
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active, onClick, label, activeClass = 'bg-white text-gray-900 shadow-sm'
}: {
  active: boolean; onClick: () => void; label: string; activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300',
        active ? activeClass : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
      )}
    >
      {label}
    </button>
  );
}
