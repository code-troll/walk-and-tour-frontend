import { formatBackendErrorMessage } from "@/lib/api/core/backend-error";
import type { components } from "@/lib/api/generated/backend-types";

export type ApiAdminMediaAsset = components["schemas"]["AdminMediaAssetResponseDto"];
export type ApiAdminMediaAssetListResponse = components["schemas"]["AdminMediaAssetListResponseDto"];
export type ApiUploadedMediaAsset = components["schemas"]["UploadedMediaResponseDto"];

export const normalizeBackendApiBaseUrl = (backendApiBaseUrl: string) =>
  backendApiBaseUrl.trim().replace(/\/$/, "");

export const parseJsonSafely = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

export const buildAuthHeaders = (accessToken: string, includeJsonContentType = true) => ({
  Authorization: `Bearer ${ accessToken }`,
  ...(includeJsonContentType ? { "content-type": "application/json" } : {}),
});

export const listAdminMediaAssets = async ({
  accessToken,
  backendApiBaseUrl,
  limit,
  page,
  search,
}: {
  accessToken: string;
  backendApiBaseUrl: string;
  limit: number;
  page: number;
  search: string;
}): Promise<
  | {
      ok: true;
      response: ApiAdminMediaAssetListResponse;
    }
  | {
      message: string;
      ok: false;
      statusCode: number;
    }
> => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    mediaType: "image",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await fetch(`${ normalizedBaseUrl }/api/admin/media?${ query.toString() }`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    return {
      ok: false,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Unable to load media assets."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      statusCode: 500,
      message: "Backend returned an unexpected media library response.",
    };
  }

  return {
    ok: true,
    response: payload as ApiAdminMediaAssetListResponse,
  };
};

export const uploadAdminMediaAsset = async ({
  accessToken,
  backendApiBaseUrl,
  file,
  folder,
}: {
  accessToken: string;
  backendApiBaseUrl: string;
  file: File;
  folder: string;
}) => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${ normalizedBaseUrl }/api/admin/media`, {
    method: "POST",
    headers: buildAuthHeaders(accessToken, false),
    body: formData,
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    return {
      ok: false as const,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Unable to upload the selected image."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false as const,
      statusCode: 500,
      message: "Backend returned an unexpected upload response.",
    };
  }

  return {
    ok: true as const,
    media: payload as ApiUploadedMediaAsset,
  };
};
