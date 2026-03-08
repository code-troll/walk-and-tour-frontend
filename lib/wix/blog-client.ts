import "server-only";

import type { AppLocale } from "@/i18n/routing";
import type {
  BlogCommentInput,
  BlogCommentSubmitResult,
  BlogPostDetail,
  BlogPostListItem,
  BlogPostsQuery,
  BlogPostsResponse,
  BlogReadNotificationResult,
} from "@/lib/wix/blog-types";
import type { WixRichContent } from "@/lib/wix/rich-content/types";

type UnknownRecord = Record<string, unknown>;

type WixContext = {
  apiKey: string;
  siteId: string;
  queryEndpoint: string;
  postBySlugBaseUrl: string;
  metricsBaseUrl: string;
  commentsEndpoint: string;
  commentsAppId: string;
};

const DEFAULT_WIX_BLOG_QUERY_URL = "https://www.wixapis.com/v3/posts/query";
const DEFAULT_WIX_BLOG_POST_BY_SLUG_BASE_URL = "https://www.wixapis.com/v3/posts/slugs";
const DEFAULT_WIX_BLOG_METRICS_BASE_URL = "https://www.wixapis.com/v3/posts";
const DEFAULT_WIX_COMMENTS_ENDPOINT = "https://www.wixapis.com/comments/v1/comments";
const DEFAULT_WIX_BLOG_COMMENTS_APP_ID = "14bcded7-0066-7c35-14d7-466cb3f09103";
const DEFAULT_PAGE_LIMIT = 9;

const asRecord = (value: unknown): UnknownRecord | null => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null
);

const asString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asBoolean = (value: unknown): boolean | null => (
  typeof value === "boolean" ? value : null
);

const asNumber = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const asInteger = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return null;
};

const getByPath = (record: UnknownRecord, path: readonly string[]): unknown => (
  path.reduce<unknown>((acc, part) => {
    const accRecord = asRecord(acc);
    if (!accRecord) {
      return null;
    }

    return accRecord[part];
  }, record)
);

const firstStringAtPaths = (record: UnknownRecord, paths: readonly (readonly string[])[]): string | null => {
  for (const path of paths) {
    const value = asString(getByPath(record, path));
    if (value) {
      return value;
    }
  }

  return null;
};

