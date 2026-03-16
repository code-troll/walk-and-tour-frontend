import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminRouteProgressProvider } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { getAdminEnvironmentLabel, isAdminHostname } from "@/lib/admin-hosts";
import { getAdminViewerState } from "@/lib/admin/session";
import React from "react";

export const metadata: Metadata = {
  title: "Walk and Tour Admin",
  description: "Backoffice administration for Walk and Tour.",
};

const navigationByRole = {
  super_admin: [
    {href: "/", label: "Overview"},
    {href: "/users", label: "Users"},
    {href: "/taxonomy", label: "Taxonomy"},
    {href: "/tours", label: "Tours"},
    {href: "/blog-posts", label: "Blog posts"},
    {href: "/newsletter", label: "Newsletter"},
  ],
  editor: [
    {href: "/", label: "Overview"},
    {href: "/taxonomy", label: "Taxonomy"},
    {href: "/tours", label: "Tours"},
    {href: "/blog-posts", label: "Blog posts"},
  ],
  marketing: [
    {href: "/", label: "Overview"},
    {href: "/newsletter", label: "Newsletter"},
  ],
} as const;

export default async function AdminLayout({
                                            children,
                                          }: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!isAdminHostname(host)) {
    notFound();
  }

  const environmentLabel = getAdminEnvironmentLabel(host);
  const viewerState = await getAdminViewerState();

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,#efe2cc_0%,#fcf8f1_50%,#f6f1e7_100%)] px-6 py-10 text-[#1c2c33]">
      <AdminRouteProgressProvider>
        <div
          className="mx-auto flex min-h-[calc(100vh-5rem)] w-full min-w-120 max-w-7xl flex-col rounded-[2rem] border border-[#d8c5a8] bg-white/85 p-8 shadow-[0_30px_80px_rgba(61,45,27,0.10)] backdrop-blur md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eadfce] pb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9a6a2f]">
                Walk and Tour
              </p>
              <h1 className="mt-3 font-serif text-3xl text-[#21343b] md:text-4xl">
                Backoffice Administration
              </h1>
            </div>

            <div
              className="rounded-full border border-[#d8c5a8] bg-[#f9f2e7] px-4 py-2 text-sm font-semibold text-[#7a5424]">
              { environmentLabel ?? "Admin" }
            </div>
          </div>

          <div className="flex-1 pt-8">
            { viewerState.kind === "auth0-not-configured" ? (
              <AdminNoticeCard
                eyebrow="Configuration"
                title="Auth0 is not configured in this frontend environment."
                description="Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and BACKEND_AUTH0_AUDIENCE before using the backoffice."
              />
            ) : null }

            { viewerState.kind === "unauthenticated" ? (
              <AdminNoticeCard
                eyebrow="Authentication"
                title="Sign in to access the backoffice."
                description="The admin routes are protected by Auth0, and the backend role mapping is resolved after login."
                actions={
                  <a
                    href="/auth/login?returnTo=/"
                    className="rounded-full bg-[#21343b] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Sign in with Auth0
                  </a>
                }
              />
            ) : null }

            { viewerState.kind === "access-token-error" ? (
              <AdminNoticeCard
                eyebrow="Authentication"
                title="The frontend session could not obtain a backend token."
                description={ viewerState.message }
                actions={
                  <a
                    href="/auth/logout"
                    className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
                  >
                    Clear session
                  </a>
                }
              />
            ) : null }

            { viewerState.kind === "backend-error" ? (
              <AdminNoticeCard
                eyebrow="Authorization"
                title="The backend rejected the admin session."
                description={ `Status ${ viewerState.statusCode }. ${ viewerState.message }` }
                actions={
                  <a
                    href="/auth/logout"
                    className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
                  >
                    Sign out
                  </a>
                }
              />
            ) : null }

            { viewerState.kind === "authenticated" ? (
              <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="rounded-[1.5rem] border border-[#eadfce] bg-[#fbf7f0] p-5 lg:block">
                  <div
                    className="flex flex-col gap-4 border-b border-[#eadfce] pb-4 sm:flex-row sm:items-start sm:justify-between lg:block">
                    <p
                      className="text-sm font-semibold text-[#21343b]">{ viewerState.auth0User.name ?? viewerState.backendAdmin.email }</p>
                    <div className="sm:text-right lg:mt-0 lg:text-left">
                      <p className="mt-1 text-sm text-[#627176]">{ viewerState.backendAdmin.email }</p>
                      <p
                        className="mt-3 inline-flex rounded-full bg-[#f2e7d6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6029]">
                        { viewerState.backendAdmin.roleName.replace("_", " ") }
                      </p>
                    </div>
                  </div>
                  <AdminSidebarNav items={ navigationByRole[viewerState.backendAdmin.roleName] }/>

                  <div className="mt-5 border-t border-[#eadfce] pt-4 lg:mt-6 lg:pt-5">
                    <a
                      href="/auth/logout"
                      className="inline-flex rounded-full border border-[#cbb390] px-4 py-2 text-sm font-semibold text-[#7a5424]"
                    >
                      Sign out
                    </a>
                  </div>
                </aside>

                <div className="space-y-6">{ children }</div>
              </div>
            ) : null }
          </div>
        </div>
      </AdminRouteProgressProvider>
    </main>
  );
}
