import { NextRequest, NextResponse } from "next/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { getBlogPostBySlug, notifyBlogPostRead } from "@/lib/wix/blog-client";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const requestBuckets = new Map<string, { count: number; resetAt: number; }>();

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const isValidSlug = (slug: string): boolean => (
  /^[a-z0-9-]+$/i.test(slug)
);

const asString = (value: unknown): string | null => (
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
);

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

export async function POST(request: NextRequest) {
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

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const record = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : null;

  const locale = asString(record?.locale);
  const slug = asString(record?.slug);

  if (!locale || !isValidLocale(locale)) {
    return NextResponse.json(
      { error: "Invalid locale" },
      { status: 400 },
    );
  }

  if (!slug || !isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Invalid slug" },
      { status: 400 },
    );
  }

  try {
    const post = await getBlogPostBySlug({locale, slug});

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 },
      );
    }

    const result = await notifyBlogPostRead({
      postId: post.id,
      slug: post.slug,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Blog read notification failed", error);

    const detail = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      process.env.NODE_ENV === "production"
        ? { error: "Unable to notify read" }
        : {
          error: "Unable to notify read",
          detail,
        },
      { status: 502 },
    );
  }
}
