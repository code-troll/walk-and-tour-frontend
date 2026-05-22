import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import TeamMembersListClient from "./team-members-list-client";

export default async function AdminTeamMembersPage() {
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

  return <TeamMembersListClient />;
}
