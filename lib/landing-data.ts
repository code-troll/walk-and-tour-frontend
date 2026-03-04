export type NavLink = {
  id: "home" | "tours" | "about" | "companies" | "blog" | "contact";
  href: string;
};

export type TourId = "copenhagenFreeTour" | "rosenborgCastleTour" | "malmoExcursion";

export type Tour = {
  id: TourId;
  rating: string;
  reviews: string;
  price: string;
  image: {
    src: string;
  };
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
  ctaHref: string;
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
  href: string;
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
  {id: "home", href: "#home"},
  {id: "tours", href: "#tours"},
  {id: "about", href: "#about"},
  {id: "companies", href: "#companies"},
  {id: "blog", href: "#blog"},
  {id: "contact", href: "#contact"},
];

export const tours: Tour[] = [
  {
    id: "copenhagenFreeTour",
    rating: "5.0",
    reviews: "1,756",
    price: "0",
    image: {
      src: "/walkandtour/tour-nyhavn.webp",
    },
  },
  {
    id: "rosenborgCastleTour",
    rating: "4.9",
    reviews: "386",
    price: "400",
    image: {
      src: "/walkandtour/tour-rosenborg.webp",
    },
  },
  {
    id: "malmoExcursion",
    rating: "4.7",
    reviews: "560",
    price: "780",
    image: {
      src: "/walkandtour/tour-malmo.webp",
    },
  },
];

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
  ctaHref: "#contact",
};

export const partners: Partner[] = [
  {
    id: "donkeyRepublic",
    logo: "/walkandtour/partner-donkey-republic.png",
  },
  {
    id: "kobenhavnsKommune",
    logo: "/walkandtour/partner-kobenhavn.jpeg",
  },
  {
    id: "getYourGuide",
    logo: "/walkandtour/partner-getyourguide.jpg",
  },
  {
    id: "civitatis",
    logo: "/walkandtour/partner-civitatis.png",
  },
  {
    id: "embassyOfArgentina",
    logo: "/walkandtour/partner-embassy-argentina.png",
  },
  {
    id: "viator",
    logo: "/walkandtour/partner-viator.png",
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
        {id: "about", href: "#about"},
        {id: "companies", href: "#companies"},
        {id: "workWithUs", href: "#contact"},
        {id: "contact", href: "#contact"},
      ],
    },
    {
      id: "support",
      links: [
        {id: "faqs", href: "#contact"},
        {id: "privacyPolicy", href: "#blog"},
        {id: "termsOfUse", href: "#blog"},
      ],
    },
  ],
};
