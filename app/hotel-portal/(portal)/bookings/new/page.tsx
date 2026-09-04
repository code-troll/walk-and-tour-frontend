import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getHotelViewerState} from "@/lib/hotel-portal/session";
import BookingFormClient from "./booking-form-client";

export default async function NewHotelPortalBookingPage() {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const {tours} = viewerState.viewer;

  if (tours.length === 0) {
    return (
      <AdminNoticeCard
        eyebrow="Bookings"
        title="No tours are available to you yet."
        description="Walk and Tour assigns the tours your hotel can sell. Once they do, you can book them here."
      />
    );
  }

  return <BookingFormClient tours={tours} />;
}
