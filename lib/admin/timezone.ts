import {DateTime} from "luxon";

/** Mirrors the backend `DEFAULT_EVENT_TIMEZONE`. */
export const DEFAULT_EVENT_TIMEZONE = "Europe/Copenhagen";

/** Curated IANA zones offered in the event editor + calendar timezone pickers. */
export const TIMEZONE_OPTIONS = [
  "Europe/Copenhagen",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Lisbon",
  "Atlantic/Reykjavik",
  "America/New_York",
  "America/Los_Angeles",
  "America/Argentina/Buenos_Aires",
  "UTC",
] as const;

/** The curated list, guaranteed to include `zone` (prepended when not already present). */
export const timezoneOptionsWith = (zone: string | null | undefined): string[] => {
  const options = [...TIMEZONE_OPTIONS] as string[];
  if (zone && !options.includes(zone)) {
    return [zone, ...options];
  }
  return options;
};

/**
 * Converts a `datetime-local` wall-clock value (e.g. `2026-07-01T10:00`) interpreted
 * in `zone` into the UTC ISO string the backend stores. Throws on an invalid value.
 */
export const wallTimeToUtcIso = (wall: string, zone: string): string => {
  const dt = DateTime.fromISO(wall, {zone});
  const iso = dt.isValid ? dt.toUTC().toISO() : null;
  if (!iso) {
    throw new Error(`Invalid date/time "${wall}" for timezone "${zone}".`);
  }
  return iso;
};

/** Inverse of {@link wallTimeToUtcIso}: a UTC ISO instant rendered as a `datetime-local` value in `zone`. */
export const utcIsoToWallTime = (utcIso: string, zone: string): string =>
  DateTime.fromISO(utcIso, {zone: "utc"}).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm");

/** Human display of a UTC instant in `zone`, e.g. `1 Jul 2026, 10:00 CEST`. */
export const formatInZone = (utcIso: string, zone: string): string =>
  DateTime.fromISO(utcIso, {zone: "utc"}).setZone(zone).toFormat("d LLL yyyy, HH:mm ZZZZ");

/** Short zone abbreviation for a UTC instant, e.g. `CEST`. */
export const zoneAbbreviation = (utcIso: string, zone: string): string =>
  DateTime.fromISO(utcIso, {zone: "utc"}).setZone(zone).toFormat("ZZZZ");

/** UTC ISO instant shifted by `minutes`, returned as UTC ISO (used to derive occurrence end times). */
export const addMinutesToUtcIso = (utcIso: string, minutes: number): string =>
  DateTime.fromISO(utcIso, {zone: "utc"}).plus({minutes}).toUTC().toISO() ?? utcIso;

/**
 * UTC weekday of a UTC instant as `0 = Sunday … 6 = Saturday` — the convention the
 * backend recurrence math uses. Note this is the UTC weekday, which can differ from
 * the event's local weekday for past-midnight-local start times (see plan caveat).
 */
export const utcWeekday = (utcIso: string): number => {
  const luxonWeekday = DateTime.fromISO(utcIso, {zone: "utc"}).weekday; // 1=Mon … 7=Sun
  return luxonWeekday === 7 ? 0 : luxonWeekday;
};
