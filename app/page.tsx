import { Suspense }           from 'react';
import { LeadStoryBlock }     from '@/components/home/lead-story-block';
import { VerdictFilterBar }   from '@/components/home/verdict-filter-bar';
import { VerdictsWall }       from '@/components/home/verdicts-wall';
import { PosterRail }         from '@/components/home/poster-rail';
import { SectionTitle }       from '@/components/home/section-title';
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
    <div className="w-full pb-24" style={{ background: '#F7F4EE', color: '#151515' }}>

      <Suspense fallback={<div style={{ height: 420 }} />}>
        <LeadStoryBlock />
      </Suspense>

      <Suspense fallback={null}>
        <PosterRail />
      </Suspense>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <SectionTitle
          title="Latest Verdicts"
          right={
            <Suspense>
              <VerdictFilterBar currentFilter={safeFilter} />
            </Suspense>
          }
        />
        <div className="mt-6">
          <Suspense fallback={<WallSkeleton />}>
            <VerdictsWall filter={safeFilter} />
          </Suspense>
        </div>
      </section>

    </div>
  );
}

function WallSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ height: 340, background: '#ECE8DE' }} />
      ))}
    </div>
  );
}
