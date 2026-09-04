"use client";

import {formatBookingAmount, type ApiHotelBooking} from "@/lib/hotel-portal/booking-types";

/**
 * The five booking states, drawn with the status tokens from
 * `app/design-system.css`.
 *
 * They are keyed off the status itself rather than the shared tone map, because
 * the tone map is a backoffice notion ("positive", "warning") and the portal
 * does not need to editorialise: a hotel wants to know where its booking is,
 * not how Walk and Tour feels about it.
 *
 * Red is absent on purpose. It is the brand's primary colour; a cancelled
 * booking is not an error, it is inert, so it is grey.
 */
const STATUS_MARKER: Record<string, string> = {
  pending: "border-[var(--wt-status-pending)]",
  confirmed: "border-[var(--wt-status-confirmed)]",
  completed: "border-[var(--wt-status-completed)]",
  invoiced: "border-[var(--wt-status-invoiced)]",
  cancelled: "border-[var(--wt-status-cancelled)]",
};

export function BookingStatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const marker = STATUS_MARKER[status] ?? "border-[var(--wt-status-cancelled)]";

  return (
    <span
      className={`inline-flex items-center border-l-[3px] pl-2 text-xs font-medium uppercase tracking-[0.06em] text-[var(--wt-ink-muted)] ${marker}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

/**
 * The priced breakdown.
 *
 * The estimate notice is driven by `isEstimate` from the API rather than by
 * checking the status here, so it disappears the moment the booking is invoiced
 * and every screen agrees on when that is.
 */
export function BookingBreakdown({booking}: {booking: ApiHotelBooking}) {
  return (
    <div>
      <ul>
        {booking.lineItems.map((lineItem) => (
          <li
            className="flex items-baseline justify-between gap-4 border-b border-[var(--wt-rule)] py-2.5 text-sm"
            key={lineItem.id}
          >
            <span
              className={
                lineItem.kind === "base" ? "text-[var(--wt-ink)]" : "text-[var(--wt-ink-muted)]"
              }
            >
              {lineItem.description}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--wt-ink)]">
              {formatBookingAmount(lineItem.amount, booking.currency)}
            </span>
          </li>
        ))}
        {booking.lineItems.length === 0 ? (
          <li className="py-2.5 text-sm text-[var(--wt-ink-muted)]">
            This tour has no set price. Walk and Tour will confirm the amount with you.
          </li>
        ) : null}
      </ul>

      {/* The heavy rule above the total is teal — the one structural accent Skilt allows. */}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t-[3px] border-[var(--wt-rule-strong)] pt-3">
        <span className="text-lg font-medium text-[var(--wt-ink)]">Total</span>
        <span className="text-lg font-medium tabular-nums text-[var(--wt-ink)]">
          {formatBookingAmount(booking.totalAmount, booking.currency)}
        </span>
      </div>

      <p className="mt-3 max-w-prose text-xs leading-5 text-[var(--wt-ink-muted)]">
        {booking.isEstimate
          ? "Amounts exclude VAT and are an estimate. Walk and Tour may add charges for anything specific to this booking, so the total can still change until it is invoiced."
          : "Amounts exclude VAT. This booking has been invoiced, so the total is final."}
      </p>
    </div>
  );
}

export function BookingHistory({booking}: {booking: ApiHotelBooking}) {
  if (booking.logs.length === 0) {
    return <p className="text-sm text-[var(--wt-ink-muted)]">Nothing has happened yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {[...booking.logs].reverse().map((log) => (
        <li className="flex gap-3 text-sm" key={log.id}>
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--wt-status-confirmed)]" />
          <div className="min-w-0">
            <p className="text-[var(--wt-ink)]">
              {describeLog(log.type, log.fromStatus, log.toStatus)}
            </p>
            <p className="text-xs text-[var(--wt-ink-muted)]">
              {log.actorLabel} ·{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(log.createdAt))}
            </p>
            {log.reason ? (
              <p className="mt-1 text-xs italic text-[var(--wt-ink-muted)]">“{log.reason}”</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

const describeLog = (
  type: string,
  fromStatus: string | null | undefined,
  toStatus: string | null | undefined,
): string => {
  if (type === "created") {
    return "Booking placed";
  }

  if (type === "status_changed" && toStatus) {
    const verbs: Record<string, string> = {
      confirmed: "Confirmed by Walk and Tour",
      completed: "Marked as completed",
      cancelled: "Cancelled",
      invoiced: "Invoiced",
    };

    return verbs[toStatus] ?? `Moved from ${fromStatus} to ${toStatus}`;
  }

  if (type === "line_item_added") {
    return "A charge was added";
  }

  if (type === "line_item_removed") {
    return "A charge was removed";
  }

  return "Updated";
};
