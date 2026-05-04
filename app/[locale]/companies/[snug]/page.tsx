import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicTourDetailPageClient from "@/components/public/PublicTourDetailPageClient";
import { type AppLocale, routing } from "@/i18n/routing";
import { getPublicTourDetailWithFallback, getExpectedTourTypesForCompanyTours } from "@/lib/public-tour-data";

type CompanyDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({params}: CompanyDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const result = await getPublicTourDetailWithFallback({
    expectedTourTypes: getExpectedTourTypesForCompanyTours(),
    locale,
    slug: snug,
  });

  if (!result) {
    return {};
  }

  const title = `${result.tour.title} | Walk and Tour Copenhagen`;
  const description = result.tour.aboutTourDescription;
  const images = result.tour.heroImageSrc
    ? [result.tour.heroImageSrc]
    : ["/walkandtour/branding/logo-transparent.png"];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}/companies/${snug}`,
      type: "website",
      siteName: "Walk and Tour Copenhagen",
      locale,
      images,
    },
  };
}

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
