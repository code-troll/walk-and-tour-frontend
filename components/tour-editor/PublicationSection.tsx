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
  onPublishTranslationAction: (args: { languageCode: string }) => void;
  onUnpublishTranslationAction: (args: { languageCode: string }) => void;
  onPublishAllReadyAction: () => void;
  onUnpublishAllAction: () => void;
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
                                     onPublishTranslationAction,
                                     onUnpublishTranslationAction,
                                     onPublishAllReadyAction,
                                     onUnpublishAllAction,
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
      <section className="rounded-[1.75rem] border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(42,36,25,0.05)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#21343b]">Translation Publication</h2>
            <p className="mt-1 text-sm text-[#627176]">
              Control which translations are publicly available and review backend diagnostics.
            </p>
            { isMutating ? (
              <p className="mt-2 text-xs text-[#627176]">
                Please wait for the current request to finish before changing publication state.
              </p>
            ) : null }
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={ onUnpublishAllAction }
              disabled={ isMutating || publishedTranslations.length === 0 }
              className="border-[#d8c5a8] bg-[#fbf7f0] text-[#7a5424] hover:bg-[#f4ebde]"
            >
              Unpublish All
            </Button>
            <Button
              size="sm"
              onClick={ onPublishAllReadyAction }
              disabled={ isMutating || readyUnpublished.length === 0 }
              className="gap-2 border border-[#21343b] bg-[#21343b] text-white hover:bg-[#2c454d]"
            >
              <Send className="size-4"/>
              Publish Ready
            </Button>
          </div>
        </div>

        { formState.translations.length === 0 ? (
          <div className="rounded-[1.25rem] border-2 border-dashed border-[#d8c5a8] bg-[#fcfaf6] py-8 text-center">
            <Globe className="mx-auto mb-3 size-10 text-[#8f7e67]"/>
            <p className="text-[#627176]">
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
                      ? "border-[#cfe1d3] bg-[#f5fbf6]"
                      : "border-[#efe4d5] bg-[#fffcf7]",
                  ) }
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-12 items-center justify-center rounded-[1rem] bg-[#f3e5cf]">
                        <span className="text-sm font-bold uppercase text-[#9a6a2f]">
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
                              isReady ? "bg-[#ecf6ef] text-[#2f6f45]" : "bg-[#f4ede3] text-[#7c6a54]",
                            ) }
                          >
                            { isReady ? "Ready" : "Not ready" }
                          </span>
                          { diagnostic && !diagnostic.isSchemaValid ? (
                            <span
                              className="rounded-full bg-[#fbf2f0] px-2 py-0.5 text-xs font-medium text-[#a3483f]">
                              Schema issues
                            </span>
                          ) : null }
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <div
                            className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-[#efe4d5]">
                            <div
                              className="h-full rounded-full bg-[#9a6a2f] transition-all"
                              style={ {width: `${ completion.percentage }%`} }
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            { completion.percentage }% complete
                          </span>
                        </div>

                        { diagnostic ? (
                          <div
                            className="mt-2 flex flex-wrap gap-2 text-xs text-[#627176]">
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
                          className="flex items-center gap-1.5 text-sm font-medium text-[#2f6f45]">
                          <CheckCircle2 className="size-4"/>
                          Published
                        </span>
                      ) : !isReady ? (
                        <span
                          className="flex items-center gap-1.5 text-sm text-[#7c6a54]">
                          <AlertCircle className="size-4"/>
                          Not ready
                        </span>
                      ) : null }

                      <Button
                        variant={ isPublished ? "outline" : "default" }
                        size="sm"
                        onClick={ () =>
                          isPublished
                            ? onUnpublishTranslationAction({languageCode: translation.languageCode})
                            : onPublishTranslationAction({languageCode: translation.languageCode})
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

      <section className="rounded-[1.75rem] border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(42,36,25,0.05)]">
        <h2 className="mb-4 text-lg font-semibold text-[#21343b]">Publication Checklist</h2>
        <p className="mb-6 text-sm text-[#627176]">
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
        "flex items-center gap-3 rounded-[1rem] p-3",
        passed ? "bg-[#f5fbf6]" : "bg-[#fcfaf6]",
      ) }
    >
      <div
        className={ cn(
          "flex size-6 items-center justify-center rounded-full",
          passed ? "bg-[#2f6f45] text-white" : "bg-[#efe4d5]",
        ) }
      >
        { passed ? (
          <Check className="size-3.5"/>
        ) : (
          <X className="size-3.5 text-[#7c6a54]"/>
        ) }
      </div>
      <span className={ cn("text-sm", passed ? "text-[#21343b]" : "text-[#627176]") }>
        { label }
      </span>
    </div>
  );
}
