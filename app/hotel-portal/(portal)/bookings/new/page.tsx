import {PortalNotice} from "@/components/hotel-portal/PortalUi";
import {getHotelViewerState} from "@/lib/hotel-portal/session";
import {getTourListAction} from "../../actions";
import BookingFormClient from "./booking-form-client";

export default async function NewHotelPortalBookingPage() {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  // The whole catalogue this hotel may sell, fetched on the server so the
  // search is live from the first keystroke rather than after a round trip.
  const result = await getTourListAction();
  const tours = result.ok ? result.tours : [];

  if (tours.length === 0) {
    return (
      <PortalNotice
        kicker="Bookings"
        title={
          result.ok
            ? "No tours are available to you yet."
            : "The tours you can book could not be loaded."
        }
        description={
          result.ok
            ? "Walk and Tour assigns the tours your hotel can sell. Once they do, you can book them here."
            : "Try again in a moment. If it keeps happening, write to info@walkandtour.dk."
        }
      />
    );
  }

  return <BookingFormClient tours={tours} />;
}
