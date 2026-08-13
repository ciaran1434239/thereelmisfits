'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Clapperboard, X } from 'lucide-react';

export interface VideoItem {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  deep_dive_category?: string | null;
  creators: { name: string } | null;
}

export interface CategoryRow {
  category: string;
  slug: string;
  title: string;
  videos: VideoItem[];
}

interface Props {
  rows: CategoryRow[];
  spotlight: VideoItem | null;
}

export function DeepDivesClient({ rows, spotlight }: Props) {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  return (
    <div className="bg-white min-h-screen flex flex-col pb-24 overflow-x-hidden">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-12 flex-1 flex flex-col">

        <header className="mb-12 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Video Essays & Analysis</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-tighter text-gray-900 leading-none">
              DEEP <span className="text-[#E21D1D]">DIVES</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 max-w-sm leading-relaxed md:text-right">
              The best part of a film is talking about it after
            </p>
          </div>
        </header>

        {/* SPOTLIGHT HERO */}
        {spotlight ? (
          <div className="relative w-full h-[60vh] min-h-[450px] rounded-3xl overflow-hidden mb-16 shadow-2xl group bg-gray-900">
            <div className="absolute inset-0">
              <img
                src={spotlight.thumbnail_url}
                alt={spotlight.title}
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-10">
              <div className="flex items-center gap-2 mb-4">
                <Clapperboard className="text-[#E21D1D]" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">
                  Spotlight Essay
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-[950] uppercase tracking-tighter text-white leading-[0.9] mb-4 max-w-4xl drop-shadow-lg">
                {spotlight.title}
              </h2>
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-[#E21D1D] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md">
                  {spotlight.creators?.name}
                </span>
              </div>
              <button
                onClick={() => setActiveVideo(spotlight)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-xl w-fit"
              >
                <Play size={16} fill="black" /> Watch Now
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-[60vh] min-h-[450px] rounded-3xl mb-16 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              Run /api/sync-videos to populate deep dives
            </p>
          </div>
        )}

        {/* CATEGORY ROWS */}
        <div className="flex flex-col gap-12 relative z-20">
          {rows.map((row) => (
            <div key={row.category} className="flex flex-col">
              <div className="flex items-end justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-[900] uppercase tracking-tight text-gray-900 border-l-4 border-[#E21D1D] pl-3 leading-none">
                  {row.title}
                </h2>
                <Link
                  href={`/deep-dives/${row.slug}`}
                  className="group flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Explore All <span className="text-[#E21D1D] group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>

              {row.videos.length === 0 ? (
                <p className="text-gray-400 text-sm py-4">No videos yet — sync coming soon.</p>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {row.videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="group relative flex flex-col flex-none w-[280px] sm:w-[300px] snap-start text-left focus:outline-none transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3 shadow-sm border border-gray-200 group-hover:border-gray-300 group-hover:shadow-md transition-all">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="w-12 h-12 rounded-full bg-[#E21D1D] flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play fill="white" className="text-white ml-1" size={20} />
                          </div>
                        </div>
                      </div>
                      <div className="px-1">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-[#E21D1D] mb-1 truncate">
                          {video.creators?.name}
                        </span>
                        <h3 className="text-sm font-[800] leading-snug text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
            onClick={() => setActiveVideo(null)}
          />
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(226,29,29,0.15)] border border-gray-800 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-50 w-10 h-10 bg-black/50 hover:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/10"
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
