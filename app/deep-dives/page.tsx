export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { DeepDivesClient, type CategoryRow, type VideoItem } from '@/components/deep-dives/deep-dives-client';

const CATEGORY_CONFIG: Record<string, { title: string; slug: string; order: number }> = {
  director:       { title: 'Director Retrospectives',      slug: 'directors',          order: 0 },
  actor:          { title: 'Actors: Legends & Hellraisers', slug: 'actors',             order: 1 },
  making_of:      { title: 'The Making Of',                slug: 'making-of',          order: 2 },
  screenplay:     { title: 'Screenplays & Storytelling',   slug: 'screenplays',        order: 3 },
  cinematography: { title: 'Camera & Editing',             slug: 'camera-and-editing', order: 4 },
};

export default async function DeepDivesPage() {
  const { data: videos } = await supabase
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, published_at, deep_dive_category, creators(name)')
    .eq('type', 'deep_dive')
    .order('published_at', { ascending: false });

  const allVideos = (videos || []) as unknown as VideoItem[];

  // Group by category
  const grouped = new Map<string, VideoItem[]>();
  for (const cat of Object.keys(CATEGORY_CONFIG)) grouped.set(cat, []);
  for (const v of allVideos) {
    if (v.deep_dive_category && grouped.has(v.deep_dive_category)) {
      grouped.get(v.deep_dive_category)!.push(v);
    }
  }

  const rows: CategoryRow[] = Object.entries(CATEGORY_CONFIG)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([cat, cfg]) => ({
      category: cat,
      slug: cfg.slug,
      title: cfg.title,
      videos: (grouped.get(cat) || []).slice(0, 10),
    }));

  const spotlight = allVideos[0] ?? null;

  return <DeepDivesClient rows={rows} spotlight={spotlight} />;
}
