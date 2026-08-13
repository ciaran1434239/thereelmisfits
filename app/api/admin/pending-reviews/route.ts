import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '50');

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      title,
      youtube_video_id,
      posted_at,
      movies(id, title),
      shows(id, title),
      creators(id, name, avatar_url)
    `)
    .is('recommend', null)
    .eq('is_manual_override', false)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, reviews: data ?? [], total: data?.length ?? 0 });
}