import ToursCatalog from "@/components/tours/ToursCatalog";
import Footer from "@/components/layout/Footer";
import { homeHeroConfig, toursHeroConfig } from "@/lib/section-config";
import HeroSection from "@/components/sections/HeroSection";

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...toursHeroConfig} />
      <ToursCatalog />
      <Footer />
    </div>
  );
}
