"use client";

import {useEffect, useState} from "react";
import {AdminProgressLink} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard, AdminStatCard} from "@/components/admin/AdminUi";
import {
  getAdminBlogPostsClient,
  getAdminLanguagesClient,
  getAdminSessionClient,
  getAdminTagsClient,
  getAdminToursClient,
  getAdminUsersClient,
} from "@/lib/admin/admin-client";

type OverviewClientProps = {
  roleName: "super_admin" | "editor" | "marketing";
};

type OverviewData = {
  auth0UserSub: string;
  backendStatus: string;
  backendRoleName: string;
  blogPostsCount: number;
  languagesCount: number;
  tagsCount: number;
  toursCount: number;
  usersCount: number;
};

export default function OverviewClient({roleName}: OverviewClientProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [session, users, languages, tags, tours, blogPosts] = await Promise.all([
          getAdminSessionClient(),
          roleName === "super_admin" ? getAdminUsersClient() : Promise.resolve([]),
          roleName === "super_admin" ? getAdminLanguagesClient() : Promise.resolve([]),
          roleName !== "marketing" ? getAdminTagsClient() : Promise.resolve([]),
          roleName !== "marketing" ? getAdminToursClient() : Promise.resolve([]),
          roleName !== "marketing" ? getAdminBlogPostsClient() : Promise.resolve([]),
        ]);

        setData({
          auth0UserSub: session.auth0User?.sub ?? "Unknown",
          backendStatus: session.backendAdmin.status,
          backendRoleName: session.backendAdmin.roleName,
          blogPostsCount: blogPosts.length,
          languagesCount: languages.length,
          tagsCount: tags.length,
          toursCount: tours.length,
          usersCount: users.length,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load the overview dashboard.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [roleName]);

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the overview dashboard."
        description="Resolving the admin session and workspace counts."
      />
    );
  }

  if (error || !data) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The overview dashboard could not be loaded."
        description={error ?? "Unable to load the overview dashboard."}
        actions={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
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
          <AdminProgressLink
            href="/tours"
            className="rounded-full bg-[#21343b] px-5 py-3 text-sm font-semibold text-white"
          >
            Open tours workspace
          </AdminProgressLink>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Role" value={data.backendRoleName.replace("_", " ")} />
        <AdminStatCard label="Users" value={data.usersCount} />
        <AdminStatCard label="Languages" value={data.languagesCount} />
        <AdminStatCard label="Tags" value={data.tagsCount} />
        <AdminStatCard label="Content" value={data.toursCount + data.blogPostsCount} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminSectionCard
          title="Session"
          description="The admin UI treats the backend role mapping as the source of truth."
        >
          <dl className="grid gap-4 text-sm text-[#4c6066]">
            <div className="flex items-center justify-between gap-4">
              <dt>Auth0 identity</dt>
              <dd className="font-medium text-[#21343b]">{data.auth0UserSub}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Backend status</dt>
              <dd className="font-medium capitalize text-[#21343b]">{data.backendStatus}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Backend role</dt>
              <dd className="font-medium text-[#21343b]">{data.backendRoleName}</dd>
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
            <li>Admin pages now load their workspace data from browser-initiated BFF requests.</li>
          </ul>
        </AdminSectionCard>
      </section>
    </div>
  );
}
