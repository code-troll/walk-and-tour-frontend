import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import BookTourSection from "@/components/book-tour/BookTourSection";
import Footer from "@/components/layout/Footer";
import { type AppLocale, routing } from "@/i18n/routing";

type BookTourPageProps = {
  params: Promise<{ locale: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: BookTourPageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.bookTour"});

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BookTourPage({params}: BookTourPageProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <BookTourSection />
      <Footer />
    </div>
  );
}
