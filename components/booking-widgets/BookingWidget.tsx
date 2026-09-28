"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BOOKING_WIDGET_ADAPTERS } from "@/lib/booking-widgets/registry";
import type { BookingWidgetProviderId } from "@/lib/booking-widgets/providers";

type BookingWidgetProps = {
  className?: string;
  fallback: ReactNode;
  language?: string;
  productId?: string;
  provider?: BookingWidgetProviderId;
};

const isDisplayed = (element: HTMLElement) => element.getClientRects().length > 0;

export default function BookingWidget({
  className,
  fallback,
  language,
  productId,
  provider,
}: BookingWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapter = provider ? BOOKING_WIDGET_ADAPTERS[provider] : undefined;
  const canRender = Boolean(adapter && productId && language && adapter.isConfigured());

  useEffect(() => {
    const container = containerRef.current;

    if (!canRender || !adapter || !productId || !language || !container) {
      return;
    }

    let unmount: (() => void) | undefined;

    // A page can render this component in a slot hidden at the current
    // breakpoint (the tour sidebar exists once for mobile and once for
    // desktop). Mount only once the container is actually displayed.
    const resizeObserver = new ResizeObserver(() => {
      if (unmount || !isDisplayed(container)) {
        return;
      }

      unmount = adapter.mount({ container, language, productId });
      resizeObserver.disconnect();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      unmount?.();
    };
  }, [adapter, canRender, language, productId]);

  if (!canRender) {
    return fallback;
  }

  return <div ref={ containerRef } className={ className }/>;
}
