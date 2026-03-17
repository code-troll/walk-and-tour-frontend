import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import type { components } from "@/lib/api/generated/backend-types";
import { createPublicApi } from "@/lib/api/public";

export type PublicTourResponse = components["schemas"]["PublicTourResponseDto"];
export type PublicTourType = PublicTourResponse["tourType"];
export type TourPayloadPoint = {
  label: string;
};
export type TourPayloadStop = {
  title: string;
  description: string;
};
export type TourPayload = {
  title: string;
  imageAlt?: string;
  aboutTourDescription?: string;
  customerSupportDescription?: string;
  itineraryDescription?: string;
  startPoint?: TourPayloadPoint;
  endPoint?: TourPayloadPoint;
  itineraryStops?: Record<string, TourPayloadStop>;
};
export type UiCommuteMode =
  | "walk"
  | "bike"
  | "bus"
  | "train"
  | "metro"
  | "tram"
  | "ferry"
  | "privateTransport"
  | "boat"
  | "other";
export type UiItineraryStop = {
  id: string;
  title: string;
  description: string;
  durationMinutes?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  nextConnection?: {
    durationMinutes?: number;
    mode: UiCommuteMode;
  };
};
export type UiResolvedTourItinerary = {
  stops: UiItineraryStop[];
};
export type TourFilterId =
  | "architecture"
  | "bike"
  | "boat"
  | "cruise"
  | "dayTrip"
  | "essential"
  | "freeTour"
  | "groupTour"
  | "history"
  | "privateTour"
  | "royalPalaces";
export type PublicTourCard = {
  id: string;
  slug: string;
  title: string;
  tag: string;
  rating: string;
  reviews: string;
  price?: string;
  duration: string;
  location: string;
  heroImageSrc: string;
  imageAlt: string;
  tagKeys: string[];
  tourType: PublicTourType;
};
export type PublicTourDetail = PublicTourCard & {
  bookingReferenceId?: string;
  tourImages: string[];
  highlights: string[];
  aboutTourDescription: string;
  itineraryDescription: string;
  itinerary: UiResolvedTourItinerary | null;
  includedItems: string[];
  notIncludedItems: string[];
  customerSupportDescription: string;
  meetingPoint: string;
  endPoint: string;
  cancellationType: string;
};
export type PublicTourDetailResult = {
  availableLocales: AppLocale[];
  contentLocale: AppLocale;
  isFallbackLanguage: boolean;
  tour: PublicTourDetail;
};
export type BookingOption = {
  id: string;
  label: string;
};

export const TOUR_FILTERS: { id: TourFilterId; tagKey: string }[] = [
  {id: "architecture", tagKey: "architecture"},
  {id: "bike", tagKey: "bike"},
  {id: "boat", tagKey: "boat"},
  {id: "cruise", tagKey: "cruise"},
  {id: "dayTrip", tagKey: "day-trip"},
  {id: "essential", tagKey: "essential"},
  {id: "freeTour", tagKey: "free-tour"},
  {id: "groupTour", tagKey: "group-tour"},
  {id: "history", tagKey: "history"},
  {id: "privateTour", tagKey: "private-tour"},
  {id: "royalPalaces", tagKey: "royal-palaces"},
];

