"use client";

import {useCallback, useEffect, useState} from "react";
import {LoaderCircle, Plus, Trash2} from "lucide-react";

import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminBackRow, AdminHeaderMeta, AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {BookingHistory, BookingStatusBadge} from "@/components/hotel-portal/BookingPieces";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {getAdminHotelBookingClient} from "@/lib/admin/admin-hotel-booking-client";
import {
  ADMIN_BOOKING_STATUS_LABELS,
  formatBookingAmount,
  type ApiHotelBooking,
} from "@/lib/hotel-portal/booking-types";
import {
  addLineItemAction,
  cancelAdminBookingAction,
  completeBookingAction,
  confirmBookingAction,
  invoiceBookingAction,
  removeLineItemAction,
} from "./actions";

const AMOUNT_PATTERN = /^-?\d{1,8}(\.\d{1,2})?$/;
const FEEDBACK_TIMEOUT_MS = 5000;

/** Mirrors the backend transition table so a refused action is never offered. */
const NEXT_ACTIONS: Record<string, Array<"confirm" | "complete" | "invoice" | "cancel">> = {
  pending: ["confirm", "cancel"],
  confirmed: ["complete", "cancel"],
  completed: ["invoice", "cancel"],
  cancelled: [],
  invoiced: [],
};

const ACTION_LABELS = {
  confirm: "Confirm",
  complete: "Mark completed",
  invoice: "Mark invoiced",
  cancel: "Cancel booking",
} as const;

/** Spelled out rather than built from the action name, which gave "invoiceed". */
const ACTION_CONFIRMATIONS = {
  confirm: "Booking confirmed.",
  complete: "Booking marked as completed.",
  invoice: "Booking marked as invoiced. Its charges are now frozen.",
  cancel: "Booking cancelled.",
} as const;

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {dateStyle: "full", timeStyle: "short"}).format(
    new Date(value),
  );

