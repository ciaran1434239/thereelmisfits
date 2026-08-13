import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { supabase } from '@/lib/supabase';

export async function FeaturedListsRow() {
  const { data: lists } = await supabase
    .from('charts')
    .select('id, title, subtitle, image_url')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(4);

  if (!lists?.length) return null;

  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-4">
        
        <div>
          <h2 className="text-[22px] font-black uppercase tracking-[-0.02em] leading-none text-white">Curated Lists</h2>
          <p className="text-[12px] font-semibold text-[#999999] mt-0.5">Hand-picked by the editors</p>
        </div>
      </div>

      <div className={`grid gap-4 ${
        lists.length === 1 ? 'grid-cols-1' :
        lists.length === 2 ? 'grid-cols-2' :
        lists.length === 3 ? 'grid-cols-3' :
        'grid-cols-2 sm:grid-cols-4'
      }`}>
        {lists.map((list: any) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="group relative overflow-hidden rounded-xl aspect-[16/9] bg-[#111] block"
          >
            {/* Cover image */}
            {list.image_url && (
              <img
                src={list.image_url}
                alt={list.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
              />
            )}

            {/* Gradient overlay — heavier at bottom for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Title block — sits at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white text-[15px] font-black uppercase tracking-tight leading-snug line-clamp-2 drop-shadow-lg">
                {list.title}
              </p>
              {list.subtitle && (
                <p className="text-white/60 text-[11px] font-semibold mt-0.5 line-clamp-1">
                  {list.subtitle}
                </p>
              )}
              <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                View List →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
