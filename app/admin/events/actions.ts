"use server";

import {getAdminViewerState} from "@/lib/admin/session";
import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import type {
  ApiDayNote,
  ApiEvent,
  ApiOccurrence,
  ConfirmOccurrenceBody,
  CreateEventBody,
  UpdateEventBody,
  UpdateOccurrenceBody,
  UpsertDayNoteBody,
} from "@/lib/events/admin-event-types";

type EventActionError = {
  ok: false;
  statusCode: number;
  message: string;
};

type EventActionSuccess = {ok: true; event: ApiEvent};
type OccurrenceActionSuccess = {ok: true; occurrence: ApiOccurrence};
type DayNoteActionSuccess = {ok: true; dayNote: ApiDayNote};
type DeleteSuccess = {ok: true};

export type EventActionResult = EventActionSuccess | EventActionError;
export type OccurrenceActionResult = OccurrenceActionSuccess | EventActionError;
export type DayNoteActionResult = DayNoteActionSuccess | EventActionError;
export type EventDeleteResult = DeleteSuccess | EventActionError;

const getAdminContext = async (): Promise<
  {ok: true; accessToken: string; backendApiBaseUrl: string} | EventActionError
> => {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind === "unauthenticated") {
    return {ok: false, statusCode: 401, message: "Authentication required."};
  }

  if (viewerState.kind === "backend-error") {
    return {ok: false, statusCode: viewerState.statusCode, message: viewerState.message};
  }

  if (viewerState.kind !== "authenticated") {
    return {ok: false, statusCode: 503, message: "Unable to initialize the admin session."};
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return {ok: false, statusCode: 403, message: "You do not have access to event administration."};
  }

  return {
    ok: true,
    accessToken: viewerState.accessToken,
    backendApiBaseUrl: requireBackendApiBaseUrl(),
  };
};

const eventFetch = async <T>(
  path: string,
  method: string,
  accessToken: string,
  backendApiBaseUrl: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(`${backendApiBaseUrl}/api/admin/events${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? {"Content-Type": "application/json"} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(formatBackendErrorMessage(payload, "Backend request failed."));
  }

  return payload as T;
};

const toActionError = (error: unknown, fallbackMessage: string): EventActionError => ({
  ok: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallbackMessage,
});

// ── Events ─────────────────────────────────────────────────────────────

export async function createEventAction(body: CreateEventBody): Promise<EventActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const event = await eventFetch<ApiEvent>("", "POST", ctx.accessToken, ctx.backendApiBaseUrl, body);
    return {ok: true, event};
  } catch (error) {
    return toActionError(error, "Unable to create the event.");
  }
}

export async function updateEventAction({
  id,
  body,
}: {
  id: string;
  body: UpdateEventBody;
}): Promise<EventActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const event = await eventFetch<ApiEvent>(`/${id}`, "PATCH", ctx.accessToken, ctx.backendApiBaseUrl, body);
    return {ok: true, event};
  } catch (error) {
    return toActionError(error, "Unable to update the event.");
  }
}

export async function cancelEventAction(id: string): Promise<EventActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const event = await eventFetch<ApiEvent>(`/${id}/cancel`, "POST", ctx.accessToken, ctx.backendApiBaseUrl);
    return {ok: true, event};
  } catch (error) {
    return toActionError(error, "Unable to cancel the event.");
  }
}

export async function deleteEventAction(id: string): Promise<EventDeleteResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    await eventFetch<void>(`/${id}`, "DELETE", ctx.accessToken, ctx.backendApiBaseUrl);
    return {ok: true};
  } catch (error) {
    return toActionError(error, "Unable to delete the event.");
  }
}

// ── Occurrences ────────────────────────────────────────────────────────

export async function confirmOccurrenceAction({
  eventId,
  body,
}: {
  eventId: string;
  body: ConfirmOccurrenceBody;
}): Promise<OccurrenceActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const occurrence = await eventFetch<ApiOccurrence>(
      `/${eventId}/occurrences`,
      "POST",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, occurrence};
  } catch (error) {
    return toActionError(error, "Unable to confirm the occurrence.");
  }
}

export async function updateOccurrenceAction({
  eventId,
  occurrenceId,
  body,
}: {
  eventId: string;
  occurrenceId: string;
  body: UpdateOccurrenceBody;
}): Promise<OccurrenceActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const occurrence = await eventFetch<ApiOccurrence>(
      `/${eventId}/occurrences/${occurrenceId}`,
      "PATCH",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, occurrence};
  } catch (error) {
    return toActionError(error, "Unable to update the occurrence.");
  }
}

export async function cancelOccurrenceAction({
  eventId,
  occurrenceId,
}: {
  eventId: string;
  occurrenceId: string;
}): Promise<OccurrenceActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const occurrence = await eventFetch<ApiOccurrence>(
      `/${eventId}/occurrences/${occurrenceId}/cancel`,
      "POST",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
    );
    return {ok: true, occurrence};
  } catch (error) {
    return toActionError(error, "Unable to cancel the occurrence.");
  }
}

export async function deleteOccurrenceAction({
  eventId,
  occurrenceId,
}: {
  eventId: string;
  occurrenceId: string;
}): Promise<EventDeleteResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    await eventFetch<void>(
      `/${eventId}/occurrences/${occurrenceId}`,
      "DELETE",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
    );
    return {ok: true};
  } catch (error) {
    return toActionError(error, "Unable to delete the occurrence.");
  }
}

// ── Day notes ──────────────────────────────────────────────────────────

export async function upsertDayNoteAction({
  date,
  body,
}: {
  date: string;
  body: UpsertDayNoteBody;
}): Promise<DayNoteActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    const dayNote = await eventFetch<ApiDayNote>(
      `/day-notes/${date}`,
      "PUT",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, dayNote};
  } catch (error) {
    return toActionError(error, "Unable to save the day note.");
  }
}

export async function deleteDayNoteAction(date: string): Promise<EventDeleteResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;
  try {
    await eventFetch<void>(`/day-notes/${date}`, "DELETE", ctx.accessToken, ctx.backendApiBaseUrl);
    return {ok: true};
  } catch (error) {
    return toActionError(error, "Unable to delete the day note.");
  }
}
