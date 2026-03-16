import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import BlogPostsSection from "@/components/blog/BlogPostsSection";
import { blogHeroConfig } from "@/lib/section-config";
import { routing, type AppLocale } from "@/i18n/routing";
import { listPublicBlogCardsSafe } from "@/lib/public-blog-data";

type BlogPageProps = {
  params: Promise<{ locale: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "meta.blog" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const blogPostsResult = await listPublicBlogCardsSafe({locale});

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...blogHeroConfig} />
      <BlogPostsSection
        locale={ locale }
        posts={ blogPostsResult.posts }
        didFail={ blogPostsResult.didFail }
      />
      <Footer />
    </div>
  );
}
