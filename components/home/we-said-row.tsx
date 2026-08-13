import Link from 'next/link';
import { SectionHeading } from '@/components/ui/section-heading';
import { sanityClient, urlFor } from '@/lib/sanity';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
  _id?: string;
  title: string;
  slug: { current: string } | string;
  category?: string | null;
  excerpt?: string | null;
  coverImage?: any;
  image?: string;
  publishedAt?: string;
}

async function getLatestArticles() {
  return sanityClient.fetch(`
    *[_type == "article"] | order(publishedAt desc) [0...3] {
      _id, title, slug, category, excerpt, coverImage, publishedAt
    }
  `);
}

// ── Featured (left) card ───────────────────────────────────────────────────────
// Large card: red left border on the text block, white/70 excerpt, tall layout.

function FeaturedCard({ article, href }: { article: Article; href: string }) {
  const imgSrc = article.coverImage
    ? urlFor(article.coverImage).width(1200).url()
    : article.image ?? null;

  return (
    <Link
      href={href as any}
      className="group relative overflow-hidden rounded-xl flex flex-col min-h-[440px] md:min-h-[520px]"
    >
      {/* Poster */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-[#181818]" />
      )}

      {/* Bottom scrim */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

      {/* Text block — red left border ties it to the TheySaid system */}
      <div className="relative mt-auto z-10 border-l-[3px] border-[#C8201F] px-5 pb-5 pt-16 ml-5 mb-0">
        {article.category && (
          <span className="inline-block bg-[#C8201F] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2.5">
            {article.category}
          </span>
        )}
        <h3 className="font-black text-white leading-tight text-[22px] md:text-[26px] group-hover:text-white transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-white/70 mt-1.5 text-[13px] leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Secondary (right) card ─────────────────────────────────────────────────────
// Smaller stacked cards: solid dark base overlay so bright images
// don't break the page's tonal consistency; bigger headlines; no excerpt.

function SecondaryCard({ article, href }: { article: Article; href: string }) {
  const imgSrc = article.coverImage
    ? urlFor(article.coverImage).width(600).url()
    : article.image ?? null;

  return (
    <Link
      href={href as any}
      className="group relative overflow-hidden rounded-xl flex flex-col min-h-0 h-full"
    >
      {/* Poster */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
        />
      ) : (
        <div className="absolute inset-0 bg-[#181818]" />
      )}

      {/* Flat dark base — kills colour bleed from bright images */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.78))' }}
      />

      {/* Bottom scrim on top for headline legibility */}
      <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

      {/* Text */}
      <div className="relative mt-auto z-10 px-4 pb-4">
        {article.category && (
          <span className="inline-block bg-[#C8201F] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2">
            {article.category}
          </span>
        )}
        <h3 className="font-black text-white leading-tight text-[18px] group-hover:text-white transition-colors line-clamp-2">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

// ── Placeholder data ───────────────────────────────────────────────────────────

const PLACEHOLDERS: Article[] = [
  {
    title: "The Silent Act: On Set With Today's Filmmakers",
    slug: '',
    category: 'Feature',
    excerpt: 'A deep dive into modern filmmaking and what it really takes to bring a production to life in 2025.',
    image: '/we-said/on-set.jpg',
  },
  {
    title: 'Hollywood Is Burning Through Your Money',
    slug: '',
    category: 'Opinion',
    image: '/we-said/burning-money.jpg',
  },
  {
    title: 'The Fall of Superhero Movies',
    slug: '',
    category: 'Opinion',
    image: '/we-said/superhero-fall.jpg',
  },
];

// ── WeSaidRow ─────────────────────────────────────────────────────────────────

export async function WeSaidRow() {
  const rawArticles = await getLatestArticles();
  const hasArticles = rawArticles && rawArticles.length > 0;
  const articles: Article[] = hasArticles ? rawArticles : PLACEHOLDERS;

  const getHref = (a: Article) => {
    if (!a.slug) return '/we-said';
    const slug = typeof a.slug === 'string' ? a.slug : a.slug.current;
    return slug ? `/we-said/${slug}` : '/we-said';
  };

  return (
    <section className="w-full">
      <SectionHeading
        label="Our editorial takes"
        title="We Said"
        viewAllHref="/we-said"
        viewAllLabel="All articles"
      />

      {/* 2fr left : 1fr right — right column uses grid rows so both cards are exactly equal height */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">

        {/* Featured */}
        {articles[0] && (
          <FeaturedCard article={articles[0]} href={getHref(articles[0])} />
        )}

        {/* Two stacked — grid-rows-2 inside the right column guarantees equal heights */}
        <div className="grid grid-rows-2 gap-4 md:min-h-[440px] md:h-[520px]">
          {articles[1] && (
            <SecondaryCard article={articles[1]} href={getHref(articles[1])} />
          )}
          {articles[2] && (
            <SecondaryCard article={articles[2]} href={getHref(articles[2])} />
          )}
        </div>

      </div>
    </section>
  );
}
