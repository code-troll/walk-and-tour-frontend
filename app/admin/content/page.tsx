import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import { getAdminViewerState } from "@/lib/admin/session";

const loadContentData = async (accessToken: string) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [tours, blogPosts] = await Promise.all([adminApi.getTours(), adminApi.getBlogPosts()]);

    return {
      blogPosts,
      tours,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load content data.",
    };
  }
};

export default async function AdminContentPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Content administration is not available for the marketing role."
        description="Tours and blog posts are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const contentData = await loadContentData(viewerState.accessToken);

  if ("errorMessage" in contentData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The content workspace could not be loaded."
        description={ contentData.errorMessage ?? "Unable to load content data." }
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Tours"
        description="Tour records include backend-derived translation availability so the UI can surface publishability state without reimplementing backend rules."
      >
        <div className="space-y-4">
          { contentData.tours.map((tour) => (
            <article key={ tour.id }
                     className="rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{ tour.slug }</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium">{ tour.tourType }</span>
                    { " • " }
                    <span
                      className={ tour.publicationStatus === "published" ? "text-primary" : "text-muted-foreground" }>
                      { tour.publicationStatus }
                    </span>
                    { " • " }
                    { tour.durationMinutes } minutes
                  </p>
                </div>
                <span
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  { tour.translationAvailability.filter((item) => item.publiclyAvailable).length } public locales
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                { tour.translationAvailability.map((availability) => (
                  <span
                    key={ availability.languageCode }
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    { availability.languageCode }: { availability.translationStatus }/
                    { availability.publicationStatus }
                  </span>
                )) }
              </div>
            </article>
          )) }
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Blog posts"
        description="Blog post availability is now sourced from the same admin contract that will later support the public blog migration away from Wix."
      >
        <div className="space-y-4">
          { contentData.blogPosts.map((post) => (
            <article key={ post.id }
                     className="rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{ post.slug }</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium">{ post.category ?? "Uncategorized" }</span>
                    { " • " }
                    <span
                      className={ post.publicationStatus === "published" ? "text-primary" : "text-muted-foreground" }>
                      { post.publicationStatus }
                    </span>
                  </p>
                </div>
                <span
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  { post.translationAvailability.filter((item) => item.publiclyAvailable).length } public locales
                </span>
              </div>
            </article>
          )) }
        </div>
      </AdminSectionCard>
    </div>
  );
}
