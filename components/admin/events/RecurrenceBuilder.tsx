"use client";

import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {WEEKDAY_LABELS} from "@/lib/admin/weekdays";
import type {RecurrenceFormState, RecurrenceFrequency} from "@/lib/events/admin-event-types";

const FREQUENCIES: {value: RecurrenceFrequency; label: string}[] = [
  {value: "daily", label: "Daily"},
  {value: "weekly", label: "Weekly"},
  {value: "monthly", label: "Monthly"},
];

const fieldLabelClassName = "text-sm font-medium text-foreground";

export function RecurrenceBuilder({
  value,
  onChange,
}: {
  value: RecurrenceFormState;
  onChange: (next: RecurrenceFormState) => void;
}) {
  const update = (patch: Partial<RecurrenceFormState>) => onChange({...value, ...patch});

  const toggleDay = (day: number) => {
    const set = new Set(value.byDay);
    if (set.has(day)) {
      set.delete(day);
    } else {
      set.add(day);
    }
    update({byDay: [...set].sort((a, b) => a - b)});
  };

  const unit = value.freq === "daily" ? "day(s)" : value.freq === "weekly" ? "week(s)" : "month(s)";

  return (
    <div className="space-y-5 rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldLabelClassName}>Frequency</label>
          <Select
            value={value.freq}
            onValueChange={(freq) => update({freq: freq as RecurrenceFrequency})}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={fieldLabelClassName} htmlFor="recurrence-interval">
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="recurrence-interval"
              type="number"
              min={1}
              value={value.interval}
              onChange={(event) =>
                update({interval: Math.max(1, Number(event.target.value) || 1)})
              }
              className="h-10 w-24"
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>

      {value.freq === "weekly" ? (
        <div className="space-y-2">
          <label className={fieldLabelClassName}>Repeat on</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((day) => {
              const selected = value.byDay.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-[#9a6a2f] bg-[#f9f2e7] text-[#7a5424]"
                      : "border-[#eadfce] bg-white text-muted-foreground hover:border-[#cbb390]"
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          {value.byDay.length === 0 ? (
            <p className="text-xs text-[#a3483f]">Select at least one weekday.</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={fieldLabelClassName} htmlFor="recurrence-until">
            Series ends (optional)
          </label>
          {value.until ? (
            <button
              type="button"
              onClick={() => update({until: ""})}
              className="text-xs font-medium text-[#9a6a2f] hover:underline"
            >
              Clear (no end date)
            </button>
          ) : null}
        </div>
        <Input
          className="h-10"
          id="recurrence-until"
          type="datetime-local"
          value={value.until}
          onChange={(event) => update({until: event.target.value})}
        />
        <p className="text-xs text-muted-foreground">
          Interpreted in the event timezone. Leave empty for an open-ended series —
          candidate dates are still bounded by the calendar window you view.
        </p>
      </div>
    </div>
  );
}
