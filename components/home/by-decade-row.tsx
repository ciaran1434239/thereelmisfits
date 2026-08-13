import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';

const DECADES = [
  { label: '1970s', href: '/reviews?from_year=1970&to_year=1979' },
  { label: '1980s', href: '/reviews?from_year=1980&to_year=1989' },
  { label: '1990s', href: '/reviews?from_year=1990&to_year=1999' },
  { label: '2000s', href: '/reviews?from_year=2000&to_year=2009' },
  { label: '2010s', href: '/reviews?from_year=2010&to_year=2019' },
  { label: '2020s', href: '/reviews?from_year=2020&to_year=2029' },
];

export function ByDecadeRow() {
  return (
    <section className="w-full">
      <SectionHeading label="Browse by era" title="By Decade" viewAllHref="/reviews" viewAllLabel="All films" />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {DECADES.map(({ label, href }) => (
          <Link
            key={label}
            href={href as any}
            className="group relative flex flex-col items-center justify-center rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 py-6"
          >
            {/* Red top accent on hover — same treatment as genre tiles */}
            <div className="absolute top-0 left-0 w-0 group-hover:w-full h-[2px] bg-[#E21D1D] transition-all duration-300 rounded-t-lg" />

            <span className="text-[16px] sm:text-[18px] font-black text-white/70 group-hover:text-white tracking-[-0.02em] transition-colors">
              {label}
            </span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/25 group-hover:text-white/50 transition-colors">
              Films
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
