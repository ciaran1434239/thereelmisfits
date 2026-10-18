import { getLeadStory } from '@/lib/data/lead-story';
import type { VerdictItem } from '@/lib/data/verdicts-feed';
import { fetchPoster } from '@/lib/data/tmdb-poster';
import { StoryCard } from '@/components/home/story-card';
import { VerdictCard, quoteOf } from '@/components/home/verdicts-wall';

const TMDB_KEY = process.env.TMDB_API_KEY;

async function fetchTmdbDetails(movieId: number) {
  if (!TMDB_KEY) return null;
  return fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 3600 } },
  ).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

const KICKER: Record<string, string> = {
  pinned:    "Editor's pick",
  fight:     'Critics divided',
  consensus: 'Everyone is talking about',
};

export async function LeadStoryBlock({ justIn }: { justIn: VerdictItem[] }) {
  const story = await getLeadStory();
  const [first, ...rest] = justIn;
  const posters = new Map(
    await Promise.all(justIn.map(async v => [v.movieId, await fetchPoster(v.movieId)] as const)),
  );

  const tmdb = story ? await fetchTmdbDetails(story.movieId) : null;
  const image = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
    : tmdb?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdb.poster_path}` : null;
  const pro = story?.proReviews.find(r => r.snippet);

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-12">
        {story && (
          <StoryCard
            size="lg"
            href={`/movie/${story.movieId}`}
            image={image}
            title={story.headline ?? story.movieTitle}
            quote={pro?.snippet ?? null}
            label={KICKER[story.mode] ?? ''}
            labelColor="#C8201F"
            meta={`${story.pctPositive}% of ${story.reviewCount} critics recommend`}
          />
        )}
        {first && <VerdictCard item={first} poster={posters.get(first.movieId) ?? null} size="lg" />}
      </div>

      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-12 mt-12">
          {rest.slice(0, 3).map(v => <VerdictCard key={v.reviewId} item={v} poster={posters.get(v.movieId) ?? null} />)}
        </div>
      )}
    </section>
  );
}
