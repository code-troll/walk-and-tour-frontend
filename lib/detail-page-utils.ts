import type { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import type { CommuteMode } from "@/lib/tour-itineraries";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

type DetailFacts = Record<string, string>;

export type ItineraryUiLabels = {
  stopDuration: string;
  travelTime: string;
  showOnMap: string;
  transportModes: Record<CommuteMode, string>;
};

export const getLocaleLanguageLabel = (
  locale: AppLocale,
  headerT: Translator
) => locale === "en"
  ? headerT("languages.EN")
  : locale === "es"
    ? headerT("languages.ES")
    : headerT("languages.IT");

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
    id: "language" as const,
    label: detailT("labels.language"),
    value: facts.language,
  },
];
