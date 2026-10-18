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
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <h2
        className="inline-block px-4 py-1.5 -rotate-1"
        style={{
          background: '#C8201F',
          color: '#fff',
          boxShadow: '4px 4px 0 0 #151515',
          fontFamily: 'var(--font-editorial, serif)',
          fontWeight: 700,
          fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}
      >
        {title}
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
