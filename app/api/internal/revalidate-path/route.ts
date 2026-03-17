import {revalidatePath} from "next/cache";
import {NextResponse} from "next/server";

import {routing, type AppLocale} from "@/i18n/routing";

const isValidDetailPath = (path: string) => {
  const trimmedPath = path.trim();

  if (!trimmedPath.startsWith("/")) {
    return false;
  }

  const segments = trimmedPath.split("/").filter((segment) => segment.length > 0);

  if (segments.length !== 2 && segments.length !== 3) {
    return false;
  }

  if (segments.length === 2) {
    return ["tours", "companies"].includes(segments[0]);
  }

  return (
    routing.locales.includes(segments[0] as AppLocale) &&
    ["tours", "companies"].includes(segments[1])
  );
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as {path?: unknown} | null;
  const path = typeof payload?.path === "string" ? payload.path.trim() : "";

  if (!path || !isValidDetailPath(path)) {
    return NextResponse.json(
      {
        message: "A valid localized tour or company detail path is required.",
      },
      {status: 400},
    );
  }

  revalidatePath(path, "page");

  return NextResponse.json({
    revalidated: true,
    path,
  });
}
