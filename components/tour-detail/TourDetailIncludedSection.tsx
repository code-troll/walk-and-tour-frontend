import { Check, X } from "lucide-react";

type TourDetailIncludedSectionProps = {
  title: string;
  includedTitle: string;
  notIncludedTitle: string;
  includedItems: string[];
  notIncludedItems: string[];
};

export default function TourDetailIncludedSection({
  title,
  includedTitle,
  notIncludedTitle,
  includedItems,
  notIncludedItems,
}: TourDetailIncludedSectionProps) {
  return (
    <section className="bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <h2 className="text-3xl font-semibold text-teal sm:text-4xl">{ title }</h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border-[#e8ddd2] bg-white p-6 shadow-sm ring-1 ring-[#e8ddd2]">
            <h3 className="text-lg font-semibold text-[#2a221a]">{ includedTitle }</h3>
            <ul className="mt-4 space-y-3">
              { includedItems.map((item, index) => (
                <li key={ `included-${ index }` } className="flex items-start gap-3 text-sm leading-7 text-[#3d3124] md:text-base">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#2b666d]"/>
                  <span>{ item }</span>
                </li>
              )) }
            </ul>
          </article>

          <article className="rounded-3xl border-[#e8ddd2] bg-white p-6 shadow-sm ring-1 ring-[#e8ddd2]">
            <h3 className="text-lg font-semibold text-[#2a221a]">{ notIncludedTitle }</h3>
            <ul className="mt-4 space-y-3">
              { notIncludedItems.map((item, index) => (
                <li key={ `not-included-${ index }` } className="flex items-start gap-3 text-sm leading-7 text-[#3d3124] md:text-base">
                  <X className="mt-1 h-4 w-4 shrink-0 text-[#c24343]"/>
                  <span>{ item }</span>
                </li>
              )) }
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
