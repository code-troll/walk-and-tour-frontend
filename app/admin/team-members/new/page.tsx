import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {TeamMemberEditorClient} from "../team-member-editor-client";

export default async function AdminNewTeamMemberPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Team member administration is not available for the marketing role."
        description="Team members are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (!backendApiBaseUrl) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backend URL is not configured."
        description="Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL to use the team member editor."
      />
    );
  }

  return (
    <TeamMemberEditorClient
      mode="create"
      accessToken={viewerState.accessToken}
      backendApiBaseUrl={backendApiBaseUrl}
    />
  );
}
