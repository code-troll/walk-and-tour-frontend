"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen, ChevronDown, ChevronUp,
  Gift,
  MessageCircle,
  Route,
  Sparkles,
} from "lucide-react";

const sectionIcons = {
  about: BookOpen,
  customerSupport: MessageCircle,
  highlights: Sparkles,
  included: Gift,
  itinerary: Route,
} as const;

export type TourDetailSectionIcon = keyof typeof sectionIcons;

type TourDetailCollapsibleSectionProps = {
  title: string;
  icon: TourDetailSectionIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
  iconContainerClassName?: string;
  titleClassName?: string;
};

export default function TourDetailCollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = false,
  iconContainerClassName = "bg-[#2b666d]/10 text-[#2b666d]",
  titleClassName = "text-[#2b666d]",
}: TourDetailCollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const ResolvedIcon = sectionIcons[Icon];

  return (
    <section className="relative bg-[#fcfaf7] py-6">
      <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 px-0 py-4 text-left"
          onClick={ () => setIsExpanded((currentValue) => !currentValue) }
          aria-expanded={ isExpanded }
        >
          <span className="flex items-center gap-3">
            <span className={ `flex h-10 w-10 items-center justify-center rounded-2xl ${ iconContainerClassName }` }>
              <ResolvedIcon className="h-5 w-5" strokeWidth={ 1.8 }/>
            </span>
            <span className={ `text-2xl font-semibold tracking-tight ${ titleClassName }` }>
              { title }
            </span>
          </span>

          { isExpanded ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-[#2b666d]" strokeWidth={ 2 }/>
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-[#2b666d]" strokeWidth={ 2 }/>
          ) }
        </button>

        <div
          className={ `overflow-hidden transition-all duration-700 ease-in-out ${
            isExpanded ? "mt-6 max-h-[3200px] opacity-100" : "mt-0 max-h-0 opacity-0"
          }` }
          aria-hidden={ !isExpanded }
        >
          { children }
        </div>
      </div>
    </section>
  );
}
