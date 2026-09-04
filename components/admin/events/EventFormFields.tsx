"use client";

import type {Dispatch, SetStateAction} from "react";
import {RecurrenceBuilder} from "@/components/admin/events/RecurrenceBuilder";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {timezoneOptionsWith, utcWeekday, wallTimeToUtcIso} from "@/lib/admin/timezone";
import type {EventFormState, EventFrequency, EventType} from "@/lib/events/admin-event-types";
import type {components} from "@/lib/api/generated/backend-types";
import {controlMultilineClassName} from "@/components/ui/control-class";
import {fieldLabelClassName} from "@/components/ui/control-class";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

const NO_TOUR_VALUE = "__none__";

type EventFormFieldsProps = {
  formState: EventFormState;
  setFormState: Dispatch<SetStateAction<EventFormState>>;
  languages: ApiLanguage[];
  tours: ApiTour[];
};

/** The shared event editor fields, used both by the full editor page and the calendar create panel. */
export function EventFormFields({formState, setFormState, languages, tours}: EventFormFieldsProps) {
  const update = (patch: Partial<EventFormState>) =>
    setFormState((current) => ({...current, ...patch}));

  // When the schedule becomes weekly with no weekdays yet, default the selection to
  // the start's UTC weekday (the convention the backend expands against).
  const handleFrequencyChange = (frequency: EventFrequency) => {
    setFormState((current) => {
      if (frequency === "single") {
        return {...current, frequency};
      }
      let byDay = current.recurrence.byDay;
      if (current.recurrence.freq === "weekly" && byDay.length === 0 && current.startDate) {
        try {
          byDay = [utcWeekday(wallTimeToUtcIso(current.startDate, current.timezone))];
        } catch {
          byDay = [];
        }
      }
      return {...current, frequency, recurrence: {...current.recurrence, byDay}};
    });
  };

  const timezoneOptions = timezoneOptionsWith(formState.timezone);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldLabelClassName}>Language</label>
          <Select value={formState.language} onValueChange={(language) => update({language})}>
            <SelectTrigger className="h-10!">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className={fieldLabelClassName}>Type</label>
          <Select value={formState.type} onValueChange={(type) => update({type: type as EventType})}>
            <SelectTrigger className="h-10!">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={fieldLabelClassName}>Linked tour (optional)</label>
        <Select
          value={formState.tourId || NO_TOUR_VALUE}
          onValueChange={(value) => update({tourId: value === NO_TOUR_VALUE ? "" : value})}
        >
          <SelectTrigger className="h-10!">
            <SelectValue placeholder="No linked tour" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TOUR_VALUE}>No linked tour</SelectItem>
            {tours.map((tour) => (
              <SelectItem key={tour.id} value={tour.id}>
                {tour.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className={fieldLabelClassName} htmlFor="event-description">
          Description (optional)
        </label>
        <textarea
          id="event-description"
          value={formState.description}
          onChange={(event) => update({description: event.target.value})}
          rows={3}
          placeholder="Meeting point, what to bring, notes for guides…"
          className={controlMultilineClassName}
        />
      </div>

      <div className="space-y-2">
        <label className={fieldLabelClassName}>Timezone</label>
        <Select value={formState.timezone} onValueChange={(timezone) => update({timezone})}>
          <SelectTrigger className="h-10!">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={fieldLabelClassName} htmlFor="event-start">
            Start (in timezone)
          </label>
          <Input
            id="event-start"
            type="datetime-local"
            value={formState.startDate}
            onChange={(event) => update({startDate: event.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className={fieldLabelClassName} htmlFor="event-duration">
            Duration (minutes)
          </label>
          <Input
            id="event-duration"
            type="number"
            min={1}
            value={formState.durationMinutes}
            onChange={(event) => update({durationMinutes: Math.max(1, Number(event.target.value) || 1)})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={fieldLabelClassName}>Frequency</label>
        <div className="flex gap-2">
          {(["single", "recurring"] as EventFrequency[]).map((frequency) => (
            <button
              key={frequency}
              type="button"
              onClick={() => handleFrequencyChange(frequency)}
              aria-pressed={formState.frequency === frequency}
              className={`rounded-full border px-5 py-2 text-sm font-medium capitalize transition ${
                formState.frequency === frequency
                  ? "border-[var(--wt-ink)] bg-[var(--wt-surface-sunk)] text-[var(--wt-ink-muted)]"
                  : "border-[var(--wt-rule-strong)] bg-white text-muted-foreground hover:border-[var(--wt-rule-strong)]"
              }`}
            >
              {frequency}
            </button>
          ))}
        </div>
      </div>

      {formState.frequency === "recurring" ? (
        <RecurrenceBuilder
          value={formState.recurrence}
          onChange={(recurrence) => update({recurrence})}
        />
      ) : null}
    </div>
  );
}
