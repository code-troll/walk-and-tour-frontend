"use client";

import {useState} from "react";
import {LoaderCircle, Save} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {EventFormFields} from "@/components/admin/events/EventFormFields";
import {
  createEmptyEventFormState,
  toCreateEventBody,
  validateEventForm,
  type EventFormState,
} from "@/lib/events/admin-event-types";
import {createEventAction} from "@/app/admin/events/actions";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTour = components["schemas"]["TourAdminListResponseDto"];

type CreateEventPanelProps = {
  /** `datetime-local` wall value for the clicked slot, interpreted in `displayTimezone`. */
  startWall: string;
  displayTimezone: string;
  languages: ApiLanguage[];
  tours: ApiTour[];
  onClose: () => void;
  onChanged: () => void;
};

/** Create-event body of the multi-use calendar side panel — the full editor, prefilled to the clicked slot. */
export function CreateEventPanel({
  startWall,
  displayTimezone,
  languages,
  tours,
  onClose,
  onChanged,
}: CreateEventPanelProps) {
  // Keyed by the clicked slot in the parent, so this seeds once per open.
  const [formState, setFormState] = useState<EventFormState>(() => ({
    ...createEmptyEventFormState(),
    timezone: displayTimezone,
    startDate: startWall,
    language: languages[0]?.code ?? "",
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const validationError = validateEventForm(formState);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError(null);
    const result = await createEventAction(toCreateEventBody(formState));
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
        <SheetTitle>New event</SheetTitle>
        <SheetDescription>
          Starts {startWall.replace("T", ", ")} ({displayTimezone}). Details apply to every occurrence.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
        {error ? (
          <p className="rounded-xl border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
            {error}
          </p>
        ) : null}

        <EventFormFields
          formState={formState}
          setFormState={setFormState}
          languages={languages}
          tours={tours}
        />
      </div>

      <SheetFooter>
        <Button className="h-10" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          Create event
        </Button>
        <Button variant="outline" className="h-10" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </SheetFooter>
    </>
  );
}
