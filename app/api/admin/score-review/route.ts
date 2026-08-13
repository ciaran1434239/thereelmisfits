import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/admin/score-review
// Body: { id: string, recommend: boolean | null }
//   recommend: true  = thumbs up
//   recommend: false = thumbs down
//   recommend: null  = dismiss (keep as unscored, remove from pending queue)

export async function POST(req: NextRequest) {
  const { id, recommend } = await req.json();

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  }

  if (recommend !== true && recommend !== false && recommend !== null) {
    return NextResponse.json({ success: false, error: 'recommend must be true, false, or null' }, { status: 400 });
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      recommend,
      is_manual_override: true,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
