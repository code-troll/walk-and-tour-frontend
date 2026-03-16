"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useNProgress } from "@tanem/react-nprogress";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type AdminRouteProgressContextValue = {
  enterLoadingBoundary: () => void;
  exitLoadingBoundary: () => void;
  startNavigation: () => void;
};

type NavigationState = {
  hasCommitted: boolean;
  isNavigating: boolean;
  loadingBoundaryCount: number;
  sourceRouteKey: string | null;
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

const initialNavigationState: NavigationState = {
  hasCommitted: false,
  isNavigating: false,
  loadingBoundaryCount: 0,
  sourceRouteKey: null,
};

export function AdminRouteProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${ pathname }?${ search }` : pathname;
  const [navigationState, setNavigationState] = useState<NavigationState>(initialNavigationState);

  const startNavigation = useCallback(() => {
    setNavigationState((current) => {
      if (current.isNavigating) {
        return current;
      }

      return {
        ...current,
        hasCommitted: false,
        isNavigating: true,
        sourceRouteKey: routeKey,
      };
    });
  }, [routeKey]);

  const enterLoadingBoundary = useCallback(() => {
    setNavigationState((current) => ({
      ...current,
      loadingBoundaryCount: current.loadingBoundaryCount + 1,
    }));
  }, []);

  const exitLoadingBoundary = useCallback(() => {
    setNavigationState((current) => ({
      ...current,
      loadingBoundaryCount: Math.max(0, current.loadingBoundaryCount - 1),
    }));
  }, []);

  const progressState = useMemo<AdminRouteProgressContextValue>(
    () => ({
      enterLoadingBoundary,
      exitLoadingBoundary,
      startNavigation,
    }),
    [enterLoadingBoundary, exitLoadingBoundary, startNavigation],
  );

  const { animationDuration, isFinished, progress } = useNProgress({
    animationDuration: 240,
    incrementDuration: 320,
    isAnimating: navigationState.isNavigating,
    minimum: 0.12,
  });

  useEffect(() => {
    setNavigationState((current) => {
      if (
        !current.isNavigating ||
        current.hasCommitted ||
        current.sourceRouteKey === null ||
        routeKey === current.sourceRouteKey
      ) {
        return current;
      }

      return {
        ...current,
        hasCommitted: true,
      };
    });
  }, [routeKey]);

  useEffect(() => {
    if (
      !navigationState.isNavigating ||
      !navigationState.hasCommitted ||
      navigationState.loadingBoundaryCount > 0
    ) {
      return;
    }

    setNavigationState((current) => {
      if (
        !current.isNavigating ||
        !current.hasCommitted ||
        current.loadingBoundaryCount > 0
      ) {
        return current;
      }

      return {
        ...current,
        hasCommitted: false,
        isNavigating: false,
        sourceRouteKey: null,
      };
    });
  }, [
    navigationState.hasCommitted,
    navigationState.isNavigating,
    navigationState.loadingBoundaryCount,
  ]);

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

export function AdminRouteLoadingSignal() {
  const progress = useContext(AdminRouteProgressContext);

  useLayoutEffect(() => {
    progress?.enterLoadingBoundary();

    return () => {
      progress?.exitLoadingBoundary();
    };
  }, [progress]);

  return null;
}

export function useAdminRouteProgress() {
  const progress = useContext(AdminRouteProgressContext);

  return useMemo(
    () => ({
      startNavigation: () => {
        progress?.startNavigation();
      },
    }),
    [progress],
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

    progress?.startNavigation();
  };

  return <Link ref={ ref } href={ href } onClick={ handleClick } target={ target } { ...props } />;
});

AdminProgressLink.displayName = "AdminProgressLink";
