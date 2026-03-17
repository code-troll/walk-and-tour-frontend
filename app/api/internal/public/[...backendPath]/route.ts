import {proxyPublicRequest} from "@/lib/api/internal/public-proxy";

type RouteContext = {
  params: Promise<{
    backendPath: string[];
  }>;
};

const handleProxyRequest = async (request: Request, context: RouteContext) => {
  const {backendPath} = await context.params;

  return proxyPublicRequest({
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
