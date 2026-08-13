export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Clock } from 'lucide-react';
import { sanityClient, urlFor } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getArticle(slug: string) {
  return sanityClient.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      category,
      excerpt,
      coverImage,
      body,
      worthYourTime,
      publishedAt,
    }`,
    { slug }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Not found' };
  return {
    title: `${article.title} · We Said`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
    },
  };
}

const ptComponents = {
  block: {
    normal: ({ children }: any) => <p className="mb-6 text-[17px] leading-[1.8] text-gray-700">{children}</p>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold font-serif text-gray-900 mt-10 mb-4">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold font-serif text-gray-900 mt-8 mb-3">{children}</h3>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#E21D1D] pl-6 italic text-gray-600 my-8 text-lg">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-[#E21D1D] underline underline-offset-2">
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: any) => (
      <figure className="my-10">
        <img
          src={urlFor(value).width(900).url()}
          alt={value.caption ?? ''}
          className="w-full rounded-xl object-cover"
        />
        {value.caption && (
          <figcaption className="text-center text-xs text-gray-400 mt-3">{value.caption}</figcaption>
        )}
      </figure>
    ),
  },
};

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-24">
      <div className="max-w-[720px] w-full mx-auto px-4 sm:px-6 pt-10">

        <div className="mb-8">
          <Link href="/we-said" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft size={13} />
            We Said
          </Link>
        </div>

        {/* Category + date */}
        <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-widest">
          <span className="text-[#E21D1D]">{article.category}</span>
          {article.publishedAt && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5 text-gray-400">
                <Clock size={12} />
                {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </>
          )}
          {article.worthYourTime && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="bg-[#E21D1D] text-white px-2 py-0.5 rounded text-[9px]">Worth Your Time</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 leading-[1.1] mb-6">
          {article.title}
        </h1>

        {/* Excerpt / dek */}
        <p className="text-lg text-gray-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          {article.excerpt}
        </p>

        {/* Cover image */}
        {article.coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl mb-12 bg-gray-100">
            <img
              src={urlFor(article.coverImage).width(1200).url()}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Body */}
        {article.body ? (
          <div className="prose-custom">
            <PortableText value={article.body} components={ptComponents} />
          </div>
        ) : (
          <p className="text-[17px] leading-[1.8] text-gray-700">{article.excerpt}</p>
        )}

      </div>
    </div>
  );
}
