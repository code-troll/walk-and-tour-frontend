import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
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

      <AdminNoticeCard
        eyebrow="Coming next"
        title="Booking is not open yet."
        description="You can already see the tours available to you. Placing and tracking bookings arrives in the next release."
      />
    </>
  );
}
