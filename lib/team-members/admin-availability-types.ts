// Shapes for the team-member availability endpoints (see TeamMembersService).

export type ApiUnavailableDate = {
  id: string;
  /** Calendar date `YYYY-MM-DD` (inclusive). */
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type ApiRecurringUnavailability = {
  id: string;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  /** `HH:mm[:ss]` in UTC, or null for a whole-day rule. */
  startTime: string | null;
  endTime: string | null;
};

export type ApiAvailability = {
  unavailableDates: ApiUnavailableDate[];
  recurringUnavailability: ApiRecurringUnavailability[];
};

export type CreateUnavailableDateBody = {
  startDate: string;
  endDate: string;
  reason?: string;
};

export type CreateRecurringUnavailabilityBody = {
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
};

/** Normalises a stored `HH:mm[:ss]` value to `HH:mm` for display/inputs. */
export const toHourMinute = (time: string | null): string => (time ? time.slice(0, 5) : "");
