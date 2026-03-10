"use server";

import type {
  TurnstileServerValidationErrorCode,
  TurnstileServerValidationResponse,
} from "@marsidev/react-turnstile";

import { sendEmail } from "@/lib/email/send-email";
import {
  renderEmailTemplate,
  renderMultilineHtml,
} from "@/lib/email/template-renderer";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const NAME_MAX_LENGTH = 120;
const PHONE_MAX_LENGTH = 40;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 3_000;
const TOUR_LABEL_MAX_LENGTH = 160;
const BOOKING_TYPE_LABEL_MAX_LENGTH = 40;
const LANGUAGE_LABEL_MAX_LENGTH = 40;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BOOKING_TYPES = new Set(["privateTours", "companyTours", "otherTours"]);
const languageNameByLocale: Record<string, string> = {
  en: "English",
  es: "Spanish",
  it: "Italian",
};

const TURNSTILE_CONFIGURATION_ERRORS = new Set<TurnstileServerValidationErrorCode>([
  "missing-input-secret",
  "invalid-input-secret",
  "invalid-widget-id",
  "invalid-parsed-secret",
]);

const TURNSTILE_RESPONSE_ERRORS = new Set<TurnstileServerValidationErrorCode>([
  "missing-input-response",
  "invalid-input-response",
  "timeout-or-duplicate",
]);

export type BookTourFormFailureReason =
  | "invalidFields"
  | "invalidEmail"
  | "turnstileRequired"
  | "turnstileFailed"
  | "turnstileUnavailable"
  | "submitFailed";

export type BookTourFormActionState =
  | { status: "idle"; }
  | { status: "success"; }
  | { status: "error"; reason: BookTourFormFailureReason; };

const asRequiredString = (value: FormDataEntryValue | null): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const asOptionalString = (value: FormDataEntryValue | null): string => (
  typeof value === "string" ? value.trim() : ""
);

const resolveTurnstileFailureReason = (
  verificationResult: TurnstileServerValidationResponse
): BookTourFormFailureReason => {
  const errorCodes = verificationResult["error-codes"] ?? [];

  if (errorCodes.some((errorCode) => TURNSTILE_CONFIGURATION_ERRORS.has(errorCode))) {
    return "turnstileUnavailable";
  }

  if (errorCodes.some((errorCode) => TURNSTILE_RESPONSE_ERRORS.has(errorCode))) {
    return "turnstileFailed";
  }

  return "submitFailed";
};

const isPositiveInteger = (value: string): boolean => {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  return Number.parseInt(value, 10) > 0;
};

const resolveLanguageName = (locale: string): string => (
  languageNameByLocale[locale] ?? locale
);

