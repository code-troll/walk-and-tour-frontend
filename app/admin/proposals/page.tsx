import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {AdminProposalsListClient} from "./proposals-list-client";

export default async function AdminProposalsPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Proposal administration is not available for the marketing role."
        description="Proposals are restricted to super admins and editors."
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminProposalsListClient/>
    </div>
  );
}
