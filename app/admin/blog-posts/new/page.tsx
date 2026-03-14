import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { getBackendApiBaseUrl } from "@/lib/api/core/backend-env";
import { BlogPostEditorClient } from "../blog-editor-client";
import { loadBlogPostEditorData } from "../loaders";

export default async function AdminNewBlogPostPage() {
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

  const editorData = await loadBlogPostEditorData({
    accessToken: viewerState.accessToken,
  });
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if ("errorMessage" in editorData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The new blog post workspace could not be loaded."
        description={ editorData.errorMessage ?? "Unable to load the new blog post workspace." }
      />
    );
  }

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
      mode="create"
      availableLanguages={ editorData.languages }
      availableTags={ editorData.tags }
      accessToken={ viewerState.accessToken }
      backendApiBaseUrl={ backendApiBaseUrl }
    />
  );
}
