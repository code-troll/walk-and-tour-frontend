import { useTranslations } from "next-intl";

import TourListingCard from "@/components/tours/TourListingCard";
import { Link } from "@/i18n/navigation";
import type { PublicTourCard } from "@/lib/public-tour-data";

type ToursProps = {
  tours: PublicTourCard[];
};

export default function Tours({tours}: ToursProps) {
  const t = useTranslations("tours");

  return (
    <section id="tours" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-3xl font-extrabold text-teal sm:text-4xl">
            { t("heading") }
          </h2>
          <p className="mx-auto text-xl font-semibold">
            { t("intro1") }
          </p>
          <p className="mx-auto text-xl font-semibold">
            { t("intro2") }
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          { tours.map((tour) => (
            <TourListingCard key={ tour.id } tour={ tour }/>
          )) }
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/tours"
            className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white"
          >
            { t("exploreAll") }
          </Link>
        </div>
      </div>
    </section>
  );
}
