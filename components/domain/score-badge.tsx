// components/domain/score-badge.tsx
import { cn } from '@/lib/utils/cn';
import type { Consensus, Verdict } from '@/lib/types';
import { getVerdict } from '@/lib/utils/consensus';

interface ScoreBadgeProps {
  consensus: Consensus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<NonNullable<ScoreBadgeProps['size']>, { box: string; num: string; label: string }> = {
  sm: { box: 'w-11 h-11', num: 'text-base', label: 'text-[8px]' },
  md: { box: 'w-16 h-16', num: 'text-2xl',  label: 'text-[9px]' },
  lg: { box: 'w-23 h-23', num: 'text-[38px]', label: 'text-[10px]' },
};

const toneToColor: Record<Verdict['tone'], { text: string; bg: string; border: string }> = {
  green:  { text: 'text-green',    bg: 'bg-green-soft',  border: 'border-l-green' },
  gold:   { text: 'text-gold',     bg: 'bg-gold-soft',   border: 'border-l-gold' },   // Okay tier
  red:    { text: 'text-red-deep', bg: 'bg-red-soft',    border: 'border-l-red-deep' },
  faint:  { text: 'text-faint',    bg: 'bg-surface-alt', border: 'border-l-faint' },
};

export function ScoreBadge({ consensus, size = 'md', className }: ScoreBadgeProps) {
  const verdict = getVerdict(consensus);
  const c = toneToColor[verdict.tone];
  const s = sizeMap[size];
  const display = consensus.recPct ?? '—';

  return (
    <div
      className={cn(
        'shrink-0 border-l-[3px] flex flex-col items-center justify-center gap-0.5',
        s.box,
        c.bg,
        c.border,
        className
      )}
      aria-label={`${verdict.label}, ${display}% recommend`}
    >
      <div className={cn('font-display font-bold leading-none tracking-tight', s.num, c.text)}>
        {display}
        {consensus.recPct !== null && <span className="text-[0.45em] font-bold">%</span>}
      </div>
      <div className={cn('font-mono font-bold tracking-widest', s.label, c.text)}>
        REC
      </div>
    </div>
  );
}
