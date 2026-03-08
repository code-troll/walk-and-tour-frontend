import type { TourDetailCtaTarget } from "@/lib/landing-data";

export type CompanyExperienceId =
  | "smorrebrodExperience"
  | "canalBoatTour"
  | "danishBeerTasting"
  | "danishCollageWorkshop";

export type CompanyExperienceSlug =
  | "danish-smorrebrod-experience"
  | "canal-boat-tour"
  | "danish-beer-tasting"
  | "danish-collage-workshop";

export type CompanyExperienceCategoryId =
  | "corporate"
  | "teamBuilding"
  | "food"
  | "boat"
  | "beer"
  | "creative";

export const companyExperienceSlugById = {
  smorrebrodExperience: "danish-smorrebrod-experience",
  canalBoatTour: "canal-boat-tour",
  danishBeerTasting: "danish-beer-tasting",
  danishCollageWorkshop: "danish-collage-workshop",
} as const satisfies Record<CompanyExperienceId, CompanyExperienceSlug>;

export type CompanyExperience = {
  id: CompanyExperienceId;
  slug: CompanyExperienceSlug;
  rating: string;
  reviews: string;
  categories: CompanyExperienceCategoryId[];
  heroImageSrc: string;
  galleryImageSrcs?: readonly string[];
  bookingTarget?: TourDetailCtaTarget;
  supportTarget?: TourDetailCtaTarget;
};

export type ResolvedCompanyExperience = CompanyExperience & {
  galleryImageSrcs: readonly string[];
  bookingTarget: TourDetailCtaTarget;
  supportTarget: TourDetailCtaTarget;
};

const defaultBookingTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

const defaultSupportTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

export const companyExperiences: CompanyExperience[] = [
  {
    id: "smorrebrodExperience",
    slug: companyExperienceSlugById.smorrebrodExperience,
    rating: "4.9",
    reviews: "128",
    categories: [
      "corporate",
      "teamBuilding",
      "food",
    ],
    heroImageSrc: "/walkandtour/companies/food-tours.jpg",
    galleryImageSrcs: [
      `/walkandtour/companies/${ companyExperienceSlugById.smorrebrodExperience }/1.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.smorrebrodExperience }/2.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.smorrebrodExperience }/3.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.smorrebrodExperience }/4.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.smorrebrodExperience }/5.jpg`,
    ],
  },
  {
    id: "canalBoatTour",
    slug: companyExperienceSlugById.canalBoatTour,
    rating: "4.9",
    reviews: "96",
    categories: [
      "corporate",
      "teamBuilding",
      "boat",
    ],
    heroImageSrc: "/walkandtour/tours/boat-tour.jpg",
  },
  {
    id: "danishBeerTasting",
    slug: companyExperienceSlugById.danishBeerTasting,
    rating: "4.8",
    reviews: "84",
    categories: [
      "corporate",
      "teamBuilding",
      "beer",
      "food",
    ],
    heroImageSrc: "/walkandtour/companies/beer-tour.jpg",
    galleryImageSrcs: [
      `/walkandtour/companies/${ companyExperienceSlugById.danishBeerTasting }/1.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.danishBeerTasting }/2.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.danishBeerTasting }/3.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.danishBeerTasting }/4.jpg`,
      `/walkandtour/companies/${ companyExperienceSlugById.danishBeerTasting }/5.jpg`,
    ],
  },
  {
    id: "danishCollageWorkshop",
    slug: companyExperienceSlugById.danishCollageWorkshop,
    rating: "4.9",
    reviews: "73",
    heroImageSrc: "/walkandtour/about/gallery-city.jpg",
    categories: [
      "corporate",
      "teamBuilding",
      "creative",
    ],
  },
];

const resolveCompanyExperience = (
  companyExperience: CompanyExperience
): ResolvedCompanyExperience => ({
  ...companyExperience,
  galleryImageSrcs:
    companyExperience.galleryImageSrcs && companyExperience.galleryImageSrcs.length > 0
      ? companyExperience.galleryImageSrcs
      : [companyExperience.heroImageSrc],
  bookingTarget: companyExperience.bookingTarget ?? defaultBookingTarget,
  supportTarget: companyExperience.supportTarget ?? defaultSupportTarget,
});

export const companyExperienceSlugs: CompanyExperienceSlug[] = companyExperiences.map(
  (companyExperience) => companyExperience.slug
);

export const getCompanyExperienceBySlug = (
  snug: string
): CompanyExperience | undefined =>
  companyExperiences.find((companyExperience) => companyExperience.slug === snug);

export const getResolvedCompanyExperienceBySlug = (
  snug: string
): ResolvedCompanyExperience | undefined => {
  const companyExperience = getCompanyExperienceBySlug(snug);
  return companyExperience ? resolveCompanyExperience(companyExperience) : undefined;
};
