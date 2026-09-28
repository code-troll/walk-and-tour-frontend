// Provider metadata shared by the browser code and next.config.ts, so it must
// stay free of DOM access and "use client".

export const BOOKING_WIDGET_PROVIDERS = ["turitop", "understory"] as const;

export type BookingWidgetProviderId = (typeof BOOKING_WIDGET_PROVIDERS)[number];

type BookingWidgetProviderInfo = {
  id: BookingWidgetProviderId;
  label: string;
  // How the admin labels the per-locale product id (a translation's bookingReferenceId).
  productIdLabel: string;
  productIdPlaceholder: string;
  // Without a product id a locale shows the booking-request form. Understory
  // shows the whole storefront instead.
  requiresProductId: boolean;
  // Settings stored on the tour, all required to enable the widget. They must
  // match the backend's TOUR_BOOKING_PROVIDER_RULES.
  settingFields: { key: string; label: string }[];
  // Whether a blog post can place this widget. The blog block carries only a
  // product id, so a provider that needs settings is left out.
  isAvailableInBlog: boolean;
  // Origins the provider loads its booking iframe from. They feed the CSP frame-src.
  frameHosts: string[];
};

export const BOOKING_WIDGET_PROVIDER_INFO: Record<BookingWidgetProviderId, BookingWidgetProviderInfo> = {
  turitop: {
    id: "turitop",
    label: "Turitop",
    productIdLabel: "Turitop service code",
    productIdPlaceholder: "P7",
    requiresProductId: true,
    settingFields: [],
    isAvailableInBlog: true,
    frameHosts: [
      "https://app.turitop.com",
      "https://www.turitop.com",
      "https://turitop.com",
    ],
  },
  // Books against a partner's account (The Silvers' storefront for our guests),
  // which is why its ids live on the tour rather than in the environment. The
  // widget renders in a shadow root on the page, not in an iframe.
  understory: {
    id: "understory",
    label: "Understory",
    productIdLabel: "Understory experience ID",
    productIdPlaceholder: "Optional",
    requiresProductId: false,
    settingFields: [
      { key: "companyId", label: "Company ID" },
      { key: "storefrontId", label: "Storefront ID" },
    ],
    isAvailableInBlog: false,
    frameHosts: [],
  },
};

export const isBookingWidgetProviderId = (value: unknown): value is BookingWidgetProviderId =>
  typeof value === "string" && (BOOKING_WIDGET_PROVIDERS as readonly string[]).includes(value);

export const BLOG_BOOKING_WIDGET_PROVIDERS = BOOKING_WIDGET_PROVIDERS.filter(
  (provider) => BOOKING_WIDGET_PROVIDER_INFO[provider].isAvailableInBlog,
);

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

  const productId = value.productId?.trim() || undefined;
  if (!productId && BOOKING_WIDGET_PROVIDER_INFO[value.provider].requiresProductId) {
    return undefined;
  }

  return { provider: value.provider, productId, settings: value.settings };
};
