import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300;

// ── Step 0: Fetch YouTube description ────────────────────────────────────────

async function fetchYouTubeDescription(videoId: string, ytKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytKey}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const desc = data.items?.[0]?.snippet?.description as string | undefined;
    if (!desc || desc.length < 30) return null;
    console.log(`  [yt] description fetched (${desc.length} chars)`);
    return desc;
  } catch {
    return null;
  }
}

// ── Step 1a: Parse WebVTT into plain text ────────────────────────────────────

function parseWebVTT(vtt: string): string {
  return vtt
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t) return false;
      if (t === 'WEBVTT') return false;
      if (/^\d{2}:\d{2}/.test(t) && t.includes('-->')) return false; // timestamp line
      if (/^\d+$/.test(t)) return false; // cue sequence number
      if (/^[A-Z][A-Z-]+:/.test(t)) return false; // WebVTT header metadata
      return true;
    })
    .map(line =>
      line
        .replace(/<[^>]+>/g, '') // strip inline tags: <c>, <i>, <b>, timestamps
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Step 1b: Fetch transcript via RapidAPI ────────────────────────────────────

async function fetchTranscript(videoId: string, rapidApiKey: string): Promise<string | null> {
  const RAPIDAPI_HOST = 'youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com';

  try {
    console.log(`  [transcript] fetching ${videoId} via RapidAPI...`);
    const res = await fetch(
      `https://${RAPIDAPI_HOST}/download-webvtt/${videoId}?language=en&response_mode=default`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (res.status === 404 || res.status === 204) {
      console.log(`  [transcript] ${res.status} — no transcript available`);
      return null;
    }
    if (!res.ok) {
      console.log(`  [transcript] HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
      return null;
    }

    const body = await res.text();

    if (!body || body.trim().length < 20) {
      console.log(`  [transcript] empty response`);
      return null;
    }

    const raw = parseWebVTT(body);

    if (!raw || raw.length < 50) {
      console.log(`  [transcript] parsed text too short (${raw?.length ?? 0} chars)`);
      return null;
    }

    console.log(`  [transcript] fetched ${raw.length} chars`);
    return raw;
  } catch (e: any) {
    console.log(`  [transcript] error: ${e?.message?.slice(0, 120)}`);
    return null;
  }
}

// ── Step 2: Clean transcript ──────────────────────────────────────────────────

function cleanTranscript(raw: string): string {
  const cleaned = raw
    .replace(/\[.*?\]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Take the LAST 15k chars — reviewers give their verdict at the end
  const capped = cleaned.length > 15000 ? cleaned.slice(-15000) : cleaned;
  console.log(`  [clean] ${raw.length} → ${capped.length} chars (last portion)`);
  return capped;
}

// ── Step 3: Analyse with AI ───────────────────────────────────────────────────

interface AiResult {
  isReview: boolean;
  score: number;
  recommend: boolean | null;
  snippet: string | null;
  reasoning: string;
}

async function analyzeWithAI(
  content: string,
  title: string,
  openaiKey: string,
  sourceType: 'transcript' | 'description',
  attempt = 1,
): Promise<AiResult | null> {
  if (attempt === 1) {
    console.log(`  [ai] analysing ${sourceType} for: "${title.slice(0, 60)}"`);
  }

  const sourceLabel = sourceType === 'transcript' ? 'transcript' : 'video description';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert film/TV review data extractor. Read the ${sourceLabel} and do two things:

STEP 1 — IS THIS A REVIEW?
Set "isReview": true if the YouTuber actually watched the film/show and is giving a personal verdict on its quality.
Set "isReview": false if the content is: franchise/studio commentary, industry news, "why it failed" post-mortems, box office analysis, trailer reactions, or political/cultural commentary that uses the film as a jumping-off point.
The video title is a strong signal — if it says "REVIEW" or "my thoughts" it is almost certainly a review.

STEP 2 — EXTRACT THE VERDICT (only if isReview is true)
"score" — ALWAYS use a 0–10 scale. Convert from whatever scale the reviewer uses:
- 5-point / 5-star scale: MULTIPLY BY 2. "4 out of 5" = 8.0. "3.5 stars" = 7.0. "2/5" = 4.0.
- 4-star scale: multiply by 2.5. "3.5/4" = 8.75.
- 10-point scale: use as-is. "7.5/10" = 7.5.
- 100-point: divide by 10. "85/100" = 8.5.
- Letter grades: A+ = 10, A = 9.5, A- = 9, B+ = 8.5, B = 8, B- = 7.5, C+ = 7, C = 6, C- = 5.5, D = 4, F = 1.
- "I'll pass" / "skip it" / "hard pass" / "not worth it" (as a verdict phrase) = score 4 or lower, recommend: false.
- No numeric score or explicit verdict → score: 0, recommend: null.
After normalizing: Score ≥ 5 → recommend: true. Score < 5 → recommend: false. No clear verdict → recommend: null. Must be consistent.
Lukewarm positives are still positives — only mark recommend: false when the reviewer is actively discouraging people from watching. Examples that are recommend: true: "I liked it but didn't love it", "it was good but not great", "worth a watch", "solid film", "I enjoyed it", "decent film", "3 out of 5".
CRITICAL — handle double negatives correctly. "I don't see how this doesn't end up in my top films" = strongly positive (recommend: true). "I can't imagine not recommending this" = positive. Resolve the full logical meaning before scoring.

"snippet":
- A verbatim quote (1–2 sentences) of their most definitive verdict statement.
- Fix punctuation/capitalisation, strip filler words (um, uh, you know), but keep the core words exactly.
- If isReview is false, set snippet: null.

Return ONLY valid JSON:
{
  "isReview": boolean,
  "score": number,
  "recommend": boolean | null,
  "snippet": string | null,
  "reasoning": string
}`
          },
          {
            role: 'user',
            content: `Video title: "${title}"\n\n${sourceType === 'transcript' ? 'Transcript' : 'Description'}:\n${content}`,
          },
        ],
      }),
    });

    if (res.status === 429) {
      if (attempt >= 3) {
        console.log(`  [ai] rate limited after ${attempt} attempts — skipping`);
        return null;
      }
      const delay = attempt * 20000; // 20s, 40s
      console.log(`  [ai] rate limited (attempt ${attempt}) — waiting ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return analyzeWithAI(content, title, openaiKey, sourceType, attempt + 1);
    }

    if (!res.ok) {
      console.log(`  [ai] error ${res.status}: ${await res.text().then(t => t.slice(0, 100))}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.log(`  [ai] empty response`);
      return null;
    }

    const parsed: AiResult = JSON.parse(text);
    console.log(`  [ai] score=${parsed.score} recommend=${parsed.recommend} snippet=${parsed.snippet ? parsed.snippet.slice(0, 60) + '…' : 'null'}`);
    console.log(`  [ai] reasoning: ${parsed.reasoning}`);
    return parsed;
  } catch (e: any) {
    console.log(`  [ai] exception: ${e?.message?.slice(0, 100)}`);
    return null;
  }
}

