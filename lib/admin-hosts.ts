const ADMIN_HOSTS = new Set([
  "admin.walkandtour.dk",
  "admin.staging.walkandtour.dk",
  "admin.dev.walkandtour.dk",
]);

const ADMIN_ENVIRONMENT_BY_HOST: Record<string, string> = {
  "admin.walkandtour.dk": "Production",
  "admin.staging.walkandtour.dk": "Staging",
  "admin.dev.walkandtour.dk": "Development",
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

export function isAdminHostname(hostname: string | null | undefined): boolean {
  const normalizedHost = normalizeHostname(hostname);

  return normalizedHost ? ADMIN_HOSTS.has(normalizedHost) : false;
}

export function getAdminEnvironmentLabel(hostname: string | null | undefined): string | null {
  const normalizedHost = normalizeHostname(hostname);

  return normalizedHost ? ADMIN_ENVIRONMENT_BY_HOST[normalizedHost] ?? null : null;
}
