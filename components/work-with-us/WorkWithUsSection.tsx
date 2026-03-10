import Image from "next/image";
import { useTranslations } from "next-intl";

const applicationHref = "mailto:info@walkandtour.dk?subject=W%26T%20-%20Tour%20guide";

export default function WorkWithUsSection() {
  const t = useTranslations("workWithUsPage");

  return (
    <section className="bg-[#f8f4ef] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="overflow-hidden rounded-4xl bg-white shadow-[0_24px_60px_rgba(42,34,26,0.08)]">
          <div className="grid lg:grid-cols-[1.02fr_1fr]">
            <div className="relative min-h-[320px] bg-[#d6c4b4] sm:min-h-[420px]">
              <Image
                src="/walkandtour/heroes/work-with-us.jpg"
                alt={ t("imageAlt") }
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="flex flex-col justify-center gap-6 p-8 sm:p-10 lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#cf4633]">
                { t("eyebrow") }
              </p>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-[#2a221a] sm:text-4xl lg:text-[2.75rem]">
                { t("title") }
              </h1>
              <div className="space-y-4 text-base leading-8 text-[#4a4038] sm:text-lg">
                <p>{ t("paragraph1") }</p>
                <p>{ t("paragraph2") }</p>
              </div>
              <div className="pt-2">
                <a
                  href={ applicationHref }
                  className="btn-red-black inline-flex items-center px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
                >
                  { t("ctaLabel") }
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
