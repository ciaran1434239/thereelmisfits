import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';

// Pure CSS atmospheric gradients — no characters, no faces, just mood.
// Each genre reads distinctly at a glance through colour and gradient direction.
const GENRES = [
  { name: 'Horror',   href: '/reviews?genre_id=27' },
  { name: 'Sci-Fi',   href: '/reviews?genre_id=878' },
  { name: 'Thriller', href: '/reviews?genre_id=53' },
  { name: 'Action',   href: '/reviews?genre_id=28' },
  { name: 'Drama',    href: '/reviews?genre_id=18' },
  { name: 'Comedy',   href: '/reviews?genre_id=35' },
  { name: 'Romance',  href: '/reviews?genre_id=10749' },
  { name: 'Crime',    href: '/reviews?genre_id=80' },
];

export function GenreRow() {
  return (
    <section className="w-full">
      <div className="flex items-end justify-between mb-5">
        <SectionHeading label="Filter by mood" title="Explore Genres" />
        <Link
          href="/reviews"
          className="text-[11px] font-bold text-white/35 hover:text-white transition-colors shrink-0 ml-4 pb-1"
        >
          All Genres →
        </Link>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {GENRES.map((genre) => (
          <Link
            key={genre.name}
            href={genre.href as any}
            className="group relative flex items-center justify-center rounded-lg overflow-hidden bg-[#181818] hover:bg-[#222222] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
            style={{ aspectRatio: '4/3' }}
          >
            {/* Red top-left accent on hover */}
            <div className="absolute top-0 left-0 w-0 group-hover:w-full h-[2px] bg-[#E21D1D] transition-all duration-300" />

            <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.1em] text-white/60 group-hover:text-white transition-colors leading-none">
              {genre.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
