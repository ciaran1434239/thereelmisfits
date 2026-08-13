// components/home/featured-channels-row.tsx
import { SectionHeader } from '@/components/ui/section-header';
import { ChannelCard } from '@/components/domain/channel-card';
import { listReviewers, listReviewsByReviewer } from '@/lib/api';

export async function FeaturedChannelsRow() {
  const all = await listReviewers();
  const enriched = await Promise.all(
    all.slice(0, 4).map(async (reviewer) => {
      const reviews = await listReviewsByReviewer(reviewer.id);
      return { reviewer, reviews };
    })
  );

  return (
    <section aria-labelledby="channels-heading" className="mb-9">
      <h2 id="channels-heading" className="sr-only">Channels we track</h2>
      <SectionHeader
        title="Channels we track"
        subtitle="The reviewers powering the consensus"
        moreHref="/channels"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4">
        {enriched.map(({ reviewer, reviews }) => (
          <ChannelCard key={reviewer.id} reviewer={reviewer} reviews={reviews} />
        ))}
      </div>
    </section>
  );
}
