"use server";

import type { components } from "@/lib/api/generated/backend-types";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import { createAdminApi } from "@/lib/api/admin";
import { getAdminViewerState } from "@/lib/admin/session";

type ApiTour = components["schemas"]["TourAdminResponseDto"];
type ApiTourListItem = components["schemas"]["TourAdminListResponseDto"];
type CreateTourBody = components["schemas"]["CreateTourDto"];
type UpdateTourBody = components["schemas"]["UpdateTourDto"];
type ToursAdminApi = ReturnType<typeof createAdminApi>;
type TourActionError = {
  ok: false;
  statusCode: number;
  message: string;
};
type TourActionSuccess = {
  ok: true;
  tour: ApiTour;
};
export type TourActionResult = TourActionSuccess | TourActionError;
type ToursActionSuccess = {
  ok: true;
  tours: ApiTourListItem[];
};
export type ToursActionResult = ToursActionSuccess | TourActionError;

const getToursAdminApi = async (): Promise<
  | {
      ok: true;
      adminApi: ToursAdminApi;
    }
  | TourActionError
> => {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind === "unauthenticated") {
    return {
      ok: false,
      statusCode: 401,
      message: "Authentication required.",
    };
  }

  if (viewerState.kind === "backend-error") {
    return {
      ok: false,
      statusCode: viewerState.statusCode,
      message: viewerState.message,
    };
  }

  if (viewerState.kind !== "authenticated") {
    return {
      ok: false,
      statusCode: 503,
      message: "Unable to initialize the admin session.",
    };
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return {
      ok: false,
      statusCode: 403,
      message: "You do not have access to tour administration.",
    };
  }

  return {
    ok: true,
    adminApi: createAdminApi(viewerState.accessToken),
  };
};

export async function createTourAction(body: CreateTourBody): Promise<TourActionResult> {
  const adminApiResult = await getToursAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      tour: await adminApiResult.adminApi.createTour(body),
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      return {
        ok: false,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    return {
      ok: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Unable to create the tour.",
    };
  }
}

export async function updateTourAction({
  body,
  id,
}: {
  body: UpdateTourBody;
  id: string;
}): Promise<TourActionResult> {
  const adminApiResult = await getToursAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      tour: await adminApiResult.adminApi.updateTour({ body, id }),
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      return {
        ok: false,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    return {
      ok: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Unable to update the tour.",
    };
  }
}

export async function reorderTourAction({
  id,
  sortOrder,
}: {
  id: string;
  sortOrder: number;
}): Promise<ToursActionResult> {
  const adminApiResult = await getToursAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    await adminApiResult.adminApi.updateTour({
      body: { sortOrder },
      id,
    });

    return {
      ok: true,
      tours: await adminApiResult.adminApi.getTours(),
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      return {
        ok: false,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    return {
      ok: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Unable to reorder the tours.",
    };
  }
}
