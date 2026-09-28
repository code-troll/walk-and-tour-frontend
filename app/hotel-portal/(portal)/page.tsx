import Link from "next/link";
import {ChevronRight} from "lucide-react";

import {
  PortalSection,
  portalPrimaryAction,
  portalSecondaryAction,
} from "@/components/hotel-portal/PortalUi";
import {getHotelViewerState} from "@/lib/hotel-portal/session";

export default async function HotelPortalHomePage() {
  const viewerState = await getHotelViewerState();

  // Every other state is already rendered by the layout, which resolves the
  // same cached session.
  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const {viewer} = viewerState;

  return (
    <>
      <PortalSection
        title="Your tours"
        description="The Walk and Tour experiences you can book for your guests."
        actions={
          viewer.tours.length > 0 ? (
            <Link className={portalPrimaryAction} href="/bookings/new">
              Book a tour
            </Link>
          ) : null
        }
      >
        {viewer.tours.length === 0 ? (
          <p className="text-sm text-[var(--wt-ink-muted)]">
            No tours have been assigned to you yet. Walk and Tour will let you know once they
            are available.
          </p>
        ) : (
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {viewer.tours.map((tour) => (
              <li className="border-b border-[var(--wt-rule)]" key={tour.tourId}>
                <Link
                  className="flex items-center justify-between gap-3 py-2.5 text-sm text-[var(--wt-ink)] transition-colors hover:bg-[var(--wt-surface-sunk)]"
                  href={`/tours/${tour.tourId}`}
                >
                  {tour.tourName}
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-[var(--wt-ink-muted)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection
        title="Your bookings"
        description="Everything you have booked, and what it will cost."
        actions={
          <Link className={portalSecondaryAction} href="/bookings">
            Open bookings
          </Link>
        }
      >
        <p className="max-w-prose text-sm leading-6 text-[var(--wt-ink-muted)]">
          Walk and Tour confirms each booking. Prices exclude VAT and stay an estimate until
          the booking is invoiced, because charges specific to a booking can be added along
          the way.
        </p>
      </PortalSection>
    </>
  );
}
