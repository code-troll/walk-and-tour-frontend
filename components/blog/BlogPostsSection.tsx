"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { BlogPostListItem, BlogPostsResponse } from "@/lib/wix/blog-types";

type BlogPostsSectionProps = {
  locale: AppLocale;
};

const PAGE_SIZE = 6;

const dedupeById = (items: BlogPostListItem[]): BlogPostListItem[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

export default function BlogPostsSection({ locale }: BlogPostsSectionProps) {
  const t = useTranslations("blogPage");
  const postBasePath = getPathname({locale, href: "/post"});
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsInitialLoading(true);
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/blog/posts?locale=${ encodeURIComponent(locale) }&page=${ nextPage }&limit=${ PAGE_SIZE }`,
      );

      if (!response.ok) {
        throw new Error(`Request failed with ${ response.status }`);
      }

      const data = await response.json() as BlogPostsResponse;
      setPosts((current) => append ? dedupeById([...current, ...data.items]) : data.items);
      setPage(nextPage);
      setHasNextPage(data.pagination.hasNextPage);
    } catch {
      setError(t("error"));
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [locale, t]);

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

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

        { isInitialLoading ? (
          <p className="mt-12 text-center text-base font-medium text-[#8a7562]">
            { t("loading") }
          </p>
        ) : null }

        { error ? (
          <div className="mt-12 rounded-2xl border border-[#e3d8cc] bg-white p-6 text-center">
            <p className="text-sm font-medium text-[#5b4d3c]">{ error }</p>
            <button
              type="button"
              onClick={ () => void fetchPage(1, false) }
              className="btn-red-black mt-4 inline-flex items-center px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              { t("retry") }
            </button>
          </div>
        ) : null }

        {!isInitialLoading && !error && posts.length === 0 ? (
          <p className="mt-12 text-center text-base font-medium text-[#8a7562]">
            { t("empty") }
          </p>
        ) : null }

        { posts.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            { posts.map((post) => (
              <BlogPostCard
                key={ post.id }
                post={ post }
                postHref={ `${ postBasePath }/${ post.slug }` }
                readMoreLabel={ t("readMore") }
                viewsLabel={ t("views") }
                commentsLabel={ t("comments") }
                locale={ locale }
              />
            )) }
          </div>
        ) : null }

        { posts.length > 0 && hasNextPage ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={ () => void fetchPage(page + 1, true) }
              disabled={ isLoadingMore }
              className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              { isLoadingMore ? t("loadingMore") : t("loadMore") }
            </button>
          </div>
        ) : null }
      </div>
    </section>
  );
}
