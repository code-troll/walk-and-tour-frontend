import Footer from "@/components/layout/Footer";
import { toursHeroConfig } from "@/lib/section-config";
import HeroSection from "@/components/sections/HeroSection";
import PublicToursCatalogClient from "@/components/public/PublicToursCatalogClient";
import { type AppLocale, routing } from "@/i18n/routing";
import {getExpectedTourTypesForPublicTours} from "@/lib/public-tour-model";

type ToursPageProps = {
  params: Promise<{ locale: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function ToursPage({params}: ToursPageProps) {
  const {locale} = await params;

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...toursHeroConfig} />
      { isValidLocale(locale) ? (
        <PublicToursCatalogClient
          locale={ locale }
          tourTypes={ getExpectedTourTypesForPublicTours() }
        />
      ) : null }
      <Footer />
    </div>
  );
}
