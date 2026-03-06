import { ShoppingBag } from "lucide-react";

import TourListingCard from "@/components/tours/TourListingCard";
import type { Tour } from "@/lib/landing-data";

type TourDetailRelatedToursSectionProps = {
  title: string;
  tours: Tour[];
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
      <div className="mx-auto w-full px-6 lg:px-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005211]/10 text-[#005211]">
            <ShoppingBag className="h-5 w-5" strokeWidth={ 1.5 }/>
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[#182619]">{ title }</h2>
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
