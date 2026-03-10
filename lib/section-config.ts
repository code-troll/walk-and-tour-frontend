import { aboutUsImages } from "@/lib/about-us-data";

export type HeroSectionCtaConfig = {
  labelKey: string;
  href: string;
};

export type HeroSectionConfig = {
  id?: string;
  translationNamespace: string;
  eyebrowKey?: string;
  titleKey: string;
  descriptionKey?: string;
  imageSrc: string;
  cta?: HeroSectionCtaConfig;
  overlayClassName?: string;
  backgroundPosition?: string;
};

export const homeHeroConfig: HeroSectionConfig = {
  id: "home",
  translationNamespace: "hero.home",
  titleKey: "heading",
  descriptionKey: "subheading",
  imageSrc: "/walkandtour/heroes/hero.jpg",
  cta: {
    labelKey: "ctaLabel",
    href: "/tours",
  },
};

export const toursHeroConfig: HeroSectionConfig = {
  id: "tours",
  translationNamespace: "hero.tours",
  eyebrowKey: "eyebrow",
  titleKey: "heading",
  imageSrc: "/walkandtour/heroes/private-tours.jpg",
};

export const aboutHeroConfig: HeroSectionConfig = {
  id: "about-us",
  translationNamespace: "hero.about",
  eyebrowKey: "eyebrow",
  titleKey: "heading",
  imageSrc: aboutUsImages.hero,
  overlayClassName: "bg-[#2a221a]/52",
  backgroundPosition: "center 58%",
};

export const companiesHeroConfig: HeroSectionConfig = {
  id: "companies",
  translationNamespace: "hero.companies",
  eyebrowKey: "eyebrow",
  titleKey: "heading",
  imageSrc: "/walkandtour/heroes/company-tours.jpg",
  overlayClassName: "bg-[#2a221a]/58",
  backgroundPosition: "center 38%",
};

export const blogHeroConfig: HeroSectionConfig = {
  id: "blog",
  translationNamespace: "hero.blog",
  eyebrowKey: "eyebrow",
  titleKey: "heading",
  descriptionKey: "subheading",
  imageSrc: "/walkandtour/heroes/hero.jpg",
  overlayClassName: "bg-[#2a221a]/58",
  backgroundPosition: "center 44%",
};

export const contactHeroConfig: HeroSectionConfig = {
  translationNamespace: "hero.contact",
  eyebrowKey: "eyebrow",
  titleKey: "heading",
  descriptionKey: "subheading",
  imageSrc: "/walkandtour/heroes/hero.jpg",
  overlayClassName: "bg-[#2a221a]/58",
  backgroundPosition: "center 44%",
};
