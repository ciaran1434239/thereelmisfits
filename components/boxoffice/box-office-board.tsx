'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BOREntry {
  rank: number;
  title: string;
  movie_id: number | null;
  poster_path: string | null;
  weekend_gross: number;
  total_gross: number;
  weeks_in_release: number;
  change_pct: number | null;
  studio: string | null;
  is_new: boolean;
  score: number | null;
}

interface Props {
  domestic: BOREntry[];
  international: BOREntry[];
  weekOf: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000)         return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function getTotal(m: BOREntry): number {
  return (m.total_gross && m.total_gross > 0) ? m.total_gross : m.weekend_gross;
}

function buildStudioLabel(movie: BOREntry): string {
  const wk = `Wk ${movie.weeks_in_release}`;
  if (!movie.studio) return wk;
  const s = movie.studio.length > 20 ? movie.studio.slice(0, 20) + '…' : movie.studio;
  return `${s} · ${wk}`;
}

// ── Score badge ────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return null;
  const cls =
    score >= 75 ? 'bg-[#166534] text-[#4ADE80]' :
    score >= 50 ? 'bg-[#78350F] text-[#FCD34D]' :
                  'bg-[#7F1D1D] text-[#F87171]';
  return (
    <span className={`shrink-0 text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded whitespace-nowrap ${cls}`}>
      {score}%
    </span>
  );
}

// ── Thumbnail with optional NEW corner badge ───────────────────────────────────
//
// NEW pill sits as a corner flag on the top-left of the poster thumbnail.
// It does NOT appear inline with the title text.

function Thumbnail({ movie }: { movie: BOREntry }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
    : null;

  return (
    <div className="shrink-0 relative" style={{ width: 44, height: 58 }}>
      {/* Poster */}
      <div className="absolute inset-0 rounded-[4px] overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[6px] font-bold text-white/20 text-center leading-tight px-1 break-all">
            {movie.title.slice(0, 16)}
          </span>
        )}
      </div>
      {/* NEW flag — top-left corner overlay */}
      {movie.is_new && (
        <span
          className="absolute top-0 left-0 z-10 bg-white text-[#111111] font-black uppercase leading-none"
          style={{
            fontSize: '6px',
            letterSpacing: '0.05em',
            padding: '2px 3px',
            borderRadius: '4px 0 4px 0',   // notched corner tab
          }}
        >
          NEW
        </span>
      )}
    </div>
  );
}

// ── Two-tier table row ─────────────────────────────────────────────────────────
//
// Line 1: [rank] [thumbnail] [title + score badge]
// Line 2:               ↳   [studio · WK]   [gross / total →]
//
// Hover is tracked via JS state to guarantee the title colour shift fires
// exactly on row hover — no Tailwind group cascade ambiguity.

function TableRow({ movie }: { movie: BOREntry }) {
  const [hovered, setHovered] = useState(false);
  const isFirst = movie.rank === 1;

  const inner = (
    <div
      className={cn(
        'flex items-center gap-3 transition-colors',
        isFirst ? 'pl-2 pr-3 border-l-[3px] border-l-[#C8201F]' : 'px-3'
      )}
      style={{
        minHeight: 72,
        paddingTop: 12,
        paddingBottom: 12,
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Rank ── */}
      <span
        className="shrink-0 w-6 text-right tabular-nums font-bold"
        style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}
      >
        {movie.rank}
      </span>

      {/* ── Thumbnail + NEW badge ── */}
      <Thumbnail movie={movie} />

      {/* ── Content — two lines ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">

        {/* Line 1: title + score badge (NEW pill is now on the thumbnail) */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className="font-semibold min-w-0 shrink transition-colors"
            style={{
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: hovered ? '#C8201F' : 'white',
            }}
          >
            {movie.title}
          </span>
          <ScorePill score={movie.score} />
        </div>

        {/* Line 2: studio · WK (left) + gross (right) */}
        <div className="flex items-end justify-between gap-2" style={{ marginTop: 3 }}>
          <span
            className="font-bold uppercase tracking-widest truncate min-w-0"
            style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}
          >
            {buildStudioLabel(movie)}
          </span>
          <div className="flex flex-col items-end shrink-0">
            <span
              className="font-extrabold text-white tabular-nums whitespace-nowrap"
              style={{ fontSize: '1rem' }}
            >
              {fmt(movie.weekend_gross)}
            </span>
            <span
              className="tabular-nums whitespace-nowrap leading-none"
              style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}
            >
              {fmt(getTotal(movie))} total
            </span>
          </div>
        </div>

      </div>
    </div>
  );

  const borderStyle = { borderBottomColor: 'rgba(255,255,255,0.05)' };

  if (movie.movie_id) {
    return (
      <Link href={`/movie/${movie.movie_id}` as any} className="block border-b" style={borderStyle}>
        {inner}
      </Link>
    );
  }
  return (
    <div className="border-b" style={borderStyle}>
      {inner}
    </div>
  );
}

// ── Region toggle ──────────────────────────────────────────────────────────────

const REGIONS = [
  { value: 'domestic'      as const, label: 'Domestic' },
  { value: 'international' as const, label: 'International' },
] as const;

type Region = (typeof REGIONS)[number]['value'];

const pillBase: React.CSSProperties = {
  borderRadius: 4,
  padding: '5px 14px',
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'all 0.15s',
  cursor: 'pointer',
  lineHeight: 1,
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: '#ffffff',
  color: '#111111',
  border: 'none',
};

const pillInactive: React.CSSProperties = {
  ...pillBase,
  background: 'transparent',
  color: 'rgba(255,255,255,0.35)',
  border: '1px solid rgba(255,255,255,0.15)',
};

// ── Main export ────────────────────────────────────────────────────────────────

export function BoxOfficeBoard({ domestic, international, weekOf }: Props) {
  const [region, setRegion] = useState<Region>('domestic');
  const rows = region === 'domestic' ? domestic : international;

  const dateLabel = weekOf
    ? new Date(weekOf + 'T12:00:00')
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        .toUpperCase()
    : null;

  return (
    <div>
      {/* ── Toggle + date ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {REGIONS.map(r => (
          <button
            key={r.value}
            onClick={() => setRegion(r.value)}
            style={region === r.value ? pillActive : pillInactive}
          >
            {r.label}
          </button>
        ))}
        {dateLabel && (
          <span
            className="ml-auto font-bold uppercase"
            style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}
          >
            Updated {dateLabel}
          </span>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="py-14 text-center">
          <p
            className="font-black uppercase tracking-widest"
            style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}
          >
            No data for this region yet
          </p>
        </div>
      ) : (
        <div>
          {rows.slice(0, 10).map(movie => (
            <TableRow key={movie.rank} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
