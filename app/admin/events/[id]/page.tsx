import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {EventEditorClient} from "../event-editor-client";

type AdminEditEventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditEventPage({params}: AdminEditEventPageProps) {
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

  const {id} = await params;
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

  return <EventEditorClient mode="edit" eventId={id} />;
}
