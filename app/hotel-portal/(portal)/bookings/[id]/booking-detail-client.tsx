"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {ArrowLeft, LoaderCircle} from "lucide-react";

import {
  BookingBreakdown,
  BookingHistory,
  BookingStatusBadge,
} from "@/components/hotel-portal/BookingPieces";
import {
  PortalAlert,
  PortalField,
  PortalNotice,
  PortalSection,
  portalQuietAction,
  portalSecondaryAction,
} from "@/components/hotel-portal/PortalUi";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {getHotelBookingClient} from "@/lib/hotel-portal/booking-client";
import {
  HOTEL_BOOKING_STATUS_LABELS,
  type ApiHotelBooking,
} from "@/lib/hotel-portal/booking-types";
import {cancelBookingAction} from "../../actions";

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {dateStyle: "full", timeStyle: "short"}).format(
    new Date(value),
  );

export default function BookingDetailClient({bookingId}: {bookingId: string}) {
  const [booking, setBooking] = useState<ApiHotelBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const loaded = await getHotelBookingClient(bookingId);

      if (!loaded) {
        setError("This booking was not found.");
        return;
      }

      setBooking(loaded);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load this booking.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const handleCancel = async () => {
    setIsCancelling(true);
    setActionError(null);

    try {
      const result = await cancelBookingAction({
        id: bookingId,
        reason: cancelReason.trim() || undefined,
      });

      if (!result.ok) {
        setActionError(result.message);
        return;
      }

      setBooking(result.booking);
      setIsCancelOpen(false);
      setCancelReason("");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <PortalNotice kicker="Booking" title="Loading…" description="Fetching this booking." />
    );
  }

  if (error || !booking) {
    return (
      <PortalNotice
        kicker="Booking"
        title="This booking could not be loaded."
        description={error ?? "It may have been removed."}
        actions={
          <Link className={portalSecondaryAction} href="/bookings">
            Back to bookings
          </Link>
        }
      />
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={portalQuietAction} href="/bookings">
          <ArrowLeft className="size-4" />
          Bookings
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--wt-ink-muted)]">
          {booking.reference}
        </span>
      </div>

      {actionError ? <PortalAlert>{actionError}</PortalAlert> : null}

      <PortalSection
        title={booking.tourName}
        description={formatWhen(booking.scheduledFor)}
        actions={
          <div className="flex items-center gap-4">
            <BookingStatusBadge
              labels={HOTEL_BOOKING_STATUS_LABELS}
              status={booking.status}
            />
            {canCancel ? (
              <button
                className={portalSecondaryAction}
                onClick={() => setIsCancelOpen(true)}
                type="button"
              >
                Cancel booking
              </button>
            ) : null}
          </div>
        }
      >
        <dl className="grid gap-5 sm:grid-cols-3">
          <PortalField label="Guest">
            {booking.guest.name}
            {booking.guest.roomNumber ? (
              <span className="block text-xs text-[var(--wt-ink-muted)]">
                Room {booking.guest.roomNumber}
              </span>
            ) : null}
          </PortalField>
          <PortalField label="Guests">{booking.participantCount}</PortalField>
          <PortalField label="Language">
            <span className="uppercase">{booking.languageCode}</span>
          </PortalField>
        </dl>

        {booking.notes ? (
          <p className="mt-5 max-w-prose border-l-2 border-[var(--wt-rule-strong)] py-1 pl-4 text-sm text-[var(--wt-ink-muted)]">
            {booking.notes}
          </p>
        ) : null}

        {booking.cancellationReason ? (
          <div className="mt-5">
            <PortalAlert>Cancelled: {booking.cancellationReason}</PortalAlert>
          </div>
        ) : null}
      </PortalSection>

      <PortalSection title="Price">
        <BookingBreakdown booking={booking} />
      </PortalSection>

      <PortalSection title="History">
        <BookingHistory booking={booking} />
      </PortalSection>

      <Dialog onOpenChange={setIsCancelOpen} open={isCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              Walk and Tour will be notified. This cannot be undone — you would need to
              place a new booking.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Why is it being cancelled? Optional, but it helps."
            rows={3}
            value={cancelReason}
          />
          <DialogFooter>
            <Button
              disabled={isCancelling}
              onClick={() => setIsCancelOpen(false)}
              variant="outline"
            >
              Keep it
            </Button>
            <Button disabled={isCancelling} onClick={() => void handleCancel()}>
              {isCancelling ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
