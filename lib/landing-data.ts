import { routing, type AppLocale } from "@/i18n/routing";
import type { InternalTarget } from "@/lib/internal-paths";

export type NavLink = {
  id: "home" | "tours" | "about" | "companies" | "blog" | "contact";
  target: InternalTarget;
};

export type TourCategoryId =
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

export type TourId =
  | "copenhagenFreeTour"
  | "rosenborgCastleTour"
  | "malmoExcursion"
  | "amalienborgPalace"
  | "christiansborgPalace"
  | "copenhagenEssentials"
  | "jewishQuarter"
  | "tivoliGardensEntry"
  | "boatTour"
  | "royalDeerParkBikeTour"
  | "harborArchitecture"
  | "rosenborgCastleCanalCruise"
  | "frederiksborgAndKronborgCastle"
  | "foodTours"
  | "roskilde"
  | "nordhavnArchitecture"
  | "christmasTour"
  | "panorama"
  | "shoreExcursion"
  | "copenhagenCityToCoast";

export type TourSlug =
  | "copenhagen-historic-center-free-tour"
  | "rosenborg-castle"
  | "excursion-to-malmo-sweden"
  | "amalienborg-palace"
  | "christiansborg-palace"
  | "copenhagen-essentials"
  | "jewish-quarter-and-danish-jewish-museum"
  | "copenhagen-walking-tour-tivoli-gardens-entry"
  | "boat-tour-gateway"
  | "bike-tour-deer-park"
  | "copenhagen-harbor-architecture"
  | "rosenborg-castle-and-canal-cruise"
  | "frederiksborg-and-kronborg-castle"
  | "copenhagen-food-tour"
  | "roskilde-old-viking-city"
  | "nordhavn-architecture"
  | "private-ultimate-christmas-tivoli-hygge"
  | "copenhagen-panorama-private-shore-to-city-experience"
  | "copenhagen-walking-shore-excursion"
  | "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen";

export const tourSlugById = {
  copenhagenFreeTour: "copenhagen-historic-center-free-tour",
  rosenborgCastleTour: "rosenborg-castle",
  malmoExcursion: "excursion-to-malmo-sweden",
  amalienborgPalace: "amalienborg-palace",
  christiansborgPalace: "christiansborg-palace",
  copenhagenEssentials: "copenhagen-essentials",
  jewishQuarter: "jewish-quarter-and-danish-jewish-museum",
  tivoliGardensEntry: "copenhagen-walking-tour-tivoli-gardens-entry",
  boatTour: "boat-tour-gateway",
  royalDeerParkBikeTour: "bike-tour-deer-park",
  harborArchitecture: "copenhagen-harbor-architecture",
  rosenborgCastleCanalCruise: "rosenborg-castle-and-canal-cruise",
  frederiksborgAndKronborgCastle: "frederiksborg-and-kronborg-castle",
  foodTours: "copenhagen-food-tour",
  roskilde: "roskilde-old-viking-city",
  nordhavnArchitecture: "nordhavn-architecture",
  christmasTour: "private-ultimate-christmas-tivoli-hygge",
  panorama: "copenhagen-panorama-private-shore-to-city-experience",
  shoreExcursion: "copenhagen-walking-shore-excursion",
  copenhagenCityToCoast: "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen",
} as const satisfies Record<TourId, TourSlug>;

export type TourDetailCtaTarget =
  | { kind: "internal"; target: InternalTarget; }
  | { kind: "external"; href: string; };

export type TourLocaleAvailabilityEntry = {
  bookingReferenceId?: string;
};

export type TourLocaleAvailability = Partial<Record<AppLocale, TourLocaleAvailabilityEntry>>;

export type Tour = {
  id: TourId;
  slug: TourSlug;
  rating: string;
  reviews: string;
  price: string;
  categories: TourCategoryId[];
  heroImageSrc: string;
  galleryImageSrcs: readonly string[];
  localeAvailability: TourLocaleAvailability;
  bookingTarget?: TourDetailCtaTarget;
  supportTarget?: TourDetailCtaTarget;
};

export type ResolvedTour = Tour & {
  heroImageSrc: string;
  galleryImageSrcs: readonly string[];
  bookingTarget: TourDetailCtaTarget;
  supportTarget: TourDetailCtaTarget;
};

export type WhyChoose = {
  headingKey: "heading";
  descriptionKey: "description";
  bulletKeys: readonly [
    "tipsBased",
    "localKnowledge",
    "smallGroups",
    "friendlyGuides",
    "greatForEveryone"
  ];
};

