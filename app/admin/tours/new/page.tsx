import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { getBackendApiBaseUrl } from "@/lib/api/core/backend-env";
import { TourEditorClient } from "../tour-editor-client";
import { loadTourEditorData } from "../loaders";

export default async function AdminNewTourPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Tour administration is not available for the marketing role."
        description="Tours are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const editorData = await loadTourEditorData({
    accessToken: viewerState.accessToken,
  });
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if ("errorMessage" in editorData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The new tour workspace could not be loaded."
        description={editorData.errorMessage ?? "Unable to load the new tour workspace."}
      />
    );
  }

  if (!backendApiBaseUrl) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backend URL is not configured."
        description="Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL to use the tour editor."
      />
    );
  }

  return (
    <TourEditorClient
      mode="create"
      availableLanguages={editorData.languages}
      availableTags={editorData.tags}
      accessToken={viewerState.accessToken}
      backendApiBaseUrl={backendApiBaseUrl}
    />
  );
}
