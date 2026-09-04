"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {DateTime} from "luxon";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  StickyNote,
} from "lucide-react";
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
import {CalendarSidePanel, type CalendarPanelState} from "@/components/admin/events/CalendarSidePanel";
import {
  getAdminDayNotesClient,
  getAdminEventsCalendarClient,
} from "@/lib/admin/admin-event-client";
import {getMemberAvailabilityClient} from "@/lib/admin/admin-availability-client";
import {getAdminLanguagesClient, getAdminToursClient} from "@/lib/admin/admin-client";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {DEFAULT_EVENT_TIMEZONE, timezoneOptionsWith, utcIsoToWallTime} from "@/lib/admin/timezone";
import {
  eventTitle,
  type ApiCalendarItem,
  type ApiDayNote,
  type CalendarItemStatus,
} from "@/lib/events/admin-event-types";
import type {ApiAvailability} from "@/lib/team-members/admin-availability-types";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

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
const STATUS_STYLE: Record<CalendarItemStatus, {backgroundColor: string; color: string}> = {
  unconfirmed: {backgroundColor: "var(--wt-status-pending-bg)", color: "var(--wt-ink)"},
  confirmed: {backgroundColor: "var(--wt-status-confirmed-bg)", color: "var(--wt-status-confirmed)"},
  cancelled: {backgroundColor: "var(--wt-surface-sunk)", color: "var(--wt-status-cancelled)"},
};

/** luxon weekday (1=Mon…7=Sun) → backend convention (0=Sun…6=Sat). */
const toSundayZero = (luxonWeekday: number): number => (luxonWeekday === 7 ? 0 : luxonWeekday);

const isUnavailableOn = (availability: ApiAvailability, dayKey: string, weekday: number): boolean => {
  const inDateRange = availability.unavailableDates.some(
    (range) => range.startDate <= dayKey && dayKey <= range.endDate,
  );
  const recurringWholeDay = availability.recurringUnavailability.some(
    (rule) => rule.startTime === null && rule.dayOfWeek === weekday,
  );
  return inDateRange || recurringWholeDay;
};

type ScheduleDay = {
  /** `YYYY-MM-DD` in the display timezone. */
  key: string;
  label: string;
  weekday: number;
  isToday: boolean;
};

