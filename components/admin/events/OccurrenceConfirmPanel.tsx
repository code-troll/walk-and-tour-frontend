"use client";

import {useEffect, useMemo, useState, type Dispatch, type SetStateAction} from "react";
import {ChevronDown, LoaderCircle, Save} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {EventFormFields} from "@/components/admin/events/EventFormFields";
import {listAvailableMembersClient} from "@/lib/admin/admin-availability-client";
import {getAdminEventClient} from "@/lib/admin/admin-event-client";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {formatInZone} from "@/lib/admin/timezone";
import {
  createEventFormStateFromApi,
  eventTitle,
  toUpdateEventBody,
  validateEventForm,
  type ApiCalendarItem,
  type EventFormState,
} from "@/lib/events/admin-event-types";
import type {ApiTeamMember} from "@/lib/team-members/admin-team-member-types";
import type {components} from "@/lib/api/generated/backend-types";
import {
  cancelOccurrenceAction,
  confirmOccurrenceAction,
  deleteOccurrenceAction,
  updateEventAction,
  updateOccurrenceAction,
} from "@/app/admin/events/actions";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

type OccurrenceConfirmPanelProps = {
  item: ApiCalendarItem;
  displayTimezone: string;
  languages: ApiLanguage[];
  tours: ApiTour[];
  onClose: () => void;
  onChanged: () => void;
};

