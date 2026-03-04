import { privateTours } from "@/lib/landing-data";
import { useTranslations } from "next-intl";

export default function PrivateTours() {
  const t = useTranslations("privateTours");

  return (
    <section id="private" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:px-12">
        <div className="order-1 flex flex-col text-center gap-4 lg:order-2">
          <h2 className="text-3xl font-semibold text-teal  sm:text-4xl">
            { t(privateTours.headingKey) }
          </h2>
          { privateTours.descriptionKeys.map((descriptionKey) => (
            <p key={ descriptionKey } className="text-xl font-semibold">
              { t(descriptionKey) }
            </p>
          )) }
          <div>
            <a
              href={ privateTours.ctaHref }
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
