import TourDetailCollapsibleSection from "@/components/tour-detail/TourDetailCollapsibleSection";

type TourDetailAboutSectionProps = {
  title: string;
  description: string;
};

export default function TourDetailAboutSection({
                                                 title,
                                                 description,
                                               }: TourDetailAboutSectionProps) {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <TourDetailCollapsibleSection title={ title } icon="about">
      <div className="relative overflow-hidden rounded-3xl border border-[#dfd6c9]/60 bg-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-[#2b666d]/40"/>
        <div className="p-6 pl-8 sm:p-8 sm:pl-10">
          <div className="space-y-5 text-base leading-[1.8] text-[#4b5a4b]">
            { (paragraphs.length > 0 ? paragraphs : [description]).map((paragraph, index) => (
              <p key={ `itinerary-description-${ index }` }>
                { paragraph }
              </p>
            )) }
          </div>
        </div>
      </div>
    </TourDetailCollapsibleSection>
  );
}