const PUBLIC_TOUR_REVALIDATE_SECONDS = 60;
const NON_COMPANY_TOUR_TYPES: PublicTourType[] = ["private", "group", "tip_based"];
const COMPANY_TOUR_TYPES: PublicTourType[] = ["company"];
const fallbackLocationByLocale: Record<AppLocale, string> = {
  en: "Copenhagen",
  es: "Copenhague",
  it: "Copenaghen",
};
const fallbackTourTypeLabelByLocale: Record<AppLocale, Record<PublicTourType, string>> = {
  en: {
    private: "Private Tour",
    group: "Group Tour",
    tip_based: "Free Tour",
    company: "Corporate Experience",
  },
  es: {
    private: "Tour privado",
    group: "Tour en grupo",
    tip_based: "Tour gratuito",
    company: "Experiencia corporativa",
  },
  it: {
    private: "Tour privato",
    group: "Tour di gruppo",
    tip_based: "Tour gratuito",
    company: "Esperienza aziendale",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const asPayloadPoint = (value: unknown): TourPayloadPoint | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = asString(value.label).trim();
  return label ? {label} : undefined;
};

const asPayloadStops = (value: unknown): Record<string, TourPayloadStop> => {
  if (!isRecord(value)) {
    return {};
  }

  const entries: [string, TourPayloadStop][] = [];

  for (const [stopId, stop] of Object.entries(value)) {
    if (!isRecord(stop)) {
      continue;
    }

    const title = asString(stop.title).trim();
    const description = asString(stop.description).trim();

    if (!title || !description) {
      continue;
    }

    entries.push([stopId, {title, description}]);
  }

  return Object.fromEntries(entries);
};

const getPayload = (tour: PublicTourResponse): TourPayload => {
  const payload = isRecord(tour.translation.payload) ? tour.translation.payload : {};

  return {
    title: asString(payload.title).trim(),
    imageAlt: asString(payload.imageAlt).trim() || undefined,
    aboutTourDescription:
      asString(payload.aboutTourDescription).trim() ||
      asString(payload.description).trim() ||
      undefined,
    customerSupportDescription: asString(payload.customerSupportDescription).trim() || undefined,
    itineraryDescription: asString(payload.itineraryDescription).trim() || undefined,
    startPoint: asPayloadPoint(payload.startPoint),
    endPoint: asPayloadPoint(payload.endPoint),
    itineraryStops: asPayloadStops(payload.itineraryStops),
  };
};

const formatDecimalHours = (value: number, locale: AppLocale) =>
  locale === "en" ? String(value) : String(value).replace(".", ",");

const formatDuration = (minutes: number, locale: AppLocale) => {
  if (minutes < 60) {
    const unit = locale === "en" ? "min" : "min";
    return `${ minutes } ${ unit }`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    const unit =
      locale === "en"
        ? hours === 1 ? "hour" : "hours"
        : locale === "es"
          ? hours === 1 ? "hora" : "horas"
          : hours === 1 ? "ora" : "ore";

    return `${ hours } ${ unit }`;
  }

  if (minutes % 30 === 0) {
    const hours = minutes / 60;
    const unit = locale === "en" ? "hours" : locale === "es" ? "horas" : "ore";
    return `${ formatDecimalHours(hours, locale) } ${ unit }`;
  }

  return `${ minutes } min`;
};

const formatRating = (rating: number) =>
  Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1);

const formatReviewCount = (reviewCount: number, locale: AppLocale) =>
  new Intl.NumberFormat(locale).format(reviewCount);

const formatPrice = (tour: PublicTourResponse) => {
  if (tour.tourType === "tip_based") {
    return "0";
  }

  if (!tour.price) {
    return undefined;
  }

  return `${ tour.price.amount } ${ tour.price.currency }`;
};

const mapCommuteMode = (
  mode: components["schemas"]["TourNextConnectionResponseDto"]["commuteMode"],
): UiCommuteMode => (mode === "private-transport" ? "privateTransport" : mode);

const getLocalizedPointLabel = (
  point: components["schemas"]["PublicPointResponseDto"],
): string => {
  if (!point.localized || !isRecord(point.localized)) {
    return "";
  }

  return asString(point.localized.label).trim();
};

const resolveLocation = (tour: PublicTourResponse, payload: TourPayload, locale: AppLocale) =>
  payload.startPoint?.label ||
  payload.endPoint?.label ||
  getLocalizedPointLabel(tour.startPoint) ||
  getLocalizedPointLabel(tour.endPoint) ||
  fallbackLocationByLocale[locale];

const resolveTag = (tour: PublicTourResponse, locale: AppLocale) =>
  tour.tags
    .map((tag) => asString(tag.label).trim())
    .find((label) => label.length > 0) ||
  fallbackTourTypeLabelByLocale[locale][tour.tourType];

const getPrimaryMedia = (tour: PublicTourResponse) => tour.coverMedia ?? tour.galleryMedia[0] ?? null;

const getPrimaryImageSrc = (tour: PublicTourResponse) => getPrimaryMedia(tour)?.contentUrl || "";

const getPrimaryImageAlt = (tour: PublicTourResponse, locale: AppLocale, payload: TourPayload) => {
  const primaryMedia = getPrimaryMedia(tour);
  const altText = primaryMedia?.altText?.[locale];

  if (typeof altText === "string" && altText.trim()) {
    return altText;
  }

  return payload.imageAlt || payload.title || tour.slug;
};

const resolveHeroImages = (tour: PublicTourResponse) => {
  const imageUrls = [
    tour.coverMedia?.contentUrl,
    ...tour.galleryMedia.map((media) => media.contentUrl),
  ].filter((imageUrl): imageUrl is string => typeof imageUrl === "string" && imageUrl.length > 0);

  return Array.from(new Set(imageUrls));
};

