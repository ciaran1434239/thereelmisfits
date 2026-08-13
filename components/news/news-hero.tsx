// components/news/news-hero.tsx
//
// Top-of-page news feature. Two-column on desktop (artwork + copy),
// stacked on mobile. Same article-not-link rationale as NewsCard.

import { Pill } from '@/components/ui/pill';
import { posterGradient } from '@/lib/utils/format';
import type { NewsItem } from '@/lib/types';

export function NewsHero({ item }: { item: NewsItem }) {
  return (
    <article className="group block rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        <div
          className="aspect-[16/9] rounded-xl relative overflow-hidden"
          style={{ background: posterGradient(item.poster) }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="absolute top-3 left-3">
            <Pill tone="dark">{item.section}</Pill>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-red mb-2">
            Top story
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-display-md leading-tight mb-3">
            {item.title}
          </h2>
          {item.excerpt && (
            <p className="text-sm text-body leading-relaxed mb-4 line-clamp-3">
              {item.excerpt}
            </p>
          )}
          <div className="text-xs text-subtle">
            {item.author} · {item.timeAgo}
          </div>
        </div>
      </div>
    </article>
  );
}
