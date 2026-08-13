export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sanityClient, urlFor } from '@/lib/sanity';
import { BoxOfficeBoard, type BOREntry } from '@/components/boxoffice/box-office-board';

const TMDB_KEY = process.env.TMDB_API_KEY;
const MIN_REVIEWS = 4;

// ── Sanity articles ───────────────────────────────────────────────────────────

async function getBoxOfficeReports() {
  try {
    const results = await sanityClient.fetch(`
      *[_type == "article" && category in ["Box Office", "Industry", "Opinion", "Analysis", "Predictions"]]
      | order(publishedAt desc) [0...4] {
        _id, title, slug, excerpt, coverImage, publishedAt, category,
        "authorName": author->name
      }
    `);
    if (!results?.length) {
      return await sanityClient.fetch(`
        *[_type == "article"] | order(publishedAt desc) [0...4] {
          _id, title, slug, excerpt, coverImage, publishedAt, category,
          "authorName": author->name
        }
      `);
    }
    return results;
  } catch {
    return [];
  }
}

// ── Poster + score enrichment ─────────────────────────────────────────────────

async function enrichRows(rows: any[]): Promise<BOREntry[]> {
  const movieIds = rows.filter(r => r.movie_id).map(r => r.movie_id as number);

  // 1. Our DB posters
  const { data: dbMovies } = movieIds.length
    ? await supabase.from('movies').select('id, poster_path').in('id', movieIds)
    : { data: [] };

  const posterMap = new Map<number, string | null>(
    (dbMovies ?? []).map((m: any) => [m.id as number, m.poster_path ?? null])
  );

  // 2. TMDB by ID for any still missing
  const missingIds = movieIds.filter(id => !posterMap.get(id));
  if (missingIds.length && TMDB_KEY) {
    await Promise.all(
      missingIds.map(id =>
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`, { next: { revalidate: 86400 } })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.poster_path) posterMap.set(id, d.poster_path); })
          .catch(() => {})
      )
    );
  }

  // 3. TMDB title search for rows with no movie_id
  const titlePosterMap = new Map<string, string>();
  const noIdRows = rows.filter(r => !r.movie_id && r.title);
  if (noIdRows.length && TMDB_KEY) {
    await Promise.all(
      noIdRows.map(r =>
        fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(r.title)}&api_key=${TMDB_KEY}`,
          { next: { revalidate: 86400 } }
        )
          .then(res => res.ok ? res.json() : null)
          .then(d => {
            const hit = d?.results?.[0];
            if (hit?.poster_path) titlePosterMap.set(r.title, hit.poster_path);
          })
          .catch(() => {})
      )
    );
  }

  // 4. TheySaid scores (≥4 reviews required)
  const { data: reviewRows } = movieIds.length
    ? await supabase
        .from('reviews')
        .select('movie_id, recommend')
        .in('movie_id', movieIds)
        .not('recommend', 'is', null)
    : { data: [] };

  const scoreMap = new Map<number, { t: number; r: number }>();
  for (const row of reviewRows ?? []) {
    const e = scoreMap.get(row.movie_id) ?? { t: 0, r: 0 };
    e.t++;
    if (row.recommend) e.r++;
    scoreMap.set(row.movie_id, e);
  }

  return rows.map(r => {
    const s = r.movie_id ? scoreMap.get(r.movie_id) : undefined;
    const poster = r.movie_id
      ? (posterMap.get(r.movie_id) ?? null)
      : (titlePosterMap.get(r.title) ?? null);
    return {
      ...r,
      poster_path: poster,
      score: s && s.t >= MIN_REVIEWS ? Math.round((s.r / s.t) * 100) : null,
    };
  });
}

// ── Article card components ───────────────────────────────────────────────────

function ArticleMeta({ article, className }: { article: any; className?: string }) {
  const parts: string[] = [];
  if (article.authorName) parts.push(article.authorName);
  if (article.publishedAt) {
    parts.push(new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }
  if (!parts.length) return null;
  return (
    <span className={className} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
      {parts.join(' · ')}
    </span>
  );
}

function CategoryPill({ category }: { category?: string }) {
  if (!category) return null;
  return (
    <span
      className="inline-block bg-[#C8201F] text-white font-bold uppercase rounded-[4px]"
      style={{ fontSize: '0.65rem', letterSpacing: '0.08em', padding: '4px 8px' }}
    >
      {category}
    </span>
  );
}

function FeaturedArticleCard({ article }: { article: any }) {
  const imgSrc = article.coverImage ? urlFor(article.coverImage).width(1200).url() : null;
  const href = article.slug?.current ? `/we-said/${article.slug.current}` : '/we-said';

  return (
    <Link
      href={href as any}
      className="group relative overflow-hidden flex flex-col"
      style={{ height: 280, borderRadius: 8 }}
    >
      {/* Background */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1a1a1a]" />
      )}
      {/* Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
      />

      {/* Category pill — top-left */}
      <div className="relative z-10 p-4">
        <CategoryPill category={article.category} />
      </div>

      {/* Bottom content */}
      <div className="relative z-10 mt-auto p-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="font-bold text-white leading-snug line-clamp-2 group-hover:text-white/80 transition-colors"
            style={{ fontSize: '1.3rem' }}
          >
            {article.title}
          </h3>
          {article.excerpt && (
            <p
              className="mt-1 line-clamp-2"
              style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}
            >
              {article.excerpt}
            </p>
          )}
        </div>
        <ArticleMeta article={article} className="shrink-0 text-right" />
      </div>
    </Link>
  );
}