export default function HotelBookingDetailClient({bookingId}: {bookingId: string}) {
  const [booking, setBooking] = useState<ApiHotelBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useAdminRouteLoadingBoundary(isLoading);

  const announce = useCallback((message: string) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), FEEDBACK_TIMEOUT_MS);
  }, []);

  const loadBooking = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const loaded = await getAdminHotelBookingClient(bookingId);

      if (!loaded) {
        setLoadError("This booking was not found.");
        return;
      }

      setBooking(loaded);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load this booking.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const run = async (
    key: string,
    action: () => Promise<
      {ok: true; booking: ApiHotelBooking} | {ok: false; message: string}
    >,
    message: string,
  ) => {
    setPending(key);
    setActionError(null);

    try {
      const result = await action();

      if (!result.ok) {
        setActionError(result.message);
        return;
      }

      setBooking(result.booking);
      announce(message);
    } finally {
      setPending(null);
    }
  };

  const handleAddLineItem = async () => {
    if (!description.trim()) {
      setActionError("Describe what the hotel is being charged for.");
      return;
    }

    if (!AMOUNT_PATTERN.test(amount.trim())) {
      setActionError("Enter an amount like 150.50, or -50.00 for a discount.");
      return;
    }

    await run(
      "add-line",
      () =>
        addLineItemAction({
          id: bookingId,
          description: description.trim(),
          amount: amount.trim(),
        }),
      "Charge added.",
    );

    setDescription("");
    setAmount("");
  };

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading…"
        description="Fetching this booking."
      />
    );
  }

  if (loadError || !booking) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="This booking could not be loaded."
        description={loadError ?? "It may have been removed."}
        actions={
          <Button asChild variant="outline">
            <AdminProgressLink href="/hotel-bookings">Hotel bookings</AdminProgressLink>
          </Button>
        }
      />
    );
  }

  const actions = NEXT_ACTIONS[booking.status] ?? [];
  const canEditMoney = ["pending", "confirmed", "completed"].includes(booking.status);

  return (
    <div className="space-y-6">
      <AdminBackRow href="/hotel-bookings" label="Hotel bookings">
        <AdminHeaderMeta>{booking.reference}</AdminHeaderMeta>
      </AdminBackRow>

      {actionError ? (
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
          {actionError}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] px-4 py-3 text-sm text-[var(--wt-status-confirmed)]">
          {success}
        </p>
      ) : null}

      <AdminSectionCard
        title={booking.tourName}
        description={formatWhen(booking.scheduledFor)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge
              labels={ADMIN_BOOKING_STATUS_LABELS}
              status={booking.status}
            />
            {actions.map((action) => (
              <Button
                disabled={pending !== null}
                key={action}
                onClick={() =>
                  void run(
                    action,
                    () => {
                      if (action === "confirm") return confirmBookingAction(bookingId);
                      if (action === "complete") return completeBookingAction(bookingId);
                      if (action === "invoice") return invoiceBookingAction(bookingId);
                      return cancelAdminBookingAction({id: bookingId});
                    },
                    ACTION_CONFIRMATIONS[action],
                  )
                }
                variant={action === "cancel" ? "outline" : "default"}
              >
                {pending === action ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {ACTION_LABELS[action]}
              </Button>
            ))}
          </div>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">Guest</dt>
            <dd className="mt-1 text-sm text-[var(--wt-ink)]">
              {booking.guest.name}
              {booking.guest.roomNumber ? (
                <span className="block text-xs text-[var(--wt-ink-muted)]">Room {booking.guest.roomNumber}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">Guests</dt>
            <dd className="mt-1 text-sm text-[var(--wt-ink)]">{booking.participantCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">Language</dt>
            <dd className="mt-1 text-sm uppercase text-[var(--wt-ink)]">{booking.languageCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">Contact</dt>
            <dd className="mt-1 text-xs text-[var(--wt-ink-muted)]">
              {booking.guest.email ?? "—"}
              <span className="block">{booking.guest.phone ?? ""}</span>
            </dd>
          </div>
        </dl>

        {booking.notes ? (
          <p className="mt-4 border-l-2 border-[var(--wt-rule-strong)] px-4 py-3 text-sm text-[var(--wt-ink-muted)]">
            {booking.notes}
          </p>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard
        title="Charges"
        description={
          canEditMoney
            ? "Amounts exclude VAT. A negative amount is a discount. Once the booking is invoiced these are frozen."
            : "Amounts exclude VAT. This booking is frozen and its charges can no longer change."
        }
      >
        <ul className="space-y-2">
          {booking.lineItems.map((lineItem) => (
            <li
              className="flex items-center justify-between gap-4 border-b border-[var(--wt-rule)] px-4 py-3"
              key={lineItem.id}
            >
              <span className="min-w-0 text-sm text-[var(--wt-ink)]">
                {lineItem.description}
                {lineItem.kind === "base" ? (
                  <span className="ml-2 text-xs text-[var(--wt-ink-muted)]">the tour</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm tabular-nums text-[var(--wt-ink)]">
                  {formatBookingAmount(lineItem.amount, booking.currency)}
                </span>
                {canEditMoney && lineItem.kind !== "base" ? (
                  <Button
                    aria-label="Remove charge"
                    disabled={pending !== null}
                    onClick={() =>
                      void run(
                        `remove-${lineItem.id}`,
                        () =>
                          removeLineItemAction({id: bookingId, lineItemId: lineItem.id}),
                        "Charge removed.",
                      )
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
          {booking.lineItems.length === 0 ? (
            <li className="text-sm text-[var(--wt-ink-muted)]">
              This tour has no set price, so the booking has no charges yet.
            </li>
          ) : null}
        </ul>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--wt-rule-strong)] pt-4">
          <span className="font-semibold text-[var(--wt-ink)]">
            Total{booking.isEstimate ? " (estimate)" : ""}
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums text-[var(--wt-ink)]">
            {formatBookingAmount(booking.totalAmount, booking.currency)}
          </span>
        </div>

        {canEditMoney ? (
          <div className="mt-5 grid gap-3 border-t border-[var(--wt-rule-strong)] pt-5 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
            <div>
              <Label htmlFor="charge-description">Add a charge</Label>
              <Input
                id="charge-description"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Private guide surcharge"
                value={description}
              />
            </div>
            <div>
              <Label htmlFor="charge-amount">Amount</Label>
              <Input
                id="charge-amount"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="150.50"
                value={amount}
              />
            </div>
            <div className="flex items-end">
              <Button disabled={pending !== null} onClick={() => void handleAddLineItem()}>
                {pending === "add-line" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add
              </Button>
            </div>
          </div>
        ) : null}
      </AdminSectionCard>

      <AdminSectionCard title="History">
        <BookingHistory booking={booking} />
      </AdminSectionCard>
    </div>
  );
}
