import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { getAdminViewerState } from "@/lib/admin/session";
import AdminBlogPostsListClient from "./blog-posts-list-client";

export default async function AdminBlogPostsPage() {
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

  return <AdminBlogPostsListClient/>;
}
