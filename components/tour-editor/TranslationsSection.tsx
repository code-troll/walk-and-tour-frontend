"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TOUR_BOOKING_REFERENCE_MAX_LENGTH,
  TOUR_TEXTAREA_MAX_LENGTH,
  TOUR_TITLE_MAX_LENGTH,
  generateTourSlug,
  getTranslationDisplayName,
  type ApiLanguage,
  type TourFormState,
  type TourTranslationFormState,
} from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  LoaderCircle,
  MapPin,
  Save,
  Trash2,
} from "lucide-react";

const textareaClassName =
  "flex min-h-24 w-full rounded-2xl border border-[#ddd0bf] bg-[#fdfbf7] px-3 py-2 text-sm text-[#21343b] outline-none transition-colors placeholder:text-[#a39482] focus-visible:border-[#cfb48f] focus-visible:ring-2 focus-visible:ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-50";
const sectionClassName =
  "rounded-[1.75rem] border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(42,36,25,0.05)] max-[520px]:p-4";

type TranslationsSectionProps = {
  formState: TourFormState;
  availableLanguages: ApiLanguage[];
  activeLanguageCode: string | null;
  savingTranslationLanguageCode: string | null;
  translationErrors: Record<string, string[]>;
  onSelectTranslationAction: (languageCode: string | null) => void;
  onAddTranslationAction: (languageCode: string) => void;
  onRemoveTranslationAction: (languageCode: string) => void;
  onSaveTranslationAction: (languageCode: string) => void;
  onSetTranslationFieldAction: (args: {
    languageCode: string;
    updater: (translation: TourTranslationFormState) => TourTranslationFormState;
  }) => void;
  onUpdateStopContentAction: (args: {
    languageCode: string;
    stopId: string;
    field: "title" | "description";
    value: string;
  }) => void;
};

