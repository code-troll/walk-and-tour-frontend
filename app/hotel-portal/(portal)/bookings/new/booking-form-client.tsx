"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {ArrowLeft, LoaderCircle} from "lucide-react";

import {
  PortalAlert,
  PortalSection,
  portalPrimaryAction,
  portalQuietAction,
} from "@/components/hotel-portal/PortalUi";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
  createEmptyBookingFormState,
  toCreateBookingBody,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormState,
} from "@/lib/hotel-portal/booking-types";
import {PortalTourDetail} from "@/components/hotel-portal/PortalTourDetail";
import {PortalTourFinder} from "@/components/hotel-portal/PortalTourFinder";
import {createBookingAction} from "../../actions";
import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";
import {controlClassName} from "@/components/ui/control-class";



const LANGUAGES = [
  {value: "en", label: "English"},
  {value: "es", label: "Spanish"},
  {value: "it", label: "Italian"},
];

/** Field-level problems borrow the alert colour, which is the only red on this screen besides the submit. */
const FieldError = ({message}: {message: string}) => (
  <p className="mt-1 text-xs text-[var(--wt-danger)]">{message}</p>
);

export default function BookingFormClient({tours}: {tours: ApiHotelTourDetail[]}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<BookingFormState>(() => ({
    ...createEmptyBookingFormState(),
    tourId: tours.length === 1 ? tours[0].tourId : "",
  }));
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTour = tours.find((tour) => tour.tourId === form.tourId) ?? null;

  const update = <K extends keyof BookingFormState>(key: K, value: BookingFormState[K]) => {
    setForm((current) => ({...current, [key]: value}));
    setErrors((current) => ({...current, [key]: undefined}));
  };

  const handleSubmit = async () => {
    const validation = validateBookingForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const result = await createBookingAction(toCreateBookingBody(form));

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      router.push(`/bookings/${result.booking.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link className={portalQuietAction} href="/bookings">
        <ArrowLeft className="size-4" />
        Bookings
      </Link>

      {formError ? <PortalAlert>{formError}</PortalAlert> : null}

      {/*
        Two steps, in the order the conversation actually happens: find the tour
        the guest is asking for, then book it. The form does not appear until
        there is something to book — a dozen empty fields under an unanswered
        question is the shape that made people pick a name and hope.
      */}
      {selectedTour === null ? (
        <PortalSection
          title="Book a tour"
          description="Find the tour your guest is asking for. You can search by a place on the itinerary, a theme or a landmark."
        >
          <PortalTourFinder
            onQueryChange={setQuery}
            onSelect={(tourId) => update("tourId", tourId)}
            query={query}
            tours={tours}
          />
        </PortalSection>
      ) : (
      <PortalSection
        title="Book a tour"
        description="Walk and Tour confirms every booking. You will see the price here, and it stays an estimate until the booking is invoiced."
        actions={
          <button
            className={portalPrimaryAction}
            disabled={isSaving}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Place booking
          </button>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            {/*
              The tour is chosen, not typed into a field, so it is shown as what
              it is — a decision already made — with the way back beside it.
            */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-base font-medium text-[var(--wt-ink)]">{selectedTour?.name}</p>
              <button
                className={portalQuietAction}
                onClick={() => {
                  update("tourId", "");
                  setQuery("");
                }}
                type="button"
              >
                Choose a different tour
              </button>
            </div>
            {errors.tourId ? <FieldError message={errors.tourId} /> : null}
            {selectedTour ? <PortalTourDetail tour={selectedTour} /> : null}
          </div>

          <div>
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              onChange={(event) => update("date", event.target.value)}
              type="date"
              value={form.date}
            />
            {errors.date ? <FieldError message={errors.date} /> : null}
          </div>

          <div>
            <Label htmlFor="booking-time">Start time</Label>
            <Input
              id="booking-time"
              onChange={(event) => update("time", event.target.value)}
              type="time"
              value={form.time}
            />
            {errors.time ? <FieldError message={errors.time} /> : null}
          </div>

          <div>
            <Label htmlFor="booking-language">Language</Label>
            <select
              className={controlClassName}
              id="booking-language"
              onChange={(event) => update("languageCode", event.target.value)}
              value={form.languageCode}
            >
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="booking-participants">Guests</Label>
            <Input
              id="booking-participants"
              min={1}
              onChange={(event) => update("participantCount", event.target.value)}
              type="number"
              value={form.participantCount}
            />
            {errors.participantCount ? (
              <FieldError message={errors.participantCount} />
            ) : null}
          </div>

          <div>
            <Label htmlFor="booking-guest">Guest name</Label>
            <Input
              id="booking-guest"
              onChange={(event) => update("guestName", event.target.value)}
              placeholder="Anders Jensen"
              value={form.guestName}
            />
            {errors.guestName ? <FieldError message={errors.guestName} /> : null}
          </div>

          <div>
            <Label htmlFor="booking-room">Room number</Label>
            <Input
              id="booking-room"
              onChange={(event) => update("roomNumber", event.target.value)}
              placeholder="412"
              value={form.roomNumber}
            />
            <p className="mt-1 text-xs text-[var(--wt-ink-muted)]">Optional. Helps the guide find them.</p>
          </div>

          <div>
            <Label htmlFor="booking-email">Guest email</Label>
            <Input
              id="booking-email"
              onChange={(event) => update("guestEmail", event.target.value)}
              placeholder="guest@example.com"
              type="email"
              value={form.guestEmail}
            />
            {errors.guestEmail ? <FieldError message={errors.guestEmail} /> : null}
          </div>

          <div>
            <Label htmlFor="booking-phone">Guest telephone</Label>
            <Input
              id="booking-phone"
              onChange={(event) => update("guestPhone", event.target.value)}
              placeholder="+45 20 11 22 33"
              value={form.guestPhone}
            />
            {errors.guestPhone ? <FieldError message={errors.guestPhone} /> : null}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="booking-notes">Notes for the guide</Label>
            <Textarea
              id="booking-notes"
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Mobility needs, allergies, a birthday — anything the guide should know."
              rows={3}
              value={form.notes}
            />
          </div>
        </div>
      </PortalSection>
      )}
    </div>
  );
}
