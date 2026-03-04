export type HeroSectionCtaConfig = {
  labelKey: string;
  href: string;
};

export type HeroSectionConfig = {
  id?: string;
  translationNamespace: string;
  titleKey: string;
  descriptionKey: string;
  imageSrc: string;
  cta?: HeroSectionCtaConfig;
  overlayClassName?: string;
  backgroundPosition?: string;
};

export const homeHeroConfig: HeroSectionConfig = {
  id: "home",
  translationNamespace: "hero",
  titleKey: "heading",
  descriptionKey: "subheading",
  imageSrc: "/walkandtour/hero.png",
  cta: {
    labelKey: "ctaLabel",
    href: "#tours",
  },
};
