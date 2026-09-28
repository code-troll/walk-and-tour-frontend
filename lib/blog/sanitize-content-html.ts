import { readBlogBookingWidgetBlock, renderBlogBookingWidgetMarkup } from "@/lib/blog/booking-widget-block";

const ALLOWED_FRAME_HOSTS = new Set([
  "youtube.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "instagram.com",
  "tiktok.com",
  "google.com",
  "maps.google.com",
  "turitop.com",
  "walkandtour.dk",
]);

const EMBED_BLOCK_PATTERNS = [
  /<div\b[^>]*data-blog-video="true"[^>]*>[\s\S]*?<\/div>/gi,
  /<div\b[^>]*data-blog-embed="true"[^>]*>[\s\S]*?<\/div>/gi,
  /<div\b[^>]*data-blog-booking-widget="true"[^>]*><\/div>/gi,
  /<div\b[^>]*data-blog-turitop="true"[^>]*><\/div>/gi,
  /<div\b[^>]*data-blog-tour-card="true"[^>]*><\/div>/gi,
  /<a\b[^>]*data-blog-link-card="true"[^>]*>[\s\S]*?<\/a>/gi,
];

const normalizeHostname = (hostname: string) =>
  hostname.toLowerCase().replace(/^www\./, "");

const extractAttribute = (markup: string, attributeName: string) => {
  const doubleQuotedMatch = markup.match(new RegExp(`${ attributeName }\\s*=\\s*"([^"]*)"`, "i"));
  if (doubleQuotedMatch?.[1]) {
    return doubleQuotedMatch[1];
  }

  const singleQuotedMatch = markup.match(new RegExp(`${ attributeName }\\s*=\\s*'([^']*)'`, "i"));
  return singleQuotedMatch?.[1] ?? null;
};

const decodeAttributeValue = (value: string) =>
  value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const isSafeHttpUrl = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isAllowedFrameSrc = (value: string | null | undefined) => {
  if (!isSafeHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value as string);
    const hostname = normalizeHostname(url.hostname);
    return ALLOWED_FRAME_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

const isSafeAllowedBlock = (markup: string) => {
  if (markup.includes("data-blog-video=\"true\"") || markup.includes("data-blog-embed=\"true\"")) {
    return isAllowedFrameSrc(extractAttribute(markup, "src"));
  }

  if (markup.includes("data-blog-tour-card=\"true\"")) {
    const tourSlug = extractAttribute(markup, "data-tour-slug");
    return Boolean(tourSlug);
  }

  if (markup.includes("data-blog-link-card=\"true\"")) {
    return isSafeHttpUrl(extractAttribute(markup, "href"));
  }

  return false;
};

const isBookingWidgetMarkup = (markup: string) =>
  markup.includes("data-blog-booking-widget=\"true\"") || markup.includes("data-blog-turitop=\"true\"");

// Booking widgets are rebuilt rather than kept as written, so only the
// attributes the block defines survive, in the current markup even for posts
// saved with the Turitop-only one.
const toSafeBookingWidgetMarkup = (markup: string) => {
  const block = readBlogBookingWidgetBlock((name) => {
    const value = extractAttribute(markup, name);
    return value === null ? null : decodeAttributeValue(value);
  });

  return block ? renderBlogBookingWidgetMarkup(block) : null;
};

const preserveAllowedBlocks = (html: string) => {
  const preservedBlocks: string[] = [];
  let nextHtml = html;

  EMBED_BLOCK_PATTERNS.forEach((pattern) => {
    nextHtml = nextHtml.replace(pattern, (match) => {
      const safeBlock = isBookingWidgetMarkup(match)
        ? toSafeBookingWidgetMarkup(match)
        : isSafeAllowedBlock(match) ? match : null;
      if (!safeBlock) {
        return "";
      }

      const token = `__BLOG_EMBED_BLOCK_${ preservedBlocks.length }__`;
      preservedBlocks.push(safeBlock);
      return token;
    });
  });

  return { html: nextHtml, preservedBlocks };
};

export const sanitizeBlogContentHtml = (html: string) => {
  const { html: htmlWithPlaceholders, preservedBlocks } = preserveAllowedBlocks(html);

  const sanitized = htmlWithPlaceholders
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|form|input|button|textarea|select|meta|link)>/gi, "")
    .replace(/<(iframe|object|embed|form|input|button|textarea|select|meta|link)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");

  return preservedBlocks.reduce(
    (result, block, index) => result.replace(`__BLOG_EMBED_BLOCK_${ index }__`, block),
    sanitized,
  );
};
