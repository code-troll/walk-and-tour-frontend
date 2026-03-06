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
  | "rosenborg-castle-guided-tour"
  | "excursion-to-malmo-sweden"
  | "amalienborg-palace-tour"
  | "christiansborg-palace-tour"
  | "copenhagen-essentials-old-town-harbour-ferry-royal-guards"
  | "jewish-quarter-and-danish-jewish-museum-tour"
  | "copenhagen-walking-tour-tivoli-gardens-entry"
  | "copenhagen-private-boat-tour-hidden-gems-hygge"
  | "hermitage-palace-royal-deer-park-bike-tour"
  | "copenhagen-harbor-architecture-private-walking-tour"
  | "skip-the-line-rosenborg-castle-canal-cruise"
  | "north-copenhagen-frederiksborg-kronborg-castle-hamlet"
  | "copenhagen-food-tour"
  | "roskilde-old-viking-city-tour"
  | "nordhavn-architecture-tour"
  | "private-ultimate-christmas-tivoli-hygge"
  | "copenhagen-panorama-private-shore-to-city-experience"
  | "copenhagen-walking-shore-excursion"
  | "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen";

export const tourSlugById = {
  copenhagenFreeTour: "copenhagen-historic-center-free-tour",
  rosenborgCastleTour: "rosenborg-castle-guided-tour",
  malmoExcursion: "excursion-to-malmo-sweden",
  amalienborgPalace: "amalienborg-palace-tour",
  christiansborgPalace: "christiansborg-palace-tour",
  copenhagenEssentials: "copenhagen-essentials-old-town-harbour-ferry-royal-guards",
  jewishQuarter: "jewish-quarter-and-danish-jewish-museum-tour",
  tivoliGardensEntry: "copenhagen-walking-tour-tivoli-gardens-entry",
  boatTour: "copenhagen-private-boat-tour-hidden-gems-hygge",
  royalDeerParkBikeTour: "hermitage-palace-royal-deer-park-bike-tour",
  harborArchitecture: "copenhagen-harbor-architecture-private-walking-tour",
  rosenborgCastleCanalCruise: "skip-the-line-rosenborg-castle-canal-cruise",
  frederiksborgAndKronborgCastle: "north-copenhagen-frederiksborg-kronborg-castle-hamlet",
  foodTours: "copenhagen-food-tour",
  roskilde: "roskilde-old-viking-city-tour",
  nordhavnArchitecture: "nordhavn-architecture-tour",
  christmasTour: "private-ultimate-christmas-tivoli-hygge",
  panorama: "copenhagen-panorama-private-shore-to-city-experience",
  shoreExcursion: "copenhagen-walking-shore-excursion",
  copenhagenCityToCoast: "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen",
} as const satisfies Record<TourId, TourSlug>;

export type TourSlugById = typeof tourSlugById;

export type Tour = {
  id: TourId;
  slug: TourSlug;
  rating: string;
  reviews: string;
  price: string;
  image: {
    src: string;
  };
  categories: TourCategoryId[];
};

