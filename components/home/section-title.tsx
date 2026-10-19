import Link from 'next/link';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  title: string;
  href?: any;
  hrefLabel?: string;
  below?: ReactNode;
  align?: 'center' | 'left';
}

export function SectionTitle({ title, href, hrefLabel, below, align = 'center' }: SectionTitleProps) {
  return (
    <div className={`flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
      <h2
        style={{
          fontFamily: 'var(--font-headline), Georgia, serif',
          fontWeight: 600,
          fontSize: 'clamp(2rem, 3.6vw, 3rem)',
          lineHeight: 1.1,
          color: '#111',
        }}
      >
        {title}
      </h2>
      {below}
      {href && hrefLabel && (
        <Link href={href} className="text-[13px] font-bold uppercase tracking-[0.1em] hover:underline underline-offset-4" style={{ color: '#C8201F' }}>
          {hrefLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
