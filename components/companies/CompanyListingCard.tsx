import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getPathname } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import type { PublicTourCard } from "@/lib/public-tour-data";

type CompanyListingCardProps = {
  experience: PublicTourCard;
};

export default function CompanyListingCard({
                                             experience,
                                           }: CompanyListingCardProps) {
  const t = useTranslations("companiesPage");
  const locale = useLocale() as AppLocale;
  const viewExperienceHref = `${ getPathname({locale, href: "/companies"}) }/${ experience.slug }`;
  const isRemoteImage = experience.heroImageSrc.startsWith("http://") || experience.heroImageSrc.startsWith("https://");

  return (
    <article className="group relative h-100 overflow-hidden rounded-[1.75rem] shadow-[0_12px_28px_-24px_rgba(0,0,0,0.9)] ring-1 ring-[#e3d8cc]">
      <a href={ viewExperienceHref } className="absolute inset-0 block">
        <Image
          src={ experience.heroImageSrc }
          alt={ experience.imageAlt }
          width={ 1200 }
          height={ 800 }
          className="h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04] group-hover:brightness-[1.03]"
          unoptimized={ isRemoteImage }
        />
      </a>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/28 to-transparent"/>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-2xl font-semibold leading-tight text-white">
          { experience.title }
        </h3>
        <a
          href={ viewExperienceHref }
          className="pointer-events-auto mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-80"
        >
          { t("actions.viewExperience") }
          <ArrowRight className="h-4 w-4"/>
        </a>
      </div>
    </article>
  );
}
