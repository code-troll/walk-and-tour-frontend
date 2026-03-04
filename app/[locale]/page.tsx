import HeroSection from "@/components/sections/HeroSection";
import Tours from "@/components/home/Tours";
import WhyChoose from "@/components/home/WhyChoose";
import PrivateTours from "@/components/home/PrivateTours";
import Partners from "@/components/home/Partners";
import Contact from "@/components/home/Contact";
import Footer from "@/components/layout/Footer";
import { homeHeroConfig } from "@/lib/section-config";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <HeroSection {...homeHeroConfig} />
      <Tours />
      <WhyChoose />
      <PrivateTours />
      <Partners />
      <Contact />
      <Footer />
    </div>
  );
}
