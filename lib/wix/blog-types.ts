import type { AppLocale } from "@/i18n/routing";
import type { WixRichContent } from "@/lib/wix/rich-content/types";

export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  publishedDate: string | null;
  href: string | null;
  views: number | null;
  comments: number | null;
};

export type BlogPostsPagination = {
  page: number;
  limit: number;
  hasNextPage: boolean;
  total: number | null;
};

export type BlogPostsResponse = {
  items: BlogPostListItem[];
  pagination: BlogPostsPagination;
};

export type BlogPostsQuery = {
  locale: AppLocale;
  page: number;
  limit: number;
};

export type BlogPostDetail = {
  id: string;
  referenceId: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  publishedDate: string | null;
  updatedDate: string | null;
  richContent: WixRichContent | null;
  contentHtml: string | null;
  contentText: string;
  href: string | null;
  views: number | null;
  comments: number | null;
};

export type BlogCommentInput = {
  locale: AppLocale;
  slug: string;
  name: string;
  email: string;
  content: string;
};

export type BlogCommentSubmitResult = {
  success: boolean;
  commentId: string | null;
  error: string | null;
};

export type BlogReadNotificationResult = {
  attempted: boolean;
  supported: boolean;
  success: boolean;
};
