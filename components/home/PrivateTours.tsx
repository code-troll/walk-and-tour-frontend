import { privateTours } from "@/lib/landing-data";
import { useLocale, useTranslations } from "next-intl";
import { type AppLocale } from "@/i18n/routing";
import { getInternalHref } from "@/lib/internal-paths";

export default function PrivateTours() {
  const t = useTranslations("privateTours");
  const locale = useLocale() as AppLocale;

  return (
    <section id="private" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:px-12">
        <div className="order-1 flex flex-col text-center gap-4 lg:order-2">
          <h2 className="text-3xl font-semibold text-teal sm:text-4xl mb-4">
            { t(privateTours.headingKey) }
          </h2>
          { privateTours.descriptionKeys.map((descriptionKey) => (
            <p key={ descriptionKey } className="text-xl font-semibold">
              { t(descriptionKey) }
            </p>
          )) }
          <div className="mt-4">
            <a
              href={ getInternalHref({locale, target: privateTours.ctaTarget}) }
              className="inline-flex btn-red-black px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
            >
              { t(privateTours.ctaLabelKey) }
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
