import {PortalNotice} from "@/components/hotel-portal/PortalUi";
import type {BookingFormState} from "@/lib/hotel-portal/booking-types";
import {getHotelViewerState} from "@/lib/hotel-portal/session";
import {getBookingAction, getTourListAction} from "../../actions";
import BookingFormClient from "./booking-form-client";

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * The guest of an earlier booking, for booking them a second tour.
 *
 * Only who they are and how they travel is carried over. The date is left
 * empty: the next tour is almost never on the same day as the last one, and a
 * copied date is the field nobody rereads.
 */
const guestOf = async (bookingId: string): Promise<Partial<BookingFormState>> => {
  const result = await getBookingAction(bookingId);

  if (!result.ok) {
    return {};
  }

  const {booking} = result;

  return {
    languageCode: booking.languageCode,
    participantCount: String(booking.participantCount),
    guestName: booking.guest.name,
    guestEmail: booking.guest.email ?? "",
    guestPhone: booking.guest.phone ?? "",
    roomNumber: booking.guest.roomNumber ?? "",
  };
};

export default async function NewHotelPortalBookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const params = await searchParams;
  const requestedTourId = firstValue(params.tourId);
  const sameGuestAs = firstValue(params.sameGuestAs);

  // The whole catalogue this hotel may sell, fetched on the server so the
  // search is live from the first keystroke rather than after a round trip.
  const [result, guest] = await Promise.all([
    getTourListAction(),
    sameGuestAs ? guestOf(sameGuestAs) : Promise.resolve({}),
  ]);
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

  // A tour chosen elsewhere skips the search — but only one this hotel may
  // still sell. Anything else falls back to the search, as if no tour was given.
  const initialTourId = tours.some((tour) => tour.tourId === requestedTourId)
    ? requestedTourId
    : undefined;

  return (
    <BookingFormClient
      // The form's state is seeded once. Following "Book a tour" from a form
      // that was opened for a particular tour must start a fresh one, not keep it.
      key={`${initialTourId ?? ""}:${sameGuestAs ?? ""}`}
      initialForm={{...guest, ...(initialTourId ? {tourId: initialTourId} : {})}}
      tours={tours}
    />
  );
}
