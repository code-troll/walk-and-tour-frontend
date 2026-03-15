"use client";

import { useEffect, useRef } from "react";
import { mountTuritopWidgets } from "@/lib/turitop/widget";
import TourDetailSidebarFallback from "./TourDetailSidebarFallback";

type TourDetailSidebarPlaceholderProps = {
  bookingReferenceId?: string;
  language?: string;
  price?: string;
  duration?: string;
  cancellationType?: string;
  requestedBookingType?: "privateTours" | "companyTours";
  requestedItemId?: string;
};

export default function TourDetailSidebarPlaceholder({
  bookingReferenceId,
  language,
  price,
  duration,
  cancellationType,
  requestedBookingType,
  requestedItemId,
}: TourDetailSidebarPlaceholderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!bookingReferenceId || !language || !container) {
      return;
    }

    mountTuritopWidgets([
      {
        container,
        language,
        service: bookingReferenceId,
      },
    ]);

    return () => {
      container.innerHTML = "";
    };
  }, [bookingReferenceId, language]);

  return (
    <div className="pt-6 px-0 md:px-6 lg:pt-0 lg:px-12 lg:pl-0">
      <div
        className="rounded-3xl bg-[#fcfaf7] md:bg-white p-0 md:shadow-sm ring-0 md:ring-1 md:ring-[#e8ddd2] overflow-hidden">
        { !bookingReferenceId || !language
          ? (
            <TourDetailSidebarFallback
              price={ price }
              duration={ duration }
              cancellationType={ cancellationType }
              requestedBookingType={ requestedBookingType }
              requestedItemId={ requestedItemId }
            />
          )
          : <div ref={ containerRef } className="my-4 md:my-0"/> }
      </div>
    </div>
  );
}
