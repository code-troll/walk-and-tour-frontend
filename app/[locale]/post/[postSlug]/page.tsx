import { notFound } from "next/navigation";
import PublicBlogPostDetailPageClient from "@/components/public/PublicBlogPostDetailPageClient";
import { type AppLocale, routing } from "@/i18n/routing";

type BlogPostDetailPageProps = {
  params: Promise<{ locale: string; postSlug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

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
