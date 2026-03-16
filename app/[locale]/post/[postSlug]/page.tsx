import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import BlogPostContent from "@/components/blog/BlogPostContent";
import BlogPostShareLinks from "@/components/blog/BlogPostShareLinks";
import BlogRecentPostsSection from "@/components/blog/BlogRecentPostsSection";
import { getPathname } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import BlogPostMetaTopBar from "@/components/blog/BlogPostMetaTopBar";
import { getPublicBlogDetail, getRecentPublicBlogPosts } from "@/lib/public-blog-data";

type BlogPostDetailPageProps = {
  params: Promise<{ locale: string; postSlug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const buildMetadataDescription = (excerpt: string, contentText: string): string => {
  const candidate = excerpt.trim() || contentText.trim();

  if (candidate.length <= 160) {
    return candidate;
  }

  return `${ candidate.slice(0, 159).trimEnd() }…`;
};

export async function generateMetadata({
                                         params,
                                       }: BlogPostDetailPageProps): Promise<Metadata> {
  const {locale, postSlug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const post = await getPublicBlogDetail({locale, slug: postSlug});
  if (!post) {
    return {};
  }

  const metadataTitle = post.seoTitle ?? `${ post.title } | Walk and Tour Copenhagen`;
  const metadataDescription = post.seoDescription ?? buildMetadataDescription(post.excerpt, post.contentText);
  return {
    title: metadataTitle,
    description: metadataDescription,
    openGraph: {
      title: metadataTitle,
      description: metadataDescription,
      type: "article",
      images: post.coverImageUrl ? [{url: post.coverImageUrl}] : undefined,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title: metadataTitle,
      description: metadataDescription,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostDetailPage({
                                                   params,
                                                 }: BlogPostDetailPageProps) {
  const {locale, postSlug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const [post, recentPosts, tBlogPost, tBlogPage] = await Promise.all([
    getPublicBlogDetail({locale, slug: postSlug}),
    getRecentPublicBlogPosts({locale, excludeSlug: postSlug, limit: 3}),
    getTranslations({locale, namespace: "blogPost"}),
    getTranslations({locale, namespace: "blogPage"}),
  ]);

  if (!post) {
    notFound();
  }

  const postHref = getPathname({locale, href: "/post"});
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const shareUrl = host
    ? `${ protocol }://${ host }${ postHref }/${ post.slug }`
    : `${ postHref }/${ post.slug }`;

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <a
            href={ postHref }
            className="inline-flex items-center text-base font-semibold uppercase tracking-wide text-[#c24343] transition-colors hover:text-[#2a221a]"
          >
            { tBlogPost("backToBlog") }
          </a>

          <div
            className="mx-auto w-full max-w-7xl rounded-3xl border border-[#e8dfd4] bg-white px-6 py-2 lg:px-24 mt-10">

            <div className="mt-12">
              <BlogPostMetaTopBar publishedLabel={ tBlogPost("publishedOn") }
                                  updatedLabel={ tBlogPost("updatedOn") }
                                  viewsLabel={ tBlogPost("views") }
                                  publishedDate={ post.publishedDate }
                                  updatedDate={ post.updatedDate }
                                  viewCount={ post.viewCount }
                                  locale={ locale }/>

              <h1 className="mt-2 text-4xl font-semibold leading-tight text-teal sm:text-5xl">
                { post.title }
              </h1>
            </div>

            <div className="mt-8">
              <BlogPostContent
                contentHtml={ post.contentHtml }
                contentText={ post.contentText }
              />
            </div>

            <div>
              <div className="border-t border-[#e8dfd4] mt-6 py-6">
                <BlogPostShareLinks
                  title={ post.title }
                  shareUrl={ shareUrl }
                  labels={ {
                    title: tBlogPost("share"),
                    copyLink: tBlogPost("copyLink"),
                    copied: tBlogPost("copied"),
                    facebook: tBlogPost("shareFacebook"),
                    x: tBlogPost("shareX"),
                    linkedin: tBlogPost("shareLinkedIn"),
                    whatsapp: tBlogPost("shareWhatsApp"),
                  } }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlogRecentPostsSection
        locale={ locale }
        posts={ recentPosts }
        title={ tBlogPost("latestPosts") }
        readMoreLabel={ tBlogPage("readMore") }
        viewsLabel={ tBlogPage("views") }
      />

      <Footer/>
    </div>
  );
}
