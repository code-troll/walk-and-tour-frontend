import {proxyHotelRequest} from "@/lib/api/internal/hotel-proxy";

type RouteContext = {
  params: Promise<{
    backendPath: string[];
  }>;
};

/**
 * Only GET and POST are exported. The hotel user reads its own data and creates
 * bookings; it never edits hotel records, so PATCH, PUT and DELETE have no
 * hotel-facing use and are left unroutable rather than merely refused deeper in.
 */
export async function GET(request: Request, context: RouteContext) {
  const {backendPath} = await context.params;

  return proxyHotelRequest({pathSegments: backendPath, request});
}

export async function POST(request: Request, context: RouteContext) {
  const {backendPath} = await context.params;

  return proxyHotelRequest({pathSegments: backendPath, request});
}
