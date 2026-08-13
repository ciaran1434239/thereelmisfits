import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pickSnippet, extractSeason, isAvailableForReview } from '@/lib/sync-helpers';

export const dynamic = 'force-dynamic';

// ── Helpers (duplicated from deep-sync for self-containment) ──────────────────

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  // Already a bare ID (11 chars, alphanumeric + - _)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  // YouTube URL formats
  const match =
    trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/) ??
    trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ??
    trimmed.match(/embed\/([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

async function fetchVideoInfo(videoId: string, ytKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?key=${ytKey}&id=${videoId}&part=snippet`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.snippet ?? null;
}

interface Classification {
  isReview: boolean;
  contentTitle: string | null;
  contentType: 'movie' | 'tv' | null;
}

const EXPLICIT_REVIEW_RE = /\bREVIEW\b/i;
const REVIEW_BOMB_RE = /review.?bomb/i;

async function classifyVideo(title: string, description: string, openaiKey: string): Promise<Classification> {
  const isExplicitReview = EXPLICIT_REVIEW_RE.test(title) && !REVIEW_BOMB_RE.test(title);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: isExplicitReview
              ? `This YouTube video is a review. Extract the film or TV show being reviewed.
Return the clean official title only — strip "REVIEW", channel names, and opinion text.
Return ONLY valid JSON: {"isReview": true, "contentTitle": string, "contentType": "movie" | "tv"}`
              : `You classify YouTube videos for a film/TV review aggregator.
IS IT A REVIEW? The creator watched a specific film/TV show and gives their personal verdict on its quality.
YES — a review: "[Title] is Awful/Brilliant", "[Title] Completely Disappointed Me", etc.
NO: "Review Bombed/Bombing", franchise commentary, studio news, "Why X Failed/Flopped", box office results, trailer reactions.
Return ONLY valid JSON: {"isReview": boolean, "contentTitle": string | null, "contentType": "movie" | "tv" | null}`,
          },
          {
            role: 'user',
            content: `Title: "${title}"\nDescription: "${description.slice(0, 600)}"`,
          },
        ],
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { isReview: false, contentTitle: null, contentType: null };
    return JSON.parse(text);
  } catch {
    return { isReview: false, contentTitle: null, contentType: null };
  }
}

async function findOnTmdb(title: string, type: 'movie' | 'tv', tmdbKey: string) {
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
  const search = async (q: string) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(q)}&language=en-US`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    return ((await res.json()).results ?? [])[0] ?? null;
  };
  const result = await search(title);
  if (result) return result;
  const stripped = title.replace(/\s+(season\s+)?\d+$/i, '').trim();
  if (stripped && stripped !== title) return search(stripped);
  return null;
}

// ── GET /api/admin/add-review?videoId=XXX ─────────────────────────────────────
// Classifies a video and returns what it would insert (preview/dry-run)

export async function GET(req: NextRequest) {
  const YT_KEY = process.env.YOUTUBE_API_KEY!;
  const OPENAI_KEY = process.env.OPENAI_API_KEY!;
  const TMDB_KEY = process.env.TMDB_API_KEY!;

  const url = new URL(req.url);
  const raw = url.searchParams.get('videoId') ?? '';
  const videoId = extractVideoId(raw);

  if (!videoId) {
    return NextResponse.json({ success: false, error: 'Invalid YouTube URL or video ID' }, { status: 400 });
  }

  // Check if already in DB
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('youtube_video_id', videoId)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json({ success: false, error: 'This video is already in the database' }, { status: 409 });
  }

  // Fetch video info
  const snippet = await fetchVideoInfo(videoId, YT_KEY);
  if (!snippet) {
    return NextResponse.json({ success: false, error: 'Video not found or YouTube API error' }, { status: 404 });
  }

  const title: string = snippet.title;
  const description: string = snippet.description ?? '';
  const publishedAt: string = snippet.publishedAt;

  // Classify
  const classification = await classifyVideo(title, description, OPENAI_KEY);

  let tmdbMatch: any = null;
  if (classification.isReview && classification.contentTitle && classification.contentType) {
    tmdbMatch = await findOnTmdb(classification.contentTitle, classification.contentType, TMDB_KEY);
  }

  return NextResponse.json({
    success: true,
    videoId,
    title,
    publishedAt,
    classification,
    tmdbMatch: tmdbMatch
      ? {
          id: tmdbMatch.id,
          title: tmdbMatch.title ?? tmdbMatch.name,
          type: classification.contentType,
          backdrop_path: tmdbMatch.backdrop_path,
          poster_path: tmdbMatch.poster_path,
          release_date: tmdbMatch.release_date ?? tmdbMatch.first_air_date,
          unreleased: !isAvailableForReview(tmdbMatch.release_date ?? tmdbMatch.first_air_date),
        }
      : null,
    snippet: pickSnippet(description),
  });
}

// ── POST /api/admin/add-review ────────────────────────────────────────────────
// Inserts the review after user confirmation

export async function POST(req: NextRequest) {
  const TMDB_KEY = process.env.TMDB_API_KEY!;
  const YT_KEY = process.env.YOUTUBE_API_KEY!;

  const {
    videoId,
    creatorId,
    tmdbId,
    tmdbType,
    recommend,
    publishedAt,
    title,
    snippet,
    force,
  } = await req.json();

  if (!videoId || !creatorId || !tmdbId || !tmdbType) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Double-check not already in DB
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('youtube_video_id', videoId)
    .limit(1);
  if (existing?.length) {
    return NextResponse.json({ success: false, error: 'Already exists in database' }, { status: 409 });
  }

  // Fetch TMDB details to ensure movie/show row exists
  const tmdbRes = await fetch(
    `https://api.themoviedb.org/3/${tmdbType === 'movie' ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_KEY}`,
    { next: { revalidate: 86400 } },
  );
  const tmdbDetails = tmdbRes.ok ? await tmdbRes.json() : null;
  if (!tmdbDetails) {
    return NextResponse.json({ success: false, error: 'Could not fetch TMDB details' }, { status: 500 });
  }

  // Block unreleased content unless explicitly forced by admin
  const releaseDate = tmdbDetails.release_date ?? tmdbDetails.first_air_date ?? null;
  if (!isAvailableForReview(releaseDate) && !force) {
    return NextResponse.json({
      success: false,
      error: `"${tmdbDetails.title ?? tmdbDetails.name}" hasn't been released yet (${releaseDate}). Add ?force=true to override.`,
      unreleased: true,
    }, { status: 422 });
  }

  let reviewPayload: Record<string, any> = {
    creator_id: creatorId,
    youtube_video_id: videoId,
    title,
    score: 0,
    recommend: recommend ?? null,
    snippet: snippet ?? null,
    posted_at: publishedAt,
    is_manual_override: true,
  };

  if (tmdbType === 'movie') {
    const contentTitle: string = tmdbDetails.title;
    await supabase.from('movies').upsert({
      id: tmdbDetails.id,
      title: contentTitle,
      backdrop_path: tmdbDetails.backdrop_path,
      slug: `${contentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${tmdbDetails.id}`,
    });
    reviewPayload.movie_id = tmdbDetails.id;
  } else {
    const contentTitle: string = tmdbDetails.name;
    await supabase.from('shows').upsert({
      id: tmdbDetails.id,
      title: contentTitle,
      backdrop_path: tmdbDetails.backdrop_path,
      poster_path: tmdbDetails.poster_path,
      slug: `${contentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${tmdbDetails.id}`,
    });
    reviewPayload.show_id = tmdbDetails.id;
    reviewPayload.season_number = extractSeason(title);
  }

  const { error } = await supabase.from('reviews').insert(reviewPayload);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
