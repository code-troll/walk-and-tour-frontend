import { Mail } from "lucide-react";
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
    <section className="bg-white py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="rounded-3xl bg-[#f2e7e8] p-6 shadow-sm ring-1 ring-[#e8ddd2] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-teal sm:text-4xl">{ title }</h2>
              <p className="mt-4 text-sm leading-7 text-[#3d3124] md:text-base">
                { description }
              </p>
            </div>

            <Link
              href={ ctaHref }
              className="btn-red-black inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              <Mail className="h-4 w-4"/>
              { ctaLabel }
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
