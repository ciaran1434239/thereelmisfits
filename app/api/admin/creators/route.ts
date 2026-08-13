import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('creators')
    .select('id, name, handle, avatar_url, youtube_channel_id, content_types')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { handle, contentTypes } = await req.json();
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 });

  const YT_KEY = process.env.YOUTUBE_API_KEY;

  // Try forHandle first (@ handles), then forUsername (legacy)
  const cleanHandle = handle.replace(/^@/, '');
  const urls = [
    `https://www.googleapis.com/youtube/v3/channels?key=${YT_KEY}&forHandle=${encodeURIComponent(handle.startsWith('@') ? handle : '@' + handle)}&part=snippet`,
    `https://www.googleapis.com/youtube/v3/channels?key=${YT_KEY}&forUsername=${encodeURIComponent(cleanHandle)}&part=snippet`,
  ];

  let channel: any = null;
  for (const url of urls) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.items?.length) { channel = data.items[0]; break; }
  }

  if (!channel) return NextResponse.json({ error: `Channel not found for: ${handle}` }, { status: 404 });

  const { error } = await supabase.from('creators').upsert({
    youtube_channel_id: channel.id,
    name: channel.snippet.title,
    handle: cleanHandle.toLowerCase(),
    avatar_url: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || null,
    content_types: contentTypes ?? ['review'],
  }, { onConflict: 'youtube_channel_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, name: channel.snippet.title, id: channel.id });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Also delete their reviews to avoid orphaned data
  await supabase.from('reviews').delete().eq('creator_id', id);
  const { error } = await supabase.from('creators').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
