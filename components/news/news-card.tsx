// components/news/news-card.tsx
//
// News item card. Renders as an <article>, not a <Link> — there's no news
// detail route in v0.2 (news copy lives in the excerpt). When a /news/[id]
// route lands, swap the wrapper for next/link.

import { Pill } from '@/components/ui/pill';
import { posterGradient } from '@/lib/utils/format';
import type { NewsItem } from '@/lib/types';

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group block">
      <div
        className="aspect-video rounded-xl relative overflow-hidden mb-3"
        style={{ background: posterGradient(item.poster) }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute top-2 left-2">
          <Pill tone="dark">{item.section}</Pill>
        </div>
      </div>
      <h3 className="font-semibold text-base text-ink leading-tight mb-1.5 line-clamp-2">
        {item.title}
      </h3>
      {item.excerpt && (
        <p className="text-sm text-subtle leading-snug line-clamp-2 mb-2">
          {item.excerpt}
        </p>
      )}
      <div className="text-xs text-faint">
        {item.author} · {item.timeAgo}
      </div>
    </article>
  );
}
