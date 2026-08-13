'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Clock, Search } from 'lucide-react';
import { urlFor } from '@/lib/sanity';

interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  category: string;
  excerpt: string;
  coverImage?: any;
  worthYourTime?: boolean;
  publishedAt?: string;
}

const CATEGORIES = ['All', 'Analysis', 'Reviews', 'Box Office', 'Explained', 'Coming Soon', 'News', 'Hidden Gems'];

export function WeSaidClient({ articles }: { articles: Article[] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchCat = activeCategory === 'All' || a.category === activeCategory;
      const matchQ = query === '' || a.title.toLowerCase().includes(query.toLowerCase()) || a.excerpt?.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [articles, activeCategory, query]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 border-t border-gray-200 pt-8">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">No articles match your filter.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((article) => (
            <Link key={article._id} href={`/we-said/${article.slug.current}`} className="group flex flex-col">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                {article.coverImage ? (
                  <img
                    src={urlFor(article.coverImage).width(600).url()}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                {article.worthYourTime && (
                  <div className="absolute top-3 left-3 bg-[#E21D1D] text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                    Worth Your Time
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span className="text-[#E21D1D]">{article.category}</span>
                {article.publishedAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-serif font-bold text-gray-900 text-lg leading-snug group-hover:text-white transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
