import { Route } from "lucide-react";

type TourDetailItinerarySectionProps = {
  title: string;
  description: string;
};

export default function TourDetailItinerarySection({
  title,
  description,
}: TourDetailItinerarySectionProps) {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <section className="relative bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005211]/10 text-[#005211]">
            <Route className="h-5 w-5" strokeWidth={ 1.5 }/>
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[#182619]">{ title }</h2>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#dfd6c9]/60 bg-[#fcf8f1]">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#005211]/40"/>
          <div className="p-6 pl-8 sm:p-8 sm:pl-10">
            <div className="space-y-5 text-base leading-[1.8] text-[#4b5a4b] md:text-lg">
              {(paragraphs.length > 0 ? paragraphs : [description]).map((paragraph, index) => (
                <p key={ `itinerary-description-${ index }` }>
                  { paragraph }
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
