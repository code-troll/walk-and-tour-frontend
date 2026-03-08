"use client";

import { useEffect } from "react";

import type { AppLocale } from "@/i18n/routing";

type BlogPostReadNotifierProps = {
  locale: AppLocale;
  slug: string;
};

export default function BlogPostReadNotifier({
                                               locale,
                                               slug,
                                             }: BlogPostReadNotifierProps) {
  useEffect(() => {
    void fetch("/api/blog/post/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({locale, slug}),
      keepalive: true,
      cache: "no-store",
    });
  }, [locale, slug]);

  return null;
}
