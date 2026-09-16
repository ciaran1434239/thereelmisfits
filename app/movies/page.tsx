export const dynamic = 'force-dynamic';

import { HomeHero }          from '@/components/home/home-hero';
import { StatsStrip }         from '@/components/home/stats-strip';
import { RecentReviewsRow }   from '@/components/home/recent-reviews-row';
import { FeaturedReviewCard } from '@/components/home/featured-review-card';
import { NowPlayingRow }      from '@/components/home/now-playing-row';
import { TheSplit }           from '@/components/home/the-split';
import { TopOfChartRow }      from '@/components/home/top-of-chart-row';
import { TmdbRow }            from '@/components/home/tmdb-row';
import { ByTheNumbers }       from '@/components/home/by-the-numbers';
import { CriticsSpotlight }   from '@/components/home/critics-spotlight';
import { ComingSoonRow }      from '@/components/home/coming-soon-row';
import { supabase }           from '@/lib/supabase';
import { getFeaturedMovieId } from '@/lib/data/featured-movie';

export default async function MoviesPage() {
  const [{ data: allReviews }, heroMovieId] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, movies(*), shows(*), creators(*)')
      .order('posted_at', { ascending: false }),
    getFeaturedMovieId(),
  ]);

  return (
    <div className="w-full overflow-x-hidden">

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        <HomeHero />
      </div>

      <StatsStrip />
      <CriticsSpotlight />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto w-full flex flex-col gap-[80px] pt-[80px]">

          <RecentReviewsRow
            reviews={(allReviews || []).filter((r: any) => r.movie_id && r.movie_id !== heroMovieId)}
            type="movies"
            title="Latest Reviews"
            subtitle="New films from YouTube critics"
          />

          <div className="-mx-4 sm:-mx-6">
            <FeaturedReviewCard excludeMovieId={heroMovieId ?? undefined} />
          </div>

        </div>
      </div>

      <div className="mt-[80px]">
        <ByTheNumbers />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto w-full flex flex-col gap-[80px] pt-[80px] pb-[80px]">

          <NowPlayingRow excludeMovieId={heroMovieId} />
          <TheSplit />

          <TmdbRow
            title="Best of 2026"
            subtitle="The finest films of the year so far"
            endpoint="discover/movie?primary_release_year=2026&sort_by=popularity.desc&with_original_language=en&vote_count.gte=20&language=en-US"
            minReviews={4}
          />

        </div>
      </div>

      <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--bg-panel-edge)', borderBottom: '1px solid var(--bg-panel-edge)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[1060px] mx-auto py-[60px]">
            <TmdbRow
              title="Horror"
              subtitle="The scariest films on the circuit"
              endpoint="discover/movie?with_genres=27&sort_by=popularity.desc&vote_count.gte=100&language=en-US"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto w-full flex flex-col gap-[80px] pt-[80px]">
          <TmdbRow
            title="The Blockbusters"
            subtitle="The biggest films at the box office"
            endpoint="discover/movie?sort_by=revenue.desc&vote_count.gte=1000&primary_release_date.gte=2022-01-01&with_original_language=en&language=en-US"
          />
        </div>
      </div>

      <div className="mt-[80px]" style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--bg-panel-edge)', borderBottom: '1px solid var(--bg-panel-edge)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[1060px] mx-auto py-[60px]">
            <TopOfChartRow
              title="Most Reviewed"
              subtitle="Titles getting the most YouTube coverage"
              sortBy="count"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto py-[80px]">
          <ComingSoonRow />
        </div>
      </div>

    </div>
  );
}
