import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import TermsOfUseSection from "@/components/terms-of-use/TermsOfUseSection";
import {routing, type AppLocale} from "@/i18n/routing";
import {termsOfUseHeroConfig} from "@/lib/section-config";

type TermsOfUsePageProps = {
  params: Promise<{locale: string}>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: TermsOfUsePageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.termsOfUse"});

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TermsOfUsePage({params}: TermsOfUsePageProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...termsOfUseHeroConfig} />
      <TermsOfUseSection />
      <Footer />
    </div>
  );
}
