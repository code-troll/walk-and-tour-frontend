import BookTourForm from "@/components/book-tour/BookTourForm";
import { useTranslations } from "next-intl";

export default function BookTourSection() {
  const t = useTranslations("bookTourPage");

  return (
    <section className="bg-[#f8f4ef] py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-12">
        <div className="self-start lg:sticky lg:top-28">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#cf4633]">
            { t("eyebrow") }
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-[#2a221a] sm:text-5xl">
            { t("title") }
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#4a4038] sm:text-lg">
            { t("intro") }
          </p>
          <div className="mt-8 space-y-4 rounded-[2rem] bg-[#2a221a] p-6 text-[#f8f4ef] shadow-[0_18px_45px_rgba(42,34,26,0.16)]">
            <h2 className="text-xl font-semibold">
              { t("sidebar.title") }
            </h2>
            <p className="text-sm leading-7 text-[#e8ddd3] sm:text-base">
              { t("sidebar.description") }
            </p>
          </div>
        </div>

        <BookTourForm />
      </div>
    </section>
  );
}
