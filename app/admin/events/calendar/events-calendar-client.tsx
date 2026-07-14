"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import dynamic from "next/dynamic";
import type {DatesSetArg, EventClickArg, EventContentArg, EventInput} from "@fullcalendar/core";
import type {DateClickArg} from "@fullcalendar/interaction";
import {ArrowLeft, LoaderCircle, StickyNote, Users} from "lucide-react";
import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminSectionCard} from "@/components/admin/AdminUi";
import {LanguageFlag} from "@/components/admin/LanguageFlag";
import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {DayNoteDialog} from "@/components/admin/events/DayNoteDialog";
import {OccurrenceConfirmDrawer} from "@/components/admin/events/OccurrenceConfirmDrawer";
import {
  getAdminDayNotesClient,
  getAdminEventsCalendarClient,
} from "@/lib/admin/admin-event-client";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {
  DEFAULT_EVENT_TIMEZONE,
  addMinutesToUtcIso,
  timezoneOptionsWith,
} from "@/lib/admin/timezone";
import {
  eventTitle,
  type ApiCalendarItem,
  type ApiDayNote,
  type CalendarItemStatus,
} from "@/lib/events/admin-event-types";

const CalendarSurface = dynamic(() => import("@/components/admin/events/CalendarSurface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] items-center justify-center text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
    </div>
  ),
});

const STATUS_STYLE: Record<
  CalendarItemStatus,
  {backgroundColor: string; borderColor: string; textColor: string}
> = {
  unconfirmed: {backgroundColor: "#f5efe5", borderColor: "#cbb390", textColor: "#7a5424"},
  confirmed: {backgroundColor: "#eaf4ec", borderColor: "#2f6b3f", textColor: "#2f6b3f"},
  cancelled: {backgroundColor: "#fbf1ef", borderColor: "#a3483f", textColor: "#a3483f"},
};

const itemKey = (item: ApiCalendarItem): string =>
  item.occurrenceId ?? `${item.eventId}:${item.date}`;

