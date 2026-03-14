import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { getBackendApiBaseUrl } from "@/lib/api/core/backend-env";
import { TourEditorClient } from "../tour-editor-client";
import { loadTourEditorData } from "../loaders";

type AdminEditTourPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditTourPage({
  params,
}: AdminEditTourPageProps) {
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

  const { id } = await params;
  const editorData = await loadTourEditorData({
    accessToken: viewerState.accessToken,
    id,
  });
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if ("errorMessage" in editorData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The tour editor could not be loaded."
        description={editorData.errorMessage ?? "Unable to load the tour editor."}
      />
    );
  }

  if (!editorData.tour) {
    return (
      <AdminNoticeCard
        eyebrow="Tours"
        title="The requested tour could not be found."
        description="Refresh the tours list and reopen the editor from a valid record."
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
      mode="edit"
      availableLanguages={editorData.languages}
      availableTags={editorData.tags}
      initialTour={editorData.tour}
      accessToken={viewerState.accessToken}
      backendApiBaseUrl={backendApiBaseUrl}
    />
  );
}
