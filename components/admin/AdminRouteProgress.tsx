"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNProgress } from "@tanem/react-nprogress";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type AdminRouteProgressContextValue = {
  start: () => void;
};

const AdminRouteProgressContext = createContext<AdminRouteProgressContextValue | null>(null);

const getHrefPathname = (href: ComponentPropsWithoutRef<typeof Link>["href"]) => {
  if (typeof href === "string") {
    return href.split(/[?#]/, 1)[0] ?? null;
  }

  if (href && typeof href === "object" && "pathname" in href) {
    return typeof href.pathname === "string" ? href.pathname : null;
  }

  return null;
};

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export function AdminRouteProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);
  const progressState = useMemo<AdminRouteProgressContextValue>(
    () => ({
      start: () => {
        setIsAnimating(true);
      },
    }),
    [],
  );
  const { animationDuration, isFinished, progress } = useNProgress({
    animationDuration: 240,
    incrementDuration: 320,
    isAnimating,
    minimum: 0.12,
  });

  useEffect(() => {
    if (!isAnimating) {
      return;
    }

    setIsAnimating(false);
  }, [isAnimating, pathname]);

  return (
    <AdminRouteProgressContext.Provider value={ progressState }>
      <div
        aria-hidden="true"
        className={ cn(
          "pointer-events-none fixed left-0 right-0 top-0 z-100 transition-opacity",
          isFinished ? "opacity-0" : "opacity-100",
        ) }
        style={{ transitionDuration: `${ animationDuration }ms` }}
      >
        <div className="h-1 bg-transparent">
          <div
            className="h-full bg-[#9a6a2f] shadow-[0_0_14px_rgba(154,106,47,0.35)] transition-[width]"
            style={{
              transitionDuration: `${ animationDuration }ms`,
              width: `${ Math.max(progress, 0) * 100 }%`,
            }}
          />
        </div>
      </div>
      { children }
    </AdminRouteProgressContext.Provider>
  );
}

export const AdminProgressLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<typeof Link>
>(function AdminProgressLink({ href, onClick, target, ...props }, ref) {
  const pathname = usePathname();
  const progress = useContext(AdminRouteProgressContext);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      !isPlainLeftClick(event) ||
      (target && target !== "_self")
    ) {
      return;
    }

    const nextPathname = getHrefPathname(href);
    if (!nextPathname || !nextPathname.startsWith("/") || nextPathname === pathname) {
      return;
    }

    progress?.start();
  };

  return <Link ref={ ref } href={ href } onClick={ handleClick } target={ target } { ...props } />;
});

AdminProgressLink.displayName = "AdminProgressLink";