const resolveItinerary = (tour: PublicTourResponse, payload: TourPayload): UiResolvedTourItinerary | null => {
  if (tour.itinerary.variant !== "stops" || !Array.isArray(tour.itinerary.stops)) {
    return null;
  }

  const payloadStops = payload.itineraryStops ?? {};
  const stops: UiItineraryStop[] = tour.itinerary.stops
    .map((stop): UiItineraryStop | null => {
      const payloadStop = payloadStops[stop.id];
      const title = payloadStop?.title || asString(stop.title).trim();
      const description = payloadStop?.description || asString(stop.description).trim();

      if (!title || !description) {
        return null;
      }

      return {
        id: stop.id,
        title,
        description,
        durationMinutes:
          typeof stop.durationMinutes === "number" && Number.isFinite(stop.durationMinutes)
            ? stop.durationMinutes
            : undefined,
        coordinates: stop.coordinates
          ? {
              lat: stop.coordinates.lat,
              lng: stop.coordinates.lng,
            }
          : undefined,
        nextConnection: stop.nextConnection
          ? {
              durationMinutes:
                typeof stop.nextConnection.durationMinutes === "number" &&
                Number.isFinite(stop.nextConnection.durationMinutes)
                  ? stop.nextConnection.durationMinutes
                  : undefined,
              mode: mapCommuteMode(stop.nextConnection.commuteMode),
            }
          : undefined,
      };
    })
    .filter((stop): stop is UiItineraryStop => Boolean(stop));

  return stops.length > 0 ? {stops} : null;
};

const normalizeTourCard = (tour: PublicTourResponse, locale: AppLocale): PublicTourCard => {
  const payload = getPayload(tour);

  return {
    id: tour.id,
    slug: tour.slug,
    title: payload.title || tour.slug,
    tag: resolveTag(tour, locale),
    rating: formatRating(tour.rating),
    reviews: formatReviewCount(tour.reviewCount, locale),
    price: formatPrice(tour),
    duration: formatDuration(tour.durationMinutes, locale),
    location: resolveLocation(tour, payload, locale),
    heroImageSrc: getPrimaryImageSrc(tour),
    imageAlt: getPrimaryImageAlt(tour, locale, payload),
    tagKeys: tour.tags.map((tag) => tag.key),
    tourType: tour.tourType,
  };
};

const normalizeTourDetail = (tour: PublicTourResponse, locale: AppLocale): PublicTourDetail => {
  const payload = getPayload(tour);
  const card = normalizeTourCard(tour, locale);

  return {
    ...card,
    bookingReferenceId: asString(tour.translation.bookingReferenceId).trim() || undefined,
    tourImages: resolveHeroImages(tour),
    highlights: tour.translation.highlights,
    aboutTourDescription: payload.aboutTourDescription || "",
    itineraryDescription:
      tour.itinerary.variant === "description"
        ? asString(tour.itinerary.itineraryDescription).trim() || payload.itineraryDescription || ""
        : payload.itineraryDescription || "",
    itinerary: resolveItinerary(tour, payload),
    includedItems: tour.translation.included,
    notIncludedItems: tour.translation.notIncluded,
    customerSupportDescription: payload.customerSupportDescription || "",
    meetingPoint: payload.startPoint?.label || getLocalizedPointLabel(tour.startPoint),
    endPoint: payload.endPoint?.label || getLocalizedPointLabel(tour.endPoint),
    cancellationType: tour.translation.cancellationType,
  };
};

const createCachedPublicApi = () => createPublicApi({revalidate: PUBLIC_TOUR_REVALIDATE_SECONDS});
const createUncachedPublicApi = () => createPublicApi({cache: "no-store"});

const getLocalizedPublicTour = async ({
  api,
  locale,
  slug,
}: {
  api: ReturnType<typeof createPublicApi>;
  locale: AppLocale;
  slug: string;
}) => {
  try {
    return await api.getTourBySlug({
      locale,
      slug,
    });
  } catch (error) {
    if (isBackendApiError(error) && error.statusCode === 404) {
      return null;
    }

    throw error;
  }
};

