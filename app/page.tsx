import Hero from "@/components/landing/Hero";
import Tours from "@/components/landing/Tours";
import WhyChoose from "@/components/landing/WhyChoose";
import PrivateTours from "@/components/landing/PrivateTours";
import Partners from "@/components/landing/Partners";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <Hero />
      <Tours />
      <WhyChoose />
      <PrivateTours />
      <Partners />
      <Contact />
      <Footer />
    </div>
  );
}