export async function submitBookTourForm(
  _previousState: BookTourFormActionState,
  formData: FormData
): Promise<BookTourFormActionState> {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!turnstileSiteKey || !turnstileSecretKey) {
    return {
      status: "error",
      reason: "turnstileUnavailable",
    };
  }

  const name = asRequiredString(formData.get("name"));
  const email = asRequiredString(formData.get("email"));
  const message = asRequiredString(formData.get("message"));
  const desiredDate = asRequiredString(formData.get("desiredDate"));
  const participants = asRequiredString(formData.get("participants"));
  const bookingType = asRequiredString(formData.get("bookingType"));
  const bookingTypeLabel = asRequiredString(formData.get("bookingTypeLabel"));
  const tourLanguageLabel = asRequiredString(formData.get("tourLanguageLabel"));
  const locale = asRequiredString(formData.get("locale"));
  const phone = asOptionalString(formData.get("phone"));
  const selectedItemId = asOptionalString(formData.get("selectedItemId"));
  const selectedItemLabel = asOptionalString(formData.get("selectedItemLabel"));
  const turnstileToken = asRequiredString(formData.get("turnstileToken"));

  if (
    !name ||
    !email ||
    !message ||
    !desiredDate ||
    !participants ||
    !bookingType ||
    !bookingTypeLabel ||
    !tourLanguageLabel ||
    !locale
  ) {
    return {
      status: "error",
      reason: "invalidFields",
    };
  }

  if (
    name.length > NAME_MAX_LENGTH ||
    phone.length > PHONE_MAX_LENGTH ||
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH ||
    bookingTypeLabel.length > BOOKING_TYPE_LABEL_MAX_LENGTH ||
    tourLanguageLabel.length > LANGUAGE_LABEL_MAX_LENGTH ||
    selectedItemLabel.length > TOUR_LABEL_MAX_LENGTH ||
    locale.length > 10
  ) {
    return {
      status: "error",
      reason: "invalidFields",
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      status: "error",
      reason: "invalidEmail",
    };
  }

  if (!DATE_REGEX.test(desiredDate) || !isPositiveInteger(participants)) {
    return {
      status: "error",
      reason: "invalidFields",
    };
  }

  if (!BOOKING_TYPES.has(bookingType)) {
    return {
      status: "error",
      reason: "invalidFields",
    };
  }

  if (
    (bookingType === "privateTours" || bookingType === "companyTours") &&
    (!selectedItemId || !selectedItemLabel)
  ) {
    return {
      status: "error",
      reason: "invalidFields",
    };
  }

  if (!turnstileToken) {
    return {
      status: "error",
      reason: "turnstileRequired",
    };
  }

  try {
    const verificationResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: turnstileSecretKey,
        response: turnstileToken,
      }),
      cache: "no-store",
    });

    if (!verificationResponse.ok) {
      return {
        status: "error",
        reason: "submitFailed",
      };
    }

    const verificationResult =
      await verificationResponse.json() as TurnstileServerValidationResponse;

    if (!verificationResult.success) {
      return {
        status: "error",
        reason: resolveTurnstileFailureReason(verificationResult),
      };
    }
  } catch (error) {
    console.error("Book tour Turnstile validation failed", error);

    return {
      status: "error",
      reason: "submitFailed",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.BOOKING_REQUEST_FROM_EMAIL?.trim();
  const toEmail = process.env.BOOKING_REQUEST_TO_EMAIL?.trim();

  if (!resendApiKey || !fromEmail || !toEmail) {
    console.error("Book tour email configuration is incomplete");

    return {
      status: "error",
      reason: "submitFailed",
    };
  }

  const phoneDisplay = phone || "Not provided";
  const submittedLanguage = resolveLanguageName(locale);
  const selectedTourLine = selectedItemLabel
    ? `Selected tour: ${ selectedItemLabel } (${ selectedItemId })`
    : "Selected tour: Not selected";
  const textBody = [
    "New book tour request",
    "",
    `Language: ${ submittedLanguage }`,
    `Booking type: ${ bookingTypeLabel }`,
    selectedTourLine,
    `Requested date: ${ desiredDate }`,
    `Participants: ${ participants }`,
    `Requested language: ${ tourLanguageLabel }`,
    "",
    `Name: ${ name }`,
    `Email: ${ email }`,
    `Phone: ${ phoneDisplay }`,
    "",
    "Message:",
    message,
  ].join("\n");
  try {
    const htmlBody = await renderEmailTemplate("book-tour-notification", {
      bookingTypeLabel,
      desiredDate,
      email,
      languageName: submittedLanguage,
      messageHtml: renderMultilineHtml(message),
      name,
      participants,
      phoneDisplay,
      selectedItemId,
      selectedItemLabel,
      tourLanguageLabel,
    });

    await sendEmail({
      fromEmail,
      html: htmlBody,
      resendApiKey,
      subject: `Book Tour Request | ${ bookingTypeLabel } | ${ name }`,
      text: textBody,
      toEmail,
    });
  } catch (error) {
    console.error("Book tour email delivery failed", error);

    return {
      status: "error",
      reason: "submitFailed",
    };
  }

  return {status: "success"};
}
