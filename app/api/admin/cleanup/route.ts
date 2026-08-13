import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BAD_TITLE_PATTERNS = [
  /trailer/i,
  /isn'?t happening/i,
  /not happening/i,
  /cancelled/i,
  /release date/i,
  /renewed/i,
  /\bbox office/i,
  /opening weekend/i,
  /million opening/i,
  /million globally/i,
  /viewership/i,
  /reviews are (in|here)/i,
  /first reactions/i,
  /critics say/i,
  /what critics think/i,
  /rotten tomatoes/i,
  /livecast/i,
  /live stream/i,
  /week in review/i,
  /friday night tights/i,
  /charts with/i,
  /top 10/i,
  /explained$/i,
  /ending explained/i,
  /timeline explained/i,
];

export async function POST() {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, title');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const toDelete = (reviews || []).filter(r =>
    BAD_TITLE_PATTERNS.some(p => p.test(r.title || ''))
  );

  if (!toDelete.length) {
    return NextResponse.json({ deleted: 0, message: 'No bad reviews found' });
  }

  const ids = toDelete.map(r => r.id);
  const { error: delError } = await supabase.from('reviews').delete().in('id', ids);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  const titles = toDelete.map(r => r.title);
  return NextResponse.json({ deleted: toDelete.length, titles });
}
