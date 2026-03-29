import type {components} from "@/lib/api/generated/backend-types";

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
  cardTag: string | null;
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

const EXCERPT_MAX_LENGTH = 200;

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const stripHtml = (text: string): string =>
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateText = (text: string, maxLength = EXCERPT_MAX_LENGTH): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

export const comparePublishedDateDesc = (left: PublicBlogResponse, right: PublicBlogResponse) =>
  new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();

const normalizeTag = (tag: PublicBlogResponse["tags"][number]): PublicBlogTag => ({
  key: tag.key,
  label: asString(tag.label).trim() || tag.key,
});

const resolveCardTag = (post: PublicBlogResponse): string | null => {
  if (post.cardTagKey) {
    const matched = post.tags.find((tag) => tag.key === post.cardTagKey);
    const label = matched ? asString(matched.label).trim() : "";
    if (label) {
      return label;
    }
  }

  const firstTag = post.tags[0];
  return firstTag ? asString(firstTag.label).trim() || null : null;
};

export const normalizeBlogCard = (post: PublicBlogResponse): PublicBlogCard => {
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
    cardTag: resolveCardTag(post),
    tagLabels: post.tags.map(normalizeTag),
  };
};

export const normalizeBlogDetail = (post: PublicBlogResponse): PublicBlogDetail => {
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

export const buildBlogMetadataDescription = (excerpt: string, contentText: string): string => {
  const candidate = excerpt.trim() || contentText.trim();

  if (candidate.length <= 160) {
    return candidate;
  }

  return `${candidate.slice(0, 159).trimEnd()}…`;
};

export const localizeRecentPosts = ({
  excludeSlug,
  limit = 3,
  posts,
}: {
  posts: PublicBlogCard[];
  excludeSlug: string;
  limit?: number;
}) => {
  if (limit <= 0) {
    return [];
  }

  return posts.filter((post) => post.slug !== excludeSlug).slice(0, limit);
};

export const sortAndNormalizeBlogCards = ({
  posts,
}: {
  posts: PublicBlogResponse[];
}) => [...posts].sort(comparePublishedDateDesc).map(normalizeBlogCard);
