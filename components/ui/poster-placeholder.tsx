import { Film } from 'lucide-react';

/**
 * Styled fallback for cards where a poster image is missing or fails to load.
 * Absolutely positioned so it fills whatever aspect-ratio container wraps it.
 * Matches the exact visual footprint of a real poster — no collapsing.
 */
export function PosterPlaceholder({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#181818]">
      <Film size={22} strokeWidth={1.5} className="text-white/[0.12] shrink-0" />
      <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-white/[0.18] text-center leading-tight line-clamp-3 px-2">
        {title}
      </span>
    </div>
  );
}

/**
 * Compact variant for tiny thumbnail slots (e.g. By The Numbers rows).
 * Same concept, scaled down.
 */
export function TinyPosterPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-[#181818]">
      <Film size={12} strokeWidth={1.5} className="text-white/[0.15] shrink-0" />
      <span className="text-[6px] font-bold text-white/[0.18] text-center leading-tight line-clamp-2 px-0.5">
        {title.slice(0, 10)}
      </span>
    </div>
  );
}
