"use client";

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { badgeClasses, BADGE_SIZE, UNSCORED_BADGE } from '@/lib/utils/score-tier';
import { AvatarImg } from '@/components/ui/avatar-img';
import { SectionHeading } from '@/components/ui/section-heading';

function formatTimeAgo(dateString: string) {
  if (!dateString || dateString === 'JUST NOW') return 'JUST NOW';
  const date = new Date(dateString);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;
  if (secondsPast < 60) return 'JUST NOW';
  if (secondsPast < 3600) return Math.floor(secondsPast / 60) + 'M AGO';
  if (secondsPast <= 86400) return Math.floor(secondsPast / 3600) + 'H AGO';
  return Math.floor(secondsPast / 86400) + 'D AGO';
}

export function RecentReviewsRow({
  reviews,
  type = 'movies',
  title,
  subtitle,
}: {
  reviews: any[];
  type?: 'movies' | 'tv' | 'all';
  title?: string;
  subtitle?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (!reviews || reviews.length === 0) return null;

  const groupedMap = new Map();

  reviews.forEach((review) => {
    // 🔴 FIX: Explicitly check IDs to avoid the Supabase Array Trap!
    const isMovie = !!review.movie_id;

    // Filter by type
    if (type === 'movies' && !isMovie) return;
    if (type === 'tv' && isMovie) return;

    let rawContent = isMovie ? review.movies : review.shows;
    
    // Safely unwrap if Supabase accidentally hands us an array
    const content = Array.isArray(rawContent) ? rawContent[0] : rawContent;
    
    if (!content?.id) return;

    const key = isMovie ? `movie-${content.id}` : `show-${content.id}`;
    const href = isMovie ? `/movie/${content.id}` : `/show/${content.id}`;
    
    // Fallback just in case DB uses 'name' instead of 'title' for shows
    const displayTitle = content.title || content.name || 'Unknown Title';

    if (!groupedMap.has(key)) {
      groupedMap.set(key, { 
        content: { ...content, title: displayTitle }, 
        href, 
        reviews: [], 
        latestDate: review.posted_at 
      });
    }
    const group = groupedMap.get(key);
    group.reviews.push(review);
    if (new Date(review.posted_at) > new Date(group.latestDate)) {
      group.latestDate = review.posted_at;
    }
  });

  // Secondary dedup: merge groups with the same (or prefix-matching) normalised title.
  // Handles cases like "Star Wars: The Mandalorian and Grogu" vs
  // "Star Wars: The Mandalorian and Grogu | A Special Look" which share a long common prefix.
  const titleMap = new Map<string, typeof groupedMap extends Map<any, infer V> ? V : never>();
  for (const group of groupedMap.values()) {
    const normTitle = group.content.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Look for an existing key that is a prefix of this title, or vice-versa (min 10 chars overlap)
    let matchKey: string | undefined;
    for (const existingKey of titleMap.keys()) {
      const minLen = Math.min(normTitle.length, existingKey.length);
      if (minLen >= 10 && (normTitle.startsWith(existingKey) || existingKey.startsWith(normTitle))) {
        matchKey = existingKey;
        break;
      }
    }

    if (matchKey) {
      const existing = titleMap.get(matchKey)!;
      existing.reviews.push(...group.reviews);
      if (new Date(group.latestDate) > new Date(existing.latestDate)) {
        existing.latestDate = group.latestDate;
      }
    } else {
      titleMap.set(normTitle, { ...group, reviews: [...group.reviews] });
    }
  }

  const movieGroups = Array.from(titleMap.values())
    .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const check = () => {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    };
    check();
    container.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      container.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [movieGroups]);

  function scroll(dir: 'left' | 'right') {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cardWidth = container.querySelector('div')?.offsetWidth ?? 320;
    container.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <section>
      <SectionHeading label={subtitle ?? 'Who said what this week'} title={title ?? 'Latest Reviews'} />

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute left-0 top-[calc(50%-44px)] -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-[#181818] shadow-lg border border-[#2A2A2A] flex items-center justify-center text-[#D4D4D4] hover:bg-[#222222] transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute right-0 top-[calc(50%-44px)] translate-x-1/2 z-20 w-10 h-10 rounded-full bg-[#181818] shadow-lg border border-[#2A2A2A] flex items-center justify-center text-[#D4D4D4] hover:bg-[#222222] transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory"
      >
        {movieGroups.map((group) => {
          const { content, href, reviews, latestDate } = group;
          const scored = reviews.filter((r: any) => r.recommend !== null);
          const recCount = scored.filter((r: any) => r.recommend).length;
          const pct = scored.length < 4 ? null : Math.round((recCount / scored.length) * 100);
          const badgeColor = pct !== null ? badgeClasses(pct) : null;
          const avatarReviews = reviews.slice(0, 3);
          const extraCount = reviews.length - avatarReviews.length;

          return (
            <div key={href} className="group flex-none w-[42%] md:w-[22%] lg:w-[15%] snap-start">
              <Link href={href} className="block relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)] hover:-translate-y-1.5 transition-all duration-300">

                {content.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${content.poster_path}`}
                    alt={content.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
                    <span className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-widest text-center px-2 line-clamp-3">
                      {content.title}
                    </span>
                  </div>
                )}

                {/* Score badge — top right */}
                {badgeColor && (
                  <div className={`absolute top-2 right-2 z-10 ${BADGE_SIZE} ${badgeColor}`}>
                    {pct}%
                  </div>
                )}

                {/* Bottom strip — critic avatars left, time right */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-6 pb-2 px-2 flex items-end justify-between z-10">
                  {/* Critic avatar cluster */}
                  <div className="flex items-center gap-1">
                    <div className={`flex ${avatarReviews.length > 1 ? '-space-x-2' : ''}`}>
                      {avatarReviews.map((rev: any) => {
                        const creator = Array.isArray(rev.creators) ? rev.creators[0] : rev.creators;
                        return (
                          <div key={rev.id} className="w-[24px] h-[24px] rounded-full border border-white/30 overflow-hidden bg-white/10 shrink-0">
                            <AvatarImg src={creator?.avatar_url} name={creator?.name || '?'} className="h-full w-full" />
                          </div>
                        );
                      })}
                    </div>
                    {(reviews.length > 1 || extraCount > 0) && (
                      <span className="text-[9px] font-bold text-white/60 ml-1">
                        {extraCount > 0 ? `+${extraCount}` : reviews.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wide">
                    {formatTimeAgo(latestDate)}
                  </span>
                </div>
              </Link>

              <h3 className="text-[13px] font-[700] text-ink leading-snug line-clamp-2 mt-2 mb-0.5">
                {content.title}
              </h3>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}