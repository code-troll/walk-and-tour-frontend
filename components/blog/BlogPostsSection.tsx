"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { PublicBlogCard } from "@/lib/public-blog-model";

type BlogPostsSectionProps = {
  locale: AppLocale;
  posts: PublicBlogCard[];
  didFail: boolean;
};

const PAGE_SIZE = 6;

export default function BlogPostsSection({
                                          locale,
                                          posts,
                                          didFail,
                                        }: BlogPostsSectionProps) {
  const t = useTranslations("blogPage");
  const postBasePath = getPathname({locale, href: "/post"});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < posts.length;

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { t("title") }
          </h2>
          <p className="mt-5 text-base leading-7 text-[#3d3124] md:text-lg">
            { t("description") }
          </p>
        </div>

        { didFail ? (
          <div className="mt-12 rounded-2xl border border-[#e3d8cc] bg-white p-6 text-center">
            <p className="text-sm font-medium text-[#5b4d3c]">{ t("error") }</p>
          </div>
        ) : null }

        {!didFail && posts.length === 0 ? (
          <p className="mt-12 text-center text-base font-medium text-[#8a7562]">
            { t("empty") }
          </p>
        ) : null }

        { visiblePosts.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            { visiblePosts.map((post) => (
              <BlogPostCard
                key={ post.id }
                post={ post }
                postHref={ `${ postBasePath }/${ post.slug }` }
                readMoreLabel={ t("readMore") }
                viewsLabel={ t("views") }
                locale={ locale }
              />
            )) }
          </div>
        ) : null }

        { visiblePosts.length > 0 && hasMorePosts ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={ () => setVisibleCount((current) => current + PAGE_SIZE) }
              className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              { t("loadMore") }
            </button>
          </div>
        ) : null }
      </div>
    </section>
  );
}
