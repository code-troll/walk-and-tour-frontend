"use client";

import { usePathname } from "next/navigation";
import { AdminProgressLink } from "@/components/admin/AdminRouteProgress";

type NavigationItem = {
  href: string;
  label: string;
};

const isItemActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${ href }/`);
};

/**
 * The backoffice navigation — direction "Consola".
 *
 * Compact rows rather than pills: with eleven destinations for a super admin,
 * padding is the difference between a list you scan and a list you scroll.
 *
 * The active item is marked with a 2 px inset rule in the brand red. That is
 * one of only two places red appears in the backoffice — this, and destructive
 * actions — because a colour that shows up everywhere stops meaning anything.
 */
export function AdminSidebarNav({
  items,
}: {
  items: readonly NavigationItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-0.5 lg:block">
      {items.map((item) => {
        const isActive = isItemActive(pathname, item.href);

        return (
          <AdminProgressLink
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex w-full items-center px-3 py-1.5 text-sm font-medium text-[var(--wt-nav-ink-on)] shadow-[inset_2px_0_0_var(--wt-nav-marker)] transition lg:flex"
                : "inline-flex w-full items-center px-3 py-1.5 text-sm text-[var(--wt-nav-ink)] transition hover:text-[var(--wt-nav-ink-on)] lg:flex"
            }
          >
            {item.label}
          </AdminProgressLink>
        );
      })}
    </nav>
  );
}
