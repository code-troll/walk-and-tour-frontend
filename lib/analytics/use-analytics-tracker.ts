"use client";

import {useCallback} from "react";
import {useLocale} from "next-intl";
import {usePathname} from "@/i18n/navigation";
import {
  trackAnalyticsEvent,
  type AnalyticsEventParams,
} from "@/lib/analytics/public";

/**
 * Returns a stable `track(eventName, params)` that pushes a GTM event with the
 * active `locale` and `page_path` always attached. Centralising this keeps the
 * language dimension present on every event and avoids per-call boilerplate.
 *
 * Explicit params win over the auto-injected ones (e.g. a route that wants a
 * query-string-aware `page_path` can pass its own).
 */
export const useAnalyticsTracker = () => {
  const locale = useLocale();
  const pathname = usePathname();

  return useCallback(
    (eventName: string, params: AnalyticsEventParams = {}) => {
      trackAnalyticsEvent(eventName, {
        locale,
        page_path: pathname,
        ...params,
      });
    },
    [locale, pathname],
  );
};
