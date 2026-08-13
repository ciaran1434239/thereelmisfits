// components/ui/avatar.tsx
import { cn } from '@/lib/utils/cn';
import { initials } from '@/lib/utils/format';
import type { Reviewer } from '@/lib/types';

interface AvatarProps {
  reviewer: Pick<Reviewer, 'name' | 'color'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: { box: 'w-6 h-6',   text: 'text-[10px]' },
  sm: { box: 'w-8 h-8',   text: 'text-xs' },
  md: { box: 'w-10 h-10', text: 'text-sm' },
  lg: { box: 'w-16 h-16', text: 'text-2xl' },
  xl: { box: 'w-30 h-30', text: 'text-5xl' },
};

export function Avatar({ reviewer, size = 'md', className }: AvatarProps) {
  const s = sizeMap[size];
  return (
    <div
      role="img"
      aria-label={`${reviewer.name} avatar`}
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        s.box,
        s.text,
        className
      )}
      style={{ backgroundColor: reviewer.color }}
    >
      {initials(reviewer.name)}
    </div>
  );
}
