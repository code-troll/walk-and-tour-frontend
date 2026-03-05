type TourDetailAboutSectionProps = {
  title: string;
  description: string;
};

export default function TourDetailAboutSection({
  title,
  description,
}: TourDetailAboutSectionProps) {
  return (
    <section className="bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="mx-auto rounded-3xl border-[#e8ddd2] bg-white p-6 shadow-sm ring-1 ring-[#e8ddd2] sm:p-8">
          <h2 className="mb-6 text-3xl font-semibold text-teal sm:text-4xl">{ title }</h2>
          <p className="text-base leading-7 text-[#3d3124] md:text-lg">
            { description }
          </p>
        </div>
      </div>
    </section>
  );
}
