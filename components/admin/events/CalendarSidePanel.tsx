"use client";

import {Sheet, SheetContent} from "@/components/ui/sheet";
import {CreateEventPanel} from "@/components/admin/events/CreateEventPanel";
import {DayNotePanel} from "@/components/admin/events/DayNotePanel";
import {OccurrenceConfirmPanel} from "@/components/admin/events/OccurrenceConfirmPanel";
import type {ApiCalendarItem} from "@/lib/events/admin-event-types";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

/** The one thing the calendar shows on the right — never more than one at a time. */
export type CalendarPanelState =
  | {mode: "confirm"; item: ApiCalendarItem}
  | {mode: "day-note"; date: string; note: string}
  | {mode: "create-event"; startWall: string}
  | null;

type CalendarSidePanelProps = {
  panel: CalendarPanelState;
  displayTimezone: string;
  languages: ApiLanguage[];
  tours: ApiTour[];
  onClose: () => void;
  onChanged: () => void;
};

/**
 * Single right-side Sheet reused for confirming occurrences, editing day notes, and creating events.
 * Bodies are keyed by their target so their local state re-seeds each time the panel opens.
 */
export function CalendarSidePanel({
  panel,
  displayTimezone,
  languages,
  tours,
  onClose,
  onChanged,
}: CalendarSidePanelProps) {
  // Confirm + create both host the full event editor, so they get the wide panel.
  const isWide = panel?.mode === "create-event" || panel?.mode === "confirm";

  return (
    <Sheet open={panel !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent
        className={`flex w-full flex-col gap-0 overflow-hidden p-0 ${
          isWide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        {panel?.mode === "confirm" ? (
          <OccurrenceConfirmPanel
            key={panel.item.occurrenceId ?? `${panel.item.eventId}:${panel.item.date}`}
            item={panel.item}
            displayTimezone={displayTimezone}
            languages={languages}
            tours={tours}
            onClose={onClose}
            onChanged={onChanged}
          />
        ) : null}

        {panel?.mode === "day-note" ? (
          <DayNotePanel
            key={panel.date}
            date={panel.date}
            initialNote={panel.note}
            onClose={onClose}
            onChanged={onChanged}
          />
        ) : null}

        {panel?.mode === "create-event" ? (
          <CreateEventPanel
            key={panel.startWall}
            startWall={panel.startWall}
            displayTimezone={displayTimezone}
            languages={languages}
            tours={tours}
            onClose={onClose}
            onChanged={onChanged}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
