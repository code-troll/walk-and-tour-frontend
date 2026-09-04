"use server";

import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import {getAuth0AccessToken} from "@/lib/auth0";
import {getHotelViewerState} from "@/lib/hotel-portal/session";
import type {
  ApiHotelBooking,
  CreateBookingBody,
} from "@/lib/hotel-portal/booking-types";

type BookingActionError = {
  ok: false;
  statusCode: number;
  message: string;
};

export type BookingActionResult =
  | {ok: true; booking: ApiHotelBooking}
  | BookingActionError;

/**
 * Every action re-resolves the portal session rather than trusting anything the
 * client sends. The hotel a booking belongs to is decided by the backend from
 * the token, so nothing here needs — or accepts — a hotel identifier.
 */
const getPortalContext = async (): Promise<
  {ok: true; accessToken: string; backendApiBaseUrl: string} | BookingActionError
> => {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind === "unauthenticated") {
    return {ok: false, statusCode: 401, message: "Please sign in again."};
  }

  if (viewerState.kind === "not-a-hotel-user") {
    return {ok: false, statusCode: 403, message: viewerState.message};
  }

  if (viewerState.kind !== "authenticated") {
    return {
      ok: false,
      statusCode: 503,
      message: "Unable to establish the portal session.",
    };
  }

  const accessToken = await getAuth0AccessToken();

  if (!accessToken) {
    return {ok: false, statusCode: 401, message: "Please sign in again."};
  }

  return {
    ok: true,
    accessToken: accessToken.token,
    backendApiBaseUrl: requireBackendApiBaseUrl(),
  };
};

const bookingFetch = async (
  path: string,
  accessToken: string,
  backendApiBaseUrl: string,
  body?: unknown,
): Promise<ApiHotelBooking> => {
  const response = await fetch(`${backendApiBaseUrl}/api/hotel/bookings${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(formatBackendErrorMessage(payload, "The request failed."));
  }

  return payload as ApiHotelBooking;
};

const toActionError = (error: unknown, fallbackMessage: string): BookingActionError => ({
  ok: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallbackMessage,
});

export async function createBookingAction(
  body: CreateBookingBody,
): Promise<BookingActionResult> {
  const context = await getPortalContext();

  if (!context.ok) {
    return context;
  }

  try {
    return {
      ok: true,
      booking: await bookingFetch(
        "",
        context.accessToken,
        context.backendApiBaseUrl,
        body,
      ),
    };
  } catch (error) {
    return toActionError(error, "Unable to place this booking.");
  }
}

export async function cancelBookingAction({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}): Promise<BookingActionResult> {
  const context = await getPortalContext();

  if (!context.ok) {
    return context;
  }

  try {
    return {
      ok: true,
      booking: await bookingFetch(
        `/${id}/cancel`,
        context.accessToken,
        context.backendApiBaseUrl,
        reason ? {reason} : {},
      ),
    };
  } catch (error) {
    return toActionError(error, "Unable to cancel this booking.");
  }
}
