"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import BlogPostsSection from "@/components/blog/BlogPostsSection";
import {listPublicBlogCardsSafeClient} from "@/lib/public-blog-client";
import type {PublicBlogListResult} from "@/lib/public-blog-model";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";

export default function PublicBlogPostsClient({locale}: {locale: AppLocale}) {
  const [result, setResult] = useState<PublicBlogListResult>({posts: [], didFail: false});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        setResult(await listPublicBlogCardsSafeClient({locale}));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load blog posts.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale]);

  if (isLoading) {
    return <PublicLoadingState label="Loading blog posts..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  return <BlogPostsSection locale={locale} posts={result.posts} didFail={result.didFail}/>;
}
