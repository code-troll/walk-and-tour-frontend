import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import PrivacyPolicySection from "@/components/privacy-policy/PrivacyPolicySection";
import HeroSection from "@/components/sections/HeroSection";
import { type AppLocale, routing } from "@/i18n/routing";
import { privacyPolicyHeroConfig } from "@/lib/section-config";

type PrivacyPolicyPageProps = {
  params: Promise<{ locale: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: PrivacyPolicyPageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.privacyPolicy"});

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPolicyPage({params}: PrivacyPolicyPageProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection { ...privacyPolicyHeroConfig } />
      <PrivacyPolicySection />
      <Footer />
    </div>
  );
}
