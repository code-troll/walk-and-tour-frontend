import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { PublicBlogCard } from "@/lib/public-blog-data";

type BlogPostCardProps = {
  post: PublicBlogCard;
  postHref: string;
  readMoreLabel: string;
  locale: string;
};

const getFormattedDate = (isoDate: string | null, locale: string): string | null => {
  if (!isoDate) {
    return null;
  }

  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

export default function BlogPostCard({
                                      post,
                                      postHref,
                                      readMoreLabel,
                                      locale,
                                    }: BlogPostCardProps) {
  const formattedDate = getFormattedDate(post.publishedDate, locale);
  const isRemoteImage = post.coverImageUrl?.startsWith("http://") || post.coverImageUrl?.startsWith("https://");

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_28px_-24px_rgba(0,0,0,0.9)] ring-1 ring-[#e3d8cc]">
      <a href={ postHref } className="group block">
        { post.coverImageUrl ? (
          <Image
            src={ post.coverImageUrl }
            alt={ post.coverImageAlt }
            width={ 1200 }
            height={ 760 }
            className="h-56 w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04]"
            unoptimized={ Boolean(isRemoteImage) }
          />
        ) : (
          <div className="h-56 w-full bg-linear-to-br from-[#2b666d]/80 via-[#2b666d]/55 to-[#2b666d]/40"/>
        ) }
      </a>
      <div className="flex flex-1 flex-col p-6">
        { formattedDate ? (
          <p className="text-sm font-medium text-[#8a7562]">
            { formattedDate }
          </p>
        ) : null }
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#2a221a]">
          { post.title }
        </h3>
        { post.excerpt ? (
          <p className="mt-4 line-clamp-4 text-base leading-7 text-[#5b4d3c]">
            { post.excerpt }
          </p>
        ) : null }
        <div className="mt-auto pt-5">
          <a
            href={ postHref }
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#c24343] transition-colors hover:text-[#2a221a]"
          >
            { readMoreLabel }
            <ArrowRight className="h-4 w-4"/>
          </a>
        </div>
      </div>
    </article>
  );
}
