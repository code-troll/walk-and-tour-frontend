import { useTranslations } from "next-intl";

import type { HeroSectionConfig } from "@/lib/section-config";

type HeroSectionProps = HeroSectionConfig;

export default function HeroSection({
  id,
  translationNamespace,
  titleKey,
  descriptionKey,
  imageSrc,
  cta,
  overlayClassName = "bg-[#2a221a]/55",
  backgroundPosition = "center",
}: HeroSectionProps) {
  const t = useTranslations(translationNamespace);

  return (
    <section
      id={ id }
      className="relative overflow-hidden bg-[#f8f4ef]"
      style={ {
        backgroundImage: `url(${ imageSrc })`,
        backgroundSize: "cover",
        backgroundPosition,
      } }
    >
      <div className={ `absolute inset-0 ${ overlayClassName }` } aria-hidden="true"/>
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-6xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white sm:text-6xl">
            { t(titleKey) }
          </h1>
          <p className="mt-12 text-3xl md:text-4xl text-white/90">
            { t(descriptionKey) }
          </p>
          { cta ? (
            <div className="mt-12">
              <a
                href={ cta.href }
                className="btn-red-white inline-flex px-6 py-3 text-base md:text-lg font-semibold uppercase tracking-wide transition-colors"
              >
                { t(cta.labelKey) }
              </a>
            </div>
          ) : null }
        </div>
      </div>
    </section>
  );
}
