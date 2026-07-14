"use client";

import {useEffect, useMemo, useState} from "react";
import {LoaderCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {listAvailableMembersClient} from "@/lib/admin/admin-availability-client";
import {getAdminTeamMembersClient} from "@/lib/admin/admin-team-member-client";
import {formatInZone} from "@/lib/admin/timezone";
import {eventTitle, type ApiCalendarItem} from "@/lib/events/admin-event-types";
import type {ApiTeamMember} from "@/lib/team-members/admin-team-member-types";
import {
  cancelOccurrenceAction,
  confirmOccurrenceAction,
  deleteOccurrenceAction,
  updateOccurrenceAction,
} from "@/app/admin/events/actions";

type OccurrenceConfirmDrawerProps = {
  item: ApiCalendarItem | null;
  displayTimezone: string;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

export function OccurrenceConfirmDrawer({
  item,
  displayTimezone,
  onOpenChange,
  onChanged,
}: OccurrenceConfirmDrawerProps) {
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = item?.status === "confirmed" || item?.status === "cancelled";

  useEffect(() => {
    if (!item) return;
    setError(null);
    setSelectedIds(item.teamMemberIds ?? []);
    setNote(item.note ?? "");

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
    if (!item) return;
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
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  // Mark an unconfirmed candidate date off without assigning a guide.
  const handleCancelDate = async () => {
    if (!item) return;
    setIsSaving(true);
    setError(null);
    const result = await confirmOccurrenceAction({
      eventId: item.eventId,
      body: {date: item.date, status: "cancelled"},
    });
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  const handleUpdate = async () => {
    if (!item?.occurrenceId) return;
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
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  const handleCancel = async () => {
    if (!item?.occurrenceId) return;
    setIsSaving(true);
    setError(null);
    const result = await cancelOccurrenceAction({eventId: item.eventId, occurrenceId: item.occurrenceId});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    if (!item?.occurrenceId) return;
    setIsSaving(true);
    setError(null);
    const result = await deleteOccurrenceAction({eventId: item.eventId, occurrenceId: item.occurrenceId});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onOpenChange(false);
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
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isConfirmed ? "Occurrence" : "Confirm occurrence"}</SheetTitle>
          <SheetDescription>
            {item ? formatInZone(item.date, displayTimezone) : ""}
            {item ? ` · ${eventTitle(item.event)}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 py-2">
          {item?.status === "cancelled" ? (
            <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
              This occurrence is cancelled.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Guides</h3>
              {isLoading ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : null}
            </div>
            {!isLoading && rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members exist yet.</p>
            ) : null}
            <div className="space-y-1">
              {rows.map((row) => {
                const disabled = !row.available && !row.selected;
                return (
                  <label
                    key={row.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                      disabled
                        ? "cursor-not-allowed border-[#f0e6d8] bg-[#faf7f1] text-muted-foreground"
                        : "cursor-pointer border-[#eadfce] bg-white"
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
                      <span className="rounded-full border border-[#e7c1bd] bg-[#fbf1ef] px-2 py-0.5 text-xs text-[#a3483f]">
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
              className="w-full rounded-xl border border-[#e2d5bf] bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-[#cbb390]"
            />
          </div>
        </div>

        <SheetFooter>
          {isConfirmed ? (
            <div className="flex flex-col gap-2">
              <Button className="h-10" onClick={() => void handleUpdate()} disabled={isSaving || item?.status === "cancelled"}>
                Save changes
              </Button>
              <div className="flex gap-2">
                {item?.status !== "cancelled" ? (
                  <Button variant="outline" className="h-10 flex-1" onClick={() => void handleCancel()} disabled={isSaving}>
                    Cancel occurrence
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="h-10 flex-1 text-[#a3483f]"
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
                className="h-10 text-[#a3483f]"
                onClick={() => void handleCancelDate()}
                disabled={isSaving}
              >
                Cancel this date (no guide)
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
