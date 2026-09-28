import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";
import {getTourListAction} from "../../actions";
import BookingDetailClient from "./booking-detail-client";

/** How many other tours are offered after a booking. */
const SUGGESTION_COUNT = 3;

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }

  return shuffled;
};

/**
 * Other tours the hotel may sell, picked at random, for the guest just booked.
 *
 * Drawn here rather than in the browser so the server and the client render
 * the same three. One more than is shown is kept, because the tour just booked
 * may be among them and the client is the one that knows which it is.
 */
const suggestTours = async (): Promise<ApiHotelTourDetail[]> => {
  const result = await getTourListAction();

  return result.ok ? shuffle(result.tours).slice(0, SUGGESTION_COUNT + 1) : [];
};

export default async function HotelPortalBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{id: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{id}, {placed}] = await Promise.all([params, searchParams]);

  // Only on arrival from the booking form. Opening the booking later is to
  // check on it, not to be offered something else.
  const suggestions = placed ? await suggestTours() : [];

  return (
    <BookingDetailClient
      bookingId={id}
      suggestionCount={SUGGESTION_COUNT}
      suggestions={suggestions}
    />
  );
}
