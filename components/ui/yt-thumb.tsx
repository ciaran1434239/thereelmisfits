import { CriticBadge } from '@/components/ui/critic-badge';

interface YTThumbProps {
  videoId: string;
  title?: string;
  poster?: string | null;
  avatar?: string | null;
  critic?: string;
  className?: string;
}

export function YTThumb({ videoId, title, poster, avatar, critic, className = '' }: YTThumbProps) {
  return (
    <div className={`relative mb-4 ${className}`}>
      <a
        href={`https://youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title ? `Watch ${title} on YouTube` : 'Watch on YouTube'}
        className="block overflow-hidden"
        style={{ aspectRatio: '16/9', background: '#151515' }}
      >
        <img
          src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover grayscale-[0.85] brightness-[0.85] group-hover/card:grayscale-0 group-hover/card:brightness-100 transition duration-200"
        />
      </a>

      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute -bottom-4 -left-2 w-[58px] object-cover -rotate-3 pointer-events-none"
          style={{ aspectRatio: '2/3', border: '2px solid #F4F0E6', boxShadow: '2px 3px 0 0 rgba(21,21,21,0.35)' }}
        />
      )}

      {critic && <CriticBadge src={avatar ?? null} name={critic} className="absolute -bottom-4 right-3 w-9 h-9" />}
    </div>
  );
}
