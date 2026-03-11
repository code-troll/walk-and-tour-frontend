import type { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import type {
  CommuteMode,
  LocalizedItineraryStopCopy,
  ResolvedTourItinerary,
  SharedTourItinerary,
} from "@/lib/tour-itineraries";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

type DetailFacts = Record<string, string>;

export type ItineraryUiLabels = {
  stopDuration: string;
  travelTime: string;
  showOnMap: string;
  transportModes: Record<CommuteMode, string>;
};

type DetailContent = {
  aboutTourDescription: string;
  highlights: string[];
  itinerary: ResolvedTourItinerary | null;
  itineraryDescription: string;
  includedItems: string[];
  notIncludedItems: string[];
  customerSupportDescription: string;
  facts: DetailFacts;
};

type DetailDisplayFallbacks = {
  tag: string;
  duration: string;
  location: string;
};

type DetailDisplay = {
  title: string;
  tag: string;
  duration: string;
  location: string;
};

type DetailHeroEntity = {
  heroImageSrc: string;
  galleryImageSrcs: readonly string[];
};

const getItemPath = (itemId: string, key: string) => `${ itemId }.${ key }`;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null
);

const isLocalizedItineraryStopCopy = (
  value: unknown
): value is LocalizedItineraryStopCopy => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    value.title.length > 0 &&
    typeof value.description === "string" &&
    value.description.length > 0
  );
};

const isLocalizedItineraryStopsMap = (
  value: unknown
): value is Record<string, LocalizedItineraryStopCopy> => {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(isLocalizedItineraryStopCopy);
};

export const getItemStringWithFallback = (
  itemT: Translator,
  itemId: string,
  key: string,
  fallback: string
) => {
  const itemPath = getItemPath(itemId, key);
  return itemT.has(itemPath) ? itemT(itemPath) : fallback;
};

export const getItemRawWithFallback = <T, >(
  itemT: Translator,
  itemId: string,
  key: string,
  fallback: T
): T => {
  const itemPath = getItemPath(itemId, key);
  return itemT.has(itemPath) ? (itemT.raw(itemPath) as T) : fallback;
};

export const getLocaleLanguageLabel = (
  locale: AppLocale,
  headerT: Translator
) => locale === "en"
  ? headerT("languages.EN")
  : locale === "es"
    ? headerT("languages.ES")
    : headerT("languages.IT");

export const resolveDetailDisplay = ({
  itemT,
  itemId,
  fallbacks,
}: {
  itemT: Translator;
  itemId: string;
  fallbacks: DetailDisplayFallbacks;
}): DetailDisplay => ({
  title: itemT(`${ itemId }.title`),
  tag: getItemStringWithFallback(itemT, itemId, "tag", fallbacks.tag),
  duration: getItemStringWithFallback(itemT, itemId, "duration", fallbacks.duration),
  location: getItemStringWithFallback(itemT, itemId, "location", fallbacks.location),
});

export const resolveDetailContent = ({
  detailT,
  itemT,
  itemId,
  languageLabel,
  itinerary = null,
}: {
  detailT: Translator;
  itemT: Translator;
  itemId: string;
  languageLabel: string;
  itinerary?: ResolvedTourItinerary | null;
}): DetailContent => {
  const defaultAboutTourDescription = detailT("defaults.aboutTourDescription");
  const aboutTourDescription = getItemStringWithFallback(
    itemT,
    itemId,
    "aboutTourDescription",
    getItemStringWithFallback(
      itemT,
      itemId,
      "description",
      defaultAboutTourDescription
    )
  );

  const defaultFacts = detailT.raw("defaults.facts") as DetailFacts;
  const itemFacts = getItemRawWithFallback<DetailFacts>(itemT, itemId, "facts", {});

  return {
    aboutTourDescription,
    highlights: getItemRawWithFallback<string[]>(
      itemT,
      itemId,
      "highlights",
      detailT.raw("defaults.highlights") as string[]
    ),
    itinerary,
    itineraryDescription: getItemStringWithFallback(
      itemT,
      itemId,
      "itineraryDescription",
      detailT("defaults.itineraryDescription")
    ),
    includedItems: getItemRawWithFallback<string[]>(
      itemT,
      itemId,
      "included",
      detailT.raw("defaults.included") as string[]
    ),
    notIncludedItems: getItemRawWithFallback<string[]>(
      itemT,
      itemId,
      "notIncluded",
      detailT.raw("defaults.notIncluded") as string[]
    ),
    customerSupportDescription: getItemStringWithFallback(
      itemT,
      itemId,
      "customerSupportDescription",
      detailT("defaults.customerSupportDescription")
    ),
    facts: {
      ...defaultFacts,
      ...itemFacts,
      language: languageLabel,
    },
  };
};

export const resolveTourItinerary = ({
  itemT,
  itemId,
  sharedItinerary,
}: {
  itemT: Translator;
  itemId: string;
  sharedItinerary: SharedTourItinerary | null;
}): ResolvedTourItinerary | null => {
  if (!sharedItinerary) {
    return null;
  }

  const rawStopsCopy = getItemRawWithFallback<unknown>(
    itemT,
    itemId,
    "itineraryStops",
    null
  );

  if (!isLocalizedItineraryStopsMap(rawStopsCopy)) {
    return null;
  }

  const stops = sharedItinerary.stops.map((stop) => {
    const localizedStopCopy = rawStopsCopy[stop.id];

    return localizedStopCopy
      ? {
          ...stop,
          ...localizedStopCopy,
        }
      : null;
  });

  const resolvedStops: ResolvedTourItinerary["stops"] = [];

  for (const stop of stops) {
    if (!stop) {
      return null;
    }

    resolvedStops.push(stop);
  }

  return {stops: resolvedStops};
};

export const buildItineraryUiLabels = (detailT: Translator): ItineraryUiLabels => ({
  stopDuration: detailT("labels.stopDuration"),
  travelTime: detailT("labels.travelTime"),
  showOnMap: detailT("labels.showOnMap"),
  transportModes: {
    walk: detailT("transportModes.walk"),
    bike: detailT("transportModes.bike"),
    bus: detailT("transportModes.bus"),
    train: detailT("transportModes.train"),
    metro: detailT("transportModes.metro"),
    tram: detailT("transportModes.tram"),
    ferry: detailT("transportModes.ferry"),
    privateTransport: detailT("transportModes.privateTransport"),
    boat: detailT("transportModes.boat"),
    other: detailT("transportModes.other"),
  },
});

export const buildQuickInfoItems = ({
  detailT,
  facts,
}: {
  detailT: Translator;
  facts: DetailFacts;
}) => [
  {
    id: "startFrom" as const,
    label: detailT("labels.startFrom"),
    value: facts.meetingPoint,
  },
  {
    id: "endAt" as const,
    label: detailT("labels.endAt"),
    value: facts.endPoint,
  },
  {
    id: "typeTour" as const,
    label: detailT("labels.typeTour"),
    value: facts.typeTour,
  },
  {
    id: "cancellationType" as const,
    label: detailT("labels.cancellationType"),
    value: facts.cancellationType,
  },
  {
    id: "languages" as const,
    label: detailT("labels.language"),
    value: facts.language,
  },
];

export const resolveHeroImages = (entity: DetailHeroEntity) => Array.from(
  new Set([
    entity.heroImageSrc,
    ...entity.galleryImageSrcs,
  ].filter((imageSrc) => Boolean(imageSrc)))
);
