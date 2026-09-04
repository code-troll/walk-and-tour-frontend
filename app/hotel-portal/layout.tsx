import type {Metadata} from "next";
import {headers} from "next/headers";
import {notFound} from "next/navigation";
import React from "react";

import {getPortalEnvironmentLabel, isPortalHostname} from "@/lib/portal-hosts";

export const metadata: Metadata = {
  title: "Walk and Tour for Hotels",
  description: "Book Walk and Tour experiences for your guests.",
};

/**
 * Host guard and page chrome for the hotel portal — direction "Skilt".
 *
 * Signing in is gated one level down, in the `(portal)` group, so that pages
 * which must stay reachable without a session — the landing page the identity
 * provider returns to after a password is set — can sit outside it and still
 * get the same shell.
 *
 * That split is why this layout carries only the brand row: it cannot see the
 * session, so navigation and the account live in the `(portal)` layout, on a
 * second row beneath. The sky rule closes the whole header block from there.
 *
 * `data-surface="portal"` is what binds this tree to the portal half of
 * `app/design-system.css`. Without it every token below resolves to nothing.
 */
export default async function HotelPortalLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  // The route tree is a rewrite target for the hotel hosts only. Without this
  // the portal would answer on every hostname, including the public site.
  if (!isPortalHostname(host, "hotels")) {
    notFound();
  }

  const environmentLabel = getPortalEnvironmentLabel(host);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--ink)]"
      data-surface="portal"
    >
      <header className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-5 sm:px-10">
        <p className="text-base font-medium tracking-tight text-[var(--nav-marker)]">
          Walk&amp;Tour{" "}
          <span className="font-normal text-[var(--ink-muted)]">Partners</span>
        </p>
        {environmentLabel && environmentLabel !== "Production" ? (
          <span className="rounded-[var(--radius-control)] bg-[var(--surface-sunk)] px-3 py-1 text-xs font-medium text-[var(--nav-marker)]">
            {environmentLabel}
          </span>
        ) : null}
      </header>

      {children}
    </div>
  );
}
