"use client";

import {
  Flag,
  Languages,
  MapPin,
  ShieldCheck,
  Footprints,
  type LucideIcon,
} from "lucide-react";

type TourDetailQuickInfoId =
  | "startFrom"
  | "endAt"
  | "typeTour"
  | "cancellationType"
  | "language";

type TourDetailQuickInfoItem = {
  id: TourDetailQuickInfoId;
  label: string;
  value: string;
};

type TourDetailQuickInfoSectionProps = {
  items: TourDetailQuickInfoItem[];
};

const iconById: Record<TourDetailQuickInfoId, LucideIcon> = {
  startFrom: MapPin,
  endAt: Flag,
  typeTour: Footprints,
  cancellationType: ShieldCheck,
  language: Languages,
};

export default function TourDetailQuickInfoSection({
                                                     items,
                                                   }: TourDetailQuickInfoSectionProps) {
  return (
    <section className="bg-[#fcfaf7] pb-6 pt-3">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-10">
        <div className="relative overflow-hidden rounded-4xl bg-[#fcf8f1]/80 backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(43,102,109,0.08),transparent_50%)]"/>
          <div className="relative grid grid-cols-2 divide-x divide-[#dfd6c9]/50 sm:grid-cols-6 lg:grid-cols-5">
            { items.map((item, index) => {
              const Icon = iconById[item.id];
              const isLastItem = index === items.length - 1;
              const mobileHasSingleTail = items.length % 2 === 1 && isLastItem;
              const smRemainder = items.length % 3;
              const smHasSingleTail = smRemainder === 1 && isLastItem;
              const smHasTwoItemsTail = smRemainder === 2 && index >= items.length - 2;

              const spanClass = [
                "col-span-1 sm:col-span-2 lg:col-span-1",
                mobileHasSingleTail ? "col-span-2" : "",
                smHasSingleTail ? "sm:col-span-6" : "",
                smHasTwoItemsTail ? "sm:col-span-3" : "",
              ].filter(Boolean).join(" ");

              const rowBorderClass = [
                "border-[#dfd6c9]/50",
                index >= 1 ? "border-t" : "",
                index >= 2 ? "sm:border-t" : "sm:border-t-0",
                index >= 4 ? "border-b lg:border-t lg:border-b-0" : "lg:border-t-0",
              ].join(" ");

              return (
                <article
                  key={ item.id }
                  className={ `group relative flex justify-center items-center gap-3 px-4 py-4 transition-all duration-300 hover:bg-[#2b666d]/5 lg:py-5 ${ spanClass } ${ rowBorderClass }` }
                >
                  <span
                    className="flex h-11 w-11 min-w-11 items-center justify-center rounded-2xl bg-[#2b666d]/10 text-[#2b666d] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#2b666d] group-hover:text-[#fcf8f1] group-hover:shadow-lg">
                    <Icon className="h-5 w-5" strokeWidth={ 1.5 }/>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#4b5a4b]/70">
                      { item.label }
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-tight text-[#182619]">
                      { item.value }
                    </p>
                  </div>
                </article>
              );
            }) }
          </div>
        </div>
      </div>
    </section>
  );
}
