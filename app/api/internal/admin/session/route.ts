import {NextResponse} from "next/server";
import {createAdminApi} from "@/lib/api/admin";
import {isBackendApiError} from "@/lib/api/core/backend-client";
import {getAdminProxyAuthContext} from "@/lib/api/internal/admin-proxy";
import {getAuth0Session} from "@/lib/auth0";

export async function GET() {
  const authContext = await getAdminProxyAuthContext();

  if (authContext instanceof NextResponse) {
    return authContext;
  }

  try {
    const [session, backendAdmin] = await Promise.all([
      getAuth0Session(),
      createAdminApi(authContext.accessToken).getCurrentAdmin(),
    ]);

    return NextResponse.json({
      auth0User: session?.user ?? null,
      backendAdmin,
    });
  } catch (error) {
    if (isBackendApiError(error)) {
      return NextResponse.json(
        {
          message: error.message,
          backend: error.payload,
        },
        {status: error.statusCode},
      );
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load the admin session.",
      },
      {status: 500},
    );
  }
}
