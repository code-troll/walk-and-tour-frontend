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
  onBack: () => void;
  isMutating: boolean;
  lastSaved: Date | null;
  activeSection: TourSection;
  isCreated: boolean;
  primaryAction: HeaderPrimaryAction | null;
  onSectionChange: (section: TourSection) => void;
};

export type TourSection = "general" | "itinerary" | "translations" | "publication";

const sections: { id: TourSection; label: string; icon: ElementType }[] = [
  {id: "general", label: "Basic Information", icon: Settings},
  {id: "itinerary", label: "Itinerary", icon: MapPin},
  {id: "translations", label: "Translations", icon: Languages},
  {id: "publication", label: "Publication", icon: Globe},
];

export function TourEditorHeader({
                                   mode,
                                   formState,
                                   onBack,
                                   isMutating,
                                   lastSaved,
                                   activeSection,
                                   isCreated,
                                   primaryAction,
                                   onSectionChange,
                                 }: HeaderProps) {
  const statusColors = {
    inactive: "bg-secondary text-secondary-foreground",
    active: "bg-primary/10 text-primary",
  } as const;
  const publicLocaleCount = formState.translations.filter((translation) => translation.isPublished).length;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border/50 px-6 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={ onBack }
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4"/>
            <span className="hidden sm:inline">Back to Tours</span>
          </button>
          <div className="hidden h-5 w-px bg-border sm:block"/>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-base font-semibold text-foreground sm:max-w-none">
                { formState.name || (mode === "create" ? "New Tour" : "Untitled Tour") }
              </h1>
              <span
                className={ cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
                  statusColors[publicLocaleCount > 0 ? "active" : "inactive"],
                ) }
              >
                { publicLocaleCount > 0 ? `${ publicLocaleCount } public locale${ publicLocaleCount === 1 ? "" : "s" }` : "No public locales" }
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              { mode === "create" && !isCreated
                ? "Save Basic Information to create the tour and unlock the remaining tabs."
                : `Slug: ${ formState.slug || "not-set" }` }
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          { lastSaved ? (
            <time
              dateTime={ lastSaved.toISOString() }
              suppressHydrationWarning
              className="hidden text-xs text-muted-foreground md:block"
            >
              Saved { lastSaved.toLocaleTimeString(undefined, {hourCycle: "h12"}) }
            </time>
          ) : null }

          { primaryAction ? (
            <Button
              onClick={ primaryAction.onClick }
              disabled={ isMutating || primaryAction.disabled }
              size="sm"
              className="gap-2"
            >
              { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Check className="size-4"/> }
              <span>{ primaryAction.label }</span>
            </Button>
          ) : null }
        </div>
      </div>

      <div className="flex h-12 items-end bg-muted/30 px-6">
        <nav className="flex gap-1">
          { sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const isLocked = !isCreated && section.id !== "general";

            return (
              <button
                key={ section.id }
                type="button"
                onClick={ () => onSectionChange(section.id) }
                disabled={ isLocked }
                className={ cn(
                  "relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground"
                    : isLocked
                      ? "cursor-not-allowed text-muted-foreground/60"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                ) }
              >
                <Icon className="size-4"/>
                <span>{ section.label }</span>
                { isLocked ? <Lock className="size-3.5"/> : null }
                { isActive ? <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"/> : null }
              </button>
            );
          }) }
        </nav>
      </div>
    </header>
  );
}
