export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AvatarImg } from '@/components/ui/avatar-img';

export default async function ChannelPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('handle', handle)
    .single();

  if (!creator) notFound();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, movies(id, title, backdrop_path), shows(id, title, backdrop_path)')
    .eq('creator_id', creator.id)
    .order('posted_at', { ascending: false });

  const totalReviews = reviews?.length ?? 0;
  const scoredReviews = reviews?.filter(r => r.recommend !== null) ?? [];
  const recCount = scoredReviews.filter(r => r.recommend === true).length;
  const recPct = scoredReviews.length === 0 ? 0 : Math.round((recCount / scoredReviews.length) * 100);

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div
        className="h-36 mx-4 sm:mx-6 mt-4 rounded-2xl"
        style={{ background: `linear-gradient(135deg, #E21D1D 0%, #900 100%)` }}
      />

      <div className="mx-4 sm:mx-6 py-6 flex flex-col sm:flex-row sm:items-center gap-6 border-b border-[#2A2A2A] mb-8">
        <AvatarImg
          src={creator.avatar_url}
          name={creator.name}
          className="w-20 h-20 border-4 border-[#0F0F0F] shadow-lg -mt-10"
        />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-[950] tracking-tighter text-white uppercase italic">
            {creator.name}
          </h1>
          <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest text-[#777777] mt-2">
            {creator.handle && <span>@{creator.handle}</span>}
            <span>·</span>
            <span>{totalReviews} Reviews</span>
            {scoredReviews.length > 0 && (
              <><span>·</span><span>{recPct}% Recommend</span></>
            )}
          </div>
        </div>
        {creator.youtube_channel_id && (
          <a
            href={`https://youtube.com/channel/${creator.youtube_channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#181818] text-white px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            YouTube <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Reviews grid */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-[#E21D1D]" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
            All Reviews
          </h2>
        </div>

        {totalReviews === 0 ? (
          <p className="text-[#777777] font-bold uppercase tracking-widest text-sm py-24 text-center">
            No reviews synced yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews!.map((review) => {
              // Support both movies and TV shows
              const content = review.movies ?? review.shows;
              if (!content) return null;
              const isShow = !review.movies && !!review.shows;
              const href = isShow ? `/show/${content.id}` : `/movie/${content.id}`;

              return (
                <div
                  key={review.id}
                  className="group bg-[#181818] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Poster/backdrop — clicking navigates to the title page */}
                  <Link href={href as any} className="block">
                    {content.backdrop_path ? (
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={`https://image.tmdb.org/t/p/w500${content.backdrop_path}`}
                          alt={content.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {review.recommend !== null && (
                          <div className="absolute top-2 right-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow ${
                              review.recommend ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                              {review.recommend ? 'Rec' : 'Pass'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-[#1E1E1E] flex items-center justify-center">
                        <span className="text-[#444444] text-xs font-bold uppercase tracking-widest">No image</span>
                      </div>
                    )}
                    <div className="px-4 pt-4 pb-2">
                      <h3 className="font-[900] uppercase tracking-tight text-white group-hover:text-white transition-colors leading-snug">
                        {content.title}
                      </h3>
                      {isShow && review.season_number && (
                        <p className="text-[10px] font-bold text-[#777777] uppercase tracking-widest mt-0.5">
                          Season {review.season_number}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Bottom row — YouTube link is a sibling of Link, never nested inside it */}
                  <div className="px-4 pb-4 flex items-center justify-end">
                    <a
                      href={`https://youtube.com/watch?v=${review.youtube_video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#777777] hover:text-white transition-colors"
                    >
                      Watch on YouTube <ArrowUpRight size={10} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
