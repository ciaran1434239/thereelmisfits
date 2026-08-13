import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  analyzeReview,
  extractSeason,
  isAvailableForReview,
  pickSnippet,
  snippetFromTitle,
  titleMatchesContent,
  isBlocklisted,
} from '@/lib/sync-helpers';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const YT_KEY = process.env.YOUTUBE_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY; 

    const { data: allCreators } = await supabase.from('creators').select('*');
    const creators = (allCreators || []).filter(c => c.content_types?.includes('review'));

    const [moviesRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=en-US`, { cache: 'no-store' }),
      fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}&language=en-US`, { cache: 'no-store' }),
    ]);
    const allMovies = (await moviesRes.json()).results.slice(0, 15);
    const allShows = (await tvRes.json()).results.slice(0, 15);

    const topMovies = allMovies.filter((m: any) => isAvailableForReview(m.release_date));
    const topShows = allShows.filter((s: any) => isAvailableForReview(s.first_air_date));

    let newReviewsAdded = 0;
    const skipped: string[] = [];

    for (const creator of creators) {
      console.log(`📡 ${creator.name}...`);

      const uploadsPlaylistId = creator.youtube_channel_id.replace(/^UC/, 'UU');
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YT_KEY}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50`;

      const plRes = await fetch(playlistUrl, { cache: 'no-store' });
      const plData = await plRes.json();

      if (plData.error) {
        if (plData.error.code === 403) throw new Error('YOUTUBE_QUOTA_EXCEEDED');
        continue;
      }

      const rawVideos = plData.items || [];
      
      const uniqueVideos = [];
      const seenVidIds = new Set<string>();
      for (const v of rawVideos) {
        const vid = v.snippet.resourceId.videoId;
        if (!seenVidIds.has(vid)) {
          seenVidIds.add(vid);
          uniqueVideos.push(v);
        }
      }

      const recentVideos = uniqueVideos.filter((v: any) => !isBlocklisted(v.snippet.title));
      const processedVideoIds = new Set<string>();

      // ── Movies ──────────────────────────────────────────────────────────────
      for (const movie of topMovies) {
        await supabase.from('movies').upsert({
          id: movie.id,
          title: movie.title,
          // FIX: Added ID to prevent unique constraint crashes
          slug: `${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${movie.id}`,
          backdrop_path: movie.backdrop_path,
        });

        const matches = recentVideos.filter((v: any) => titleMatchesContent(v.snippet.title, movie.title));

        for (const match of matches) {
          const videoId = match.snippet.resourceId.videoId;
          if (processedVideoIds.has(videoId)) continue;

          if (/season\s+\d+|episode\s+\d+|\bs\d+e\d+\b/i.test(match.snippet.title)) {
            continue; 
          }

          const { data: existing } = await supabase.from('reviews').select('id')
            .eq('movie_id', movie.id).eq('creator_id', creator.id).single();
          if (existing) continue;

          const { data: dupVideo } = await supabase.from('reviews').select('id')
            .eq('youtube_video_id', videoId).single();
          if (dupVideo) {
            processedVideoIds.add(videoId);
            continue;
          }
          
          const aiVerdict = await analyzeReview(match.snippet.title, OPENAI_KEY!, match.snippet.description || '', 'movie', movie.title);
          if (!aiVerdict.isReview) {
            skipped.push(`AI rejected: ${match.snippet.title}`);
            continue;
          }
          
          processedVideoIds.add(videoId);
          console.log(`  ✅ MOVIE: ${match.snippet.title}`);
          
          const snippet = aiVerdict.snippet 
            ?? snippetFromTitle(match.snippet.title, movie.title)
            ?? pickSnippet(match.snippet.description || '');

          await supabase.from('reviews').insert({
            movie_id: movie.id,
            creator_id: creator.id,
            youtube_video_id: videoId,
            title: match.snippet.title,
            snippet,
            score: aiVerdict.score,
            recommend: aiVerdict.recommend,
            posted_at: match.snippet.publishedAt,
          });
          newReviewsAdded++;
        }
      }

      // ── TV Shows ─────────────────────────────────────────────────────────────
      for (const show of topShows) {
        await supabase.from('shows').upsert({
          id: show.id,
          title: show.name,
        
      // FIX: Added ID to prevent unique constraint crashes
          slug: `${show.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${show.id}`,
          backdrop_path: show.backdrop_path,
          poster_path: show.poster_path,
        });

        const matches = recentVideos.filter((v: any) => titleMatchesContent(v.snippet.title, show.name));

        for (const match of matches) {
          const videoId = match.snippet.resourceId.videoId;
          if (processedVideoIds.has(videoId)) continue;

          const season = extractSeason(match.snippet.title);
          // One review per creator per season. Must use .is() for null — .eq('col', null)
          // does not match NULL rows in Postgres; it would let all episode reviews through.
          const dedupQuery = supabase.from('reviews').select('id')
            .eq('show_id', show.id)
            .eq('creator_id', creator.id);
          const { data: existing } = await (season !== null
            ? dedupQuery.eq('season_number', season)
            : dedupQuery.is('season_number', null)
          ).single();
          if (existing) continue;

          const { data: dupVideo } = await supabase.from('reviews').select('id')
            .eq('youtube_video_id', videoId).single();
          if (dupVideo) {
            processedVideoIds.add(videoId);
            continue;
          }
          
          const aiVerdict = await analyzeReview(match.snippet.title, OPENAI_KEY!, match.snippet.description || '', 'tv', show.name);
          if (!aiVerdict.isReview) {
            skipped.push(`AI rejected: ${match.snippet.title}`);
            continue;
          }
          
          processedVideoIds.add(videoId);
          console.log(`  ✅ TV: ${match.snippet.title}`);

          const snippet = aiVerdict.snippet 
            ?? snippetFromTitle(match.snippet.title, show.name)
            ?? pickSnippet(match.snippet.description || '');

          await supabase.from('reviews').insert({
            show_id: show.id,
            season_number: season,
            creator_id: creator.id,
            youtube_video_id: videoId,
            title: match.snippet.title,
            snippet,
            score: aiVerdict.score,
            recommend: aiVerdict.recommend,
            posted_at: match.snippet.publishedAt,
          });
          newReviewsAdded++;
        }
      }
    }

    return NextResponse.json({ success: true, added: newReviewsAdded, skipped: skipped.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}