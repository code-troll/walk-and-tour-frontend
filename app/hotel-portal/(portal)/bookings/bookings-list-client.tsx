"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {LoaderCircle, Plus} from "lucide-react";

import {BookingStatusBadge} from "@/components/hotel-portal/BookingPieces";
import {
  PortalNotice,
  PortalSection,
  portalPrimaryAction,
  portalSecondaryAction,
} from "@/components/hotel-portal/PortalUi";
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
      <PortalNotice
        kicker="Bookings"
        title="Your bookings could not be loaded."
        description={error}
        actions={
          <button
            className={portalSecondaryAction}
            onClick={() => void loadBookings()}
            type="button"
          >
            Retry
          </button>
        }
      />
    );
  }

  const items = bookings?.items ?? [];

  return (
    <PortalSection
      title="Bookings"
      description="Tours you have booked for your guests."
      actions={
        <Link className={portalPrimaryAction} href="/bookings/new">
          <Plus className="size-4" />
          Book a tour
        </Link>
      }
    >
      {/*
        The filter is a row of text, not a segmented control. Skilt draws state
        with a rule under the active item, the same device the navigation uses,
        so the two read as one language.
      */}
      <div className="mb-6 flex flex-wrap items-center gap-5">
        {BOOKING_STATUS_FILTERS.map((filter) => (
          <button
            className={`pb-1 text-sm transition ${
              status === filter.value
                ? "border-b-2 border-[var(--wt-rule-strong)] font-medium text-[var(--wt-ink)]"
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
          Loading your bookings…
        </p>
      ) : items.length === 0 ? (
        <p className="py-8 text-sm text-[var(--wt-ink-muted)]">
          {status
            ? "No bookings match this filter."
            : "You have not booked anything yet. Book a tour to get started."}
        </p>
      ) : (
        <ul>
          {items.map((booking) => (
            <li className="border-b border-[var(--wt-rule)]" key={booking.id}>
              <Link
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition hover:bg-[var(--wt-surface-sunk)]"
                href={`/bookings/${booking.id}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--wt-ink)]">{booking.tourName}</p>
                  <p className="text-xs text-[var(--wt-ink-muted)]">
                    {formatWhen(booking.scheduledFor)} · {booking.participantCount}{" "}
                    {booking.participantCount === 1 ? "guest" : "guests"} ·{" "}
                    {booking.guest.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-sm tabular-nums text-[var(--wt-ink)]">
                    {formatBookingAmount(booking.totalAmount, booking.currency)}
                    {booking.isEstimate && booking.totalAmount ? (
                      <span className="ml-1 text-xs text-[var(--wt-ink-muted)]">est.</span>
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
    </PortalSection>
  );
}
