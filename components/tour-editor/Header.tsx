"use client";

import type { ElementType } from "react";
import { ArrowLeft, Check, Globe, Languages, LoaderCircle, Lock, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourFormState } from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";

type HeaderPrimaryAction = {
  disabled: boolean;
  label: string;
  onClick: () => void;
};

type HeaderProps = {
  mode: "create" | "edit";
  formState: TourFormState;
  onBackAction: () => void;
  isMutating: boolean;
  lastSaved: Date | null;
  activeSection: TourSection;
  isCreated: boolean;
  primaryAction: HeaderPrimaryAction | null;
  onSectionChangeAction: (section: TourSection) => void;
};

export type TourSection = "general" | "itinerary" | "translations" | "publication";

const sections: { id: TourSection; label: string; icon: ElementType }[] = [
  {id: "general", label: "Basic Information", icon: Settings},
  {id: "itinerary", label: "Itinerary", icon: MapPin},
  {id: "translations", label: "Translations", icon: Languages},
  {id: "publication", label: "Publication", icon: Globe},
];

const headerSurfaceClassName =
  "sticky top-0 z-10 overflow-hidden rounded-[1.75rem] border border-[var(--wt-rule-strong)] bg-white/95 shadow-[0_20px_50px_rgba(42,36,25,0.05)] backdrop-blur";

export function TourEditorHeader({
                                   mode,
                                   formState,
                                   onBackAction,
                                   isMutating,
                                   lastSaved,
                                   activeSection,
                                   isCreated,
                                 primaryAction,
                                 onSectionChangeAction,
                               }: HeaderProps) {
  const statusColors = {
    inactive: "border border-[var(--wt-rule-strong)] bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]",
    active: "border border-[var(--wt-rule-strong)] bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]",
  } as const;
  const publicLocaleCount = formState.translations.filter((translation) => translation.isPublished).length;

  return (
    <header className={ headerSurfaceClassName }>
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--wt-rule-strong)] px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={ onBackAction }
            className="flex items-center gap-2 text-sm font-medium text-[var(--wt-ink-muted)] transition-colors hover:text-[var(--wt-ink)]"
          >
            <ArrowLeft className="size-4"/>
            <span className="hidden sm:inline">Back to Tours</span>
          </button>
          <div className="hidden h-5 w-px bg-[var(--wt-rule-strong)] sm:block"/>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-serif text-xl text-[var(--wt-ink)] sm:max-w-none">
                { formState.name || (mode === "create" ? "New Tour" : "Untitled Tour") }
              </h1>
              <span
                className={ cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] whitespace-nowrap",
                  statusColors[publicLocaleCount > 0 ? "active" : "inactive"],
                ) }
              >
                { publicLocaleCount > 0 ? `${ publicLocaleCount } public locale${ publicLocaleCount === 1 ? "" : "s" }` : "No public locales" }
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              { mode === "create" && !isCreated
                ? "Save Basic Information to create the tour and unlock the remaining tabs."
                : `Slug: ${ formState.translations[0]?.slug || "not-set" }` }
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          { lastSaved ? (
            <time
              dateTime={ lastSaved.toISOString() }
              suppressHydrationWarning
              className="hidden rounded-full border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] px-3 py-1 text-xs font-medium text-[var(--wt-ink-muted)] md:block"
            >
              Saved { lastSaved.toLocaleTimeString(undefined, {hourCycle: "h12"}) }
            </time>
          ) : null }

          { primaryAction ? (
            <Button
              onClick={ primaryAction.onClick }
              disabled={ isMutating || primaryAction.disabled }
              size="sm"
              className="gap-2 border border-[var(--wt-ink)] bg-[var(--wt-ink)] px-4 text-white hover:bg-[var(--wt-ink)]"
            >
              { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Check className="size-4"/> }
              <span className="hidden md:visible">{ primaryAction.label }</span>
            </Button>
          ) : null }
        </div>
      </div>

      <div className="flex items-end bg-[var(--wt-surface)] px-4 pt-3">
        <nav className="flex flex-wrap gap-2">
          { sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isLocked = !isCreated && section.id !== "general";

            return (
              <button
                key={ section.id }
                type="button"
                onClick={ () => onSectionChangeAction(section.id) }
                disabled={ isLocked }
                className={ cn(
                  "relative flex items-center gap-2 rounded-t-2xl border border-transparent px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[var(--wt-rule-strong)] border-b-white bg-white text-[var(--wt-ink)] shadow-[0_-6px_18px_rgba(42,36,25,0.04)]"
                    : isLocked
                      ? "cursor-not-allowed text-[var(--wt-ink-muted)]"
                      : "text-[var(--wt-ink-muted)] hover:border-[var(--wt-rule-strong)] hover:bg-white/70 hover:text-[var(--wt-ink)]",
                ) }
              >
                <Icon className="size-4"/>
                <span>{ section.label }</span>
                { isLocked ? <Lock className="size-3.5"/> : null }
                { isActive ? <span className="absolute right-4 bottom-0 left-4 h-0.5 rounded-full bg-[var(--wt-ink-muted)]"/> : null }
              </button>
            );
          }) }
        </nav>
      </div>
    </header>
  );
}
