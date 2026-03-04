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
  imageSrc: "/walkandtour/hero.png",
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
  imageSrc: "/walkandtour/private-tours.png",
};
