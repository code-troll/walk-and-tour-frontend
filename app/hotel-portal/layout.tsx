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
 * Host guard and page chrome for the hotel portal.
 *
 * Signing in is gated one level down, in the `(portal)` group, so that pages
 * which must stay reachable without a session — the landing page the identity
 * provider returns to after a password is set — can sit outside it and still
 * get the same shell.
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
    <div className="min-h-screen bg-[#f6f1e7] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#e8dfd4] bg-[#fcfaf7] p-6 shadow-[0_30px_80px_rgba(61,45,27,0.08)] sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eadfce] pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a6a2f]">
              Walk and Tour
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#21343b]">For Hotels</h1>
          </div>
          {environmentLabel && environmentLabel !== "Production" ? (
            <span className="rounded-full border border-[#d8c5a8] bg-[#f3e8d5] px-4 py-1.5 text-sm font-semibold text-[#7a5424]">
              {environmentLabel}
            </span>
          ) : null}
        </header>

        <div className="pt-8">{children}</div>
      </div>
    </div>
  );
}