export function TranslationsSection({
                                      formState,
                                      availableLanguages,
                                      activeLanguageCode,
                                      savingTranslationLanguageCode,
                                      translationErrors,
                                      onSelectTranslationAction,
                                      onAddTranslationAction,
                                      onRemoveTranslationAction,
                                      onSaveTranslationAction,
                                      onSetTranslationFieldAction,
                                      onUpdateStopContentAction,
                                    }: TranslationsSectionProps) {
  const orderedLanguages = [...availableLanguages].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );
  const usedLangCodes = new Set(formState.translations.map((translation) => translation.languageCode));
  const availableToAdd = orderedLanguages.filter(
    (language) => language.isEnabled && !usedLangCodes.has(language.code),
  );
  const translationOrder = new Map(orderedLanguages.map((language, index) => [language.code, index]));
  const orderedTranslations = [...formState.translations].sort(
    (left, right) =>
      (translationOrder.get(left.languageCode) ?? Number.MAX_SAFE_INTEGER) -
      (translationOrder.get(right.languageCode) ?? Number.MAX_SAFE_INTEGER),
  );

  const updateTranslationField = <TKey extends keyof TourTranslationFormState>(
    languageCode: string,
    field: TKey,
    value: TourTranslationFormState[TKey],
  ) => {
    onSetTranslationFieldAction({
      languageCode,
      updater: (translation) => ({
        ...translation,
        [field]: value,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <section className={ sectionClassName }>
        <div className="flex flex-wrap items-center justify-between gap-4 max-[520px]:items-stretch">
          <div>
            <h2 className="text-lg font-semibold text-[#21343b]">Translations</h2>
            <p className="mt-1 text-sm text-[#627176]">
              Manage localized content and save each locale independently.
            </p>
          </div>

          <div className="flex items-center gap-3 max-[520px]:w-full">
            <select
              value=""
              onChange={ (event) => {
                if (!event.target.value) {
                  return;
                }

                onAddTranslationAction(event.target.value);
              } }
              className="h-10 rounded-2xl border border-[#ddd0bf] bg-[#fdfbf7] px-3 text-sm text-[#21343b] shadow-sm outline-none transition focus:border-[#cfb48f] focus:ring-2 focus:ring-[#eadfce] max-[520px]:w-full"
              disabled={ availableToAdd.length === 0 }
            >
              <option value="">Select language</option>
              { availableToAdd.map((language) => (
                <option key={ language.code } value={ language.code }>
                  { language.name } ({ language.code })
                </option>
              )) }
            </select>
          </div>
        </div>
      </section>

      { orderedTranslations.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-[#d8c5a8] bg-[#fcfaf6] p-12 text-center">
          <Globe className="mx-auto mb-4 size-12 text-[#8f7e67]"/>
          <h3 className="mb-2 font-semibold text-[#21343b]">No Translations</h3>
          <p className="text-sm text-[#627176]">
            Add a language to start creating localized tour content.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          { orderedTranslations.map((translation) => {
            const languageName = getTranslationDisplayName({
              languageCode: translation.languageCode,
              languages: orderedLanguages,
            });
            const isExpanded = activeLanguageCode === translation.languageCode;
            const isReady = translation.isReady;
            const isSavingTranslation = savingTranslationLanguageCode === translation.languageCode;
            const translationError = translationErrors[translation.languageCode]?.join(" ") ?? null;

            return (
              <div
                key={ translation.languageCode }
                className="overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-white shadow-[0_14px_32px_rgba(42,36,25,0.04)]"
              >
                <div className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-[#fcfaf6] max-[520px]:flex-col max-[520px]:items-stretch max-[520px]:px-4">
                  <button
                    type="button"
                    onClick={ () => onSelectTranslationAction(isExpanded ? null : translation.languageCode) }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left max-[520px]:w-full"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      { isExpanded ? (
                        <ChevronDown className="size-5 text-muted-foreground"/>
                      ) : (
                        <ChevronRight className="size-5 text-muted-foreground"/>
                      ) }

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-[#f3e5cf]">
                        <span className="text-sm font-bold uppercase text-[#9a6a2f]">
                          { translation.languageCode }
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#21343b]">{ languageName }</div>
                        <div className="truncate text-sm text-[#627176]">
                          { translation.title || "No title set" }
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-3 max-[520px]:w-full max-[520px]:flex-col max-[520px]:items-stretch">
                    <span
                      className={ cn(
                        "rounded-full px-2.5 py-1 text-center text-xs font-medium max-[520px]:w-full",
                        isReady ? "bg-[#ecf6ef] text-[#2f6f45]" : "bg-[#f4ede3] text-[#7c6a54]",
                      ) }
                    >
                      { isReady ? "Ready" : "Not ready" }
                    </span>
                    { translation.isPublished ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-[#2f6f45] max-[520px]:justify-center">
                        <Check className="size-3.5"/>
                        Published
                      </span>
                    ) : null }
                    <div className="flex items-center gap-3 max-[520px]:grid max-[520px]:grid-cols-2">
                      <Button
                        size="sm"
                        onClick={ (event) => {
                          event.stopPropagation();
                          onSaveTranslationAction(translation.languageCode);
                        } }
                        className="gap-2 whitespace-normal max-[520px]:w-full"
                        disabled={ isSavingTranslation }
                      >
                        { isSavingTranslation ? (
                          <LoaderCircle className="size-4 animate-spin"/>
                        ) : (
                          <Save className="size-4"/>
                        ) }
                        <span className="hidden md:visible">Save</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={ (event) => {
                          event.stopPropagation();
                          onRemoveTranslationAction(translation.languageCode);
                        } }
                        className="gap-2 whitespace-normal text-[#b3574a] hover:bg-[#fbf2f0] hover:text-[#b3574a] max-[520px]:w-full"
                        disabled={ isSavingTranslation }
                      >
                        <Trash2 className="size-4"/>
                        <span className="hidden md:visible">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>

                { isExpanded ? (
                  <div className="space-y-6 border-t border-[#f0e6d8] px-6 pt-4 pb-6 max-[520px]:px-4">
                    { translationError ? (
                      <div className="rounded-[1rem] border border-[#e8c7c1] bg-[#fbf2f0] p-4">
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-[#a3483f]">{ translationError }</p>
                        </div>
                      </div>
                    ) : null }

                    <div className="space-y-4 mt-4">
                      <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="size-4 text-[#9a6a2f]"/>
                        Content
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Title</label>
                          <Input
                            value={ translation.title }
                            onChange={ (event) =>
                              updateTranslationField(
                                translation.languageCode,
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder="Enter localized title"
                            maxLength={ TOUR_TITLE_MAX_LENGTH }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">URL Slug</label>
                          <Input
                            value={ translation.slug }
                            onChange={ (event) =>
                              updateTranslationField(
                                translation.languageCode,
                                "slug",
                                event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                              )
                            }
                            placeholder={ generateTourSlug(translation.title || formState.name) || "tour-url-slug" }
                            className="font-mono text-sm"
                          />
                          { !translation.slug && (translation.title || formState.name) ? (
                            <p className="text-xs text-muted-foreground">
                              Will use: <span className="font-mono">{ generateTourSlug(translation.title || formState.name) }</span>
                            </p>
                          ) : null }
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Cancellation Type
                            </label>
                            <Input
                              value={ translation.cancellationType }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "cancellationType",
                                  event.target.value,
                                )
                              }
                              placeholder="Free cancellation up to 24 hours before the start time."
                              maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Booking Reference ID
                            </label>
                            <Input
                              value={ translation.bookingReferenceId }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "bookingReferenceId",
                                  event.target.value,
                                )
                              }
                              maxLength={ TOUR_BOOKING_REFERENCE_MAX_LENGTH }
                              placeholder="booking-ref-123"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              About Tour Description
                            </label>
                            <textarea
                              value={ translation.aboutTourDescription }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "aboutTourDescription",
                                  event.target.value,
                                )
                              }
                              placeholder="Describe the tour for this language"
                              rows={ 5 }
                              maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                              className={ textareaClassName }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Highlights
                            </label>
                            <textarea
                              value={ translation.highlightsText }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "highlightsText",
                                  event.target.value,
                                )
                              }
                              placeholder="One item per line"
                              rows={ 5 }
                              maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                              className={ textareaClassName }
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Included</label>
                            <textarea
                              value={ translation.includedText }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "includedText",
                                  event.target.value,
                                )
                              }
                              placeholder="One item per line"
                              rows={ 5 }
                              className={ textareaClassName }
                              maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">
                              Not Included
                            </label>
                            <textarea
                              value={ translation.notIncludedText }
                              onChange={ (event) =>
                                updateTranslationField(
                                  translation.languageCode,
                                  "notIncludedText",
                                  event.target.value,
                                )
                              }
                              placeholder="One item per line"
                              rows={ 5 }
                              className={ textareaClassName }
                              maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        <MapPin className="size-4 text-[#9a6a2f]"/>
                        Location Labels
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Start Point Label
                          </label>
                          <Input
                            value={ translation.startPointLabel }
                            onChange={ (event) =>
                              updateTranslationField(
                                translation.languageCode,
                                "startPointLabel",
                                event.target.value,
                              )
                            }
                            placeholder="e.g. City Hall Plaza"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            End Point Label
                          </label>
                          <Input
                            value={ translation.endPointLabel }
                            onChange={ (event) =>
                              updateTranslationField(
                                translation.languageCode,
                                "endPointLabel",
                                event.target.value,
                              )
                            }
                            placeholder="e.g. Cathedral Square"
                          />
                        </div>
                      </div>
                    </div>

                    { formState.itineraryVariant === "description" ? (
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-foreground">
                          <MapPin className="size-4 text-[#9a6a2f]"/>
                          Itinerary Description
                        </h3>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">
                            Tour Route Description
                          </label>
                          <textarea
                            value={ translation.itineraryDescription }
                            onChange={ (event) =>
                              updateTranslationField(
                                translation.languageCode,
                                "itineraryDescription",
                                event.target.value,
                              )
                            }
                            placeholder="Describe the route, what guests will see, and how the tour flows."
                            rows={ 6 }
                            maxLength={ TOUR_TEXTAREA_MAX_LENGTH }
                            className={ textareaClassName }
                          />
                        </div>
                      </div>
                    ) : null }

                    { formState.itineraryVariant === "stops" && formState.stops.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-foreground">
                          <MapPin className="size-4 text-[#9a6a2f]"/>
                          Stop Translations
                        </h3>

                        <div className="space-y-3">
                          { formState.stops.map((stop, index) => {
                            const stopId = stop.id.trim();
                            const stopCopy = stopId ? translation.stopContent[stopId] : undefined;

                            return (
                              <div
                                key={ stop.clientId }
                                className="space-y-3 rounded-[1rem] border border-[#efe4d5] bg-[#fffcf7] p-4"
                              >
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <span
                                    className="flex size-6 items-center justify-center rounded-full bg-[#21343b] text-xs text-white">
                                    { index + 1 }
                                  </span>
                                  { stopId || `Stop ${ index + 1 }` }
                                </div>

                                { !stopId ? (
                                  <p className="text-xs text-[#627176]">
                                    Set the stop ID in the Itinerary section before entering localized stop copy.
                                  </p>
                                ) : null }

                                <div className="grid gap-3 md:grid-cols-2">
                                  <Input
                                    value={ stopCopy?.title || "" }
                                    onChange={ (event) =>
                                      onUpdateStopContentAction({
                                        languageCode: translation.languageCode,
                                        stopId,
                                        field: "title",
                                        value: event.target.value,
                                      })
                                    }
                                    placeholder="Stop title"
                                    disabled={ !stopId }
                                  />

                                  <textarea
                                    value={ stopCopy?.description || "" }
                                    onChange={ (event) =>
                                      onUpdateStopContentAction({
                                        languageCode: translation.languageCode,
                                        stopId,
                                        field: "description",
                                        value: event.target.value,
                                      })
                                    }
                                    placeholder="Stop description"
                                    rows={ 4 }
                                    className={ textareaClassName }
                                    disabled={ !stopId }
                                  />
                                </div>
                              </div>
                            );
                          }) }
                        </div>
                      </div>
                    ) : null }
                  </div>
                ) : null }
              </div>
            );
          }) }
        </div>
      ) }
    </div>
  );
}
