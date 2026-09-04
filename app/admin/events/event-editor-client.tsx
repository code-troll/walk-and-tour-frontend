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
import {EventFormFields} from "@/components/admin/events/EventFormFields";
import {Button} from "@/components/ui/button";
import {getAdminEventClient} from "@/lib/admin/admin-event-client";
import {getAdminLanguagesClient, getAdminToursClient} from "@/lib/admin/admin-client";
import {
  createEmptyEventFormState,
  createEventFormStateFromApi,
  toCreateEventBody,
  toUpdateEventBody,
  validateEventForm,
  type EventFormState,
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

  const validationError = useMemo(() => validateEventForm(formState), [formState]);

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
              ? "border border-[var(--wt-danger)] bg-[var(--wt-surface)] text-[var(--wt-danger)]"
              : "border border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] text-[var(--wt-status-confirmed)]"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <AdminSectionCard title={mode === "create" ? "New event" : "Edit event"} description="Details apply to every occurrence generated by this event.">
        <EventFormFields
          formState={formState}
          setFormState={setFormState}
          languages={languages}
          tours={tours}
        />
      </AdminSectionCard>
    </div>
  );
}
