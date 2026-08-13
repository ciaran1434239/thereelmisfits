import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/pending-counts
// Returns a map of creator_id -> count of unscored reviews (recommend IS NULL, not manual override)
export async function GET() {
  const { data, error } = await supabase
    .from('reviews')
    .select('creator_id')
    .is('recommend', null)
    .eq('is_manual_override', false);

  if (error) {
    return NextResponse.json({ counts: {} });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.creator_id) {
      counts[row.creator_id] = (counts[row.creator_id] ?? 0) + 1;
    }
  }

  return NextResponse.json({ counts });
}
