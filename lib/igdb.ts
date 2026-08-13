// ── IGDB API utility ──────────────────────────────────────────────────────────
//
// Setup:
//   1. Go to https://dev.twitch.tv/console/apps → Create Application
//   2. Add to .env.local:
//        IGDB_CLIENT_ID=your_client_id
//        IGDB_CLIENT_SECRET=your_client_secret
//
// Token lifecycle: Twitch tokens last ~60 days. We cache in module scope
// (survives across requests within a server process) with a 1-hour safety buffer.

let _cache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (_cache && Date.now() < _cache.expiresAt) return _cache.token;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token` +
    `?client_id=${process.env.IGDB_CLIENT_ID}` +
    `&client_secret=${process.env.IGDB_CLIENT_SECRET}` +
    `&grant_type=client_credentials`,
    { method: 'POST', cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`IGDB token fetch failed: ${res.status}`);
  const data = await res.json();
  _cache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 3600) * 1000 };
  return _cache.token;
}

// Send an Apicalypse query to any IGDB endpoint
export async function igdbQuery(endpoint: string, apicalypse: string, revalidate = 86400): Promise<any[]> {
  const [token] = await Promise.all([getToken()]);
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID!,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: apicalypse,
    next: { revalidate },
  });
  if (!res.ok) {
    console.error(`IGDB ${endpoint} error ${res.status}:`, await res.text().catch(() => ''));
    return [];
  }
  return res.json();
}

// ── Image URL helpers ─────────────────────────────────────────────────────────

/** 2:3 box-art — use for poster grids (528×748 px) */
export function coverUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${imageId}.jpg`;
}

/** 16:9 cinematic hero — prefer artworks, fall back to screenshots (1920×1080) */
export function heroUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;
}

/** Thumbnail screenshot (889×500) */
export function screenshotUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${imageId}.jpg`;
}

// ── Named queries ─────────────────────────────────────────────────────────────

/** Full game details by IGDB id */
export async function getGameById(igdbId: number) {
  const results = await igdbQuery('games', `
    fields
      name, summary,
      cover.image_id,
      screenshots.image_id,
      artworks.image_id,
      genres.name,
      platforms.name,
      platforms.id,
      first_release_date,
      involved_companies.company.name,
      involved_companies.developer,
      involved_companies.publisher;
    where id = ${igdbId};
  `);
  if (!results[0]) return null;
  const g = results[0];
  const dev = g.involved_companies?.find((c: any) => c.developer)?.company?.name ?? null;
  const pub = g.involved_companies?.find((c: any) => c.publisher)?.company?.name ?? null;
  // Screenshots are actual gameplay captures (no title text/logos).
  // Artworks are promotional keyart — often have logo overlays, so use as fallback only.
  const heroImageId =
    g.screenshots?.[0]?.image_id ??
    g.artworks?.[0]?.image_id ??
    null;
  return { ...g, dev, pub, heroImageId };
}

/** Search IGDB for a game title — returns top 5 candidates.
 *  Falls back to a broader search if the strict filter yields nothing.
 */
export async function searchGames(title: string): Promise<any[]> {
  const cleanTitle = title.replace(/"/g, '').slice(0, 120);
  const fields = `fields id, name, cover.image_id, first_release_date,
         involved_companies.company.name, involved_companies.developer;`;

  // Primary: main games, remakes, remasters, expansions, standalone expansions
  const primary = await igdbQuery('games', `
    ${fields}
    search "${cleanTitle}";
    where version_parent = null & category = (0,2,4,8,9,10);
    limit 5;
  `, 3600);
  if (primary.length) return primary;

  // Fallback: drop the category/version filter entirely — catches DLCs, packs,
  // and any game IGDB categorises unusually (new releases often lack metadata)
  return igdbQuery('games', `
    ${fields}
    search "${cleanTitle}";
    limit 5;
  `, 3600);
}

// ── Platform constants (used by filter bar + sync) ───────────────────────────
export const IGDB_PLATFORMS: Record<string, number[]> = {
  PC:     [6, 14],     // Windows, Mac
  PS5:    [167],
  PS4:    [48],
  Xbox:   [169, 49],   // Series X/S, One
  Switch: [130],
};

export const IGDB_GENRES: Record<string, number> = {
  RPG:        12,
  Shooter:    5,
  Adventure:  31,
  Strategy:   15,
  Fighting:   4,
  Platform:   8,
  Racing:     10,
  Sports:     14,
  Indie:      32,
};
