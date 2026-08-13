// components/title/editor-review-card.tsx
import { VerdictPill } from '@/components/ui/verdict-pill';
import type { EditorReview } from '@/lib/types';

interface EditorReviewCardProps {
  review: EditorReview;
}

export function EditorReviewCard({ review }: EditorReviewCardProps) {
  return (
    <div className="border-2 border-ink rounded-xl px-5 py-4 mb-6 bg-surface">
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        <div
          className="w-8 h-8 rounded-full bg-red flex items-center justify-center text-white text-[13px] font-bold"
          aria-hidden
        >
          C
        </div>
        <span className="text-[13px] font-semibold">Ciaran</span>
        <span className="px-1.5 py-px bg-ink text-white text-[10px] font-semibold rounded">
          EDITOR
        </span>
        <VerdictPill recommend={review.recommend} size="sm" />
        <span className="text-xs text-subtle ml-auto">📌 Pinned · {review.date}</span>
      </div>
      <h3 className="font-display text-[22px] font-bold leading-snug tracking-display-sm mb-3">
        {review.headline}
      </h3>
      <p className="text-sm text-body leading-relaxed m-0">{review.body}</p>
    </div>
  );
}
