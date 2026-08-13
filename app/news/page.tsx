// app/news/page.tsx
//
// News — industry headlines aggregated from sources TheySaid tracks.
// First item is rendered as a full-width hero, the rest as a card grid.

import type { Metadata } from 'next';
import { listNews } from '@/lib/api';
import { NewsHero } from '@/components/news/news-hero';
import { NewsCard } from '@/components/news/news-card';

export const metadata: Metadata = {
  title: 'News · The Reel Misfits',
  description:
    'Film and television industry news — releases, festival reports, casting, deals — curated daily by TheySaid editors.',
};

export default async function NewsPage() {
  const items = await listNews();

  if (items.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-5 max-w-[1280px] mx-auto">
        <h1 className="font-display text-3xl font-bold tracking-display-md mb-2">
          News
        </h1>
        <p className="text-sm text-subtle py-12">No news items yet.</p>
      </div>
    );
  }

  const [hero, ...rest] = items;

  return (
    <div className="px-4 sm:px-6 py-5">
      <header className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-display-md">
          News
        </h1>
      </header>

      {hero && <NewsHero item={hero} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 mt-10">
        {rest.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