export type PrivateTours = {
  headingKey: "heading";
  descriptionKeys: readonly ["description1", "description2"];
  ctaLabelKey: "ctaLabel";
  ctaTarget: InternalTarget;
};

export type PartnerId =
  | "donkeyRepublic"
  | "kobenhavnsKommune"
  | "getYourGuide"
  | "civitatis"
  | "embassyOfArgentina"
  | "viator";

export type Partner = {
  id: PartnerId;
  logo: string;
};

export type ContactInfo = {
  headingKey: "heading";
  subheadingKey: "subheading";
  detailsHeadingKey: "detailsHeading";
  detailsDescriptionKey: "detailsDescription";
  address: string;
  phone: string;
  email: string;
};

export type FooterLink = {
  id:
    | "about"
    | "companies"
    | "workWithUs"
    | "contact"
    | "faqs"
    | "privacyPolicy"
    | "termsOfUse";
  target: InternalTarget;
};

export type FooterLinkSection = {
  id: "wt" | "support";
  links: FooterLink[];
};

export type FooterContent = {
  blurbKey: "blurb";
  contact: {
    cvr: string;
    phone: string;
    email: string;
  };
  linkSections: FooterLinkSection[];
};

export const navLinks: NavLink[] = [
  {id: "home", target: {kind: "homeSection", section: "home"}},
  {id: "tours", target: {kind: "page", page: "/tours"}},
  {id: "about", target: {kind: "page", page: "/about-us"}},
  {id: "companies", target: {kind: "page", page: "/companies"}},
  {id: "blog", target: {kind: "page", page: "/post"}},
  {id: "contact", target: {kind: "page", page: "/contact"}},
];

export const tourCategories: TourCategoryId[] = [
  "architecture",
  "bike",
  "boat",
  "cruise",
  "dayTrip",
  "essential",
  "freeTour",
  "groupTour",
  "history",
  "privateTour",
  "royalPalaces",
];

const defaultBookingTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

const defaultSupportTarget: TourDetailCtaTarget = {
  kind: "internal",
  target: {kind: "homeSection", section: "contact"},
};

export const tourTemplateMapHref = "https://maps.app.goo.gl/pWqY5GfNPPtoDK3x6";

const createTourLocaleAvailability = (
  locales: readonly AppLocale[],
  bookingReferenceIds: Partial<Record<AppLocale, string | undefined>> = {},
): TourLocaleAvailability => (
  Object.fromEntries(
    locales.map((locale) => {
      const bookingReferenceId = bookingReferenceIds[locale];

      return [
        locale,
        bookingReferenceId === undefined ? {} : {bookingReferenceId},
      ];
    })
  ) as TourLocaleAvailability
);

const defaultTourLocaleAvailability = () => createTourLocaleAvailability(["en", "es", "it"]);

