import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import EventsListClient from "./events-list-client";

export default async function AdminEventsPage() {
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

  return <EventsListClient />;
}
