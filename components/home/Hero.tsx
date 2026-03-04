import { heroContent } from "@/lib/landing-data";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#f8f4ef]"
      style={ {
        backgroundImage: `url(${ heroContent.image.src })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } }
    >
      <div className="absolute inset-0 bg-[#2a221a]/55" aria-hidden="true"/>
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-6xl rounded-[2.5rem] p-8 text-center sm:p-10">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white sm:text-6xl">
            { t(heroContent.headingKey) }
          </h1>
          <p className="mt-12 text-3xl md:text-4xl text-white/90">
            { t(heroContent.subheadingKey) }
          </p>
          <div className="mt-12">
            <a
              href={ heroContent.ctaHref }
              className="btn-red-white inline-flex px-6 py-3 text-base md:text-lg font-semibold uppercase tracking-wide transition-colors"
            >
              { t(heroContent.ctaLabelKey) }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
