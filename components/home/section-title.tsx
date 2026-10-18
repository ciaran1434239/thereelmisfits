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
    <div
      className="flex items-end justify-between gap-4 pt-3 flex-wrap"
      style={{ borderTop: '3px solid #151515' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-editorial, serif)',
          fontWeight: 700,
          fontSize: 'clamp(1.5rem, 2.4vw, 2rem)',
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
          color: '#151515',
        }}
      >
        {title}
      </h2>
      {right}
      {href && hrefLabel && (
        <Link href={href} className="text-[13px] font-bold underline underline-offset-4 hover:text-[#C8201F]" style={{ color: '#151515' }}>
          {hrefLabel} &rarr;
        </Link>
      )}
    </div>
  );
}
