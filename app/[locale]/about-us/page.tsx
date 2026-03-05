import AboutUsAdvantagesSection from "@/components/about-us/AboutUsAdvantagesSection";
import AboutUsGallerySection from "@/components/about-us/AboutUsGallerySection";
import AboutUsIntroSection from "@/components/about-us/AboutUsIntroSection";
import AboutUsTeamSection from "@/components/about-us/AboutUsTeamSection";
import AboutUsTestimonialsSection from "@/components/about-us/AboutUsTestimonialsSection";
import Contact from "@/components/home/Contact";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import { aboutHeroConfig } from "@/lib/section-config";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...aboutHeroConfig} />
      <AboutUsIntroSection />
      <AboutUsAdvantagesSection />
      <AboutUsTeamSection />
      <AboutUsGallerySection />
      <AboutUsTestimonialsSection />
      <Contact />
      <Footer />
    </div>
  );
}
