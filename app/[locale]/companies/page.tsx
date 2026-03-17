import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CompanyExperiencesClient from "@/components/public/CompanyExperiencesClient";
import { companiesHeroConfig } from "@/lib/section-config";
import { type AppLocale, routing } from "@/i18n/routing";

type CompaniesPageProps = {
  params: Promise<{ locale: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function CompaniesPage({params}: CompaniesPageProps) {
  const {locale} = await params;

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...companiesHeroConfig} />
      { isValidLocale(locale) ? <CompanyExperiencesClient locale={ locale } /> : null }
      <Footer />
    </div>
  );
}
