// Provider metadata shared by the browser code and next.config.ts, so it must
// stay free of DOM access and "use client".

export const BOOKING_WIDGET_PROVIDERS = ["turitop"] as const;

export type BookingWidgetProviderId = (typeof BOOKING_WIDGET_PROVIDERS)[number];

type BookingWidgetProviderInfo = {
  id: BookingWidgetProviderId;
  label: string;
  // How the admin labels the per-locale product id (a translation's bookingReferenceId).
  productIdLabel: string;
  productIdPlaceholder: string;
  // Origins the provider loads its booking iframe from. They feed the CSP frame-src.
  frameHosts: string[];
};

export const BOOKING_WIDGET_PROVIDER_INFO: Record<BookingWidgetProviderId, BookingWidgetProviderInfo> = {
  turitop: {
    id: "turitop",
    label: "Turitop",
    productIdLabel: "Turitop service code",
    productIdPlaceholder: "P7",
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

export type TourBooking = {
  provider: BookingWidgetProviderId;
  productId: string;
};

// The public tour API sends `booking: null` when the page should show the
// booking-request form; a provider this build does not know means the same.
export const toTourBooking = (
  value: { provider: string; productId: string } | null | undefined,
): TourBooking | undefined => {
  const productId = value?.productId.trim();

  if (!value || !productId || !isBookingWidgetProviderId(value.provider)) {
    return undefined;
  }

  return { provider: value.provider, productId };
};
