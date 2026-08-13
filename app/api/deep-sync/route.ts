import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isBlocklisted, extractSeason, pickSnippet, isAvailableForReview } from '@/lib/sync-helpers';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ── TMDB show IDs that are promos/galleries and must never store reviews ──────
// These are TMDB entries that share a title prefix with a real film but are
// special looks, behind-the-scenes docs, or marketing shorts — not the movie.
const TMDB_SHOW_BLOCKLIST = new Set([
  321564, // "Star Wars: The Mandalorian and Grogu | A Special Look"
  101978, // "Disney Gallery / Star Wars: The Mandalorian"
]);

// ── YouTube ───────────────────────────────────────────────────────────────────

async function fetchAllVideos(
  playlistId: string,
  ytKey: string,
  maxPages = 4,
  cutoffDate: Date | null = null,
): Promise<any[]> {
  const videos: any[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('key', ytKey);
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = res.ok ? await res.json() : null;
    if (!data || data.error) break;
    const items: any[] = data.items ?? [];
    if (cutoffDate) {
      // YouTube playlist is newest-first — filter to fresh items and stop
      // paging as soon as we hit anything older than the cutoff.
      const fresh = items.filter(
        (v: any) => new Date(v.snippet.publishedAt) >= cutoffDate,
      );
      videos.push(...fresh);
      if (fresh.length < items.length) break; // hit the cutoff wall — done
    } else {
      videos.push(...items);
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return videos;
}

// ── AI: classify video → what is it reviewing? ───────────────────────────────

interface Classification {
  isReview: boolean;
  contentTitle: string | null;
  contentType: 'movie' | 'tv' | 'game' | null;
}

// Patterns that unambiguously signal a review — skip the AI is-it-a-review question.
// "Before You Buy" is Gameranx's review format; "Review" covers the standard case.
const EXPLICIT_REVIEW_RE = /\bREVIEW\b|\bBefore You Buy\b/i;
const REVIEW_BOMB_RE = /review.?bomb/i;

async function classifyVideo(
  title: string,
  description: string,
  openaiKey: string,
): Promise<Classification> {
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
              ? `This YouTube video is a review. Extract the film, TV show, or video game being reviewed.
Return the clean official title only — strip "REVIEW", "Before You Buy", channel names, and opinion text.
Examples: "Fantastic Four: First Steps REVIEW - Best Flop Ever" → "Fantastic Four: First Steps" (movie)
          "Alien: Earth REVIEW" → "Alien: Earth" (tv)
          "Elden Ring REVIEW - A Masterpiece" → "Elden Ring" (game)
          "Baldur's Gate 3 REVIEW" → "Baldur's Gate 3" (game)
          "Marathon - Before You Buy" → "Marathon" (game)
          "Resident Evil Requiem - Before You Buy" → "Resident Evil Requiem" (game)
          "Legacy of Kain: Defiance Remastered - Before You Buy" → "Legacy of Kain: Defiance Remastered" (game)
          "Code Vein 2 - Before You Buy" → "Code Vein 2" (game)

Return ONLY valid JSON: {"isReview": true, "contentTitle": string, "contentType": "movie" | "tv" | "game"}`

              : `You classify YouTube videos for a film, TV, and gaming review aggregator.

IS IT A REVIEW? The creator played/watched a specific title and gives their personal verdict on its quality.

YES — a review:
- "[Title] is Awful/Brilliant/Abysmal/a Disaster"
- "[Title] Completely Disappointed Me"
- "[Title] - My Honest Thoughts / First Impressions" (with a clear verdict)
- Game reviews: "[Game] Review", "[Game] is the Best/Worst Game of the Year"
- "I recommend: [Title]" or "I don't recommend: [Title]"
- Episode reviews: "[Show] Season X Episode Y — [opinion]"

NO — not a review:
- "Review Bombed/Bombing" — about audience behavior
- Franchise/industry health: "Is X Dead?", "Gaming is Dying"
- Studio/developer news: someone quit, got fired, announced something
- "Why X Failed/Flopped" — post-mortem analysis, not a personal verdict
- Box office / sales results reporting
- Lists: "Top 5 Games of 2025", "20 Games You Should Play"
- Trailer reactions, previews, or hands-on impressions (hasn't finished the game/film)
- "Before You Buy" — handled separately, never reaches this prompt
- Gameplay walkthroughs, guides, tips, easter eggs with no personal verdict
- Industry news roundups ("This Week in...", "Friends Per Second")

Return ONLY valid JSON:
{"isReview": boolean, "contentTitle": string | null, "contentType": "movie" | "tv" | "game" | null}
If not a review, contentTitle and contentType must be null.`,
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

// ── TMDB: find the content (multi-search, AI type is a hint not a constraint) ──

async function findOnTmdb(
  title: string,
  preferredType: 'movie' | 'tv',
  tmdbKey: string,
): Promise<(any & { actualType: 'movie' | 'tv' }) | null> {
  // Use type-specific endpoints — avoids cross-contamination where a movie
  // query returns a TV documentary with a similar name (e.g. "A Special Look" shorts)
  const searchType = async (q: string, type: 'movie' | 'tv') => {
    const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(q)}&language=en-US`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const hit = ((await res.json()).results ?? [])[0] ?? null;
    return hit ? { ...hit, actualType: type } : null;
  };

  // Try the AI-classified type first
  const primary = await searchType(title, preferredType);
  if (primary) return primary;

  // Retry stripping trailing season number / year
  const stripped = title.replace(/\s+(season\s+)?\d+$/i, '').trim();
  if (stripped && stripped !== title) {
    const strippedPrimary = await searchType(stripped, preferredType);
    if (strippedPrimary) return strippedPrimary;
  }

  // For movies: never fall back to TV — a failed movie search should return null
  // rather than misfiling the review under a promo/special with a similar name.
  // For TV: falling back to movie is fine (handles genuine TV movies / ambiguous cases).
  if (preferredType === 'movie') return null;

  // Last resort for TV: try movie
  const fallback = await searchType(title, 'movie');
  return fallback;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY!;
    const YT_KEY = process.env.YOUTUBE_API_KEY!;
    const OPENAI_KEY = process.env.OPENAI_API_KEY!;

    const url = new URL(req.url);
    const creatorId = url.searchParams.get('creator');
    const maxPages = parseInt(url.searchParams.get('pages') ?? '4');
    const sinceHours = parseInt(url.searchParams.get('since') ?? '0');
    const cutoffDate = sinceHours > 0
      ? new Date(Date.now() - sinceHours * 60 * 60 * 1000)
      : null;
    if (cutoffDate) {
      console.log(`\n🕐 Cutoff: ${cutoffDate.toISOString()} (last ${sinceHours}h)`);
    }

    const { data: allCreators } = await supabase.from('creators').select('*');
    const allReviewCreators = (allCreators || []).filter(c =>
      c.content_types?.includes('review') || c.content_types?.includes('gaming'),
    );

    const creators = creatorId !== null
      ? allReviewCreators.filter(c => c.id === creatorId)
      : allReviewCreators;

    if (!creators.length) {
      return NextResponse.json({ error: 'No creators found' }, { status: 400 });
    }

    let added = 0;

    for (const creator of creators) {
      const uploadsId = creator.youtube_channel_id.replace(/^UC/, 'UU');
      console.log(`\n📡 ${creator.name}: fetching videos...`);

      const rawVideos = await fetchAllVideos(uploadsId, YT_KEY, maxPages, cutoffDate);

      // Deduplicate by video ID
      const seen = new Set<string>();
      const videos = rawVideos.filter(v => {
        const id = v.snippet.resourceId.videoId;
        return seen.has(id) ? false : (seen.add(id), true);
      });

      const filtered = videos.filter(v => !isBlocklisted(v.snippet.title));
      console.log(`  ${videos.length} videos (${videos.length - filtered.length} blocklisted, ${filtered.length} to process)`);

      let skippedExisting = 0;
      let skippedNotReview = 0;
      let skippedNoTmdb = 0;

      for (const video of filtered) {
        const vId = video.snippet.resourceId.videoId;
        const vTitle = video.snippet.title as string;

        // Already in DB?
        const { data: existing } = await supabase
          .from('reviews').select('id').eq('youtube_video_id', vId).limit(1);
        if (existing?.length) { skippedExisting++; continue; }

        // Ask AI what this video is reviewing
        const classification = await classifyVideo(vTitle, video.snippet.description ?? '', OPENAI_KEY);

        if (!classification.isReview || !classification.contentTitle || !classification.contentType) {
          console.log(`  ✗ not a review: "${vTitle.slice(0, 70)}"`);
          skippedNotReview++;
          continue;
        }

        // ── Game review path ─────────────────────────────────────────────────
        if (classification.contentType === 'game') {
          const { searchGames } = await import('@/lib/igdb');
          const candidates = await searchGames(classification.contentTitle!);
          const igdbGame = candidates[0] ?? null;
          if (!igdbGame) {
            console.log(`  ? no IGDB match for "${classification.contentTitle}"`);
            skippedNoTmdb++;
            continue;
          }
          // Dedup: one review per creator per game
          const { data: dup } = await supabase
            .from('reviews').select('id')
            .eq('creator_id', creator.id)
            .eq('game_id', igdbGame.id)
            .limit(1);
          if (dup?.length) { skippedExisting++; continue; }

          // Upsert game record
          const coverImageId = igdbGame.cover?.image_id ?? null;
          const releaseYear  = igdbGame.first_release_date
            ? new Date(igdbGame.first_release_date * 1000).getFullYear()
            : null;
          const gameName = igdbGame.name ?? classification.contentTitle!;
          await supabase.from('games').upsert({
            id: igdbGame.id,
            title: gameName,
            slug: `${gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${igdbGame.id}`,
            cover_image_id: coverImageId,
          });
          await supabase.from('reviews').insert({
            game_id: igdbGame.id,
            creator_id: creator.id,
            youtube_video_id: vId,
            title: vTitle,
            score: 0,
            recommend: null,
            snippet: pickSnippet(video.snippet.description ?? ''),
            posted_at: video.snippet.publishedAt,
          });
          console.log(`  🎮 GAME: "${vTitle.slice(0, 60)}" → ${gameName}`);
          added++;
          continue;
        }

        // Find it on TMDB — multi-search returns the actual media_type so we
        // aren't locked into what the AI guessed.
        const tmdb = await findOnTmdb(classification.contentTitle, classification.contentType as 'movie' | 'tv', TMDB_KEY);
        if (!tmdb) {
          console.log(`  ? no TMDB match for "${classification.contentTitle}" (${classification.contentType})`);
          skippedNoTmdb++;
          continue;
        }

        // Use TMDB's confirmed type, not the AI's guess
        const actualType = tmdb.actualType;
        const contentName = tmdb.title ?? tmdb.name;

        // Reject known promo/gallery shows that share a title prefix with a real film
        if (actualType === 'tv' && TMDB_SHOW_BLOCKLIST.has(tmdb.id)) {
          console.log(`  ✗ blocklisted show (${tmdb.id}): "${contentName}" — skipping`);
          skippedNoTmdb++;
          continue;
        }

        const reclassified = actualType !== classification.contentType ? ` (reclassified from ${classification.contentType})` : '';
        console.log(`  ✅ ${actualType.toUpperCase()}${reclassified}: "${vTitle.slice(0, 60)}" → ${contentName}`);

        // Block unreleased content — no reviews before the film/show is out.
        const releaseDate = actualType === 'movie' ? tmdb.release_date : tmdb.first_air_date;
        if (!isAvailableForReview(releaseDate)) {
          console.log(`  ✗ not yet released: "${contentName}" (${releaseDate})`);
          continue;
        }

        // Extract season once — used in both dedup and insert for TV shows.
        const season = actualType === 'tv' ? extractSeason(vTitle) : null;

        // Deduplicate by creator + content.
        // Movies: one review per creator per film (recaps/revisits are skipped).
        // TV: one review per creator per show per season — so a creator can have
        //     a Season 1 review and a separate Season 2 review for the same show.
        if (actualType === 'movie') {
          const { data: dup } = await supabase
            .from('reviews').select('id')
            .eq('creator_id', creator.id)
            .eq('movie_id', tmdb.id)
            .limit(1);
          if (dup?.length) { skippedExisting++; continue; }
        } else {
          const dupQuery = supabase
            .from('reviews').select('id')
            .eq('creator_id', creator.id)
            .eq('show_id', tmdb.id);
          // If we can identify the season, dedup at season level;
          // otherwise fall back to show level to avoid duplicates.
          if (season !== null) {
            dupQuery.eq('season_number', season);
          } else {
            dupQuery.is('season_number', null);
          }
          const { data: dup } = await dupQuery.limit(1);
          if (dup?.length) { skippedExisting++; continue; }
        }

        if (actualType === 'movie') {
          // Upsert movie
          const safeTitle = tmdb.title ?? '';
          await supabase.from('movies').upsert({
            id: tmdb.id,
            title: safeTitle,
            backdrop_path: tmdb.backdrop_path,
            poster_path: tmdb.poster_path,
            release_date: tmdb.release_date ?? null,
            slug: `${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${tmdb.id}`,
          });
          await supabase.from('reviews').insert({
            movie_id: tmdb.id,
            creator_id: creator.id,
            youtube_video_id: vId,
            title: vTitle,
            score: 0,
            recommend: null,
            snippet: pickSnippet(video.snippet.description ?? ''),
            posted_at: video.snippet.publishedAt,
          });
        } else {
          // Upsert show
          const safeName = tmdb.name ?? '';
          await supabase.from('shows').upsert({
            id: tmdb.id,
            title: safeName,
            backdrop_path: tmdb.backdrop_path,
            poster_path: tmdb.poster_path,
            first_air_date: tmdb.first_air_date ?? null,
            slug: `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${tmdb.id}`,
          });
          await supabase.from('reviews').insert({
            show_id: tmdb.id,
            season_number: season,
            creator_id: creator.id,
            youtube_video_id: vId,
            title: vTitle,
            score: 0,
            recommend: null,
            snippet: pickSnippet(video.snippet.description ?? ''),
            posted_at: video.snippet.publishedAt,
          });
        }

        added++;
      }

      console.log(`  📊 +${added} added | ${skippedExisting} already in DB | ${skippedNotReview} not reviews | ${skippedNoTmdb} no TMDB match`);
    }

    return NextResponse.json({ success: true, added, sinceHours: sinceHours || null });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
