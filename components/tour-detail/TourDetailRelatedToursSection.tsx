import { ShoppingBag } from "lucide-react";

import TourListingCard from "@/components/tours/TourListingCard";
import type { PublicTourCard } from "@/lib/public-tour-data";

type TourDetailRelatedToursSectionProps = {
  title: string;
  tours: PublicTourCard[];
};

export default function TourDetailRelatedToursSection({
  title,
  tours,
}: TourDetailRelatedToursSectionProps) {
  if (tours.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-[#fcfaf7] pt-6 pb-12">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2b666d]/10 text-[#2b666d]">
            <ShoppingBag className="h-7 w-7" strokeWidth={ 1.5 }/>
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#2b666d]">{ title }</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          { tours.map((tour) => (
            <TourListingCard key={ `related-${ tour.id }` } tour={ tour }/>
          )) }
        </div>
      </div>
    </section>
  );
}