const firstIntegerAtPaths = (record: UnknownRecord, paths: readonly (readonly string[])[]): number | null => {
  for (const path of paths) {
    const value = asInteger(getByPath(record, path));
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const stripHtml = (text: string): string => (
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const truncateText = (text: string, maxLength = 200): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${ text.slice(0, Math.max(0, maxLength - 1)).trimEnd() }…`;
};

const toSafeUrl = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

const toPublicWixImageUrl = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const direct = toSafeUrl(value);
  if (direct) {
    return direct;
  }

  const wixImageMatch = value.match(/^wix:image:\/\/v1\/([^/]+)/i);
  if (wixImageMatch?.[1]) {
    return `https://static.wixstatic.com/media/${ wixImageMatch[1] }`;
  }

  const imageMatch = value.match(/^image:\/\/v1\/([^/]+)/i);
  if (imageMatch?.[1]) {
    return `https://static.wixstatic.com/media/${ imageMatch[1] }`;
  }

  return null;
};

const extractImageUrl = (post: UnknownRecord): string | null => {
  const imageCandidate = firstStringAtPaths(post, [
    ["coverImageUrl"],
    ["image", "url"],
    ["image", "uri"],
    ["coverImage", "url"],
    ["coverImage", "uri"],
    ["media", "image", "url"],
    ["media", "image", "uri"],
    ["media", "wixMedia", "image", "url"],
    ["media", "wixMedia", "image", "uri"],
    ["heroImage", "url"],
    ["heroImage", "uri"],
  ]);

  return toPublicWixImageUrl(imageCandidate);
};

const extractImageAlt = (post: UnknownRecord, fallback: string): string => (
  firstStringAtPaths(post, [
    ["image", "altText"],
    ["coverImage", "altText"],
    ["media", "image", "altText"],
    ["media", "wixMedia", "image", "altText"],
  ]) ?? fallback
);

const resolvePostHref = (post: UnknownRecord): string | null => {
  const directHref = toSafeUrl(asString(post.url));
  if (directHref) {
    return directHref;
  }

  const urlObject = asRecord(post.url);
  if (urlObject) {
    const fullUrl = toSafeUrl(asString(urlObject.url));
    if (fullUrl) {
      return fullUrl;
    }

    const base = asString(urlObject.base);
    const path = asString(urlObject.path);
    if (base && path) {
      return toSafeUrl(`${ base.replace(/\/$/, "") }${ path.startsWith("/") ? path : `/${ path }` }`);
    }
  }

  const slug = asString(post.slug) ?? asString(post.urlSlug);
  const siteBase = asString(process.env.WIX_BLOG_SITE_BASE_URL);
  if (slug && siteBase) {
    return toSafeUrl(`${ siteBase.replace(/\/$/, "") }/${ slug }`);
  }

  return null;
};

const getRequiredEnv = (name: string): string => {
  const value = asString(process.env[name]);
  if (!value) {
    throw new Error(`Missing required environment variable: ${ name }`);
  }

  return value;
};

const getWixContext = (): WixContext => {
  const apiKey = getRequiredEnv("WIX_API_KEY");
  const siteId = getRequiredEnv("WIX_SITE_ID");

  return {
    apiKey,
    siteId,
    queryEndpoint: asString(process.env.WIX_BLOG_QUERY_URL) ?? DEFAULT_WIX_BLOG_QUERY_URL,
    postBySlugBaseUrl:
      asString(process.env.WIX_BLOG_POST_BY_SLUG_BASE_URL) ?? DEFAULT_WIX_BLOG_POST_BY_SLUG_BASE_URL,
    metricsBaseUrl: asString(process.env.WIX_BLOG_METRICS_BASE_URL) ?? DEFAULT_WIX_BLOG_METRICS_BASE_URL,
    commentsEndpoint: asString(process.env.WIX_COMMENTS_ENDPOINT) ?? DEFAULT_WIX_COMMENTS_ENDPOINT,
    commentsAppId: asString(process.env.WIX_BLOG_COMMENTS_APP_ID) ?? DEFAULT_WIX_BLOG_COMMENTS_APP_ID,
  };
};

const sanitizeHtml = (html: string): string => (
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|form|input|button|textarea|select|meta|link)>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\sstyle\s*=\s*"[^"]*"/gi, "")
    .replace(/\sstyle\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
);

