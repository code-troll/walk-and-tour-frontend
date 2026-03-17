import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import AdminUsersClient from "./users-client";

export default async function AdminUsersPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName !== "super_admin") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="User administration is restricted to super admins."
        description="The backend role matrix controls this page. Editors and marketing admins cannot list or manage admin users."
      />
    );
  }

  return <AdminUsersClient/>;
}
