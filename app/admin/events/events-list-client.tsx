"use client";

import {useEffect, useState} from "react";
import {CalendarDays, Ban, Pencil, Plus, Table, Trash2} from "lucide-react";
import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {getAdminEventsClient} from "@/lib/admin/admin-event-client";
import {getAdminLanguagesClient} from "@/lib/admin/admin-client";
import {formatInZone} from "@/lib/admin/timezone";
import {weekdayShort} from "@/lib/admin/weekdays";
import {eventTitle, type ApiEvent} from "@/lib/events/admin-event-types";
import type {components} from "@/lib/api/generated/backend-types";
import {cancelEventAction, deleteEventAction} from "./actions";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];

const badge = (tone: "green" | "amber" | "slate" | "red") =>
  ({
    green: "border border-[#cfe4d3] bg-[#f3fbf4] text-[#2f6b3f]",
    amber: "border border-[#eadfce] bg-[#fbf7f0] text-[#8a6029]",
    slate: "border border-[#dbe3e6] bg-[#f4f7f8] text-[#4a5b62]",
    red: "border border-[#e7c1bd] bg-[#fbf1ef] text-[#a3483f]",
  })[tone];

const describeSchedule = (event: ApiEvent): string => {
  if (event.frequency === "single" || !event.recurrence) {
    return "One-time";
  }
  const {freq, interval, byDay} = event.recurrence;
  const every = interval > 1 ? `every ${interval} ` : "";
  if (freq === "weekly") {
    const days = (byDay ?? []).map(weekdayShort).join(", ") || "—";
    return `Weekly ${every}on ${days}`;
  }
  if (freq === "daily") {
    return `Daily ${every ? every.trim() + " days" : ""}`.trim();
  }
  return `Monthly ${every ? every.trim() + " months" : ""}`.trim();
};

export default function EventsListClient() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiEvent | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useAdminRouteLoadingBoundary(isLoading);

  const loadWorkspace = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextEvents, nextLanguages] = await Promise.all([
        getAdminEventsClient(),
        getAdminLanguagesClient(),
      ]);
      setEvents(nextEvents);
      setLanguages(nextLanguages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const handleCancel = async (event: ApiEvent) => {
    setIsMutating(true);
    const result = await cancelEventAction(event.id);
    setIsMutating(false);
    if (result.ok) {
      setEvents((current) => current.map((item) => (item.id === event.id ? result.event : item)));
    } else {
      setError(result.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsMutating(true);
    const result = await deleteEventAction(pendingDelete.id);
    setIsMutating(false);
    if (result.ok) {
      setEvents((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } else {
      setError(result.message);
      setPendingDelete(null);
    }
  };

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the events workspace."
        description="Resolving event records and available languages."
      />
    );
  }

  if (error && events.length === 0) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The events workspace could not be loaded."
        description={error}
        actions={
          <button
            type="button"
            onClick={() => void loadWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  const languageNameByCode = Object.fromEntries(languages.map((language) => [language.code, language.name]));

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Events"
        description="Manage scheduled walks and tours. Recurring events generate candidate dates you confirm on the calendar."
        actions={
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="h-10">
              <AdminProgressLink href="/events/schedule">
                <Table className="size-4" />
                Schedule
              </AdminProgressLink>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <AdminProgressLink href="/events/calendar">
                <CalendarDays className="size-4" />
                Calendar
              </AdminProgressLink>
            </Button>
            <Button asChild className="h-10">
              <AdminProgressLink href="/events/new">
                <Plus className="size-4" />
                Create Event
              </AdminProgressLink>
            </Button>
          </div>
        }
      >
        {error ? (
          <p className="mb-4 rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
            {error}
          </p>
        ) : null}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <p>No events have been created yet.</p>
            <Button asChild className="h-10 mt-4">
              <AdminProgressLink href="/events/new">
                <Plus className="size-4" />
                Create your first event
              </AdminProgressLink>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <article key={event.id} className="rounded-2xl border border-[#f0e6d8] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-foreground">
                        {eventTitle(event)}
                      </h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(event.type === "paid" ? "amber" : "green")}`}>
                        {event.type === "paid" ? "Paid" : "Free"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge(event.status === "cancelled" ? "red" : "slate")}`}>
                        {event.status === "cancelled" ? "Cancelled" : "Active"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatInZone(event.startDate, event.timezone)}</span>
                      <span>{describeSchedule(event)}</span>
                      <span>{event.durationMinutes} min</span>
                      <span>{languageNameByCode[event.language] ?? event.language}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <AdminProgressLink href={`/events/${event.id}`}>
                        <Pencil className="size-4" />
                        Edit
                      </AdminProgressLink>
                    </Button>
                    {event.status !== "cancelled" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isMutating}
                        onClick={() => void handleCancel(event)}
                      >
                        <Ban className="size-4" />
                        Cancel
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => setPendingDelete(event)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSectionCard>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              This permanently deletes the event and all of its confirmed occurrences. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setPendingDelete(null)} disabled={isMutating}>
              Keep event
            </Button>
            <Button
              className="h-10 bg-[#a3483f] text-white hover:bg-[#8a3d36]"
              onClick={() => void handleConfirmDelete()}
              disabled={isMutating}
            >
              Delete event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