export const listPublicTourCards = async ({
  locale,
  tagKeys,
  tourTypes,
}: {
  locale: AppLocale;
  tagKeys?: string[];
  tourTypes?: PublicTourType[];
}) => {
  const api = createCachedPublicApi();
  const tours = await api.getTours({
    locale,
    ...(tagKeys && tagKeys.length > 0 ? {tagKeys} : {}),
    ...(tourTypes && tourTypes.length > 0 ? {tourTypes} : {}),
  });

  return tours.map((tour) => normalizeTourCard(tour, locale));
};

export const listPublicTourCardsSafe = async ({
  locale,
  tagKeys,
  tourTypes,
}: {
  locale: AppLocale;
  tagKeys?: string[];
  tourTypes?: PublicTourType[];
}) => {
  try {
    return await listPublicTourCards({locale, tagKeys, tourTypes});
  } catch (error) {
    console.error("Unable to load public tours", error);
    return [];
  }
};

export const listBookingOptionsSafe = async ({
  locale,
  tourTypes,
}: {
  locale: AppLocale;
  tourTypes: PublicTourType[];
}): Promise<BookingOption[]> => {
  const tours = await listPublicTourCardsSafe({locale, tourTypes});

  return tours.map((tour) => ({
    id: tour.id,
    label: tour.title,
  }));
};

export const getPublicTourDetailWithFallback = async ({
  expectedTourTypes,
  locale,
  slug,
}: {
  expectedTourTypes: PublicTourType[];
  locale: AppLocale;
  slug: string;
}): Promise<PublicTourDetailResult | null> => {
  const api = createUncachedPublicApi();
  const requestedTour = await getLocalizedPublicTour({
    api,
    locale,
    slug,
  });

  if (requestedTour) {
    if (!expectedTourTypes.includes(requestedTour.tourType)) {
      return null;
    }

    return {
      availableLocales: [locale],
      contentLocale: locale,
      isFallbackLanguage: false,
      tour: normalizeTourDetail(requestedTour, locale),
    };
  }

  const availableTours: {locale: AppLocale; tour: PublicTourResponse}[] = [];

  for (const candidateLocale of routing.locales) {
    if (candidateLocale === locale) {
      continue;
    }

    const candidateTour = await getLocalizedPublicTour({
      api,
      locale: candidateLocale,
      slug,
    });

    if (!candidateTour) {
      continue;
    }

    if (!expectedTourTypes.includes(candidateTour.tourType)) {
      return null;
    }

    availableTours.push({
      locale: candidateLocale,
      tour: candidateTour,
    });
  }

  if (availableTours.length === 0) {
    return null;
  }

  const availableLocales = availableTours.map((result) => result.locale);
  const contentLocale =
    routing.locales.find((candidateLocale) => availableLocales.includes(candidateLocale)) ?? availableLocales[0];
  const selectedTour = availableTours.find((result) => result.locale === contentLocale)?.tour;

  if (!selectedTour) {
    return null;
  }

  return {
    availableLocales,
    contentLocale,
    isFallbackLanguage: contentLocale !== locale,
    tour: normalizeTourDetail(selectedTour, contentLocale),
  };
};

export const listRelatedPublicToursSafe = async ({
  currentSlug,
  locale,
  limit = 3,
  tagKeys,
  tourTypes,
}: {
  currentSlug: string;
  locale: AppLocale;
  limit?: number;
  tagKeys: string[];
  tourTypes: PublicTourType[];
}) => {
  if (limit <= 0) {
    return [];
  }

  try {
    const matchingTours = tagKeys.length > 0
      ? (await listPublicTourCards({locale, tagKeys, tourTypes})).filter((tour) => tour.slug !== currentSlug)
      : [];

    if (matchingTours.length >= limit) {
      return matchingTours.slice(0, limit);
    }

    const selectedSlugs = new Set(matchingTours.map((tour) => tour.slug));
    selectedSlugs.add(currentSlug);

    const fallbackTours = (await listPublicTourCards({locale, tourTypes}))
      .filter((tour) => !selectedSlugs.has(tour.slug))
      .slice(0, limit - matchingTours.length);

    return [...matchingTours, ...fallbackTours];
  } catch (error) {
    console.error("Unable to load related public tours", error);
    return [];
  }
};

export const getExpectedTourTypesForPublicTours = () => NON_COMPANY_TOUR_TYPES;

export const getExpectedTourTypesForCompanyTours = () => COMPANY_TOUR_TYPES;

export const getLocalizedPublicTourTypeLabel = (
  locale: AppLocale,
  tourType: PublicTourType,
) => fallbackTourTypeLabelByLocale[locale][tourType];
