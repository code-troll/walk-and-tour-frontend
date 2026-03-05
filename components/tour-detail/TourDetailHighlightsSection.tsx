import { CheckCircle2 } from "lucide-react";

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
    <section className="bg-white py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="mx-auto rounded-3xl bg-[#fcfaf7] p-6 shadow-sm ring-1 ring-[#e8ddd2] sm:p-8">
          <h2 className="text-3xl mb-10 font-semibold text-teal sm:text-4xl">{ title }</h2>
          <ul className="space-y-4">
            { highlights.map((highlight, index) => {
              const {prefix, suffix} = splitHighlight(highlight);

              return (
                <li
                  key={ `highlight-${ index }` }
                  className="flex items-start gap-3 text-base leading-7 text-[#3d3124]"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2b666d]"/>
                  <span>
                    { prefix ? <strong className="font-semibold text-[#2a221a]">{ prefix }</strong> : null }
                    { prefix ? " " : "" }
                    { suffix }
                  </span>
                </li>
              );
            }) }
          </ul>
        </div>
      </div>
    </section>
  );
}
