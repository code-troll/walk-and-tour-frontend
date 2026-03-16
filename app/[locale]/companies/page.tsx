import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CompaniesExperiencesSection from "@/components/companies/CompaniesExperiencesSection";
import { companiesHeroConfig } from "@/lib/section-config";
import { type AppLocale, routing } from "@/i18n/routing";
import { getExpectedTourTypesForCompanyTours, listPublicTourCardsSafe } from "@/lib/public-tour-data";

type CompaniesPageProps = {
  params: Promise<{ locale: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function CompaniesPage({params}: CompaniesPageProps) {
  const {locale} = await params;
  const experiences = isValidLocale(locale)
    ? await listPublicTourCardsSafe({
        locale,
        tourTypes: getExpectedTourTypesForCompanyTours(),
      })
    : [];

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...companiesHeroConfig} />
      <CompaniesExperiencesSection experiences={ experiences } />
      <Footer />
    </div>
  );
}
