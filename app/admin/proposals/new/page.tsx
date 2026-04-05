import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {ProposalEditorClient} from "../[id]/proposal-editor-client";

export default async function AdminNewProposalPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const backendApiBaseUrl = getBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backend URL is not configured."
        description="Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL to use the proposal editor."
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProposalEditorClient
        proposalId={null}
        accessToken={viewerState.accessToken}
        backendApiBaseUrl={backendApiBaseUrl}
      />
    </div>
  );
}
