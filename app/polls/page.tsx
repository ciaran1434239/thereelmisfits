export const dynamic = 'force-dynamic';

import { BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PollCard } from '@/components/polls/poll-card';

async function getPolls() {
  const { data } = await supabase
    .from('polls')
    .select(`
      id, question, is_active, closes_at, created_at,
      poll_options (id, label, position),
      poll_votes (option_id)
    `)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function PollsPage() {
  const polls = await getPolls();
  const active = polls.filter((p: any) => p.is_active);
  const closed = polls.filter((p: any) => !p.is_active);

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="max-w-[860px] w-full mx-auto px-4 sm:px-6 pt-12">

        <header className="mb-12 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="text-[#E21D1D]" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Community Polls</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-[950] uppercase tracking-tighter text-gray-900 leading-none">
            HAVE YOUR <span className="text-[#E21D1D]">SAY</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4">
            Vote on the films and debates that matter
          </p>
        </header>

        {polls.length === 0 ? (
          <div className="py-24 border-2 border-dashed border-gray-200 rounded-3xl text-center">
            <BarChart3 className="mx-auto text-gray-300 mb-4" size={32} />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">No polls yet</p>
            <p className="text-xs text-gray-400">Add polls via Supabase — insert into the <code className="text-[#E21D1D]">polls</code> table</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {active.length > 0 && (
              <>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Open Now</h2>
                {active.map((poll: any) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </>
            )}
            {closed.length > 0 && (
              <>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mt-8">Closed</h2>
                {closed.map((poll: any) => (
                  <PollCard key={poll.id} poll={poll} closed />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
