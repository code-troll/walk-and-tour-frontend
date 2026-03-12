import {NextResponse} from "next/server";
import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";
import {getAuth0AccessToken, getAuth0Session, isAuth0Configured} from "@/lib/auth0";

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
      "Missing backend API configuration. Set BACKEND_API_BASE_URL before using the admin API proxy.",
    );
  }

  const pathname = pathSegments.join("/");
  const backendUrl = new URL(`${backendApiBaseUrl}/api/admin/${pathname}`);
  backendUrl.search = searchParams.toString();
  return backendUrl;
};

export const getAdminProxyAuthContext = async () => {
  if (!isAuth0Configured) {
    return NextResponse.json(
      {
        message:
          "Auth0 is not configured in this frontend environment. Set the Auth0 environment variables before using the admin API.",
      },
      {status: 503},
    );
  }

  const session = await getAuth0Session();

  if (!session) {
    return NextResponse.json({message: "Authentication required."}, {status: 401});
  }

  const accessToken = await getAuth0AccessToken();

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "Unable to obtain a backend access token for the authenticated session.",
      },
      {status: 401},
    );
  }

  return {
    accessToken: accessToken.token,
  };
};

export const proxyAdminRequest = async ({
  pathSegments,
  request,
}: {
  pathSegments: string[];
  request: Request;
}) => {
  const authContext = await getAdminProxyAuthContext();

  if (authContext instanceof NextResponse) {
    return authContext;
  }

  let backendUrl: URL;

  try {
    backendUrl = buildBackendUrl({
      pathSegments,
      searchParams: new URL(request.url).searchParams,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Backend API is not configured.",
      },
      {status: 503},
    );
  }

  const requestHeaders = new Headers();
  requestHeaders.set("Authorization", `Bearer ${authContext.accessToken}`);

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

  const responseContentType = backendResponse.headers.get("content-type") ?? "";
  const responseDisposition = backendResponse.headers.get("content-disposition");

  if (responseContentType.includes("text/csv")) {
    return new Response(await backendResponse.text(), {
      status: backendResponse.status,
      headers: {
        "content-type": responseContentType,
        ...(responseDisposition ? {"content-disposition": responseDisposition} : {}),
      },
    });
  }

  if (responseContentType.includes("application/json")) {
    const payload = (await backendResponse.json()) as unknown;

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: formatBackendErrorMessage(payload, "Backend request failed."),
          backend: payload,
        },
        {status: backendResponse.status},
      );
    }

    return NextResponse.json(payload, {status: backendResponse.status});
  }

  const textBody = await backendResponse.text();

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        message: textBody || "Backend request failed.",
      },
      {status: backendResponse.status},
    );
  }

  return new Response(textBody, {
    status: backendResponse.status,
    headers: responseContentType ? {"content-type": responseContentType} : undefined,
  });
};
