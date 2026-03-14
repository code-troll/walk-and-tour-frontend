import Link from "next/link";
import {AdminNoticeCard, AdminSectionCard, AdminStatCard} from "@/components/admin/AdminUi";
import {createAdminApi} from "@/lib/api/admin";
import {isBackendApiError} from "@/lib/api/core/backend-client";
import {getAdminViewerState} from "@/lib/admin/session";

const loadOverviewData = async ({
  accessToken,
  roleName,
}: {
  accessToken: string;
  roleName: "super_admin" | "editor" | "marketing";
}) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [users, languages, tags, tours, blogPosts] = await Promise.all([
      roleName === "super_admin" ? adminApi.getAdminUsers() : Promise.resolve([]),
      roleName === "super_admin" ? adminApi.getLanguages() : Promise.resolve([]),
      roleName !== "marketing" ? adminApi.getTags() : Promise.resolve([]),
      roleName !== "marketing" ? adminApi.getTours() : Promise.resolve([]),
      roleName !== "marketing" ? adminApi.getBlogPosts() : Promise.resolve([]),
    ]);

    return {
      blogPosts,
      languages,
      tags,
      tours,
      users,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load the overview dashboard.",
    };
  }
};

export default async function AdminHomePage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  const overviewData = await loadOverviewData({
    accessToken: viewerState.accessToken,
    roleName: viewerState.backendAdmin.roleName,
  });

  if ("errorMessage" in overviewData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The overview dashboard could not be loaded."
        description={overviewData.errorMessage ?? "Unable to load the overview dashboard."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The backoffice is now driven by the backend contract."
        description="This shell resolves the Auth0 session, exchanges it for the backend admin context, and uses the new shared API layer for the first admin surfaces."
        actions={
          <Link
            href="/tours"
            className="rounded-full bg-[#21343b] px-5 py-3 text-sm font-semibold text-white"
          >
            Open tours workspace
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Role" value={viewerState.backendAdmin.roleName.replace("_", " ")} />
        <AdminStatCard label="Users" value={overviewData.users.length} />
        <AdminStatCard label="Languages" value={overviewData.languages.length} />
        <AdminStatCard label="Tags" value={overviewData.tags.length} />
        <AdminStatCard
          label="Content"
          value={overviewData.tours.length + overviewData.blogPosts.length}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminSectionCard
          title="Session"
          description="The admin UI treats the backend role mapping as the source of truth."
        >
          <dl className="grid gap-4 text-sm text-[#4c6066]">
            <div className="flex items-center justify-between gap-4">
              <dt>Auth0 identity</dt>
              <dd className="font-medium text-[#21343b]">{viewerState.auth0User.sub}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Backend status</dt>
              <dd className="font-medium capitalize text-[#21343b]">
                {viewerState.backendAdmin.status}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Backend role</dt>
              <dd className="font-medium text-[#21343b]">{viewerState.backendAdmin.roleName}</dd>
            </div>
          </dl>
        </AdminSectionCard>

        <AdminSectionCard
          title="Public API readiness"
          description="The same contract layer already includes typed public tours, blog posts, and newsletter endpoints for the later migration."
        >
          <ul className="space-y-3 text-sm leading-6 text-[#4c6066]">
            <li>Public API clients are scaffolded under `lib/api/public.ts`.</li>
            <li>Backend contract types are generated from `openapi/backend.yaml`.</li>
            <li>Admin pages use server-side access tokens and frontend-owned BFF routes.</li>
          </ul>
        </AdminSectionCard>
      </section>
    </div>
  );
}
