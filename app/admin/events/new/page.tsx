import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {EventEditorClient} from "../event-editor-client";

export default async function AdminNewEventPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Event administration is not available for the marketing role."
        description="Events are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (!backendApiBaseUrl) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backend URL is not configured."
        description="Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL to use the event editor."
      />
    );
  }

  return <EventEditorClient mode="create" />;
}
