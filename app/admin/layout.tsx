/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminRouteProgressProvider } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard } from "@/components/admin/AdminUi";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { getAdminEnvironmentLabel, isAdminHostname } from "@/lib/portal-hosts";
import { getAdminViewerState } from "@/lib/admin/session";
import React from "react";

export const metadata: Metadata = {
  title: "Walk and Tour Admin",
  description: "Backoffice administration for Walk and Tour.",
};

/**
 * The backoffice shell — direction "Consola".
 *
 * It is deliberately not a card floating on a tinted ground. This is a tool
 * someone has open all day: the sidebar is pinned, the content fills the
 * window, and nothing is spent on framing. `data-surface="admin"` binds the
 * tree to the backoffice half of `app/design-system.css`.
 */

const navigationByRole = {
  super_admin: [
    {href: "/", label: "Overview"},
    {href: "/users", label: "Users"},
    {href: "/hotels", label: "Hotels"},
    {href: "/hotel-bookings", label: "Hotel bookings"},
    {href: "/taxonomy", label: "Taxonomy"},
    {href: "/tours", label: "Tours"},
    {href: "/events", label: "Events"},
    {href: "/proposals", label: "Proposals"},
    {href: "/blog-posts", label: "Blog posts"},
    {href: "/team-members", label: "Team"},
    {href: "/newsletter", label: "Newsletter"},
  ],
  editor: [
    {href: "/", label: "Overview"},
    {href: "/hotel-bookings", label: "Hotel bookings"},
    {href: "/taxonomy", label: "Taxonomy"},
    {href: "/tours", label: "Tours"},
    {href: "/events", label: "Events"},
    {href: "/proposals", label: "Proposals"},
    {href: "/blog-posts", label: "Blog posts"},
    {href: "/team-members", label: "Team"},
  ],
  marketing: [
    {href: "/", label: "Overview"},
    {href: "/newsletter", label: "Newsletter"},
  ],
} as const;

/** The signed-out and misconfigured states share one narrow column. */
const Gate = ({children}: {children: React.ReactNode}) => (
  <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
);

const quietAction =
  "inline-flex items-center rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] px-4 py-2 text-sm font-medium text-[var(--wt-ink)] transition hover:bg-[var(--wt-surface-sunk)]";

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
      className="min-h-screen bg-[var(--wt-bg)] text-[var(--wt-ink)]"
      data-surface="admin"
    >
      <AdminRouteProgressProvider>
        { viewerState.kind === "auth0-not-configured" ? (
          <Gate>
            <AdminNoticeCard
              eyebrow="Configuration"
              title="Auth0 is not configured in this frontend environment."
              description="Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and BACKEND_AUTH0_AUDIENCE before using the backoffice."
            />
          </Gate>
        ) : null }

        { viewerState.kind === "unauthenticated" ? (
          <Gate>
            <AdminNoticeCard
              eyebrow="Authentication"
              title="Sign in to access the backoffice."
              description="The admin routes are protected by Auth0, and the backend role mapping is resolved after login."
              actions={
                <a
                  href="/auth/login?returnTo=/"
                  className="inline-flex items-center rounded-[var(--wt-radius-sm)] bg-[var(--wt-ink)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Sign in with Auth0
                </a>
              }
            />
          </Gate>
        ) : null }

        { viewerState.kind === "access-token-error" ? (
          <Gate>
            <AdminNoticeCard
              eyebrow="Authentication"
              title="The frontend session could not obtain a backend token."
              description={ viewerState.message }
              actions={<a href="/auth/logout" className={quietAction}>Clear session</a>}
            />
          </Gate>
        ) : null }

        { viewerState.kind === "backend-error" ? (
          <Gate>
            <AdminNoticeCard
              eyebrow="Authorization"
              title="The backend rejected the admin session."
              description={ `Status ${ viewerState.statusCode }. ${ viewerState.message }` }
              actions={<a href="/auth/logout" className={quietAction}>Sign out</a>}
            />
          </Gate>
        ) : null }

        { viewerState.kind === "authenticated" ? (
          <div className="flex min-h-screen">
            {/*
              Pinned to the viewport, not to the page. The sidebar is how you leave
              the screen you are on, and on a long editor it used to scroll away —
              taking the navigation and Sign out with it. `h-screen` plus a
              scrollable nav keeps the account block on the bottom edge even when
              the destinations outgrow the window.
            */}
            <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-[var(--wt-rule-strong)] bg-[var(--wt-nav-bg)] lg:flex">
              <div className="px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
                  W&amp;T Admin
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--wt-nav-marker)]">
                  { environmentLabel ?? "Admin" }
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                <AdminSidebarNav items={ navigationByRole[viewerState.backendAdmin.roleName] }/>
              </div>

              <div className="border-t border-[var(--wt-rule-strong)] px-4 py-3">
                <p className="truncate text-sm text-[var(--wt-ink)]">
                  { viewerState.auth0User.name ?? viewerState.backendAdmin.email }
                </p>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--wt-ink-muted)]">
                  { viewerState.backendAdmin.roleName.replace("_", " ") }
                </p>
                <a
                  href="/auth/logout"
                  className="mt-2 inline-flex text-xs text-[var(--wt-ink-muted)] transition hover:text-[var(--wt-ink)]"
                >
                  Sign out
                </a>
              </div>
            </aside>

            {/*
              On narrow screens the sidebar collapses to a bar above the content.
              It carries the account block too: the <aside> is `hidden` below
              `lg`, so on a phone there was no way to sign out at all — the link
              was in the DOM and never on screen.
            */}
            <div className="min-w-0 flex-1">
              <div className="border-b border-[var(--wt-rule-strong)] bg-[var(--wt-nav-bg)] lg:hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--wt-rule)] px-4 py-2">
                  <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--wt-nav-marker)]">
                    { environmentLabel ?? "Admin" }
                  </p>
                  <div className="flex min-w-0 items-center gap-3">
                    <p className="truncate text-xs text-[var(--wt-ink-muted)]">
                      { viewerState.auth0User.name ?? viewerState.backendAdmin.email }
                    </p>
                    <a
                      href="/auth/logout"
                      className="shrink-0 text-xs text-[var(--wt-ink-muted)] transition hover:text-[var(--wt-ink)]"
                    >
                      Sign out
                    </a>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <AdminSidebarNav items={ navigationByRole[viewerState.backendAdmin.roleName] }/>
                </div>
              </div>
              <div className="space-y-5 p-5">{ children }</div>
            </div>
          </div>
        ) : null }
      </AdminRouteProgressProvider>
    </main>
  );
}
