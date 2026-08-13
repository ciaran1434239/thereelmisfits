import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export async function BoxOfficeMini({ dark = false }: { dark?: boolean }) {
  const { data: latestWeek } = await supabase
    .from('box_office')
    .select('week_of')
    .order('week_of', { ascending: false })
    .limit(1)
    .single();

  if (!latestWeek) return null;

  const { data: rows } = await supabase
    .from('box_office')
    .select('*')
    .eq('week_of', latestWeek.week_of)
    .eq('region', 'domestic')
    .order('rank', { ascending: true })
    .limit(5);

  const weekLabel = new Date(latestWeek.week_of).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const borderCls = dark ? 'border-white/10' : 'border-gray-100';
  const divideCls = dark ? 'divide-white/5' : 'divide-gray-50';
  const titleCls = dark ? 'text-white/60' : 'text-gray-400';
  const subtitleCls = dark ? 'text-white/30' : 'text-gray-300';
  const textCls = dark ? 'text-white' : 'text-gray-900';
  const mutedCls = dark ? 'text-white/40' : 'text-gray-400';
  const rankAltCls = dark ? 'text-white/20' : 'text-gray-200';

  return (
    <section>
      <div className={`flex items-center justify-between mb-4 border-b ${borderCls} pb-3`}>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
          <div>
            <h2 className={`text-[11px] font-black uppercase tracking-[0.2em] ${titleCls}`}>Box Office</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${subtitleCls}`}>Weekend of {weekLabel}</p>
          </div>
        </div>
        <Link href="/box-office" className={`text-[10px] font-black uppercase tracking-widest ${titleCls} hover:text-white transition-colors flex items-center gap-1`}>
          Full chart <ArrowRight size={11} />
        </Link>
      </div>

      <div className={`flex flex-col divide-y ${divideCls}`}>
        {(rows || []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-2.5">
            <span className={`text-lg font-black w-5 shrink-0 ${r.rank === 1 ? 'text-[#E21D1D]' : rankAltCls}`}>
              {r.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-bold truncate ${textCls}`}>{r.title}</p>
              {r.weeks_in_release && (
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${mutedCls}`}>
                  Wk {r.weeks_in_release}
                </p>
              )}
            </div>
            {r.weekend_gross && (
              <span className={`text-[13px] font-bold shrink-0 ${textCls}`}>{fmtMoney(r.weekend_gross)}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
