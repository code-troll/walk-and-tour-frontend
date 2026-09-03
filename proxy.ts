import {NextRequest, NextResponse} from "next/server";
import createMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";
import {
  normalizeHostname,
  PORTAL_ROUTE_PREFIXES,
  resolvePortalForHost,
} from "@/lib/portal-hosts";
import {runAuth0Middleware} from "@/lib/auth0";

const intlMiddleware = createMiddleware(routing);
const AUTH_PATH_PREFIX = "/auth";
const PUBLIC_NEWSLETTER_RESULT_PATHS = new Set([
  "/newsletter/confirm",
  "/newsletter/unsubscribe",
]);

/**
 * A portal's route tree is an internal target, so a request that names it
 * directly is redirected to the clean path rather than being served twice under
 * two URLs.
 */
const stripPortalPrefix = (pathname: string, prefix: string): string => {
  if (pathname === prefix) {
    return "/";
  }

  return pathname.slice(prefix.length) || "/";
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

  const portal = resolvePortalForHost(host);

  if (portal) {
    const prefix = PORTAL_ROUTE_PREFIXES[portal];

    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = stripPortalPrefix(pathname, prefix);
      return mergeMiddlewareCookies({
        source: authResponse,
        target: NextResponse.redirect(redirectUrl),
      });
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
    return mergeMiddlewareCookies({
      source: authResponse,
      target: NextResponse.rewrite(rewriteUrl),
    });
  }

  if (PUBLIC_NEWSLETTER_RESULT_PATHS.has(pathname)) {
    return authResponse;
  }

  return mergeMiddlewareCookies({
    source: authResponse,
    target: intlMiddleware(request),
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
};
