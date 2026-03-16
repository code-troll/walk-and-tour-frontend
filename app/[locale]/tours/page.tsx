import ToursCatalog from "@/components/tours/ToursCatalog";
import Footer from "@/components/layout/Footer";
import { toursHeroConfig } from "@/lib/section-config";
import HeroSection from "@/components/sections/HeroSection";
import { getExpectedTourTypesForPublicTours, listPublicTourCardsSafe } from "@/lib/public-tour-data";
import { type AppLocale, routing } from "@/i18n/routing";

type ToursPageProps = {
  params: Promise<{ locale: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function ToursPage({params}: ToursPageProps) {
  const {locale} = await params;
  const tours = isValidLocale(locale)
    ? await listPublicTourCardsSafe({
        locale,
        tourTypes: getExpectedTourTypesForPublicTours(),
      })
    : [];

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...toursHeroConfig} />
      <ToursCatalog tours={ tours } />
      <Footer />
    </div>
  );
}
