import ElfsightReviews from "@/components/home/ElfsightReviews";
import { useTranslations } from "next-intl";

export default function AboutUsTestimonialsSection() {
  const t = useTranslations("aboutUs.testimonials");

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
            { t("eyebrow") }
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-teal sm:text-4xl">
            { t("title") }
          </h2>
        </div>
        <div className="mt-10">
          <ElfsightReviews />
        </div>
      </div>
    </section>
  );
}
