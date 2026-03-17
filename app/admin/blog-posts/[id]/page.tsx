import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { getBackendApiBaseUrl } from "@/lib/api/core/backend-env";
import { BlogPostEditorClient } from "../blog-editor-client";

type AdminEditBlogPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditBlogPostPage({
  params,
}: AdminEditBlogPostPageProps) {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Blog post administration is not available for the marketing role."
        description="Blog posts are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const { id } = await params;
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (!backendApiBaseUrl) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backend URL is not configured."
        description="Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL to use the blog editor."
      />
    );
  }

  return (
    <BlogPostEditorClient
      mode="edit"
      availableLanguages={ [] }
      availableTags={ [] }
      accessToken={ viewerState.accessToken }
      backendApiBaseUrl={ backendApiBaseUrl }
      blogPostId={ id }
    />
  );
}
