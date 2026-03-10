"use server";

import type {
    TurnstileServerValidationErrorCode,
    TurnstileServerValidationResponse,
} from "@marsidev/react-turnstile";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const NAME_MAX_LENGTH = 120;
const PHONE_MAX_LENGTH = 40;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 3_000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export type ContactFormFailureReason =
    | "invalidFields"
    | "invalidEmail"
    | "turnstileRequired"
    | "turnstileFailed"
    | "turnstileUnavailable"
    | "submitFailed";

export type ContactFormActionState =
    | { status: "idle"; }
    | { status: "success"; }
    | { status: "error"; reason: ContactFormFailureReason; };

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
): ContactFormFailureReason => {
    const errorCodes = verificationResult["error-codes"] ?? [];

    if (errorCodes.some((errorCode) => TURNSTILE_CONFIGURATION_ERRORS.has(errorCode))) {
        return "turnstileUnavailable";
    }

    if (errorCodes.some((errorCode) => TURNSTILE_RESPONSE_ERRORS.has(errorCode))) {
        return "turnstileFailed";
    }

    return "submitFailed";
};

export async function submitContactForm(
    _previousState: ContactFormActionState,
    formData: FormData
): Promise<ContactFormActionState> {
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
    const phone = asOptionalString(formData.get("phone"));
    const turnstileToken = asRequiredString(formData.get("turnstileToken"));

    if (!name || !email || !message) {
        return {
            status: "error",
            reason: "invalidFields",
        };
    }

    if (
        name.length > NAME_MAX_LENGTH ||
        phone.length > PHONE_MAX_LENGTH ||
        message.length < MESSAGE_MIN_LENGTH ||
        message.length > MESSAGE_MAX_LENGTH
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

        return {status: "success"};
    } catch (error) {
        console.error("Contact form Turnstile validation failed", error);

        return {
            status: "error",
            reason: "submitFailed",
        };
    }
}