const extractPostsArray = (payload: UnknownRecord): unknown[] => {
  const candidates: unknown[] = [
    payload.posts,
    payload.items,
    payload.results,
    asRecord(payload.data)?.posts,
    asRecord(payload.data)?.items,
    asRecord(payload.data)?.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const extractSinglePost = (payload: UnknownRecord): UnknownRecord | null => {
  const candidates: unknown[] = [
    payload.post,
    payload.item,
    asRecord(payload.data)?.post,
    asRecord(payload.data)?.item,
    payload,
  ];

  for (const candidate of candidates) {
    const candidateRecord = asRecord(candidate);
    if (!candidateRecord) {
      continue;
    }

    const id = asString(candidateRecord.id) ?? asString(candidateRecord._id);
    const slug = asString(candidateRecord.slug) ?? asString(candidateRecord.urlSlug);
    if (id || slug) {
      return candidateRecord;
    }
  }

  return null;
};

const extractPagination = (
  payload: UnknownRecord,
  page: number,
  limit: number,
  itemCount: number,
): BlogPostsResponse["pagination"] => {
  const pagingMetadata = asRecord(payload.pagingMetadata) ?? asRecord(payload.paging) ?? asRecord(payload.metaData);
  const total = asNumber(pagingMetadata?.total) ?? asNumber(pagingMetadata?.count) ?? null;
  const hasNextValue = asBoolean(pagingMetadata?.hasNext);
  const hasNextPage = hasNextValue ?? (
    total !== null
      ? page * limit < total
      : itemCount >= limit
  );

  return {
    page,
    limit,
    hasNextPage,
    total,
  };
};

const resolveLanguage = (locale: AppLocale): string => {
  if (locale === "es") {
    return "es";
  }

  if (locale === "it") {
    return "it";
  }

  return "en";
};

const extractMetricsFromPayload = (payload: UnknownRecord): { views: number | null; comments: number | null; } => {
  const views = firstIntegerAtPaths(payload, [
    ["viewCount"],
    ["views"],
    ["viewsCount"],
    ["metrics", "viewCount"],
    ["metrics", "views"],
    ["postMetrics", "viewCount"],
    ["postMetrics", "views"],
    ["stats", "views"],
  ]);

  const comments = firstIntegerAtPaths(payload, [
    ["commentCount"],
    ["comments"],
    ["commentsCount"],
    ["totalComments"],
    ["metrics", "commentCount"],
    ["metrics", "comments"],
    ["postMetrics", "commentCount"],
    ["postMetrics", "comments"],
    ["stats", "comments"],
  ]);

  return {
    views,
    comments,
  };
};

const fetchPostMetrics = async ({
                                  postId,
                                  apiKey,
                                  siteId,
                                  baseUrl,
                                }: {
  postId: string;
  apiKey: string;
  siteId: string;
  baseUrl: string;
}): Promise<{ views: number | null; comments: number | null; }> => {
  const metricsUrl = `${ baseUrl.replace(/\/$/, "") }/${ encodeURIComponent(postId) }/metrics`;

  const response = await fetch(metricsUrl, {
    method: "GET",
    headers: {
      "Authorization": apiKey,
      "wix-site-id": siteId,
    },
    next: {revalidate: 300},
  });

  if (!response.ok) {
    return {
      views: null,
      comments: null,
    };
  }

  const payloadUnknown = await response.json() as unknown;
  const payload = asRecord(payloadUnknown);
  if (!payload) {
    return {
      views: null,
      comments: null,
    };
  }

  return extractMetricsFromPayload(payload);
};

const collectText = (value: unknown, bucket: string[]): void => {
  if (typeof value === "string") {
    const stripped = stripHtml(value);
    if (stripped) {
      bucket.push(stripped);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, bucket));
    return;
  }

  const record = asRecord(value);
  if (!record) {
    return;
  }

  Object.values(record).forEach((item) => collectText(item, bucket));
};

const extractContentHtml = (post: UnknownRecord): string | null => {
  const candidate = firstStringAtPaths(post, [
    ["richContent", "html"],
    ["content", "html"],
    ["html"],
    ["richText", "html"],
  ]);

  if (!candidate || !candidate.includes("<")) {
    return null;
  }

  const cleaned = sanitizeHtml(candidate);
  return cleaned.length > 0 ? cleaned : null;
};

const extractContentText = (post: UnknownRecord): string => {
  const direct = firstStringAtPaths(post, [
    ["plainContent"],
    ["contentText"],
    ["excerpt"],
    ["subtitle"],
    ["richContent", "text"],
  ]);

  if (direct) {
    return stripHtml(direct);
  }

  const textParts: string[] = [];
  collectText(extractRichContent(post), textParts);
  collectText(post.content, textParts);

  return textParts.join("\n\n").trim();
};

const toRichContent = (value: unknown): WixRichContent | null => {
  const record = asRecord(value);
  if (!record || !Array.isArray(record.nodes)) {
    return null;
  }

  return record as WixRichContent;
};

const extractRichContent = (post: UnknownRecord): WixRichContent | null => {
  const candidates: unknown[] = [
    post.richContent,
    asRecord(post.data)?.richContent,
    asRecord(post.content)?.richContent,
    post.content,
  ];

  for (const candidate of candidates) {
    const richContent = toRichContent(candidate);
    if (richContent) {
      return richContent;
    }
  }

  return null;
};

const toBlogPostListItem = (value: unknown): BlogPostListItem | null => {
  const post = asRecord(value);
  if (!post) {
    return null;
  }

  const id = asString(post.id) ?? asString(post._id);
  if (!id) {
    return null;
  }

  const title = firstStringAtPaths(post, [["title"], ["seoData", "title"]]) ?? "Untitled";
  const excerptRaw = firstStringAtPaths(post, [
    ["excerpt"],
    ["subtitle"],
    ["plainContent"],
    ["seoData", "description"],
    ["contentText"],
  ]) ?? "";
  const excerpt = truncateText(stripHtml(excerptRaw), 190);
  const slug = asString(post.slug) ?? asString(post.urlSlug) ?? id;
  const publishedDate = firstStringAtPaths(post, [
    ["firstPublishedDate"],
    ["publishedDate"],
    ["createdDate"],
  ]);

  return {
    id,
    slug,
    title: stripHtml(title),
    excerpt,
    coverImageUrl: extractImageUrl(post),
    coverImageAlt: extractImageAlt(post, stripHtml(title)),
    publishedDate,
    href: resolvePostHref(post),
    views: null,
    comments: null,
  };
};

const toBlogPostDetail = (post: UnknownRecord): BlogPostDetail | null => {
  const id = asString(post.id) ?? asString(post._id);
  if (!id) {
    return null;
  }

  const title = firstStringAtPaths(post, [["title"], ["seoData", "title"]]) ?? "Untitled";
  const slug = asString(post.slug) ?? asString(post.urlSlug) ?? id;
  const excerptRaw = firstStringAtPaths(post, [
    ["excerpt"],
    ["subtitle"],
    ["seoData", "description"],
    ["plainContent"],
  ]) ?? "";
  const referenceId = firstStringAtPaths(post, [["referenceId"], ["internalId"], ["id"], ["_id"]]) ?? id;

  return {
    id,
    referenceId,
    slug,
    title: stripHtml(title),
    excerpt: truncateText(stripHtml(excerptRaw), 280),
    coverImageUrl: extractImageUrl(post),
    coverImageAlt: extractImageAlt(post, stripHtml(title)),
    publishedDate: firstStringAtPaths(post, [["firstPublishedDate"], ["publishedDate"], ["createdDate"]]),
    updatedDate: firstStringAtPaths(post, [["updatedDate"], ["lastPublishedDate"], ["lastUpdatedDate"], ["modifiedDate"]]),
    richContent: extractRichContent(post),
    contentHtml: extractContentHtml(post),
    contentText: extractContentText(post),
    href: resolvePostHref(post),
    views: null,
    comments: null,
  };
};

const fetchPostBySlugRaw = async ({
                                    slug,
                                    apiKey,
                                    siteId,
                                    baseUrl,
                                  }: {
  slug: string;
  apiKey: string;
  siteId: string;
  baseUrl: string;
}): Promise<UnknownRecord | null> => {
  const endpointUrl = new URL(baseUrl.replace(/\/$/, ""));
  endpointUrl.pathname = `${ endpointUrl.pathname.replace(/\/$/, "") }/${ encodeURIComponent(slug) }`;
  endpointUrl.searchParams.set("fieldsets", "RICH_CONTENT");

  const response = await fetch(endpointUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": apiKey,
      "wix-site-id": siteId,
    },
    next: {revalidate: 300},
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Wix Blog detail request failed with status ${ response.status }: ${ truncateText(stripHtml(errorBody), 300) }`,
    );
  }

  const payloadUnknown = await response.json() as unknown;
  const payload = asRecord(payloadUnknown);

  if (!payload) {
    throw new Error("Unexpected Wix Blog post response shape");
  }

  return extractSinglePost(payload);
};

const parseCommentId = (payload: unknown): string | null => {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }

  return firstStringAtPaths(record, [
    ["id"],
    ["comment", "id"],
    ["data", "id"],
    ["data", "comment", "id"],
  ]);
};

export async function listBlogPosts({
                                     locale,
                                     page,
                                     limit,
                                   }: BlogPostsQuery): Promise<BlogPostsResponse> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_PAGE_LIMIT;
  const offset = (safePage - 1) * safeLimit;

  const wixContext = getWixContext();

  const response = await fetch(wixContext.queryEndpoint, {
    method: "POST",
    headers: {
      "Authorization": wixContext.apiKey,
      "Content-Type": "application/json",
      "wix-site-id": wixContext.siteId,
    },
    body: JSON.stringify({
      query: {
        paging: {
          offset,
          limit: safeLimit,
        },
        sort: [
          {
            fieldName: "firstPublishedDate",
            order: "DESC",
          },
        ],
        filter: {
          language: {
            $eq: resolveLanguage(locale),
          },
        },
      },
    }),
    next: {revalidate: 300},
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Wix Blog request failed with status ${ response.status }: ${ truncateText(stripHtml(errorBody), 300) }`,
    );
  }

  const payloadUnknown = await response.json() as unknown;
  const payload = asRecord(payloadUnknown);

  if (!payload) {
    throw new Error("Unexpected Wix Blog response shape");
  }

  const items = extractPostsArray(payload)
    .map(toBlogPostListItem)
    .filter((item): item is BlogPostListItem => item !== null);

  const itemsWithMetrics = await Promise.all(
    items.map(async (item) => {
      const metrics = await fetchPostMetrics({
        postId: item.id,
        apiKey: wixContext.apiKey,
        siteId: wixContext.siteId,
        baseUrl: wixContext.metricsBaseUrl,
      });

      return {
        ...item,
        views: metrics.views,
        comments: metrics.comments,
      };
    }),
  );

  return {
    items: itemsWithMetrics,
    pagination: extractPagination(payload, safePage, safeLimit, itemsWithMetrics.length),
  };
}

