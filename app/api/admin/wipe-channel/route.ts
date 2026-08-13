import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/admin/wipe-channel — delete all reviews for a single creator
// Body: { creator_id: string }
export async function POST(req: NextRequest) {
  const { creator_id } = await req.json();

  if (!creator_id) {
    return NextResponse.json({ error: 'Missing creator_id' }, { status: 400 });
  }

  const { count: before } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creator_id);

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('creator_id', creator_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: before ?? 0 });
}
