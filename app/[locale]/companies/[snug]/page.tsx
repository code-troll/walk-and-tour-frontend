import { notFound } from "next/navigation";
import PublicTourDetailPageClient from "@/components/public/PublicTourDetailPageClient";
import { type AppLocale, routing } from "@/i18n/routing";
import {getExpectedTourTypesForCompanyTours} from "@/lib/public-tour-model";

type CompanyDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export default async function CompanyDetailPage({params}: CompanyDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <PublicTourDetailPageClient
      locale={ locale }
      slug={ snug }
      expectedTourTypes={ getExpectedTourTypesForCompanyTours() }
      hrefBasePath="/companies"
      requestedBookingType="companyTours"
    />
  );
}
