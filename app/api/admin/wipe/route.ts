import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Deletes ALL reviews. Used to reset after schema/matching logic changes.
export async function POST() {
  const { count: before } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
  // Match all rows (id is non-null for every row)
  const { error } = await supabase.from('reviews').delete().not('id', 'is', null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: before ?? 0 });
}
