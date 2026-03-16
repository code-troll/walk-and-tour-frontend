export const GOOGLE_TAG_MANAGER_ID =
  process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID?.trim() ?? "";

export const ANALYTICS_CONSENT_STORAGE_KEY = "walkandtour.analytics_consent";

export type AnalyticsConsentState = "granted" | "denied";

type AnalyticsPrimitive = string | number | boolean | null | undefined;

export type AnalyticsEventParams = Record<string, AnalyticsPrimitive>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const isGoogleTagManagerConfigured = () =>
  GOOGLE_TAG_MANAGER_ID.length > 0;

export const readAnalyticsConsent = (): AnalyticsConsentState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

  return storedValue === "granted" || storedValue === "denied"
    ? storedValue
    : null;
};

export const writeAnalyticsConsent = (value: AnalyticsConsentState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
};

export const ensureDataLayer = () => {
  if (typeof window === "undefined") {
    return [];
  }

  window.dataLayer = window.dataLayer ?? [];

  return window.dataLayer;
};

export const initializeGoogleTagManagerDataLayer = () => {
  const dataLayer = ensureDataLayer();
  const hasBootstrapEvent = dataLayer.some(
    (entry) => entry.event === "gtm.js",
  );

  if (!hasBootstrapEvent) {
    dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
  }

  return dataLayer;
};

export const isAnalyticsTrackingEnabled = () =>
  isGoogleTagManagerConfigured() && readAnalyticsConsent() === "granted";

export const pushAnalyticsPayload = (payload: Record<string, unknown>) => {
  if (!isAnalyticsTrackingEnabled()) {
    return;
  }

  ensureDataLayer().push(payload);
};

export const trackAnalyticsEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  pushAnalyticsPayload({
    event: eventName,
    ...params,
  });
};
