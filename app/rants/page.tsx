export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { RantsClient, type RantVideo } from '@/components/rants/rants-client';

export default async function RantsPage() {
  const { data: videos } = await supabase
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, published_at, type, creators(name)')
    .in('type', ['rant', 'rave'])
    .order('published_at', { ascending: false });

  return <RantsClient videos={(videos || []) as unknown as RantVideo[]} />;
}
