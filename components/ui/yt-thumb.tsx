interface YTThumbProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function YTThumb({ videoId, title, className = '' }: YTThumbProps) {
  return (
    <a
      href={`https://youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title ? `Watch ${title} on YouTube` : 'Watch on YouTube'}
      className={`block relative overflow-hidden group ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
        alt=""
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
      />
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div
          className="w-10 h-10 flex items-center justify-center"
          style={{ background: 'var(--brand)', border: '2px solid #fff', boxShadow: '2px 2px 0 0 #111' }}
        >
          <svg viewBox="0 0 24 24" fill="white" width="14" height="14" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </a>
  );
}
