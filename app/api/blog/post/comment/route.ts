import { NextRequest, NextResponse } from "next/server";

import { routing, type AppLocale } from "@/i18n/routing";
import { submitBlogComment } from "@/lib/wix/blog-client";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestBuckets = new Map<string, { count: number; resetAt: number; }>();

const MIN_COMMENT_LENGTH = 5;
const MAX_COMMENT_LENGTH = 3_000;
const MAX_NAME_LENGTH = 120;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const name = asString(record?.name);
  const email = asString(record?.email);
  const content = asString(record?.content);

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

  if (!name || name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: "Invalid name" },
      { status: 400 },
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 },
    );
  }

  if (!content || content.length < MIN_COMMENT_LENGTH || content.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: "Invalid comment content" },
      { status: 400 },
    );
  }

  try {
    const result = await submitBlogComment({
      locale,
      slug,
      name,
      email,
      content,
    });

    if (!result.success) {
      return NextResponse.json(
        process.env.NODE_ENV === "production"
          ? { error: "Unable to submit comment" }
          : {
            error: "Unable to submit comment",
            detail: result.error,
          },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        commentId: result.commentId,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("Create blog comment failed", error);

    const detail = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      process.env.NODE_ENV === "production"
        ? { error: "Unable to submit comment" }
        : {
          error: "Unable to submit comment",
          detail,
        },
      { status: 502 },
    );
  }
}
