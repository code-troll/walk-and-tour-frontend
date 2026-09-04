import type {components} from "@/lib/api/generated/backend-types";

/** One granted tour with its content, as `/api/hotel/tours/:tourId` returns it. */
export type ApiHotelTourDetail =
  components["schemas"]["HotelTourDetailResponseDto"];

export type ApiHotelBooking = components["schemas"]["HotelBookingResponseDto"];
export type ApiHotelBookingList = components["schemas"]["HotelBookingListResponseDto"];
export type ApiHotelBookingLineItem =
  components["schemas"]["HotelBookingLineItemResponseDto"];
export type ApiHotelBookingLog = components["schemas"]["HotelBookingLogResponseDto"];

export type HotelBookingStatus = ApiHotelBooking["status"];

export const HOTEL_BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  invoiced: "Invoiced",
};

/** Backoffice wording, where "pending" means something is waiting on you. */
export const ADMIN_BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  invoiced: "Invoiced",
};

export const HOTEL_BOOKING_STATUS_TONE: Record<
  string,
  "neutral" | "positive" | "warning" | "muted"
> = {
  pending: "warning",
  confirmed: "positive",
  completed: "positive",
  invoiced: "neutral",
  cancelled: "muted",
};

export const BOOKING_STATUS_FILTERS = [
  {value: "", label: "All"},
  {value: "pending", label: "Pending"},
  {value: "confirmed", label: "Confirmed"},
  {value: "completed", label: "Completed"},
  {value: "invoiced", label: "Invoiced"},
  {value: "cancelled", label: "Cancelled"},
] as const;

/**
 * Formats an amount the backend sends as a decimal string.
 *
 * The string is passed through rather than parsed into a number: it is money,
 * and the only reason to touch it here is to group thousands for display.
 */
export const formatBookingAmount = (
  amount: string | null | undefined,
  currency: string,
): string => {
  if (amount === null || amount === undefined) {
    return "Price on request";
  }

  const [whole, fraction = "00"] = amount.split(".");
  const isNegative = whole.startsWith("-");
  const digits = isNegative ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${isNegative ? "-" : ""}${grouped},${fraction} ${currency}`;
};

// ── Booking form ───────────────────────────────────────────────────────

export type BookingFormState = {
  tourId: string;
  date: string;
  time: string;
  languageCode: string;
  participantCount: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  notes: string;
};

export type BookingFormErrors = Partial<Record<keyof BookingFormState, string>>;

export const createEmptyBookingFormState = (): BookingFormState => ({
  tourId: "",
  date: "",
  time: "10:00",
  languageCode: "en",
  participantCount: "2",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  roomNumber: "",
  notes: "",
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d][\s()+\-.\d]*$/;

export const validateBookingForm = (state: BookingFormState): BookingFormErrors => {
  const errors: BookingFormErrors = {};

  if (!state.tourId) {
    errors.tourId = "Choose a tour.";
  }

  if (!state.date) {
    errors.date = "Choose a date.";
  } else if (new Date(`${state.date}T${state.time || "00:00"}`) < new Date()) {
    errors.date = "Choose a date in the future.";
  }

  if (!state.time) {
    errors.time = "Choose a start time.";
  }

  const participants = Number(state.participantCount);

  if (!Number.isInteger(participants) || participants < 1) {
    errors.participantCount = "Enter how many guests are taking part.";
  }

  if (!state.guestName.trim()) {
    errors.guestName = "Enter the guest’s name.";
  }

  if (state.guestEmail.trim() && !EMAIL_PATTERN.test(state.guestEmail.trim())) {
    errors.guestEmail = "Enter a valid email address, or leave it empty.";
  }

  if (state.guestPhone.trim() && !PHONE_PATTERN.test(state.guestPhone.trim())) {
    errors.guestPhone = "Enter a telephone number, or leave it empty.";
  }

  return errors;
};

export type CreateBookingBody = {
  tourId: string;
  scheduledFor: string;
  languageCode: string;
  participantCount: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber?: string;
  notes?: string;
};

export const toCreateBookingBody = (state: BookingFormState): CreateBookingBody => {
  const optional = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  return {
    tourId: state.tourId,
    // The picker is a local wall time; the backend stores an instant.
    scheduledFor: new Date(`${state.date}T${state.time}`).toISOString(),
    languageCode: state.languageCode,
    participantCount: Number(state.participantCount),
    guestName: state.guestName.trim(),
    guestEmail: optional(state.guestEmail),
    guestPhone: optional(state.guestPhone),
    roomNumber: optional(state.roomNumber),
    notes: optional(state.notes),
  };
};
