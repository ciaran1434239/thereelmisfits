interface VerdictStampProps {
  recommend: boolean;
  size?: 'sm' | 'md';
}

export function VerdictStamp({ recommend, size = 'md' }: VerdictStampProps) {
  const color = recommend ? '#1E8E3E' : '#C8201F';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.08em] ${size === 'sm' ? 'text-[11px]' : 'text-[12px]'}`}
      style={{ color }}
    >
      <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
      {recommend ? 'Recommends' : 'Skips it'}
    </span>
  );
}
