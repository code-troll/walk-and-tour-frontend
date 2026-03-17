"use client";

import { ChevronRight } from "lucide-react";
import TourDetailCollapsibleSection from "@/components/tour-detail/TourDetailCollapsibleSection";

type TourDetailHighlightsSectionProps = {
  title: string;
  highlights: string[];
};

const splitHighlight = (highlight: string): { prefix: string; suffix: string; } => {
  const separatorIndex = highlight.indexOf(":");

  if (separatorIndex === -1) {
    return {prefix: "", suffix: highlight};
  }

  return {
    prefix: highlight.slice(0, separatorIndex + 1),
    suffix: highlight.slice(separatorIndex + 1).trimStart(),
  };
};

export default function TourDetailHighlightsSection({
                                                      title,
                                                      highlights,
                                                    }: TourDetailHighlightsSectionProps) {
  return (
    <TourDetailCollapsibleSection
      title={ title }
      icon="highlights"
      defaultExpanded={ true }
      iconContainerClassName="bg-[#e75c3a]/15 text-[#e75c3a]"
    >
      <article className="relative overflow-hidden rounded-3xl border border-[#dfd6c9]/60 bg-white p-5">
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#2b666d]/5"/>
        <ul className="relative space-y-4">
          { highlights.map((highlight, index) => {
            const {prefix, suffix} = splitHighlight(highlight);

            return (
              <li key={ `highlight-${ index }` } className="flex gap-4">
                <ChevronRight
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#2b666d]"
                  strokeWidth={ 1.8 }
                />
                <p className="text-base leading-relaxed text-[#4b5a4b]">
                  { prefix ? <span className="font-semibold text-[#182619]">{ prefix }</span> : null }
                  { prefix ? " " : "" }
                  { suffix }
                </p>
              </li>
            );
          }) }
        </ul>
      </article>
    </TourDetailCollapsibleSection>
  );
}