const tourDefinitions: Tour[] = [
  {
    id: "copenhagenFreeTour",
    slug: "copenhagen-historic-center-free-tour",
    rating: "5.0",
    reviews: "1,756",
    price: "0",
    categories: [
      "freeTour",
      "groupTour",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/tour-nyhavn.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenFreeTour }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P7"
      },
      es: {
        bookingReferenceId: "P1"
      },
      it: {
        bookingReferenceId: "P11"
      },
    },
  },
  {
    id: "rosenborgCastleTour",
    slug: "rosenborg-castle",
    rating: "4.9",
    reviews: "386",
    price: "400",
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
    heroImageSrc: "/walkandtour/tours/rosenborg-castle-canal-cruise.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleTour }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleTour }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleTour }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleTour }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleTour }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P16"
      },
      es: {
        bookingReferenceId: "P21"
      },
      it: {
        bookingReferenceId: "P15"
      },
    },
  },
  {
    id: "malmoExcursion",
    slug: "excursion-to-malmo-sweden",
    rating: "4.7",
    reviews: "560",
    price: "780",
    categories: [
      "groupTour",
      "dayTrip",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/tour-malmo.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.malmoExcursion }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.malmoExcursion }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.malmoExcursion }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.malmoExcursion }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.malmoExcursion }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P10"
      },
      es: {
        bookingReferenceId: "P4"
      },
      it: {
        bookingReferenceId: "P14"
      },
    },
  },
  {
    id: "amalienborgPalace",
    slug: "amalienborg-palace",
    rating: "4.8",
    reviews: "609",
    price: "400",
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
    heroImageSrc: "/walkandtour/tours/tour-amalienborg.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.amalienborgPalace }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P18"
      },
      es: {
        bookingReferenceId: "P22"
      },
      it: {
        bookingReferenceId: "P17"
      },
    },
  },
  {
    id: "christiansborgPalace",
    slug: "christiansborg-palace",
    rating: "5.0",
    reviews: "1,497",
    price: "500",
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
    heroImageSrc: "/walkandtour/tours/tour-christiansborg.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.christiansborgPalace }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P19"
      },
      es: {},
      it: {
        bookingReferenceId: "P20"
      },
    },
  },
  {
    id: "copenhagenEssentials",
    slug: "copenhagen-essentials",
    rating: "4.9",
    reviews: "305",
    price: "400",
    categories: [
      "groupTour",
      "essential",
      "history",
      "boat",
    ],
    heroImageSrc: "/walkandtour/tours/tour-copenhagen-essentials.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.copenhagenEssentials }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenEssentials }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenEssentials }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenEssentials }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenEssentials }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P28"
      },
      es: {
        bookingReferenceId: "P29"
      },
      it: {
        bookingReferenceId: "P32"
      },
    },
  },
  {
    id: "jewishQuarter",
    slug: "jewish-quarter-and-danish-jewish-museum",
    rating: "4.8",
    reviews: "792",
    price: "1500",
    categories: [
      "history",
      "privateTour",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/round-tower.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.jewishQuarter }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.jewishQuarter }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.jewishQuarter }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.jewishQuarter }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.jewishQuarter }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P26"
      },
      es: {
        bookingReferenceId: "P27"
      },
    },
  },
  {
    id: "tivoliGardensEntry",
    slug: "copenhagen-walking-tour-tivoli-gardens-entry",
    rating: "4.8",
    reviews: "462",
    price: "670",
    categories: [
      "groupTour",
      "history",
    ],
    heroImageSrc: "/walkandtour/tours/tivoli-garden.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.tivoliGardensEntry }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P30"
      },
      es: {
        bookingReferenceId: "P31"
      },
    },
  },
  {
    id: "boatTour",
    slug: "boat-tour-gateway",
    rating: "4.9",
    reviews: "367",
    price: "8800",
    categories: [
      "privateTour",
      "boat",
    ],
    heroImageSrc: "/walkandtour/tours/boat-tour.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.boatTour }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.boatTour }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.boatTour }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.boatTour }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.boatTour }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.boatTour }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P8"
      },
      es: {
        bookingReferenceId: "P6"
      },
    },
  },
  {
    id: "royalDeerParkBikeTour",
    slug: "bike-tour-deer-park",
    rating: "4.5",
    reviews: "150",
    price: "900",
    categories: [
      "dayTrip",
      "groupTour",
      "royalPalaces",
      "bike",
    ],
    heroImageSrc: "/walkandtour/tours/royal-deer-park-bike-tour.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.royalDeerParkBikeTour }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P9"
      },
      es: {
        bookingReferenceId: "P3"
      },
    },
  },
  {
    id: "harborArchitecture",
    slug: "copenhagen-harbor-architecture",
    rating: "4.8",
    reviews: "481",
    price: "1250",
    categories: [
      "privateTour",
      "architecture",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/harbor-architecture.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.harborArchitecture }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P24"
      },
      es: {
        bookingReferenceId: "P25"
      },
    },
  },
  {
    id: "rosenborgCastleCanalCruise",
    slug: "rosenborg-castle-and-canal-cruise",
    rating: "4.5",
    reviews: "664",
    price: "1400",
    categories: [
      "privateTour",
      "royalPalaces",
    ],
    heroImageSrc: "/walkandtour/tours/rosenborg-castle-canal-cruise.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.rosenborgCastleCanalCruise }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P23"
      },
      es: {
        bookingReferenceId: "P5"
      },
      it: {
        bookingReferenceId: "P13"
      },
    },
  },
  {
    id: "frederiksborgAndKronborgCastle",
    slug: "frederiksborg-and-kronborg-castle",
    rating: "4.9",
    reviews: "198",
    price: "3000",
    categories: [
      "dayTrip",
      "privateTour",
    ],
    heroImageSrc: "/walkandtour/tours/frederiksborg-and-kronborg-castle.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/6.jpg`,
      `/walkandtour/tours/${ tourSlugById.frederiksborgAndKronborgCastle }/7.jpg`,
    ],
    localeAvailability: {
      en: {},
      es: {},
    },
  },
  {
    id: "foodTours",
    slug: "copenhagen-food-tour",
    rating: "4.8",
    reviews: "200",
    price: "1000",
    categories: [
      "groupTour",
      "history",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/food-tours.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.foodTours }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.foodTours }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.foodTours }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.foodTours }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.foodTours }/5.jpg`,
    ],
    localeAvailability: {
      en: {},
      es: {},
    },
  },
  {
    id: "roskilde",
    slug: "roskilde-old-viking-city",
    rating: "4.8",
    reviews: "599",
    price: "1500",
    categories: [
      "dayTrip",
      "privateTour",
    ],
    heroImageSrc: "/walkandtour/tours/roskilde.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.roskilde }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.roskilde }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.roskilde }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.roskilde }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.roskilde }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.roskilde }/6.jpg`,
    ],
    localeAvailability: {
      en: {},
      es: {},
    },
  },
  {
    id: "nordhavnArchitecture",
    slug: "nordhavn-architecture",
    rating: "5",
    reviews: "693",
    price: "400",
    categories: [
      "groupTour",
      "architecture",
    ],
    heroImageSrc: "/walkandtour/tours/nordhavn-architecture.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.nordhavnArchitecture }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.nordhavnArchitecture }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.nordhavnArchitecture }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.nordhavnArchitecture }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.nordhavnArchitecture }/5.jpg`,
    ],
    localeAvailability: {
      en: {},
      es: {},
    },
  },
  {
    id: "christmasTour",
    slug: "private-ultimate-christmas-tivoli-hygge",
    rating: "4.9",
    reviews: "250",
    price: "1250",
    categories: [
      "privateTour",
    ],
    heroImageSrc: "/walkandtour/tours/christmas-tour.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.christmasTour }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.christmasTour }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.christmasTour }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.christmasTour }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.christmasTour }/5.jpg`,
    ],
    localeAvailability: {
      en: {},
      es: {},
      it: {},
    },
  },
  {
    id: "panorama",
    slug: "copenhagen-panorama-private-shore-to-city-experience",
    rating: "5",
    reviews: "408",
    price: "950",
    categories: [
      "privateTour",
      "cruise",
      "history",
    ],
    heroImageSrc: "/walkandtour/tours/panorama.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.panorama }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.panorama }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.panorama }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.panorama }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.panorama }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P33"
      },
      es: {
        bookingReferenceId: "P34"
      },
    },
  },
  {
    id: "shoreExcursion",
    slug: "copenhagen-walking-shore-excursion",
    rating: "4.9",
    reviews: "693",
    price: "690",
    categories: [
      "groupTour",
      "royalPalaces",
      "essential",
    ],
    heroImageSrc: "/walkandtour/tours/shore-excursion.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.shoreExcursion }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.shoreExcursion }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.shoreExcursion }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.shoreExcursion }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.shoreExcursion }/5.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P35"
      },
      es: {},
      it: {},
    },
  },
  {
    id: "copenhagenCityToCoast",
    slug: "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen",
    rating: "4.9",
    reviews: "204",
    price: "420",
    categories: [
      "groupTour",
      "cruise",
      "history",
    ],
    heroImageSrc: "/walkandtour/tours/copenhagen-city-to-coast.jpg",
    galleryImageSrcs: [
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/1.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/2.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/3.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/4.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/5.jpg`,
      `/walkandtour/tours/${ tourSlugById.copenhagenCityToCoast }/6.jpg`,
    ],
    localeAvailability: {
      en: {
        bookingReferenceId: "P36"
      },
      es: {},
    },
  },
];

export const tours: Tour[] = tourDefinitions.map((tour) => ({
  ...tour,
  localeAvailability: tour.localeAvailability ?? defaultTourLocaleAvailability(),
}));

const resolveTour = (tour: Tour): ResolvedTour => ({
  ...tour,
  heroImageSrc: tour.heroImageSrc,
  galleryImageSrcs: tour.galleryImageSrcs.length > 0 ? tour.galleryImageSrcs : [tour.heroImageSrc],
  bookingTarget: tour.bookingTarget ?? defaultBookingTarget,
  supportTarget: tour.supportTarget ?? defaultSupportTarget,
});

const shuffle = <T, >(items: readonly T[]): T[] => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
};

export const toursCatalog: Tour[] = tours;
export const tourSlugs: TourSlug[] = toursCatalog.map((tour) => tour.slug);

export const getTourAvailableLocales = (tour: Tour): AppLocale[] => (
  routing.locales.filter((locale) => Object.hasOwn(tour.localeAvailability, locale))
);

export const isTourAvailableInLocale = (tour: Tour, locale: AppLocale): boolean => (
  Object.hasOwn(tour.localeAvailability, locale)
);

export const getTourContentLocale = (tour: Tour, locale: AppLocale): AppLocale => (
  isTourAvailableInLocale(tour, locale) ? locale : routing.defaultLocale
);

export const getTourBookingReferenceId = (
  tour: Tour,
  locale: AppLocale,
): string | undefined => tour.localeAvailability[locale]?.bookingReferenceId;

export const getTourBySlug = (snug: string): Tour | undefined => (
  toursCatalog.find((tour) => tour.slug === snug)
);

export const getResolvedTourBySlug = (snug: string): ResolvedTour | undefined => {
  const tour = getTourBySlug(snug);

  return tour ? resolveTour(tour) : undefined;
};

export const getRelatedToursByTour = (tour: Tour, limit = 3): Tour[] => {
  if (limit <= 0) {
    return [];
  }

  const otherTours = toursCatalog.filter((item) => item.id !== tour.id);
  const matchingTours = otherTours.filter((item) => (
    item.categories.some((category) => tour.categories.includes(category))
  ));
  const randomMatchingTours = shuffle(matchingTours).slice(0, limit);

  if (randomMatchingTours.length >= limit) {
    return randomMatchingTours;
  }

  const selectedTourIds = new Set(randomMatchingTours.map((item) => item.id));
  const randomFallbackTours = shuffle(
    otherTours.filter((item) => !selectedTourIds.has(item.id))
  ).slice(0, limit - randomMatchingTours.length);

  return [...randomMatchingTours, ...randomFallbackTours];
};

const homeTourOrder: TourId[] = [
  "copenhagenFreeTour",
  "rosenborgCastleTour",
  "malmoExcursion",
];

export const homeTours: Tour[] = homeTourOrder
  .map((tourId) => tours.find((tour) => tour.id === tourId))
  .filter((tour): tour is Tour => Boolean(tour));

export const whyChoose: WhyChoose = {
  headingKey: "heading",
  descriptionKey: "description",
  bulletKeys: [
    "tipsBased",
    "localKnowledge",
    "smallGroups",
    "friendlyGuides",
    "greatForEveryone",
  ],
};

export const privateTours: PrivateTours = {
  headingKey: "heading",
  descriptionKeys: [
    "description1",
    "description2",
  ],
  ctaLabelKey: "ctaLabel",
  ctaTarget: {kind: "page", page: "/contact"},
};

export const partners: Partner[] = [
  {
    id: "donkeyRepublic",
    logo: "/walkandtour/partners/partner-donkey-republic.png",
  },
  {
    id: "kobenhavnsKommune",
    logo: "/walkandtour/partners/partner-kobenhavn.png",
  },
  {
    id: "getYourGuide",
    logo: "/walkandtour/partners/partner-getyourguide.png",
  },
  {
    id: "civitatis",
    logo: "/walkandtour/partners/partner-civitatis.png",
  },
  {
    id: "embassyOfArgentina",
    logo: "/walkandtour/partners/partner-embassy-argentina.png",
  },
  {
    id: "viator",
    logo: "/walkandtour/partners/partner-viator.png",
  },
];

export const contactInfo: ContactInfo = {
  headingKey: "heading",
  subheadingKey: "subheading",
  detailsHeadingKey: "detailsHeading",
  detailsDescriptionKey: "detailsDescription",
  address: "Højbro Pl. 10, 1200 København, Denmark",
  phone: "+45 71352453",
  email: "info@walkandtour.dk",
};

export const footerContent: FooterContent = {
  blurbKey: "blurb",
  contact: {
    cvr: "43268465",
    phone: contactInfo.phone,
    email: contactInfo.email,
  },
  linkSections: [
    {
      id: "wt",
      links: [
        {id: "about", target: {kind: "page", page: "/about-us"}},
        {id: "companies", target: {kind: "page", page: "/companies"}},
        {id: "workWithUs", target: {kind: "page", page: "/work-with-us"}},
        {id: "contact", target: {kind: "page", page: "/contact"}},
      ],
    },
    {
      id: "support",
      links: [
        // {id: "faqs", target: {kind: "homeSection", section: "contact"}},
        {id: "privacyPolicy", target: {kind: "page", page: "/privacy-policy"}},
        {id: "termsOfUse", target: {kind: "page", page: "/terms-of-use"}},
      ],
    },
  ],
};
