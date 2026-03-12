const normalizeUrl = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.endsWith("/") ? trimmedValue.slice(0, -1) : trimmedValue;
};

export const getBackendApiBaseUrl = () =>
  normalizeUrl(process.env.BACKEND_API_BASE_URL) ??
  normalizeUrl(process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL);

export const requireBackendApiBaseUrl = () => {
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (!backendApiBaseUrl) {
    throw new Error(
      "Missing backend API configuration. Set BACKEND_API_BASE_URL for the admin API integration.",
    );
  }

  return backendApiBaseUrl;
};
