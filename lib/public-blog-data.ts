import "server-only";

import type { AppLocale } from "@/i18n/routing";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import type { components } from "@/lib/api/generated/backend-types";
import { createPublicApi } from "@/lib/api/public";

export type PublicBlogResponse = components["schemas"]["PublicBlogResponseDto"];
export type PublicBlogTag = {
  key: string;
  label: string;
};
export type PublicBlogCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  publishedDate: string;
  viewCount: number;
  tagLabels: PublicBlogTag[];
};
export type PublicBlogDetail = PublicBlogCard & {
  updatedDate: string | null;
  contentHtml: string;
  contentText: string;
  seoTitle: string | null;
  seoDescription: string | null;
};
export type PublicBlogListResult = {
  posts: PublicBlogCard[];
  didFail: boolean;
};

const PUBLIC_BLOG_REVALIDATE_SECONDS = 300;
const EXCERPT_MAX_LENGTH = 200;

const createCachedPublicApi = () => createPublicApi({revalidate: PUBLIC_BLOG_REVALIDATE_SECONDS});

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const stripHtml = (text: string): string => (
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const truncateText = (text: string, maxLength = EXCERPT_MAX_LENGTH): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${ text.slice(0, Math.max(0, maxLength - 1)).trimEnd() }…`;
};

const comparePublishedDateDesc = (left: PublicBlogResponse, right: PublicBlogResponse) => (
  new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
);

const normalizeTag = (tag: PublicBlogResponse["tags"][number]): PublicBlogTag => ({
  key: tag.key,
  label: asString(tag.label).trim() || tag.key,
});

const normalizeBlogCard = (post: PublicBlogResponse): PublicBlogCard => {
  const bodyText = stripHtml(asString(post.translation.htmlContent));
  const excerptSource = asString(post.translation.summary).trim();
  const title = asString(post.translation.title).trim() || post.slug;

  return {
    id: post.id,
    slug: post.slug,
    title,
    excerpt: excerptSource || truncateText(bodyText),
    coverImageUrl: post.heroMedia?.contentUrl ?? null,
    coverImageAlt: title,
    publishedDate: post.publishedAt,
    viewCount: post.translation.viewCount,
    tagLabels: post.tags.map(normalizeTag),
  };
};

const normalizeBlogDetail = (post: PublicBlogResponse): PublicBlogDetail => {
  const card = normalizeBlogCard(post);
  const contentHtml = asString(post.translation.htmlContent).trim();

  return {
    ...card,
    updatedDate: null,
    contentHtml,
    contentText: stripHtml(contentHtml),
    seoTitle: asString(post.translation.seoTitle).trim() || null,
    seoDescription: asString(post.translation.seoDescription).trim() || null,
  };
};

export const listPublicBlogCards = async ({locale}: { locale: AppLocale; }): Promise<PublicBlogCard[]> => {
  const api = createCachedPublicApi();
  const posts = await api.getBlogPosts({locale});

  return [...posts]
    .sort(comparePublishedDateDesc)
    .map(normalizeBlogCard);
};

export const listPublicBlogCardsSafe = async ({locale}: { locale: AppLocale; }): Promise<PublicBlogListResult> => {
  try {
    return {
      posts: await listPublicBlogCards({locale}),
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

export const getPublicBlogDetail = async ({
  locale,
  slug,
}: {
  locale: AppLocale;
  slug: string;
}): Promise<PublicBlogDetail | null> => {
  const api = createCachedPublicApi();

  try {
    const post = await api.getBlogPostBySlug({locale, slug});
    return normalizeBlogDetail(post);
  } catch (error) {
    if (isBackendApiError(error) && error.statusCode === 404) {
      return null;
    }

    throw error;
  }
};

export const getRecentPublicBlogPosts = async ({
  locale,
  excludeSlug,
  limit = 3,
}: {
  locale: AppLocale;
  excludeSlug: string;
  limit?: number;
}): Promise<PublicBlogCard[]> => {
  if (limit <= 0) {
    return [];
  }

  const posts = await listPublicBlogCards({locale});
  return posts.filter((post) => post.slug !== excludeSlug).slice(0, limit);
};
