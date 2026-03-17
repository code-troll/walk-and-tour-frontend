import {NextResponse} from "next/server";

import {getBackendApiBaseUrl} from "@/lib/api/core/backend-env";
import {formatBackendErrorMessage} from "@/lib/api/core/backend-error";

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
      "Missing backend API configuration. Set BACKEND_API_BASE_URL before using the public API proxy.",
    );
  }

  const pathname = pathSegments.join("/");
  const backendUrl = new URL(`${ backendApiBaseUrl }/${ pathname }`);
  backendUrl.search = searchParams.toString();
  return backendUrl;
};

export const proxyPublicRequest = async ({
  pathSegments,
  request,
}: {
  pathSegments: string[];
  request: Request;
}) => {
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
  const responseCacheControl = backendResponse.headers.get("cache-control");

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

    return NextResponse.json(payload, {
      status: backendResponse.status,
      headers: responseCacheControl ? {"cache-control": responseCacheControl} : undefined,
    });
  }

  if (!backendResponse.ok) {
    const textBody = await backendResponse.text();

    return NextResponse.json(
      {
        message: textBody || "Backend request failed.",
      },
      {status: backendResponse.status},
    );
  }

  const responseHeaders = new Headers();

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  if (responseCacheControl) {
    responseHeaders.set("cache-control", responseCacheControl);
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
};
