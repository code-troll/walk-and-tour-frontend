"use client";

import type {AppLocale} from "@/i18n/routing";
import {fetchJson} from "@/lib/api/client-json";
import type {components} from "@/lib/api/generated/backend-types";
import {
  type PublicBlogCard,
  type PublicBlogDetail,
  type PublicBlogListResult,
  normalizeBlogDetail,
  localizeRecentPosts,
  sortAndNormalizeBlogCards,
} from "@/lib/public-blog-model";

export const listPublicBlogCardsClient = async ({locale}: {locale: AppLocale}): Promise<PublicBlogCard[]> => {
  const posts = await fetchJson<components["schemas"]["PublicBlogResponseDto"][]>({
    input: `/api/internal/public/api/public/blog-posts?locale=${locale}`,
    fallbackMessage: "Unable to load public blog posts.",
  });

  return sortAndNormalizeBlogCards({posts});
};

export const listPublicBlogCardsSafeClient = async ({
  locale,
}: {
  locale: AppLocale;
}): Promise<PublicBlogListResult> => {
  try {
    return {
      posts: await listPublicBlogCardsClient({locale}),
      didFail: false,
    };
  } catch (error) {
    console.error("Unable to load public blog posts", error);
    return {
      posts: [],
      didFail: true,
    };
  }
};

export const getPublicBlogDetailClient = async ({
  locale,
  slug,
}: {
  locale: AppLocale;
  slug: string;
}): Promise<PublicBlogDetail | null> => {
  const post = await fetchJson<components["schemas"]["PublicBlogResponseDto"] | null>({
    input: `/api/internal/public/api/public/blog-posts/${slug}?locale=${locale}`,
    fallbackMessage: "Unable to load the public blog post.",
    notFoundFallback: null,
  });

  return post ? normalizeBlogDetail(post) : null;
};

export const getRecentPublicBlogPostsClient = async ({
  locale,
  excludeSlug,
  limit = 3,
}: {
  locale: AppLocale;
  excludeSlug: string;
  limit?: number;
}) => {
  const posts = await listPublicBlogCardsClient({locale});
  return localizeRecentPosts({excludeSlug, limit, posts});
};
