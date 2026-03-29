"use client";

import {useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/routing";
import NotFound from "@/app/not-found";
import Footer from "@/components/layout/Footer";
import BlogPostArticle from "@/components/blog/BlogPostArticle";
import BlogPostShareLinks from "@/components/blog/BlogPostShareLinks";
import BlogRecentPostsSection from "@/components/blog/BlogRecentPostsSection";
import {getPathname} from "@/i18n/navigation";
import {getPublicBlogDetailClient, getRecentPublicBlogPostsClient} from "@/lib/public-blog-client";
import {
  buildBlogMetadataDescription,
  type PublicBlogCard,
  type PublicBlogDetail,
} from "@/lib/public-blog-model";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";

type PublicBlogPostDetailPageClientProps = {
  locale: AppLocale;
  slug: string;
};

export default function PublicBlogPostDetailPageClient({
  locale,
  slug,
}: PublicBlogPostDetailPageClientProps) {
  const tBlogPost = useTranslations("blogPost");
  const tBlogPage = useTranslations("blogPage");
  const [post, setPost] = useState<PublicBlogDetail | null>(null);
  const [recentPosts, setRecentPosts] = useState<PublicBlogCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      setIsMissing(false);

      try {
        const [nextPost, nextRecentPosts] = await Promise.all([
          getPublicBlogDetailClient({locale, slug}),
          getRecentPublicBlogPostsClient({locale, excludeSlug: slug, limit: 3}),
        ]);

        if (!nextPost) {
          setIsMissing(true);
          setPost(null);
          setRecentPosts([]);
          return;
        }

        setPost(nextPost);
        setRecentPosts(nextRecentPosts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load this blog post.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale, slug]);

  useEffect(() => {
    if (!post) {
      return;
    }

    document.title = post.seoTitle ?? `${post.title} | Walk and Tour Copenhagen`;

    const description =
      post.seoDescription ?? buildBlogMetadataDescription(post.excerpt, post.contentText);
    let descriptionTag = document.querySelector('meta[name="description"]');

    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute("content", description);
  }, [post]);

  if (isLoading) {
    return <PublicLoadingState label="Loading blog post..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  if (isMissing || !post) {
    return <NotFound/>;
  }

  const postHref = getPathname({locale, href: "/post"});
  const shareUrl = typeof window === "undefined"
    ? `${postHref}/${post.slug}`
    : window.location.href;

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <a
            href={postHref}
            className="inline-flex items-center text-base font-semibold uppercase tracking-wide text-[#c24343] transition-colors hover:text-[#2a221a]"
          >
            {tBlogPost("backToBlog")}
          </a>

          <div className="mx-auto mt-10 w-full max-w-7xl rounded-3xl border border-[#e8dfd4] bg-white px-6 py-2 lg:px-24">
            <div className="mt-12">
              <BlogPostArticle
                contentHtml={post.contentHtml}
                contentText={post.contentText}
                locale={locale}
                publishedDate={post.publishedDate}
                publishedLabel={tBlogPost("publishedOn")}
                summary={null}
                title={post.title}
                updatedDate={post.updatedDate}
                updatedLabel={tBlogPost("updatedOn")}
                viewCount={post.viewCount}
                viewsLabel={tBlogPost("views")}
              />
            </div>

            { post.tagLabels.length > 0 ? (
              <div className="border-t border-[#e8dfd4] mt-6 py-6">
                <div className="flex flex-wrap gap-2">
                  { post.tagLabels.map((tag) => (
                    <a
                      key={ tag.key }
                      href={ `${ getPathname({ locale, href: "/post" }) }?tags=${ encodeURIComponent(tag.key) }` }
                      className="rounded-full border border-[#d8c8b7] bg-[#fcfaf6] px-4 py-1.5 text-sm font-medium text-[#5b4d3c] transition-colors hover:border-[#2b666d] hover:bg-[#2b666d] hover:text-white no-underline"
                    >
                      { tag.label }
                    </a>
                  )) }
                </div>
              </div>
            ) : null }

            <div className="border-t border-[#e8dfd4] mt-6 py-6">
              <BlogPostShareLinks
                title={post.title}
                shareUrl={shareUrl}
                labels={{
                  title: tBlogPost("share"),
                  copyLink: tBlogPost("copyLink"),
                  copied: tBlogPost("copied"),
                  facebook: tBlogPost("shareFacebook"),
                  x: tBlogPost("shareX"),
                  linkedin: tBlogPost("shareLinkedIn"),
                  whatsapp: tBlogPost("shareWhatsApp"),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <BlogRecentPostsSection
        locale={locale}
        posts={recentPosts}
        title={tBlogPost("latestPosts")}
        readMoreLabel={tBlogPage("readMore")}
        viewsLabel={tBlogPage("views")}
      />

      <Footer/>
    </div>
  );
}
