import Link from "next/link";
import {ArrowLeft} from "lucide-react";

import {PortalTourDetail} from "@/components/hotel-portal/PortalTourDetail";
import {
  PortalNotice,
  PortalSection,
  portalPrimaryAction,
  portalQuietAction,
  portalSecondaryAction,
} from "@/components/hotel-portal/PortalUi";
import {getHotelViewerState} from "@/lib/hotel-portal/session";
import {getTourDetailAction} from "../../actions";

/**
 * One tour this hotel may sell, on its own page.
 *
 * The same description the booking form shows, reachable without starting a
 * booking — for the guest who asks what a walk is before deciding on it.
 */
export default async function HotelPortalTourPage({
  params,
}: {
  params: Promise<{tourId: string}>;
}) {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const {tourId} = await params;
  const result = await getTourDetailAction(tourId);

  if (!result.ok) {
    return (
      <PortalNotice
        kicker="Tour"
        title="This tour could not be loaded."
        description="It may no longer be available to your hotel."
        actions={
          <Link className={portalSecondaryAction} href="/">
            Back to overview
          </Link>
        }
      />
    );
  }

  const {tour} = result;

  return (
    <div className="space-y-8">
      <Link className={portalQuietAction} href="/">
        <ArrowLeft className="size-4" />
        Overview
      </Link>

      <PortalSection title={tour.name}>
        <PortalTourDetail className="" tour={tour} />

        <div className="mt-8 flex justify-end border-t border-[var(--wt-rule)] pt-5">
          <Link
            className={portalPrimaryAction}
            href={`/bookings/new?tourId=${encodeURIComponent(tour.tourId)}`}
          >
            Book this tour
          </Link>
        </div>
      </PortalSection>
    </div>
  );
}
