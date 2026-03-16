import type { Metadata } from "next";
import NewsletterResultAnalytics from "@/components/newsletter/NewsletterResultAnalytics";
import NewsletterResultPage from "@/components/newsletter/NewsletterResultPage";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type UnsubscribeViewState = {
  title: string;
  body: string;
  tone: "success" | "error";
  analyticsEventName: string;
  analyticsReason?: string;
};

const getFirstValue = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] : value
);

const resolveUnsubscribeViewState = ({
  reason,
  status,
}: {
  reason?: string;
  status?: string;
}): UnsubscribeViewState => {
  if (status === "success") {
    return {
      title: "You have been unsubscribed",
      body: "You will no longer receive newsletter emails from us.",
      tone: "success",
      analyticsEventName: "newsletter_unsubscribe_success",
    };
  }

  if (status === "error" && reason === "invalid_token") {
    return {
      title: "Unsubscribe link invalid",
      body: "This unsubscribe link is invalid or has already been used.",
      tone: "error",
      analyticsEventName: "newsletter_unsubscribe_error",
      analyticsReason: reason,
    };
  }

  if (status === "error" && reason === "server_error") {
    return {
      title: "Unsubscribe failed",
      body: "We could not process the unsubscribe request right now. Please try again later.",
      tone: "error",
      analyticsEventName: "newsletter_unsubscribe_error",
      analyticsReason: reason,
    };
  }

  return {
    title: "Invalid unsubscribe state",
    body: "We could not determine the result of this unsubscribe link.",
    tone: "error",
    analyticsEventName: "newsletter_unsubscribe_error",
    analyticsReason: reason ?? "invalid_state",
  };
};

export const metadata: Metadata = {
  title: "Newsletter Unsubscribe | Walk and Tour Copenhagen",
  description: "Newsletter unsubscribe result for Walk and Tour Copenhagen.",
};

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const viewState = resolveUnsubscribeViewState({
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
