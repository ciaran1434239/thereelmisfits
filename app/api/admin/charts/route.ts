import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET — list all charts with their entries
export async function GET() {
  const { data, error } = await supabase
    .from('charts')
    .select('*, chart_entries(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, charts: data ?? [] });
}

// POST — actions:
// { action: 'create_chart',   title, subtitle, image_url, category_tags, is_featured, status }
// { action: 'update_chart',   id, title, subtitle, image_url, category_tags, is_featured }
// { action: 'publish_chart',  id }
// { action: 'unpublish_chart',id }
// { action: 'upsert_entries', chart_id, entries: [{ rank, movieId, movieTitle, movieYear, moviePosterPath, oneLiner, customImageUrl }] }
// { action: 'add_entry',      chart_id, title, year, poster_url, quote, rank, movie_id }
// { action: 'delete_chart',   id }
// { action: 'delete_entry',   id }
// { action: 'toggle_featured',id, is_featured }
export async function POST(req: NextRequest) {
  const body = await req.json();

  // ── create_chart ────────────────────────────────────────────────
  if (body.action === 'create_chart') {
    const { title, subtitle, image_url, category_tags, is_featured, status } = body;
    if (!title) return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });

    if (is_featured) {
      await supabase.from('charts').update({ is_featured: false }).eq('is_featured', true);
    }

    const { data, error } = await supabase.from('charts').insert({
      title,
      subtitle:       subtitle || null,
      image_url:      image_url || null,
      category_tags:  category_tags ?? [],
      is_featured:    is_featured ?? false,
      status:         status ?? 'draft',
      published_at:   status === 'published' ? new Date().toISOString() : null,
      created_at:     new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, chart: data });
  }

  // ── update_chart ────────────────────────────────────────────────
  if (body.action === 'update_chart') {
    const { id, title, subtitle, image_url, category_tags, is_featured } = body;
    if (!id || !title) return NextResponse.json({ success: false, error: 'id and title required' }, { status: 400 });

    if (is_featured) {
      await supabase.from('charts').update({ is_featured: false }).neq('id', id).eq('is_featured', true);
    }

    const { error } = await supabase.from('charts').update({
      title,
      subtitle:      subtitle || null,
      image_url:     image_url || null,
      category_tags: category_tags ?? [],
      is_featured:   is_featured ?? false,
      updated_at:    new Date().toISOString(),
    }).eq('id', id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── publish_chart ────────────────────────────────────────────────
  if (body.action === 'publish_chart') {
    const { error } = await supabase.from('charts').update({
      status:       'published',
      published_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }).eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── unpublish_chart ──────────────────────────────────────────────
  if (body.action === 'unpublish_chart') {
    const { error } = await supabase.from('charts').update({
      status:     'draft',
      updated_at: new Date().toISOString(),
    }).eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── upsert_entries (batch replace) ──────────────────────────────
  if (body.action === 'upsert_entries') {
    const { chart_id, entries } = body as {
      chart_id: number;
      entries: {
        rank: number;
        movieId: number | null;
        movieTitle: string;
        movieYear: string | null;
        moviePosterPath: string | null;
        oneLiner: string;
        customImageUrl: string | null;
      }[];
    };
    if (!chart_id) return NextResponse.json({ success: false, error: 'chart_id required' }, { status: 400 });

    await supabase.from('chart_entries').delete().eq('chart_id', chart_id);

    const toInsert = entries
      .filter(e => e.movieTitle?.trim())
      .map(e => ({
        chart_id,
        rank:             e.rank,
        title:            e.movieTitle,
        year:             e.movieYear || null,
        poster_url:       e.moviePosterPath
                            ? `https://image.tmdb.org/t/p/w185${e.moviePosterPath}`
                            : null,
        quote:            e.oneLiner || null,
        movie_id:         e.movieId || null,
        custom_image_url: e.customImageUrl || null,
      }));

    if (toInsert.length) {
      const { error } = await supabase.from('chart_entries').insert(toInsert);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ── add_entry (legacy single-entry add) ─────────────────────────
  if (body.action === 'add_entry') {
    const { chart_id, title, year, poster_url, quote, rank, movie_id } = body;
    if (!chart_id || !title) return NextResponse.json({ success: false, error: 'chart_id and title required' }, { status: 400 });

    const { error } = await supabase.from('chart_entries').insert({
      chart_id,
      title,
      year:      year || null,
      poster_url: poster_url || null,
      quote:     quote || null,
      rank:      rank ?? 99,
      movie_id:  movie_id || null,
    });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── delete_chart ─────────────────────────────────────────────────
  if (body.action === 'delete_chart') {
    await supabase.from('chart_entries').delete().eq('chart_id', body.id);
    const { error } = await supabase.from('charts').delete().eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── delete_entry ─────────────────────────────────────────────────
  if (body.action === 'delete_entry') {
    const { error } = await supabase.from('chart_entries').delete().eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── toggle_featured ──────────────────────────────────────────────
  if (body.action === 'toggle_featured') {
    if (body.is_featured) {
      await supabase.from('charts').update({ is_featured: false }).eq('is_featured', true);
    }
    const { error } = await supabase.from('charts').update({ is_featured: body.is_featured }).eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
