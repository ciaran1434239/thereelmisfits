const DISPLAY = 'var(--font-display), Impact, sans-serif';

const NOTCH = 'radial-gradient(circle at 0 50%, transparent 4px, #000 4.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 4px, #000 4.5px) right / 51% 100% no-repeat';

export function TicketStub({ admit, className = '' }: { admit: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={admit ? 'Recommended' : 'Skip it'}
      className={`relative inline-block ${admit ? '-rotate-3' : 'rotate-2'} ${className}`}
      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
    >
      <span
        className="flex items-center h-[24px] px-3 text-white"
        style={
          admit
            ? { background: '#1E8E3E', WebkitMask: NOTCH, mask: NOTCH }
            : {
                background: '#C8201F',
                clipPath: 'polygon(0 0, 100% 0, 94% 20%, 100% 40%, 93% 60%, 100% 80%, 95% 100%, 0 100%)',
                paddingRight: '0.9rem',
              }
        }
      >
        <span style={{ fontFamily: DISPLAY, fontSize: '0.95rem', lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {admit ? 'Admit one' : 'Refund'}
        </span>
      </span>
    </span>
  );
}
