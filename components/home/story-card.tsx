import Link from 'next/link';
import { Play } from 'lucide-react';

const HEADLINE = 'var(--font-headline), Georgia, serif';

interface StoryCardProps {
  href: any;
  image: string | null;
  imageHref?: string;
  title: string;
  label: string;
  labelColor: string;
  meta?: string;
  quote?: string | null;
  poster?: string | null;
  size?: 'lg' | 'md';
}

export function StoryCard({ href, image, imageHref, title, label, labelColor, meta, quote, poster, size = 'md' }: StoryCardProps) {
  const lg = size === 'lg';
  const img = (
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: '#E8E8E8' }}>
      {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
      {imageHref && (
        <span className="absolute bottom-3 left-3 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm text-[#111] shadow-md">
          <Play size={14} fill="currentColor" />
        </span>
      )}
      {poster && (
        <img src={poster} alt="" className="absolute bottom-3 right-3 w-[54px] object-cover" style={{ aspectRatio: '2/3', border: '3px solid #fff', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }} />
      )}
    </div>
  );

  return (
    <article className="group flex flex-col gap-4">
      {imageHref
        ? <a href={imageHref} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${title}`}>{img}</a>
        : <Link href={href}>{img}</Link>}
      <div className="flex flex-col gap-2.5">
        <Link href={href}>
          <h3
            className="group-hover:underline decoration-1 underline-offset-4"
            style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: lg ? 'clamp(1.75rem, 2.6vw, 2.25rem)' : 'clamp(1.35rem, 1.8vw, 1.6rem)', lineHeight: 1.15, color: '#111' }}
          >
            {title}
          </h3>
        </Link>
        {quote && (
          <p className={`mt-1.5 italic leading-relaxed ${lg ? 'text-[17px] line-clamp-3' : 'text-[15px] line-clamp-3'}`} style={{ fontFamily: 'var(--font-headline), Georgia, serif', fontWeight: 400, color: '#333' }}>
            &ldquo;{quote}&rdquo;
          </p>
        )}
        <p className="text-[13px] tracking-wide">
          <span className="font-bold uppercase" style={{ color: labelColor }}>{label}</span>
          {meta && <span style={{ color: '#555' }}> | {meta}</span>}
        </p>
      </div>
    </article>
  );
}
