import {proxyAdminRequest} from "@/lib/api/internal/admin-proxy";

type RouteContext = {
  params: Promise<{
    backendPath: string[];
  }>;
};

const handleProxyRequest = async (request: Request, context: RouteContext) => {
  const {backendPath} = await context.params;

  return proxyAdminRequest({
    pathSegments: backendPath,
    request,
  });
};

export async function GET(request: Request, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleProxyRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleProxyRequest(request, context);
}
