import { whyChoose } from "@/lib/landing-data";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import ElfsightReviews from "@/components/home/ElfsightReviews";

export default function WhyChoose() {
  const t = useTranslations("whyChoose");

  return (
    <section id="about" className="bg-[#f8f4ef] py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 xl:grid-cols-[1.1fr_0.9fr] lg:px-12">
        <div className="order-1 col-span-2 sm:col-span-1 text-center sm:text-left">
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { t(whyChoose.headingKey) }
          </h2>
          <p className="mt-4 text-xl font-semibold">
            { t(whyChoose.descriptionKey) }
          </p>
        </div>
        <div className="order-2 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/10 col-span-2 sm:col-span-1">
          { whyChoose.bulletKeys.map((bulletKey) => (
            <div key={ bulletKey } className="flex gap-3 text-base">
              <CheckIcon className="text-red"/>
              <p>{ t(`bullets.${bulletKey}`) }</p>
            </div>
          )) }
        </div>
        <div className="order-3 col-span-2">
          <ElfsightReviews />
        </div>
      </div>
    </section>
  );
}
