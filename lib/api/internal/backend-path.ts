/**
 * Path handling shared by the internal backend proxies.
 *
 * The proxies build a backend URL from route segments supplied by the caller
 * and then attach server-held credentials to the request. `new URL()` resolves
 * `..` segments, so an unvalidated segment could walk the request out of the
 * prefix its proxy is scoped to and reach a different part of the backend with
 * those credentials attached. Every segment is therefore checked against the
 * characters the backend routes actually use — slugs, locale codes, UUIDs,
 * dates and public hashes are all covered by this set.
 */
const SAFE_PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/;

export class UnsafeBackendPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeBackendPathError";
  }
}

export const joinBackendPathSegments = (pathSegments: string[]): string => {
  if (pathSegments.length === 0) {
    throw new UnsafeBackendPathError("A backend path is required.");
  }

  for (const segment of pathSegments) {
    if (segment === "." || segment === ".." || !SAFE_PATH_SEGMENT.test(segment)) {
      throw new UnsafeBackendPathError("The requested backend path is not supported.");
    }
  }

  return pathSegments.join("/");
};

/**
 * Builds the backend URL and refuses to return one that escaped `prefix`, so a
 * change to the segment rules can never silently widen a proxy's reach.
 */
export const buildScopedBackendUrl = ({
  backendApiBaseUrl,
  prefix,
  pathSegments,
  searchParams,
}: {
  backendApiBaseUrl: string;
  prefix: string;
  pathSegments: string[];
  searchParams: URLSearchParams;
}): URL => {
  const pathname = joinBackendPathSegments(pathSegments);
  const scopeUrl = new URL(`${ backendApiBaseUrl }${ prefix }`);
  const backendUrl = new URL(`${ backendApiBaseUrl }${ prefix }${ pathname }`);

  if (backendUrl.origin !== scopeUrl.origin || !backendUrl.pathname.startsWith(scopeUrl.pathname)) {
    throw new UnsafeBackendPathError("The requested backend path is not supported.");
  }

  backendUrl.search = searchParams.toString();
  return backendUrl;
};
