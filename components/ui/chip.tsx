// components/ui/chip.tsx
//
// Pill-shaped filter/toggle. Two modes:
//
//   - Button: pass `onClick` (and optionally `active`). Used when the chip
//     drives client-side state — e.g. the home-page topic strip.
//   - Link:   pass `href`. Used when the chip drives URL state — e.g. the
//     browse filter bar, where filters are encoded in `?type=movie&...`.
//     URL-driven chips are SSR-friendly and survive refresh.
//
// Pass exactly one of `onClick` or `href`. If both are passed, `href` wins.

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

type ChipBaseProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
};

type ChipButtonProps = ChipBaseProps & {
  onClick: () => void;
  href?: never;
};

type ChipLinkProps = ChipBaseProps & {
  href: string;
  onClick?: never;
};

type ChipProps = ChipButtonProps | ChipLinkProps;

const baseClass =
  'inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20';

const stateClass = (active: boolean) =>
  active
    ? 'bg-ink text-white'
    : 'bg-surface-alt text-ink hover:bg-surface-hover';

export function Chip(props: ChipProps) {
  const { active = false, children, className } = props;
  const cls = cn(baseClass, stateClass(active), className);

  if ('href' in props && props.href !== undefined) {
    return (
      <Link href={props.href} aria-pressed={active} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={active}
      className={cls}
    >
      {children}
    </button>
  );
}