// Hover behaviour (applied via arbitrary variants on the wrapper):
//  - every hovered event is highlighted (brightened + lifted shadow + ring);
//  - a hovered timeGrid event GROWS its own box to fit its content and rises above
//    its neighbours. FullCalendar pins the harness with both `top` and `bottom`
//    insets, so we release `bottom` and let `height` size to content — otherwise
//    the box stays fixed and the content spills out. The box keeps `overflow:hidden`
//    at all times so content never escapes; it simply reveals once the box expands.
export default function EventsCalendarClient() {
  const [displayTimezone, setDisplayTimezone] = useState(DEFAULT_EVENT_TIMEZONE);
  const [items, setItems] = useState<ApiCalendarItem[]>([]);
  const [dayNotes, setDayNotes] = useState<ApiDayNote[]>([]);
  const [memberNameById, setMemberNameById] = useState<Map<string, string>>(new Map());
  const [range, setRange] = useState<{fromIso: string; toIso: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ApiCalendarItem | null>(null);
  const [dayNoteTarget, setDayNoteTarget] = useState<{date: string; note: string} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useAdminRouteLoadingBoundary(isLoading);

  const requestIdRef = useRef(0);

  // Team member names for the guide labels on event blocks (loaded once).
  useEffect(() => {
    void (async () => {
      try {
        const members = await getAdminTeamMembersClient();
        setMemberNameById(new Map(members.map((member) => [member.id, member.name])));
      } catch {
        // Names are a nicety; the calendar still works without them.
      }
    })();
  }, []);

  useEffect(() => {
    if (!range) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        const [nextItems, nextNotes] = await Promise.all([
          getAdminEventsCalendarClient(range.fromIso, range.toIso),
          getAdminDayNotesClient(range.fromIso, range.toIso),
        ]);
        if (requestId === requestIdRef.current) {
          setItems(nextItems);
          setDayNotes(nextNotes);
        }
      } catch (loadError) {
        if (requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the calendar.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    })();
  }, [range, refreshKey]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({fromIso: arg.start.toISOString(), toIso: arg.end.toISOString()});
  }, []);

  const events: EventInput[] = useMemo(() => {
    const noteEvents: EventInput[] = dayNotes.map((note) => ({
      id: `daynote:${note.date}`,
      start: note.date,
      allDay: true,
      display: "block",
      backgroundColor: "#fdf6e3",
      borderColor: "#e0c789",
      textColor: "#7a5424",
      extendedProps: {dayNote: note},
    }));

    const occurrenceEvents: EventInput[] = items.map((item) => {
      const style = STATUS_STYLE[item.status];
      return {
        id: itemKey(item),
        title: eventTitle(item.event),
        start: item.date,
        end: addMinutesToUtcIso(item.date, item.event.durationMinutes),
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        textColor: style.textColor,
        extendedProps: {calendarItem: item},
        classNames: item.status === "cancelled" ? ["line-through"] : [],
      };
    });

    return [...noteEvents, ...occurrenceEvents];
  }, [items, dayNotes]);

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const dayNote = arg.event.extendedProps.dayNote as ApiDayNote | undefined;
      if (dayNote) {
        return (
          <div className="flex items-center gap-1 overflow-hidden px-1 text-xs font-medium">
            <StickyNote className="size-3 shrink-0" />
            <span className="truncate">{dayNote.note}</span>
          </div>
        );
      }

      const item = arg.event.extendedProps.calendarItem as ApiCalendarItem | undefined;
      if (!item) {
        return undefined;
      }

      const title = eventTitle(item.event);
      const isTimeGrid = arg.view.type.startsWith("timeGrid");

      if (!isTimeGrid) {
        return (
          <div className="flex items-center gap-1 overflow-hidden px-0.5">
            <LanguageFlag language={item.event.language} className="h-2.5 w-3.5 shrink-0 rounded-[1px]" />
            <span className="truncate text-xs">{title}</span>
          </div>
        );
      }

      const guides = (item.teamMemberIds ?? []).map((id) => memberNameById.get(id) ?? "…");
      const tzLabel = item.event.timezone !== displayTimezone ? item.event.timezone : null;

      // No inner overflow clipping — the event box (clipped by default, visible on
      // hover) controls what shows, so hovering reveals the full name and guides.
      return (
        <div className="flex h-full flex-col gap-0.5 p-1 text-[0.7rem] leading-tight">
          <div className="flex items-center gap-1">
            <LanguageFlag language={item.event.language} className="h-2.5 w-3.5 shrink-0 rounded-[1px]" />
            <span className="font-semibold">{title}</span>
          </div>
          {arg.timeText ? (
            <span className="opacity-80">
              {arg.timeText}
              {tzLabel ? ` · ${tzLabel}` : ""}
            </span>
          ) : null}
          {guides.length ? (
            <span className="flex items-start gap-1 opacity-90">
              <Users className="mt-px size-2.5 shrink-0" />
              <span>{guides.join(", ")}</span>
            </span>
          ) : null}
        </div>
      );
    },
    [memberNameById, displayTimezone],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const dayNote = arg.event.extendedProps.dayNote as ApiDayNote | undefined;
    if (dayNote) {
      setDayNoteTarget({date: dayNote.date, note: dayNote.note});
      return;
    }
    const calendarItem = arg.event.extendedProps.calendarItem as ApiCalendarItem | undefined;
    if (calendarItem) {
      setSelectedItem(calendarItem);
    }
  }, []);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      const date = arg.dateStr.slice(0, 10);
      const existing = dayNotes.find((note) => note.date === date);
      setDayNoteTarget({date, note: existing?.note ?? ""});
    },
    [dayNotes],
  );

  const timezoneOptions = timezoneOptionsWith(displayTimezone);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <AdminProgressLink href="/events">
            <ArrowLeft className="size-4" />
            Back to events
          </AdminProgressLink>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Timezone</span>
          <Select value={displayTimezone} onValueChange={setDisplayTimezone}>
            <SelectTrigger className="h-10 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
          {error}
        </p>
      ) : null}

      <AdminSectionCard
        title="Calendar"
        description="Click an unconfirmed candidate to confirm it and assign guides. Click an empty day to add a note. Times are shown in the selected timezone."
      >
        <div className="flex flex-wrap gap-4 pb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-[#cbb390] bg-[#f5efe5]" /> Unconfirmed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-[#2f6b3f] bg-[#eaf4ec]" /> Confirmed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-[#a3483f] bg-[#fbf1ef]" /> Cancelled
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-[#e0c789] bg-[#fdf6e3]" /> Day note
          </span>
        </div>

        <div className="admin-calendar">
          <CalendarSurface
            events={events}
            timeZone={displayTimezone}
            onDatesSet={handleDatesSet}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            eventContent={renderEventContent}
          />
        </div>
      </AdminSectionCard>

      <OccurrenceConfirmDrawer
        item={selectedItem}
        displayTimezone={displayTimezone}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        onChanged={() => setRefreshKey((key) => key + 1)}
      />

      <DayNoteDialog
        key={dayNoteTarget?.date ?? "closed"}
        date={dayNoteTarget?.date ?? null}
        initialNote={dayNoteTarget?.note ?? ""}
        onOpenChange={(open) => {
          if (!open) setDayNoteTarget(null);
        }}
        onChanged={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
