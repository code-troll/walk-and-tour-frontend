"use client";

import {useEffect, useMemo, useState} from "react";
import Script from "next/script";
import {useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {usePathname} from "@/i18n/navigation";
import {type AppLocale} from "@/i18n/routing";
import {getInternalHref} from "@/lib/internal-paths";
import {
  GOOGLE_TAG_MANAGER_ID,
  initializeGoogleTagManagerDataLayer,
  readAnalyticsConsent,
  trackAnalyticsEvent,
  type AnalyticsConsentState,
  writeAnalyticsConsent,
  isGoogleTagManagerConfigured,
} from "@/lib/analytics/public";

const GTM_LOADER_SCRIPT_ID = "google-tag-manager-loader";

function AnalyticsConsentBanner({
  locale,
  onDecision,
}: {
  locale: AppLocale;
  onDecision: (value: AnalyticsConsentState) => void;
}) {
  const t = useTranslations("analyticsConsent");
  const privacyPolicyHref = getInternalHref({
    locale,
    target: {kind: "page", page: "/privacy-policy"},
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-[#d8c5a8] bg-[#fffaf3] p-5 shadow-[0_20px_60px_rgba(42,34,26,0.18)] sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6a2f]">
            {t("eyebrow")}
          </p>
          <h2 className="text-xl font-semibold text-[#2a221a] sm:text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm leading-7 text-[#5a5047] sm:text-base">
            {t("description")}
          </p>
          <a
            href={privacyPolicyHref}
            className="inline-flex text-sm font-semibold text-[#c24343] underline decoration-[#c24343] underline-offset-4"
          >
            {t("privacyPolicy")}
          </a>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onDecision("denied")}
            className="rounded-full border border-[#d8c5a8] px-5 py-3 text-sm font-semibold text-[#2a221a] transition-colors hover:bg-[#f3e8d7]"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => onDecision("granted")}
            className="rounded-full bg-[#2a221a] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicAnalytics() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [consent, setConsent] = useState<AnalyticsConsentState | null | "pending">("pending");

  const isConfigured = isGoogleTagManagerConfigured();
  const isTrackingEnabled = isConfigured && consent === "granted";

  const pagePath = useMemo(
    () => (queryString ? `${pathname}?${queryString}` : pathname),
    [pathname, queryString],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isConfigured) {
        setConsent(null);
        return;
      }

      const storedConsent = readAnalyticsConsent();

      if (storedConsent === "granted") {
        initializeGoogleTagManagerDataLayer();
      }

      setConsent(storedConsent);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isConfigured]);

  useEffect(() => {
    if (!isTrackingEnabled) {
      return;
    }

    trackAnalyticsEvent("page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      page_locale: locale,
    });
  }, [isTrackingEnabled, locale, pagePath]);

  const handleConsentDecision = (value: AnalyticsConsentState) => {
    writeAnalyticsConsent(value);

    if (value === "granted") {
      initializeGoogleTagManagerDataLayer();
    }

    setConsent(value);
  };

  if (!isConfigured) {
    return null;
  }

  return (
    <>
      {isTrackingEnabled ? (
        <Script
          id={ GTM_LOADER_SCRIPT_ID }
          src={ `https://www.googletagmanager.com/gtm.js?id=${ GOOGLE_TAG_MANAGER_ID }` }
          strategy="afterInteractive"
        />
      ) : null}

      {consent === null ? (
        <AnalyticsConsentBanner
          locale={locale}
          onDecision={handleConsentDecision}
        />
      ) : null}
    </>
  );
}
