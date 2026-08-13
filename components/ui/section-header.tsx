// components/ui/section-header.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** If provided, renders a "See all →" link to the given href. */
  moreHref?: string;
}

export function SectionHeader({ title, subtitle, moreHref }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-[22px] font-bold leading-tight tracking-display-md text-ink m-0">
          {title}
        </h2>
        {subtitle && <div className="text-[13px] text-subtle mt-1">{subtitle}</div>}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          className="text-[13px] text-blue font-semibold flex items-center gap-0.5 hover:underline"
        >
          See all <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
