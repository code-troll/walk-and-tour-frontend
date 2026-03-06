import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

type TourDetailCustomerSupportSectionProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function TourDetailCustomerSupportSection({
  title,
  description,
  ctaLabel,
  ctaHref,
}: TourDetailCustomerSupportSectionProps) {
  return (
    <section className="bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="relative overflow-hidden rounded-4xl bg-[#c24343]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]"/>
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5"/>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"/>
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="mb-4 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <MessageCircle className="h-7 w-7 text-[#fcf8f1]" strokeWidth={ 1.5 }/>
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-[#fcf8f1] sm:text-3xl">{ title }</h2>
                </div>
                <p className="text-base leading-relaxed text-[#fcf8f1]/80">
                  { description }
                </p>
              </div>

              <Link
                href={ ctaHref }
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#c24343] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                { ctaLabel }
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"/>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
