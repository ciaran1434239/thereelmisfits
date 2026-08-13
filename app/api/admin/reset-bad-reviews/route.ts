import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Patterns that indicate a snippet is description boilerplate, not a verdict
const BOILERPLATE_RE = [
  /ways?\s+to\s+support/i,
  /support\s+this\s+channel/i,
  /\bsubscribe\b/i,
  /\bpatreon\b/i,
  /\bmerch\b/i,
  /\bnewsletter\b/i,
  /follow\s+(me|us)\s+on/i,
  /social\s+media/i,
  /affiliate\s+link/i,
  /use\s+code\b/i,
  /\bdiscord\b/i,
];

function isBadSnippet(snippet: string): boolean {
  if (!snippet || snippet.trim().length < 20) return true;
  if (/^[A-Z\s:]+:?\s*$/.test(snippet.trim())) return true; // all-caps header
  return BOILERPLATE_RE.some(re => re.test(snippet));
}

// POST /api/admin/reset-bad-reviews
// Finds reviews with boilerplate snippets and resets them so backfill re-processes them.
// Optional body: { creator_id: string } to restrict to one channel.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const creatorId = body.creator_id as string | undefined;

  let query = supabase
    .from('reviews')
    .select('id, snippet, creator_id')
    .not('snippet', 'is', null)
    .eq('is_manual_override', false);

  if (creatorId) query = query.eq('creator_id', creatorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const badIds = (data ?? [])
    .filter(r => isBadSnippet(r.snippet ?? ''))
    .map(r => r.id);

  if (!badIds.length) {
    return NextResponse.json({ success: true, reset: 0, message: 'No bad snippets found' });
  }

  // Reset: clear snippet + score + recommend so backfill picks them up fresh
  const { error: updateError } = await supabase
    .from('reviews')
    .update({ snippet: null, score: 0, recommend: null })
    .in('id', badIds);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, reset: badIds.length });
}
