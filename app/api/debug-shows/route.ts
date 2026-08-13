import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [{ data: reviewsWithShow }, { data: showsCount }, { data: sampleShows }] = await Promise.all([
    supabase.from('reviews').select('show_id').not('show_id', 'is', null).limit(5),
    supabase.from('shows').select('id', { count: 'exact', head: true }),
    supabase.from('shows').select('id, title, first_air_date').limit(5),
  ]);

  const showIds = (reviewsWithShow ?? []).map((r: any) => r.show_id);
  const { data: matchingShows } = showIds.length
    ? await supabase.from('shows').select('id, title').in('id', showIds)
    : { data: [] };

  return NextResponse.json({
    reviewsWithShowId: reviewsWithShow?.length ?? 0,
    sampleShowIds: showIds,
    showsInDb: sampleShows?.length ?? 0,
    sampleShows,
    matchingShowsFound: matchingShows?.length ?? 0,
    matchingShows,
  });
}
