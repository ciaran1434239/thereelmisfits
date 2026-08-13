// ── Blocklist ────────────────────────────────────────────────────────────────

export function isBlocklisted(title: string): boolean {
  const BLOCKLIST = [
    'LIVE', 'FNT', 'FRIDAY NIGHT TIGHTS', 'OPEN BAR',
    'WEEKLY RECAP', 'NEWS', 'SHORTS',
  ];
  return BLOCKLIST.some(phrase => title.toUpperCase().includes(phrase));
}

// ── Title matching ────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','in','on','of','at','to','and','or','but','for','is','it','its',
  'this','that','with','from','my','me','we','our','as','by','be','are','was','were',
]);

// Subtitle words reviewers commonly drop from long official titles.
const SUBTITLE_DROPS = new Set([
  'part','one','two','three','four','five','chapter','volume','vol',
  'reckoning','awakens','rises','strikes','returns','reloaded',
  'revolutions','resurrection','legacy',
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(title: string): string[] {
  return normalize(title)
    .split(' ')
    .filter(w => (w.length >= 3 || /^\d+$/.test(w)) && !STOP_WORDS.has(w));
}

/**
 * All significant tokens from the content title must appear in the video title.
 *
 * Intentionally permissive — it only answers "could this video be about this content?",
 * not "is this a review?". The AI classifies intent; this just prevents mismatches.
 *
 * Single-token titles (e.g. "Her", "It", "Us") are always rejected as too ambiguous.
 * Also tries a "core-only" match after stripping common subtitle words.
 */
export function titleMatchesContent(videoTitle: string, contentTitle: string): boolean {
  const tokens = tokenize(contentTitle);
  if (tokens.length === 0) return false;
  // Single-token titles are too ambiguous — "it" matches everything
  if (tokens.length === 1) return false;

  const videoNorm = normalize(videoTitle);

  // Full token match — every significant word from the content title must appear
  if (tokens.every(t => videoNorm.includes(t))) return true;

  // Core match — drop subtitle filler words (e.g. "Part Two", "Awakens"), still need ≥2
  const coreTokens = tokens.filter(t => !SUBTITLE_DROPS.has(t));
  if (coreTokens.length < 2) return false;
  return coreTokens.every(t => videoNorm.includes(t));
}

// ── AI review analysis ────────────────────────────────────────────────────────

export async function analyzeReview(
  title: string,
  openaiKey: string,
  description: string,
  contentType: 'movie' | 'tv',
  contentTitle: string,
) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a video categorizer for a film/TV review aggregator.
Video: "${title}"
Target: "${contentTitle}" (${contentType})

The key question: is this video ABOUT THE ${contentType.toUpperCase()} ITSELF (its story, quality, performances, whether it is worth watching) — or is it about something AROUND it?

Mark "isReview": true ONLY when the YouTuber clearly watched "${contentTitle}" and is giving a verdict on it — recommending or not recommending it, rating it, discussing whether it is good or bad.
- Explicit review titles: "[Title] Review", "[Title] — My Verdict", "[Title] Is Brilliant/Terrible"
- Negative reviews are fine: "[Title] Is The Worst Film of the Year", "[Title] Completely Disappointed Me"

Mark "isReview": false for everything else — including:
- Post-mortem / analysis / "why" videos: "Why [Title] Failed", "Why [Title] Flopped", "How [Title] Went Wrong", "What Went Wrong With [Title]" — these discuss the film as a case study, not as a review
- Franchise or studio health commentary: "Is Star Wars Dead?", "Disney Destroyed Marvel"
- Studio or executive news: "Kathleen Kennedy Quits", "New Director Hired"
- Box office / commercial results: "Flopped at the Box Office", "Lost $200M", "Got Cancelled"
- Trailer or teaser reactions
- Podcast episodes with episode numbers ("#261 —")
- Videos that mention "${contentTitle}" but are really about a broader topic

Score/recommend: only set these if the description contains an explicit verdict or numeric score. Otherwise use "score": 0, "recommend": null — the transcript backfill handles the rest.
If a score IS present, ALWAYS normalize to a 0–10 scale before deciding recommend: "4 out of 5" = 8.0 (×2), "3.5 stars" = 7.0, "8/10" = 8.0. Score ≥ 6 → recommend: true. Score < 6 → recommend: false.
CRITICAL — handle double negatives correctly: "I don't see how this doesn't end up in my top films" = positive. Resolve the full logical meaning before scoring.

Return ONLY valid JSON: {"isReview": boolean, "score": number, "recommend": boolean | null, "snippet": string | null}`,
          },
          {
            role: 'user',
            content: `Description snippet: "${description.slice(0, 1200)}"`,
          },
        ],
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { isReview: true, score: 0, recommend: null, snippet: null };
    return JSON.parse(content);
  } catch (e) {
    console.error('AI Analysis Error:', e);
    // Let it through so backfill can try later
    return { isReview: true, score: 0, recommend: null, snippet: null };
  }
}

// ── Season extraction ─────────────────────────────────────────────────────────

export function extractSeason(title: string): number | null {
  const match = title.match(/Season\s+(\d+)/i) || title.match(/\bS(\d{1,2})\b/i);
  if (match?.[1]) return parseInt(match[1], 10);
  return null;
}

// ── Release date gate ─────────────────────────────────────────────────────────

/**
 * Returns true if the content is released or releasing within 14 days.
 * This allows reviews for imminent releases (e.g. embargo lifts before opening day)
 * while still blocking reviews for films months away like The Odyssey.
 * Unknown date → true: we'd rather let an edge case through than silently miss reviews.
 */
export function isAvailableForReview(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const releaseDate = new Date(dateStr);
  const windowEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // now + 14 days
  return releaseDate <= windowEnd;
}

// ── Snippet from video title ──────────────────────────────────────────────────

const REVIEW_NOISE_RE = /\b(spoiler\s*review|spoiler\s*talk|movie\s*review|tv\s*review|video\s*review|honest\s*review|quick\s*review|finale\s*review|series\s*review|season\s*review|review|reaction|verdict|breakdown|recap|analysis|thoughts|opinion|ranked|ranking)\b/gi;

/**
 * Strips the content title and review keywords from the video title to surface
 * any remaining opinion fragment (e.g. "Is Phenomenal" from "Avatar 2 Is Phenomenal - Review").
 * Returns null if nothing meaningful remains.
 */
export function snippetFromTitle(videoTitle: string, contentTitle: string): string | null {
  let s = videoTitle.trim();

  // Drop bracketed content like (SPOILERS) [4K]
  s = s.replace(/[\(\[][^)\]]+[\)\]]/g, ' ');

  // Strip the content title tokens
  for (const tok of tokenize(contentTitle)) {
    s = s.replace(new RegExp(`\\b${tok}\\b`, 'gi'), ' ');
  }

  // Strip review noise words
  s = s.replace(REVIEW_NOISE_RE, ' ');

  // Strip separators and stray punctuation
  s = s.replace(/[\-|:—\/\\]+/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^[\s\-:|—!?,.\d]+/, '').replace(/[\s\-:|—!?,.\d]+$/, '').trim();

  if (s.length < 8) return null;

  // Need at least 2 real words
  const words = (s.match(/[A-Za-z]{2,}/g) ?? []);
  if (words.length < 2) return null;

  if (s.length > 140) s = s.slice(0, 140).replace(/\s+\S*$/, '') + '…';

  // Sentence-case if it's ALL CAPS
  const letters = s.match(/[A-Za-z]/g) ?? [];
  const uppers = s.match(/[A-Z]/g) ?? [];
  if (letters.length > 0 && uppers.length / letters.length > 0.6 && s.length > 12) {
    s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  return s;
}

// ── Snippet from description ──────────────────────────────────────────────────

const OPINION_WORDS = [
  'love', 'loved', 'hate', 'hated', 'amazing', 'brilliant', 'masterpiece', 'terrible',
  'awful', 'boring', 'disappointing', 'incredible', 'stunning', 'perfect', 'excellent',
  'wonderful', 'superb', 'worst', 'best', 'fantastic', 'outstanding', 'mediocre',
  'overrated', 'underrated', 'emotional', 'powerful', 'moving', 'hilarious', 'terrifying',
  'gripping', 'breathtaking', 'forgettable', 'unforgettable', 'genuinely', 'absolutely',
  'remarkable', 'must.see', 'must.watch',
];

const PROMO_PHRASES = [
  'subscribe', 'follow me', 'patreon', 'discord', 'instagram', 'twitter',
  'in this video', 'in this review', "here's my review", 'watch my', 'check out',
  'click here', 'link below', 'link in bio', 'use code', 'merch', 'tickets available',
  'now in theatres', 'now in theaters', 'sponsored', 'affiliate', 'my channel',
  'my podcast', 'on spotify', 'available on', 'streaming on', 'membership',
  'early access', 'join our', 'get access', 'sign up', 'free trial', 'buy tickets',
  '% off', 'free shipping', 'coupon', 'promo code', 'tells the story of', 'follows a ',
  'follows the', 'is set in', 'directed by', 'written by', 'starring',
];

/**
 * Finds the most opinion-rich sentence in a description, avoiding promo lines.
 * Returns null if nothing opinionated is found (backfill transcript will handle it).
 */
export function pickSnippet(rawDesc: string): string | null {
  const lines = rawDesc.split('\n').map(l => l.trim()).filter(l => {
    if (l.length < 40) return false;
    if (/^[-─═\s*•]+$/.test(l)) return false;
    if (l.startsWith('http') || l.startsWith('#') || l.startsWith('▶') || l.startsWith('►')) return false;
    if (/https?:\/\/\S+/.test(l)) return false;
    const lower = l.toLowerCase();
    if (PROMO_PHRASES.some(p => lower.includes(p))) return false;
    return true;
  });

  const scored = lines.map(l => {
    const lower = l.toLowerCase();
    let score = 0;
    OPINION_WORDS.forEach(w => { if (lower.includes(w)) score += 3; });
    if (/^(i |it |this |the film|the movie|the show|the series)/i.test(l)) score += 2;
    if (l.length < 120) score += 2;
    if (l.length < 80) score += 1;
    return { line: l, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) return null;

  const raw = best.line;
  if (raw.length <= 250) return raw;
  const cut = raw.substring(0, 250);
  const lastSentence = cut.search(/[.!?][^.!?]*$/);
  if (lastSentence > 80) return cut.substring(0, lastSentence + 1);
  return cut.replace(/\s+\S*$/, '') + '…';
}
