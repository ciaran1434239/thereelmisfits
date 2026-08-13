import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews?search=term&limit=100&offset=0
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get('search')?.trim() ?? '';
  const limit = parseInt(url.searchParams.get('limit') ?? '100');
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  let query = supabase
    .from('reviews')
    .select(`
      id,
      title,
      snippet,
      score,
      recommend,
      is_manual_override,
      posted_at,
      youtube_video_id,
      movies(id, title),
      shows(id, title),
      creators(id, name, avatar_url)
    `, { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, reviews: data ?? [], total: count ?? 0 });
}

// PATCH /api/admin/reviews
// Body: { id: string, action: 'clear_snippet' }  — clears the snippet field
// Body: { id: string, movie_id?: number, show_id?: number } — reclassify
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action, movie_id, show_id } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  }

  // Clear snippet action
  if (action === 'clear_snippet') {
    const { error } = await supabase.from('reviews').update({ snippet: null }).eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Reclassify action
  if (!movie_id && !show_id) {
    return NextResponse.json({ success: false, error: 'Missing id or target' }, { status: 400 });
  }

  const update = movie_id
    ? { movie_id, show_id: null }
    : { show_id, movie_id: null };

  const { error } = await supabase.from('reviews').update(update).eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/reviews
// Body: { id: string } — single delete
// Body: { ids: string[] } — bulk delete
export async function DELETE(req: NextRequest) {
  const body = await req.json();

  // Bulk delete
  if (Array.isArray(body.ids)) {
    if (!body.ids.length) {
      return NextResponse.json({ success: false, error: 'No ids provided' }, { status: 400 });
    }
    const { error } = await supabase.from('reviews').delete().in('id', body.ids);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: body.ids.length });
  }

  // Single delete
  const { id } = body;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  }

  const { error } = await supabase.from('reviews').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}