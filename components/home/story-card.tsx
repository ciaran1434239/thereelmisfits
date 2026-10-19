import Link from 'next/link';
import { TicketStub } from '@/components/ui/ticket-stub';

const HEADLINE = 'var(--font-headline), Georgia, serif';

interface StoryCardProps {
  href: any;
  image: string | null;
  title: string;
  label: string;
  meta?: string;
  quote?: string | null;
  poster?: string | null;
  verdict?: boolean;
  size?: 'lg' | 'md';
}

export function StoryCard({ href, image, title, label, meta, quote, poster, verdict, size = 'md' }: StoryCardProps) {
  const lg = size === 'lg';
  const img = (
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: '#E8E8E8', border: '1px solid #111' }}>
      {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
      {verdict !== undefined && (
        <span className="absolute bottom-2 left-2"><TicketStub admit={verdict} className="transition-transform group-hover:rotate-0 group-hover:scale-105" /></span>
      )}
      {poster && (
        <img src={poster} alt="" className="absolute bottom-3 right-3 w-[54px] object-cover" style={{ aspectRatio: '2/3', border: '3px solid #fff', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }} />
      )}
    </div>
  );

  return (
    <article className="group flex flex-col gap-4">
      <Link href={href}>{img}</Link>
      <div className="flex flex-col">
        <Link href={href}>
          <h3
            className="group-hover:underline decoration-1 underline-offset-4"
            style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: lg ? 'clamp(1.75rem, 2.6vw, 2.25rem)' : 'clamp(1.35rem, 1.8vw, 1.6rem)', lineHeight: 1.15, color: '#111' }}
          >
            {title}
          </h3>
        </Link>
        {quote && (
          <p className={`mt-3 italic leading-relaxed ${lg ? 'text-[17px] line-clamp-3' : 'text-[15px] line-clamp-3'}`} style={{ fontFamily: HEADLINE, fontWeight: 400, color: '#333' }}>
            &ldquo;{quote}&rdquo;
          </p>
        )}
        <p className="mt-4 uppercase" style={{ fontFamily: 'var(--font-display), Impact, sans-serif', fontSize: '1.05rem', letterSpacing: '0.06em', lineHeight: 1.1, color: verdict === undefined ? '#111' : verdict ? '#16803A' : '#C8201F' }}>
          {label}
        </p>
        {meta && <p className="mt-1 text-[13px]" style={{ color: '#666' }}>{meta}</p>}
      </div>
    </article>
  );
}
