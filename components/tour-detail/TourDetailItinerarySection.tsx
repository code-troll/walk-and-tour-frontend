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
    <section className="bg-white py-12">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="mx-auto rounded-3xl bg-[#fcfaf7] p-6 shadow-sm ring-1 ring-[#e8ddd2] sm:p-8">
          <h2 className="text-3xl font-semibold text-teal sm:text-4xl">{ title }</h2>
          <div className="mt-6 space-y-5 text-sm leading-7 text-[#3d3124] md:text-base">
            {(paragraphs.length > 0 ? paragraphs : [description]).map((paragraph, index) => (
              <p key={ `itinerary-description-${ index }` }>
                { paragraph }
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
