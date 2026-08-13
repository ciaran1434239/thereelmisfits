import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const YT_KEY = process.env.YOUTUBE_API_KEY;

  const { data: creators } = await supabase
    .from('creators')
    .select('id, name, youtube_channel_id, avatar_url');

  if (!creators?.length) return NextResponse.json({ updated: 0 });

  // Batch fetch all channel data from YouTube API (50 at a time)
  const ids = creators.map(c => c.youtube_channel_id).filter(Boolean);
  const results: Record<string, string> = {};

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/channels?key=${YT_KEY}&id=${chunk.join(',')}&part=snippet`;
    const res = await fetch(url);
    const data = await res.json();
    for (const item of data.items ?? []) {
      const thumb =
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url;
      if (thumb) results[item.id] = thumb;
    }
  }

  let updated = 0;
  for (const creator of creators) {
    const thumb = results[creator.youtube_channel_id];
    if (thumb && thumb !== creator.avatar_url) {
      await supabase.from('creators').update({ avatar_url: thumb }).eq('id', creator.id);
      updated++;
    }
  }

  return NextResponse.json({ updated, total: creators.length, found: Object.keys(results).length });
}
