"use client";

import {useEffect, useState} from "react";
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
import type {components} from "@/lib/api/generated/backend-types";
import {
  createEmptyBookingFormState,
  toCreateBookingBody,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormState,
} from "@/lib/hotel-portal/booking-types";
import {PortalTourDetail} from "@/components/hotel-portal/PortalTourDetail";
import {createBookingAction, getTourDetailAction} from "../../actions";
import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";
import {controlClassName} from "@/components/ui/control-class";

type ViewerTour = components["schemas"]["HotelViewerTourDto"];

const LANGUAGES = [
  {value: "en", label: "English"},
  {value: "es", label: "Spanish"},
  {value: "it", label: "Italian"},
];

/** Field-level problems borrow the alert colour, which is the only red on this screen besides the submit. */
const FieldError = ({message}: {message: string}) => (
  <p className="mt-1 text-xs text-[var(--wt-danger)]">{message}</p>
);

export default function BookingFormClient({tours}: {tours: ViewerTour[]}) {
  const router = useRouter();
  const [tourDetail, setTourDetail] = useState<ApiHotelTourDetail | null>(null);
  const [isLoadingTour, setIsLoadingTour] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);
  const [form, setForm] = useState<BookingFormState>(() => ({
    ...createEmptyBookingFormState(),
    tourId: tours.length === 1 ? tours[0].tourId : "",
  }));
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Load the chosen tour's content.
   *
   * `cancelled` rather than an AbortController because the request goes through
   * a server action: switching tours twice quickly would otherwise let the first
   * response land last and describe the wrong tour.
   */
  useEffect(() => {
    if (!form.tourId) {
      setTourDetail(null);
      setTourError(null);
      return;
    }

    let cancelled = false;

    setIsLoadingTour(true);
    setTourError(null);

    void getTourDetailAction(form.tourId).then((result) => {
      if (cancelled) {
        return;
      }

      setIsLoadingTour(false);

      if (result.ok) {
        setTourDetail(result.tour);
      } else {
        setTourDetail(null);
        setTourError("Tour details are unavailable right now.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [form.tourId]);

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
            <Label htmlFor="booking-tour">Tour</Label>
            <select
              className={controlClassName}
              id="booking-tour"
              onChange={(event) => update("tourId", event.target.value)}
              value={form.tourId}
            >
              <option value="">Choose a tour…</option>
              {tours.map((tour) => (
                <option key={tour.tourId} value={tour.tourId}>
                  {tour.tourName}
                  {tour.priceAmount ? ` — ${tour.priceAmount} ${tour.currency}` : ""}
                </option>
              ))}
            </select>
            {errors.tourId ? <FieldError message={errors.tourId} /> : null}

            {isLoadingTour ? (
              <p className="mt-6 text-sm text-[var(--wt-ink-muted)]">Loading tour details…</p>
            ) : null}
            {tourDetail ? <PortalTourDetail tour={tourDetail} /> : null}
            {/*
              A tour that will not load is not a reason to block the booking:
              the hotel already knows which tour it wants, and the detail is
              there to help describe it, not to authorise it.
            */}
            {tourError ? (
              <p className="mt-6 text-sm text-[var(--wt-ink-muted)]">{tourError}</p>
            ) : null}
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
    </div>
  );
}
