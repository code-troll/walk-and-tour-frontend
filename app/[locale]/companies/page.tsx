import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CompaniesExperiencesSection from "@/components/companies/CompaniesExperiencesSection";
import { companiesHeroConfig } from "@/lib/section-config";

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...companiesHeroConfig} />
      <CompaniesExperiencesSection />
      <Footer />
    </div>
  );
}
