import type { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

type DetailFacts = Record<string, string>;

type DetailContent = {
  aboutTourDescription: string;
  highlights: string[];
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
}: {
  detailT: Translator;
  itemT: Translator;
  itemId: string;
  languageLabel: string;
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
