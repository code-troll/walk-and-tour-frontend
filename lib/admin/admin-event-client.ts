"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {ApiCalendarItem, ApiDayNote, ApiEvent} from "@/lib/events/admin-event-types";

export const getAdminEventsClient = () =>
  fetchJson<ApiEvent[]>({
    input: "/api/internal/admin/events",
    fallbackMessage: "Unable to load events.",
  });

export const getAdminEventClient = (id: string) =>
  fetchJson<ApiEvent | null>({
    input: `/api/internal/admin/events/${id}`,
    fallbackMessage: "Unable to load the event.",
    notFoundFallback: null,
  });

export const getAdminEventsCalendarClient = (fromIso: string, toIso: string) =>
  fetchJson<ApiCalendarItem[]>({
    input: `/api/internal/admin/events/calendar?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
    fallbackMessage: "Unable to load the calendar.",
  });

export const getAdminDayNotesClient = (fromIso: string, toIso: string) =>
  fetchJson<ApiDayNote[]>({
    input: `/api/internal/admin/events/day-notes?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
    fallbackMessage: "Unable to load day notes.",
  });