/** Confirm/edit body of the multi-use calendar side panel. Keyed by item in the parent, so it seeds on mount. */
export function OccurrenceConfirmPanel({
  item,
  displayTimezone,
  languages,
  tours,
  onClose,
  onChanged,
}: OccurrenceConfirmPanelProps) {
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>(item.teamMemberIds ?? []);
  const [note, setNote] = useState(item.note ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event-details section: the full editor, loaded from the event this occurrence belongs to.
  const [eventForm, setEventForm] = useState<EventFormState | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Only one tab open at a time; the open tab's content fills the panel and scrolls, so the
  // other tab's header stays pinned (at the bottom when "event" is open) — no scroll to switch.
  const [openTab, setOpenTab] = useState<"event" | "occurrence">("occurrence");

  const isConfirmed = item.status === "confirmed" || item.status === "cancelled";

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const [allMembers, available] = await Promise.all([
          getAdminTeamMembersClient(),
          listAvailableMembersClient(item.date, item.event.durationMinutes),
        ]);
        setMembers(allMembers);
        setAvailableIds(new Set(available.map((member) => member.id)));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load team members.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [item]);

  useEffect(() => {
    void (async () => {
      setIsEventLoading(true);
      setEventError(null);
      try {
        const event = await getAdminEventClient(item.eventId);
        if (event) {
          setEventForm(createEventFormStateFromApi(event));
        } else {
          setEventError("This event could not be loaded.");
        }
      } catch (loadError) {
        setEventError(loadError instanceof Error ? loadError.message : "Unable to load the event.");
      } finally {
        setIsEventLoading(false);
      }
    })();
  }, [item]);

  const handleSaveEvent = async () => {
    if (!eventForm) return;
    const validationError = validateEventForm(eventForm);
    if (validationError) {
      setEventError(validationError);
      return;
    }
    setIsSavingEvent(true);
    setEventError(null);
    const result = await updateEventAction({id: item.eventId, body: toUpdateEventBody(eventForm)});
    setIsSavingEvent(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setEventError(result.message);
    }
  };

  const memberName = useMemo(() => {
    const map = new Map(members.map((member) => [member.id, member.name]));
    return (id: string) => map.get(id) ?? id;
  }, [members]);

  const toggleMember = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    setError(null);
    const result = await confirmOccurrenceAction({
      eventId: item.eventId,
      body: {
        date: item.date,
        teamMemberIds: selectedIds,
        note: note.trim() || undefined,
      },
    });
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  // Mark an unconfirmed candidate date off without assigning a guide.
  const handleCancelDate = async () => {
    setIsSaving(true);
    setError(null);
    const result = await confirmOccurrenceAction({
      eventId: item.eventId,
      body: {date: item.date, status: "cancelled"},
    });
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleUpdate = async () => {
    if (!item.occurrenceId) return;
    setIsSaving(true);
    setError(null);
    const result = await updateOccurrenceAction({
      eventId: item.eventId,
      occurrenceId: item.occurrenceId,
      body: {teamMemberIds: selectedIds, note: note.trim() || null},
    });
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleCancel = async () => {
    if (!item.occurrenceId) return;
    setIsSaving(true);
    setError(null);
    const result = await cancelOccurrenceAction({eventId: item.eventId, occurrenceId: item.occurrenceId});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    if (!item.occurrenceId) return;
    setIsSaving(true);
    setError(null);
    const result = await deleteOccurrenceAction({eventId: item.eventId, occurrenceId: item.occurrenceId});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  // Members shown: all, ordered available-first; assigned-but-unavailable stay selectable.
  const rows = useMemo(() => {
    return members
      .map((member) => ({
        id: member.id,
        name: member.name,
        available: availableIds.has(member.id),
        selected: selectedIds.includes(member.id),
      }))
      .sort((left, right) => {
        if (left.available !== right.available) return left.available ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
  }, [members, availableIds, selectedIds]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isConfirmed ? "Occurrence" : "Confirm occurrence"}</SheetTitle>
        <SheetDescription>
          {formatInZone(item.date, displayTimezone)}
          {` · ${eventTitle(item.event)}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Tab 1 — Event details */}
        <button
          type="button"
          onClick={() => setOpenTab("event")}
          aria-expanded={openTab === "event"}
          className="flex w-full shrink-0 items-center justify-between gap-4 border-b border-[var(--wt-rule-strong)] px-4 py-4 text-left text-sm font-medium text-foreground outline-none hover:bg-[var(--wt-surface)]"
        >
          <span className="flex items-center gap-2">
            Event details
            {isEventLoading ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : null}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              openTab === "event" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openTab === "event" ? (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 duration-200 animate-in fade-in">
            <p className="text-xs text-muted-foreground">Applies to every occurrence of this event.</p>

            {eventError ? (
              <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
                {eventError}
              </p>
            ) : null}

            {eventForm ? (
              <>
                <EventFormFields
                  formState={eventForm}
                  setFormState={setEventForm as Dispatch<SetStateAction<EventFormState>>}
                  languages={languages}
                  tours={tours}
                />
                <Button
                  className="h-10"
                  onClick={() => void handleSaveEvent()}
                  disabled={isSavingEvent || isEventLoading}
                >
                  {isSavingEvent ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save event details
                </Button>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Tab 2 — This occurrence */}
        <button
          type="button"
          onClick={() => setOpenTab("occurrence")}
          aria-expanded={openTab === "occurrence"}
          className="flex w-full shrink-0 items-center justify-between gap-4 border-y border-[var(--wt-rule-strong)] px-4 py-4 text-left text-sm font-medium text-foreground outline-none hover:bg-[var(--wt-surface)]"
        >
          <span className="flex items-center gap-2">
            This occurrence
            {isLoading ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : null}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              openTab === "occurrence" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openTab === "occurrence" ? (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 duration-200 animate-in fade-in">
            {item.status === "cancelled" ? (
              <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
                This occurrence is cancelled.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
                {error}
              </p>
            ) : null}

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Guides</h4>
              {!isLoading && rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members exist yet.</p>
              ) : null}
              <div className="space-y-1">
                {rows.map((row) => {
                  const disabled = !row.available && !row.selected;
                  return (
                    <label
                      key={row.id}
                      className={`flex items-center justify-between gap-3 rounded-[var(--wt-radius-sm)] border px-3 py-2 text-sm ${
                        disabled
                          ? "cursor-not-allowed border-[var(--wt-rule-strong)] bg-[var(--wt-surface)] text-muted-foreground"
                          : "cursor-pointer border-[var(--wt-rule-strong)] bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Checkbox
                          checked={row.selected}
                          disabled={disabled}
                          onCheckedChange={() => toggleMember(row.id)}
                        />
                        {memberName(row.id)}
                      </span>
                      {!row.available ? (
                        <span className="rounded-full border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-2 py-0.5 text-xs text-[var(--wt-danger)]">
                          Unavailable
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="occurrence-note">
                Note
              </label>
              <textarea
                id="occurrence-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Notes specific to this date…"
                className="w-full rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-[var(--wt-rule-strong)]"
              />
            </div>

            {isConfirmed ? (
              <div className="flex flex-col gap-2">
                <Button className="h-10" onClick={() => void handleUpdate()} disabled={isSaving || item.status === "cancelled"}>
                  Save changes
                </Button>
                <div className="flex gap-2">
                  {item.status !== "cancelled" ? (
                    <Button variant="outline" className="h-10 flex-1" onClick={() => void handleCancel()} disabled={isSaving}>
                      Cancel occurrence
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-10 flex-1 text-[var(--wt-danger)]"
                    onClick={() => void handleDelete()}
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button className="h-10" onClick={() => void handleConfirm()} disabled={isSaving || isLoading}>
                  {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Confirm occurrence
                </Button>
                <Button
                  variant="outline"
                  className="h-10 text-[var(--wt-danger)]"
                  onClick={() => void handleCancelDate()}
                  disabled={isSaving}
                >
                  Cancel this date (no guide)
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
