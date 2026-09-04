"use client";

import {useCallback, useEffect, useState} from "react";
import {LoaderCircle} from "lucide-react";

import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {BookingStatusBadge} from "@/components/hotel-portal/BookingPieces";
import {Button} from "@/components/ui/button";
import {getAdminHotelBookingsClient} from "@/lib/admin/admin-hotel-booking-client";
import {
  ADMIN_BOOKING_STATUS_LABELS,
  BOOKING_STATUS_FILTERS,
  formatBookingAmount,
  type ApiHotelBookingList,
} from "@/lib/hotel-portal/booking-types";

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(
    new Date(value),
  );

export default function HotelBookingsListClient() {
  const [bookings, setBookings] = useState<ApiHotelBookingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useAdminRouteLoadingBoundary(isLoading);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBookings(await getAdminHotelBookingsClient({status: status || undefined}));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load hotel bookings.",
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
        eyebrow="Admin API"
        title="Hotel bookings could not be loaded."
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
      title="Hotel bookings"
      description="Tours hotels have booked for their guests. Confirm, complete and invoice them here."
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
          Loading bookings…
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-[#627176]">
          {status ? "No bookings match this filter." : "No hotel has booked anything yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#f0e6d8] text-xs uppercase tracking-[0.14em] text-[#9a8f7d]">
                <th className="py-3 pr-4 font-semibold">Reference</th>
                <th className="py-3 pr-4 font-semibold">Tour</th>
                <th className="py-3 pr-4 font-semibold">When</th>
                <th className="py-3 pr-4 font-semibold">Guests</th>
                <th className="py-3 pr-4 font-semibold">Total</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {items.map((booking) => (
                <tr className="border-b border-[#f6f0e6] last:border-b-0" key={booking.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-[#53656c]">
                    {booking.reference}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[#21343b]">{booking.tourName}</p>
                    <p className="text-xs text-[#8a8477]">{booking.guest.name}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#53656c]">
                    {formatWhen(booking.scheduledFor)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-[#53656c]">
                    {booking.participantCount}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs tabular-nums text-[#21343b]">
                    {formatBookingAmount(booking.totalAmount, booking.currency)}
                    {booking.isEstimate && booking.totalAmount ? (
                      <span className="ml-1 text-[#8a8477]">est.</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <BookingStatusBadge
                      labels={ADMIN_BOOKING_STATUS_LABELS}
                      status={booking.status}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <AdminProgressLink href={`/hotel-bookings/${booking.id}`}>
                        Open
                      </AdminProgressLink>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSectionCard>
  );
}
