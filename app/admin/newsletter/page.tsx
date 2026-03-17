import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import AdminNewsletterClient from "./newsletter-client";

export default async function AdminNewsletterPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "editor") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Newsletter operations are not available for the editor role."
        description="The backend grants newsletter access only to super admins and marketing admins."
      />
    );
  }

  return <AdminNewsletterClient/>;
}