export type AboutWalkAndTour = {
  eyebrowKey: "eyebrow";
  titleKey: "title";
  descriptionsKey: "descriptions";
  ctaLabelKey: "ctaLabel";
  ctaTarget: InternalTarget;
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
  {id: "companies", target: {kind: "homeSection", section: "companies"}},
  {id: "blog", target: {kind: "homeSection", section: "blog"}},
  {id: "contact", target: {kind: "homeSection", section: "contact"}},
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

export const tours: Tour[] = [
  {
    id: "copenhagenFreeTour",
    slug: "copenhagen-historic-center-free-tour",
    rating: "5.0",
    reviews: "1,756",
    price: "0",
    image: {
      src: "/walkandtour/tours/tour-nyhavn.jpg",
    },
    categories: [
      "freeTour",
      "groupTour",
      "essential",
    ],
  },
  {
    id: "rosenborgCastleTour",
    slug: "rosenborg-castle-guided-tour",
    rating: "4.9",
    reviews: "386",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-rosenborg.jpg",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "malmoExcursion",
    slug: "excursion-to-malmo-sweden",
    rating: "4.7",
    reviews: "560",
    price: "780",
    image: {
      src: "/walkandtour/tours/tour-malmo.jpg",
    },
    categories: [
      "groupTour",
      "dayTrip",
      "essential",
    ],
  },
  {
    id: "amalienborgPalace",
    slug: "amalienborg-palace-tour",
    rating: "4.8",
    reviews: "609",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-amalienborg.jpg",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "christiansborgPalace",
    slug: "christiansborg-palace-tour",
    rating: "5.0",
    reviews: "1,497",
    price: "500",
    image: {
      src: "/walkandtour/tours/tour-christiansborg.jpg",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "copenhagenEssentials",
    slug: "copenhagen-essentials-old-town-harbour-ferry-royal-guards",
    rating: "4.9",
    reviews: "305",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-copenhagen-essentials.jpg",
    },
    categories: [
      "groupTour",
      "essential",
      "history",
      "boat",
    ],
  },
  {
    id: "jewishQuarter",
    slug: "jewish-quarter-and-danish-jewish-museum-tour",
    rating: "4.8",
    reviews: "792",
    price: "1500",
    image: {
      src: "/walkandtour/tours/round-tower.jpg",
    },
    categories: [
      "history",
      "privateTour",
      "essential",
    ],
  },
  {
    id: "tivoliGardensEntry",
    slug: "copenhagen-walking-tour-tivoli-gardens-entry",
    rating: "4.8",
    reviews: "462",
    price: "670",
    image: {
      src: "/walkandtour/tours/tivoli-garden.jpg",
    },
    categories: [
      "groupTour",
      "history",
    ],
  },
  {
    id: "boatTour",
    slug: "copenhagen-private-boat-tour-hidden-gems-hygge",
    rating: "4.9",
    reviews: "367",
    price: "8800",
    image: {
      src: "/walkandtour/tours/boat-tour.jpg",
    },
    categories: [
      "privateTour",
      "boat",
    ],
  },
  {
    id: "royalDeerParkBikeTour",
    slug: "hermitage-palace-royal-deer-park-bike-tour",
    rating: "4.5",
    reviews: "150",
    price: "900",
    image: {
      src: "/walkandtour/tours/royal-deer-park-bike-tour.jpg",
    },
    categories: [
      "dayTrip",
      "groupTour",
      "royalPalaces",
      "bike",
    ],
  },
  {
    id: "harborArchitecture",
    slug: "copenhagen-harbor-architecture-private-walking-tour",
    rating: "4.8",
    reviews: "481",
    price: "1250",
    image: {
      src: "/walkandtour/tours/harbor-architecture.jpg",
    },
    categories: [
      "privateTour",
      "architecture",
      "essential",
    ],
  },
  {
    id: "rosenborgCastleCanalCruise",
    slug: "skip-the-line-rosenborg-castle-canal-cruise",
    rating: "4.5",
    reviews: "664",
    price: "1400",
    image: {
      src: "/walkandtour/tours/rosenborg-castle-canal-cruise.jpg",
    },
    categories: [
      "privateTour",
      "royalPalaces",
    ],
  },
  {
    id: "frederiksborgAndKronborgCastle",
    slug: "north-copenhagen-frederiksborg-kronborg-castle-hamlet",
    rating: "4.9",
    reviews: "198",
    price: "3000",
    image: {
      src: "/walkandtour/tours/frederiksborg-and-kronborg-castle.jpg",
    },
    categories: [
      "dayTrip",
      "privateTour",
    ],
  },
  {
    id: "foodTours",
    slug: "copenhagen-food-tour",
    rating: "4.8",
    reviews: "200",
    price: "1000",
    image: {
      src: "/walkandtour/tours/food-tours.jpg",
    },
    categories: [
      "groupTour",
      "history",
      "essential",
    ],
  },
  {
    id: "roskilde",
    slug: "roskilde-old-viking-city-tour",
    rating: "4.8",
    reviews: "599",
    price: "1500",
    image: {
      src: "/walkandtour/tours/roskilde.jpg",
    },
    categories: [
      "dayTrip",
      "privateTour",
    ],
  },
  {
    id: "nordhavnArchitecture",
    slug: "nordhavn-architecture-tour",
    rating: "5",
    reviews: "693",
    price: "400",
    image: {
      src: "/walkandtour/tours/nordhavn-architecture.jpg",
    },
    categories: [
      "groupTour",
      "architecture",
    ],
  },
  {
    id: "christmasTour",
    slug: "private-ultimate-christmas-tivoli-hygge",
    rating: "4.9",
    reviews: "250",
    price: "1250",
    image: {
      src: "/walkandtour/tours/christmas-tour.jpg",
    },
    categories: [
      "privateTour",
    ],
  },
  {
    id: "panorama",
    slug: "copenhagen-panorama-private-shore-to-city-experience",
    rating: "5",
    reviews: "408",
    price: "950",
    image: {
      src: "/walkandtour/tours/panorama.jpg",
    },
    categories: [
      "privateTour",
      "cruise",
      "history",
    ],
  },
  {
    id: "shoreExcursion",
    slug: "copenhagen-walking-shore-excursion",
    rating: "4.9",
    reviews: "693",
    price: "690",
    image: {
      src: "/walkandtour/tours/shore-excursion.jpg",
    },
    categories: [
      "groupTour",
      "royalPalaces",
      "essential",
    ],
  },
  {
    id: "copenhagenCityToCoast",
    slug: "copenhagen-city-to-coast-black-diamond-canal-cruise-reffen",
    rating: "4.9",
    reviews: "204",
    price: "420",
    image: {
      src: "/walkandtour/tours/copenhagen-city-to-coast.jpg",
    },
    categories: [
      "groupTour",
      "cruise",
      "history",
    ],
  },
];

const homeTourOrder: TourId[] = [
  "copenhagenFreeTour",
  "rosenborgCastleTour",
  "malmoExcursion",
];

export const homeTours: Tour[] = homeTourOrder
  .map((tourId) => tours.find((tour) => tour.id === tourId))
  .filter((tour): tour is Tour => Boolean(tour));

export const toursCatalog: Tour[] = tours;

export const aboutWalkAndTour: AboutWalkAndTour = {
  eyebrowKey: "eyebrow",
  titleKey: "title",
  descriptionsKey: "descriptions",
  ctaLabelKey: "ctaLabel",
  ctaTarget: {kind: "page", page: "/about-us"},
};

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
  ctaTarget: {kind: "homeSection", section: "contact"},
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
};

export const footerContent: FooterContent = {
  blurbKey: "blurb",
  contact: {
    cvr: "43268465",
    phone: "+45 71352453",
    email: "info@walkandtour.dk",
  },
  linkSections: [
    {
      id: "wt",
      links: [
        {id: "about", target: {kind: "page", page: "/about-us"}},
        {id: "companies", target: {kind: "homeSection", section: "companies"}},
        {id: "workWithUs", target: {kind: "homeSection", section: "contact"}},
        {id: "contact", target: {kind: "homeSection", section: "contact"}},
      ],
    },
    {
      id: "support",
      links: [
        {id: "faqs", target: {kind: "homeSection", section: "contact"}},
        {id: "privacyPolicy", target: {kind: "homeSection", section: "blog"}},
        {id: "termsOfUse", target: {kind: "homeSection", section: "blog"}},
      ],
    },
  ],
};
