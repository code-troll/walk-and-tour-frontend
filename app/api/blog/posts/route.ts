import { NextRequest, NextResponse } from "next/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { listBlogPosts } from "@/lib/wix/blog-client";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 24;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 80;

const requestBuckets = new Map<string, { count: number; resetAt: number; }>();

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const parsePositiveInteger = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const resolveClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
};

const checkRateLimit = (key: string): { allowed: true; } | { allowed: false; retryAfterSeconds: number; } => {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {allowed: true};
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = Math.max(0, bucket.resetAt - now);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);

  return {allowed: true};
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  if (!localeParam || !isValidLocale(localeParam)) {
    return NextResponse.json(
      { error: "Invalid locale parameter" },
      { status: 400 },
    );
  }

  const parsedPage = parsePositiveInteger(pageParam);
  if (pageParam !== null && parsedPage === null) {
    return NextResponse.json(
      { error: "Invalid page parameter" },
      { status: 400 },
    );
  }

  const parsedLimit = parsePositiveInteger(limitParam);
  if (limitParam !== null && parsedLimit === null) {
    return NextResponse.json(
      { error: "Invalid limit parameter" },
      { status: 400 },
    );
  }

  const page = parsedPage ?? DEFAULT_PAGE;
  const limit = Math.min(parsedLimit ?? DEFAULT_LIMIT, MAX_LIMIT);

  const rateLimitKey = resolveClientIp(request);
  const rateLimitStatus = checkRateLimit(rateLimitKey);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const posts = await listBlogPosts({
      locale: localeParam,
      page,
      limit,
    });

    return NextResponse.json(posts, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Wix blog listing failed", error);

    const detail =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      process.env.NODE_ENV === "production"
        ? { error: "Unable to fetch blog posts at the moment" }
        : {
          error: "Unable to fetch blog posts at the moment",
          detail,
        },
      { status: 502 },
    );
  }
}
