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
      <div className="mb-4 flex flex-wrap items-center gap-5">
        {BOOKING_STATUS_FILTERS.map((filter) => (
          <button
            className={`pb-1 text-sm transition ${
              status === filter.value
                ? "border-b-2 border-[var(--wt-nav-marker)] font-medium text-[var(--wt-ink)]"
                : "border-b-2 border-transparent text-[var(--wt-ink-muted)] hover:text-[var(--wt-ink)]"
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
        <p className="flex items-center gap-2 py-8 text-sm text-[var(--wt-ink-muted)]">
          <LoaderCircle className="size-4 animate-spin" />
          Loading bookings…
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-[var(--wt-ink-muted)]">
          {status ? "No bookings match this filter." : "No hotel has booked anything yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--wt-rule-strong)] text-xs uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
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
                <tr className="border-b border-[var(--wt-rule)] last:border-b-0" key={booking.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-[var(--wt-ink-muted)]">
                    {booking.reference}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-[var(--wt-ink)]">{booking.tourName}</p>
                    <p className="text-xs text-[var(--wt-ink-muted)]">{booking.guest.name}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--wt-ink-muted)]">
                    {formatWhen(booking.scheduledFor)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-[var(--wt-ink-muted)]">
                    {booking.participantCount}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs tabular-nums text-[var(--wt-ink)]">
                    {formatBookingAmount(booking.totalAmount, booking.currency)}
                    {booking.isEstimate && booking.totalAmount ? (
                      <span className="ml-1 text-[var(--wt-ink-muted)]">est.</span>
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
