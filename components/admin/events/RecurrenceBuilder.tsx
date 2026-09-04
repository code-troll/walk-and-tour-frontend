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
import {fieldLabelClassName} from "@/components/ui/control-class";
import {AdminToggleChip} from "@/components/admin/AdminUi";

const FREQUENCIES: {value: RecurrenceFrequency; label: string}[] = [
  {value: "daily", label: "Daily"},
  {value: "weekly", label: "Weekly"},
  {value: "monthly", label: "Monthly"},
];


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
    <div className="space-y-5 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldLabelClassName}>Frequency</label>
          <Select
            value={value.freq}
            onValueChange={(freq) => update({freq: freq as RecurrenceFrequency})}
          >
            <SelectTrigger>
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
              } className="w-24"
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
                <AdminToggleChip key={day.value} onClick={() => toggleDay(day.value)} pressed={selected}>
                  {day.short}
                </AdminToggleChip>
              );
            })}
          </div>
          {value.byDay.length === 0 ? (
            <p className="text-xs text-[var(--wt-danger)]">Select at least one weekday.</p>
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
              className="text-xs font-medium text-[var(--wt-ink-muted)] hover:underline"
            >
              Clear (no end date)
            </button>
          ) : null}
        </div>
        <Input
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
