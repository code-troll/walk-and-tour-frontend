"use client";

import { Button } from "@/components/ui/button";
import {
  getTranslationDisplayName,
  type ApiLanguage,
  type ApiTour,
  type TourFormState,
  type TourTranslationFormState,
} from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Send,
  X,
} from "lucide-react";

type PublicationSectionProps = {
  formState: TourFormState;
  availableLanguages: ApiLanguage[];
  diagnostics: ApiTour["translationAvailability"];
  isMutating: boolean;
  onPublishTranslation: (args: { languageCode: string }) => void;
  onUnpublishTranslation: (args: { languageCode: string }) => void;
  onPublishAllReady: () => void;
  onUnpublishAll: () => void;
};

const splitTextareaLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const getCompletionStatus = ({
                               formState,
                               translation,
                             }: {
  formState: TourFormState;
  translation: TourTranslationFormState;
}) => {
  const checks = [
    translation.title.trim().length > 0,
    translation.cancellationType.trim().length > 0,
    translation.aboutTourDescription.trim().length > 0,
    translation.customerSupportDescription.trim().length > 0,
    splitTextareaLines(translation.highlightsText).length > 0,
    splitTextareaLines(translation.includedText).length > 0,
    splitTextareaLines(translation.notIncludedText).length > 0,
    translation.startPointLabel.trim().length > 0 && translation.endPointLabel.trim().length > 0,
    formState.itineraryVariant === "description"
      ? translation.itineraryDescription.trim().length > 0
      : formState.stops.every((stop) => {
        const stopId = stop.id.trim();
        const stopCopy = stopId ? translation.stopContent[stopId] : undefined;

        return Boolean(stopCopy?.title?.trim() && stopCopy?.description?.trim());
      }),
  ];

  const completed = checks.filter(Boolean).length;
  return {
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
  };
};

