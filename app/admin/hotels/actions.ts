"use server";

import {getAdminViewerState} from "@/lib/admin/session";
import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import type {
  ApiHotel,
  ApiHotelUser,
  CreateHotelBody,
  UpdateHotelBody,
} from "@/lib/hotels/admin-hotel-types";

type HotelActionError = {
  ok: false;
  statusCode: number;
  message: string;
};

export type HotelActionResult = {ok: true; hotel: ApiHotel} | HotelActionError;
export type HotelUserActionResult = {ok: true; user: ApiHotelUser} | HotelActionError;

const getAdminContext = async (): Promise<
  {ok: true; accessToken: string; backendApiBaseUrl: string} | HotelActionError
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

  if (viewerState.backendAdmin.roleName !== "super_admin") {
    return {
      ok: false,
      statusCode: 403,
      message: "You do not have access to hotel administration.",
    };
  }

  return {
    ok: true,
    accessToken: viewerState.accessToken,
    backendApiBaseUrl: requireBackendApiBaseUrl(),
  };
};

const hotelFetch = async <T>(
  path: string,
  method: string,
  accessToken: string,
  backendApiBaseUrl: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(`${backendApiBaseUrl}/api/admin/hotels${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? {"Content-Type": "application/json"} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(formatBackendErrorMessage(payload, "Backend request failed."));
  }

  return payload as T;
};

const toActionError = (error: unknown, fallbackMessage: string): HotelActionError => ({
  ok: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallbackMessage,
});

export async function createHotelAction(body: CreateHotelBody): Promise<HotelActionResult> {
  const context = await getAdminContext();

  if (!context.ok) {
    return context;
  }

  try {
    const hotel = await hotelFetch<ApiHotel>(
      "",
      "POST",
      context.accessToken,
      context.backendApiBaseUrl,
      body,
    );

    return {ok: true, hotel};
  } catch (error) {
    return toActionError(error, "Unable to register the hotel.");
  }
}

export async function updateHotelAction({
  id,
  body,
}: {
  id: string;
  body: UpdateHotelBody;
}): Promise<HotelActionResult> {
  const context = await getAdminContext();

  if (!context.ok) {
    return context;
  }

  try {
    const hotel = await hotelFetch<ApiHotel>(
      `/${id}`,
      "PATCH",
      context.accessToken,
      context.backendApiBaseUrl,
      body,
    );

    return {ok: true, hotel};
  } catch (error) {
    return toActionError(error, "Unable to update the hotel.");
  }
}

export async function setHotelToursAction({
  id,
  tours,
}: {
  id: string;
  /** `priceAmount: null` means this partner pays the tour's own price. */
  tours: {tourId: string; priceAmount: string | null}[];
}): Promise<HotelActionResult> {
  const context = await getAdminContext();

  if (!context.ok) {
    return context;
  }

  try {
    const hotel = await hotelFetch<ApiHotel>(
      `/${id}/tours`,
      "PUT",
      context.accessToken,
      context.backendApiBaseUrl,
      {tours},
    );

    return {ok: true, hotel};
  } catch (error) {
    return toActionError(error, "Unable to update the tours for this hotel.");
  }
}

const hotelUserAction = async (
  path: string,
  fallbackMessage: string,
  body: Record<string, unknown> = {},
): Promise<HotelUserActionResult> => {
  const context = await getAdminContext();

  if (!context.ok) {
    return context;
  }

  try {
    const user = await hotelFetch<ApiHotelUser>(
      path,
      "POST",
      context.accessToken,
      context.backendApiBaseUrl,
      body,
    );

    return {ok: true, user};
  } catch (error) {
    return toActionError(error, fallbackMessage);
  }
};

export async function createHotelUserAction(
  hotelId: string,
  /**
   * The address the hotel signs in with. Omitted means the hotel's contact
   * email, which the backend applies — sending an empty string instead would
   * fail validation rather than fall back.
   */
  email?: string,
): Promise<HotelUserActionResult> {
  return hotelUserAction(
    `/${hotelId}/user`,
    "Unable to create the access user.",
    email ? {email} : {},
  );
}

export async function resendHotelUserInvitationAction(
  hotelId: string,
): Promise<HotelUserActionResult> {
  return hotelUserAction(
    `/${hotelId}/user/resend-invitation`,
    "Unable to send a new password link.",
  );
}

export async function setHotelUserEnabledAction({
  hotelId,
  isEnabled,
}: {
  hotelId: string;
  isEnabled: boolean;
}): Promise<HotelUserActionResult> {
  return hotelUserAction(
    `/${hotelId}/user/${isEnabled ? "enable" : "disable"}`,
    isEnabled ? "Unable to enable the access user." : "Unable to disable the access user.",
  );
}
