import Link from "next/link";

import {AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
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
      <AdminSectionCard
        title="Your tours"
        description="The Walk and Tour experiences you can book for your guests."
        actions={
          viewer.tours.length > 0 ? (
            <Button asChild>
              <Link href="/bookings/new">Book a tour</Link>
            </Button>
          ) : null
        }
      >
        {viewer.tours.length === 0 ? (
          <p className="py-4 text-sm text-[#627176]">
            No tours have been assigned to you yet. Walk and Tour will let you know once they
            are available.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {viewer.tours.map((tour) => (
              <li
                className="rounded-2xl border border-[#eadfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#21343b]"
                key={tour.tourId}
              >
                {tour.tourName}
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Your bookings"
        description="Everything you have booked, and what it will cost."
        actions={
          <Button asChild variant="outline">
            <Link href="/bookings">Open bookings</Link>
          </Button>
        }
      >
        <p className="py-2 text-sm text-[#627176]">
          Walk and Tour confirms each booking. Prices exclude VAT and stay an estimate until
          the booking is invoiced, because charges specific to a booking can be added along
          the way.
        </p>
      </AdminSectionCard>
    </>
  );
}
