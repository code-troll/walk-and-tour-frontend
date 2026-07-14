"use client";

import {useState} from "react";
import {LoaderCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {deleteDayNoteAction, upsertDayNoteAction} from "@/app/admin/events/actions";

type DayNotePanelProps = {
  /** `YYYY-MM-DD`. */
  date: string;
  initialNote: string;
  onClose: () => void;
  onChanged: () => void;
};

/** Day-note body of the multi-use calendar side panel. Keyed by date in the parent, so props seed state. */
export function DayNotePanel({date, initialNote, onClose, onChanged}: DayNotePanelProps) {
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hadNote = initialNote.trim().length > 0;

  const handleSave = async () => {
    if (!note.trim()) return;
    setIsSaving(true);
    setError(null);
    const result = await upsertDayNoteAction({date, body: {note: note.trim()}});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setError(null);
    const result = await deleteDayNoteAction(date);
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Day note</SheetTitle>
        <SheetDescription>{date} — a reminder shown across this day on the calendar.</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
        {error ? (
          <p className="rounded-xl border border-[#e7c1bd] bg-[#fbf1ef] px-4 py-3 text-sm text-[#a3483f]">
            {error}
          </p>
        ) : null}

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          autoFocus
          placeholder="e.g. Public holiday — reduced staff"
          className="w-full rounded-xl border border-[#e2d5bf] bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none focus:border-[#cbb390]"
        />
      </div>

      <SheetFooter>
        {hadNote ? (
          <Button
            variant="outline"
            className="h-10 text-[#a3483f]"
            onClick={() => void handleDelete()}
            disabled={isSaving}
          >
            Delete
          </Button>
        ) : null}
        <Button className="h-10" onClick={() => void handleSave()} disabled={isSaving || !note.trim()}>
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Save note
        </Button>
        <Button variant="outline" className="h-10" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </SheetFooter>
    </>
  );
}
