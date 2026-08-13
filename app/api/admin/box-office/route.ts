import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Accepts numbers or AI-formatted strings like "$4,200,000" → 4200000 */
function parseGross(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[$,]/g, '')) || 0;
  return 0;
}

// GET — list all distinct weeks + entries for a given week
// ?week=YYYY-MM-DD  → returns { domestic: [], global: [] } for that week
// (no params)       → returns { weeks: ['YYYY-MM-DD', ...] }
export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week');

  if (week) {
    const [{ data: domestic }, { data: global }] = await Promise.all([
      supabase.from('box_office').select('*').eq('week_of', week).eq('region', 'domestic').order('rank'),
      supabase.from('box_office').select('*').eq('week_of', week).eq('region', 'global').order('rank'),
    ]);
    return NextResponse.json({ success: true, domestic: domestic ?? [], global: global ?? [] });
  }

  const { data, error } = await supabase
    .from('box_office')
    .select('week_of')
    .order('week_of', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const weeks = [...new Set((data ?? []).map((r: any) => r.week_of))];
  return NextResponse.json({ success: true, weeks });
}

// POST actions:
// { action: 'upsert_entry', week_of, region, rank, title, weekend_gross, total_gross, weeks_in_release, change_pct, studio, is_new, movie_id }
// { action: 'delete_entry', id }
// { action: 'delete_week', week_of }   — deletes all entries for a week
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'upsert_entry') {
    const {
      id, week_of, region, rank, title,
      weekend_gross, total_gross, weeks_in_release,
      change_pct, studio, is_new, movie_id,
    } = body;

    if (!week_of || !region || !rank || !title) {
      return NextResponse.json({ success: false, error: 'week_of, region, rank, title required' }, { status: 400 });
    }

    const payload = {
      week_of,
      region,
      rank: Number(rank),
      title,
      weekend_gross: Number(weekend_gross) || 0,
      total_gross: Number(total_gross) || 0,
      weeks_in_release: Number(weeks_in_release) || 1,
      change_pct: change_pct !== '' && change_pct != null ? Number(change_pct) : null,
      studio: studio || null,
      is_new: Boolean(is_new),
      movie_id: movie_id || null,
    };

    let data, error;
    if (id) {
      ({ data, error } = await supabase.from('box_office').update(payload).eq('id', id).select().single());
    } else {
      ({ data, error } = await supabase.from('box_office').insert(payload).select().single());
    }

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, entry: data });
  }

  if (body.action === 'delete_entry') {
    const { error } = await supabase.from('box_office').delete().eq('id', body.id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'delete_week') {
    const { error } = await supabase.from('box_office').delete().eq('week_of', body.week_of);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Bulk import: { action: 'bulk_import', week_of, region, entries: [{ rank, title, tmdb_id, studio, weekend_gross, total_gross, weeks_released }] }
  if (body.action === 'bulk_import') {
    const { week_of, region, entries } = body as {
      week_of: string;
      region: 'domestic' | 'global';
      entries: {
        rank: number;
        title: string;
        tmdb_id?: number | string;   // preferred — use this directly as movie_id
        studio?: string;
        weekend_gross: number | string;
        total_gross: number | string;
        weeks_released: number;
      }[];
    };

    if (!week_of || !region || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ success: false, error: 'week_of, region, and entries[] are required' }, { status: 400 });
    }

    // Resolve movie_id:
    //  1. If tmdb_id provided → use it directly (reliable, no string matching)
    //  2. Otherwise → fall back to ilike title match against our movies table
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        let movie_id: number | null = null;

        if (entry.tmdb_id) {
          movie_id = Number(entry.tmdb_id);
        } else {
          const { data: movies } = await supabase
            .from('movies')
            .select('id')
            .ilike('title', entry.title)
            .limit(1);
          movie_id = movies?.[0]?.id ?? null;
        }

        return {
          week_of,
          region,
          rank:             Number(entry.rank),
          title:            entry.title,
          weekend_gross:    parseGross(entry.weekend_gross),
          total_gross:      parseGross(entry.total_gross),
          weeks_in_release: Number(entry.weeks_released) || 1,
          change_pct:       null,
          studio:           entry.studio ?? null,
          is_new:           Number(entry.weeks_released) === 1,
          movie_id,
        };
      })
    );

    // Replace all entries for this week+region atomically
    const { error: delErr } = await supabase
      .from('box_office')
      .delete()
      .eq('week_of', week_of)
      .eq('region', region);
    if (delErr) return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });

    const { error: insErr } = await supabase.from('box_office').insert(enriched);
    if (insErr) return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });

    const matched = enriched.filter(e => e.movie_id !== null).length;
    return NextResponse.json({ success: true, inserted: enriched.length, matched });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
