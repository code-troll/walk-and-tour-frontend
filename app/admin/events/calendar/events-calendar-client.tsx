"use client";

import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import dynamic from "next/dynamic";
import type {DatesSetArg, EventClickArg, EventContentArg, EventInput} from "@fullcalendar/core";
import type {DateClickArg} from "@fullcalendar/interaction";
import {ArrowLeft, LoaderCircle, Maximize2, Minimize2, StickyNote, Table, Users} from "lucide-react";
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
import {CalendarFilters, type FilterGroup} from "@/components/admin/events/CalendarFilters";
import {CalendarSidePanel, type CalendarPanelState} from "@/components/admin/events/CalendarSidePanel";
import {
  getAdminDayNotesClient,
  getAdminEventsCalendarClient,
} from "@/lib/admin/admin-event-client";
import {getAdminLanguagesClient, getAdminToursClient} from "@/lib/admin/admin-client";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {
  DEFAULT_EVENT_TIMEZONE,
  addMinutesToUtcIso,
  timezoneOptionsWith,
  utcIsoToWallTime,
} from "@/lib/admin/timezone";
import {
  eventTitle,
  type ApiCalendarItem,
  type ApiDayNote,
  type CalendarItemStatus,
} from "@/lib/events/admin-event-types";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

const CalendarSurface = dynamic(() => import("@/components/admin/events/CalendarSurface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[75vh] items-center justify-center text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
    </div>
  ),
});

/**
 * Occurrence states, drawn with the design system's status tokens.
 *
 * These are inline styles because FullCalendar takes colours as values, not
 * classes, so they reference the CSS variables directly — which resolves the
 * same way and keeps the calendar inside the palette.
 *
 * An unconfirmed occurrence is the calendar's "pending": something Walk and
 * Tour has not decided yet. It takes the same sky blue a pending booking does,
 * so one status vocabulary covers both.
 */
const STATUS_STYLE: Record<
  CalendarItemStatus,
  {backgroundColor: string; borderColor: string; textColor: string}
> = {
  unconfirmed: {
    backgroundColor: "var(--wt-status-pending-bg)",
    borderColor: "var(--wt-status-pending)",
    textColor: "var(--wt-ink)",
  },
  confirmed: {
    backgroundColor: "var(--wt-status-confirmed-bg)",
    borderColor: "var(--wt-status-confirmed)",
    textColor: "var(--wt-status-confirmed)",
  },
  cancelled: {
    backgroundColor: "var(--wt-surface-sunk)",
    borderColor: "var(--wt-status-cancelled)",
    textColor: "var(--wt-status-cancelled)",
  },
};

const itemKey = (item: ApiCalendarItem): string =>
  item.occurrenceId ?? `${item.eventId}:${item.date}`;

/** Sentinel used as the filter key for items without a linked tour. */
const NO_TOUR_KEY = "__none__";

type FilterFacet = "language" | "type" | "tour" | "frequency";
type FilterState = Record<FilterFacet, Set<string>>;

