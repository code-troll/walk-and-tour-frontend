"use client";

import {
  formatBookingAmount,
  HOTEL_BOOKING_STATUS_TONE,
  type ApiHotelBooking,
} from "@/lib/hotel-portal/booking-types";

const TONE_CLASSES: Record<string, string> = {
  positive: "bg-[#e9f2ea] text-[#2f6b3f]",
  warning: "bg-[#f6ecda] text-[#7a5424]",
  neutral: "bg-[#e2eeef] text-[#1f4d53]",
  muted: "bg-[#f1ede6] text-[#7a6a55]",
};

export function BookingStatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const tone = HOTEL_BOOKING_STATUS_TONE[status] ?? "muted";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}
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
    <div className="rounded-2xl border border-[#eadfce] bg-[#fffcf7] p-5">
      <ul className="space-y-2">
        {booking.lineItems.map((lineItem) => (
          <li className="flex items-baseline justify-between gap-4 text-sm" key={lineItem.id}>
            <span className={lineItem.kind === "base" ? "text-[#21343b]" : "text-[#53656c]"}>
              {lineItem.description}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-[#21343b]">
              {formatBookingAmount(lineItem.amount, booking.currency)}
            </span>
          </li>
        ))}
        {booking.lineItems.length === 0 ? (
          <li className="text-sm text-[#627176]">
            This tour has no set price. Walk and Tour will confirm the amount with you.
          </li>
        ) : null}
      </ul>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[#eadfce] pt-4">
        <span className="font-semibold text-[#21343b]">Total</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-[#21343b]">
          {formatBookingAmount(booking.totalAmount, booking.currency)}
        </span>
      </div>

      <p className="mt-3 text-xs text-[#8a8477]">
        {booking.isEstimate
          ? "Amounts exclude VAT and are an estimate. Walk and Tour may add charges for anything specific to this booking, so the total can still change until it is invoiced."
          : "Amounts exclude VAT. This booking has been invoiced, so the total is final."}
      </p>
    </div>
  );
}

export function BookingHistory({booking}: {booking: ApiHotelBooking}) {
  if (booking.logs.length === 0) {
    return <p className="text-sm text-[#627176]">Nothing has happened yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {[...booking.logs].reverse().map((log) => (
        <li className="flex gap-3 text-sm" key={log.id}>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#d8c5a8]" />
          <div className="min-w-0">
            <p className="text-[#21343b]">
              {describeLog(log.type, log.fromStatus, log.toStatus)}
            </p>
            <p className="text-xs text-[#8a8477]">
              {log.actorLabel} ·{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(log.createdAt))}
            </p>
            {log.reason ? (
              <p className="mt-1 text-xs italic text-[#627176]">“{log.reason}”</p>
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
