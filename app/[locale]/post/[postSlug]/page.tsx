import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBlogPostDetailPageClient from "@/components/public/PublicBlogPostDetailPageClient";
import { type AppLocale, routing } from "@/i18n/routing";
import { getPublicBlogDetail } from "@/lib/public-blog-data";
import { buildBlogMetadataDescription } from "@/lib/public-blog-model";

type BlogPostDetailPageProps = {
  params: Promise<{ locale: string; postSlug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: BlogPostDetailPageProps): Promise<Metadata> {
  const {locale, postSlug} = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const post = await getPublicBlogDetail({locale, slug: postSlug});

  if (!post) {
    return {};
  }

  const title = post.seoTitle ?? `${post.title} | Walk and Tour Copenhagen`;
  const description = post.seoDescription ?? buildBlogMetadataDescription(post.excerpt, post.contentText);
  const images = post.coverImageUrl
    ? [post.coverImageUrl]
    : ["/walkandtour/branding/logo-transparent.png"];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}/post/${postSlug}`,
      type: "article",
      siteName: "Walk and Tour Copenhagen",
      locale,
      images,
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

  return (
    <PublicBlogPostDetailPageClient locale={ locale } slug={ postSlug } />
  );
}
