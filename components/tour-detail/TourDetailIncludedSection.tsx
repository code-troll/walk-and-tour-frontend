import { Check, CircleAlert, Gift, X } from "lucide-react";

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
    <section className="relative bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005211]/10 text-[#005211]">
            <Gift className="h-5 w-5" strokeWidth={ 1.5 }/>
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-[#182619]">{ title }</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl border-2 border-[#005211]/20 bg-[#005211]/5">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#005211]/10"/>
            <div className="relative p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#005211] text-[#fcf8f1]">
                  <Check className="h-4 w-4" strokeWidth={ 2.5 }/>
                </span>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#005211]">{ includedTitle }</h3>
              </div>
              <ul className="space-y-4">
                { includedItems.map((item, index) => (
                  <li key={ `included-${ index }` } className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005211]/20">
                      <Check className="h-3 w-3 text-[#005211]" strokeWidth={ 2.5 }/>
                    </span>
                    <span className="text-base leading-relaxed text-[#182619]/90">{ item }</span>
                  </li>
                )) }
              </ul>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-[#dfd6c9]/60 bg-[#e7dcd0]/30">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#4b5a4b]/5"/>
            <div className="relative p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4b5a4b]/20 text-[#4b5a4b]">
                  <CircleAlert className="h-4 w-4" strokeWidth={ 2 }/>
                </span>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#4b5a4b]">{ notIncludedTitle }</h3>
              </div>
              <ul className="space-y-4">
                { notIncludedItems.map((item, index) => (
                  <li key={ `not-included-${ index }` } className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4b5a4b]/10">
                      <X className="h-3 w-3 text-[#4b5a4b]" strokeWidth={ 2.5 }/>
                    </span>
                    <span className="text-base leading-relaxed text-[#4b5a4b]">{ item }</span>
                  </li>
                )) }
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
