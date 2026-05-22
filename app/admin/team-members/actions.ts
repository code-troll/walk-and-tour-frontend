"use server";

import {getAdminViewerState} from "@/lib/admin/session";
import {requireBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import type {
  ApiTeamMember,
  CreateTeamMemberBody,
  CreateTeamMemberTranslationBody,
  UpdateTeamMemberBody,
  UpdateTeamMemberTranslationBody,
} from "@/lib/team-members/admin-team-member-types";

type TeamMemberActionError = {
  ok: false;
  statusCode: number;
  message: string;
};

type TeamMemberActionSuccess = {
  ok: true;
  member: ApiTeamMember;
};

type TeamMemberDeleteSuccess = {
  ok: true;
};

export type TeamMemberActionResult = TeamMemberActionSuccess | TeamMemberActionError;
export type TeamMemberDeleteResult = TeamMemberDeleteSuccess | TeamMemberActionError;

const getAdminContext = async (): Promise<
  | {ok: true; accessToken: string; backendApiBaseUrl: string}
  | TeamMemberActionError
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
    return {ok: false, statusCode: 403, message: "You do not have access to team member administration."};
  }

  return {
    ok: true,
    accessToken: viewerState.accessToken,
    backendApiBaseUrl: requireBackendApiBaseUrl(),
  };
};

const teamMemberFetch = async <T>(
  path: string,
  method: string,
  accessToken: string,
  backendApiBaseUrl: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(`${backendApiBaseUrl}/api/admin/team-members${path}`, {
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

const toActionError = (error: unknown, fallbackMessage: string): TeamMemberActionError => ({
  ok: false,
  statusCode: 500,
  message: error instanceof Error ? error.message : fallbackMessage,
});

export async function createTeamMemberAction(
  body: CreateTeamMemberBody,
): Promise<TeamMemberActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    const member = await teamMemberFetch<ApiTeamMember>(
      "",
      "POST",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, member};
  } catch (error) {
    return toActionError(error, "Unable to create the team member.");
  }
}

export async function updateTeamMemberAction({
  id,
  body,
}: {
  id: string;
  body: UpdateTeamMemberBody;
}): Promise<TeamMemberActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    const member = await teamMemberFetch<ApiTeamMember>(
      `/${id}`,
      "PATCH",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, member};
  } catch (error) {
    return toActionError(error, "Unable to update the team member.");
  }
}

export async function deleteTeamMemberAction(id: string): Promise<TeamMemberDeleteResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    await teamMemberFetch<void>(
      `/${id}`,
      "DELETE",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
    );
    return {ok: true};
  } catch (error) {
    return toActionError(error, "Unable to delete the team member.");
  }
}

export async function setTeamMemberPhotoAction({
  id,
  mediaId,
}: {
  id: string;
  mediaId: string;
}): Promise<TeamMemberActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    const member = await teamMemberFetch<ApiTeamMember>(
      `/${id}/photo`,
      "POST",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      {mediaId},
    );
    return {ok: true, member};
  } catch (error) {
    return toActionError(error, "Unable to set the team member photo.");
  }
}



export async function createTeamMemberTranslationAction({
  id,
  body,
}: {
  id: string;
  body: CreateTeamMemberTranslationBody;
}): Promise<TeamMemberActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    const member = await teamMemberFetch<ApiTeamMember>(
      `/${id}/translations`,
      "POST",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, member};
  } catch (error) {
    return toActionError(error, "Unable to create the translation.");
  }
}

export async function updateTeamMemberTranslationAction({
  id,
  languageCode,
  body,
}: {
  id: string;
  languageCode: string;
  body: UpdateTeamMemberTranslationBody;
}): Promise<TeamMemberActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    const member = await teamMemberFetch<ApiTeamMember>(
      `/${id}/translations/${languageCode}`,
      "PATCH",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
      body,
    );
    return {ok: true, member};
  } catch (error) {
    return toActionError(error, "Unable to update the translation.");
  }
}

export async function deleteTeamMemberTranslationAction({
  id,
  languageCode,
}: {
  id: string;
  languageCode: string;
}): Promise<TeamMemberDeleteResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return ctx;

  try {
    await teamMemberFetch<void>(
      `/${id}/translations/${languageCode}`,
      "DELETE",
      ctx.accessToken,
      ctx.backendApiBaseUrl,
    );
    return {ok: true};
  } catch (error) {
    return toActionError(error, "Unable to delete the translation.");
  }
}
