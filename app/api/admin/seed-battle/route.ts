import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computePairs } from '@/lib/data/battle-of-critics';

export const dynamic = 'force-dynamic';

// POST /api/admin/seed-battle
// 1. Runs computePairs() to generate/refresh verdict_matchups.
// 2. For matchups with fewer than MIN_SEED_VOTES total votes, inserts seed votes
//    so the leaderboard shows realistic W/L records from day one.
//
// Seed strategy (per matchup):
//   - Even index:  7 pro + 3 con  (pro critic wins)
//   - Odd  index:  3 pro + 7 con  (con critic wins)
// This gives each critic involved a mix of wins and losses.

const MIN_SEED_VOTES = 5;
const PRO_VOTES_WIN  = 7;
const CON_VOTES_WIN  = 3;

export async function POST() {
  // Step 1 — generate / refresh pairs (writes featured_at to verdict_matchups)
  let pairs: Awaited<ReturnType<typeof computePairs>>;
  try {
    pairs = await computePairs();
  } catch (err: any) {
    return NextResponse.json({ success: false, error: `computePairs failed: ${err.message}` }, { status: 500 });
  }

  if (!pairs.length) {
    return NextResponse.json({
      success: false,
      error: 'No valid battle pairs found. Reviews need: recommend set, snippet present, creator with avatar.',
    }, { status: 422 });
  }

  // Step 2 — read all matchups so we can check existing vote counts
  const { data: matchups } = await supabase
    .from('verdict_matchups')
    .select('id, movie_id, pro_creator_id, con_creator_id');

  const { data: existingVotes } = await supabase
    .from('verdict_votes')
    .select('movie_id, side');

  // Count existing votes per movie
  const voteCounts = new Map<number, { pro: number; con: number }>();
  for (const v of existingVotes ?? []) {
    const cur = voteCounts.get(v.movie_id) ?? { pro: 0, con: 0 };
    if (v.side === 'pro') cur.pro++; else cur.con++;
    voteCounts.set(v.movie_id, cur);
  }

  // Step 3 — insert seed votes for matchups below the threshold
  const seedRows: { movie_id: number; side: 'pro' | 'con' }[] = [];
  let seededMatchups = 0;

  for (let i = 0; i < (matchups ?? []).length; i++) {
    const m = matchups![i]!;
    const cur = voteCounts.get(m.movie_id) ?? { pro: 0, con: 0 };
    const total = cur.pro + cur.con;
    if (total >= MIN_SEED_VOTES) continue; // already has enough real votes

    // Even index → pro wins; odd index → con wins
    const proTarget = i % 2 === 0 ? PRO_VOTES_WIN : CON_VOTES_WIN;
    const conTarget = i % 2 === 0 ? CON_VOTES_WIN : PRO_VOTES_WIN;

    const proNeeded = Math.max(0, proTarget - cur.pro);
    const conNeeded = Math.max(0, conTarget - cur.con);

    for (let j = 0; j < proNeeded; j++) seedRows.push({ movie_id: m.movie_id, side: 'pro' });
    for (let j = 0; j < conNeeded; j++) seedRows.push({ movie_id: m.movie_id, side: 'con' });

    if (proNeeded + conNeeded > 0) seededMatchups++;
  }

  if (seedRows.length > 0) {
    const { error } = await supabase.from('verdict_votes').insert(seedRows);
    if (error) {
      return NextResponse.json({ success: false, error: `Vote insert failed: ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    pairsGenerated: pairs.length,
    matchupsTotal: (matchups ?? []).length,
    matchupsSeeded: seededMatchups,
    votesInserted: seedRows.length,
  });
}
