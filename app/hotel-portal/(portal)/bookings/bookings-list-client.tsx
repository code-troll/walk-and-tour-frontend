"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {LoaderCircle, Plus} from "lucide-react";

import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {BookingStatusBadge} from "@/components/hotel-portal/BookingPieces";
import {Button} from "@/components/ui/button";
import {getHotelBookingsClient} from "@/lib/hotel-portal/booking-client";
import {
  BOOKING_STATUS_FILTERS,
  formatBookingAmount,
  HOTEL_BOOKING_STATUS_LABELS,
  type ApiHotelBookingList,
} from "@/lib/hotel-portal/booking-types";

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(
    new Date(value),
  );

export default function BookingsListClient() {
  const [bookings, setBookings] = useState<ApiHotelBookingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBookings(await getHotelBookingsClient({status: status || undefined}));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load your bookings.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  if (error) {
    return (
      <AdminNoticeCard
        eyebrow="Bookings"
        title="Your bookings could not be loaded."
        description={error}
        actions={
          <Button onClick={() => void loadBookings()} variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  const items = bookings?.items ?? [];

  return (
    <AdminSectionCard
      title="Bookings"
      description="Tours you have booked for your guests."
      actions={
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="size-4" />
            Book a tour
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-1 rounded-full border border-[#eadfce] bg-[#fffcf7] p-1">
        {BOOKING_STATUS_FILTERS.map((filter) => (
          <button
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              status === filter.value
                ? "bg-[#21343b] text-white"
                : "text-[#627176] hover:text-[#21343b]"
            }`}
            key={filter.value || "all"}
            onClick={() => setStatus(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-[#627176]">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your bookings…
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-[#627176]">
          {status
            ? "No bookings match this filter."
            : "You have not booked anything yet. Book a tour to get started."}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((booking) => (
            <li key={booking.id}>
              <Link
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfce] bg-white px-4 py-3 transition hover:border-[#d8c5a8]"
                href={`/bookings/${booking.id}`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#21343b]">{booking.tourName}</p>
                  <p className="text-xs text-[#8a8477]">
                    {formatWhen(booking.scheduledFor)} · {booking.participantCount}{" "}
                    {booking.participantCount === 1 ? "guest" : "guests"} ·{" "}
                    {booking.guest.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-mono text-sm tabular-nums text-[#21343b]">
                    {formatBookingAmount(booking.totalAmount, booking.currency)}
                    {booking.isEstimate && booking.totalAmount ? (
                      <span className="ml-1 text-xs text-[#8a8477]">est.</span>
                    ) : null}
                  </span>
                  <BookingStatusBadge
                    labels={HOTEL_BOOKING_STATUS_LABELS}
                    status={booking.status}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminSectionCard>
  );
}
