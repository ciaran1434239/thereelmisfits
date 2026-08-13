import { cache } from 'react';
import { supabase } from '@/lib/supabase';

export interface CriticMatchupResult {
  movieId: number;
  side: 'pro' | 'con';
  won: boolean;
  myVotes: number;
  totalVotes: number;
  date: string;
}

export interface CriticStanding {
  creatorId: string;
  creator: {
    id: string;
    name: string;
    handle: string | null;
    avatar_url: string | null;
  };
  wins: number;
  losses: number;
  winPct: number;       // 0–100
  totalVotes: number;   // votes cast for this critic across all matchups
  form: ('W' | 'L')[];  // last ≤5 results, oldest first
  matchups: CriticMatchupResult[];
}

/** Minimum votes a matchup must have before it counts in standings. */
const MIN_VOTES = 1;

/**
 * Compute critic standings from verdict_matchups + verdict_votes.
 * Results are ordered by winPct desc, then wins desc.
 * Cached per request via React cache().
 */
export const getCriticStandings = cache(async (): Promise<CriticStanding[]> => {
  const [
    { data: matchups, error: matchupErr },
    { data: votes },
    { data: creators },
  ] = await Promise.all([
    supabase
      .from('verdict_matchups')
      .select('id, movie_id, pro_creator_id, con_creator_id, first_seen')
      .order('first_seen', { ascending: true }),
    supabase.from('verdict_votes').select('movie_id, side'),
    supabase.from('creators').select('id, name, handle, avatar_url'),
  ]);

  // verdict_matchups may not exist yet (migration not run)
  if (matchupErr || !matchups?.length) return [];

  // ── Vote counts per movie ────────────────────────────────────────
  const votesByMovie = new Map<number, { pro: number; con: number }>();
  for (const v of votes ?? []) {
    const cur = votesByMovie.get(v.movie_id) ?? { pro: 0, con: 0 };
    if (v.side === 'pro') cur.pro++; else cur.con++;
    votesByMovie.set(v.movie_id, cur);
  }

  // ── Accumulate per-creator stats ─────────────────────────────────
  type Acc = {
    wins: number;
    losses: number;
    totalVotes: number;
    form: ('W' | 'L')[];
    matchups: CriticMatchupResult[];
  };
  const statsMap = new Map<string, Acc>();

  const bump = (
    creatorId: string,
    won: boolean,
    myVotes: number,
    totalVotes: number,
    side: 'pro' | 'con',
    movieId: number,
    date: string,
  ) => {
    const e: Acc = statsMap.get(creatorId) ?? {
      wins: 0, losses: 0, totalVotes: 0, form: [], matchups: [],
    };
    won ? e.wins++ : e.losses++;
    e.totalVotes += myVotes;
    e.form.push(won ? 'W' : 'L');
    e.matchups.push({ movieId, side, won, myVotes, totalVotes, date });
    statsMap.set(creatorId, e);
  };

  for (const m of matchups) {
    const mc = votesByMovie.get(m.movie_id) ?? { pro: 0, con: 0 };
    const total = mc.pro + mc.con;
    if (total < MIN_VOTES) continue;

    // Tie goes to pro (arbitrary; unlikely in practice)
    const proWon = mc.pro >= mc.con;

    bump(m.pro_creator_id, proWon,  mc.pro, total, 'pro', m.movie_id, m.first_seen);
    bump(m.con_creator_id, !proWon, mc.con, total, 'con', m.movie_id, m.first_seen);
  }

  // ── Join with creator metadata ───────────────────────────────────
  const creatorMap = new Map((creators ?? []).map(c => [c.id, c]));

  return Array.from(statsMap.entries())
    .flatMap(([creatorId, s]) => {
      const creator = creatorMap.get(creatorId);
      if (!creator) return [];
      const played = s.wins + s.losses;
      return [{
        creatorId,
        creator,
        wins:       s.wins,
        losses:     s.losses,
        winPct:     played > 0 ? Math.round((s.wins / played) * 100) : 0,
        totalVotes: s.totalVotes,
        form:       s.form.slice(-5),
        matchups:   s.matchups,
      }];
    })
    .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);
});
