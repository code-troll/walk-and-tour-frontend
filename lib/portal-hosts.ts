/**
 * Hostname routing for the authenticated portals.
 *
 * The application serves three products from one deployment, told apart by the
 * request host: the public site on any other hostname, the backoffice, and the
 * hotel portal. `proxy.ts` rewrites a matching host into its route tree, and
 * each tree re-checks the host server-side so it cannot be reached from
 * anywhere else.
 *
 * The map is deliberately in code rather than in an environment variable. An
 * env-driven list drifts between environments, and a host that is missing in
 * one of them fails in a way nobody notices until a portal is unreachable.
 */
export type PortalKind = "admin" | "hotels";

type PortalHost = {
  portal: PortalKind;
  environmentLabel: string;
};

const PORTAL_HOSTS: Record<string, PortalHost> = {
  "admin.walkandtour.dk": {portal: "admin", environmentLabel: "Production"},
  "admin.dev.walkandtour.dk": {portal: "admin", environmentLabel: "Development"},
  "hotels.walkandtour.dk": {portal: "hotels", environmentLabel: "Production"},
  "hotels.dev.walkandtour.dk": {portal: "hotels", environmentLabel: "Development"},
};

/**
 * The route tree each portal is served from.
 *
 * The hotel portal lives at `/hotel-portal` and not `/hotels` on purpose:
 * `/admin/hotels` is the backoffice section that administers hotels, and two
 * route trees named `hotels` meaning opposite things is a trap. Neither path is
 * ever visible, because both are rewrite targets.
 */
export const PORTAL_ROUTE_PREFIXES: Record<PortalKind, string> = {
  admin: "/admin",
  hotels: "/hotel-portal",
};

export function normalizeHostname(hostname: string | null | undefined): string | null {
  if (!hostname) {
    return null;
  }

  const [forwardedHost] = hostname.split(",");
  const normalizedHost = forwardedHost.trim().toLowerCase();

  if (!normalizedHost) {
    return null;
  }

  return normalizedHost.replace(/:\d+$/, "");
}

export function resolvePortalForHost(
  hostname: string | null | undefined,
): PortalKind | null {
  const normalizedHost = normalizeHostname(hostname);

  return normalizedHost ? PORTAL_HOSTS[normalizedHost]?.portal ?? null : null;
}

export function getPortalEnvironmentLabel(
  hostname: string | null | undefined,
): string | null {
  const normalizedHost = normalizeHostname(hostname);

  return normalizedHost ? PORTAL_HOSTS[normalizedHost]?.environmentLabel ?? null : null;
}

export function isPortalHostname(
  hostname: string | null | undefined,
  portal: PortalKind,
): boolean {
  return resolvePortalForHost(hostname) === portal;
}

// ── Backwards-compatible names used by the backoffice ──────────────────

export function isAdminHostname(hostname: string | null | undefined): boolean {
  return isPortalHostname(hostname, "admin");
}

export function getAdminEnvironmentLabel(
  hostname: string | null | undefined,
): string | null {
  return isAdminHostname(hostname) ? getPortalEnvironmentLabel(hostname) : null;
}
