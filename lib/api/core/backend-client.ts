import createClient from "openapi-fetch";
import type {paths} from "@/lib/api/generated/backend-types";
import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {BackendApiError, toBackendApiError} from "@/lib/api/core/backend-error";

type TypedApiResult<TData, TError> = {
  data?: TData;
  error?: TError;
  response: Response;
};

export const createBackendApiClient = ({
  accessToken,
}: {
  accessToken?: string;
} = {}) =>
  createClient<paths>({
    baseUrl: requireBackendApiBaseUrl(),
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

export const unwrapBackendApiResult = <TData, TError>(
  result: TypedApiResult<TData, TError>,
  fallbackMessage: string,
) => {
  if (typeof result.data !== "undefined") {
    return result.data;
  }

  throw toBackendApiError({
    fallbackMessage,
    payload: result.error,
    statusCode: result.response.status,
  });
};

export const isBackendApiError = (value: unknown): value is BackendApiError =>
  value instanceof BackendApiError;
