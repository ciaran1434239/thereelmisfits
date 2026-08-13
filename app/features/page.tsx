export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { PenTool, Clock, Sparkles } from 'lucide-react';
import { sanityClient, urlFor } from '@/lib/sanity';
import { WeSaidClient } from '@/components/we-said/we-said-client';

async function getArticles() {
  return sanityClient.fetch(`
    *[_type == "article"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      category,
      excerpt,
      coverImage,
      worthYourTime,
      featured,
      publishedAt,
    }
  `);
}

export default async function WeSaidPage() {
  const articles = await getArticles();

  const featured = articles.find((a: any) => a.featured) ?? articles[0] ?? null;
  const rest = articles.filter((a: any) => a._id !== featured?._id);

  return (
    <div className="bg-[#fcfcfc] min-h-screen flex flex-col pb-24">
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-12 flex-1 flex flex-col">

        <header className="mb-12 border-b-4 border-gray-900 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <PenTool className="text-[#E21D1D]" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">In-House Editorial</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-tighter text-gray-900 leading-none">
              WE <span className="text-[#E21D1D]">SAID</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 max-w-sm leading-relaxed md:text-right">
              Stories about the stories we watch
            </p>
          </div>
        </header>

        {articles.length === 0 ? (
          <div className="py-24 border-2 border-dashed border-gray-200 rounded-3xl text-center">
            <PenTool className="mx-auto text-gray-300 mb-4" size={32} />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">No articles yet</p>
            <p className="text-xs text-gray-400">
              Go to <a href="/studio" className="text-[#E21D1D] underline">/studio</a> to write your first article.
            </p>
          </div>
        ) : (
          <>
            {/* Hero / Featured */}
            {featured && (
              <Link href={`/we-said/${featured.slug.current}`} className="group flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16">
                <div className="w-full lg:w-[65%]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                    {featured.coverImage ? (
                      <img
                        src={urlFor(featured.coverImage).width(900).url()}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-[#E21D1D] shadow-lg">
                      Featured
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-[35%] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <span className="text-[#E21D1D]">{featured.category}</span>
                    {featured.publishedAt && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-[1.1] mb-6 group-hover:text-[#E21D1D] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {featured.excerpt}
                  </p>
                </div>
              </Link>
            )}

            {/* Filter + grid (client component handles search/category) */}
            <WeSaidClient articles={rest} />
          </>
        )}
      </div>
    </div>
  );
}
