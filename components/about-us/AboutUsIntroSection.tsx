import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { type AppLocale } from "@/i18n/routing";
import { aboutUsImages } from "@/lib/about-us-data";
import { getInternalHref } from "@/lib/internal-paths";

export default function AboutUsIntroSection() {
  const t = useTranslations("aboutUs.intro");
  const locale = useLocale() as AppLocale;
  const toursHref = getInternalHref({
    locale,
    target: {kind: "page", page: "/tours"},
  });

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-12">
        <div className="relative">
          <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] ring-1 ring-[#e3d8cc]">
            <Image
              src={ aboutUsImages.intro }
              alt={ t("imageAlt") }
              width={ 898 }
              height={ 760 }
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-lg">
            <div className="text-center leading-tight">
              <p className="text-xl font-bold text-[#2a221a]">{ t("ratingValue") }</p>
              <p className="text-xs tracking-[0.18em] text-[#e1a916]" aria-hidden="true">
                ★★★★★
              </p>
            </div>
            <p className="text-sm font-semibold text-[#3d3124]">{ t("ratingLabel") }</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
            { t("eyebrow") }
          </p>
          <h2 className="text-3xl font-semibold text-teal sm:text-4xl">
            { t("title") }
          </h2>
          <p className="text-base leading-7 text-[#3d3124] md:text-lg">
            { t("description") }
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <a
              href={ toursHref }
              className="btn-red-black inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              { t("viewToursCta") }
            </a>
            <a
              href="#contact"
              className="inline-flex rounded-lg border border-[#2a221a]/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:border-[#2a221a] hover:bg-[#f2eae1]"
            >
              { t("contactCta") }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
