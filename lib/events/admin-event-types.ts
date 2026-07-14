import {
  DEFAULT_EVENT_TIMEZONE,
  utcIsoToWallTime,
  wallTimeToUtcIso,
} from "@/lib/admin/timezone";

// ── Domain unions (mirror src/shared/domain/event.enums.ts) ────────────

export type EventType = "free" | "paid";
export type EventFrequency = "single" | "recurring";
export type EventStatus = "active" | "cancelled";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type OccurrenceStatus = "confirmed" | "cancelled";
export type CalendarItemStatus = "unconfirmed" | OccurrenceStatus;

// ── API response shapes (from EventsService response shapers) ───────────

export type ApiAudit = {
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiRecurrence = {
  freq: RecurrenceFrequency;
  interval: number;
  byDay: number[] | null;
  until: string | null;
};

export type ApiOccurrence = {
  id: string;
  eventId: string;
  date: string;
  note: string | null;
  status: OccurrenceStatus;
  teamMemberIds: string[];
  audit: ApiAudit;
};

export type ApiEvent = {
  id: string;
  language: string;
  type: EventType;
  tourId: string | null;
  tourName: string | null;
  description: string | null;
  durationMinutes: number;
  frequency: EventFrequency;
  startDate: string;
  timezone: string;
  recurrence: ApiRecurrence | null;
  status: EventStatus;
  occurrences: ApiOccurrence[];
  audit: ApiAudit;
};

/** Compact event context attached to each calendar item. */
export type ApiEventSummary = {
  id: string;
  description: string | null;
  language: string;
  type: EventType;
  tourId: string | null;
  tourName: string | null;
  durationMinutes: number;
  timezone: string;
  frequency: EventFrequency;
  status: EventStatus;
};

/** Display title for an event: its description, else the linked tour name, else a fallback. */
export const eventTitle = (event: {
  description: string | null;
  tourName: string | null;
}): string => event.description?.trim() || event.tourName?.trim() || "Untitled event";

// ── Day notes ──────────────────────────────────────────────────────────

export type ApiDayNote = {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  note: string;
};

export type UpsertDayNoteBody = {
  note: string;
};

/** One item from `GET /admin/events/calendar` — a candidate or stored occurrence with event context. */
export type ApiCalendarItem = {
  date: string;
  status: CalendarItemStatus;
  occurrenceId?: string;
  note?: string | null;
  teamMemberIds?: string[];
  eventId: string;
  event: ApiEventSummary;
};

// ── Request bodies ─────────────────────────────────────────────────────

export type RecurrenceBody = {
  freq: RecurrenceFrequency;
  interval: number;
  byDay?: number[];
  until?: string;
};

export type CreateEventBody = {
  language: string;
  type: EventType;
  tourId?: string;
  description?: string;
  durationMinutes: number;
  frequency: EventFrequency;
  startDate: string;
  timezone?: string;
  recurrence?: RecurrenceBody;
};

export type UpdateEventBody = {
  language?: string;
  type?: EventType;
  tourId?: string | null;
  description?: string | null;
  durationMinutes?: number;
  frequency?: EventFrequency;
  startDate?: string;
  timezone?: string;
  recurrence?: RecurrenceBody;
};

export type ConfirmOccurrenceBody = {
  date: string;
  teamMemberIds?: string[];
  note?: string;
  status?: OccurrenceStatus;
};

export type UpdateOccurrenceBody = {
  teamMemberIds?: string[];
  note?: string | null;
};

// ── Form state ↔ body mapping ──────────────────────────────────────────

export type RecurrenceFormState = {
  freq: RecurrenceFrequency;
  interval: number;
  /** Weekdays 0=Sun…6=Sat, used only when `freq === "weekly"`. */
  byDay: number[];
  /** `datetime-local` wall-clock value interpreted in the event timezone. */
  until: string;
};

export type EventFormState = {
  language: string;
  type: EventType;
  /** Tour UUID or "" for none. */
  tourId: string;
  /** HTML from the rich-text editor. */
  description: string;
  durationMinutes: number;
  frequency: EventFrequency;
  timezone: string;
  /** `datetime-local` wall-clock value interpreted in `timezone`. */
  startDate: string;
  recurrence: RecurrenceFormState;
};

const emptyRecurrence = (): RecurrenceFormState => ({
  freq: "weekly",
  interval: 1,
  byDay: [],
  until: "",
});

export const createEmptyEventFormState = (): EventFormState => ({
  language: "",
  type: "free",
  tourId: "",
  description: "",
  durationMinutes: 90,
  frequency: "single",
  timezone: DEFAULT_EVENT_TIMEZONE,
  startDate: "",
  recurrence: emptyRecurrence(),
});

export const createEventFormStateFromApi = (event: ApiEvent): EventFormState => ({
  language: event.language,
  type: event.type,
  tourId: event.tourId ?? "",
  description: event.description ?? "",
  durationMinutes: event.durationMinutes,
  frequency: event.frequency,
  timezone: event.timezone,
  startDate: utcIsoToWallTime(event.startDate, event.timezone),
  recurrence: event.recurrence
    ? {
        freq: event.recurrence.freq,
        interval: event.recurrence.interval,
        byDay: event.recurrence.byDay ?? [],
        until: event.recurrence.until
          ? utcIsoToWallTime(event.recurrence.until, event.timezone)
          : "",
      }
    : emptyRecurrence(),
});

/** Treats an "empty" rich-text document as no description. */
const cleanHtml = (html: string): string => {
  const trimmed = html.trim();
  return trimmed === "<p></p>" ? "" : trimmed;
};

const toRecurrenceBody = (recurrence: RecurrenceFormState, timezone: string): RecurrenceBody => {
  const body: RecurrenceBody = {
    freq: recurrence.freq,
    interval: recurrence.interval,
  };
  if (recurrence.until) {
    body.until = wallTimeToUtcIso(recurrence.until, timezone);
  }
  if (recurrence.freq === "weekly") {
    body.byDay = recurrence.byDay;
  }
  return body;
};

export const toCreateEventBody = (state: EventFormState): CreateEventBody => {
  const body: CreateEventBody = {
    language: state.language,
    type: state.type,
    durationMinutes: state.durationMinutes,
    frequency: state.frequency,
    startDate: wallTimeToUtcIso(state.startDate, state.timezone),
    timezone: state.timezone,
  };
  const tourId = state.tourId.trim();
  if (tourId) {
    body.tourId = tourId;
  }
  const description = cleanHtml(state.description);
  if (description) {
    body.description = description;
  }
  if (state.frequency === "recurring") {
    body.recurrence = toRecurrenceBody(state.recurrence, state.timezone);
  }
  return body;
};

export const toUpdateEventBody = (state: EventFormState): UpdateEventBody => {
  const body: UpdateEventBody = {
    language: state.language,
    type: state.type,
    tourId: state.tourId.trim() || null,
    description: cleanHtml(state.description) || null,
    durationMinutes: state.durationMinutes,
    frequency: state.frequency,
    startDate: wallTimeToUtcIso(state.startDate, state.timezone),
    timezone: state.timezone,
  };
  if (state.frequency === "recurring") {
    body.recurrence = toRecurrenceBody(state.recurrence, state.timezone);
  }
  return body;
};
