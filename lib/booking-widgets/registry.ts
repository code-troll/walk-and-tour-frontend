"use client";

import type { BookingWidgetProviderId } from "./providers";
import { isTuritopConfigured, mountTuritopWidgets, unmountTuritopWidgets } from "./turitop";

export type BookingWidgetMountOptions = {
  container: HTMLElement;
  language: string;
  // The provider's identifier for the bookable product in this language.
  productId: string;
};

export type BookingWidgetAdapter = {
  // False when the account configuration the provider needs is missing, in
  // which case callers render their fallback instead of an empty widget.
  isConfigured: () => boolean;
  // Renders the widget into the container and returns its cleanup.
  mount: (options: BookingWidgetMountOptions) => () => void;
};

const turitopAdapter: BookingWidgetAdapter = {
  isConfigured: isTuritopConfigured,
  mount: ({ container, language, productId }) => {
    mountTuritopWidgets([{ container, language, service: productId }]);

    return () => unmountTuritopWidgets([container]);
  },
};

export const BOOKING_WIDGET_ADAPTERS: Record<BookingWidgetProviderId, BookingWidgetAdapter> = {
  turitop: turitopAdapter,
};
