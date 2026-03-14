"use server";

import type {components} from "@/lib/api/generated/backend-types";
import {createAdminApi} from "@/lib/api/admin";
import {getAdminViewerState} from "@/lib/admin/session";

type ApiTag = components["schemas"]["TagResponseDto"];
type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type CreateTagBody = components["schemas"]["CreateTagDto"];
type UpdateTagBody = components["schemas"]["UpdateTagDto"];
type CreateLanguageBody = components["schemas"]["CreateLanguageDto"];
type UpdateLanguageBody = components["schemas"]["UpdateLanguageDto"];

const getTaxonomyAdminApi = async () => {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    throw new Error("Authentication required.");
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    throw new Error("You do not have access to taxonomy administration.");
  }

  return {
    adminApi: createAdminApi(viewerState.accessToken),
    canManageLanguages: viewerState.backendAdmin.roleName === "super_admin",
  };
};

export async function fetchTaxonomyAction(): Promise<{
  tags: ApiTag[];
  languages: ApiLanguage[];
}> {
  const {adminApi, canManageLanguages} = await getTaxonomyAdminApi();
  const [tags, languages] = await Promise.all([
    adminApi.getTags(),
    canManageLanguages ? adminApi.getLanguages() : Promise.resolve([]),
  ]);

  return {
    tags,
    languages,
  };
}

export async function createTagAction(body: CreateTagBody) {
  const {adminApi} = await getTaxonomyAdminApi();
  return adminApi.createTag(body);
}

export async function updateTagAction({
  body,
  key,
}: {
  body: UpdateTagBody;
  key: string;
}) {
  const {adminApi} = await getTaxonomyAdminApi();
  return adminApi.updateTag({body, key});
}

export async function deleteTagAction(key: string) {
  const {adminApi} = await getTaxonomyAdminApi();
  return adminApi.deleteTag(key);
}

export async function createLanguageAction(body: CreateLanguageBody) {
  const {adminApi, canManageLanguages} = await getTaxonomyAdminApi();

  if (!canManageLanguages) {
    throw new Error("Only super admins can create locales.");
  }

  return adminApi.createLanguage(body);
}

export async function updateLanguageAction({
  body,
  code,
}: {
  body: UpdateLanguageBody;
  code: string;
}) {
  const {adminApi, canManageLanguages} = await getTaxonomyAdminApi();

  if (!canManageLanguages) {
    throw new Error("Only super admins can update locales.");
  }

  return adminApi.updateLanguage({body, code});
}
