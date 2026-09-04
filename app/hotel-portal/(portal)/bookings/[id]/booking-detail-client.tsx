"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {ArrowLeft, LoaderCircle} from "lucide-react";

import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {BookingBreakdown, BookingHistory, BookingStatusBadge} from "@/components/hotel-portal/BookingPieces";
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
      <AdminNoticeCard
        eyebrow="Booking"
        title="Loading…"
        description="Fetching this booking."
      />
    );
  }

  if (error || !booking) {
    return (
      <AdminNoticeCard
        eyebrow="Booking"
        title="This booking could not be loaded."
        description={error ?? "It may have been removed."}
        actions={
          <Button asChild variant="outline">
            <Link href="/bookings">Back to bookings</Link>
          </Button>
        }
      />
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/bookings">
            <ArrowLeft className="size-4" />
            Bookings
          </Link>
        </Button>
        <span className="font-mono text-xs text-[#8a8477]">{booking.reference}</span>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
          {actionError}
        </p>
      ) : null}

      <AdminSectionCard
        title={booking.tourName}
        description={formatWhen(booking.scheduledFor)}
        actions={
          <div className="flex items-center gap-3">
            <BookingStatusBadge
              labels={HOTEL_BOOKING_STATUS_LABELS}
              status={booking.status}
            />
            {canCancel ? (
              <Button onClick={() => setIsCancelOpen(true)} variant="outline">
                Cancel booking
              </Button>
            ) : null}
          </div>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a8f7d]">
              Guest
            </dt>
            <dd className="mt-1 text-sm text-[#21343b]">
              {booking.guest.name}
              {booking.guest.roomNumber ? (
                <span className="block text-xs text-[#8a8477]">
                  Room {booking.guest.roomNumber}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a8f7d]">
              Guests
            </dt>
            <dd className="mt-1 text-sm text-[#21343b]">{booking.participantCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a8f7d]">
              Language
            </dt>
            <dd className="mt-1 text-sm uppercase text-[#21343b]">{booking.languageCode}</dd>
          </div>
        </dl>

        {booking.notes ? (
          <p className="mt-4 rounded-xl border border-[#eadfce] bg-[#fffcf7] px-4 py-3 text-sm text-[#53656c]">
            {booking.notes}
          </p>
        ) : null}

        {booking.cancellationReason ? (
          <p className="mt-4 rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
            Cancelled: {booking.cancellationReason}
          </p>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard title="Price">
        <BookingBreakdown booking={booking} />
      </AdminSectionCard>

      <AdminSectionCard title="History">
        <BookingHistory booking={booking} />
      </AdminSectionCard>

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
