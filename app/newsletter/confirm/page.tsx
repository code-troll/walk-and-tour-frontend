import type { Metadata } from "next";
import NewsletterResultAnalytics from "@/components/newsletter/NewsletterResultAnalytics";
import NewsletterResultPage from "@/components/newsletter/NewsletterResultPage";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ConfirmViewState = {
  title: string;
  body: string;
  tone: "success" | "error";
  analyticsEventName: string;
  analyticsReason?: string;
};

const getFirstValue = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] : value
);

const resolveConfirmViewState = ({
  reason,
  status,
}: {
  reason?: string;
  status?: string;
}): ConfirmViewState => {
  if (status === "success") {
    return {
      title: "Subscription confirmed",
      body: "Your newsletter subscription is now active.",
      tone: "success",
      analyticsEventName: "newsletter_confirm_success",
    };
  }

  if (status === "error" && reason === "invalid_token") {
    return {
      title: "Confirmation link invalid",
      body: "This confirmation link is invalid or has already been used. You can subscribe again if needed.",
      tone: "error",
      analyticsEventName: "newsletter_confirm_error",
      analyticsReason: reason,
    };
  }

  if (status === "error" && reason === "invalid_state") {
    return {
      title: "Confirmation no longer needed",
      body: "This subscription is not waiting for confirmation anymore.",
      tone: "error",
      analyticsEventName: "newsletter_confirm_error",
      analyticsReason: reason,
    };
  }

  if (status === "error" && reason === "server_error") {
    return {
      title: "Confirmation failed",
      body: "We could not complete the confirmation right now. Please try again later.",
      tone: "error",
      analyticsEventName: "newsletter_confirm_error",
      analyticsReason: reason,
    };
  }

  return {
    title: "Invalid confirmation state",
    body: "We could not determine the result of this newsletter confirmation link.",
    tone: "error",
    analyticsEventName: "newsletter_confirm_error",
    analyticsReason: reason ?? "invalid_state",
  };
};

export const metadata: Metadata = {
  title: "Newsletter Confirmation | Walk and Tour Copenhagen",
  description: "Newsletter confirmation result for Walk and Tour Copenhagen.",
};

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const viewState = resolveConfirmViewState({
    status: getFirstValue(params.status),
    reason: getFirstValue(params.reason),
  });

  return (
    <>
      <NewsletterResultAnalytics
        eventName={ viewState.analyticsEventName }
        reason={ viewState.analyticsReason }
      />
      <NewsletterResultPage
        title={ viewState.title }
        body={ viewState.body }
        tone={ viewState.tone }
      />
    </>
  );
}
