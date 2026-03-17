"use client";

import { Check, CircleAlert, X } from "lucide-react";
import TourDetailCollapsibleSection from "@/components/tour-detail/TourDetailCollapsibleSection";

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
    <TourDetailCollapsibleSection title={ title } icon="included">
      <div className="grid gap-5 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-3xl border-2 border-[#2b666d]/20 bg-[#2b666d]/5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#2b666d]/10"/>
          <div className="relative p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2b666d] text-[#fcf8f1]">
                <Check className="h-4 w-4" strokeWidth={ 2.5 }/>
              </span>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#2b666d]">{ includedTitle }</h3>
            </div>
            <ul className="space-y-4">
              { includedItems.map((item, index) => (
                <li key={ `included-${ index }` } className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2b666d]/20">
                    <Check className="h-3 w-3 text-[#2b666d]" strokeWidth={ 2.5 }/>
                  </span>
                  <span className="text-base leading-relaxed text-[#182619]/90">{ item }</span>
                </li>
              )) }
            </ul>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-[#c24343]/25 bg-[#c24343]/6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#c24343]/12"/>
          <div className="relative p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c24343]/15 text-[#c24343]">
                <CircleAlert className="h-4 w-4" strokeWidth={ 2 }/>
              </span>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#c24343]">{ notIncludedTitle }</h3>
            </div>
            <ul className="space-y-4">
              { notIncludedItems.map((item, index) => (
                <li key={ `not-included-${ index }` } className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c24343]/15">
                    <X className="h-3 w-3 text-[#c24343]" strokeWidth={ 2.5 }/>
                  </span>
                  <span className="text-base leading-relaxed text-[#5b4a46]">{ item }</span>
                </li>
              )) }
            </ul>
          </div>
        </article>
      </div>
    </TourDetailCollapsibleSection>
  );
}
