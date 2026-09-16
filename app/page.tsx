import { Suspense }           from 'react';
import { LeadStoryBlock }     from '@/components/home/lead-story-block';
import { VerdictFilterBar }   from '@/components/home/verdict-filter-bar';
import { VerdictsWall }       from '@/components/home/verdicts-wall';
import { PosterRail }         from '@/components/home/poster-rail';
import type { VerdictFilter } from '@/lib/data/verdicts-feed';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = 'all' } = await searchParams;
  const safeFilter = (['all', 'recommend', 'skip'].includes(filter) || filter.startsWith('channel:'))
    ? (filter as VerdictFilter)
    : 'all';

  return (
    <div className="w-full overflow-x-hidden">

      {/* ── Lead Story ─────────────────────────────────────────────── */}
      <LeadStoryBlock />

      {/* ── Filter bar (sticky, client) ────────────────────────────── */}
      <Suspense>
        <VerdictFilterBar currentFilter={safeFilter} />
      </Suspense>

      {/* ── Content grid ───────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-5 pb-16">
        <div className="grid grid-cols-12 gap-5">

          {/* Verdicts Wall — cols 1-8 */}
          <main className="col-span-12 lg:col-span-8">
            <Suspense fallback={<WallSkeleton />}>
              <VerdictsWall filter={safeFilter} />
            </Suspense>
          </main>

          {/* Poster Rail — cols 9-12, desktop only, sticky */}
          <aside className="hidden lg:block col-span-4">
            <Suspense fallback={null}>
              <PosterRail />
            </Suspense>
          </aside>

        </div>
      </div>

    </div>
  );
}

function WallSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 280,
            background: 'var(--bg-panel)',
            border: '1px solid var(--bg-panel-edge)',
          }}
        />
      ))}
    </div>
  );
}
