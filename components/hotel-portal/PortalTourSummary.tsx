import type {ReactNode} from "react";

import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";
import {tourImageUrl} from "@/components/hotel-portal/PortalTourDetail";

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

/**
 * A tour in a list: its cover, its name, what it costs and how long it takes.
 *
 * Made of spans only, so the finder can wrap it in the button that chooses the
 * tour. Whatever a list adds under it — tags, actions — goes in `children`.
 */
export function PortalTourSummary({
  children,
  tour,
}: {
  children?: ReactNode;
  tour: ApiHotelTourDetail;
}) {
  const duration = formatDuration(tour.durationMinutes);
  const cover = (tour.images ?? [])[0] ?? null;

  return (
    <>
      {/*
        The cover, when there is one. A guest deciding between two
        walks looks at the picture before the words, and a row that
        reserved space for an image the tour does not have would
        leave a grey hole down the whole list instead.
      */}
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- see PortalTourDetail
        <img
          alt={cover.alt ?? ""}
          className="h-20 w-28 shrink-0 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule)] object-cover"
          loading="lazy"
          src={tourImageUrl(tour.tourId, cover.mediaId)}
        />
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-[var(--wt-ink)]">{tour.name}</span>
          <span className="text-sm text-[var(--wt-ink-muted)]">
            {tour.priceAmount ? `${tour.priceAmount} ${tour.currency}` : "Price on request"}
            {duration ? ` · ${duration}` : ""}
          </span>
        </span>

        {tour.highlights && tour.highlights.length > 0 ? (
          <span className="mt-1 block max-w-2xl text-sm leading-6 text-[var(--wt-ink-muted)]">
            {tour.highlights.slice(0, 2).join(" · ")}
          </span>
        ) : null}

        {children}
      </span>
    </>
  );
}
