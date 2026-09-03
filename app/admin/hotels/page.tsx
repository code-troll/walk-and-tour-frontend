import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import HotelsListClient from "./hotels-list-client";

export default async function AdminHotelsPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName !== "super_admin") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Hotel administration is restricted to super admins."
        description="Registering hotels and granting them tours is limited to the super admin role by the backend role matrix."
      />
    );
  }

  return <HotelsListClient />;
}
