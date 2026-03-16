"use client";

import Image from "next/image";
import BlogPostContent from "@/components/blog/BlogPostContent";
import BlogPostMetaTopBar from "@/components/blog/BlogPostMetaTopBar";

type BlogPostArticleProps = {
  contentHtml: string | null;
  contentText: string;
  coverImageAlt?: string | null;
  coverImageUrl?: string | null;
  eyebrow?: string | null;
  eyebrowNote?: string | null;
  locale: string;
  publishedDate: string | null;
  summary?: string | null;
  title: string;
  updatedDate: string | null;
  viewCount: number;
  viewsLabel: string;
  publishedLabel: string;
  updatedLabel: string;
};

const isUnoptimizedImage = (value: string | null | undefined) =>
  Boolean(
    value &&
    (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("blob:")
    )
  );

export default function BlogPostArticle({
  contentHtml,
  contentText,
  coverImageAlt,
  coverImageUrl,
  eyebrow,
  eyebrowNote,
  locale,
  publishedDate,
  summary,
  title,
  updatedDate,
  viewCount,
  viewsLabel,
  publishedLabel,
  updatedLabel,
}: BlogPostArticleProps) {
  return (
    <article className="space-y-8">
      { eyebrow || eyebrowNote ? (
        <div className="space-y-2">
          { eyebrow ? (
            <span className="inline-flex rounded-full border border-[#d8c5a8] bg-[#fcfaf6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f6a3b]">
              { eyebrow }
            </span>
          ) : null }
          { eyebrowNote ? (
            <p className="text-sm text-[#627176]">{ eyebrowNote }</p>
          ) : null }
        </div>
      ) : null }

      <div className="space-y-4">
        <BlogPostMetaTopBar
          publishedLabel={ publishedLabel }
          updatedLabel={ updatedLabel }
          viewsLabel={ viewsLabel }
          publishedDate={ publishedDate }
          updatedDate={ updatedDate }
          viewCount={ viewCount }
          locale={ locale }
        />

        <div className="space-y-3">
          <h1 className="text-4xl font-semibold leading-tight text-teal sm:text-5xl">
            { title }
          </h1>
          { summary ? (
            <p className="max-w-4xl text-lg leading-8 text-[#5b4d3c]">
              { summary }
            </p>
          ) : null }
        </div>
      </div>

      { coverImageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-[#e8dfd4] bg-[#fbf7f0]">
          <Image
            src={ coverImageUrl }
            alt={ coverImageAlt || title }
            width={ 1600 }
            height={ 900 }
            className="h-auto w-full object-cover"
            unoptimized={ isUnoptimizedImage(coverImageUrl) }
          />
        </div>
      ) : null }

      <BlogPostContent
        contentHtml={ contentHtml }
        contentText={ contentText }
      />
    </article>
  );
}
