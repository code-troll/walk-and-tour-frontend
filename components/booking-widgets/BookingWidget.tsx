"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { BOOKING_WIDGET_ADAPTERS } from "@/lib/booking-widgets/registry";
import { BOOKING_WIDGET_PROVIDER_INFO, type BookingWidgetProviderId } from "@/lib/booking-widgets/providers";

type BookingWidgetProps = {
  className?: string;
  fallback: ReactNode;
  language?: string;
  productId?: string;
  provider?: BookingWidgetProviderId;
  settings?: Record<string, string>;
};

const NO_SETTINGS: Record<string, string> = {};

const isDisplayed = (element: HTMLElement) => element.getClientRects().length > 0;

export default function BookingWidget({
  className,
  fallback,
  language,
  productId,
  provider,
  settings = NO_SETTINGS,
}: BookingWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapter = provider ? BOOKING_WIDGET_ADAPTERS[provider] : undefined;
  const hasRequiredProductId = Boolean(productId || (provider && !BOOKING_WIDGET_PROVIDER_INFO[provider].requiresProductId));
  const canRender = Boolean(adapter && hasRequiredProductId && language && adapter.isConfigured());

  useEffect(() => {
    const container = containerRef.current;

    if (!canRender || !adapter || !language || !container) {
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

      unmount = adapter.mount({ container, language, productId, settings });
      resizeObserver.disconnect();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      unmount?.();
    };
  }, [adapter, canRender, language, productId, settings]);

  if (!canRender) {
    return fallback;
  }

  return <div ref={ containerRef } className={ className }/>;
}
