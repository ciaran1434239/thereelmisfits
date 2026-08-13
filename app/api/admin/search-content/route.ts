import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/search-content?q=term&type=movie|show
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const type = url.searchParams.get('type');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  if (type === 'movie') {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title')
      .ilike('title', `%${q}%`)
      .order('title')
      .limit(8);

    if (error) return NextResponse.json({ results: [] });
    return NextResponse.json({ results: data ?? [] });
  }

  if (type === 'show') {
    const { data, error } = await supabase
      .from('shows')
      .select('id, title')
      .ilike('title', `%${q}%`)
      .order('title')
      .limit(8);

    if (error) return NextResponse.json({ results: [] });
    // Normalise to `name` field so callers don't need to change
    return NextResponse.json({ results: (data ?? []).map(s => ({ id: s.id, name: s.title })) });
  }

  return NextResponse.json({ results: [] });
}
