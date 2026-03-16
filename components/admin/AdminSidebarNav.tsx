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

export function AdminSidebarNav({
  items,
}: {
  items: readonly NavigationItem[];
}) {
  const pathname = usePathname();

  return (
    <nav className="mt-5 flex flex-wrap gap-2 lg:block lg:space-y-2">
      {items.map((item) => {
        const isActive = isItemActive(pathname, item.href);

        return (
          <AdminProgressLink
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex rounded-2xl bg-[#21343b] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(33,52,59,0.18)] transition lg:flex"
                : "inline-flex rounded-2xl px-4 py-3 text-sm font-medium text-[#294049] transition hover:bg-white hover:text-[#102129] lg:flex"
            }
          >
            {item.label}
          </AdminProgressLink>
        );
      })}
    </nav>
  );
}
