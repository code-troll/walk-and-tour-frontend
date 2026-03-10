"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useLocale, useTranslations } from "next-intl";
import PhoneInput, { type Value } from "react-phone-number-input";
import enPhoneLabels from "react-phone-number-input/locale/en.json";

import {
    submitContactForm,
    type ContactFormActionState,
    type ContactFormFailureReason,
} from "@/components/contact/contact-form-action";

type ContactFormProps = {
    className?: string;
    buttonClassName?: string;
};

type LocalFeedbackReason =
    | Extract<
    ContactFormFailureReason,
    "turnstileRequired" | "turnstileFailed" | "turnstileUnavailable"
>
    | null;

const defaultFormClassName =
    "space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/10";
const defaultButtonClassName =
    "w-full btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const initialState: ContactFormActionState = {status: "idle"};
const turnstileAction = "contact-form";
const turnstileFieldName = "turnstileToken";

const feedbackKeyByReason: Record<
    ContactFormFailureReason,
    `feedback.${ ContactFormFailureReason }`
> = {
    invalidFields: "feedback.invalidFields",
    invalidEmail: "feedback.invalidEmail",
    turnstileRequired: "feedback.turnstileRequired",
    turnstileFailed: "feedback.turnstileFailed",
    turnstileUnavailable: "feedback.turnstileUnavailable",
    submitFailed: "feedback.submitFailed",
};

export default function ContactForm({
                                        className = defaultFormClassName,
                                        buttonClassName = defaultButtonClassName,
                                    }: ContactFormProps) {
    const t = useTranslations("contact");
    const locale = useLocale();
    const [phone, setPhone] = useState<Value | undefined>();
    const [turnstileToken, setTurnstileToken] = useState("");
    const [localFeedbackReason, setLocalFeedbackReason] = useState<LocalFeedbackReason>(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ? null : "turnstileUnavailable"
    );
    const [state, formAction, isPending] = useActionState(submitContactForm, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
    const fieldClassName =
        "mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:border-[#2a221a] focus:outline-none";
    const phoneWrapperClassName =
        "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#2a221a] focus-within:border-[#2a221a]";
    const phoneInputClassName =
        "w-full bg-transparent text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:outline-none";

    useEffect(() => {
        if (state.status === "success") {
            formRef.current?.reset();
            setPhone(undefined);
            setTurnstileToken("");
            setLocalFeedbackReason(turnstileSiteKey ? null : "turnstileUnavailable");
            turnstileRef.current?.reset();
            return;
        }

        if (
            state.status === "error" &&
            (state.reason === "turnstileRequired" || state.reason === "turnstileFailed")
        ) {
            setTurnstileToken("");
            turnstileRef.current?.reset();
        }
    }, [state, turnstileSiteKey]);

    const feedbackKey =
        state.status === "success"
            ? "feedback.success"
            : localFeedbackReason
                ? feedbackKeyByReason[localFeedbackReason]
                : state.status === "error"
                    ? feedbackKeyByReason[state.reason]
                    : null;
    const isSubmitDisabled = isPending || (Boolean(turnstileSiteKey) && turnstileToken.length === 0);

    return (
        <form ref={ formRef } action={ formAction } className={ className }>
            <div>
                <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={ 120 }
                    placeholder={ t("namePlaceholder") }
                    className={ fieldClassName }
                />
            </div>
            <div>
                <PhoneInput
                    defaultCountry="DK"
                    placeholder={ t("phonePlaceholder") }
                    value={ phone }
                    onChange={ (nextPhone) => {
                        setPhone(nextPhone);
                    } }
                    labels={ enPhoneLabels }
                    locales="en"
                    className={ phoneWrapperClassName }
                    numberInputProps={ {
                        className: phoneInputClassName,
                        autoComplete: "tel",
                    } }
                />
                <input type="hidden" name="phone" value={ phone ?? "" }/>
            </div>
            <div>
                <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder={ t("emailPlaceholder") }
                    className={ fieldClassName }
                />
            </div>
            <div>
        <textarea
            name="message"
            rows={ 4 }
            required
            minLength={ 10 }
            maxLength={ 3000 }
            placeholder={ t("messagePlaceholder") }
            className={ fieldClassName }
        />
            </div>

            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7562]">
                    { t("captchaLabel") }
                </p>

                { turnstileSiteKey ? (
                    <Turnstile
                        key={ locale }
                        ref={ turnstileRef }
                        siteKey={ turnstileSiteKey }
                        onSuccess={ (token) => {
                            setTurnstileToken(token);
                            setLocalFeedbackReason(null);
                        } }
                        onExpire={ () => {
                            setTurnstileToken("");
                            setLocalFeedbackReason("turnstileRequired");
                        } }
                        onError={ () => {
                            setTurnstileToken("");
                            setLocalFeedbackReason("turnstileFailed");
                        } }
                        options={ {
                            action: turnstileAction,
                            language: locale,
                            responseField: false,
                            size: "flexible",
                            theme: "light",
                        } }
                    />
                ) : (
                    <div
                        className="rounded-2xl border border-dashed border-[#d8c8b7] bg-[#fcfaf7] px-4 py-5 text-sm text-[#5b4d3c]">
                        { t(feedbackKeyByReason.turnstileUnavailable) }
                    </div>
                ) }

                <input
                    type="hidden"
                    name={ turnstileFieldName }
                    value={ turnstileToken }
                />
            </div>

            { feedbackKey && (
                <p
                    aria-live="polite"
                    className={
                        state.status === "success"
                            ? "text-sm font-medium text-[#2b666d]"
                            : "text-sm font-medium text-[#c24343]"
                    }
                >
                    { t(feedbackKey) }
                </p>
            ) }

            <button
                type="submit"
                disabled={ isSubmitDisabled }
                className={ buttonClassName }
            >
                { isPending ? t("sendingMessage") : t("sendMessage") }
            </button>
        </form>
    );
}
