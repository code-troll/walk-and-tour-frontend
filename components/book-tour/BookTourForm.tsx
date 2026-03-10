"use client";

import { useActionState, useEffect, useEffectEvent, useRef, useState, type ComponentType } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ES, GB, IT } from "country-flag-icons/react/3x2";
import PhoneInput, { type Value } from "react-phone-number-input";
import enPhoneLabels from "react-phone-number-input/locale/en.json";

import {
  submitBookTourForm,
  type BookTourFormActionState,
  type BookTourFormFailureReason,
} from "@/components/book-tour/book-tour-form-action";
import {
  companyExperiences,
  type CompanyExperienceId,
} from "@/lib/companies-data";
import {
  toursCatalog,
  type TourId,
} from "@/lib/landing-data";

type BookTourType = "privateTours" | "companyTours" | "otherTours";
type TourLanguageOptionId =
  | "english"
  | "spanish"
  | "italian";
type CountryCode = "GB" | "ES" | "IT";

type SelectOption = {
  id: string;
  label: string;
};

type TourLanguageOption = {
  id: TourLanguageOptionId;
  countryCode: CountryCode;
};

type LocalFeedbackReason =
  | Extract<
  BookTourFormFailureReason,
  "turnstileRequired" | "turnstileFailed" | "turnstileUnavailable"
>
  | null;

const bookingTypes: BookTourType[] = [
  "privateTours",
  "companyTours",
  "otherTours",
];
const languageOptions: TourLanguageOption[] = [
  {id: "english", countryCode: "GB"},
  {id: "spanish", countryCode: "ES"},
  {id: "italian", countryCode: "IT"},
];
const flagByCountryCode: Record<
  CountryCode,
  ComponentType<{ className?: string }>
> = {
  GB,
  ES,
  IT,
};
const initialState: BookTourFormActionState = {status: "idle"};
const initialBookingType: BookTourType = "privateTours";
const turnstileFieldName = "turnstileToken";
const turnstileAction = "book-tour-form";

const feedbackKeyByReason: Record<
  BookTourFormFailureReason,
  `bookTourPage.feedback.${ BookTourFormFailureReason }`
> = {
  invalidFields: "bookTourPage.feedback.invalidFields",
  invalidEmail: "bookTourPage.feedback.invalidEmail",
  turnstileRequired: "bookTourPage.feedback.turnstileRequired",
  turnstileFailed: "bookTourPage.feedback.turnstileFailed",
  turnstileUnavailable: "bookTourPage.feedback.turnstileUnavailable",
  submitFailed: "bookTourPage.feedback.submitFailed",
};

