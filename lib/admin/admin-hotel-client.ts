"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {ApiHotel, ApiHotelList, ApiHotelUser} from "@/lib/hotels/admin-hotel-types";

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

export const getAdminHotelsClient = ({
  search,
  status,
  page,
  limit,
}: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) =>
  fetchJson<ApiHotelList>({
    input: `/api/internal/admin/hotels${buildQuery({search, status, page, limit})}`,
    fallbackMessage: "Unable to load hotels.",
  });

export const getAdminHotelClient = (id: string) =>
  fetchJson<ApiHotel | null>({
    input: `/api/internal/admin/hotels/${id}`,
    fallbackMessage: "Unable to load the hotel.",
    notFoundFallback: null,
  });

export const getAdminHotelUserClient = (hotelId: string) =>
  fetchJson<ApiHotelUser | null>({
    input: `/api/internal/admin/hotels/${hotelId}/user`,
    fallbackMessage: "Unable to load the hotel access user.",
    notFoundFallback: null,
  });
