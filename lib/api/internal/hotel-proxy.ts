import {headers} from "next/headers";
import {NextResponse} from "next/server";

import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import {
  buildScopedBackendUrl,
  UnsafeBackendPathError,
} from "@/lib/api/internal/backend-path";
import {getAuth0AccessToken, getAuth0Session, isAuth0Configured} from "@/lib/auth0";
import {isPortalHostname} from "@/lib/portal-hosts";

/**
 * Same-origin entry point for the hotel portal.
 *
 * This is deliberately a separate module from the admin proxy rather than one
 * parameterised by prefix. The two differ in backend prefix, allowed methods,
 * host guard and caching policy, and putting the tenant boundary behind a
 * function argument is exactly where that kind of mistake hides. Keeping them
 * apart also means grepping for `internal/hotel` finds every hotel-scoped path.
 */
/**
 * One hotel's data must never reach another, so every response from this proxy
 * is marked uncacheable — including the refusals, which would otherwise leave a
 * shared cache free to answer for a different session.
 */
const NO_STORE_HEADERS = {"cache-control": "no-store, private"} as const;

const hotelProxyJson = (payload: unknown, status: number) =>
  NextResponse.json(payload, {status, headers: NO_STORE_HEADERS});

const buildBackendUrl = ({
  pathSegments,
  searchParams,
}: {
  pathSegments: string[];
  searchParams: URLSearchParams;
}) => {
  const backendApiBaseUrl = getBackendApiBaseUrl();

  if (!backendApiBaseUrl) {
    throw new Error(
      "Missing backend API configuration. Set BACKEND_API_BASE_URL before using the hotel portal API proxy.",
    );
  }

  return buildScopedBackendUrl({
    backendApiBaseUrl,
    prefix: "/api/hotel/",
    pathSegments,
    searchParams,
  });
};

/**
 * `proxy.ts` returns early for `/api`, so route handlers answer on every
 * hostname. The backend is the real boundary — a hotel subject is not in
 * `admin_users` and vice versa — but a request arriving on the wrong host has no
 * business reaching a hotel endpoint, and refusing it here means a regression in
 * one backend guard is not the only thing standing in the way.
 */
const assertHotelHost = async () => {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!isPortalHostname(host, "hotels")) {
    return hotelProxyJson({message: "Not found."}, 404);
  }

  return null;
};

export const proxyHotelRequest = async ({
  pathSegments,
  request,
}: {
  pathSegments: string[];
  request: Request;
}) => {
  const wrongHost = await assertHotelHost();

  if (wrongHost) {
    return wrongHost;
  }

  if (!isAuth0Configured) {
    return hotelProxyJson(
      {
        message:
          "Auth0 is not configured in this frontend environment. Set the Auth0 environment variables before using the hotel portal.",
      },
      503,
    );
  }

  const session = await getAuth0Session();

  if (!session) {
    return hotelProxyJson({message: "Authentication required."}, 401);
  }

  const accessToken = await getAuth0AccessToken();

  if (!accessToken) {
    return hotelProxyJson(
      {message: "Unable to obtain a backend access token for the authenticated session."},
      401,
    );
  }

  let backendUrl: URL;

  try {
    backendUrl = buildBackendUrl({
      pathSegments,
      searchParams: new URL(request.url).searchParams,
    });
  } catch (error) {
    if (error instanceof UnsafeBackendPathError) {
      return hotelProxyJson({message: error.message}, 400);
    }

    return hotelProxyJson(
      {
        message: error instanceof Error ? error.message : "Backend API is not configured.",
      },
      503,
    );
  }

  const requestHeaders = new Headers();
  requestHeaders.set("Authorization", `Bearer ${accessToken.token}`);

  const contentType = request.headers.get("content-type");

  if (contentType) {
    requestHeaders.set("content-type", contentType);
  }

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers: requestHeaders,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
    cache: "no-store",
  });

  /**
   * An image comes back as bytes, and everything else as JSON.
   *
   * The allowance is deliberately `image/` and nothing wider. The one non-JSON
   * response the hotel API produces is a tour photograph; matching on "not
   * JSON" instead would quietly turn this route into a general file tunnel out
   * of the backend the first time somebody added an endpoint that streams
   * something else.
   *
   * The cache headers do not change. `no-store, private` matters more here than
   * for JSON, not less: a CDN that cached one hotel's tour image under a shared
   * key would serve it to another.
   */
  const backendContentType = backendResponse.headers.get("content-type") ?? "";

  if (backendResponse.ok && backendContentType.startsWith("image/")) {
    return new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      headers: {...NO_STORE_HEADERS, "content-type": backendContentType},
    });
  }

  const payload = (await backendResponse.json().catch(() => null)) as unknown;

  if (!backendResponse.ok) {
    return hotelProxyJson(
      {
        message: formatBackendErrorMessage(payload, "Backend request failed."),
        backend: payload,
      },
      backendResponse.status,
    );
  }

  return hotelProxyJson(payload, backendResponse.status);
};
