"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterReviewCard } from '@/components/domain/poster-review-card';

// Accepting the data passed down from the Server Component
export function RecentReviewsCarousel({ items, fallbacks }: { items: any[], fallbacks: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // Scrolls roughly 2-3 cards at a time depending on screen size
      const scrollAmount = direction === "left" ? -400 : 400; 
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative mt-4 -mx-4 sm:-mx-6 group">
      
      {/* LEFT SCROLL BUTTON (Rotten Tomatoes Style) */}
      <button
        onClick={() => scroll("left")}
        // Adjusted top position to stay perfectly centered on the smaller images
        className="absolute left-6 top-[115px] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 text-gray-900 hidden sm:flex cursor-pointer"
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>

      {/* THE CAROUSEL */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-6 px-4 sm:px-6 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        style={{ scrollPaddingLeft: '1.5rem' }}
      >
        {items.map(({ review, reviewer, title }, index) => {
          const imageInjectedTitle = {
            ...title,
            posterUrl: title.posterUrl || fallbacks[index % fallbacks.length]
          };

          return (
            <div
              key={review.id}
              // Shrunk the image container down for a tighter, premium look
              className="snap-start shrink-0 w-[130px] sm:w-[145px] md:w-[160px]"
            >
              <PosterReviewCard
                review={review}
                reviewer={reviewer}
                title={imageInjectedTitle}
              />
            </div>
          );
        })}
      </div>

      {/* RIGHT SCROLL BUTTON */}
      <button
        onClick={() => scroll("right")}
        // Adjusted top position to stay perfectly centered
        className="absolute right-6 top-[115px] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 text-gray-900 hidden sm:flex cursor-pointer"
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>

      {/* White fade overlay to hint at more content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10"
      />
    </div>
  );
}