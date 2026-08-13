// components/domain/title-card.tsx
//
// Title-led card showing a film + its consensus. Two visual variants:
//
//   `variant="poster"`  — 2:3 portrait. Used wherever the *film* is the
//                         hero (Top of Chart, Latest Verdicts, Browse).
//                         Default. Standardises the page on a single
//                         film-card shape.
//
//   `variant="video"`   — 16:9 landscape. Reserved for surfaces where
//                         the user is choosing which *review video* to
//                         watch (channel pages, future "watch" feeds).
//                         Almost never used on home; kept for the rare
//                         video-led surface.

import Link from 'next/link';
import { Poster } from '@/components/ui/poster';
import { VideoThumb } from '@/components/ui/video-thumb';
import type { Title, Consensus } from '@/lib/types';

interface TitleCardProps {
  title: Title & { href?: string };
  consensus: Consensus;
  variant?: 'poster' | 'video';
}

export function TitleCard({ title, consensus, variant = 'poster' }: TitleCardProps) {
  const recPctLabel = consensus.recPct !== null ? `${consensus.recPct}% REC` : 'No verdict';
  const href = title.href ?? `/movie/${title.id}`;

  return (
    <article className="group">
      <Link href={href as any} className="block">
        {variant === 'poster' ? (
          <Poster
            palette={title.poster}
            posterUrl={title.posterUrl}
            label={title.title}
            // Only show badge when we have a real score (MIN_REVIEWS met)
            recommend={consensus.recPct !== null ? consensus.recPct >= 75 : undefined}
            percent={consensus.recPct ?? undefined}
          />
        ) : (
          <VideoThumb
            palette={title.poster}
            runtime={title.runtime}
            label={recPctLabel}
          />
        )}
        
        {/* UPDATED TYPOGRAPHY: Editorial, bold, scannable */}
        <div className="mt-3">
          <h3 className="text-sm font-[900] uppercase tracking-tight text-gray-900 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {title.title}
          </h3>
          
          <div className="text-[11px] font-bold text-gray-500 mt-1">
            {title.year} <span className="mx-1 text-gray-300">|</span> {title.director}
          </div>
          
          {/* Stripped out the "Certified" logic — just pure, clean review counts now */}
          <div className="text-[10px] font-black uppercase tracking-widest text-[#E21D1D] mt-1.5">
            {consensus.total} {consensus.total === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>
      </Link>
    </article>
  );
}