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

type CompletionCheck = {
  label: string;
  passed: boolean;
};

const getCompletionChecks = ({
  formState,
  translation,
}: {
  formState: TourFormState;
  translation: TourTranslationFormState;
}): CompletionCheck[] => {
  const checks: CompletionCheck[] = [
    { label: "Title", passed: translation.title.trim().length > 0 },
    { label: "Cancellation type", passed: translation.cancellationType.trim().length > 0 },
    { label: "About tour description", passed: translation.aboutTourDescription.trim().length > 0 },
    { label: "Highlights (at least one)", passed: splitTextareaLines(translation.highlightsText).length > 0 },
    { label: "Included items (at least one)", passed: splitTextareaLines(translation.includedText).length > 0 },
    { label: "Not included items (at least one)", passed: splitTextareaLines(translation.notIncludedText).length > 0 },
    { label: "Start point label", passed: translation.startPointLabel.trim().length > 0 },
    { label: "End point label", passed: translation.endPointLabel.trim().length > 0 },
  ];

  if (formState.itineraryVariant === "description") {
    checks.push({
      label: "Itinerary description",
      passed: translation.itineraryDescription.trim().length > 0,
    });
  } else {
    formState.stops.forEach((stop, index) => {
      const stopId = stop.id.trim();
      const stopCopy = stopId ? translation.stopContent[stopId] : undefined;

      checks.push({
        label: `Stop ${index + 1} "${stopId || "?"}" — title and description`,
        passed: Boolean(stopCopy?.title?.trim() && stopCopy?.description?.trim()),
      });
    });
  }

  return checks;
};

const getCompletionStatus = ({
  formState,
  translation,
}: {
  formState: TourFormState;
  translation: TourTranslationFormState;
}) => {
  const checks = getCompletionChecks({ formState, translation });
  const completed = checks.filter((c) => c.passed).length;

  return {
    checks,
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
  };
};

const getSharedBlockingReasons = (formState: TourFormState): string[] => {
  const reasons: string[] = [];

  if (!formState.durationMinutes.trim()) {
    reasons.push("Duration is not set");
  }

  if (!formState.rating.trim()) {
    reasons.push("Rating is not set");
  }

  if (!formState.reviewCount.trim()) {
    reasons.push("Review count is not set");
  }

  if (formState.tourType !== "company" && formState.tourType !== "tip_based" && formState.hasPrice) {
    const priceAmount = Number.parseFloat(formState.priceAmount);
    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      reasons.push("Price amount is invalid");
    }
    if (!formState.priceCurrency.trim()) {
      reasons.push("Currency is not set");
    }
  }

  if (formState.itineraryVariant === "stops" && formState.stops.length === 0) {
    reasons.push("Stop-based itinerary has no stops");
  }

  return reasons;
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

  const sharedBlockingReasons = getSharedBlockingReasons(formState);
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

                        { completion.checks.some((c) => !c.passed) ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-[#a3483f]">Missing for readiness:</p>
                            <ul className="list-none space-y-0.5">
                              { completion.checks
                                .filter((c) => !c.passed)
                                .map((c) => (
                                  <li key={ c.label } className="flex items-center gap-1.5 text-xs text-[#a3483f]">
                                    <X className="size-3 shrink-0" />
                                    { c.label }
                                  </li>
                                ))
                              }
                            </ul>
                          </div>
                        ) : null }
                        { sharedBlockingReasons.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-[#a3483f]">Tour-level issues:</p>
                            <ul className="list-none space-y-0.5">
                              { sharedBlockingReasons.map((reason) => (
                                <li key={ reason } className="flex items-center gap-1.5 text-xs text-[#a3483f]">
                                  <X className="size-3 shrink-0" />
                                  { reason }
                                </li>
                              )) }
                            </ul>
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
            label="Tour has a name"
            passed={ Boolean(formState.name.trim()) }
          />
          <ChecklistItem
            label="Duration is set"
            passed={ Boolean(formState.durationMinutes.trim()) }
          />
          <ChecklistItem
            label="Rating is set"
            passed={ Boolean(formState.rating.trim()) }
          />
          <ChecklistItem
            label="Review count is set"
            passed={ Boolean(formState.reviewCount.trim()) }
          />
          { formState.tourType !== "company" && formState.tourType !== "tip_based" ? (
            <ChecklistItem
              label="Price and currency are set"
              passed={ Boolean(formState.priceAmount.trim()) && Boolean(formState.priceCurrency.trim()) }
            />
          ) : null }
          { formState.tourType === "tip_based" ? (
            <ChecklistItem
              label="Tip-based tour has no fixed price"
              passed={ !formState.hasPrice || !formState.priceAmount.trim() }
            />
          ) : null }
          <ChecklistItem
            label={ formState.itineraryVariant === "stops"
              ? "Stop-based itinerary has at least one stop"
              : "Itinerary variant is configured" }
            passed={ formState.itineraryVariant === "description" || formState.stops.length > 0 }
          />
          <ChecklistItem
            label="At least one translation is ready"
            passed={ formState.translations.some((translation) => translation.isReady) }
          />
          <ChecklistItem
            label="At least one translation has a slug"
            passed={ formState.translations.some((t) => t.slug.trim()) }
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
