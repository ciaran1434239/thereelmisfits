// components/ui/video-thumb.tsx
import { Clapperboard, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { posterGradient } from '@/lib/utils/format';

interface VideoThumbProps {
  /** A 3-tuple of hex colors used for the gradient background. */
  palette: [string, string, string];
  /** Runtime overlay shown bottom-right. e.g. "31:42". */
  runtime?: string;
  /** Top-left badge, e.g. "Lead Story" or "85% REC". */
  label?: string;
  /** Top-right verdict badge — pass true/false to show. */
  recommend?: boolean;
  /** Optional 0–10 score, displayed in the verdict badge if recommend is set. */
  score?: number;
  /** Aspect ratio class. Defaults to 16/9. */
  aspect?: 'video' | 'square' | 'portrait';
  className?: string;
}

const aspectMap = {
  video:    'aspect-video',
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
};

export function VideoThumb({
  palette,
  runtime,
  label,
  recommend,
  score,
  aspect = 'video',
  className,
}: VideoThumbProps) {
  return (
    <div
      className={cn('video-thumb w-full', aspectMap[aspect], className)}
      style={{ background: posterGradient(palette) }}
    >
      {/* Soft top-left highlight for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.10),transparent_70%)]" />
      {/* Bottom shade so any overlay text reads — kept light */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

      {label && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0 bg-black/70 text-white text-[10px] font-semibold rounded leading-[16px]">
          {label}
        </div>
      )}

      {recommend !== undefined && (
        <div
          className={cn(
            'absolute top-1.5 right-1.5 px-1.5 py-0 rounded text-white text-[10px] font-bold flex items-center gap-1 leading-[16px]',
            recommend ? 'bg-green/90' : 'bg-red-deep/90'
          )}
        >
          {recommend ? <ThumbsUp size={9} /> : <ThumbsDown size={9} />}
          {score !== undefined && score.toFixed(1)}
        </div>
      )}

      {runtime && (
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0 bg-black/70 text-white text-[10px] font-medium rounded font-mono leading-[16px]">
          {runtime}
        </div>
      )}

      {/* Hover play button — clapperboard, not YouTube's triangle */}
      <div className="video-thumb-play">
        <div className="w-10 h-10 rounded-full bg-red/95 flex items-center justify-center shadow-md">
          <Clapperboard size={18} color="white" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
