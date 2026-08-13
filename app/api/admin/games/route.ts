import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Fetch all games with their review counts
  const { data: games, error } = await supabase
    .from('games')
    .select('id, title, cover_image_id, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get review counts per game
  const { data: counts } = await supabase
    .from('reviews')
    .select('game_id')
    .not('game_id', 'is', null);

  const countMap: Record<number, number> = {};
  for (const r of counts ?? []) {
    if (r.game_id) countMap[r.game_id] = (countMap[r.game_id] ?? 0) + 1;
  }

  const result = (games ?? []).map(g => ({
    ...g,
    review_count: countMap[g.id] ?? 0,
  }));

  return NextResponse.json({ games: result, total: result.length });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Delete reviews first, then the game
  await supabase.from('reviews').delete().eq('game_id', id);
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
