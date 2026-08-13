'use client';

import { useState } from 'react';
import { Film } from 'lucide-react';

/**
 * Renders a TMDB poster image with a styled dark fallback if the image
 * fails to load or TMDB returns a placeholder. Handles the case where
 * poster_path is non-null but the actual image is missing/placeholder.
 */
export function SmartPoster({
  src,
  title,
  size = 'w342',
  className = 'absolute inset-0 w-full h-full object-cover',
}: {
  src: string | null;
  title: string;
  size?: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <PosterFallback title={title} />;
  }

  return (
    <img
      src={`https://image.tmdb.org/t/p/${size}${src}`}
      alt={title}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Compact variant for small row thumbnails (43×64 px slot).
 */
export function SmartTinyPoster({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <TinyPosterFallback title={title} />;
  }

  return (
    <img
      src={`https://image.tmdb.org/t/p/w154${src}`}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-200"
      onError={() => setFailed(true)}
    />
  );
}

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#181818]">
      <Film size={22} strokeWidth={1.5} className="text-white/[0.12] shrink-0" />
      <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-white/[0.18] text-center leading-tight line-clamp-3 px-3">
        {title}
      </span>
    </div>
  );
}

function TinyPosterFallback({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#181818]">
      <Film size={12} strokeWidth={1.5} className="text-white/[0.15] shrink-0" />
      <span className="text-[6px] font-bold text-white/[0.18] text-center leading-tight line-clamp-2 px-0.5">
        {title.slice(0, 14)}
      </span>
    </div>
  );
}
