import Link from 'next/link';

export function Masthead() {
  return (
    <div className="text-center px-4 pt-8 sm:pt-10 pb-6 sm:pb-8">
      <Link href="/" aria-label="The Reel Misfits, home" className="inline-block">
        <h1
          className="text-[#111] whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-display), Impact, sans-serif',
            fontSize: 'clamp(3.75rem, 14vw, 10.5rem)',
            lineHeight: 0.85,
            letterSpacing: '0.005em',
          }}
        >
          The Reel <span style={{ color: '#C8201F' }}>Misfits</span>
        </h1>
      </Link>
      <p
        className="mt-3 sm:mt-4 italic text-[#111]"
        style={{ fontFamily: 'var(--font-headline), Georgia, serif', fontSize: 'clamp(1.05rem, 2vw, 1.5rem)' }}
      >
        The Tomatometer is broken. Trust the Tube.
      </p>
    </div>
  );
}
