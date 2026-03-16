import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import BookTourSection from "@/components/book-tour/BookTourSection";
import Footer from "@/components/layout/Footer";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  getExpectedTourTypesForCompanyTours,
  getExpectedTourTypesForPublicTours,
  listBookingOptionsSafe,
} from "@/lib/public-tour-data";

type BookTourPageProps = {
  params: Promise<{ locale: string; }>;
  searchParams: Promise<{
    bookingType?: string;
    selectedItemId?: string;
  }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: BookTourPageProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta.bookTour"});

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BookTourPage({
  params,
  searchParams: searchParamsPromise,
}: BookTourPageProps) {
  const {locale} = await params;
  const searchParams = await searchParamsPromise;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const [privateTourOptions, companyTourOptions] = await Promise.all([
    listBookingOptionsSafe({
      locale,
      tourTypes: getExpectedTourTypesForPublicTours().filter((tourType) => tourType === "private"),
    }),
    listBookingOptionsSafe({
      locale,
      tourTypes: getExpectedTourTypesForCompanyTours(),
    }),
  ]);

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <BookTourSection
        initialBookingType={ searchParams.bookingType }
        initialSelectedItemId={ searchParams.selectedItemId }
        privateTourOptions={ privateTourOptions }
        companyTourOptions={ companyTourOptions }
      />
      <Footer />
    </div>
  );
}
