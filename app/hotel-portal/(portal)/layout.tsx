/* eslint-disable @next/next/no-html-link-for-pages */
import React from "react";

import {AdminNoticeCard} from "@/components/admin/AdminUi";
import {getHotelViewerState} from "@/lib/hotel-portal/session";

/**
 * Sign-in is pinned to the hotel connection. This is a convenience so hotels
 * land on the right form, not a security boundary: the parameter is
 * caller-controlled, and what actually separates the two populations is the
 * backend resolving the token subject against `hotel_users`.
 */
const buildSignInHref = () => {
  const connection = process.env.AUTH0_HOTEL_CONNECTION?.trim();
  const params = new URLSearchParams({returnTo: "/"});

  if (connection) {
    params.set("connection", connection);
  }

  return `/auth/login?${params.toString()}`;
};

const SignOutLink = () => (
  <a
    className="inline-flex items-center rounded-full border border-[#d8c5a8] px-5 py-2.5 text-sm font-semibold text-[#7a5424]"
    href="/auth/logout"
  >
    Sign out
  </a>
);

export default async function HotelPortalSessionLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind === "auth0-not-configured") {
    return (
      <AdminNoticeCard
        eyebrow="Configuration"
        title="The hotel portal is not configured."
        description="Auth0 environment variables are missing, so signing in is unavailable."
      />
    );
  }

  if (viewerState.kind === "unauthenticated") {
    return (
      <AdminNoticeCard
        eyebrow="Sign in"
        title="Sign in to book tours for your guests."
        description="Use the username Walk and Tour gave you and the password you chose from the emailed link."
        actions={
          <a
            className="inline-flex items-center rounded-full bg-[#2b666d] px-5 py-2.5 text-sm font-semibold text-white"
            href={buildSignInHref()}
          >
            Sign in
          </a>
        }
      />
    );
  }

  if (viewerState.kind === "not-a-hotel-user") {
    return (
      <AdminNoticeCard
        eyebrow="Access"
        title="This account cannot use the hotel portal."
        description={`${viewerState.message} If you administer Walk and Tour, use the backoffice instead.`}
        actions={<SignOutLink />}
      />
    );
  }

  if (viewerState.kind !== "authenticated") {
    return (
      <AdminNoticeCard
        eyebrow="Portal"
        title="The portal session could not be established."
        description={viewerState.message}
        actions={<SignOutLink />}
      />
    );
  }

  const {viewer} = viewerState;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-3xl border border-[#eadfce] bg-white p-5">
          <p className="font-semibold text-[#21343b]">{viewer.hotel.name}</p>
          <p className="mt-1 font-mono text-xs text-[#8a8477]">{viewer.user.username}</p>
        </div>
        <SignOutLink />
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
