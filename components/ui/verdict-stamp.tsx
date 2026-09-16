interface VerdictStampProps {
  recommend: boolean;
  size?: 'sm' | 'md';
}

export function VerdictStamp({ recommend, size = 'md' }: VerdictStampProps) {
  const base = 'inline-flex items-center font-black uppercase tracking-[0.12em] border';
  const sz   = size === 'sm' ? 'text-[9px] px-1.5 py-0.5 gap-0.5' : 'text-[10px] px-2 py-[3px] gap-1';

  return recommend ? (
    <span
      className={`${base} ${sz}`}
      style={{ color: 'var(--score-green)', borderColor: 'var(--score-green)', background: 'rgba(47,191,90,0.1)' }}
    >
      ✓ Recommend
    </span>
  ) : (
    <span
      className={`${base} ${sz}`}
      style={{ color: '#F87171', borderColor: '#F87171', background: 'rgba(248,113,113,0.1)' }}
    >
      ✗ Skip It
    </span>
  );
}
