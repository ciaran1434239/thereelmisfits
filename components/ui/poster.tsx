// components/ui/poster.tsx
//
// Portrait 2:3 poster card, used on home/browse/feature surfaces where the
// thing being shown is a *film*, not a *video review of the film*. Sister
// component to VideoThumb (16:9), which still applies on channel pages and
// title-page review lists where the YouTube video is the thing.
//
// Render order:
//   1. If posterUrl is set, <Image fill> that URL on top of the gradient.
//   2. If it errors at load time, the gradient remains visible underneath.
//   3. If posterUrl is unset, gradient alone (current placeholder behaviour).
//
// We use a plain <img> rather than next/image because (a) TMDB's CDN isn't
// in next.config's remotePatterns yet (deliberate — we don't want to lock
// in an image source we'll likely swap), and (b) graceful fallback on
// error is one line of JS instead of three.

import { Clapperboard } from 'lucide-react';
import { posterGradient } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface PosterProps {
  /** Gradient seed — three hex colors. Always present, used as fallback. */
  palette: [string, string, string];
  /** Real poster URL. Optional. */
  posterUrl?: string;
  /** Alt text (and aria-label for the hover overlay). Title of the work. */
  label: string;
  /** Top-right corner — score/verdict pill. */
  recommend?: boolean;
  /** Score 0-10 (individual review). Renders as "9.2". */
  score?: number;
  /** Percentage 0-100 (aggregate consensus). Renders as "86%". Mutually
   *  exclusive with `score`. */
  percent?: number;
  /** Bottom-right — runtime or episode count. */
  runtime?: string;
  /** Show the hover-play affordance (set false for posters that don't link to a video). */
  showPlay?: boolean;
  className?: string;
}

export function Poster({
  palette,
  posterUrl,
  label,
  recommend,
  score,
  percent,
  runtime,
  showPlay = true,
  className,
}: PosterProps) {
  return (
    <div
      className={cn(
        'video-thumb relative aspect-[2/3] rounded-lg overflow-hidden',
        className
      )}
      style={{ background: posterGradient(palette) }}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt={label}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Subtle corner-only darkening so badges remain legible against any
          poster. Lighter than the previous full-card overlay — artwork
          should lead the visual hierarchy, not the gradient. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.30) 100%)',
        }}
      />

      {recommend !== undefined && (
        <div
          className={cn(
            'absolute top-1.5 right-1.5 px-1.5 py-0 rounded text-white text-[10px] font-bold tabular-nums leading-[16px]',
            recommend ? 'bg-green/90' : 'bg-red-deep/90'
          )}
        >
          {percent !== undefined
            ? `${Math.round(percent)}%`
            : score !== undefined
            ? score.toFixed(1)
            : null}
        </div>
      )}

      {runtime && (
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0 bg-black/70 text-white text-[10px] font-medium rounded font-mono leading-[16px]">
          {runtime}
        </div>
      )}

      {showPlay && (
        <div className="video-thumb-play">
          <div className="w-10 h-10 rounded-full bg-red/95 flex items-center justify-center shadow-md">
            <Clapperboard size={18} color="white" strokeWidth={2.25} />
          </div>
        </div>
      )}
    </div>
  );
}
