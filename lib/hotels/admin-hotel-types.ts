import type {components} from "@/lib/api/generated/backend-types";

// ── API shapes (generated from the backend contract) ───────────────────

export type ApiHotel = components["schemas"]["HotelResponseDto"];
export type ApiHotelSummary = components["schemas"]["HotelSummaryResponseDto"];
export type ApiHotelList = components["schemas"]["HotelListResponseDto"];
export type ApiHotelTourGrant = components["schemas"]["HotelTourGrantResponseDto"];
export type ApiHotelUser = components["schemas"]["HotelUserResponseDto"];

export type HotelStatus = ApiHotel["status"];

export const HOTEL_STATUSES: HotelStatus[] = ["active", "disabled"];

export const HOTEL_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  disabled: "Disabled",
};

export const HOTEL_USER_STATUS_LABELS: Record<string, string> = {
  invited: "Invited",
  active: "Active",
  disabled: "Disabled",
};

export const HOTEL_USER_STATUS_DESCRIPTIONS: Record<string, string> = {
  invited: "The hotel has been emailed a link but has not set a password yet.",
  active: "The hotel has set a password and can sign in.",
  disabled: "Sign-in is blocked. The hotel keeps its data and can be enabled again.",
};

// ── Form state ─────────────────────────────────────────────────────────

export type HotelFormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
  cvr: string;
  status: HotelStatus;
};

export type HotelFormErrors = Partial<Record<keyof HotelFormState, string>>;

export const createEmptyHotelFormState = (): HotelFormState => ({
  name: "",
  address: "",
  phone: "",
  email: "",
  cvr: "",
  status: "active",
});

export const createHotelFormStateFromApi = (hotel: ApiHotel): HotelFormState => ({
  name: hotel.name,
  address: hotel.address,
  phone: hotel.phone,
  email: hotel.email,
  cvr: hotel.cvr,
  status: hotel.status,
});

/**
 * Mirrors the backend's own normalisation so the value shown back to the user
 * is the value that will be stored. A CVR number is often written with spaces
 * or a `DK` prefix, and both spellings refer to the same company.
 */
export const normalizeCvr = (value: string): string =>
  value.replace(/\s+/g, "").replace(/^DK/i, "");

const CVR_PATTERN = /^\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d][\s()+\-.\d]*$/;

export const validateHotelForm = (state: HotelFormState): HotelFormErrors => {
  const errors: HotelFormErrors = {};

  if (!state.name.trim()) {
    errors.name = "Enter the hotel name.";
  } else if (state.name.trim().length > 200) {
    errors.name = "The name can be at most 200 characters long.";
  }

  if (!state.address.trim()) {
    errors.address = "Enter the hotel address.";
  } else if (state.address.trim().length > 500) {
    errors.address = "The address can be at most 500 characters long.";
  }

  const phone = state.phone.trim();

  if (!phone) {
    errors.phone = "Enter a contact telephone number.";
  } else if (phone.length < 5 || !PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a telephone number that can be dialled, for example +45 33 74 14 14.";
  }

  const email = state.email.trim();

  if (!email) {
    errors.email = "Enter a contact email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const cvr = normalizeCvr(state.cvr.trim());

  if (!cvr) {
    errors.cvr = "Enter the CVR number.";
  } else if (!CVR_PATTERN.test(cvr)) {
    errors.cvr = "A Danish CVR number is exactly eight digits.";
  }

  return errors;
};

// ── Request bodies ─────────────────────────────────────────────────────

export type CreateHotelBody = {
  name: string;
  address: string;
  phone: string;
  email: string;
  cvr: string;
  status?: HotelStatus;
};

export type UpdateHotelBody = Partial<CreateHotelBody>;

export const toCreateHotelBody = (state: HotelFormState): CreateHotelBody => ({
  name: state.name.trim(),
  address: state.address.trim(),
  phone: state.phone.trim(),
  email: state.email.trim(),
  cvr: normalizeCvr(state.cvr.trim()),
  status: state.status,
});

export const toUpdateHotelBody = (state: HotelFormState): UpdateHotelBody =>
  toCreateHotelBody(state);
