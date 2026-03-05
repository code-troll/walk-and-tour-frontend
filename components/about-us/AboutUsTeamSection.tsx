import Image from "next/image";
import { useTranslations } from "next-intl";

import { aboutUsTeamMembers } from "@/lib/about-us-data";

export default function AboutUsTeamSection() {
  const t = useTranslations("aboutUs.team");

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <h2 className="text-center text-3xl font-semibold text-teal sm:text-4xl">
          { t("title") }
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          { aboutUsTeamMembers.map((member) => (
            <article
              key={ member.id }
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#e8ddd2]"
            >
              <Image
                src={ member.imageSrc }
                alt={ t(`items.${ member.id }.imageAlt`) }
                width={ member.imageWidth }
                height={ member.imageHeight }
                className="h-72 w-full object-cover"
              />
              <div className="p-5 text-center">
                <h3 className="text-lg font-semibold text-[#2a221a]">
                  { t(`items.${ member.id }.name`) }
                </h3>
                <p className="mt-1 text-sm text-[#5c4d3e]">
                  { t(`items.${ member.id }.role`) }
                </p>
              </div>
            </article>
          )) }
        </div>
      </div>
    </section>
  );
}
