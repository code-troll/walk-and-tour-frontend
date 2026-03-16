import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { loadToursListData } from "./loaders";
import { AdminToursListClient } from "./tours-list-client";

export default async function AdminToursPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Tour administration is not available for the marketing role."
        description="Tours are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const toursData = await loadToursListData(viewerState.accessToken);

  if ("errorMessage" in toursData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The tours workspace could not be loaded."
        description={ toursData.errorMessage ?? "Unable to load tours." }
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminToursListClient
        initialLanguages={ toursData.languages }
        initialTours={ toursData.tours }
      />
    </div>
  );
}
