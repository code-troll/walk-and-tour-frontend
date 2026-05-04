import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import WorkWithUsSection from "@/components/work-with-us/WorkWithUsSection";
import { type AppLocale, routing } from "@/i18n/routing";

type WorkWithUsPageProps = {
  params: Promise<{ locale: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: WorkWithUsPageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.workWithUs"});

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: locale === routing.defaultLocale ? "/work-with-us" : `/${locale}/work-with-us`,
      siteName: "Walk and Tour Copenhagen",
      locale,
      type: "website",
      images: ["/walkandtour/branding/logo-transparent.png"],
    },
  };
}

export default async function WorkWithUsPage({params}: WorkWithUsPageProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <WorkWithUsSection />
      <Footer />
    </div>
  );
}
