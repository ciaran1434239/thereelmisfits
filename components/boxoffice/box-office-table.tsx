// components/boxoffice/box-office-table.tsx
//
// Box office grosses, presented as a wide table on desktop and as a
// scroll-x'd version on mobile (the alternative — collapsing to cards —
// loses the ability to scan rank-by-rank, which is the whole point).

import { fmtMoney } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { BoxOfficeRow } from '@/lib/types';

interface BoxOfficeTableProps {
  rows: BoxOfficeRow[];
}

export function BoxOfficeTable({ rows }: BoxOfficeTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
            <Th className="w-12 text-center">#</Th>
            <Th>Title</Th>
            <Th align="right">Weekend</Th>
            <Th align="right">Change</Th>
            <Th align="right">Total</Th>
            <Th align="right">Wk</Th>
            <Th align="right">Theaters</Th>
            <Th align="right">Per screen</Th>
            <Th align="right">Budget</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rank}
              className="border-b border-border/60 hover:bg-surface-alt/60 transition-colors"
            >
              <Td className="text-center font-display font-bold text-base text-ink">
                {row.rank}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{row.title}</span>
                  {row.isNew && (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-red text-white text-[10px] font-bold uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
              </Td>
              <Td align="right" className="font-semibold tabular-nums">
                {fmtMoney(row.weekend)}
              </Td>
              <Td align="right" className="tabular-nums">
                <ChangePill change={row.change} />
              </Td>
              <Td align="right" className="tabular-nums">
                {fmtMoney(row.total)}
              </Td>
              <Td align="right" className="tabular-nums text-subtle">
                {row.weeks}
              </Td>
              <Td align="right" className="tabular-nums text-subtle">
                {row.theaters.toLocaleString()}
              </Td>
              <Td align="right" className="tabular-nums text-subtle">
                {fmtMoney(row.perTheater)}
              </Td>
              <Td align="right" className="tabular-nums text-subtle">
                {fmtMoney(row.budget)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Th({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'py-2.5 px-3 font-semibold',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={cn(
        'py-3 px-3',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * Color-coded weekend change.
 * Important: the colour is paired with a `+` / `−` sign and the number, so
 * users with red/green colour blindness aren't reliant on hue alone (a11y).
 */
function ChangePill({ change }: { change: number | null }) {
  if (change === null) {
    return <span className="text-faint">—</span>;
  }
  const positive = change >= 0;
  return (
    <span
      className={cn(
        'font-semibold',
        positive ? 'text-green' : 'text-red-deep'
      )}
    >
      {positive ? '+' : '−'}
      {Math.abs(change)}%
    </span>
  );
}
