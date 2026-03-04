export type NavLink = {
  label: string;
  href: string;
};

export type HeroContent = {
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  image: {
    src: string;
    alt: string;
  };
};

export type Tour = {
  title: string;
  duration: string;
  location: string;
  rating: string;
  reviews: string;
  price: string;
  currency: string;
  tag: string;
  image: {
    src: string;
    alt: string;
  };
};

export type WhyChoose = {
  heading: string;
  description: string;
  bullets: string[];
};

export type PrivateTours = {
  heading: string;
  description: string[];
  ctaLabel: string;
  ctaHref: string;
};

export type Partner = {
  name: string;
  logo: string;
};

export type ContactInfo = {
  heading: string;
  subheading: string;
};

export type FooterLinkSection = {
  title: string;
  links: { label: string; href: string }[];
};

export type FooterContent = {
  blurb: string;
  contact: {
    cvr: string;
    phone: string;
    email: string;
  };
  linkSections: FooterLinkSection[];
};

export const navLinks: NavLink[] = [
  {label: "Home", href: "#"},
  {label: "Tours", href: "#tours"},
  {label: "About Us", href: "#about"},
  {label: "Companies", href: "#companies"},
  {label: "Blog", href: "#blog"},
  {label: "Contact", href: "#contact"},
];

export const heroContent: HeroContent = {
  heading: "Copenhagen Walking Tours & Unique Local Experiences",
  subheading:
    "Discover Copenhagen through stories, history and unforgettable local experiences led by passionate guides.",
  ctaLabel: "Check our tours now!",
  ctaHref: "#tours",
  image: {
    src: "/walkandtour/hero.png",
    alt: "Copenhagen canal with colorful buildings",
  },
};

export const tours: Tour[] = [
  {
    title: "Copenhagen Free Tour: Changing of the Guard & City Highlights",
    duration: "2 hours",
    location: "Copenhagen",
    rating: "5.0",
    reviews: "1,756",
    price: "0",
    currency: "kr",
    tag: "Tip-Based",
    image: {
      src: "/walkandtour/tour-nyhavn.webp",
      alt: "Nyhavn canal in Copenhagen",
    },
  },
  {
    title: "Rosenborg Castle Guided Tour",
    duration: "1.5 hours",
    location: "Rosenborg Castle",
    rating: "4.9",
    reviews: "386",
    price: "400",
    currency: "kr",
    tag: "Group Tour",
    image: {
      src: "/walkandtour/tour-rosenborg.webp",
      alt: "Rosenborg Castle in Copenhagen",
    },
  },
  {
    title: "Excursion to Malmo Sweden",
    duration: "5 hours",
    location: "Malmo",
    rating: "4.7",
    reviews: "560",
    price: "780",
    currency: "kr",
    tag: "Group Tour",
    image: {
      src: "/walkandtour/tour-malmo.webp",
      alt: "Colorful buildings in Malmo",
    },
  },
];

export const whyChoose: WhyChoose = {
  heading: "Why Travelers Choose Walk & Tour",
  description:
    "At Walk and Tour, we believe the best way to truly experience Copenhagen is on foot and at a local pace.",
  bullets: [
    "Tips Based Tours - Pay what you want based on your experience.",
    "Unique local knowledge and hidden gems in every tour.",
    "Small groups for a more personal and comfortable experience.",
    "Friendly, professional guides with a passion for Copenhagen.",
    "Great for solo travelers, couples, families and small groups.",
  ],
};

export const privateTours: PrivateTours = {
  heading: "Private Tours & Corporate Experiences",
  description: [
    "Looking for a personalized experience in Copenhagen?",
    "We offer private walking tours and corporate experiences tailored to your schedule and interests. Whether you want a historical deep dive, a food-focused adventure or a team-building activity, we create the perfect itinerary just for you."
  ],
  ctaLabel: "Contact us to design your private Copenhagen experience",
  ctaHref: "#contact",
};

export const partners: Partner[] = [
  {
    name: "Donkey Republic",
    logo: "/walkandtour/partner-donkey-republic.png",
  },
  {
    name: "Kobenhavns Kommune",
    logo: "/walkandtour/partner-kobenhavn.jpeg",
  },
  {
    name: "GetYourGuide",
    logo: "/walkandtour/partner-getyourguide.jpg",
  },
  {
    name: "Civitatis",
    logo: "/walkandtour/partner-civitatis.png",
  },
  {
    name: "Embassy of Argentina",
    logo: "/walkandtour/partner-embassy-argentina.png",
  },
  {
    name: "Viator",
    logo: "/walkandtour/partner-viator.png",
  },
];

export const contactInfo: ContactInfo = {
  heading: "Let's Plan Your Copenhagen Experience",
  subheading:
    "Contact us today and we will answer as soon as possible!",
};

export const footerContent: FooterContent = {
  blurb:
    "Walk and Tour Copenhagen offers expertise, personalized tours, great value, and exceptional service for an unforgettable travel experiences.",
  contact: {
    cvr: "43268465",
    phone: "+45 71352453",
    email: "info@walkandtour.dk",
  },
  linkSections: [
    {
      title: "W&T",
      links: [
        {label: "About", href: "#about"},
        {label: "Companies", href: "#companies"},
        {label: "Work with us", href: "#contact"},
        {label: "Contact", href: "#contact"},
      ],
    },
    {
      title: "Support",
      links: [
        {label: "FAQs", href: "#contact"},
        {label: "Privacy Policy", href: "#blog"},
        {label: "Terms of Use", href: "#blog"},
      ],
    },
  ],
};
