import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import { getAdminViewerState } from "@/lib/admin/session";
import { TaxonomyClient } from "./taxonomy-client";

const loadTaxonomyData = async ({
  accessToken,
  roleName,
}: {
  accessToken: string;
  roleName: "super_admin" | "editor";
}) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [tags, languages] = await Promise.all([
      adminApi.getTags(),
      roleName === "super_admin" ? adminApi.getLanguages() : Promise.resolve([]),
    ]);

    return {
      languages,
      tags,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load taxonomy data.",
    };
  }
};

export default async function AdminTaxonomyPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Taxonomy administration is not available for the marketing role."
        description="Tags and locales are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const taxonomyData = await loadTaxonomyData({
    accessToken: viewerState.accessToken,
    roleName: viewerState.backendAdmin.roleName,
  });

  if ("errorMessage" in taxonomyData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The taxonomy workspace could not be loaded."
        description={taxonomyData.errorMessage ?? "Unable to load taxonomy data."}
      />
    );
  }

  return (
    <TaxonomyClient
      initialTags={taxonomyData.tags}
      initialLanguages={taxonomyData.languages}
      canManageLanguages={viewerState.backendAdmin.roleName === "super_admin"}
    />
  );
}
