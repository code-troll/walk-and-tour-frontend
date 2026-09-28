// Provider metadata shared by the browser code and next.config.ts, so it must
// stay free of DOM access and "use client".

export const BOOKING_WIDGET_PROVIDERS = ["turitop"] as const;

export type BookingWidgetProviderId = (typeof BOOKING_WIDGET_PROVIDERS)[number];

type BookingWidgetProviderInfo = {
  id: BookingWidgetProviderId;
  label: string;
  // Origins the provider loads its booking iframe from. They feed the CSP frame-src.
  frameHosts: string[];
};

export const BOOKING_WIDGET_PROVIDER_INFO: Record<BookingWidgetProviderId, BookingWidgetProviderInfo> = {
  turitop: {
    id: "turitop",
    label: "Turitop",
    frameHosts: [
      "https://app.turitop.com",
      "https://www.turitop.com",
      "https://turitop.com",
    ],
  },
};

export const isBookingWidgetProviderId = (value: unknown): value is BookingWidgetProviderId =>
  typeof value === "string" && (BOOKING_WIDGET_PROVIDERS as readonly string[]).includes(value);

export const getBookingWidgetFrameHosts = () =>
  BOOKING_WIDGET_PROVIDERS.flatMap((provider) => BOOKING_WIDGET_PROVIDER_INFO[provider].frameHosts);
