import Hero from "@/components/home/Hero";
import Tours from "@/components/home/Tours";
import WhyChoose from "@/components/home/WhyChoose";
import PrivateTours from "@/components/home/PrivateTours";
import Partners from "@/components/home/Partners";
import Contact from "@/components/home/Contact";
import Footer from "@/components/layout/Footer";

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