export function PublicationSection({
                                     formState,
                                     availableLanguages,
                                     diagnostics,
                                     isMutating,
                                     onPublishTranslation,
                                     onUnpublishTranslation,
                                     onPublishAllReady,
                                     onUnpublishAll,
                                   }: PublicationSectionProps) {
  const orderedLanguages = [...availableLanguages].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );
  const diagnosticsByLanguage = new Map(diagnostics.map((diagnostic) => [diagnostic.languageCode, diagnostic]));

  const publishedTranslations = formState.translations.filter(
    (translation) => translation.isPublished,
  );
  const readyUnpublished = formState.translations.filter(
    (translation) =>
      translation.isReady &&
      !translation.isPublished,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Translation Publication</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control which translations are publicly available and review backend diagnostics.
            </p>
            { isMutating ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Please wait for the current request to finish before changing publication state.
              </p>
            ) : null }
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={ onUnpublishAll }
              disabled={ isMutating || publishedTranslations.length === 0 }
            >
              Unpublish All
            </Button>
            <Button
              size="sm"
              onClick={ onPublishAllReady }
              disabled={ isMutating || readyUnpublished.length === 0 }
              className="gap-2"
            >
              <Send className="size-4"/>
              Publish Ready
            </Button>
          </div>
        </div>

        { formState.translations.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border py-8 text-center">
            <Globe className="mx-auto mb-3 size-10 text-muted-foreground"/>
            <p className="text-muted-foreground">
              No translations available. Add translations first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            { formState.translations.map((translation) => {
              const isPublished = translation.isPublished;
              const isReady = translation.isReady;
              const completion = getCompletionStatus({formState, translation});
              const diagnostic = diagnosticsByLanguage.get(translation.languageCode);
              const languageName = getTranslationDisplayName({
                languageCode: translation.languageCode,
                languages: orderedLanguages,
              });

              return (
                <div
                  key={ translation.languageCode }
                  className={ cn(
                    "rounded-xl border p-4 transition-colors",
                    isPublished
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background",
                  ) }
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-12 items-center justify-center rounded-lg bg-muted">
                        <span className="text-sm font-bold uppercase text-foreground">
                          { translation.languageCode }
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                      className="font-semibold text-foreground">{ languageName }</span>
                          <span
                            className={ cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              isReady ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                            ) }
                          >
                            { isReady ? "Ready" : "Not ready" }
                          </span>
                          { diagnostic && !diagnostic.isSchemaValid ? (
                            <span
                              className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                              Schema issues
                            </span>
                          ) : null }
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <div
                            className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={ {width: `${ completion.percentage }%`} }
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            { completion.percentage }% complete
                          </span>
                        </div>

                        { diagnostic ? (
                          <div
                            className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>
                              { diagnostic.publiclyAvailable ? "Publicly available" : "Not public" }
                            </span>
                            { diagnostic.missingRequiredLists.length > 0 ? (
                              <span>
                                Missing lists: { diagnostic.missingRequiredLists.join(", ") }
                              </span>
                            ) : null }
                            { diagnostic.missingStopTranslations.length > 0 ? (
                              <span>
                                Missing stops: { diagnostic.missingStopTranslations.join(", ") }
                              </span>
                            ) : null }
                          </div>
                        ) : null }
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      { isPublished ? (
                        <span
                          className="flex items-center gap-1.5 text-sm font-medium text-primary">
                          <CheckCircle2 className="size-4"/>
                          Published
                        </span>
                      ) : !isReady ? (
                        <span
                          className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <AlertCircle className="size-4"/>
                          Not ready
                        </span>
                      ) : null }

                      <Button
                        variant={ isPublished ? "outline" : "default" }
                        size="sm"
                        onClick={ () =>
                          isPublished
                            ? onUnpublishTranslation({languageCode: translation.languageCode})
                            : onPublishTranslation({languageCode: translation.languageCode})
                        }
                        disabled={ isMutating || (!isReady && !isPublished) }
                        className="min-w-24"
                      >
                        { isPublished ? (
                          <>
                            <X className="mr-1 size-4"/>
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Send className="mr-1 size-4"/>
                            Publish
                          </>
                        ) }
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }) }
          </div>
        ) }
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Publication Checklist</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ensure these requirements are met before publishing.
        </p>

        <div className="space-y-3">
          <ChecklistItem
            label="Tour has a name and slug"
            passed={ Boolean(formState.name.trim() && formState.slug.trim()) }
          />
          <ChecklistItem
            label="Duration, rating, and review count are set"
            passed={
              Boolean(formState.durationMinutes.trim()) &&
              Boolean(formState.rating.trim()) &&
              Boolean(formState.reviewCount.trim())
            }
          />
          <ChecklistItem
            label="At least one stop defined when using a stop-based itinerary"
            passed={
              formState.itineraryVariant === "description" || formState.stops.length > 0
            }
          />
          <ChecklistItem
            label="Start and end coordinates are set"
            passed={
              Boolean(formState.startPointLat) &&
              Boolean(formState.startPointLng) &&
              Boolean(formState.endPointLat) &&
              Boolean(formState.endPointLng)
            }
          />
          <ChecklistItem
            label="At least one translation is ready"
            passed={ formState.translations.some((translation) => translation.isReady) }
          />
          <ChecklistItem
            label="A cover image is configured"
            passed={ Boolean(formState.coverMediaId) }
          />
        </div>
      </section>
    </div>
  );
}

function ChecklistItem({label, passed}: { label: string; passed: boolean }) {
  return (
    <div
      className={ cn(
        "flex items-center gap-3 rounded-lg p-3",
        passed ? "bg-primary/5" : "bg-muted/50",
      ) }
    >
      <div
        className={ cn(
          "flex size-6 items-center justify-center rounded-full",
          passed ? "bg-primary text-primary-foreground" : "bg-muted",
        ) }
      >
        { passed ? (
          <Check className="size-3.5"/>
        ) : (
          <X className="size-3.5 text-muted-foreground"/>
        ) }
      </div>
      <span className={ cn("text-sm", passed ? "text-foreground" : "text-muted-foreground") }>
        { label }
      </span>
    </div>
  );
}
