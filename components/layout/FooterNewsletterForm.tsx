"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/public";
import {
  submitFooterNewsletterForm,
  type NewsletterSubscribeActionState,
  type NewsletterSubscribeFailureReason,
} from "@/components/layout/footer-newsletter-action";

const initialState: NewsletterSubscribeActionState = { status: "idle" };

const feedbackKeyByReason: Record<
  NewsletterSubscribeFailureReason,
  `feedback.${ NewsletterSubscribeFailureReason }`
> = {
  consentRequired: "feedback.consentRequired",
  invalidEmail: "feedback.invalidEmail",
  tooManyRequests: "feedback.tooManyRequests",
  submitFailed: "feedback.submitFailed",
};

export default function FooterNewsletterForm() {
  const t = useTranslations("footer.newsletter");
  const locale = useLocale();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const trackedStateRef = useRef<string | null>(null);
  const [state, formAction, isPending] = useActionState(submitFooterNewsletterForm, initialState);
  const [localFeedbackReason, setLocalFeedbackReason] = useState<NewsletterSubscribeFailureReason | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  useEffect(() => {
    const trackingKey =
      state.status === "success"
        ? "success"
        : state.status === "error"
          ? `error:${ state.reason }`
          : null;

    if (!trackingKey || trackedStateRef.current === trackingKey) {
      return;
    }

    trackedStateRef.current = trackingKey;

    if (state.status === "success") {
      trackAnalyticsEvent("newsletter_subscribe_success", {
        consent_source: "footer_form",
        page_path: pathname,
        preferred_locale: locale,
      });
      return;
    }

    if (state.status === "error") {
      trackAnalyticsEvent("newsletter_subscribe_error", {
        consent_source: "footer_form",
        error_reason: state.reason,
        page_path: pathname,
        preferred_locale: locale,
      });
    }
  }, [locale, pathname, state]);

  const feedbackKey =
    localFeedbackReason
      ? feedbackKeyByReason[localFeedbackReason]
      : state.status === "success"
        ? "feedback.success"
        : state.status === "error"
          ? feedbackKeyByReason[state.reason]
          : null;

  return (
    <form
      ref={ formRef }
      action={ formAction }
      className="space-y-3"
      onSubmit={ (event) => {
        trackedStateRef.current = null;

        if (!consentCheckboxRef.current?.checked) {
          event.preventDefault();
          setLocalFeedbackReason("consentRequired");
          trackAnalyticsEvent("newsletter_subscribe_error", {
            consent_source: "footer_form",
            error_reason: "consent_required",
            page_path: pathname,
            preferred_locale: locale,
          });
          return;
        }

        setLocalFeedbackReason(null);
        trackAnalyticsEvent("newsletter_subscribe_submit", {
          consent_source: "footer_form",
          page_path: pathname,
          preferred_locale: locale,
        });
      } }
    >
      <input type="hidden" name="preferredLocale" value={ locale }/>
      <input type="hidden" name="page" value={ pathname }/>
      <input
        type="email"
        name="email"
        onChange={ () => {
          if (localFeedbackReason || state.status === "error") {
            setLocalFeedbackReason(null);
          }
        } }
        autoComplete="email"
        required
        placeholder={ t("emailPlaceholder") }
        className="w-full rounded-full border border-white/30 bg-transparent px-4 py-2 text-base text-white placeholder:text-[#cbbfb3] focus:border-white focus:outline-none"
      />
      <label className="flex items-start gap-2 text-sm text-[#e0d7ce]">
        <input
          type="checkbox"
          name="consent"
          ref={ consentCheckboxRef }
          onChange={ () => {
            if (localFeedbackReason === "consentRequired") {
              setLocalFeedbackReason(null);
            }
          } }
          className="mt-0.5 h-4 w-4"
        />
        <span>{ t("consent") }</span>
      </label>
      { feedbackKey ? (
        <p
          aria-live="polite"
          className={
            state.status === "success"
              ? "text-sm font-medium text-[#cfe8d1]"
              : "text-sm font-medium text-[#ffd7d1]"
          }
        >
          { t(feedbackKey) }
        </p>
      ) : null }
      <button
        type="submit"
        disabled={ isPending }
        className="w-full btn-red-white px-4 py-2 text-base font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        { isPending ? t("submitting") : t("submit") }
      </button>
    </form>
  );
}