export default function BookTourForm() {
  const t = useTranslations("bookTourPage");
  const tourItemsT = useTranslations("tourDetail.items");
  const companyItemsT = useTranslations("companiesPage.items");
  const locale = useLocale();
  const [phone, setPhone] = useState<Value | undefined>();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [bookingType, setBookingType] = useState<BookTourType>(initialBookingType);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isTourMenuOpen, setIsTourMenuOpen] = useState(false);
  const [tourLanguage, setTourLanguage] = useState<TourLanguageOptionId | "">("");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [localFeedbackReason, setLocalFeedbackReason] = useState<LocalFeedbackReason>(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ? null : "turnstileUnavailable"
  );
  const [state, formAction, isPending] = useActionState(submitBookTourForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const tourMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const now = new Date();
  const todayIsoDate = `${ now.getFullYear() }-${ String(now.getMonth() + 1).padStart(2, "0") }-${ String(now.getDate()).padStart(2, "0") }`;

  const privateTourOptions: SelectOption[] = toursCatalog
    .filter((tour) => tour.categories.includes("privateTour"))
    .map((tour) => ({
      id: tour.id,
      label: tourItemsT(`${ tour.id }.title` as `${ TourId }.title`),
    }));
  const companyTourOptions: SelectOption[] = companyExperiences.map((experience) => ({
    id: experience.id,
    label: companyItemsT(`${ experience.id }.title` as `${ CompanyExperienceId }.title`),
  }));
  const activeOptions =
    bookingType === "privateTours"
      ? privateTourOptions
      : bookingType === "companyTours"
        ? companyTourOptions
        : [];
  const selectedOption = activeOptions.find((option) => option.id === selectedItemId) ?? null;
  const selectedLanguageOption = languageOptions.find((option) => option.id === tourLanguage) ?? null;
  const selectedTourLanguageLabel = tourLanguage
    ? t(`languageOptions.${ tourLanguage }`)
    : "";
  const feedbackKey =
    state.status === "success"
      ? "feedback.success"
      : localFeedbackReason
        ? feedbackKeyByReason[localFeedbackReason].replace("bookTourPage.", "")
        : state.status === "error"
          ? feedbackKeyByReason[state.reason].replace("bookTourPage.", "")
          : null;
  const isTourSelectorDisabled = bookingType === "otherTours";
  const isSubmitDisabled = isPending || (Boolean(turnstileSiteKey) && turnstileToken.length === 0);
  const fieldClassName =
    "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:border-[#2a221a] focus:outline-none";
  const selectClassName =
    `${ fieldClassName } appearance-none pr-14`;
  const phoneWrapperClassName =
    "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#2a221a] focus-within:border-[#2a221a]";
  const phoneInputClassName =
    "w-full bg-transparent text-sm text-[#2a221a] placeholder:text-[#b5a695] focus:outline-none";
  const resetFormState = useEffectEvent(() => {
    formRef.current?.reset();
    setPhone(undefined);
    setTurnstileToken("");
    setBookingType(initialBookingType);
    setSelectedItemId("");
    setIsTourMenuOpen(false);
    setTourLanguage("");
    setIsLanguageMenuOpen(false);
    setLocalFeedbackReason(turnstileSiteKey ? null : "turnstileUnavailable");
    turnstileRef.current?.reset();
  });
  const resetTurnstileState = useEffectEvent(() => {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  });

  useEffect(() => {
    if (state.status === "success") {
      resetFormState();
      return;
    }

    if (
      state.status === "error" &&
      (state.reason === "turnstileRequired" || state.reason === "turnstileFailed")
    ) {
      resetTurnstileState();
    }
  }, [state]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (tourMenuRef.current && !tourMenuRef.current.contains(target)) {
        setIsTourMenuOpen(false);
      }

      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTourMenuOpen(false);
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <form ref={ formRef } action={ formAction }
          className="space-y-6 rounded-4xl bg-white p-6 shadow-[0_24px_60px_rgba(42,34,26,0.08)] ring-1 ring-black/5 sm:p-8">
      <input type="hidden" name="locale" value={ locale }/>
      <input type="hidden" name="bookingType" value={ bookingType }/>
      <input type="hidden" name="bookingTypeLabel" value={ t(`bookingTypes.${ bookingType }`) }/>
      <input type="hidden" name="selectedItemId" value={ isTourSelectorDisabled ? "" : selectedItemId }/>
      <input
        type="hidden"
        name="selectedItemLabel"
        value={ isTourSelectorDisabled ? "" : selectedOption?.label ?? "" }
      />
      <input type="hidden" name="tourLanguageLabel" value={ selectedTourLanguageLabel }/>

      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a7562]">
          { t("fields.bookingType.label") }
        </p>
        <div className="flex flex-wrap gap-2">
          { bookingTypes.map((option) => {
            const isSelected = bookingType === option;

            return (
              <button
                key={ option }
                type="button"
                onClick={ () => {
                  setBookingType(option);
                  setSelectedItemId("");
                  setIsTourMenuOpen(false);
                } }
                className={
                  isSelected
                    ? "cursor-pointer rounded-full border border-[#2b666d] bg-[#2b666d] px-5 py-3 text-sm font-semibold text-white transition-colors"
                    : "cursor-pointer rounded-full border border-[#d8c8b7] bg-white px-5 py-3 text-sm font-semibold text-[#5b4d3c] transition-colors hover:border-[#2b666d]"
                }
              >
                { t(`bookingTypes.${ option }`) }
              </button>
            );
          }) }
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-name">
            { t("fields.name.label") }
          </label>
          <input
            id="book-tour-name"
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={ 120 }
            placeholder={ t("fields.name.placeholder") }
            className={ fieldClassName }
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-email">
            { t("fields.email.label") }
          </label>
          <input
            id="book-tour-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder={ t("fields.email.placeholder") }
            className={ fieldClassName }
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-phone">
            { t("fields.phone.label") }
          </label>
          <PhoneInput
            id="book-tour-phone"
            defaultCountry="DK"
            placeholder={ t("fields.phone.placeholder") }
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
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-date">
            { t("fields.desiredDate.label") }
          </label>
          <input
            id="book-tour-date"
            type="date"
            name="desiredDate"
            required
            min={ todayIsoDate }
            className={ fieldClassName }
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-participants">
            { t("fields.participants.label") }
          </label>
          <input
            id="book-tour-participants"
            type="number"
            name="participants"
            min={ 1 }
            required
            placeholder={ t("fields.participants.placeholder") }
            className={ fieldClassName }
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-language">
            { t("fields.tourLanguage.label") }
          </label>
          <input type="hidden" name="tourLanguage" value={ tourLanguage }/>
          <div ref={ languageMenuRef } className="relative mt-2">
            <button
              id="book-tour-language"
              type="button"
              aria-haspopup="menu"
              aria-expanded={ isLanguageMenuOpen }
              className={ `${ selectClassName } relative flex items-center text-left ${ tourLanguage ? "" : "text-[#b5a695]" }` }
              onClick={ () => setIsLanguageMenuOpen((prev) => !prev) }
            >
              { selectedLanguageOption ? (
                <>
                  { (() => {
                    const SelectedFlag = flagByCountryCode[selectedLanguageOption.countryCode];

                    return <SelectedFlag className="mr-3 h-4 w-6 overflow-hidden rounded-xs"/>;
                  })() }
                  <span className="text-sm text-[#2a221a]">
                    { t(`languageOptions.${ selectedLanguageOption.id }`) }
                  </span>
                </>
              ) : (
                <span>{ t("fields.tourLanguage.placeholder") }</span>
              ) }
              <ChevronDown
                aria-hidden="true"
                className={ `pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b4d3c] transition-transform ${ isLanguageMenuOpen ? "rotate-180" : "" }` }
              />
            </button>
            <div
              role="menu"
              className={ [
                "absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-black/10 bg-white p-2 shadow-lg transition-opacity",
                isLanguageMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
              ].join(" ") }
            >
              { languageOptions.map((option) => {
                const Flag = flagByCountryCode[option.countryCode];
                const isSelected = tourLanguage === option.id;

                return (
                  <button
                    key={ option.id }
                    type="button"
                    role="menuitemradio"
                    aria-checked={ isSelected }
                    onClick={ () => {
                      setTourLanguage(option.id);
                      setIsLanguageMenuOpen(false);
                    } }
                    className={ [
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors",
                      isSelected
                        ? "bg-[#f8f4ef] text-[#2a221a]"
                        : "text-[#3d3124] hover:bg-[#f8f4ef]",
                    ].join(" ") }
                  >
                    <Flag className="h-4 w-6 overflow-hidden rounded-xs"/>
                    <span>{ t(`languageOptions.${ option.id }`) }</span>
                  </button>
                );
              }) }
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-selector">
            { t("fields.tour.label") }
          </label>
          <div ref={ tourMenuRef } className="relative mt-2">
            <button
              id="book-tour-selector"
              type="button"
              aria-haspopup="menu"
              aria-expanded={ isTourMenuOpen }
              disabled={ isTourSelectorDisabled }
              className={ `${ selectClassName } relative flex items-center text-left ${ isTourSelectorDisabled ? "cursor-not-allowed bg-[#f3eee8] text-[#9d8f80]" : selectedOption ? "" : "text-[#b5a695]" }` }
              onClick={ () => {
                if (isTourSelectorDisabled) {
                  return;
                }

                setIsTourMenuOpen((prev) => !prev);
              } }
            >
              <span className={ selectedOption ? "text-[#2a221a]" : "" }>
                { isTourSelectorDisabled
                  ? t("fields.tour.disabledPlaceholder")
                  : selectedOption?.label ?? t("fields.tour.placeholder") }
              </span>
              <ChevronDown
                aria-hidden="true"
                className={ `pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b4d3c] transition-transform ${ isTourMenuOpen ? "rotate-180" : "" }` }
              />
            </button>
            <div
              role="menu"
              className={ [
                "absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-black/10 bg-white p-2 shadow-lg transition-opacity",
                isTourMenuOpen && !isTourSelectorDisabled ? "opacity-100" : "pointer-events-none opacity-0",
              ].join(" ") }
            >
              { activeOptions.map((option) => {
                const isSelected = selectedItemId === option.id;

                return (
                  <button
                    key={ option.id }
                    type="button"
                    role="menuitemradio"
                    aria-checked={ isSelected }
                    onClick={ () => {
                      setSelectedItemId(option.id);
                      setIsTourMenuOpen(false);
                    } }
                    className={ [
                      "flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors",
                      isSelected
                        ? "bg-[#f8f4ef] text-[#2a221a]"
                        : "text-[#3d3124] hover:bg-[#f8f4ef]",
                    ].join(" ") }
                  >
                    <span>{ option.label }</span>
                  </button>
                );
              }) }
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-[#2a221a]" htmlFor="book-tour-message">
            { t("fields.message.label") }
          </label>
          <textarea
            id="book-tour-message"
            name="message"
            rows={ 6 }
            required
            minLength={ 10 }
            maxLength={ 3000 }
            placeholder={ t("fields.message.placeholder") }
            className={ `${ fieldClassName } min-h-36 resize-y` }
          />
        </div>
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
            { t("feedback.turnstileUnavailable") }
          </div>
        ) }

        <input type="hidden" name={ turnstileFieldName } value={ turnstileToken }/>
      </div>

      { feedbackKey ? (
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
      ) : null }

      <button
        type="submit"
        disabled={ isSubmitDisabled }
        className="w-full btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        { isPending ? t("sendingRequest") : t("submit") }
      </button>
    </form>
  );
}
