"use client";

import type { ElementType } from "react";
import { Check, Globe, Languages, LoaderCircle, Lock, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminBackRow, AdminHeaderMeta, AdminSectionCard } from "@/components/admin/AdminUi";
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
    <>
      {/*
        The same construction every other detail screen uses: the shared back
        row, then an AdminSectionCard for the title and its actions. It used to
        be a sticky, blurred, serif-titled bar of its own invention, which is
        why the tour editor never looked like the rest of the backoffice.
      */}
      <AdminBackRow label="Tours" onClick={ onBackAction }>
        { lastSaved ? (
          <AdminHeaderMeta>
            <time dateTime={ lastSaved.toISOString() } suppressHydrationWarning>
              Saved { lastSaved.toLocaleTimeString(undefined, {hourCycle: "h12"}) }
            </time>
          </AdminHeaderMeta>
        ) : null }
      </AdminBackRow>

      <AdminSectionCard
        title={ formState.name || (mode === "create" ? "New Tour" : "Untitled Tour") }
        description={
          mode === "create" && !isCreated
            ? "Save Basic Information to create the tour and unlock the remaining tabs."
            : `Slug: ${ formState.translations[0]?.slug || "not-set" }`
        }
        actions={
          <>
            <span
              className={ cn(
                "rounded-[var(--wt-radius-sm)] px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                statusColors[publicLocaleCount > 0 ? "active" : "inactive"],
              ) }
            >
              { publicLocaleCount > 0 ? `${ publicLocaleCount } public locale${ publicLocaleCount === 1 ? "" : "s" }` : "No public locales" }
            </span>
            { primaryAction ? (
              <Button
                onClick={ primaryAction.onClick }
                disabled={ isMutating || primaryAction.disabled }
                size="sm"
                className="gap-2 bg-[var(--wt-ink)] px-4 text-white transition hover:opacity-90"
              >
                { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Check className="size-4"/> }
                { primaryAction.label }
              </Button>
            ) : null }
          </>
        }
      >
        {/*
          Tabs drawn the way the backoffice draws every other set of choices:
          text with a rule under the active one, the device the navigation and
          every filter row already use.
        */}
        <nav className="flex flex-wrap items-center gap-5">
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
                  "flex items-center gap-2 border-b-2 pb-1 text-sm transition",
                  isActive
                    ? "border-[var(--wt-nav-marker)] font-medium text-[var(--wt-ink)]"
                    : isLocked
                      ? "cursor-not-allowed border-transparent text-[var(--wt-ink-muted)] opacity-60"
                      : "border-transparent text-[var(--wt-ink-muted)] hover:text-[var(--wt-ink)]",
                ) }
              >
                <Icon className="size-4"/>
                <span>{ section.label }</span>
                { isLocked ? <Lock className="size-3.5"/> : null }
              </button>
            );
          }) }
        </nav>
      </AdminSectionCard>
    </>
  );
}
