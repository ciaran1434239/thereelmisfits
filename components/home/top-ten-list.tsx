// components/home/top-ten-list.tsx
//
// The editor's Top 10. Text-led, low-image, intentionally a different shape
// from the poster grids around it — that contrast is the whole point. Acts
// as a visual breather between picture-heavy sections and gives the page
// somewhere for editorial voice to land.
//
// Layout: single column on mobile, two columns at lg+ (5 entries per
// column reads as a "real" Top 10 once the list is full).
//
// Tiny 40×60 poster strip on the left of each row is decoration, not the
// content — the *list* is the content. If posters were any larger this
// would just be another image grid.

import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { listTopTen } from '@/lib/api';
import { posterGradient } from '@/lib/utils/format';

export async function TopTenList() {
  const entries = await listTopTen();
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="top-ten-heading" className="mb-9">
      <h2 id="top-ten-heading" className="sr-only">
        Top 10 films and TV of the year
      </h2>
      <SectionHeader
        title="Top 10 of the year"
        subtitle="The editor's pick, ranked"
      />

      <ol className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-1 mt-4">
        {entries.map(({ rank, blurb, title }) => (
          <li
            key={title.id}
            className="flex gap-4 py-3 border-b border-border last:border-b-0 lg:[&:nth-last-child(2)]:border-b-0"
          >
            {/* Big rank numeral — the visual anchor of the row */}
            <div
              className="font-display text-[44px] leading-none font-bold text-faint shrink-0 w-[52px] tabular-nums"
              aria-hidden="true"
            >
              {rank}
            </div>

            {/* Tiny poster — decoration only, the list is the content */}
            <Link
              href={`/movie/${title.id}`}
              className="shrink-0"
              aria-hidden="true"
              tabIndex={-1}
            >
              <div
                className="w-[44px] h-[66px] rounded relative overflow-hidden"
                style={{ background: posterGradient(title.poster) }}
              >
                {title.posterUrl && (
                  <img
                    src={title.posterUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/movie/${title.id}`}
                className="block font-semibold text-[15px] text-ink hover:text-red transition-colors"
              >
                {title.title}
                <span className="text-subtle font-normal ml-1.5">
                  ({title.year})
                </span>
              </Link>
              <p className="text-[13px] text-body leading-snug mt-1">
                {blurb}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
