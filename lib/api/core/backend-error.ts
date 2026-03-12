export type BackendErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export class BackendApiError extends Error {
  statusCode: number;
  payload: BackendErrorPayload | null;

  constructor({
    message,
    payload,
    statusCode,
  }: {
    message: string;
    payload: BackendErrorPayload | null;
    statusCode: number;
  }) {
    super(message);
    this.name = "BackendApiError";
    this.payload = payload;
    this.statusCode = statusCode;
  }
}

const isBackendErrorPayload = (value: unknown): value is BackendErrorPayload =>
  typeof value === "object" && value !== null;

export const formatBackendErrorMessage = (value: unknown, fallbackMessage: string) => {
  if (!isBackendErrorPayload(value)) {
    return fallbackMessage;
  }

  const message = value.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const normalizedMessage = message.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );

    if (normalizedMessage.length > 0) {
      return normalizedMessage.join(" ");
    }
  }

  if (typeof value.error === "string" && value.error.trim()) {
    return value.error;
  }

  return fallbackMessage;
};

export const toBackendApiError = ({
  fallbackMessage,
  payload,
  statusCode,
}: {
  fallbackMessage: string;
  payload: unknown;
  statusCode: number;
}) =>
  new BackendApiError({
    message: formatBackendErrorMessage(payload, fallbackMessage),
    payload: isBackendErrorPayload(payload) ? payload : null,
    statusCode,
  });
