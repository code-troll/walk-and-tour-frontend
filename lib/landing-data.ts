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

export type Tour = {
  id: TourId;
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
    rating: "5.0",
    reviews: "1,756",
    price: "0",
    image: {
      src: "/walkandtour/tours/tour-nyhavn.png",
    },
    categories: [
      "freeTour",
      "groupTour",
      "essential",
    ],
  },
  {
    id: "rosenborgCastleTour",
    rating: "4.9",
    reviews: "386",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-rosenborg.png",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "malmoExcursion",
    rating: "4.7",
    reviews: "560",
    price: "780",
    image: {
      src: "/walkandtour/tours/tour-malmo.png",
    },
    categories: [
      "groupTour",
      "dayTrip",
      "essential",
    ],
  },
  {
    id: "amalienborgPalace",
    rating: "4.8",
    reviews: "609",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-amalienborg.png",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "christiansborgPalace",
    rating: "5.0",
    reviews: "1,497",
    price: "500",
    image: {
      src: "/walkandtour/tours/tour-christiansborg.png",
    },
    categories: [
      "groupTour",
      "history",
      "royalPalaces",
    ],
  },
  {
    id: "copenhagenEssentials",
    rating: "4.9",
    reviews: "305",
    price: "400",
    image: {
      src: "/walkandtour/tours/tour-copenhagen-essentials.png",
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
    rating: "4.8",
    reviews: "792",
    price: "1500",
    image: {
      src: "/walkandtour/tours/round-tower.png",
    },
    categories: [
      "history",
      "privateTour",
      "essential",
    ],
  },
  {
    id: "tivoliGardensEntry",
    rating: "4.8",
    reviews: "462",
    price: "670",
    image: {
      src: "/walkandtour/tours/tivoli-garden.png",
    },
    categories: [
      "groupTour",
      "history",
    ],
  },
  {
    id: "boatTour",
    rating: "4.9",
    reviews: "367",
    price: "8800",
    image: {
      src: "/walkandtour/tours/boat-tour.png",
    },
    categories: [
      "privateTour",
      "boat",
    ],
  },
  {
    id: "royalDeerParkBikeTour",
    rating: "4.5",
    reviews: "150",
    price: "900",
    image: {
      src: "/walkandtour/tours/royal-deer-park-bike-tour.png",
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
    rating: "4.8",
    reviews: "481",
    price: "1250",
    image: {
      src: "/walkandtour/tours/harbor-architecture.png",
    },
    categories: [
      "privateTour",
      "architecture",
      "essential",
    ],
  },
  {
    id: "rosenborgCastleCanalCruise",
    rating: "4.5",
    reviews: "664",
    price: "1400",
    image: {
      src: "/walkandtour/tours/rosenborg-castle-canal-cruise.png",
    },
    categories: [
      "privateTour",
      "royalPalaces",
    ],
  },
  {
    id: "frederiksborgAndKronborgCastle",
    rating: "4.9",
    reviews: "198",
    price: "3000",
    image: {
      src: "/walkandtour/tours/frederiksborg-and-kronborg-castle.png",
    },
    categories: [
      "dayTrip",
      "privateTour",
    ],
  },
  {
    id: "foodTours",
    rating: "4.8",
    reviews: "200",
    price: "1000",
    image: {
      src: "/walkandtour/tours/food-tours.png",
    },
    categories: [
      "groupTour",
      "history",
      "essential",
    ],
  },
  {
    id: "roskilde",
    rating: "4.8",
    reviews: "599",
    price: "1500",
    image: {
      src: "/walkandtour/tours/roskilde.png",
    },
    categories: [
      "dayTrip",
      "privateTour",
    ],
  },
  {
    id: "nordhavnArchitecture",
    rating: "5",
    reviews: "693",
    price: "400",
    image: {
      src: "/walkandtour/tours/nordhavn-architecture.png",
    },
    categories: [
      "groupTour",
      "architecture",
    ],
  },
  {
    id: "christmasTour",
    rating: "4.9",
    reviews: "250",
    price: "1250",
    image: {
      src: "/walkandtour/tours/christmas-tour.png",
    },
    categories: [
      "privateTour",
    ],
  },
  {
    id: "panorama",
    rating: "5",
    reviews: "408",
    price: "950",
    image: {
      src: "/walkandtour/tours/panorama.png",
    },
    categories: [
      "privateTour",
      "cruise",
      "history",
    ],
  },
  {
    id: "shoreExcursion",
    rating: "4.9",
    reviews: "693",
    price: "690",
    image: {
      src: "/walkandtour/tours/shore-excursion.png",
    },
    categories: [
      "groupTour",
      "royalPalaces",
      "essential",
    ],
  },
  {
    id: "copenhagenCityToCoast",
    rating: "4.9",
    reviews: "204",
    price: "420",
    image: {
      src: "/walkandtour/tours/copenhagen-city-to-coast.png",
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
