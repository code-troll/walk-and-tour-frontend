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
    <section className="bg-white py-12">
      <div className="mx-auto w-full px-6 lg:px-12">
        <h2 className="text-3xl font-semibold text-teal sm:text-4xl">{ title }</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          { tours.map((tour) => (
            <TourListingCard key={ `related-${ tour.id }` } tour={ tour }/>
          )) }
        </div>
      </div>
    </section>
  );
}
