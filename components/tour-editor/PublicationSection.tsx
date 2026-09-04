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

  if (formState.tourType !== "company" && formState.tourType !== "tip_based") {
    if (!formState.hasPrice || !formState.priceAmount.trim()) {
      reasons.push("Price is required for this tour type");
    } else {
      const priceAmount = Number.parseFloat(formState.priceAmount);
      if (!Number.isFinite(priceAmount) || priceAmount < 0) {
        reasons.push("Price amount is invalid");
      }
    }
    if (!formState.priceCurrency.trim()) {
      reasons.push("Currency is not set");
    }
  }

  if (formState.tourType === "tip_based" && formState.hasPrice && formState.priceAmount.trim()) {
    reasons.push("Tip-based tours must not have a fixed price");
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
      <section className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--wt-ink)]">Translation Publication</h2>
            <p className="mt-1 text-sm text-[var(--wt-ink-muted)]">
              Control which translations are publicly available and review backend diagnostics.
            </p>
            { isMutating ? (
              <p className="mt-2 text-xs text-[var(--wt-ink-muted)]">
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
              className="border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] text-[var(--wt-ink-muted)] hover:bg-[var(--wt-surface-sunk)]"
            >
              Unpublish All
            </Button>
            <Button
              size="sm"
              onClick={ onPublishAllReadyAction }
              disabled={ isMutating || readyUnpublished.length === 0 || sharedBlockingReasons.length > 0 }
              className="gap-2 border border-[var(--wt-ink)] bg-[var(--wt-ink)] text-white hover:bg-[var(--wt-ink)]"
            >
              <Send className="size-4"/>
              Publish Ready
            </Button>
          </div>
        </div>

        { formState.translations.length === 0 ? (
          <div className="rounded-[var(--wt-radius-sm)] border-2 border-dashed border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] py-8 text-center">
            <Globe className="mx-auto mb-3 size-10 text-[var(--wt-ink-muted)]"/>
            <p className="text-[var(--wt-ink-muted)]">
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
                    "rounded-[var(--wt-radius-sm)] border p-4 transition-colors",
                    isPublished
                      ? "border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)]"
                      : "border-[var(--wt-rule-strong)] bg-[var(--wt-surface)]",
                  ) }
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-12 items-center justify-center rounded-[var(--wt-radius-sm)] bg-[var(--wt-surface-sunk)]">
                        <span className="text-sm font-bold uppercase text-[var(--wt-ink-muted)]">
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
                              isReady ? "bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]" : "bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]",
                            ) }
                          >
                            { isReady ? "Ready" : "Not ready" }
                          </span>
                          { diagnostic && !diagnostic.isSchemaValid ? (
                            <span
                              className="rounded-full bg-[var(--wt-surface-sunk)] px-2 py-0.5 text-xs font-medium text-[var(--wt-danger)]">
                              Schema issues
                            </span>
                          ) : null }
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <div
                            className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-[var(--wt-rule-strong)]">
                            <div
                              className="h-full rounded-full bg-[var(--wt-ink-muted)] transition-all"
                              style={ {width: `${ completion.percentage }%`} }
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            { completion.percentage }% complete
                          </span>
                        </div>

                        { completion.checks.some((c) => !c.passed) ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-[var(--wt-danger)]">Missing for readiness:</p>
                            <ul className="list-none space-y-0.5">
                              { completion.checks
                                .filter((c) => !c.passed)
                                .map((c) => (
                                  <li key={ c.label } className="flex items-center gap-1.5 text-xs text-[var(--wt-danger)]">
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
                            <p className="text-xs font-medium text-[var(--wt-danger)]">Tour-level issues:</p>
                            <ul className="list-none space-y-0.5">
                              { sharedBlockingReasons.map((reason) => (
                                <li key={ reason } className="flex items-center gap-1.5 text-xs text-[var(--wt-danger)]">
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
                          className="flex items-center gap-1.5 text-sm font-medium text-[var(--wt-status-confirmed)]">
                          <CheckCircle2 className="size-4"/>
                          Published
                        </span>
                      ) : !isReady ? (
                        <span
                          className="flex items-center gap-1.5 text-sm text-[var(--wt-ink-muted)]">
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
                        disabled={ isMutating || (!isReady && !isPublished) || (!isPublished && sharedBlockingReasons.length > 0) }
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

      <section className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--wt-ink)]">Publication Checklist</h2>
        <p className="mb-6 text-sm text-[var(--wt-ink-muted)]">
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
        "flex items-center gap-3 rounded-[var(--wt-radius-sm)] p-3",
        passed ? "bg-[var(--wt-status-confirmed-bg)]" : "bg-[var(--wt-surface)]",
      ) }
    >
      <div
        className={ cn(
          "flex size-6 items-center justify-center rounded-full",
          passed ? "bg-[var(--wt-status-confirmed)] text-white" : "bg-[var(--wt-rule-strong)]",
        ) }
      >
        { passed ? (
          <Check className="size-3.5"/>
        ) : (
          <X className="size-3.5 text-[var(--wt-ink-muted)]"/>
        ) }
      </div>
      <span className={ cn("text-sm", passed ? "text-[var(--wt-ink)]" : "text-[var(--wt-ink-muted)]") }>
        { label }
      </span>
    </div>
  );
}
