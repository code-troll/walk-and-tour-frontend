"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays } from "lucide-react";

import type { AppLocale } from "@/i18n/routing";
import { fetchJson } from "@/lib/api/client-json";
import type { components } from "@/lib/api/generated/backend-types";
import { normalizeTourCard, type PublicTourCard } from "@/lib/public-tour-model";

const BOOK_NOW_LABELS: Record<AppLocale, string> = {
  en: "Book now",
  es: "Reservar ahora",
  it: "Prenota ora",
};

type BlogInlineTourCardProps = {
  slug: string;
  locale: AppLocale;
  alignment?: "left" | "center" | "right";
};

export default function BlogInlineTourCard({
  slug,
  locale,
  alignment = "center",
}: BlogInlineTourCardProps) {
  const [tour, setTour] = useState<PublicTourCard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchJson<components["schemas"]["PublicTourResponseDto"] | null>({
      input: `/api/internal/public/api/public/tours/${encodeURIComponent(slug)}?locale=${locale}`,
      fallbackMessage: "Unable to load tour card.",
      notFoundFallback: null,
    })
      .then((response) => {
        if (cancelled) return;

        if (response) {
          setTour(normalizeTourCard(response, locale));
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  if (failed) {
    return (
      <div className="mt-5 max-w-md rounded-2xl border border-dashed border-[#e3d8cc] bg-[#fbf7f0] px-4 py-3 text-sm text-[#8a7562]">
        Unable to load tour: {slug}
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="mt-5 max-w-md rounded-2xl border border-[#e3d8cc] bg-[#fbf7f0] px-4 py-3 text-sm text-[#8a7562] animate-pulse">
        Loading tour…
      </div>
    );
  }

  const bookHref = `/${locale}/tours/${tour.slug}`;
  const isRemoteImage =
    tour.heroImageSrc.startsWith("http://") ||
    tour.heroImageSrc.startsWith("https://");

  const alignmentStyles: React.CSSProperties =
    alignment === "left"
      ? { float: "left", marginRight: "1.5rem", marginBottom: "1rem" }
      : alignment === "right"
        ? { float: "right", marginLeft: "1.5rem", marginBottom: "1rem" }
        : { display: "flow-root", marginLeft: "auto", marginRight: "auto" };

  return (
    <div
      className="mt-5 max-w-md overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-[#e3d8cc] transition-shadow hover:shadow-lg"
      style={alignmentStyles}
    >
      <a href={bookHref} className="flex flex-row !no-underline !text-inherit !font-normal">
        {tour.heroImageSrc ? (
          <div className="relative w-36 shrink-0">
            <Image
              src={tour.heroImageSrc}
              alt={tour.imageAlt}
              width={400}
              height={300}
              className="!m-0 h-full w-full !rounded-none object-cover"
              unoptimized={isRemoteImage}
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col justify-center gap-1.5 p-4">
          <h4 className="!m-0 text-base font-semibold leading-snug text-[#2a221a]">
            {tour.title}
          </h4>

          {tour.price ? (
            <p className="!m-0 text-sm font-medium text-[#5b4d3c]">
              {tour.price}
            </p>
          ) : null}

          {tour.duration ? (
            <p className="!m-0 flex items-center gap-1.5 text-sm text-[#8a7562]">
              <CalendarDays className="h-3.5 w-3.5" />
              {tour.duration}
            </p>
          ) : null}

          <span className="mt-1 inline-flex w-fit rounded-lg bg-[#c24343] px-3 py-1.5 text-xs !font-semibold !text-white !no-underline transition-colors hover:bg-[#a83636]">
            {BOOK_NOW_LABELS[locale] ?? BOOK_NOW_LABELS.en}
          </span>
        </div>
      </a>
    </div>
  );
}
