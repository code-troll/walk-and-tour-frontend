"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PhoneInput, { type Value } from "react-phone-number-input";
import enPhoneLabels from "react-phone-number-input/locale/en.json";

type ContactFormProps = {
    className?: string;
    buttonClassName?: string;
};

const defaultFormClassName =
    "space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/10";
const defaultButtonClassName =
    "w-full btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors";

export default function ContactForm({
                                        className = defaultFormClassName,
                                        buttonClassName = defaultButtonClassName,
                                    }: ContactFormProps) {
    const t = useTranslations("contact");
    const [phone, setPhone] = useState<Value | undefined>();
    const fieldClassName =
        "mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:border-[#2a221a] focus:outline-none";
    const phoneWrapperClassName =
        "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#2a221a] focus-within:border-[#2a221a]";
    const phoneInputClassName =
        "w-full bg-transparent text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:outline-none";

    return (
        <form className={ className }>
            <div>
                <input
                    type="text"
                    placeholder={ t("namePlaceholder") }
                    className={ fieldClassName }
                />
            </div>
            <div>
                <PhoneInput
                    defaultCountry="DK"
                    placeholder={ t("phonePlaceholder") }
                    value={ phone }
                    onChange={ setPhone }
                    labels={ enPhoneLabels }
                    locales="en"
                    className={ phoneWrapperClassName }
                    numberInputProps={ {
                        className: phoneInputClassName,
                    } }
                />
            </div>
            <div>
                <input
                    type="email"
                    placeholder={ t("emailPlaceholder") }
                    className={ fieldClassName }
                />
            </div>
            <div>
        <textarea
            rows={ 4 }
            placeholder={ t("messagePlaceholder") }
            className={ fieldClassName }
        />
            </div>
            <button
                type="button"
                className={ buttonClassName }
            >
                { t("sendMessage") }
            </button>
        </form>
    );
}
