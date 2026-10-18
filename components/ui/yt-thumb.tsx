interface YTThumbProps {
  videoId: string;
  title?: string;
  poster?: string | null;
  className?: string;
}

export function YTThumb({ videoId, title, poster, className = '' }: YTThumbProps) {
  return (
    <a
      href={`https://youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title ? `Watch ${title} on YouTube` : 'Watch on YouTube'}
      className={`block relative overflow-hidden ${className}`}
      style={{ aspectRatio: '16/9', background: '#151515' }}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
        alt=""
        className="w-full h-full object-cover grayscale-[0.85] brightness-[0.85] group-hover/card:grayscale-0 group-hover/card:brightness-100 transition duration-200"
      />
      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute bottom-2 left-2 w-[44px] object-cover -rotate-3"
          style={{ aspectRatio: '2/3', border: '2px solid #fff', boxShadow: '2px 2px 0 0 #C8201F' }}
        />
      )}
    </a>
  );
}
