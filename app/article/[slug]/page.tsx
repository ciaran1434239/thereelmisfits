'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Share2, Bookmark, Twitter, Facebook, Link2 } from 'lucide-react';

// In a real app, you'd fetch this based on the slug
const ARTICLE = {
  title: 'Mid-Week Pulse: Is the Summer Slump Real?',
  category: 'Box Office',
  author: 'The Editors',
  date: 'May 6, 2026',
  readTime: '6 MIN READ',
  image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1600',
  content: `
    <p>Early numbers for May are coming in softer than expected. We look at whether the recent underperformances of major action tentpoles are a temporary fluke or a terrifying new trend for studios.</p>
    
    <p>The writing has been on the wall for months, but nobody in Hollywood wanted to read it. When a $200 million budget guarantees absolutely nothing, the foundational math of the blockbuster era starts to crack.</p>
    
    <h3>The Death of the Guaranteed Hit</h3>
    <p>Look at the tracking. Look at the presales. It's not that people aren't going to the movies—it's that they are entirely rejecting the concept of the "default" movie. There is no more casual viewing. Every trip to the theater is now treated as an event, which means if your movie doesn't feel like an event, it's dead on arrival.</p>
    
    <blockquote>
      "Audiences haven't lost their attention spans, they've just raised their standards. They won't pay $20 to see a movie they know will be streaming in 45 days."
    </blockquote>
    
    <p>What we're seeing isn't superhero fatigue, or franchise fatigue, or sequel fatigue. It is <strong>mediocrity fatigue</strong>. And it's hitting the summer slate right where it hurts.</p>
    
    <h3>The International Rescue</h3>
    <p>If there is a silver lining, it's the international market. While domestic audiences are getting pickier, the overseas appetite for large-scale spectacle remains incredibly robust. But relying on the global market to bail out a bloated budget is exactly the kind of casino logic that got Hollywood into this mess in the first place.</p>
  `
};

export default function ArticlePage() {
  return (
    <div className="bg-white min-h-screen pb-24">
      
      {/* ARTICLE HEADER SECTION */}
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 pt-12">
        <Link href="/box-office" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Box Office
        </Link>
        
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#E21D1D] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
              {ARTICLE.category}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Clock size={12} /> {ARTICLE.readTime}
            </span>
          </div>
          
          {/* THE MASTER HEADLINE STYLE */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-[950] uppercase tracking-tighter text-gray-900 leading-[0.95] mb-8">
            {ARTICLE.title}
          </h1>
          
          <div className="flex items-center justify-between py-4 border-y border-gray-200 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
                TE
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-0.5">
                  {ARTICLE.author}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {ARTICLE.date}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors">
                <Bookmark size={14} />
              </button>
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 mb-16">
        <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-100 shadow-md">
          <img 
            src={ARTICLE.image} 
            alt={ARTICLE.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ARTICLE BODY */}
      <div className="max-w-[760px] w-full mx-auto px-4 sm:px-6">
        <div 
          className="prose prose-lg prose-gray max-w-none
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-8
            prose-headings:font-[900] prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-gray-900 prose-headings:mb-4 prose-headings:mt-12
            prose-h3:text-2xl
            prose-blockquote:border-l-4 prose-blockquote:border-[#E21D1D] prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-10 prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-gray-900 prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-lg
            prose-strong:font-black prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: ARTICLE.content }}
        />
        
        {/* FOOTER ACTIONS */}
        <div className="mt-16 pt-8 border-t-2 border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">
            End of Article
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-2">Share</span>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#1DA1F2] hover:text-white transition-colors">
              <Twitter size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#4267B2] hover:text-white transition-colors">
              <Facebook size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white transition-colors">
              <Link2 size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}