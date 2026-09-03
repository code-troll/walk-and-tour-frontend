import {cache} from "react";

import {createBackendApiClient, unwrapBackendApiResult} from "@/lib/api/core/backend-client";
import {isBackendApiError} from "@/lib/api/core/backend-client";
import type {components} from "@/lib/api/generated/backend-types";
import {getAuth0AccessToken, getAuth0Session, isAuth0Configured} from "@/lib/auth0";

export type HotelViewer = components["schemas"]["HotelViewerResponseDto"];

type HotelViewerState =
  | {
      kind: "auth0-not-configured";
    }
  | {
      kind: "unauthenticated";
    }
  | {
      kind: "access-token-error";
      message: string;
    }
  | {
      kind: "not-a-hotel-user";
      message: string;
    }
  | {
      kind: "backend-error";
      message: string;
      statusCode: number;
    }
  | {
      kind: "authenticated";
      viewer: HotelViewer;
      accessToken: string;
    };

const getHotelViewer = async (accessToken: string): Promise<HotelViewer> => {
  const client = createBackendApiClient({accessToken});
  const result = await client.GET("/api/hotel/auth/me");

  return unwrapBackendApiResult(
    result,
    "Unable to load the signed-in hotel.",
  ) as HotelViewer;
};

/**
 * Resolves who is signed in to the hotel portal.
 *
 * Mirrors `getAdminViewerState` deliberately, with one extra state: a valid
 * Auth0 session that is not a hotel access user. Both portals share a tenant
 * and an API audience, so an administrator signing in on the hotel host gets a
 * real session and a real token, and the backend is what refuses it. Telling
 * that apart from a genuine failure is the difference between a clear message
 * and a mystery.
 */
export const getHotelViewerState = cache(async (): Promise<HotelViewerState> => {
  if (!isAuth0Configured) {
    return {kind: "auth0-not-configured"};
  }

  const session = await getAuth0Session();

  if (!session) {
    return {kind: "unauthenticated"};
  }

  try {
    const accessToken = await getAuth0AccessToken();

    if (!accessToken) {
      return {
        kind: "access-token-error",
        message:
          "The portal session exists, but no backend access token could be obtained from Auth0.",
      };
    }

    return {
      kind: "authenticated",
      viewer: await getHotelViewer(accessToken.token),
      accessToken: accessToken.token,
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return {kind: "not-a-hotel-user", message: error.message};
      }

      return {
        kind: "backend-error",
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      kind: "access-token-error",
      message:
        error instanceof Error ? error.message : "Unable to initialize the portal session.",
    };
  }
});
