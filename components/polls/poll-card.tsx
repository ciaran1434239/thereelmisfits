'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { LogIn, Lock } from 'lucide-react';

interface PollOption {
  id: number;
  label: string;
  position: number;
}

interface Poll {
  id: number;
  question: string;
  is_active: boolean;
  closes_at: string | null;
  poll_options: PollOption[];
  poll_votes: { option_id: number }[];
}

interface Props {
  poll: Poll;
  closed?: boolean;
}

export function PollCard({ poll, closed = false }: Props) {
  const { user, signInWithGoogle } = useAuth();
  const supabase = createSupabaseBrowser();

  const [myVote, setMyVote] = useState<number | null>(null);
  const [votes, setVotes] = useState<{ option_id: number }[]>(poll.poll_votes);
  const [loading, setLoading] = useState(false);

  const hasVoted = myVote !== null;
  const showResults = hasVoted || closed;
  const totalVotes = votes.length;

  const options = [...poll.poll_options].sort((a, b) => a.position - b.position);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyVote(data.option_id); });
  }, [user, poll.id]);

  const castVote = async (optionId: number) => {
    if (!user || loading || closed) return;
    setLoading(true);

    if (myVote === optionId) {
      // Remove vote
      await supabase.from('poll_votes').delete().eq('poll_id', poll.id).eq('user_id', user.id);
      setVotes(prev => prev.filter(v => v.option_id !== optionId));
      setMyVote(null);
    } else {
      if (myVote !== null) {
        // Change vote
        await supabase.from('poll_votes').delete().eq('poll_id', poll.id).eq('user_id', user.id);
        setVotes(prev => prev.filter(v => v.option_id !== myVote));
      }
      await supabase.from('poll_votes').insert({ poll_id: poll.id, option_id: optionId, user_id: user.id });
      setVotes(prev => [...prev, { option_id: optionId }]);
      setMyVote(optionId);
    }
    setLoading(false);
  };

  const getPct = (optionId: number) => {
    if (totalVotes === 0) return 0;
    const count = votes.filter(v => v.option_id === optionId).length;
    return Math.round((count / totalVotes) * 100);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h3 className="text-xl font-black text-gray-900 leading-snug">{poll.question}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {closed && <Lock size={13} className="text-gray-300" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const pct = getPct(option.id);
          const isChosen = myVote === option.id;
          const isLeading = showResults && pct === Math.max(...options.map(o => getPct(o.id))) && totalVotes > 0;

          return (
            <button
              key={option.id}
              onClick={() => castVote(option.id)}
              disabled={!user || loading || closed}
              className={`relative w-full text-left rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                isChosen
                  ? 'border-[#E21D1D]'
                  : showResults
                  ? 'border-gray-100'
                  : 'border-gray-100 hover:border-gray-300'
              } ${(!user || closed) ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Result bar */}
              {showResults && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ${
                    isChosen ? 'bg-[#E21D1D]/10' : isLeading ? 'bg-gray-100' : 'bg-gray-50'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="relative flex items-center justify-between px-4 py-3.5">
                <span className={`text-sm font-black ${isChosen ? 'text-[#E21D1D]' : 'text-gray-800'}`}>
                  {option.label}
                </span>
                {showResults && (
                  <span className={`text-sm font-black ${isChosen ? 'text-[#E21D1D]' : 'text-gray-400'}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!user && !closed && (
        <button
          onClick={signInWithGoogle}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:border-white/30 hover:text-white transition-colors"
        >
          <LogIn size={13} /> Sign in to vote
        </button>
      )}

      {poll.closes_at && !closed && (
        <p className="mt-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">
          Closes {new Date(poll.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
}
