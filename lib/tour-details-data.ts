import type { InternalTarget } from "@/lib/internal-paths";
import {
  tourSlugById,
  toursCatalog,
  type Tour,
  type TourId,
  type TourSlugById,
  type TourSlug,
} from "@/lib/landing-data";

export type TourDetailCtaTarget =
  | { kind: "internal"; target: InternalTarget; }
  | { kind: "external"; href: string; };

export type TourDetail = {
  slug: TourSlug;
  tourId: TourId;
  heroImageSrc: string;
  galleryImageSrcs: readonly string[];
  bookingTarget: TourDetailCtaTarget;
  supportTarget: TourDetailCtaTarget;
  mapHref?: string;
  relatedTourIds: readonly TourId[];
};

type TourDetailOverrides = Partial<Omit<TourDetail, "slug" | "tourId">>;
type TourDetailOverridesByTourId = {
  [K in TourId]?: TourDetailOverrides & { slug: TourSlugById[K]; };
};

const defaultBookingTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

const defaultSupportTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

const createRelatedTourIds = (tourId: TourId): TourId[] => (
  toursCatalog
    .filter((tour) => tour.id !== tourId)
    .slice(0, 3)
    .map((tour) => tour.id)
);

const tourDetailOverridesByTourId: TourDetailOverridesByTourId = {
  copenhagenFreeTour: {
    slug: tourSlugById.copenhagenFreeTour,
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/1.png`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/2.png`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/3.png`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/4.png`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/5.png`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/6.png`,
    ],
    bookingTarget: {
      kind: "external",
      href: "https://www.tripadvisor.com/Attraction_Review-g189541-d33403499-Reviews-Walk_and_Tour-Copenhagen_Zealand.html",
    },
    mapHref: "https://maps.app.goo.gl/pWqY5GfNPPtoDK3x6",
    relatedTourIds: [
      "copenhagenEssentials",
      "shoreExcursion",
      "christiansborgPalace",
    ],
  },
};

const toTourDetail = (tour: Tour): TourDetail => {
  const override = tourDetailOverridesByTourId[tour.id];

  return {
    slug: override?.slug ?? tour.slug,
    tourId: tour.id,
    heroImageSrc: override?.heroImageSrc ?? tour.image.src,
    galleryImageSrcs: override?.galleryImageSrcs ?? [tour.image.src],
    bookingTarget: override?.bookingTarget ?? defaultBookingTarget,
    supportTarget: override?.supportTarget ?? defaultSupportTarget,
    mapHref: override?.mapHref,
    relatedTourIds: override?.relatedTourIds ?? createRelatedTourIds(tour.id),
  };
};

export const tourDetailsCatalog: TourDetail[] = toursCatalog.map(toTourDetail);

export const tourDetailsBySlug: Record<TourSlug, TourDetail> = Object.fromEntries(
  tourDetailsCatalog.map((tourDetail) => [tourDetail.slug, tourDetail])
) as Record<TourSlug, TourDetail>;

export const tourDetailSlugs: TourSlug[] = tourDetailsCatalog.map(
  (tourDetail) => tourDetail.slug
);

export const getTourDetailBySlug = (snug: string): TourDetail | undefined => (
  tourDetailsBySlug[snug as TourSlug]
);

export const getTourBySlug = (snug: string): Tour | undefined => (
  toursCatalog.find((tour) => tour.slug === snug)
);