const emptyFilters = (): FilterState => ({
  language: new Set(),
  type: new Set(),
  tour: new Set(),
  frequency: new Set(),
});

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
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [tours, setTours] = useState<ApiTour[]>([]);
  const [range, setRange] = useState<{fromIso: string; toIso: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<CalendarPanelState>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useAdminRouteLoadingBoundary(isLoading);

  const requestIdRef = useRef(0);
  const calendarRegionRef = useRef<HTMLDivElement>(null);
  const [fullscreenHeight, setFullscreenHeight] = useState(0);

  // One-time reference data: team-member names for the guide labels, plus languages
  // and tours for the in-panel create form.
  useEffect(() => {
    void (async () => {
      try {
        const [members, nextLanguages, nextTours] = await Promise.all([
          getAdminTeamMembersClient(),
          getAdminLanguagesClient(),
          getAdminToursClient(),
        ]);
        setMemberNameById(new Map(members.map((member) => [member.id, member.name])));
        setLanguages(nextLanguages);
        setTours(nextTours);
      } catch {
        // Reference data is a nicety; the calendar still works without it.
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

  // While fullscreen, lock the page behind so only the calendar's time grid scrolls.
  useEffect(() => {
    if (!isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  // Exit fullscreen on Escape — but let an open Radix layer (side panel, filter popover)
  // consume its own Escape first, so the key only exits fullscreen when nothing is open.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector('[data-slot="sheet-content"],[data-slot="popover-content"]')) return;
      setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  // Give FullCalendar an exact pixel height while fullscreen so its own time-grid
  // scroller is the only thing that scrolls, and it fills the viewport below the header.
  useLayoutEffect(() => {
    if (!isFullscreen) {
      setFullscreenHeight(0);
      return;
    }
    const el = calendarRegionRef.current;
    if (!el) return;
    const measure = () => setFullscreenHeight(el.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Grow-only hover: measure the slot height and the event's content height, and only
  // ever enlarge the block to the larger of the two. A block never shrinks — the earlier
  // `height:auto` approach collapsed long (tall) events down to their short content.
  const handleCalendarPointerOver = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const harness = target.closest<HTMLElement>(".fc-timegrid-event-harness");
    if (!harness || harness.dataset.expanded === "1") return;
    const eventEl = harness.querySelector<HTMLElement>(".fc-timegrid-event");
    if (!eventEl) return;
    // Save FullCalendar's own inline positioning so it can be restored verbatim on leave.
    // (FC only re-applies top/bottom/left/right on a relayout, so blanking them collapses
    // the block to ~0 — hence we snapshot and put them back exactly.)
    harness.dataset.fcStyle = harness.getAttribute("style") ?? "";
    harness.dataset.expanded = "1";
    const slotHeight = harness.offsetHeight;
    // Widen to the full column and unclamp the title FIRST, then measure — so the height
    // reflects the fully-revealed content at its final width.
    harness.classList.add("evt-expanded");
    harness.style.left = "0";
    harness.style.right = "0";
    // FullCalendar stacks overlapping events with an inline `z-index` (stackDepth + 1),
    // which beats any class rule — so raise it inline to lift the hovered block in front.
    harness.style.zIndex = "1000";
    // scrollHeight is max(content, client) — taller than the slot only when content overflows.
    const contentHeight = eventEl.scrollHeight;
    if (contentHeight > slotHeight) {
      harness.style.height = `${contentHeight}px`;
      harness.style.bottom = "auto";
    }
  }, []);

  const handleCalendarPointerOut = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const harness = target.closest<HTMLElement>(".fc-timegrid-event-harness");
    if (!harness || harness.dataset.expanded !== "1") return;
    const next = event.relatedTarget;
    if (next instanceof Node && harness.contains(next)) return; // moved within the same block
    harness.classList.remove("evt-expanded");
    // Restore FullCalendar's exact inline positioning (never blank it — that collapses the block).
    harness.setAttribute("style", harness.dataset.fcStyle ?? "");
    delete harness.dataset.fcStyle;
    delete harness.dataset.expanded;
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({fromIso: arg.start.toISOString(), toIso: arg.end.toISOString()});
  }, []);

  // Options are derived from ALL loaded items so unchecking one never removes it from the list.
  const filterGroups: FilterGroup[] = useMemo(() => {
    const languageCodes = new Set<string>();
    const types = new Set<string>();
    const frequencies = new Set<string>();
    const tourById = new Map<string, string>();
    for (const item of items) {
      languageCodes.add(item.event.language);
      types.add(item.event.type);
      frequencies.add(item.event.frequency);
      const tourKey = item.event.tourId ?? NO_TOUR_KEY;
      tourById.set(tourKey, item.event.tourName ?? "No linked tour");
    }
    return [
      {
        key: "language",
        label: "Language",
        options: [...languageCodes].sort().map((code) => ({
          value: code,
          label: (
            <>
              <LanguageFlag language={code} className="h-2.5 w-3.5 rounded-[1px]" />
              {code.toUpperCase()}
            </>
          ),
        })),
      },
      {
        key: "type",
        label: "Type",
        options: [...types].sort().map((type) => ({
          value: type,
          label: <span className="capitalize">{type}</span>,
        })),
      },
      {
        key: "frequency",
        label: "Frequency",
        options: [...frequencies].sort().map((frequency) => ({
          value: frequency,
          label: <span className="capitalize">{frequency === "single" ? "Single occurrence" : "Recurring"}</span>,
        })),
      },
      {
        key: "tour",
        label: "Linked tour",
        options: [...tourById.entries()]
          .sort((left, right) => left[1].localeCompare(right[1]))
          .map(([value, name]) => ({value, label: name})),
      },
    ];
  }, [items]);

  const events: EventInput[] = useMemo(() => {
    const noteEvents: EventInput[] = dayNotes.map((note) => ({
      id: `daynote:${note.date}`,
      start: note.date,
      allDay: true,
      display: "block",
      backgroundColor: "var(--wt-surface-sunk)",
      borderColor: "var(--wt-rule-strong)",
      textColor: "var(--wt-ink-muted)",
      extendedProps: {dayNote: note},
    }));

    const visibleItems = items.filter((item) => {
      if (filters.language.has(item.event.language)) return false;
      if (filters.type.has(item.event.type)) return false;
      if (filters.frequency.has(item.event.frequency)) return false;
      if (filters.tour.has(item.event.tourId ?? NO_TOUR_KEY)) return false;
      return true;
    });

    const occurrenceEvents: EventInput[] = visibleItems.map((item) => {
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
  }, [items, dayNotes, filters]);

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
          <div className="flex items-center gap-1 overflow-hidden px-0.5" title={title}>
            <LanguageFlag language={item.event.language} className="h-2.5 w-3.5 shrink-0 rounded-[1px]" />
            <span className="truncate text-xs">{title}</span>
          </div>
        );
      }

      const guides = (item.teamMemberIds ?? []).map((id) => memberNameById.get(id) ?? "…");
      const tzLabel = item.event.timezone !== displayTimezone ? item.event.timezone : null;

      // Titles are clamped so long descriptions don't crowd the grid; the full title
      // (and guides) reveal when the block expands on hover. `title` gives a tooltip.
      // No `h-full`: the content keeps its intrinsic height so the hover handler can
      // measure how tall the block must grow.
      return (
        <div className="flex flex-col gap-0.5 p-1 text-[0.7rem] leading-tight" title={title}>
          <div className="flex items-start gap-1">
            <LanguageFlag language={item.event.language} className="mt-0.5 h-2.5 w-3.5 shrink-0 rounded-[1px]" />
            <span className="evt-title line-clamp-2 font-semibold">{title}</span>
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
      setPanel({mode: "day-note", date: dayNote.date, note: dayNote.note});
      return;
    }
    const calendarItem = arg.event.extendedProps.calendarItem as ApiCalendarItem | undefined;
    if (calendarItem) {
      setPanel({mode: "confirm", item: calendarItem});
    }
  }, []);

  // Slot → create, header/all-day → note (agreed calendar behaviour).
  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (!arg.allDay) {
        setPanel({mode: "create-event", startWall: utcIsoToWallTime(arg.date.toISOString(), displayTimezone)});
        return;
      }
      const date = arg.dateStr.slice(0, 10);
      const existing = dayNotes.find((note) => note.date === date);
      setPanel({mode: "day-note", date, note: existing?.note ?? ""});
    },
    [dayNotes, displayTimezone],
  );

  const toggleFilter = useCallback((groupKey: string, value: string) => {
    setFilters((current) => {
      const facet = groupKey as FilterFacet;
      const next = new Set(current[facet]);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return {...current, [facet]: next};
    });
  }, []);

  const toggleFilterAll = useCallback((groupKey: string, values: string[], checked: boolean) => {
    setFilters((current) => ({
      ...current,
      [groupKey as FilterFacet]: checked ? new Set<string>() : new Set(values),
    }));
  }, []);

  const timezoneOptions = timezoneOptionsWith(displayTimezone);

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarFilters
        groups={filterGroups}
        excluded={filters}
        onToggle={toggleFilter}
        onToggleAll={toggleFilterAll}
      />
      <span className="text-sm text-muted-foreground">Timezone</span>
      <Select value={displayTimezone} onValueChange={setDisplayTimezone}>
        <SelectTrigger className="h-10! w-56">
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
      <Button
        variant="outline"
        size="sm"
        className="h-10 gap-2"
        onClick={() => setIsFullscreen((value) => !value)}
      >
        {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </Button>
    </div>
  );

  const legend = (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border border-[var(--wt-rule-strong)] bg-[var(--wt-status-pending-bg)]" /> Unconfirmed
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)]" /> Confirmed
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border border-[var(--wt-status-cancelled)] bg-[var(--wt-surface-sunk)]" /> Cancelled
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block size-3 rounded-sm border border-[var(--wt-status-pending)] bg-[var(--wt-status-pending-bg)]" /> Day note
      </span>
    </div>
  );

  const errorBanner = error ? (
    <p className="rounded-xl border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
      {error}
    </p>
  ) : null;

  const sidePanel = (
    <CalendarSidePanel
      panel={panel}
      displayTimezone={displayTimezone}
      languages={languages}
      tours={tours}
      onClose={() => setPanel(null)}
      onChanged={() => setRefreshKey((key) => key + 1)}
    />
  );

  // Fullscreen: the calendar fills the whole viewport; the section chrome (title, legend,
  // controls) sits in a fixed header and only the calendar's time grid scrolls. Portalled
  // to <body> so `position: fixed` escapes the admin layout's `backdrop-blur` container
  // (a backdrop-filter ancestor becomes the containing block for fixed descendants).
  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--wt-rule-strong)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-[var(--wt-ink)]">Calendar</h2>
            {controls}
          </div>
          {legend}
          {errorBanner}
        </div>
        <div
          ref={calendarRegionRef}
          className="admin-calendar min-h-0 flex-1"
          onMouseOver={handleCalendarPointerOver}
          onMouseOut={handleCalendarPointerOut}
        >
          <CalendarSurface
            events={events}
            timeZone={displayTimezone}
            height={fullscreenHeight || undefined}
            onDatesSet={handleDatesSet}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            eventContent={renderEventContent}
          />
        </div>
        {sidePanel}
      </div>,
      document.body,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <AdminProgressLink href="/events">
              <ArrowLeft className="size-4" />
              Back to events
            </AdminProgressLink>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 gap-2">
            <AdminProgressLink href="/events/schedule">
              <Table className="size-4" />
              Schedule
            </AdminProgressLink>
          </Button>
        </div>
        {controls}
      </div>

      {errorBanner}

      <AdminSectionCard
        title="Calendar"
        description="Click an empty time slot to create an event, an unconfirmed candidate to confirm it, or a day header to add a note. Times are shown in the selected timezone."
      >
        <div className="pb-4">{legend}</div>
        <div
          className="admin-calendar"
          onMouseOver={handleCalendarPointerOver}
          onMouseOut={handleCalendarPointerOut}
        >
          <CalendarSurface
            events={events}
            timeZone={displayTimezone}
            height="75vh"
            onDatesSet={handleDatesSet}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            eventContent={renderEventContent}
          />
        </div>
      </AdminSectionCard>

      {sidePanel}
    </div>
  );
}
