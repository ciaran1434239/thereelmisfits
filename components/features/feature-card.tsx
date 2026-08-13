// components/features/feature-card.tsx
import Link from 'next/link';
import { Pill } from '@/components/ui/pill';
import { posterGradient } from '@/lib/utils/format';
import type { Post } from '@/lib/types';

export function FeatureCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/features/${post.id}`}
      className="group block focus:outline-none"
    >
      <div
        className="aspect-[3/2] rounded-xl relative overflow-hidden mb-3"
        style={{ background: posterGradient(post.poster) }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute top-2 left-2">
          <Pill tone="dark">{post.section}</Pill>
        </div>
      </div>
      <h3 className="font-display text-lg font-bold tracking-display-sm leading-tight text-ink mb-1.5 line-clamp-2 group-hover:text-red transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-subtle leading-snug line-clamp-2 mb-2">
        {post.excerpt}
      </p>
      <div className="text-xs text-faint">
        {post.author} · {post.timeAgo} · {post.readTime}
      </div>
    </Link>
  );
}