// ── Boilerplate snippet filter ────────────────────────────────────────────────
// Rejects snippets that look like channel description filler rather than a verdict.

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

function isBoilerplate(snippet: string): boolean {
  // All-caps with colon = description header (e.g. "WAYSTOSUPPORTTHISCHANNEL:")
  if (/^[A-Z\s:]+:?\s*$/.test(snippet)) return true;
  return BOILERPLATE_RE.some(re => re.test(snippet));
}

// ── Step 4: Consistency check ─────────────────────────────────────────────────
//
// The AI reads the full transcript to set `recommend`, then picks the best
// quote as `snippet`. These can contradict — e.g. overall verdict = negative
// but the chosen snippet says "I recommend you give it a chance."
//
// We detect obvious contradictions with a heuristic, then fire a cheap second
// AI call on just the snippet text to adjudicate. Only runs when contradiction
// is suspected — adds one extra API call in those cases only.

const CLEAR_POSITIVE = [
  /\bi (highly )?recommend\b/i,
  /\bmust.?see\b/i,
  /\bmust.?watch\b/i,
  /\bgo (see|watch) (it|this)\b/i,
  /\bworth (watching|seeing|your time)\b/i,
  /\b(9|10)\s*\/\s*10\b/,
  /\bgive it a chance\b/i,
];

const CLEAR_NEGATIVE = [
  /\b(avoid|skip) (it|this)\b/i,
  /\bdon't (bother|waste)\b/i,
  /\bwaste of (time|money)\b/i,
  /\bnot worth (it|watching|seeing|your time)\b/i,
  /\b[1-3]\s*\/\s*10\b/,
  /\bstay away\b/i,
];

function detectContradiction(snippet: string, recommend: boolean): boolean {
  const signalsPositive = CLEAR_POSITIVE.some(r => r.test(snippet));
  const signalsNegative = CLEAR_NEGATIVE.some(r => r.test(snippet));
  if (signalsPositive && recommend === false) return true;
  if (signalsNegative && recommend === true) return true;
  return false;
}

