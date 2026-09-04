import BookingDetailClient from "./booking-detail-client";

export default async function HotelPortalBookingPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = await params;

  return <BookingDetailClient bookingId={id} />;
}
