import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getCounts(movieId: number): Promise<{ pro: number; con: number }> {
  const { data } = await supabase
    .from('verdict_votes')
    .select('side')
    .eq('movie_id', movieId);

  const pro = data?.filter(r => r.side === 'pro').length ?? 0;
  const con = data?.filter(r => r.side === 'con').length ?? 0;
  return { pro, con };
}

export async function GET(req: NextRequest) {
  const movieId = parseInt(req.nextUrl.searchParams.get('movieId') ?? '0');
  if (!movieId) return NextResponse.json({ pro: 0, con: 0 });
  return NextResponse.json(await getCounts(movieId));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { movieId, side } = body ?? {};

  if (!movieId || !['pro', 'con'].includes(side)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await supabase
    .from('verdict_votes')
    .insert({ movie_id: movieId, side });

  if (error) {
    // Table may not exist yet — return a graceful zero state
    console.error('[verdict-votes] insert error:', error.message);
    return NextResponse.json({ pro: 0, con: 0 });
  }

  return NextResponse.json(await getCounts(movieId));
}
