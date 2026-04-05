import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getAdminViewerState} from "@/lib/admin/session";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {ProposalEditorClient} from "./proposal-editor-client";

type ProposalEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProposalEditorPage({params}: ProposalEditorPageProps) {
  const viewerState = await getAdminViewerState();
  const {id} = await params;

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
        proposalId={id}
        accessToken={viewerState.accessToken}
        backendApiBaseUrl={backendApiBaseUrl}
      />
    </div>
  );
}
