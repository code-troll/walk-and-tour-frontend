import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import ContactPageSection from "@/components/contact/ContactPageSection";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import { type AppLocale, routing } from "@/i18n/routing";
import { contactHeroConfig } from "@/lib/section-config";

type ContactPageProps = {
  params: Promise<{ locale: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: ContactPageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.contact"});

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: locale === routing.defaultLocale ? "/contact" : `/${locale}/contact`,
      siteName: "Walk and Tour Copenhagen",
      locale,
      type: "website",
      images: ["/walkandtour/branding/logo-transparent.png"],
    },
  };
}

export default async function ContactPage({params}: ContactPageProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection { ...contactHeroConfig } />
      <ContactPageSection/>
      <Footer/>
    </div>
  );
}
