import ToursCatalog from "@/components/tours/ToursCatalog";
import AboutWalkAndTourSection from "@/components/tours/AboutWalkAndTourSection";
import Footer from "@/components/layout/Footer";
import { toursHeroConfig } from "@/lib/section-config";
import HeroSection from "@/components/sections/HeroSection";

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...toursHeroConfig} />
      <ToursCatalog />
      <AboutWalkAndTourSection />
      <Footer />
    </div>
  );
}
