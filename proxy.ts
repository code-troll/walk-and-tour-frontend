import {NextRequest, NextResponse} from "next/server";
import createMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";
import {isAdminHostname, normalizeHostname} from "@/lib/admin-hosts";
import {runAuth0Middleware} from "@/lib/auth0";

const intlMiddleware = createMiddleware(routing);
const AUTH_PATH_PREFIX = "/auth";

const stripAdminPrefix = (pathname: string): string => {
  if (pathname === "/admin") {
    return "/";
  }

  return pathname.replace(/^\/admin/, "") || "/";
};

const mergeMiddlewareCookies = ({
  source,
  target,
}: {
  source: NextResponse;
  target: NextResponse;
}) => {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }

  return target;
};

export default async function proxy(request: NextRequest) {
  const authResponse = await runAuth0Middleware(request);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = normalizeHostname(forwardedHost ?? request.headers.get("host"));
  const {pathname} = request.nextUrl;

  if (pathname.startsWith(AUTH_PATH_PREFIX) || pathname.startsWith("/api")) {
    return authResponse;
  }

  if (isAdminHostname(host)) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = stripAdminPrefix(pathname);
      return mergeMiddlewareCookies({
        source: authResponse,
        target: NextResponse.redirect(redirectUrl),
      });
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return mergeMiddlewareCookies({
      source: authResponse,
      target: NextResponse.rewrite(rewriteUrl),
    });
  }

  return mergeMiddlewareCookies({
    source: authResponse,
    target: intlMiddleware(request),
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
};
