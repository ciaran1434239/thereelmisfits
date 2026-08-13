// components/ui/verdict-pill.tsx
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VerdictPillProps {
  recommend: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'px-2 py-0.5 text-[11px] gap-1',
    icon: 11,
  },
  md: {
    container: 'px-2.5 py-1 text-xs gap-1.5',
    icon: 13,
  },
};

export function VerdictPill({
  recommend,
  size = 'md',
  className,
}: VerdictPillProps) {
  const s = sizeMap[size];
  const Icon = recommend ? ThumbsUp : ThumbsDown;
  const label = recommend ? 'Recommended' : 'Pass';

  return (
    <span
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full font-bold',
        recommend ? 'bg-green-soft text-green' : 'bg-red-soft text-red-deep',
        s.container,
        className
      )}
    >
      <Icon size={s.icon} aria-hidden />
      {recommend ? 'Rec' : 'Pass'}
    </span>
  );
}
