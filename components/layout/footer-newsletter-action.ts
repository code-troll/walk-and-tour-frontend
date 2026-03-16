"use server";

import { createPublicApi } from "@/lib/api/public";
import { isBackendApiError } from "@/lib/api/core/backend-client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterSubscribeFailureReason =
  | "consentRequired"
  | "invalidEmail"
  | "tooManyRequests"
  | "submitFailed";

export type NewsletterSubscribeActionState =
  | { status: "idle"; }
  | { status: "success"; }
  | { status: "error"; reason: NewsletterSubscribeFailureReason; };

const asRequiredString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const asOptionalString = (value: FormDataEntryValue | null) => (
  typeof value === "string" ? value.trim() : ""
);

export async function submitFooterNewsletterForm(
  _previousState: NewsletterSubscribeActionState,
  formData: FormData,
): Promise<NewsletterSubscribeActionState> {
  const email = asRequiredString(formData.get("email"));
  const preferredLocale = asOptionalString(formData.get("preferredLocale"));
  const page = asOptionalString(formData.get("page")) || "/";
  const consentAccepted = formData.get("consent") === "on";

  if (!consentAccepted) {
    return {
      status: "error",
      reason: "consentRequired",
    };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      status: "error",
      reason: "invalidEmail",
    };
  }

  try {
    const publicApi = createPublicApi({ cache: "no-store" });

    await publicApi.subscribeToNewsletter({
      email,
      preferredLocale: preferredLocale || undefined,
      consentSource: "footer_form",
      sourceMetadata: {
        page,
        placement: "footer",
      },
    });

    return {
      status: "success",
    };
  } catch (error) {
    if (isBackendApiError(error)) {
      if (error.statusCode === 400) {
        return {
          status: "error",
          reason: "invalidEmail",
        };
      }

      if (error.statusCode === 429) {
        return {
          status: "error",
          reason: "tooManyRequests",
        };
      }
    }

    return {
      status: "error",
      reason: "submitFailed",
    };
  }
}
