import Link from 'next/link';
import { ArrowLeft, Clapperboard } from 'lucide-react';

export default function DeepDiveCategoryPage({ params }: { params: { slug: string } }) {
  // This takes the URL slug (e.g., "making-of") and turns it into "making of"
  const formattedTitle = params.slug.replace(/-/g, ' ');

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6 pb-32">
      
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Clapperboard className="text-[#E21D1D]" size={24} />
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E21D1D] mb-4">
        Category Archive
      </div>
      
      <h1 className="text-4xl sm:text-6xl font-[950] uppercase tracking-tighter text-gray-900 mb-6 text-center">
        {formattedTitle}
      </h1>
      
      <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-12 text-center max-w-md leading-relaxed">
        This archive is currently being curated by our editors. The full list of video essays will be available soon.
      </p>
      
      <Link 
        href="/deep-dives" 
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white bg-gray-900 px-8 py-4 rounded-full hover:bg-white/10 hover:scale-105 transition-all shadow-xl"
      >
        <ArrowLeft size={16} /> Back to Deep Dives
      </Link>
      
    </div>
  );
}