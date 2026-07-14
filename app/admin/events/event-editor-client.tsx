"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, LoaderCircle, Save} from "lucide-react";
import {
  AdminProgressLink,
  useAdminRouteLoadingBoundary,
  useAdminRouteProgress,
} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {RecurrenceBuilder} from "@/components/admin/events/RecurrenceBuilder";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {getAdminEventClient} from "@/lib/admin/admin-event-client";
import {getAdminLanguagesClient, getAdminToursClient} from "@/lib/admin/admin-client";
import {timezoneOptionsWith, utcWeekday, wallTimeToUtcIso} from "@/lib/admin/timezone";
import {
  createEmptyEventFormState,
  createEventFormStateFromApi,
  toCreateEventBody,
  toUpdateEventBody,
  type EventFormState,
  type EventFrequency,
  type EventType,
} from "@/lib/events/admin-event-types";
import type {components} from "@/lib/api/generated/backend-types";
import {createEventAction, updateEventAction} from "./actions";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

type EventEditorClientProps = {
  mode: "create" | "edit";
  eventId?: string;
};

type FeedbackState = {message: string; tone: "error" | "success"} | null;

const fieldLabelClassName = "text-sm font-medium text-foreground";
const NO_TOUR_VALUE = "__none__";

export function EventEditorClient({mode, eventId}: EventEditorClientProps) {
  const router = useRouter();
  const {startNavigation} = useAdminRouteProgress();

  const [formState, setFormState] = useState<EventFormState>(createEmptyEventFormState);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [tours, setTours] = useState<ApiTour[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isMutating, setIsMutating] = useState(false);

  useAdminRouteLoadingBoundary(isInitialLoading);

  useEffect(() => {
    void (async () => {
      setIsInitialLoading(true);
      setInitialLoadError(null);
      try {
        const [nextLanguages, nextTours, event] = await Promise.all([
          getAdminLanguagesClient(),
          getAdminToursClient(),
          mode === "edit" && eventId ? getAdminEventClient(eventId) : Promise.resolve(null),
        ]);
        setLanguages(nextLanguages);
        setTours(nextTours);

        if (mode === "edit") {
          if (!event) {
            setInitialLoadError("This event could not be found.");
          } else {
            setFormState(createEventFormStateFromApi(event));
          }
        } else {
          setFormState((current) => ({
            ...current,
            language: current.language || nextLanguages[0]?.code || "",
          }));
        }
      } catch (error) {
        setInitialLoadError(error instanceof Error ? error.message : "Unable to load the event editor.");
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, [mode, eventId]);

  const showFeedback = (tone: "error" | "success", message: string) => {
    setFeedback({tone, message});
    setTimeout(() => setFeedback(null), 5000);
  };

  const update = (patch: Partial<EventFormState>) => setFormState((current) => ({...current, ...patch}));

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

  const validationError = useMemo(() => {
    if (!formState.language) return "Select a language.";
    if (!formState.startDate) return "Set a start date and time.";
    if (formState.durationMinutes < 1) return "Duration must be at least 1 minute.";
    if (formState.frequency === "recurring") {
      if (formState.recurrence.freq === "weekly" && formState.recurrence.byDay.length === 0) {
        return "Select at least one weekday for the weekly schedule.";
      }
    }
    return null;
  }, [formState]);

  const handleSave = async () => {
    if (validationError) {
      showFeedback("error", validationError);
      return;
    }
    setIsMutating(true);
    try {
      if (mode === "create") {
        const result = await createEventAction(toCreateEventBody(formState));
        if (!result.ok) {
          showFeedback("error", result.message);
          return;
        }
        showFeedback("success", "Event created.");
        startNavigation();
        router.replace(`/events/${result.event.id}`);
      } else if (eventId) {
        const result = await updateEventAction({id: eventId, body: toUpdateEventBody(formState)});
        if (!result.ok) {
          showFeedback("error", result.message);
          return;
        }
        setFormState(createEventFormStateFromApi(result.event));
        showFeedback("success", "Event updated.");
      }
    } catch (error) {
      showFeedback("error", error instanceof Error ? error.message : "Unable to save the event.");
    } finally {
      setIsMutating(false);
    }
  };

  if (isInitialLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the event editor."
        description="Resolving languages, tours, and event data."
      />
    );
  }

  if (initialLoadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The event editor could not be loaded."
        description={initialLoadError}
        actions={
          <Button asChild variant="outline" className="h-10">
            <AdminProgressLink href="/events">
              <ArrowLeft className="size-4" />
              Back to events
            </AdminProgressLink>
          </Button>
        }
      />
    );
  }

  const timezoneOptions = timezoneOptionsWith(formState.timezone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <AdminProgressLink href="/events">
            <ArrowLeft className="size-4" />
            Back to events
          </AdminProgressLink>
        </Button>
        <Button className="h-10" onClick={() => void handleSave()} disabled={isMutating}>
          {isMutating ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {mode === "create" ? "Create event" : "Save changes"}
        </Button>
      </div>

      {feedback ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border border-[#e7c1bd] bg-[#fbf1ef] text-[#a3483f]"
              : "border border-[#cfe4d3] bg-[#f3fbf4] text-[#2f6b3f]"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <AdminSectionCard title={mode === "create" ? "New event" : "Edit event"} description="Details apply to every occurrence generated by this event.">
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
              className="w-full rounded-xl border border-[#e2d5bf] bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-[#cbb390]"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
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
                className="h-10"
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

            <div className="space-y-2">
              <label className={fieldLabelClassName} htmlFor="event-start">
                Start (in timezone)
              </label>
              <Input
                id="event-start"
                type="datetime-local"
                value={formState.startDate}
                onChange={(event) => update({startDate: event.target.value})}
                className="h-10"
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
                      ? "border-[#9a6a2f] bg-[#f9f2e7] text-[#7a5424]"
                      : "border-[#eadfce] bg-white text-muted-foreground hover:border-[#cbb390]"
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
      </AdminSectionCard>
    </div>
  );
}