export default function EventsScheduleClient() {
  const [displayTimezone, setDisplayTimezone] = useState(DEFAULT_EVENT_TIMEZONE);
  // Monday of the visible week, as `YYYY-MM-DD`. Null until set on mount (avoids SSR/`now` mismatch).
  const [weekStartDate, setWeekStartDate] = useState<string | null>(null);

  const [items, setItems] = useState<ApiCalendarItem[]>([]);
  const [dayNotes, setDayNotes] = useState<ApiDayNote[]>([]);
  const [memberNameById, setMemberNameById] = useState<Map<string, string>>(new Map());
  const [members, setMembers] = useState<{id: string; name: string}[]>([]);
  const [availabilityByMember, setAvailabilityByMember] = useState<Map<string, ApiAvailability>>(new Map());
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [tours, setTours] = useState<ApiTour[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<CalendarPanelState>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useAdminRouteLoadingBoundary(isLoading);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setWeekStartDate((current) =>
      current ?? DateTime.now().setZone(displayTimezone).startOf("week").toFormat("yyyy-MM-dd"),
    );
    // Intentionally run once on mount; timezone changes keep the same calendar week.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One-time reference data: guide names, languages, tours, and every member's availability.
  useEffect(() => {
    void (async () => {
      try {
        const [teamMembers, nextLanguages, nextTours] = await Promise.all([
          getAdminTeamMembersClient(),
          getAdminLanguagesClient(),
          getAdminToursClient(),
        ]);
        setMemberNameById(new Map(teamMembers.map((member) => [member.id, member.name])));
        setMembers(teamMembers.map((member) => ({id: member.id, name: member.name})));
        setLanguages(nextLanguages);
        setTours(nextTours);

        const availabilities = await Promise.all(
          teamMembers.map(async (member) => {
            try {
              return [member.id, await getMemberAvailabilityClient(member.id)] as const;
            } catch {
              return null;
            }
          }),
        );
        setAvailabilityByMember(new Map(availabilities.filter((entry) => entry !== null)));
      } catch {
        // Reference data is a nicety; the grid still works without it.
      }
    })();
  }, []);

  const days: ScheduleDay[] = useMemo(() => {
    if (!weekStartDate) return [];
    const monday = DateTime.fromISO(weekStartDate, {zone: displayTimezone}).startOf("day");
    const today = DateTime.now().setZone(displayTimezone);
    return Array.from({length: 7}, (_, index) => {
      const day = monday.plus({days: index});
      return {
        key: day.toFormat("yyyy-MM-dd"),
        label: day.toFormat("ccc d LLL"),
        weekday: toSundayZero(day.weekday),
        isToday: day.hasSame(today, "day"),
      };
    });
  }, [weekStartDate, displayTimezone]);

  useEffect(() => {
    if (!weekStartDate) return;
    const monday = DateTime.fromISO(weekStartDate, {zone: displayTimezone}).startOf("day");
    const fromIso = monday.toUTC().toISO();
    const toIso = monday.plus({days: 7}).toUTC().toISO();
    if (!fromIso || !toIso) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        const [nextItems, nextNotes] = await Promise.all([
          getAdminEventsCalendarClient(fromIso, toIso),
          getAdminDayNotesClient(fromIso, toIso),
        ]);
        if (requestId === requestIdRef.current) {
          setItems(nextItems);
          setDayNotes(nextNotes);
        }
      } catch (loadError) {
        if (requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the schedule.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    })();
  }, [weekStartDate, displayTimezone, refreshKey]);

  // One row per event; each row maps day → the occurrence/candidate on that day.
  const rows = useMemo(() => {
    const byEvent = new Map<
      string,
      {event: ApiCalendarItem["event"]; time: string; cells: Map<string, ApiCalendarItem>}
    >();
    for (const item of items) {
      const wall = utcIsoToWallTime(item.date, displayTimezone); // yyyy-MM-ddTHH:mm
      const dayKey = wall.slice(0, 10);
      const time = wall.slice(11, 16);
      let row = byEvent.get(item.eventId);
      if (!row) {
        row = {event: item.event, time, cells: new Map()};
        byEvent.set(item.eventId, row);
      }
      row.cells.set(dayKey, item);
    }
    return [...byEvent.values()].sort((left, right) => {
      if (left.time !== right.time) return left.time.localeCompare(right.time);
      const language = left.event.language.localeCompare(right.event.language);
      if (language !== 0) return language;
      return eventTitle(left.event).localeCompare(eventTitle(right.event));
    });
  }, [items, displayTimezone]);

  const noteByDay = useMemo(() => {
    const map = new Map<string, ApiDayNote>();
    for (const note of dayNotes) map.set(note.date, note);
    return map;
  }, [dayNotes]);

  const unavailableByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const day of days) {
      const names = members
        .filter((member) => {
          const availability = availabilityByMember.get(member.id);
          return availability ? isUnavailableOn(availability, day.key, day.weekday) : false;
        })
        .map((member) => member.name)
        .sort((a, b) => a.localeCompare(b));
      map.set(day.key, names);
    }
    return map;
  }, [days, members, availabilityByMember]);

  const shiftWeek = (deltaDays: number) => {
    setWeekStartDate((current) =>
      current ? DateTime.fromISO(current).plus({days: deltaDays}).toFormat("yyyy-MM-dd") : current,
    );
  };
  const goToday = () =>
    setWeekStartDate(DateTime.now().setZone(displayTimezone).startOf("week").toFormat("yyyy-MM-dd"));

  const timezoneOptions = timezoneOptionsWith(displayTimezone);
  const weekLabel =
    days.length > 0 ? `${days[0].label} – ${days[6].label}` : "";

  const renderEventCell = (item: ApiCalendarItem | undefined) => {
    if (!item) {
      return <div className="h-full min-h-9" />;
    }
    const style = STATUS_STYLE[item.status];
    const guides = (item.teamMemberIds ?? []).map((id) => memberNameById.get(id) ?? "…");
    return (
      <button
        type="button"
        onClick={() => setPanel({mode: "confirm", item})}
        style={{backgroundColor: style.backgroundColor, color: style.color}}
        className="flex h-full min-h-9 w-full flex-col items-start gap-0.5 rounded-[var(--wt-radius-sm)] px-2 py-1 text-left text-xs hover:brightness-95"
      >
        {item.status === "cancelled" ? (
          <span className="font-medium line-through">Cancelled</span>
        ) : item.status === "confirmed" ? (
          <span className="font-medium">{guides.length ? guides.join(", ") : "No guide"}</span>
        ) : (
          <span className="opacity-70">{guides.length ? guides.join(", ") : "Confirm…"}</span>
        )}
        {item.note ? <span className="opacity-80">{item.note}</span> : null}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <AdminProgressLink href="/events">
            <ArrowLeft className="size-4" />
            Events
          </AdminProgressLink>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <AdminProgressLink href="/events/calendar">
              <CalendarDays className="size-4" />
              Calendar
            </AdminProgressLink>
          </Button>
          <span className="text-sm text-muted-foreground">Timezone</span>
          <Select value={displayTimezone} onValueChange={setDisplayTimezone}>
            <SelectTrigger className="w-56">
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
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
          {error}
        </p>
      ) : null}

      <AdminSectionCard
        title="Weekly schedule"
        description="Tours by day, with the guides assigned to each. Click a cell to confirm, assign guides, or edit the event. Times shown in the selected timezone."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" className="size-9" onClick={() => shiftWeek(-7)} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="outline" size="icon-sm" className="size-9" onClick={() => shiftWeek(7)} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-foreground">{weekLabel}</span>
        </div>

        {weekStartDate === null ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-44 border-b border-[var(--wt-rule-strong)] bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tour
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.key}
                      className={`min-w-28 border-b border-[var(--wt-rule-strong)] px-2 py-2 text-center text-xs font-semibold ${
                        day.isToday ? "bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]" : "bg-white text-foreground"
                      }`}
                    >
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Day notes row */}
                <tr>
                  <th className="sticky left-0 z-10 border-b border-[var(--wt-rule-strong)] bg-white px-3 py-1.5 text-left align-top">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <StickyNote className="size-3.5" />
                      Notes
                    </span>
                  </th>
                  {days.map((day) => {
                    const note = noteByDay.get(day.key);
                    return (
                      <td key={day.key} className="border-b border-[var(--wt-rule-strong)] p-1 align-top">
                        <button
                          type="button"
                          onClick={() => setPanel({mode: "day-note", date: day.key, note: note?.note ?? ""})}
                          className={`flex min-h-8 w-full items-start gap-1 rounded-[var(--wt-radius-sm)] px-2 py-1 text-left text-xs ${
                            note
                              ? "bg-[var(--wt-status-pending-bg)] text-[var(--wt-ink-muted)] hover:brightness-95"
                              : "text-muted-foreground hover:bg-[var(--wt-surface)]"
                          }`}
                        >
                          {note ? note.note : <Plus className="size-3.5 opacity-60" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>

                {/* Event rows */}
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={days.length + 1}
                      className="border-b border-[var(--wt-rule-strong)] px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      No events scheduled this week.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.event.id}>
                      <th className="sticky left-0 z-10 border-b border-[var(--wt-rule-strong)] bg-white px-3 py-1.5 text-left align-top">
                        <span className="flex items-start gap-1.5">
                          <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">{row.time}</span>
                          <LanguageFlag language={row.event.language} className="mt-0.5 h-2.5 w-3.5 shrink-0 rounded-[var(--wt-radius-hairline)]" />
                          <span className="text-xs font-medium text-foreground">{eventTitle(row.event)}</span>
                        </span>
                      </th>
                      {days.map((day) => (
                        <td key={day.key} className="border-b border-[var(--wt-rule-strong)] p-1 align-top">
                          {renderEventCell(row.cells.get(day.key))}
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {/* Unavailable / holidays row */}
                <tr>
                  <th className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left align-top">
                    <span className="text-xs font-medium text-muted-foreground">Unavailable</span>
                  </th>
                  {days.map((day) => {
                    const names = unavailableByDay.get(day.key) ?? [];
                    return (
                      <td key={day.key} className="p-1 align-top">
                        <div className="min-h-8 px-2 py-1 text-xs text-[var(--wt-danger)]">
                          {names.length ? names.join(", ") : <span className="text-muted-foreground opacity-50">—</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>

      <CalendarSidePanel
        panel={panel}
        displayTimezone={displayTimezone}
        languages={languages}
        tours={tours}
        onClose={() => setPanel(null)}
        onChanged={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
