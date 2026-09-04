/* eslint-disable @next/next/no-html-link-for-pages */
import Link from "next/link";
import React from "react";

import {
  PortalNotice,
  portalPrimaryAction,
  portalSecondaryAction,
} from "@/components/hotel-portal/PortalUi";
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

const NAV_ITEMS = [
  {href: "/", label: "Overview"},
  {href: "/bookings", label: "Bookings"},
  {href: "/bookings/new", label: "Book a tour"},
];

const SignOutLink = () => (
  <a className={portalSecondaryAction} href="/auth/logout">
    Sign out
  </a>
);

/** Everything that is not a signed-in hotel gets the same centred column. */
const Shell = ({children}: {children: React.ReactNode}) => (
  <div className="mx-auto max-w-4xl px-6 pb-16 sm:px-10">{children}</div>
);

export default async function HotelPortalSessionLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const viewerState = await getHotelViewerState();

  if (viewerState.kind === "auth0-not-configured") {
    return (
      <Shell>
        <PortalNotice
          kicker="Configuration"
          title="The hotel portal is not configured."
          description="Auth0 environment variables are missing, so signing in is unavailable."
        />
      </Shell>
    );
  }

  if (viewerState.kind === "unauthenticated") {
    return (
      <Shell>
        <PortalNotice
          kicker="Sign in"
          title="Sign in to book tours for your guests."
          description="Use the username Walk and Tour gave you and the password you chose from the emailed link."
          actions={
            <a className={portalPrimaryAction} href={buildSignInHref()}>
              Sign in
            </a>
          }
        />
      </Shell>
    );
  }

  if (viewerState.kind === "not-a-hotel-user") {
    return (
      <Shell>
        <PortalNotice
          kicker="Access"
          title="This account cannot use the hotel portal."
          description={`${viewerState.message} If you administer Walk and Tour, use the backoffice instead.`}
          actions={<SignOutLink />}
        />
      </Shell>
    );
  }

  if (viewerState.kind !== "authenticated") {
    return (
      <Shell>
        <PortalNotice
          kicker="Portal"
          title="The portal session could not be established."
          description={viewerState.message}
          actions={<SignOutLink />}
        />
      </Shell>
    );
  }

  const {viewer} = viewerState;

  return (
    <>
      {/*
        The navigation row. Sky blue is structural here — a 3 px band closing the
        header — and never a background: at its contrast it cannot carry text.
      */}
      <div className="border-b-[3px] border-[var(--wt-nav-rule)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pb-3 sm:px-10">
          <nav className="flex flex-wrap gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                className="pb-0.5 text-sm text-[var(--wt-nav-ink)] transition hover:text-[var(--wt-nav-ink-on)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--wt-ink)]">{viewer.hotel.name}</span>
            <a
              className="text-[var(--wt-ink-muted)] transition hover:text-[var(--wt-ink)]"
              href="/auth/logout"
            >
              Sign out
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-6 pb-16 pt-8 sm:px-10">{children}</div>
    </>
  );
}
