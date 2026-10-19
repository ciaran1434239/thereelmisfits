const DISPLAY = 'var(--font-display), Impact, sans-serif';

const NOTCH = 'radial-gradient(circle at 0 50%, transparent 5px, #000 5.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 5px, #000 5.5px) right / 51% 100% no-repeat';

export function TicketStub({ admit, className = '' }: { admit: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={admit ? 'Recommended' : 'Skip it'}
      className={`relative inline-block ${admit ? '-rotate-6' : 'rotate-3'} ${className}`}
      style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))' }}
    >
      {admit ? (
        <span
          className="flex items-center gap-2 h-[38px] pl-3.5 pr-3"
          style={{ background: '#F3E6BC', color: '#111', WebkitMask: NOTCH, mask: NOTCH }}
        >
          <span style={{ fontFamily: DISPLAY, fontSize: '1.15rem', lineHeight: 1, letterSpacing: '0.06em' }}>Admit One</span>
          <span aria-hidden className="self-stretch my-1.5 border-l-2 border-dashed" style={{ borderColor: '#111' }} />
          <span aria-hidden style={{ fontFamily: DISPLAY, fontSize: '1.15rem', lineHeight: 1 }}>★</span>
        </span>
      ) : (
        <>
          <span
            className="flex items-center h-[38px] pl-3.5 pr-4"
            style={{
              background: '#E9DDB4',
              color: '#111',
              clipPath: 'polygon(0 0, 100% 0, 91% 15%, 100% 30%, 90% 44%, 99% 58%, 90% 72%, 100% 86%, 93% 100%, 0 100%)',
            }}
          >
            <span style={{ fontFamily: DISPLAY, fontSize: '1.15rem', lineHeight: 1, letterSpacing: '0.06em' }}>Admit</span>
          </span>
          <span
            aria-hidden
            className="absolute left-1 top-1/2 px-1.5 -rotate-12"
            style={{
              transform: 'translateY(-50%) rotate(-12deg)',
              fontFamily: DISPLAY,
              fontSize: '1.3rem',
              lineHeight: 1,
              letterSpacing: '0.08em',
              color: '#C8201F',
              border: '2px solid #C8201F',
              background: 'rgba(255,255,255,0.55)',
            }}
          >
            Refund
          </span>
        </>
      )}
    </span>
  );
}