export async function getBlogPostBySlug({
                                          locale,
                                          slug,
                                        }: {
  locale: AppLocale;
  slug: string;
}): Promise<BlogPostDetail | null> {
  void locale;

  const wixContext = getWixContext();

  const postRaw = await fetchPostBySlugRaw({
    slug,
    apiKey: wixContext.apiKey,
    siteId: wixContext.siteId,
    baseUrl: wixContext.postBySlugBaseUrl,
  });

  if (!postRaw) {
    return null;
  }

  const detail = toBlogPostDetail(postRaw);
  if (!detail) {
    return null;
  }

  const metrics = await fetchPostMetrics({
    postId: detail.id,
    apiKey: wixContext.apiKey,
    siteId: wixContext.siteId,
    baseUrl: wixContext.metricsBaseUrl,
  });

  return {
    ...detail,
    views: metrics.views,
    comments: metrics.comments,
  };
}

export async function getRecentBlogPosts({
                                           locale,
                                           excludeSlug,
                                           limit,
                                         }: {
  locale: AppLocale;
  excludeSlug: string;
  limit: number;
}): Promise<BlogPostListItem[]> {
  const listing = await listBlogPosts({
    locale,
    page: 1,
    limit: Math.max(limit + 3, 8),
  });

  return listing.items
    .filter((item) => item.slug !== excludeSlug)
    .slice(0, limit);
}

