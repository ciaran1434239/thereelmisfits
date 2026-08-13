// components/admin/score-queue.tsx
//
// Editor-facing queue for assigning scores and verdicts to channel reviews.
//
// State strategy: each row owns its own draft (score, recommend, savedAt) so
// editing one row doesn't trigger re-renders of every other row in the list.
// The list itself is uncontrolled — we don't lift state to the parent because
// there's no cross-row interaction.
//
// Save flow: the row dispatches the server action `saveReviewScore`. In v0.2
// that action is a no-op stub (see `app/score/actions.ts`); when the backend
// lands it becomes a real Supabase upsert. The UI doesn't need to change.

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { VerdictPill } from '@/components/ui/verdict-pill';
import { cn } from '@/lib/utils/cn';
import { saveReviewScore } from '@/app/score/actions';
import type { ScoreQueueItem } from '@/app/score/page';

interface ScoreQueueProps {
  items: ScoreQueueItem[];
}

export function ScoreQueue({ items }: ScoreQueueProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-subtle py-12 text-center">
        Queue is empty. New reviews appear here as they're ingested.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <ScoreRow key={item.review.id} item={item} />
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */

interface RowState {
  score: number;
  recommend: boolean;
  /** ISO timestamp of last successful save, or null if never saved this session. */
  savedAt: string | null;
  error: string | null;
}

function ScoreRow({ item }: { item: ScoreQueueItem }) {
  const { review, title, reviewer } = item;

  const [state, setState] = useState<RowState>({
    score: review.score,
    recommend: review.recommend,
    savedAt: null,
    error: null,
  });
  const [isPending, startTransition] = useTransition();

  const dirty =
    state.score !== review.score || state.recommend !== review.recommend;

  const handleSave = () => {
    setState((s) => ({ ...s, error: null }));
    startTransition(async () => {
      try {
        await saveReviewScore({
          reviewId: review.id,
          score: state.score,
          recommend: state.recommend,
        });
        setState((s) => ({ ...s, savedAt: new Date().toISOString() }));
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : 'Save failed',
        }));
      }
    });
  };

  return (
    <li className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Identity ----------------------------------------------------- */}
        <div className="flex items-center gap-3 lg:w-[280px] shrink-0">
          <Avatar reviewer={reviewer} size="md" />
          <div className="min-w-0">
            <Link
              href={`/channel/${reviewer.handle}`}
              className="text-sm font-semibold text-ink hover:text-red truncate block"
            >
              {reviewer.name}
            </Link>
            <Link
              href={`/movie/${title.id}`}
              className="text-xs text-subtle hover:text-body truncate block"
            >
              {title.title} ({title.year})
            </Link>
          </div>
        </div>

        {/* Headline + meta --------------------------------------------- */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-body leading-snug line-clamp-2 mb-1">
            {review.headline}
          </p>
          <div className="text-xs text-faint">
            {review.runtime} · {review.views} views · {review.date}
          </div>
        </div>

        {/* Editor controls --------------------------------------------- */}
        <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
          <ScoreInput
            value={state.score}
            onChange={(score) => setState((s) => ({ ...s, score }))}
            disabled={isPending}
          />
          <VerdictToggle
            recommend={state.recommend}
            onChange={(recommend) =>
              setState((s) => ({ ...s, recommend }))
            }
            disabled={isPending}
          />
          <SaveButton
            dirty={dirty}
            isPending={isPending}
            savedAt={state.savedAt}
            onClick={handleSave}
          />
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-red-deep mt-3" role="alert">
          {state.error}
        </p>
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                  */
/* -------------------------------------------------------------------------- */

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-subtle">
        Score
      </span>
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(0, Math.min(10, n)));
        }}
        disabled={disabled}
        className={cn(
          'w-16 px-2 py-1.5 rounded-lg border border-border bg-surface-alt',
          'text-sm font-semibold tabular-nums text-ink text-center',
          'focus:outline-none focus:border-ink focus:bg-surface',
          'disabled:opacity-50'
        )}
        aria-label="Score, 0 to 10"
      />
    </label>
  );
}

function VerdictToggle({
  recommend,
  onChange,
  disabled,
}: {
  recommend: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Verdict"
      className="inline-flex rounded-full border border-border bg-surface-alt p-0.5"
    >
      <VerdictOption
        active={recommend}
        onClick={() => onChange(true)}
        disabled={disabled}
      >
        <VerdictPill recommend={true} />
      </VerdictOption>
      <VerdictOption
        active={!recommend}
        onClick={() => onChange(false)}
        disabled={disabled}
      >
        <VerdictPill recommend={false} />
      </VerdictOption>
    </div>
  );
}

function VerdictOption({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-2 py-1 rounded-full transition-opacity',
        active ? 'opacity-100' : 'opacity-40 hover:opacity-70',
        disabled && 'cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function SaveButton({
  dirty,
  isPending,
  savedAt,
  onClick,
}: {
  dirty: boolean;
  isPending: boolean;
  savedAt: string | null;
  onClick: () => void;
}) {
  // After a successful save with no further edits, show a confirmation state.
  const justSaved = savedAt !== null && !dirty;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!dirty || isPending}
      className={cn(
        'inline-flex items-center justify-center gap-1.5',
        'h-8 min-w-[80px] px-3 rounded-full text-xs font-semibold',
        'transition-colors',
        dirty && !isPending && 'bg-ink text-white hover:bg-ink/90',
        !dirty &&
          !justSaved &&
          'bg-surface-alt text-faint cursor-not-allowed',
        justSaved && 'bg-green-soft text-green',
        isPending && 'bg-surface-alt text-subtle cursor-wait'
      )}
    >
      {isPending ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          Saving
        </>
      ) : justSaved ? (
        <>
          <Check size={12} />
          Saved
        </>
      ) : (
        'Save'
      )}
    </button>
  );
}
