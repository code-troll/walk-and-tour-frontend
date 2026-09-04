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
 *
 * Two things are `lg:`-only because they are column idioms. `w-full` on a
 * wrapping row put one destination on each line — eleven rows, 389 px of an
 * 796 px phone screen before any content. And the marker runs along the bottom
 * edge below `lg`: a rule down the left of an item in a horizontal row reads as
 * a divider between it and the item before it, not as a mark on it.
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
                ? "inline-flex items-center px-3 py-1.5 text-sm font-medium lg:w-full text-[var(--wt-nav-ink-on)] shadow-[inset_0_-2px_0_var(--wt-nav-marker)] lg:shadow-[inset_2px_0_0_var(--wt-nav-marker)] transition lg:flex"
                : "inline-flex items-center px-3 py-1.5 text-sm text-[var(--wt-nav-ink)] lg:w-full transition hover:text-[var(--wt-nav-ink-on)] lg:flex"
            }
          >
            {item.label}
          </AdminProgressLink>
        );
      })}
    </nav>
  );
}