export async function notifyBlogPostRead({
                                           postId,
                                           slug,
                                         }: {
  postId: string;
  slug: string;
}): Promise<BlogReadNotificationResult> {
  const wixContext = getWixContext();
  const endpointTemplate = asString(process.env.WIX_BLOG_READ_ENDPOINT);

  if (!endpointTemplate) {
    return {
      attempted: true,
      supported: false,
      success: false,
    };
  }

  const endpoint = endpointTemplate
    .replace("{postId}", encodeURIComponent(postId))
    .replace("{slug}", encodeURIComponent(slug));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": wixContext.apiKey,
        "Content-Type": "application/json",
        "wix-site-id": wixContext.siteId,
      },
      body: JSON.stringify({postId, slug}),
      cache: "no-store",
    });

    return {
      attempted: true,
      supported: true,
      success: response.ok,
    };
  } catch {
    return {
      attempted: true,
      supported: true,
      success: false,
    };
  }
}

export async function submitBlogComment({
                                          locale,
                                          slug,
                                          name,
                                          email,
                                          content,
                                        }: BlogCommentInput): Promise<BlogCommentSubmitResult> {
  const wixContext = getWixContext();
  const post = await getBlogPostBySlug({locale, slug});

  if (!post) {
    return {
      success: false,
      commentId: null,
      error: "Post not found",
    };
  }

  const baseCommentPayload = {
    appId: wixContext.commentsAppId,
    contextId: post.referenceId,
    resourceId: post.referenceId,
    content: {
      text: content,
    },
    author: {
      name,
      email,
    },
  };

  const attempts: unknown[] = [
    baseCommentPayload,
    {comment: baseCommentPayload},
    {
      ...baseCommentPayload,
      content: content,
      authorInfo: {
        name,
        email,
      },
    },
  ];

  let lastError: string | null = null;

  for (const payload of attempts) {
    try {
      const response = await fetch(wixContext.commentsEndpoint, {
        method: "POST",
        headers: {
          "Authorization": wixContext.apiKey,
          "Content-Type": "application/json",
          "wix-site-id": wixContext.siteId,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!response.ok) {
        const responseText = await response.text();
        lastError = `Create comment failed (${ response.status }): ${ truncateText(stripHtml(responseText), 260) }`;
        continue;
      }

      const data = await response.json() as unknown;
      return {
        success: true,
        commentId: parseCommentId(data),
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
    }
  }

  return {
    success: false,
    commentId: null,
    error: lastError ?? "Unable to create comment",
  };
}