function SecondaryArticleCard({ article }: { article: any }) {
  const imgSrc = article.coverImage ? urlFor(article.coverImage).width(600).url() : null;
  const href = article.slug?.current ? `/we-said/${article.slug.current}` : '/we-said';

  return (
    <Link
      href={href as any}
      className="group relative overflow-hidden flex flex-col flex-1"
      style={{ height: 180, borderRadius: 8 }}
    >
      {/* Background */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1a1a1a]" />
      )}
      {/* Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
      />

      {/* Category pill — top-left */}
      <div className="relative z-10 p-3">
        <CategoryPill category={article.category} />
      </div>

      {/* Bottom content */}
      <div className="relative z-10 mt-auto p-3 flex items-end justify-between gap-2">
        <h3
          className="font-bold text-white leading-snug line-clamp-2 group-hover:text-white/80 transition-colors min-w-0"
          style={{ fontSize: '0.95rem' }}
        >
          {article.title}
        </h3>
        <ArticleMeta article={article} className="shrink-0 text-right" />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BoxOfficePage() {
  const { data: latest } = await supabase
    .from('box_office')
    .select('week_of')
    .order('week_of', { ascending: false })
    .limit(1)
    .single();

  const weekOf = latest?.week_of ?? null;

  const [{ data: domesticRaw }, { data: intlRaw }, reports] = await Promise.all([
    supabase.from('box_office').select('*').eq('region', 'domestic').eq('week_of', weekOf ?? '').order('rank'),
    supabase.from('box_office').select('*').eq('region', 'global').eq('week_of', weekOf ?? '').order('rank'),
    getBoxOfficeReports(),
  ]);

  const [domestic, international] = await Promise.all([
    enrichRows(domesticRaw ?? []),
    enrichRows(intlRaw ?? []),
  ]);

  const articles = reports as any[];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-10 pb-20">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-12">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C8201F] mb-1">
            Commercial analysis &amp; data
          </p>
          <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-[950] uppercase tracking-[-0.04em] leading-none text-white mb-3">
            Box <span className="text-[#C8201F]">Office</span>
          </h1>
          <p className="text-[14px] font-black uppercase tracking-[0.12em] text-white/30">
            Hollywood is a casino. Here are the numbers.
          </p>
        </div>

        {/* ── Two-column body ─────────────────────────────────────── */}
        {/* Mobile: table first (order-1), articles below (order-2)  */}
        {/* Desktop: articles left (flex-2), table right (flex-1 sticky) */}
        <div className="flex flex-col md:flex-row gap-12 items-start">

          {/* RIGHT COLUMN — sticky table */}
          <div
            className="w-full md:flex-1 order-first md:order-last md:sticky md:top-20 md:self-start md:border-l md:pl-12"
            style={{ borderLeftColor: 'rgba(255,255,255,0.06)' }}
          >
            {weekOf ? (
              <BoxOfficeBoard
                domestic={domestic}
                international={international}
                weekOf={weekOf}
              />
            ) : (
              <div className="py-16 border border-dashed border-white/[0.06] rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">
                  No box office data yet
                </p>
                <p className="text-[11px] text-white/20">
                  Go to{' '}
                  <a href="/admin" className="text-[#C8201F] underline">
                    Admin → Box Office
                  </a>{' '}
                  to import weekly chart data.
                </p>
              </div>
            )}
          </div>

          {/* LEFT COLUMN — articles */}
          <div className="w-full md:flex-[2] order-last md:order-first min-w-0">
            {articles.length > 0 ? (
              <section>
                {/* Section header */}
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C8201F] mb-1">
                    Box Office Commentary
                  </p>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="text-[22px] font-black uppercase tracking-tight text-white leading-none">
                      What They Said About The Numbers
                    </h2>
                    <Link
                      href="/we-said"
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white transition-colors shrink-0"
                    >
                      All articles <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Featured article */}
                <FeaturedArticleCard article={articles[0]} />

                {/* Secondary articles (up to 3) */}
                {articles.length > 1 && (
                  <div className="flex gap-4 mt-4">
                    {articles.slice(1, 4).map((a: any) => (
                      <SecondaryArticleCard key={a._id} article={a} />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              /* Placeholder when no articles */
              <div className="py-16 border border-dashed border-white/[0.06] rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  No articles yet
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
