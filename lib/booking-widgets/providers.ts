// Provider metadata shared by the browser code and next.config.ts, so it must
// stay free of DOM access and "use client".

export const BOOKING_WIDGET_PROVIDERS = ["turitop", "understory"] as const;

export type BookingWidgetProviderId = (typeof BOOKING_WIDGET_PROVIDERS)[number];

type BookingWidgetProviderInfo = {
  id: BookingWidgetProviderId;
  label: string;
  // How the admin labels the per-locale product id (a translation's
  // bookingReferenceId). Null for a provider that ignores it; one that uses it
  // shows the booking-request form in a locale without one.
  productId: { label: string; placeholder: string } | null;
  // Settings stored on the tour, all required to enable the widget. With
  // productId, they must match the backend's TOUR_BOOKING_PROVIDER_RULES.
  settingFields: { key: string; label: string }[];
  // Origins the provider loads its booking iframe from. They feed the CSP frame-src.
  frameHosts: string[];
};

export const BOOKING_WIDGET_PROVIDER_INFO: Record<BookingWidgetProviderId, BookingWidgetProviderInfo> = {
  turitop: {
    id: "turitop",
    label: "Turitop",
    productId: { label: "Turitop service code", placeholder: "P7" },
    settingFields: [],
    frameHosts: [
      "https://app.turitop.com",
      "https://www.turitop.com",
      "https://turitop.com",
    ],
  },
  // Books against a partner's account (The Silvers' storefront for our guests),
  // which is why its ids live on the tour rather than in the environment. It
  // shows the whole storefront, so the Turitop codes a tour kept are ignored.
  // The widget renders in a shadow root on the page, not in an iframe.
  understory: {
    id: "understory",
    label: "Understory",
    productId: null,
    settingFields: [
      { key: "companyId", label: "Company ID" },
      { key: "storefrontId", label: "Storefront ID" },
    ],
    frameHosts: [],
  },
};

export const isBookingWidgetProviderId = (value: unknown): value is BookingWidgetProviderId =>
  typeof value === "string" && (BOOKING_WIDGET_PROVIDERS as readonly string[]).includes(value);

// A blog block carries a product id and nothing else, so a post can place only
// a provider that uses one and needs no settings.
export const BLOG_BOOKING_WIDGET_PROVIDERS = BOOKING_WIDGET_PROVIDERS.filter(
  (provider) =>
    BOOKING_WIDGET_PROVIDER_INFO[provider].productId !== null &&
    BOOKING_WIDGET_PROVIDER_INFO[provider].settingFields.length === 0,
);

// For a blog provider, which always has a product id field.
export const getBlogProductIdField = (provider: BookingWidgetProviderId) =>
  BOOKING_WIDGET_PROVIDER_INFO[provider].productId ?? { label: "Booking code", placeholder: "" };

export const getBookingWidgetFrameHosts = () =>
  BOOKING_WIDGET_PROVIDERS.flatMap((provider) => BOOKING_WIDGET_PROVIDER_INFO[provider].frameHosts);

export type TourBooking = {
  provider: BookingWidgetProviderId;
  productId?: string;
  settings: Record<string, string>;
};

// The public tour API sends `booking: null` when the page should show the
// booking-request form; a provider this build does not know means the same.
export const toTourBooking = (
  value: { provider: string; productId?: string | null; settings: Record<string, string> } | null | undefined,
): TourBooking | undefined => {
  if (!value || !isBookingWidgetProviderId(value.provider)) {
    return undefined;
  }

  const usesProductId = BOOKING_WIDGET_PROVIDER_INFO[value.provider].productId !== null;
  const productId = usesProductId ? value.productId?.trim() || undefined : undefined;
  if (usesProductId && !productId) {
    return undefined;
  }

  return { provider: value.provider, productId, settings: value.settings };
};
