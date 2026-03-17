import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";

export const parseJsonSafely = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

export const fetchJson = async <T>({
  init,
  input,
  notFoundFallback,
  onNotFound,
  fallbackMessage,
}: {
  input: RequestInfo | URL;
  init?: RequestInit;
  fallbackMessage: string;
  notFoundFallback?: T;
  onNotFound?: () => T;
}): Promise<T> => {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
  });
  const payload = await parseJsonSafely(response);

  if (response.status === 404) {
    if (onNotFound) {
      return onNotFound();
    }

    if (typeof notFoundFallback !== "undefined") {
      return notFoundFallback;
    }
  }

  if (!response.ok) {
    throw new Error(formatBackendErrorMessage(payload, fallbackMessage));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The server returned an unexpected response.");
  }

  return payload as T;
};
