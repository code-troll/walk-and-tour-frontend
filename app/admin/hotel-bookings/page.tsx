import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import HotelBookingsListClient from "./hotel-bookings-list-client";

export default async function AdminHotelBookingsPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Hotel bookings are not available for the marketing role."
        description="Hotel bookings are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  return <HotelBookingsListClient />;
}
