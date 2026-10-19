import { Suspense }           from 'react';
import { LeadStoryBlock }     from '@/components/home/lead-story-block';
import { VerdictFilterBar }   from '@/components/home/verdict-filter-bar';
import { VerdictsWall }       from '@/components/home/verdicts-wall';
import { PosterRail }         from '@/components/home/poster-rail';
import { SectionTitle }       from '@/components/home/section-title';
import { ChartsTrio }         from '@/components/home/charts-trio';
import { getVerdictsFeed }    from '@/lib/data/verdicts-feed';
import { getLeadStory }       from '@/lib/data/lead-story';
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

  const lead = await getLeadStory();
  const exclude = lead ? [lead.movieId] : [];

  const [latest, filtered] = await Promise.all([
    getVerdictsFeed('all', 27, exclude),
    safeFilter === 'all' ? Promise.resolve(null) : getVerdictsFeed(safeFilter, 24, exclude),
  ]);
  const justIn = latest.slice(0, 3);
  const wall   = filtered ?? latest.slice(3);

  return (
    <div className="w-full pb-28">

      <LeadStoryBlock justIn={justIn} />

      <Suspense fallback={null}>
        <PosterRail />
      </Suspense>

      <Suspense fallback={null}>
        <ChartsTrio />
      </Suspense>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
        <SectionTitle
          title="Latest verdicts"
          below={
            <Suspense>
              <VerdictFilterBar currentFilter={safeFilter} />
            </Suspense>
          }
        />
        <div className="mt-10">
          <VerdictsWall items={wall} />
        </div>
      </section>

    </div>
  );
}
