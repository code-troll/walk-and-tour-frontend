export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const ANALYTICS_CONSENT_STORAGE_KEY = "walkandtour.analytics_consent";

export type AnalyticsConsentState = "granted" | "denied";

type AnalyticsPrimitive = string | number | boolean | null | undefined;

export type AnalyticsEventParams = Record<string, AnalyticsPrimitive>;

export type NormalizedTourType = "private" | "company" | "other";

/**
 * Maps every tour-type source the app uses onto a single analytics taxonomy.
 * Accepts both the public tour model (`private` | `group` | `tip_based` |
 * `company`) and the booking form (`privateTours` | `companyTours` |
 * `otherTours`). Anything unrecognised falls back to "other".
 */
export const normalizeTourType = (
  value: string | null | undefined,
): NormalizedTourType => {
  switch (value) {
    case "private":
    case "privateTours":
      return "private";
    case "company":
    case "companyTours":
      return "company";
    default:
      return "other";
  }
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsInitialized = false;

export const isAnalyticsConfigured = () => GA_MEASUREMENT_ID.length > 0;

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

/**
 * Ensures the gtag.js `dataLayer` + `gtag()` shim exist so events queue even
 * before the external gtag.js library finishes loading. Uses the canonical
 * Google shim that pushes the live `arguments` object.
 */
export const ensureGtag = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  window.dataLayer = window.dataLayer ?? [];

  if (!window.gtag) {
    window.gtag = function gtag() {
      // gtag.js expects the raw `arguments` object pushed onto the dataLayer.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }

  return window.gtag;
};

/**
 * Bootstraps GA4 (`js` + `config`) exactly once. `send_page_view` is disabled
 * because we emit `page_view` manually on every (SPA) route change; see
 * PublicAnalytics. Must run before the first tracked event so the queued
 * commands are ordered js → config → event.
 */
export const initializeAnalytics = () => {
  if (analyticsInitialized || !isAnalyticsConfigured()) {
    return;
  }

  const gtag = ensureGtag();

  if (!gtag) {
    return;
  }

  analyticsInitialized = true;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {send_page_view: false});
};

export const isAnalyticsTrackingEnabled = () =>
  isAnalyticsConfigured() && readAnalyticsConsent() === "granted";

export const trackAnalyticsEvent = (
  eventName: string,
  params: AnalyticsEventParams = {},
) => {
  if (!isAnalyticsTrackingEnabled()) {
    return;
  }

  const gtag = ensureGtag();

  gtag?.("event", eventName, params);
};
