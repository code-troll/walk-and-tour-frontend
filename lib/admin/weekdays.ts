/** Weekday labels keyed by the backend convention: 0 = Sunday … 6 = Saturday. */
export const WEEKDAY_LABELS: {value: number; short: string; long: string}[] = [
  {value: 0, short: "Sun", long: "Sunday"},
  {value: 1, short: "Mon", long: "Monday"},
  {value: 2, short: "Tue", long: "Tuesday"},
  {value: 3, short: "Wed", long: "Wednesday"},
  {value: 4, short: "Thu", long: "Thursday"},
  {value: 5, short: "Fri", long: "Friday"},
  {value: 6, short: "Sat", long: "Saturday"},
];

export const weekdayShort = (value: number): string =>
  WEEKDAY_LABELS.find((day) => day.value === value)?.short ?? String(value);
