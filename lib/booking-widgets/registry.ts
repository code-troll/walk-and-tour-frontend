"use client";

import type { BookingWidgetProviderId } from "./providers";
import { isTuritopConfigured, mountTuritopWidgets, unmountTuritopWidgets } from "./turitop";
import { mountUnderstoryWidget } from "./understory";

export type BookingWidgetMountOptions = {
  container: HTMLElement;
  language: string;
  // The provider's identifier for the bookable product in this language.
  // Always set for a provider that requires one.
  productId?: string;
  // The tour's settings for this provider, such as a partner's account ids.
  settings: Record<string, string>;
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
  mount: ({ container, language, productId = "" }) => {
    mountTuritopWidgets([{ container, language, service: productId }]);

    return () => unmountTuritopWidgets([container]);
  },
};

const understoryAdapter: BookingWidgetAdapter = {
  // The account is the tour's, in its settings, which the backend requires
  // before the widget can be enabled.
  isConfigured: () => true,
  mount: ({ container, language, productId, settings }) =>
    mountUnderstoryWidget({
      container,
      companyId: settings.companyId ?? "",
      storefrontId: settings.storefrontId ?? "",
      language,
      experienceId: productId,
    }),
};

export const BOOKING_WIDGET_ADAPTERS: Record<BookingWidgetProviderId, BookingWidgetAdapter> = {
  turitop: turitopAdapter,
  understory: understoryAdapter,
};
