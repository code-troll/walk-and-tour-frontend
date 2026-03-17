import { notFound } from "next/navigation";
import PublicTourDetailPageClient from "@/components/public/PublicTourDetailPageClient";
import { type AppLocale, routing } from "@/i18n/routing";
import {getExpectedTourTypesForPublicTours} from "@/lib/public-tour-model";

type TourDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function TourDetailPage({params}: TourDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <PublicTourDetailPageClient
      locale={ locale }
      slug={ snug }
      expectedTourTypes={ getExpectedTourTypesForPublicTours() }
      requestedBookingType="privateTours"
      showRelatedTours
    />
  );
}
