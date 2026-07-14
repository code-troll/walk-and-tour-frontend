"use client";

import {useState} from "react";
import {LoaderCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {deleteDayNoteAction, upsertDayNoteAction} from "@/app/admin/events/actions";

type DayNoteDialogProps = {
  /** `YYYY-MM-DD` when open, null when closed. */
  date: string | null;
  initialNote: string;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

export function DayNoteDialog({date, initialNote, onOpenChange, onChanged}: DayNoteDialogProps) {
  // Parent remounts this dialog per date (via `key`), so props seed initial state.
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hadNote = initialNote.trim().length > 0;

  const handleSave = async () => {
    if (!date || !note.trim()) return;
    setIsSaving(true);
    setError(null);
    const result = await upsertDayNoteAction({date, body: {note: note.trim()}});
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  const handleDelete = async () => {
    if (!date) return;
    setIsSaving(true);
    setError(null);
    const result = await deleteDayNoteAction(date);
    setIsSaving(false);
    if (result.ok) {
      onChanged();
      onOpenChange(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day note</DialogTitle>
          <DialogDescription>{date ?? ""} — a reminder shown across this day on the calendar.</DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          {hadNote ? (
            <Button
              variant="outline"
              className="mr-auto h-10 text-[#a3483f]"
              onClick={() => void handleDelete()}
              disabled={isSaving}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="outline" className="h-10" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="h-10" onClick={() => void handleSave()} disabled={isSaving || !note.trim()}>
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
