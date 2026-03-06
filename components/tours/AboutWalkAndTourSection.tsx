"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { type AppLocale } from "@/i18n/routing";
import { getInternalHref } from "@/lib/internal-paths";
import { aboutWalkAndTour } from "@/lib/landing-data";

export default function AboutWalkAndTourSection() {
  const aboutWalkAndTourT = useTranslations("aboutWalkAndTour");
  const locale = useLocale() as AppLocale;
  const descriptionsRaw = aboutWalkAndTourT.raw(aboutWalkAndTour.descriptionsKey);
  const descriptions = Array.isArray(descriptionsRaw)
    ? descriptionsRaw.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div
        className="mx-auto grid w-full max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-12">
        <div className="relative">
          <div
            className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] ring-1 ring-[#e3d8cc]">
            <Image
              src="/walkandtour/tours/about-section/know-the-team.jpg"
              alt={ aboutWalkAndTourT(aboutWalkAndTour.titleKey) }
              width={ 1280 }
              height={ 860 }
              className="h-full w-full object-cover [clip-path:polygon(0_0,100%_0,100%_calc(100%-4rem),calc(100%-4rem)_calc(100%-4rem),calc(100%-4rem)_100%,0_100%)] sm:[clip-path:polygon(0_0,100%_0,100%_calc(100%-5rem),calc(100%-5rem)_calc(100%-5rem),calc(100%-5rem)_100%,0_100%)]"
            />
            <span
              className="pointer-events-none absolute bottom-0 right-0 z-10 inline-flex h-16 w-16 items-center justify-center bg-[#c24343] text-white ring-5 ring-white sm:h-20 sm:w-20 rounded-tl-2xl"
              aria-hidden="true"
            >
              <Image
                src="/map.svg"
                alt=""
                width={ 30 }
                height={ 30 }
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
            { aboutWalkAndTourT(aboutWalkAndTour.eyebrowKey) }
          </p>
          <h2 className="text-3xl font-semibold text-teal sm:text-4xl">
            { aboutWalkAndTourT(aboutWalkAndTour.titleKey) }
          </h2>
          { descriptions.map((description, index) => (
            <p
              key={ `about-walk-and-tour-description-${ index }` }
              className="text-base leading-7 text-[#3d3124] md:text-lg"
            >
              { description }
            </p>
          )) }
          <div>
            <a
              href={ getInternalHref({locale, target: aboutWalkAndTour.ctaTarget}) }
              className="btn-red-black inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              { aboutWalkAndTourT(aboutWalkAndTour.ctaLabelKey) }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
