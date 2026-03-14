import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import { getBackendApiBaseUrl } from "@/lib/api/core/backend-env";
import { BlogPostEditorClient } from "../blog-editor-client";
import { loadBlogPostEditorData } from "../loaders";

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
  const editorData = await loadBlogPostEditorData({
    accessToken: viewerState.accessToken,
    id,
  });
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if ("errorMessage" in editorData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The blog post editor could not be loaded."
        description={ editorData.errorMessage ?? "Unable to load the blog post editor." }
      />
    );
  }

  if (!editorData.blogPost) {
    return (
      <AdminNoticeCard
        eyebrow="Blog posts"
        title="The requested blog post could not be found."
        description="Refresh the blog posts list and reopen the editor from a valid record."
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
      mode="edit"
      availableLanguages={ editorData.languages }
      availableTags={ editorData.tags }
      initialBlogPost={ editorData.blogPost }
      accessToken={ viewerState.accessToken }
      backendApiBaseUrl={ backendApiBaseUrl }
    />
  );
}
