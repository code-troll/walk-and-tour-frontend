"use client";

import { useEffect, useId, useRef, type ComponentType } from "react";
import { ES, GB, IT } from "country-flag-icons/react/3x2";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type CountryCode = "GB" | "ES" | "IT";

const countryCodeByLocale: Record<AppLocale, CountryCode> = {
  en: "GB",
  es: "ES",
  it: "IT",
};

const flagByCountryCode: Record<
  CountryCode,
  ComponentType<{ className?: string }>
> = {
  GB,
  ES,
  IT,
};

type TourDetailLanguageFallbackDialogProps = {
  availableLanguages: {
    locale: AppLocale;
    label: string;
  }[];
  availableLanguagesLabel: string;
  description: string;
  title: string;
  tourSlug: string;
};

export default function TourDetailLanguageFallbackDialog({
                                                           availableLanguages,
                                                           availableLanguagesLabel,
                                                           description,
                                                           title,
                                                           tourSlug,
                                                         }: TourDetailLanguageFallbackDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-[#000000]/60 px-4 py-6 backdrop-blur-sm">
      <div
        ref={ dialogRef }
        tabIndex={ -1 }
        role="dialog"
        aria-modal="true"
        aria-labelledby={ titleId }
        aria-describedby={ descriptionId }
        className="w-full max-w-xl rounded-2xl bg-[#ffffff] p-6 shadow-xl sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c24343]"/>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c24343]">
                Language Notice
              </p>
            </div>
            <h2
              id={ titleId }
              className="text-xl font-semibold text-[#000000] sm:text-2xl"
            >
              { title }
            </h2>
            <p
              id={ descriptionId }
              className="text-sm leading-relaxed text-[#5b4d3c]"
            >
              { description }
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5b4d3c]">
              { availableLanguagesLabel }
            </p>
            <div className="flex flex-wrap gap-2">
              { availableLanguages.map((language) => {
                const Flag = flagByCountryCode[countryCodeByLocale[language.locale]];

                return (
                  <Link
                    key={ language.locale }
                    href={ `/tours/${ tourSlug }` }
                    locale={ language.locale }
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b7] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#5b4d3c] transition-colors hover:border-[#2b666d] hover:bg-[#2b666d] hover:text-[#ffffff]"
                  >
                    <Flag className="h-5 w-5 overflow-hidden"/>
                    <span>{ language.label }</span>
                  </Link>
                );
              }) }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
