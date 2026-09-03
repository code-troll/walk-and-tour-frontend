import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import HotelEditorClient from "../hotel-editor-client";

export default async function AdminHotelPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
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

  const {id} = await params;

  return <HotelEditorClient mode="edit" hotelId={id} />;
}
