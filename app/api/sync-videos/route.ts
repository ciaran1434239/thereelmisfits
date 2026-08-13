import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type VideoType = 'deep_dive' | 'rant' | 'rave' | 'skip';
type DeepDiveCategory = 'director' | 'actor' | 'making_of' | 'screenplay' | 'cinematography' | null;

interface ClassifyResult {
  type: VideoType;
  category: DeepDiveCategory;
}

async function classifyVideo(title: string, apiKey: string): Promise<ClassifyResult> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `Classify this YouTube video title: "${title}"

Choose ONE type:
- "deep_dive": A video essay or analytical piece about filmmaking craft — a director's style, an actor's career, how a movie was made, screenplay/story analysis, or cinematography/editing technique. Must be analytical in nature.
- "rant": A negative opinion piece about a franchise, show, studio, or cultural trend in film/TV. Examples: a franchise dying ("Star Trek is Dead"), bad casting decisions, studios going woke, Disney ruining things, why a genre is declining, shows being cancelled unfairly, remakes nobody asked for, bad industry decisions. Can name a specific show or franchise but is making a broader point — NOT simply reviewing whether one specific movie was good or bad.
- "rave": A positive opinion piece about a franchise, show, studio, or cultural trend. Examples: praising a casting announcement, celebrating a comeback, best-of lists, why a genre is thriving, a studio making smart decisions, excitement about a new season or direction.
- "skip": A review or reaction to ONE specific film or episode — "Is it good?", "My thoughts on X", "X Review", trailer reactions, news recaps, podcasts, Q&As, vlogs.

Key rule: Ask "is this reviewing one specific movie/episode, or is it a broader take on a show/franchise/studio/trend?" If it's the former, it's "skip". If it's the latter, it's "rant" or "rave".

If type is "deep_dive", also choose ONE category:
- "director": About a specific director's style, filmography, or technique
- "actor": About an actor's career, method, or performances
- "making_of": Behind-the-scenes, production stories, how a specific film was physically made
- "screenplay": Script analysis, story structure, dialogue craft, narrative technique
- "cinematography": Camera work, editing, visual technique, shot composition, colour

Return ONLY valid JSON: {"type": "deep_dive"|"rant"|"rave"|"skip", "category": "director"|"actor"|"making_of"|"screenplay"|"cinematography"|null}`,
          },
        ],
      }),
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '10', 10);
      const wait = (retryAfter + 1) * 1000;
      console.log(`Groq rate limit hit — waiting ${retryAfter + 1}s...`);
      await new Promise(r => setTimeout(r, wait));
      return classifyVideo(title, apiKey);
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Groq ${res.status}: ${err.error?.message || 'unknown error'}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned no content');
    return JSON.parse(text);
  } catch (err) {
    console.error('Groq classify error:', err);
    return { type: 'skip', category: null };
  }
}

export async function GET() {
  try {
    const YT_KEY = process.env.YOUTUBE_API_KEY;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!YT_KEY || !GROQ_KEY) throw new Error('Missing API keys');

    const { data: allCreators } = await supabase.from('creators').select('*');
    const creators = (allCreators || []).filter(c =>
      c.content_types?.includes('deep_dive') || c.content_types?.includes('rant')
    );

    if (!creators.length) {
      return NextResponse.json({ success: true, added: 0, message: 'No creators with video content types found' });
    }

    let added = 0;

    for (const creator of creators) {
      console.log(`📡 Fetching uploads for ${creator.name}...`);

      const uploadsPlaylistId = creator.youtube_channel_id.replace(/^UC/, 'UU');
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?key=${YT_KEY}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=30`,
        { cache: 'no-store' }
      );
      const plData = await plRes.json();

      if (plData.error?.code === 403) throw new Error('YOUTUBE_QUOTA_EXCEEDED');
      if (plData.error) {
        console.error(`YT error for ${creator.name}:`, plData.error.message);
        continue;
      }

      for (const item of (plData.items || [])) {
        const videoId = item.snippet.resourceId?.videoId;
        if (!videoId) continue;

        const title = item.snippet.title;
        const thumbnail =
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const publishedAt = item.snippet.publishedAt;

        const { data: existing } = await supabase
          .from('videos')
          .select('id')
          .eq('youtube_video_id', videoId)
          .single();
        if (existing) continue;

        await new Promise(r => setTimeout(r, 3000));
        const verdict = await classifyVideo(title, GROQ_KEY);
        if (verdict.type === 'skip') {
          console.log(`⏭️  Skip: "${title}"`);
          continue;
        }

        const { error } = await supabase.from('videos').insert({
          creator_id: creator.id,
          youtube_video_id: videoId,
          title,
          thumbnail_url: thumbnail,
          published_at: publishedAt,
          type: verdict.type,
          deep_dive_category: verdict.category,
        });

        if (!error) {
          console.log(`✅ ${verdict.type}${verdict.category ? ` [${verdict.category}]` : ''}: "${title}"`);
          added++;
        } else {
          console.error(`DB insert error:`, error.message);
        }
      }
    }

    return NextResponse.json({ success: true, added });
  } catch (error: any) {
    console.error('sync-videos error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
