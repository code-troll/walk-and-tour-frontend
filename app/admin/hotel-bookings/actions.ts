"use server";

import {getAdminViewerState} from "@/lib/admin/session";
import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import type {ApiHotelBooking} from "@/lib/hotel-portal/booking-types";

type BookingActionError = {ok: false; statusCode: number; message: string};

export type AdminBookingActionResult =
  | {ok: true; booking: ApiHotelBooking}
  | BookingActionError;

const getAdminContext = async (): Promise<
  {ok: true; accessToken: string; backendApiBaseUrl: string} | BookingActionError
> => {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind === "unauthenticated") {
    return {ok: false, statusCode: 401, message: "Authentication required."};
  }

  if (viewerState.kind === "backend-error") {
    return {ok: false, statusCode: viewerState.statusCode, message: viewerState.message};
  }

  if (viewerState.kind !== "authenticated") {
    return {ok: false, statusCode: 503, message: "Unable to initialize the admin session."};
  }

  // Operating bookings is open to editors as well; only hotel administration
  // itself is restricted to super admins.
  if (viewerState.backendAdmin.roleName === "marketing") {
    return {
      ok: false,
      statusCode: 403,
      message: "You do not have access to hotel bookings.",
    };
  }

  return {
    ok: true,
    accessToken: viewerState.accessToken,
    backendApiBaseUrl: requireBackendApiBaseUrl(),
  };
};

const bookingFetch = async (
  path: string,
  method: string,
  accessToken: string,
  backendApiBaseUrl: string,
  body?: unknown,
): Promise<ApiHotelBooking> => {
  const response = await fetch(
    `${backendApiBaseUrl}/api/admin/hotel-bookings${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(formatBackendErrorMessage(payload, "The request failed."));
  }

  return payload as ApiHotelBooking;
};

const run = async (
  path: string,
  method: string,
  fallbackMessage: string,
  body?: unknown,
): Promise<AdminBookingActionResult> => {
  const context = await getAdminContext();

  if (!context.ok) {
    return context;
  }

  try {
    return {
      ok: true,
      booking: await bookingFetch(
        path,
        method,
        context.accessToken,
        context.backendApiBaseUrl,
        body,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : fallbackMessage,
    };
  }
};

export async function confirmBookingAction(id: string) {
  return run(`/${id}/confirm`, "POST", "Unable to confirm this booking.");
}

export async function completeBookingAction(id: string) {
  return run(`/${id}/complete`, "POST", "Unable to complete this booking.");
}

export async function invoiceBookingAction(id: string) {
  return run(`/${id}/invoice`, "POST", "Unable to invoice this booking.");
}

export async function cancelAdminBookingAction({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}) {
  return run(`/${id}/cancel`, "POST", "Unable to cancel this booking.", 
    reason ? {reason} : {});
}

export async function addLineItemAction({
  id,
  description,
  amount,
}: {
  id: string;
  description: string;
  amount: string;
}) {
  return run(`/${id}/line-items`, "POST", "Unable to add this charge.", {
    description,
    amount,
  });
}

export async function removeLineItemAction({
  id,
  lineItemId,
}: {
  id: string;
  lineItemId: string;
}) {
  return run(
    `/${id}/line-items/${lineItemId}`,
    "DELETE",
    "Unable to remove this charge.",
  );
}
