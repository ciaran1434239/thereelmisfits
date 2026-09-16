import Link from 'next/link';

/**
 * SectionHeading — THE single section header component for the entire site.
 *
 * Design decision (locked):
 *   - label: tiny red ALL-CAPS descriptor above the heading (e.g. "New films from critics")
 *   - title: large white bold heading (e.g. "Latest Reviews")
 *   - No decorative bars, no underlines, no borders beside the text.
 *   - Red lives in the label — doing typographic work, not decoration.
 */
export function SectionHeading({
  label,
  title,
  viewAllHref,
  viewAllLabel = 'See all',
  dark = false,
}: {
  label?: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {label && (
          <p className="text-[12px] font-[700] uppercase tracking-[0.12em] mb-1.5" style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-editorial, serif)' }}>
            {label}
          </p>
        )}
        <h2 className="font-black uppercase leading-[0.95] text-white" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', letterSpacing: '-0.025em' }}>
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref as any}
          className="btn-secondary shrink-0 ml-4"
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  );
}
