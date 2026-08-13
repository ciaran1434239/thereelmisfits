'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { tileBg } from '@/lib/utils/score-tier';

interface Props {
  movieId: number;
  initialVotes: { recommend: boolean }[];
  compact?: boolean;
}

export function CommunityVote({ movieId, initialVotes, compact = false }: Props) {
  const { user, signInWithGoogle } = useAuth();
  const supabase = createSupabaseBrowser();

  const [votes, setVotes] = useState(initialVotes);
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScorePicker, setShowScorePicker] = useState(false);

  const total = votes.length;
  const recs = votes.filter(v => v.recommend).length;
  const pct = total === 0 ? null : Math.round((recs / total) * 100);

  // Load the user's existing vote
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_votes')
      .select('recommend, score')
      .eq('movie_id', movieId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMyVote(data.recommend);
          setMyScore(data.score);
        }
      });
  }, [user, movieId]);

  const vote = async (recommend: boolean) => {
    if (!user || loading) return;
    setLoading(true);

    const isChanging = myVote !== null && myVote !== recommend;
    const isRemoving = myVote === recommend;

    if (isRemoving) {
      // Toggle off — remove vote
      await supabase.from('user_votes').delete().eq('movie_id', movieId).eq('user_id', user.id);
      setVotes(prev => prev.filter((_, i) => i !== 0)); // rough optimistic
      setMyVote(null);
      setMyScore(null);
    } else {
      await supabase.from('user_votes').upsert({
        user_id: user.id,
        movie_id: movieId,
        recommend,
        score: myScore,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,movie_id' });

      if (myVote === null) {
        setVotes(prev => [...prev, { recommend }]);
      } else if (isChanging) {
        setVotes(prev => prev.map((v, i) => i === prev.length - 1 ? { recommend } : v));
      }
      setMyVote(recommend);
      setShowScorePicker(true);
    }
    setLoading(false);
  };

  const submitScore = async (score: number) => {
    if (!user) return;
    setMyScore(score);
    setShowScorePicker(false);
    await supabase.from('user_votes').upsert({
      user_id: user.id,
      movie_id: movieId,
      recommend: myVote!,
      score,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,movie_id' });
  };

  const barColor = pct === null ? 'bg-[#333333]' : tileBg(pct);

  if (compact) {
    return (
      <div className="rounded-xl p-4 text-center bg-[#181818] border border-[#2A2A2A] flex flex-col items-center justify-center gap-1">
        <div className="text-3xl font-black leading-none text-white">
          {pct === null ? '—' : `${pct}%`}
        </div>
        <div className="text-[8px] font-black uppercase tracking-widest text-[#777777]">Community</div>
        <div className="text-[8px] font-bold text-[#777777]">{total} {total === 1 ? 'vote' : 'votes'}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#181818] border border-[#2A2A2A] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#777777]">Community Score</h3>
      </div>

      {/* Score display */}
      <div className="flex items-end gap-3 mb-4">
        <span className="text-5xl font-black tracking-tighter text-white">
          {pct === null ? '—' : `${pct}%`}
        </span>
        <span className="text-sm text-[#777777] font-bold mb-2">{total} {total === 1 ? 'vote' : 'votes'}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#2A2A2A] rounded-full mb-6 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct ?? 0}%` }} />
      </div>

      {/* Vote buttons or login prompt */}
      {!user ? (
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#333333] rounded-xl text-[11px] font-black uppercase tracking-widest text-[#777777] hover:border-white/30 hover:text-white transition-colors"
        >
          <LogIn size={14} /> Sign in to vote
        </button>
      ) : showScorePicker ? (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#777777] mb-3">Rate it 1–10</p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => submitScore(n)}
                className={`py-2 rounded-lg text-sm font-black transition-colors ${
                  myScore === n
                    ? 'bg-[#E21D1D] text-white'
                    : 'bg-[#222222] text-[#D4D4D4] hover:bg-[#2A2A2A]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button onClick={() => setShowScorePicker(false)} className="text-[10px] text-[#777777] hover:text-[#999999] font-bold uppercase tracking-widest">
            Skip
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => vote(true)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                myVote === true
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-[#222222] text-[#D4D4D4] hover:bg-emerald-900/40 hover:text-emerald-400'
              }`}
            >
              <ThumbsUp size={15} /> Worth it
            </button>
            <button
              onClick={() => vote(false)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                myVote === false
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-[#222222] text-[#D4D4D4] hover:bg-rose-900/40 hover:text-rose-400'
              }`}
            >
              <ThumbsDown size={15} /> Skip it
            </button>
          </div>
          {myVote !== null && myScore && (
            <p className="text-center text-[10px] text-[#777777] font-bold uppercase tracking-widest">
              Your score: <span className="text-[#D4D4D4]">{myScore}/10</span>
              <button onClick={() => setShowScorePicker(true)} className="ml-2 text-[#E21D1D] hover:underline">change</button>
            </p>
          )}
          {myVote !== null && !myScore && (
            <button onClick={() => setShowScorePicker(true)} className="text-center text-[10px] text-[#E21D1D] font-bold uppercase tracking-widest hover:underline">
              + Add a score
            </button>
          )}
        </div>
      )}
    </div>
  );
}
