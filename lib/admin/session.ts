import {cache} from "react";
import {createAdminApi} from "@/lib/api/admin";
import {isBackendApiError} from "@/lib/api/core/backend-client";
import {getAuth0AccessToken, getAuth0Session, isAuth0Configured} from "@/lib/auth0";

type AdminViewerState =
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
      kind: "backend-error";
      message: string;
      statusCode: number;
    }
  | {
      kind: "authenticated";
      auth0User: NonNullable<Awaited<ReturnType<typeof getAuth0Session>>>["user"];
      backendAdmin: Awaited<ReturnType<ReturnType<typeof createAdminApi>["getCurrentAdmin"]>>;
      accessToken: string;
    };

export const getAdminViewerState = cache(async (): Promise<AdminViewerState> => {
  if (!isAuth0Configured) {
    return {
      kind: "auth0-not-configured",
    };
  }

  const session = await getAuth0Session();

  if (!session) {
    return {
      kind: "unauthenticated",
    };
  }

  try {
    const accessToken = await getAuth0AccessToken();

    if (!accessToken) {
      return {
        kind: "access-token-error",
        message:
          "The frontend session exists, but no backend access token could be obtained from Auth0.",
      };
    }

    const adminApi = createAdminApi(accessToken.token);
    const backendAdmin = await adminApi.getCurrentAdmin();

    return {
      kind: "authenticated",
      auth0User: session.user,
      backendAdmin,
      accessToken: accessToken.token,
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      return {
        kind: "backend-error",
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      kind: "access-token-error",
      message: error instanceof Error ? error.message : "Unable to initialize the admin session.",
    };
  }
});