async function resolveSnippetSentiment(
  snippet: string,
  openaiKey: string,
): Promise<boolean | null> {
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
            content: `Read this film/TV review quote and determine if the reviewer is recommending the film (positive) or not (negative).
Handle double negatives correctly: "I don't see how this doesn't end up in my top films" = positive.
Handle qualified praise: "Give it a chance" or "I recommend you give it a chance" = positive.
Return ONLY: {"positive": true} or {"positive": false}`,
          },
          { role: 'user', content: snippet },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    return typeof parsed.positive === 'boolean' ? parsed.positive : null;
  } catch {
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY!;
  const YT_KEY = process.env.YOUTUBE_API_KEY!;
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
  const url = new URL(req.url);

  // ?limit=N        — how many reviews to process (default 50)
  // ?force          — re-process reviews that already have a score
  // ?creator_id=X   — restrict to a single creator
  const limit = parseInt(url.searchParams.get('limit') ?? '200');
  const force = url.searchParams.has('force');
  const creatorId = url.searchParams.get('creator_id');

  // Fetch reviews that need enrichment — most recent first, never touch manually overridden rows
  let query = supabase
    .from('reviews')
    .select('id, youtube_video_id, title, snippet, score, creators(name)')
    .not('youtube_video_id', 'is', null)
    .eq('is_manual_override', false)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  if (!force) {
    // Only process reviews with no score or no snippet
    query = query.or('score.eq.0,score.is.null,snippet.is.null');
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.log(`[backfill] query error: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!reviews?.length) {
    return NextResponse.json({ success: true, processed: 0, message: 'Nothing to enrich' });
  }

  console.log(`[backfill] processing ${reviews.length} reviews (force=${force})`);

  let enriched = 0;
  let removed = 0;
  let noContent = 0;
  let failed = 0;

  for (const review of reviews) {
    console.log(`\n[backfill] ${enriched + noContent + failed + 1}/${reviews.length} — ${review.title?.slice(0, 70)}`);

    // Step 1: fetch transcript; fall back to YouTube description
    const rawTranscript = await fetchTranscript(review.youtube_video_id, RAPIDAPI_KEY);
    let content: string;
    let sourceType: 'transcript' | 'description';

    if (rawTranscript) {
      content = cleanTranscript(rawTranscript);
      sourceType = 'transcript';
    } else {
      const desc = await fetchYouTubeDescription(review.youtube_video_id, YT_KEY);
      if (!desc) {
        noContent++;
        continue;
      }
      content = desc.slice(0, 3000);
      sourceType = 'description';
      console.log(`  [backfill] no transcript — using description (${content.length} chars)`);
    }

    // Step 2: analyse with AI
    const result = await analyzeWithAI(content, review.title ?? '', OPENAI_KEY, sourceType);

    if (!result) {
      failed++;
      continue;
    }

    // ── Not a review — delete the row ────────────────────────────────────────
    if (!result.isReview) {
      console.log(`  [backfill] ❌ not a review — deleting`);
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id);
      if (deleteError) {
        console.log(`  [backfill] delete failed: ${deleteError.message}`);
        failed++;
      } else {
        removed++;
      }
      continue;
    }

    // ── Genuine review — update with verdict ──────────────────────────────────
    const rawSnippet = typeof result.snippet === 'string' ? result.snippet.trim() : null;
    const snippet = rawSnippet && rawSnippet.length > 20 && !isBoilerplate(rawSnippet)
      ? rawSnippet.slice(0, 180)
      : null;

    const score = result.score ?? 0;
    // null = no signal found — excluded from % calculation (never guess)
    let recommend: boolean | null = typeof result.recommend === 'boolean' ? result.recommend
      : score > 0 ? score >= 5
      : null;

    // ── Consistency check: does the snippet contradict the verdict? ────────────
    if (snippet && typeof recommend === 'boolean' && detectContradiction(snippet, recommend)) {
      console.log(`  [consistency] ⚠️  snippet contradicts recommend=${recommend} — resolving…`);
      const snippetSentiment = await resolveSnippetSentiment(snippet, OPENAI_KEY);
      if (snippetSentiment !== null && snippetSentiment !== recommend) {
        console.log(`  [consistency] flipping recommend: ${recommend} → ${snippetSentiment}`);
        recommend = snippetSentiment;
      } else {
        console.log(`  [consistency] snippet sentiment confirmed or inconclusive — keeping recommend=${recommend}`);
      }
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update({ score, snippet, recommend })
      .eq('id', review.id);

    if (updateError) {
      console.log(`  [backfill] DB update failed: ${updateError.message}`);
      failed++;
    } else {
      enriched++;
    }
  }

  console.log(`\n[backfill] done — enriched=${enriched} removed=${removed} noContent=${noContent} failed=${failed}`);

  return NextResponse.json({
    success: true,
    processed: reviews.length,
    enriched,
    removed,
    noContent,
    failed,
    tip: reviews.length === limit
      ? `There may be more — run again to continue`
      : 'All done',
  });
}