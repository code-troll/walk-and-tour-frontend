import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import HotelBookingDetailClient from "../hotel-booking-detail-client";

export default async function AdminHotelBookingPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
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

  const {id} = await params;

  return <HotelBookingDetailClient bookingId={id} />;
}
