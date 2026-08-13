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
          <p className="text-[0.65rem] font-[700] uppercase tracking-[0.12em] text-[#C8201F] mb-1.5">
            {label}
          </p>
        )}
        <h2 className="text-[1.6rem] sm:text-[2rem] font-black uppercase tracking-tight leading-none text-white">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref as any}
          className={`text-[11px] font-bold transition-colors shrink-0 ml-4 pb-0.5 ${dark ? 'text-white/40 hover:text-white' : 'text-[#C8201F] hover:opacity-70'}`}
        >
          {viewAllLabel} →
        </Link>
      )}
    </div>
  );
}
