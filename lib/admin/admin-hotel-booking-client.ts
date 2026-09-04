"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {
  ApiHotelBooking,
  ApiHotelBookingList,
} from "@/lib/hotel-portal/booking-types";

const buildQuery = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getAdminHotelBookingsClient = ({
  hotelId,
  status,
}: {hotelId?: string; status?: string} = {}) =>
  fetchJson<ApiHotelBookingList>({
    input: `/api/internal/admin/hotel-bookings${buildQuery({hotelId, status})}`,
    fallbackMessage: "Unable to load hotel bookings.",
  });

export const getAdminHotelBookingClient = (id: string) =>
  fetchJson<ApiHotelBooking | null>({
    input: `/api/internal/admin/hotel-bookings/${id}`,
    fallbackMessage: "Unable to load this booking.",
    notFoundFallback: null,
  });
