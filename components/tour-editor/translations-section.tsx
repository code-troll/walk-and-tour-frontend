"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TOUR_BOOKING_REFERENCE_MAX_LENGTH,
  TOUR_TEXTAREA_MAX_LENGTH,
  TOUR_TITLE_MAX_LENGTH,
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
  "flex min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Translations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage localized content and save each locale independently.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value=""
              onChange={ (event) => {
                if (!event.target.value) {
                  return;
                }

                onAddTranslationAction(event.target.value);
              } }
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Globe className="mx-auto mb-4 size-12 text-muted-foreground"/>
          <h3 className="mb-2 font-semibold text-foreground">No Translations</h3>
          <p className="text-sm text-muted-foreground">
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
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/30">
                  <button
                    type="button"
                    onClick={ () => onSelectTranslationAction(isExpanded ? null : translation.languageCode) }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      { isExpanded ? (
                        <ChevronDown className="size-5 text-muted-foreground"/>
                      ) : (
                        <ChevronRight className="size-5 text-muted-foreground"/>
                      ) }

                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <span className="text-sm font-bold uppercase text-primary">
                          { translation.languageCode }
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">{ languageName }</div>
                        <div className="truncate text-sm text-muted-foreground">
                          { translation.title || "No title set" }
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <span
                      className={ cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        isReady ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      ) }
                    >
                      { isReady ? "Ready" : "Not ready" }
                    </span>
                    { translation.isPublished ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="size-3.5"/>
                        Published
                      </span>
                    ) : null }
                    <Button
                      size="sm"
                      onClick={ (event) => {
                        event.stopPropagation();
                        onSaveTranslationAction(translation.languageCode);
                      } }
                      className="gap-2"
                      disabled={ isSavingTranslation }
                    >
                      { isSavingTranslation ? (
                        <LoaderCircle className="size-4 animate-spin"/>
                      ) : (
                        <Save className="size-4"/>
                      ) }
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={ (event) => {
                        event.stopPropagation();
                        onRemoveTranslationAction(translation.languageCode);
                      } }
                      className="gap-2 text-destructive hover:text-destructive"
                      disabled={ isSavingTranslation }
                    >
                      <Trash2 className="size-4"/>
                      Delete
                    </Button>
                  </div>
                </div>

                { isExpanded ? (
                  <div className="space-y-6 border-t border-border px-6 pt-2 pb-6">
                    { translationError ? (
                      <div className="rounded-lg bg-muted/30 p-4">
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-destructive">{ translationError }</p>
                        </div>
                      </div>
                    ) : null }

                    <div className="space-y-4 mt-4">
                      <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="size-4 text-primary"/>
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
                        <MapPin className="size-4 text-primary"/>
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
                          <MapPin className="size-4 text-primary"/>
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
                          <MapPin className="size-4 text-primary"/>
                          Stop Translations
                        </h3>

                        <div className="space-y-3">
                          { formState.stops.map((stop, index) => {
                            const stopId = stop.id.trim();
                            const stopCopy = stopId ? translation.stopContent[stopId] : undefined;

                            return (
                              <div
                                key={ stop.clientId }
                                className="space-y-3 rounded-lg border border-border p-4"
                              >
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <span
                                    className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    { index + 1 }
                                  </span>
                                  { stopId || `Stop ${ index + 1 }` }
                                </div>

                                { !stopId ? (
                                  <p className="text-xs text-muted-foreground">
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
