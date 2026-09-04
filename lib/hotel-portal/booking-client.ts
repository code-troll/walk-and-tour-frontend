"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {
  ApiHotelBooking,
  ApiHotelBookingList,
} from "@/lib/hotel-portal/booking-types";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getHotelBookingsClient = ({status}: {status?: string} = {}) =>
  fetchJson<ApiHotelBookingList>({
    input: `/api/internal/hotel/bookings${buildQuery({status})}`,
    fallbackMessage: "Unable to load your bookings.",
  });

export const getHotelBookingClient = (id: string) =>
  fetchJson<ApiHotelBooking | null>({
    input: `/api/internal/hotel/bookings/${id}`,
    fallbackMessage: "Unable to load this booking.",
    notFoundFallback: null,
  });
