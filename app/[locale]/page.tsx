import HeroSection from "@/components/sections/HeroSection";
import WhyChoose from "@/components/home/WhyChoose";
import PrivateTours from "@/components/home/PrivateTours";
import Partners from "@/components/home/Partners";
import Contact from "@/components/home/Contact";
import Footer from "@/components/layout/Footer";
import HomeToursSectionClient from "@/components/public/HomeToursSectionClient";
import { homeHeroConfig } from "@/lib/section-config";
import { type AppLocale, routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function Home({params}: HomePageProps) {
  const {locale} = await params;

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...homeHeroConfig} />
      { isValidLocale(locale) ? <HomeToursSectionClient locale={ locale } /> : null }
      <WhyChoose />
      <PrivateTours />
      <Partners />
      <Contact />
      <Footer />
    </div>
  );
}
