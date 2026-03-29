"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { PublicBlogCard } from "@/lib/public-blog-model";
import cn from "@meltdownjs/cn";

type BlogPostsSectionProps = {
  locale: AppLocale;
  posts: PublicBlogCard[];
  didFail: boolean;
};

const PAGE_SIZE = 6;

const extractUniqueTagOptions = (posts: PublicBlogCard[]) => {
  const seen = new Map<string, string>();

  for (const post of posts) {
    for (const tag of post.tagLabels) {
      if (!seen.has(tag.key)) {
        seen.set(tag.key, tag.label);
      }
    }
  }

  return [...seen.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const filterPostsByTags = (
  posts: PublicBlogCard[],
  selectedTagKeys: string[],
) => {
  if (selectedTagKeys.length === 0) {
    return posts;
  }

  return posts.filter((post) =>
    selectedTagKeys.some((key) =>
      post.tagLabels.some((tag) => tag.key === key),
    ),
  );
};

export default function BlogPostsSection({
                                          locale,
                                          posts,
                                          didFail,
                                        }: BlogPostsSectionProps) {
  const t = useTranslations("blogPage");
  const postBasePath = getPathname({locale, href: "/post"});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([]);

  const tagOptions = useMemo(() => extractUniqueTagOptions(posts), [posts]);

  const filteredPosts = useMemo(
    () => filterPostsByTags(posts, selectedTagKeys),
    [posts, selectedTagKeys],
  );

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < filteredPosts.length;

  const toggleTag = (key: string) => {
    setSelectedTagKeys((current) =>
      current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key],
    );
    setVisibleCount(PAGE_SIZE);
  };

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

        { tagOptions.length > 1 ? (
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="rounded-xl border border-[#d8c8b7] bg-[#ffffff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
                { t("filterLabel") }
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                { tagOptions.map((option) => {
                  const isSelected = selectedTagKeys.includes(option.key);

                  return (
                    <button
                      key={ option.key }
                      type="button"
                      onClick={ () => toggleTag(option.key) }
                      className={ cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors duration-150 cursor-pointer",
                        isSelected
                          ? "border-[#2b666d] bg-[#2b666d] text-[#ffffff]"
                          : "border-[#d8c8b7] bg-[#ffffff] text-[#5b4d3c] hover:border-[#2b666d]",
                      ) }
                    >
                      { option.label }
                    </button>
                  );
                }) }
              </div>
            </div>
          </div>
        ) : null }

        { didFail ? (
          <div className="mt-12 rounded-2xl border border-[#e3d8cc] bg-white p-6 text-center">
            <p className="text-sm font-medium text-[#5b4d3c]">{ t("error") }</p>
          </div>
        ) : null }

        { !didFail && posts.length === 0 ? (
          <p className="mt-12 text-center text-base font-medium text-[#8a7562]">
            { t("empty") }
          </p>
        ) : null }

        { !didFail && posts.length > 0 && filteredPosts.length === 0 ? (
          <p className="mt-12 text-center text-base font-medium text-[#8a7562]">
            { t("noResults") }
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
