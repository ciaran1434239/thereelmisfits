import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SectionTitle } from '@/components/home/section-title';

const TMDB_KEY = process.env.TMDB_API_KEY;
const HEADLINE = 'var(--font-headline), Georgia, serif';
const DISPLAY  = 'var(--font-display), Impact, sans-serif';

interface ChartRow {
  rank: number;
  title: string;
  href: any;
  value?: string;
  note?: string;
}

async function tmdb(path: string) {
  if (!TMDB_KEY) return null;
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`https://api.themoviedb.org/3/${path}${sep}api_key=${TMDB_KEY}&language=en-US`, { next: { revalidate: 3600 } })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

async function getBoxOffice(): Promise<{ rows: ChartRow[]; caption: string }> {
  const { data: latest } = await supabase.from('box_office').select('week_of').order('week_of', { ascending: false }).limit(1).single();
  if (!latest) return { rows: [], caption: '' };
  const { data } = await supabase
    .from('box_office').select('*')
    .eq('week_of', latest.week_of).eq('region', 'domestic')
    .order('rank', { ascending: true }).limit(5);
  const caption = `US weekend of ${new Date(latest.week_of).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  return {
    caption,
    rows: (data ?? []).map((r: any) => ({
      rank: r.rank,
      title: r.title,
      href: '/box-office',
      value: r.weekend_gross ? fmtMoney(r.weekend_gross) : undefined,
      note: r.weeks_in_release ? `Week ${r.weeks_in_release}` : undefined,
    })),
  };
}

async function getStreaming(): Promise<ChartRow[]> {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const d = await tmdb(`discover/movie?watch_region=US&with_watch_monetization_types=flatrate&sort_by=popularity.desc&primary_release_date.gte=${since}&with_original_language=en`);
  return ((d?.results ?? []) as any[]).slice(0, 5).map((m, i) => ({
    rank: i + 1,
    title: m.title,
    href: `/movie/${m.id}`,
    note: m.release_date?.slice(0, 4),
  }));
}

async function getComingSoon(): Promise<ChartRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const [p1, p2] = await Promise.all([tmdb('movie/upcoming?region=US&page=1'), tmdb('movie/upcoming?region=US&page=2')]);
  const all = [...(p1?.results ?? []), ...(p2?.results ?? [])] as any[];
  return all
    .filter(m => m.poster_path && m.release_date > today && m.release_date <= limit)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .slice(0, 5)
    .map((m, i) => ({
      rank: i + 1,
      title: m.title,
      href: `/movie/${m.id}`,
      value: new Date(m.release_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    }));
}

function Chart({ title, caption, rows, more }: { title: string; caption: string; rows: ChartRow[]; more?: { href: any; label: string } }) {
  return (
    <div>
      <div className="pb-3" style={{ borderBottom: '1px solid #111' }}>
        <h3 style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.1, color: '#111' }}>{title}</h3>
        <p className="uppercase mt-1" style={{ fontFamily: DISPLAY, fontSize: '1.05rem', letterSpacing: '0.06em', color: '#555' }}>{caption}</p>
      </div>

      <ol>
        {rows.map(r => (
          <li key={`${r.rank}-${r.title}`} style={{ borderBottom: '1px solid #E4E4E4' }}>
            <Link href={r.href} className="group flex items-center gap-4 py-3.5">
              <span style={{ fontFamily: DISPLAY, fontSize: '2.1rem', lineHeight: 1, width: '1.6rem', color: r.rank === 1 ? '#C8201F' : '#111' }}>{r.rank}</span>
              <span className="flex-1 min-w-0">
                <span className="block line-clamp-1 group-hover:underline underline-offset-2" style={{ fontFamily: HEADLINE, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.25, color: '#111' }}>{r.title}</span>
                {r.note && <span className="block uppercase" style={{ fontFamily: DISPLAY, fontSize: '0.95rem', letterSpacing: '0.06em', color: '#555' }}>{r.note}</span>}
              </span>
              {r.value && <span className="shrink-0 uppercase" style={{ fontFamily: DISPLAY, fontSize: '1.3rem', letterSpacing: '0.04em', color: '#111' }}>{r.value}</span>}
            </Link>
          </li>
        ))}
      </ol>

      {more && (
        <Link href={more.href} className="inline-block mt-4 text-[13px] font-bold uppercase tracking-[0.1em] hover:underline underline-offset-4" style={{ color: '#C8201F' }}>
          {more.label} &rarr;
        </Link>
      )}
    </div>
  );
}

export async function ChartsTrio() {
  const [box, streaming, coming] = await Promise.all([getBoxOffice(), getStreaming(), getComingSoon()]);
  if (!box.rows.length && !streaming.length && !coming.length) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
      <SectionTitle title="The charts" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-14 mt-10">
        {box.rows.length > 0 && <Chart title="Top box office" caption={box.caption} rows={box.rows} more={{ href: '/box-office', label: 'Full chart' }} />}
        {streaming.length > 0 && <Chart title="Top streaming" caption="Most popular in the US" rows={streaming} />}
        {coming.length > 0 && <Chart title="Coming soon" caption="In US cinemas next" rows={coming} more={{ href: '/reviews?type=movie', label: 'All releases' }} />}
      </div>
    </section>
  );
}
