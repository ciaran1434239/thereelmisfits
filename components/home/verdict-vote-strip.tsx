'use client';

import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, active: boolean): number {
  const [val, setVal] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 2); // ease-out quad
      setVal(Math.round(eased * target));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, active]);

  return val;
}

// ── Floating thumb animation state ────────────────────────────────────────────

interface FloatItem {
  id: number;
  x: number;
  y: number;
  side: 'pro' | 'con';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VerdictVoteStrip({ movieId }: { movieId: number }) {
  const [voted, setVoted] = useState<'pro' | 'con' | null>(null);
  const [counts, setCounts] = useState<{ pro: number; con: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `verdict-vote-${movieId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'pro' || stored === 'con') setVoted(stored);
    fetch(`/api/verdict-votes?movieId=${movieId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCounts(data); })
      .catch(() => null);
  }, [movieId, storageKey]);

  function spawnFloat(e: React.MouseEvent, side: 'pro' | 'con') {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const id = Date.now() + Math.random();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    setFloats(prev => [...prev, { id, x, y, side }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 700);
  }

  async function handleVote(e: React.MouseEvent<HTMLButtonElement>, side: 'pro' | 'con') {
    if (voted !== null || submitting) return;
    spawnFloat(e, side);
    setSubmitting(true);
    setVoted(side);
    localStorage.setItem(storageKey, side);
    try {
      const res = await fetch('/api/verdict-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, side }),
      });
      const data = res.ok ? await res.json() : null;
      if (data) setCounts(data);
    } catch {
      // keep optimistic state
    } finally {
      setSubmitting(false);
    }
  }

  const total = (counts?.pro ?? 0) + (counts?.con ?? 0);
  const proPct = total > 0 ? Math.round(((counts?.pro ?? 0) / total) * 100) : 50;
  const conPct = 100 - proPct;
  const hasVoted = voted !== null;
  const showCounts = hasVoted && counts !== null;

  // Animated count-up percentages (kick off when server counts arrive)
  const animProPct = useCountUp(proPct, 400, showCounts);
  const animConPct = useCountUp(conPct, 400, showCounts);

  // Centre label
  const centreText  = hasVoted ? 'You backed this' : 'Pick a side';
  const centreColor = hasVoted ? (voted === 'pro' ? '#22c55e' : '#ef4444') : '#ffffff';

  return (
    <div ref={containerRef} className="relative flex h-[64px] overflow-hidden" style={{ background: '#0f0f0f' }}>

      {/* ── Floating thumbs ─────────────────────────────────────── */}
      {floats.map(f => (
        <div
          key={f.id}
          className="absolute z-30 animate-float-up"
          style={{ left: f.x, top: f.y }}
        >
          {f.side === 'pro'
            ? <ThumbsUp  size={28} strokeWidth={2.5} className="text-[#22c55e]" />
            : <ThumbsDown size={28} strokeWidth={2.5} className="text-[#ef4444]" />
          }
        </div>
      ))}

      {/* ── LEFT — pro ──────────────────────────────────────────── */}
      <button
        onClick={e => handleVote(e, 'pro')}
        aria-label="Back the recommending critic"
        aria-disabled={hasVoted || submitting}
        className={[
          'flex-1 flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300',
          !hasVoted
            ? 'cursor-pointer hover:brightness-125'
            : voted === 'pro'
            ? 'cursor-default'
            : 'cursor-default',
        ].join(' ')}
        style={{
          background: voted === 'pro' ? 'rgba(34,197,94,0.6)' : 'rgba(34,197,94,0.3)',
          borderColor: '#22c55e',
          opacity: hasVoted && voted !== 'pro' ? 0.2 : 1,
          boxShadow: voted === 'pro' ? '0 0 24px rgba(34,197,94,0.35)' : 'none',
          pointerEvents: hasVoted ? 'none' : 'auto',
        }}
      >
        <ThumbsUp
          size={showCounts ? 15 : 32}
          strokeWidth={2}
          className={`transition-all duration-200 ${voted === 'pro' ? 'text-white' : 'text-[#22c55e]'}`}
        />
        {showCounts && (
          <span className={`text-[14px] font-black tabular-nums leading-none ${voted === 'pro' ? 'text-white' : 'text-[#22c55e]'}`}>
            {animProPct}%
          </span>
        )}
      </button>

      {/* ── CENTRE divider + label ───────────────────────────────── */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center z-10 pointer-events-none">
        <div className="absolute inset-y-0 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <span
          className="relative px-3 py-1 whitespace-nowrap select-none"
          style={{
            background: '#0f0f0f',
            fontSize:      '11px',
            fontWeight:    800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:         centreColor,
            transition:    'color 0.3s ease',
          }}
        >
          {centreText}
        </span>
      </div>

      {/* ── RIGHT — con ─────────────────────────────────────────── */}
      <button
        onClick={e => handleVote(e, 'con')}
        aria-label="Back the skipping critic"
        aria-disabled={hasVoted || submitting}
        className={[
          'flex-1 flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300',
          !hasVoted
            ? 'cursor-pointer hover:brightness-125'
            : voted === 'con'
            ? 'cursor-default'
            : 'cursor-default',
        ].join(' ')}
        style={{
          background: voted === 'con' ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.3)',
          borderColor: '#ef4444',
          opacity: hasVoted && voted !== 'con' ? 0.2 : 1,
          boxShadow: voted === 'con' ? '0 0 24px rgba(239,68,68,0.35)' : 'none',
          pointerEvents: hasVoted ? 'none' : 'auto',
        }}
      >
        <ThumbsDown
          size={showCounts ? 15 : 32}
          strokeWidth={2}
          className={`transition-all duration-200 ${voted === 'con' ? 'text-white' : 'text-[#ef4444]'}`}
        />
        {showCounts && (
          <span className={`text-[14px] font-black tabular-nums leading-none ${voted === 'con' ? 'text-white' : 'text-[#ef4444]'}`}>
            {animConPct}%
          </span>
        )}
      </button>

    </div>
  );
}
