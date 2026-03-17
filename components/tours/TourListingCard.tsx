"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import type { PublicTourCard } from "@/lib/public-tour-model";

type TourListingCardProps = {
  tour: PublicTourCard;
  isNewlyRevealed?: boolean;
  revealDelayMs?: number;
};

const StarIcon = () => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className="h-4 w-4 fill-[#d4a73d]"
  >
    <path d="M10 1.5l2.5 5.07 5.6.81-4.05 3.94.96 5.58L10 14.98l-5.01 2.92.96-5.58L1.9 7.38l5.6-.81L10 1.5z"/>
  </svg>
);

export default function TourListingCard({
                                          tour,
                                          isNewlyRevealed = false,
                                          revealDelayMs = 0,
                                        }: TourListingCardProps) {
  const t = useTranslations("tours.card");
  const locale = useLocale() as AppLocale;
  const bookHref = `${ getPathname({locale, href: "/tours"}) }/${ tour.slug }`;
  const isRemoteImage = tour.heroImageSrc.startsWith("http://") || tour.heroImageSrc.startsWith("https://");

  return (
    <article
      className={ `flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_12px_28px_-24px_rgba(0,0,0,0.9)] ring-1 ring-[#e3d8cc] ${ isNewlyRevealed ? "tour-card-reveal" : "" }` }
      style={ isNewlyRevealed ? {animationDelay: `${ revealDelayMs }ms`} : undefined }
    >
      <div className="group relative overflow-hidden">
        <a href={ bookHref }>
          <Image
            src={ tour.heroImageSrc }
            alt={ tour.imageAlt }
            width={ 800 }
            height={ 600 }
            className="h-52 w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04] group-hover:brightness-[1.04]"
            unoptimized={ isRemoteImage }
          />
        </a>
        <span
          className="absolute left-4 top-4 rounded-full bg-[#2b666d]/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            { tour.tag }
          </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold leading-tight text-[#2a221a]">
          { tour.title }
        </h3>

        <div className="mt-auto">
          <div className="my-4 h-px bg-[#eadfce]"/>

          <div className="flex items-center gap-2 text-sm text-[#5b4d3c]">
            <StarIcon/>
            <span className="font-semibold text-[#3d3124]">{ tour.rating }</span>
            <span>{ t("ratingOutOfFive") }</span>
            <span>({ tour.reviews } { t("reviews") })</span>
          </div>

          <div className="my-4 h-px bg-[#eadfce]"/>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xl font-semibold text-[#2a221a]">
              { tour.price ?? "—" }
            </p>
            <a
              href={ bookHref }
              className="btn-red-black inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors"
            >
              { t("book") }
              <ArrowRight className="h-4 w-4"/>
            </a>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#5b4d3c] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#8a7562]"/>
              <span>{ tour.duration }</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#8a7562]"/>
              <span>{ tour.location }</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
