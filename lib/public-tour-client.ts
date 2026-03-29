"use client";

import type {AppLocale} from "@/i18n/routing";
import {fetchJson} from "@/lib/api/client-json";
import type {components} from "@/lib/api/generated/backend-types";
import {
  type BookingOption,
  getExpectedTourTypesForCompanyTours,
  getExpectedTourTypesForPublicTours,
  type PublicTourCard,
  type PublicTourDetailResult,
  type PublicTourResponse,
  type PublicTourType,
  normalizeTourCard,
  resolvePublicTourFallback,
} from "@/lib/public-tour-model";

const buildQuery = (values: Record<string, string | string[] | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    searchParams.set(key, value);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const getPublicTourBySlug = async ({
  locale,
  slug,
}: {
  locale: AppLocale;
  slug: string;
}) =>
  fetchJson<PublicTourResponse | null>({
    input: `/api/internal/public/api/public/tours/${slug}${buildQuery({locale})}`,
    fallbackMessage: "Unable to load the public tour.",
    notFoundFallback: null,
  });

export const listPublicTourCardsClient = async ({
  locale,
  tagKeys,
  tourTypes,
}: {
  locale: AppLocale;
  tagKeys?: string[];
  tourTypes?: PublicTourType[];
}): Promise<PublicTourCard[]> => {
  const tours = await fetchJson<components["schemas"]["PublicTourResponseDto"][]>({
    input: `/api/internal/public/api/public/tours${buildQuery({
      locale,
      tagKeys,
      tourTypes,
    })}`,
    fallbackMessage: "Unable to load public tours.",
  });

  return tours.map((tour) => normalizeTourCard(tour, locale));
};

export const listPublicTourCardsSafeClient = async ({
  locale,
  tagKeys,
  tourTypes,
}: {
  locale: AppLocale;
  tagKeys?: string[];
  tourTypes?: PublicTourType[];
}) => {
  try {
    return await listPublicTourCardsClient({locale, tagKeys, tourTypes});
  } catch (error) {
    console.error("Unable to load public tours", error);
    return [];
  }
};

export const listBookingOptionsSafeClient = async ({
  locale,
  tourTypes,
}: {
  locale: AppLocale;
  tourTypes: PublicTourType[];
}): Promise<BookingOption[]> => {
  const tours = await listPublicTourCardsSafeClient({locale, tourTypes});

  return tours.map((tour) => ({
    id: tour.id,
    label: tour.title,
  }));
};

export const getPublicTourDetailWithFallbackClient = async ({
  expectedTourTypes,
  locale,
  slug,
}: {
  expectedTourTypes: PublicTourType[];
  locale: AppLocale;
  slug: string;
}): Promise<PublicTourDetailResult | null> => {
  const resolvedTour = await getPublicTourBySlug({locale, slug});

  if (!resolvedTour) {
    return null;
  }

  return resolvePublicTourFallback({
    expectedTourTypes,
    locale,
    requestedTour: resolvedTour,
    availableTranslations: resolvedTour.availableTranslations ?? [],
    urlSlug: slug,
  });
};

export const listRelatedPublicToursSafeClient = async ({
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
  const tours = await listPublicTourCardsSafeClient({
    locale,
    tagKeys,
    tourTypes,
  });

  return tours.filter((tour) => tour.slug !== currentSlug).slice(0, limit);
};

export const loadHomeToursClient = (locale: AppLocale) =>
  listPublicTourCardsSafeClient({
    locale,
    tourTypes: getExpectedTourTypesForPublicTours(),
  }).then((tours) => tours.slice(0, 3));

export const loadCompanyToursClient = (locale: AppLocale) =>
  listPublicTourCardsSafeClient({
    locale,
    tourTypes: getExpectedTourTypesForCompanyTours(),
  });
