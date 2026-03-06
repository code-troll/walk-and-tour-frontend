import { Sparkles } from "lucide-react";

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
    <section className="relative bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e75c3a]/15 text-[#e75c3a]">
            <Sparkles className="h-5 w-5" strokeWidth={ 1.5 }/>
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[#182619]">{ title }</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          { highlights.map((highlight, index) => {
            const {prefix, suffix} = splitHighlight(highlight);

            return (
              <article
                key={ `highlight-${ index }` }
                className="group relative overflow-hidden rounded-2xl border border-[#dfd6c9]/60 bg-[#fcf8f1] p-5 transition-all duration-300 hover:border-[#005211]/30 hover:shadow-md"
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#005211]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                <div className="relative flex gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005211]/10 text-xs font-bold text-[#005211]">
                    { index + 1 }
                  </span>
                  <p className="text-sm leading-relaxed text-[#4b5a4b]">
                    { prefix ? <span className="font-semibold text-[#182619]">{ prefix }</span> : null }
                    { prefix ? " " : "" }
                    { suffix }
                  </p>
                </div>
              </article>
            );
          }) }
        </div>
      </div>
    </section>
  );
}
