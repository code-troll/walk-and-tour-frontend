import { tours } from "@/lib/landing-data";
import { useTranslations } from "next-intl";
import TourCard from "@/components/home/TourCard";

export default function Tours() {
  const t = useTranslations("tours");

  return (
    <section id="tours" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-12">
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-3xl font-extrabold text-teal sm:text-4xl">
            { t("heading") }
          </h2>
          <p className="mx-auto text-xl font-semibold">
            { t("intro1") }
          </p>
          <p className="mx-auto text-xl font-semibold">
            { t("intro2") }
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          { tours.map((tour) => (
            <TourCard key={ tour.id } tour={ tour }/>
          )) }
        </div>
        <div className="mt-10 flex justify-center">
          <a
            href="#tours"
            className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white"
          >
            { t("exploreAll") }
          </a>
        </div>
      </div>
    </section>
  );
}
