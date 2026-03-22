import type { InternalTarget } from "@/lib/internal-paths";

export type NavLink = {
  id: "home" | "tours" | "about" | "companies" | "blog" | "contact";
  target: InternalTarget;
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
    logo: "/walkandtour/partners/partner-getyourguide.jpg",
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
