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
  "staging.walkandtour.dk",
]);

const EMBED_BLOCK_PATTERNS = [
  /<div\b[^>]*data-blog-video="true"[^>]*>[\s\S]*?<\/div>/gi,
  /<div\b[^>]*data-blog-embed="true"[^>]*>[\s\S]*?<\/div>/gi,
  /<div\b[^>]*data-blog-turitop="true"[^>]*><\/div>/gi,
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

  if (markup.includes("data-blog-turitop=\"true\"")) {
    const service = extractAttribute(markup, "data-service");
    const language = extractAttribute(markup, "data-lang");
    const embed = extractAttribute(markup, "data-embed");

    return Boolean(service && language && embed === "box");
  }

  if (markup.includes("data-blog-link-card=\"true\"")) {
    return isSafeHttpUrl(extractAttribute(markup, "href"));
  }

  return false;
};

const preserveAllowedBlocks = (html: string) => {
  const preservedBlocks: string[] = [];
  let nextHtml = html;

  EMBED_BLOCK_PATTERNS.forEach((pattern) => {
    nextHtml = nextHtml.replace(pattern, (match) => {
      if (!isSafeAllowedBlock(match)) {
        return "";
      }

      const token = `__BLOG_EMBED_BLOCK_${ preservedBlocks.length }__`;
      preservedBlocks.push(match);
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
