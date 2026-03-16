import { Pencil, Plus } from "lucide-react";
import { AdminProgressLink } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { getAdminViewerState } from "@/lib/admin/session";
import { loadBlogPostsListData } from "./loaders";

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

  const blogPostsData = await loadBlogPostsListData(viewerState.accessToken);

  if ("errorMessage" in blogPostsData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The blog posts workspace could not be loaded."
        description={ blogPostsData.errorMessage ?? "Unable to load blog posts." }
      />
    );
  }

  const languageNameByCode = Object.fromEntries(
    blogPostsData.languages.map((language) => [language.code, language.name]),
  );

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Blog posts"
        description="Create shared blog records, manage localized content, and publish each locale independently from the backend contract."
        actions={
          <Button asChild>
            <AdminProgressLink href="/blog-posts/new">
              <Plus className="size-4"/>
              Create Blog Post
            </AdminProgressLink>
          </Button>
        }
      >
        { blogPostsData.blogPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <p>No blog posts have been created yet.</p>
            <Button asChild className="mt-4">
              <AdminProgressLink href="/blog-posts/new">
                <Plus className="size-4"/>
                Create your first blog post
              </AdminProgressLink>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            { blogPostsData.blogPosts.map((post) => (
              <article
                key={ post.id }
                className="rounded-2xl border border-[#f0e6d8] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-foreground">{ post.name }</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="truncate">Slug: { post.slug }</span>
                      <span>{ Object.keys(post.translations).length } translations</span>
                      <span>{ post.tagKeys.length } tags</span>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <AdminProgressLink href={ `/blog-posts/${ post.id }` }>
                      <Pencil className="size-4"/>
                      Edit
                    </AdminProgressLink>
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  { post.translationAvailability.map((availability) => (
                    <span
                      key={ availability.languageCode }
                      className="rounded-full border border-[#eadfce] px-3 py-1 text-xs text-muted-foreground"
                    >
                      { languageNameByCode[availability.languageCode] ?? availability.languageCode }
                      { ": " }
                      { availability.isPublished ? "Published" : "Not Published" }
                      { availability.publiclyAvailable ? " • Public" : "" }
                    </span>
                  )) }
                </div>
              </article>
            )) }
          </div>
        ) }
      </AdminSectionCard>
    </div>
  );
}
