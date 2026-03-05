import { useTranslations } from "next-intl";

import { aboutUsAdvantageIds } from "@/lib/about-us-data";

export default function AboutUsAdvantagesSection() {
  const t = useTranslations("aboutUs.advantages");

  return (
    <section className="bg-white py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
            { t("eyebrow") }
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { t("title") }
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          { aboutUsAdvantageIds.map((itemId, index) => (
            <article
              key={ itemId }
              className="rounded-3xl bg-[#fcfaf7] p-6 shadow-sm ring-1 ring-[#e8ddd2]"
            >
              <h3 className="text-lg font-semibold text-[#2a221a]">
                { index + 1 }. { t(`items.${ itemId }.title`) }
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#3d3124] md:text-base">
                { t(`items.${ itemId }.description`) }
              </p>
            </article>
          )) }
        </div>
      </div>
    </section>
  );
}
