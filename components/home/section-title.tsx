import Link from 'next/link';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  title: string;
  href?: any;
  hrefLabel?: string;
  right?: ReactNode;
}

export function SectionTitle({ title, href, hrefLabel, right }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <h2
        style={{
          fontFamily: 'var(--font-display), Impact, sans-serif',
          fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)',
          lineHeight: 0.9,
          letterSpacing: '0.01em',
          color: '#151515',
        }}
      >
        {title}<span style={{ color: '#C8201F' }}>.</span>
      </h2>
      {right}
      {href && hrefLabel && (
        <Link href={href} className="text-[13px] font-bold underline decoration-[#C8201F] decoration-2 underline-offset-4 hover:text-[#C8201F]" style={{ color: '#151515' }}>
          {hrefLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
